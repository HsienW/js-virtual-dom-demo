// 設定 FTP 是 30, 就是一秒更新30 幀畫面, 也是一個 unit 最多可以做是的時間
const frameLength = 1000 / 30;

// 保存每次切片的執行時間(deadline), 每次只要執行新的切片會更新成 getCurrentTime() + frameLength
let frameDeadline;

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

    // todo 預計這個 function 會回傳 bool 判定是否鏈結都做完
    // todo 每次執行都會刷新當前的 unit 的 frameDeadline
}
