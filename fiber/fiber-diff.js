/**定義 diff 發現節點 patches 的種類
 0. REMOVE = 移除節點 (沒有新節點, patches 上不需要這個節點)
 1. REPLACE = 更換節點 (全新的節點替換舊節點)
 2. INSERT = 插入節點 (新增節點)
 3. UPDATE = 刷新節點 (節點 type 沒變, 屬性有變)
 4. MOVE = 移動節點 (新舊節點位子不同)
 **/

const patchesType = {
    REMOVE: 'REMOVE',
    REPLACE: 'REPLACE',
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    MOVE: 'MOVE'
};

function diffAttribute(oldAttributes, newAttributes) {
    // logAttributes object 用來記錄差異
    let logAttributes = {};

    // 檢查舊屬性 & 新屬性的差異

    // "舊屬性" 當檢查標準開始比對
    for (let key in oldAttributes) {
        // 若找到 key 是舊屬性沒有, 但新屬性有的(表示為新增的), 記錄到 logAttributes
        if (oldAttributes[key] !== newAttributes[key]) {
            // 可時候會是 null or undefined
            logAttributes[key] = newAttributes[key];
        }
    }

    // "新屬性" 當檢查標準開始比對
    for (let key in newAttributes) {
        // 若找到 key 是舊屬性有, 但新屬性沒有的(表示為移除的), 記錄到 logAttributes
        if (!oldAttributes.hasOwnProperty(key)) {
            logAttributes[key] = newAttributes[key];
        }
    }

    // 回傳整個屬性的 log
    return logAttributes;
}

let currentRootFiber;
function fiberDiff(oldFiber, newFiber, callBack) {
    // 判斷是否有前一個 diff 還沒結束, 但又遇到要開始新舊的 fiberDiff 比較
    if (currentRootFiber && currentRootFiber !== newFiber) {
        cancelWork();
    }

    // todo have fix this issue "fiberDiff" function return undefined
    // 把 newFiber 暫存給 currentRootFiber 以便後續使用
    currentRootFiber = newFiber;

    // 對 newFiber 新增一個 oldFiber 的指向以便後續使用
    newFiber.oldFiberNode = oldFiber;

    // 把 newFiber 暫存給當作指針的 pointer
    let pointer = newFiber;

    // 收集這次 fiberDiff 比對到的差異
    let patches = [];

    // unitWorkLoop 用來辨別每次 unit diff 執行任務時的狀態是否有做完
    const unitWorkLoop = () => {
        // 目前在做 fiberDiff 比較節點的指針, unitWorkLoop 因為閉包的關係可以拿到 pointer, 以便下次可以從上一個暫停點繼續
        while (pointer) {
            // 每個 diff 比較完後都會 call shouldYield 一次, 用來辨別是否需要暫停
            // 若 shouldYield 回傳的是有值的表示, 當前可以執行的時間已經沒了
            if (shouldYield()) {
                // 回傳 true 表示當前的 unit diff 還沒執行完
                return true;
            }
            // 表示當前的執行時間還夠, 可以繼續執行下一個 unit diff 的比較
            else {
                pointer = unitFiberDiffWork(pointer, patches);
            }
        }
        // diff 全部比較完之後, 可以使用 patches
        callBack(patches);
        // 重置 currentRootFiber 為空, 表示 fiberDiff 完成
        currentRootFiber = null;
        // 回傳 false 讓 scheduleWork 收到判定是還沒完成
        return false;
    }
    // 把 fiberDiff 拆分成 unit, 並且等待 patches 收集完畢
    scheduleWork(unitWorkLoop);
}

let patches = [];
function unitFiberDiffWork(fiberNode, patches) {
    // 取出 oldFiber
    let oldFiber = fiberNode.oldFiberNode;
    // 取出 oldFiber 的子節點們, 若沒有就給空 Array
    let oldChildren = oldFiber.children || [];

    // 一樣是比對當前新舊節點的差異
    // fiberDiff(oldFiber, fiberNode, patches);
    fiberDiff(oldFiber, fiberNode, patches);

    // return null;
}
