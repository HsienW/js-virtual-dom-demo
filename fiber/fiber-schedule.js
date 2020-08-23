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
    scheduledCallback = workLoop;
    // window.requestIdleCallback(onIdleFrame);
}

/** 瀏覽器畫面的刷新跟 Fiber 的關係, 希望是每隔執行一部分 Diff 工作後, 就把控制權交回給瀏覽器做　Render
 　再來我們把它分為兩種類型：
 　1. 一種是高優先級, 希望它快做完不然會影響整個 User 體驗, 例如: 動畫顯示 or User 操作行為該得到的回應
 　2. 一種是低優先級, 當瀏覽器有空閒時間再處理的任務
 　剛好原生也幫我們提供了兩個　API　requestAnimationFrame & requestIdleCallback
**/
function onAnimationFrame() {
    // 檢查當前 unit fiber diff 是否有正在執行的比較, 沒有得話就就跳出去
    if (!scheduledCallback) {
        return;
    }

    // 更新當前 diff 流程的 deadline, 保證任務有最多的 frameLength 執行時間
    frameDeadline = getCurrentTime() + frameLength;

    // todo should add do unitWorkLoop function
}
