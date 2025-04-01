document.addEventListener('DOMContentLoaded', () => {
    const draggableEggs = document.querySelectorAll('.draggable-egg');
    const outlines = document.querySelectorAll('.outline');
    const feedback = document.getElementById('feedback');
    const eggsContainer = document.querySelector('.eggs-container');
    const resetButton = document.getElementById('reset-button');

    let draggedItem = null;      // 追蹤目前拖曳/觸控的蛋
    let currentOverOutline = null; // 追蹤觸控時手指目前在哪個輪廓上
    let touchStartX = 0;         // 觸控起始 X 座標 (用於計算位移)
    let touchStartY = 0;         // 觸控起始 Y 座標 (用於計算位移)
    let initialOffsetX = 0;      // 觸控點相對於蛋左上角的偏移 X
    let initialOffsetY = 0;      // 觸控點相對於蛋左上角的偏移 Y

    // --- Helper Function: 取得觸控點對應的輪廓 ---
    function getOutlineFromPoint(x, y) {
        // 暫時隱藏正在拖曳的元素，避免 elementFromPoint 選到自己
        if (draggedItem) draggedItem.style.visibility = 'hidden';
        let element = document.elementFromPoint(x, y);
        if (draggedItem) draggedItem.style.visibility = 'visible'; // 恢復顯示

        if (!element) return null;
        return element.closest('.outline'); // 向上查找最近的 .outline 父元素
    }

    // --- Helper Function: 處理配對邏輯 ---
    function handleDrop(targetOutline) {
        if (draggedItem && targetOutline && !targetOutline.classList.contains('matched')) {
            const draggedShape = draggedItem.dataset.shape;
            const outlineShape = targetOutline.dataset.shape;

            if (draggedShape === outlineShape) {
                // --- 配對成功 ---
                targetOutline.appendChild(draggedItem); // 將蛋放入輪廓
                draggedItem.draggable = false;       // 禁用滑鼠拖曳
                // 觸控的 "draggable" 透過移除事件監聽器來實現 (見 touchend)
                draggedItem.style.cursor = 'default';
                // 清除觸控時可能添加的樣式
                draggedItem.style.position = '';
                draggedItem.style.left = '';
                draggedItem.style.top = '';
                draggedItem.style.zIndex = '';
                draggedItem.style.pointerEvents = '';

                targetOutline.classList.add('matched');
                feedback.textContent = '答對了！形狀一樣耶！👍';
                feedback.style.color = 'green';
                checkCompletion();
                return true; // 表示成功放置
            } else {
                // --- 配對失敗 ---
                feedback.textContent = '嗯... 這個形狀好像不太一樣喔，再試試看？🤔';
                feedback.style.color = 'red';
            }
        }
        // 如果配對失敗或目標無效，也要清除觸控樣式
        if (draggedItem) {
            draggedItem.style.position = '';
            draggedItem.style.left = '';
            draggedItem.style.top = '';
            draggedItem.style.zIndex = '';
             draggedItem.style.pointerEvents = '';
        }
        return false; // 表示未成功放置
    }

    // --- 滑鼠拖曳事件監聽 (保持不變，但 drop 邏輯移到 helper) ---
    draggableEggs.forEach(egg => {
        egg.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            // 使用 requestAnimationFrame 或 setTimeout 確保樣式立即應用
            requestAnimationFrame(() => {
                 e.target.classList.add('dragging');
            });
            feedback.textContent = '拿起一顆蛋...';
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        egg.addEventListener('dragend', (e) => {
            requestAnimationFrame(() => {
                 // dragend 可能在 drop 後觸發，確保樣式被移除
                 if(e.target.classList.contains('dragging')) {
                     e.target.classList.remove('dragging');
                 }
            });
            draggedItem = null;
            // 清除可能殘留的 drag-over 狀態
             if (currentOverOutline) {
                currentOverOutline.classList.remove('drag-over');
                currentOverOutline = null;
            }
        });
    });

    outlines.forEach(outline => {
        outline.addEventListener('dragover', (e) => {
            e.preventDefault();
            currentOverOutline = outline; // 記錄滑鼠在哪個輪廓上
            if (!outline.classList.contains('matched') && !outline.contains(draggedItem)) {
                outline.classList.add('drag-over');
                e.dataTransfer.dropEffect = 'move';
            } else {
                e.dataTransfer.dropEffect = 'none';
            }
        });

        outline.addEventListener('dragleave', (e) => {
            // 檢查是否真的離開了 outline，而不是進入了裡面的子元素
             if (e.relatedTarget && !outline.contains(e.relatedTarget)) {
                outline.classList.remove('drag-over');
                if (currentOverOutline === outline) {
                    currentOverOutline = null;
                }
            } else if (!e.relatedTarget) { // 滑鼠移出視窗
                 outline.classList.remove('drag-over');
                 if (currentOverOutline === outline) {
                    currentOverOutline = null;
                }
            }
        });

        outline.addEventListener('drop', (e) => {
            e.preventDefault();
            outline.classList.remove('drag-over');
            handleDrop(outline); // 使用 helper 函數處理配對
            draggedItem = null; // drop 後清除
            currentOverOutline = null;
        });
    });


    // --- 觸控事件監聽 ---
    draggableEggs.forEach(egg => {
        egg.addEventListener('touchstart', (e) => {
            // 如果蛋已經配對成功 (被移動到 outline 裡)，就不再響應觸控
            if (egg.closest('.outline.matched')) {
                return;
            }
            // 防止多指觸控或已經在拖曳其他東西
            if (draggedItem) return;

            draggedItem = e.target;
            feedback.textContent = '拿起一顆蛋...';

            // --- 計算觸控點相對偏移和初始位置 ---
            const rect = draggedItem.getBoundingClientRect();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            initialOffsetX = touchStartX - rect.left;
            initialOffsetY = touchStartY - rect.top;

            // --- 設定拖曳時的視覺樣式 ---
            requestAnimationFrame(() => {
                draggedItem.classList.add('dragging'); // 應用半透明等效果
                draggedItem.style.position = 'fixed'; // 使用 fixed 或 absolute 定位來移動
                draggedItem.style.zIndex = '1000';      // 確保在最上層
                draggedItem.style.pointerEvents = 'none'; // 讓 touchmove 的 elementFromPoint 能穿透
                // 立即將元素移動到觸控點下方 (考慮偏移)
                draggedItem.style.left = `${touchStartX - initialOffsetX}px`;
                draggedItem.style.top = `${touchStartY - initialOffsetY}px`;
            });

             // 阻止頁面滾動等預設行為
             // 注意：passive: false 必須明確設置才能阻止滾動
        }, { passive: false });

         // 注意：touchmove 和 touchend 最好綁定在 document 上
         // 這樣即使手指移出元素範圍，事件也能被捕捉到
    });

    document.addEventListener('touchmove', (e) => {
        if (!draggedItem) return;

        // 阻止滾動
        e.preventDefault();

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;

        // --- 更新蛋的視覺位置 ---
        requestAnimationFrame(() => {
            if(draggedItem) { // 再次檢查，因為可能是非同步
                draggedItem.style.left = `${touchX - initialOffsetX}px`;
                draggedItem.style.top = `${touchY - initialOffsetY}px`;
            }
        });


        // --- 檢查手指下方的元素 ---
        const targetOutline = getOutlineFromPoint(touchX, touchY);

        // --- 更新輪廓的 drag-over 樣式 ---
        if (currentOverOutline && currentOverOutline !== targetOutline) {
            currentOverOutline.classList.remove('drag-over'); // 離開舊輪廓
        }
        if (targetOutline && targetOutline !== currentOverOutline && !targetOutline.classList.contains('matched')) {
            targetOutline.classList.add('drag-over'); // 進入新輪廓
        }
        currentOverOutline = targetOutline; // 更新當前輪廓

    }, { passive: false }); // 阻止滾動需要 passive: false

    document.addEventListener('touchend', (e) => {
        if (!draggedItem) return;

        // e.preventDefault(); // touchend 通常不需要 preventDefault

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        // --- 移除拖曳樣式 ---
        draggedItem.classList.remove('dragging');
        // 在 handleDrop 之前移除 pointerEvents，讓其恢復正常
        draggedItem.style.pointerEvents = '';

        // --- 找到最終的放置目標 ---
        const finalOutline = getOutlineFromPoint(touchEndX, touchEndY);

        // 清除 drag-over 樣式
        if (currentOverOutline) {
            currentOverOutline.classList.remove('drag-over');
        }

        // --- 嘗試放置並處理配對 ---
        const droppedSuccessfully = handleDrop(finalOutline);

         // --- 清理工作 ---
        // 如果沒有成功放置，需要將元素移回原容器 (由 reset 按鈕處理比較簡單，這裡先清除樣式即可)
        if (!droppedSuccessfully && draggedItem) {
             draggedItem.style.position = '';
             draggedItem.style.left = '';
             draggedItem.style.top = '';
             draggedItem.style.zIndex = '';
        }

        // 重置狀態變數
        draggedItem = null;
        currentOverOutline = null;
        touchStartX = 0;
        touchStartY = 0;
        initialOffsetX = 0;
        initialOffsetY = 0;
    });


    // --- 檢查是否完成遊戲 (不變) ---
    function checkCompletion() {
        const allMatched = Array.from(outlines).every(outline => outline.classList.contains('matched'));
        if (allMatched) {
            feedback.textContent = '太棒了！你把所有的蛋都放對位置了！🎉';
            feedback.style.color = 'blue';
        }
    }

    // --- 重置遊戲 (需要確保清除觸控添加的樣式) ---
    resetButton.addEventListener('click', () => {
        draggableEggs.forEach(egg => {
            eggsContainer.appendChild(egg);
            egg.draggable = true; // 恢復滑鼠拖曳
            egg.style.cursor = 'grab';
            // 清除觸控可能添加的樣式
            egg.style.position = '';
            egg.style.left = '';
            egg.style.top = '';
            egg.style.zIndex = '';
            egg.style.visibility = 'visible';
            egg.style.pointerEvents = ''; // 確保 pointer-events 恢復
            egg.classList.remove('dragging'); // 以防萬一
        });

        outlines.forEach(outline => {
            outline.classList.remove('matched', 'drag-over');
            // 移除可能存在的已放置的蛋 (appendChild 會自動處理)
            // 但如果之前用了其他方式，需要手動清空
             const placedEgg = outline.querySelector('.draggable-egg');
             if(placedEgg) {
                 // 通常 reset 時會被上面的 appendChild 移走，但以防萬一
                 // outline.removeChild(placedEgg); // 這行通常不需要
             }
        });

        feedback.textContent = '';
        feedback.style.color = '';
        draggedItem = null; // 清除狀態
        currentOverOutline = null;
    });

}); // DOMContentLoaded 結束