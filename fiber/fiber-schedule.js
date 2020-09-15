// 設定 FTP 是 30, 就是一秒更新30 幀畫面, 也是一個 unit 最多可以做是的時間
const frameLength = 1000 / 30;

// 保存每次 unit 的執行時間(deadline), 每次只要執行新的 unit 會更新成 getCurrentTime() + frameLength
let frameDeadline;

// 保存每次當前正在執行的 Unit Fiber Diff
let scheduledCallback;

// 拿取當前時間
function getCurrentTime() {
    return new Date();
}

// 用來判定 fiber 在什麼時候被暫停
function shouldYield() {
    return getCurrentTime() > frameDeadline;
}

// 透過傳給它的 workLoop (Unit) 來判定當前的這個鏈結是否執行完成
function scheduleWork(workLoop) {
    // scheduledCallback 用來存當前的做的事情 Loop
    scheduledCallback = workLoop;
    // window.requestIdleCallback(onIdleFrame);
}

/** 瀏覽器畫面的刷新跟 Fiber 的關係, 希望是每隔執行一部分 Diff 工作後, 就把控制權交回給瀏覽器做　Render
 　再來我們把它分為兩種類型：
 　1. 高優先級, 希望它快做完不然會影響整個 User 體驗, 例如: 動畫顯示 or User 操作行為該得到的回應
 　2. 低優先級, 當瀏覽器有空閒時間再處理的任務
 　剛好原生也幫我們提供了兩個　API　requestAnimationFrame & requestIdleCallback
 **/
function onAnimationFrame() {
    // 檢查當前 unit fiber diff 是否有正在執行的比較, 沒有得話就就跳出去
    if (!scheduledCallback) {
        return;
    }

    // 更新當前 diff 流程的 deadline, 保證任務有最多的 frameLength 執行時間
    frameDeadline = getCurrentTime() + frameLength;

    const hasMoreWork = scheduledCallback();
    // 根據 scheduledCallback (workLoop) return (由 shouldYield 回傳來的) 判斷當前的 diff 是否做完了
    // 如果還沒做完
    if (hasMoreWork) {
        // 當 tag 被切到後台, requestAnimationFrame 會被暫停, 也將導致整個 diff 暫停, 先用計時器來處理
        // 如果 onAnimationFrame 在 frameLength 兩倍的時間後, 仍然沒被執行, 就通過繼續 call requestAnimationFrame
        let rafTimeoutID = setTimeout(() => {
            onAnimationFrame()
        }, frameLength * 2);

        // 對 requestAnimationFrame 綁上 callBack (onAnimationFrame)
        // 用於下一幀更新 frameDeadline, 以維持整個 diff 比較任務直到完成
        // workLoop 通過閉包維持住, 可以拿到對 pointer 當前歷遍指針的引用, 因此可以直接從上次的暫停點繼續執行 diff 任務
        requestAnimationFrame(nextRAFTime => {
            clearTimeout(rafTimeoutID)
            onAnimationFrame();
        });


    } else {
        // 如果做完了這次就把 scheduledCallback 清空
        scheduledCallback = null;
    }
}

// 使用 requestIdleCallback 讓瀏覽器在空閒時間, 執行低優先級的工作, 就不會影響重要事件
// deadline 的 timeRemaining 用來控制每次佔用的時間長度
function onIdleFrame(deadline) {

    // 檢查上一個任務是否還沒做完, 若已經為空表示都做完了, 不需再跑
    if (!scheduledCallback) {
        return;
    }

    // 取出當前這幀剩下可用的空閒時間
    let remain = deadline.timeRemaining();

    // 透過 frameDeadline 來限制當前這個 unit 執行的 deadline
    frameDeadline = getCurrentTime() + Math.min(remain, frameLength);

    // 檢查上一個任務是否還沒做完
    const hasMoreWork = scheduledCallback();

    // 若 hasMoreWork 回傳 ture, 表示還有 diff 任務沒完成, 繼續 call onIdleFrame 執行任務
    if (hasMoreWork) {
        requestIdleCallback(onIdleFrame, {timeout: frameLength});
    } else {
        // 如果做完了這次就把 scheduledCallback 清空
        scheduledCallback = null;
    }
}

function cancelWork() {
    scheduledCallback = null;
}
