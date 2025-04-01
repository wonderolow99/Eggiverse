document.addEventListener('DOMContentLoaded', () => {
    const draggableEggs = document.querySelectorAll('.draggable-egg');
    const outlines = document.querySelectorAll('.outline');
    const feedback = document.getElementById('feedback');
    const eggsContainer = document.querySelector('.eggs-container'); // 原始蛋的容器
    const resetButton = document.getElementById('reset-button');

    let draggedItem = null; // 用來追蹤目前正在拖曳的蛋

    // --- 拖曳事件監聽 (針對蛋) ---

    draggableEggs.forEach(egg => {
        // 開始拖曳
        egg.addEventListener('dragstart', (e) => {
            draggedItem = e.target; // 記錄被拖曳的蛋
            setTimeout(() => e.target.classList.add('dragging'), 0); // 延遲增加 class，避免閃爍
            feedback.textContent = '拿起一顆蛋...';
            // 可以設定拖曳時顯示的資料 (雖然此例中主要靠 draggedItem 變數)
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.effectAllowed = 'move'; // 允許移動操作
        });

        // 結束拖曳 (無論成功或失敗)
        egg.addEventListener('dragend', (e) => {
            // 清除拖曳狀態樣式
            e.target.classList.remove('dragging');
            draggedItem = null; // 清除記錄
             // 如果沒有成功放置，清除提示；如果成功，則由 drop 事件處理
             // (這裡可以留空或在 drop 失敗時給予提示)
        });
    });

    // --- 放置目標事件監聽 (針對輪廓) ---

    outlines.forEach(outline => {
        // 當拖曳物進入輪廓範圍
        outline.addEventListener('dragover', (e) => {
            e.preventDefault(); // 必須阻止預設行為，才能觸發 drop 事件
            if (!outline.classList.contains('matched') && !outline.contains(draggedItem)) {
                // 只有在輪廓尚未配對，且拖曳物不是已在輪廓內的蛋時，才顯示拖曳效果
                outline.classList.add('drag-over');
                e.dataTransfer.dropEffect = 'move'; // 顯示移動的游標
            } else {
                e.dataTransfer.dropEffect = 'none'; // 不允許放置
            }
        });

        // 當拖曳物離開輪廓範圍
        outline.addEventListener('dragleave', (e) => {
            outline.classList.remove('drag-over');
        });

        // 當拖曳物在輪廓範圍內被放下
        outline.addEventListener('drop', (e) => {
            e.preventDefault(); // 阻止預設行為 (例如開啟連結)
            outline.classList.remove('drag-over');

            // 檢查是否拖曳了合法的蛋，且此輪廓尚未配對
            if (draggedItem && !outline.classList.contains('matched')) {
                const draggedShape = draggedItem.dataset.shape; // 取得蛋的形狀
                const outlineShape = outline.dataset.shape; // 取得輪廓的形狀

                // 檢查形狀是否匹配
                if (draggedShape === outlineShape) {
                    // --- 配對成功 ---
                    outline.appendChild(draggedItem); // 將蛋放入輪廓中
                    draggedItem.draggable = false;    // 讓配對好的蛋不能再拖曳
                    draggedItem.style.cursor = 'default'; // 恢復預設游標
                    outline.classList.add('matched'); // 標記輪廓已配對
                    feedback.textContent = '答對了！形狀一樣耶！👍';
                    feedback.style.color = 'green';

                    // 檢查是否所有輪廓都已配對
                    checkCompletion();

                } else {
                    // --- 配對失敗 ---
                    feedback.textContent = '嗯... 這個形狀好像不太一樣喔，再試試看？🤔';
                    feedback.style.color = 'red';
                }
            }
            draggedItem = null; // 清除拖曳物記錄
        });
    });

    // --- 檢查是否完成遊戲 ---
    function checkCompletion() {
        const allMatched = Array.from(outlines).every(outline => outline.classList.contains('matched'));
        if (allMatched) {
            feedback.textContent = '太棒了！你把所有的蛋都放對位置了！🎉';
            feedback.style.color = 'blue';
        }
    }

    // --- 重置遊戲 ---
    resetButton.addEventListener('click', () => {
        // 將所有蛋移回原始容器
        draggableEggs.forEach(egg => {
            eggsContainer.appendChild(egg);
            egg.draggable = true; // 重新啟用拖曳
            egg.style.cursor = 'grab'; // 恢復拖曳游標
        });

        // 清除所有輪廓的配對狀態和樣式
        outlines.forEach(outline => {
            outline.classList.remove('matched', 'drag-over');
            // 如果蛋是直接 appendChild 到輪廓內，上面移回原始容器時就會自動清空輪廓
            // 如果有其他方式放置蛋 (如絕對定位)，需要在此處額外移除
        });

        // 清除提示訊息
        feedback.textContent = '';
        feedback.style.color = ''; // 恢復預設顏色
    });

}); // DOMContentLoaded 結束