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

function fiberDiffChildren(oldChildren, newChildren, patches) {
    // 對 newChildren 建立一個 backup 用來找 key 相同的子節點
    // 做 backup 原因是要避免影響之後掛回父節點的 newChildren
    let backupNewChildren = [...newChildren];

    // keyMap 用來存放帶有 key 的子節點
    let keyMap = {};

    // 用 newChildren 來尋找新增加的子節點
    backupNewChildren.forEach((child, index) => {
        // 取出當前這個 child 的 key, 沒有 key 的話會拿到 undefined
        let {key} = child;

        // 若這個 child 帶有 key, 就進入比較環節
        if (key !== undefined) {

            // 若當下的 keyMap 中不存在這個 child 所帶有的 key, 表示是新的子節點
            if (!keyMap[key]) {
                // 對 keyMap 添加新的 virtualNode
                keyMap[key] = {
                    virtualNode: child,
                    index
                }
            }
            // 若當下的 keyMap 已經有這個 key, 就印出提示
            else {
                throw new Error(`${child} 的 ${key} 必須要是唯一的`);
            }
        }
    })

    // 在檢查 oldChildren 時, 都先比較 type & key, 若新節點中不存在 key 相同的話, 才會把舊節點存起來
    // 這裡使用 Map 來存 type, 不能用簡單的 {};

    // typeMap 用來存放帶有 type 的子節點
    let typeMap = new Map();

    // 用 oldChildren 來比對 backupNewChildren 的新節點
    oldChildren.forEach((child) => {
        // 取出當前這個 child 的 type & key
        let {type, key} = child;

        // Step1. 先找 type & key 都相同的
        // 從 keyMap 取出符合當前 child key 的 virtualNode & index
        // 這裡有找到表示 key 已是符合的
        let {virtualNode, index} = (keyMap[key] || {});

        // 若取出的 virtualNode 有值, 且 type 相等就
        // 進入比較 key 環節, 這裡有找到表示 type & key
        if (virtualNode && virtualNode.type === type) {
            // 都已比較過, type & key 都為相同, 表示可以覆用舊的
            // 對 backupNewChildren 該 index 的節點清空
            backupNewChildren[index] = null;
            // 對 keyMap 該 key 的紀錄也清空
            delete keyMap[key];
            // 對 virtualNode 保存 oldFiber 指針以便做紀錄
            virtualNode.oldFiber = child;
        }
        // 表示其餘 oldChildren 的 type 相同, 但 key 不同的子節點, 用 typeMap 存起來跟剩下的新節點做比較
        else {
            // 若 typeMap 中不存在這個 type, 將他儲存起來, 表示為新增的
            if (!typeMap.has(type)) {
                typeMap.set(type, []);
            }

            // 若 typeMap 中已經有這個 type, 向它 push 這個的 child, 刷新它
            typeMap.get(type).push(child);
        }
    })


    // backupNewChildren 剩下的節點一一與 typeMap 做比較
    for (let i = 0; i < backupNewChildren.length; i++) {

        // 取出當前的節點
        let currentNode = backupNewChildren[i];

        // 若當前節點不存在, 表示在前面時已經被比較過, 所以被清空了
        if (!currentNode) {
            continue // 終止這次
        }

        // 從 typeMap 中拿取當前的 currentNode
        let nodeArray = typeMap.has(currentNode.type) && typeMap.get(currentNode.type) || [];

        // 若 nodeArray 拿的到值, 表示為新增的
        if (nodeArray.length) {
            // 取出自己 (typeMap 中的自己), 並且掛上去 oldFiber, 當成下次比對 diff 的舊節點
            let oldNode = nodeArray.shift();
            currentNode.oldFiber = oldNode;
        }
        // 若 nodeArray 拿不到值, 表示為比較過了, 直接清空
        else {
            currentNode.oldFiber = null;
        }
    }

    // 剩下沒用到的舊節點, 就把它移除
    typeMap.forEach((nodeArray, type) => {
        nodeArray.forEach((old) => {
            patches.push({type: patchesType.REMOVE, oldNode: old});
        })
    })
}

function unitFiberDiffWork(fiberNode, patches) {
    // 取出 oldFiber
    let oldFiber = fiberNode.oldFiberNode;

    // 取出 oldFiber 的子節點們, 若沒有就給空 Array
    let oldChildren
    if (oldFiber.children) {
        oldChildren = oldFiber.children;
    } else {
        oldChildren = [];
    }

    // 一樣是比對當前新舊節點的差異
    fiberDiffParent(oldFiber, fiberNode, patches);
    //
    // // 比對前新舊子節點的差異
    fiberDiffChildren(oldChildren, fiberNode.children, patches);
    //
    if (fiberNode.children) {
        return fiberNode.children;
    }

    while (fiberNode) {
        // 如果沒有子節點, 但有兄弟節點時, 繼續檢查兄弟節點
        if (fiberNode.sibling) {
            return fiberNode.sibling;
        }
        // 當子節點 & 兄弟節點都檢查完之後, 回到父節點
        fiberNode = fiberNode.parent;

        if (!fiberNode) {
            return null;
        }
    }
    return null;
}

function fiberDiffAttribute(oldAttributes, newAttributes) {
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

function fiberDiffParent(oldNode, newNode, patches) {
    if (!oldNode) {
        // 若這次沒有舊節點, 表示該節點是全新的, 紀錄上沒有
        // patches 紀錄要這個全新節點, 所以插入它 & 它的子節點
        patches.push({type: patchesType.INSERT, newNode});
    } else {

        // 整個節點 type 不同表示需要全部更新, 用新節點更換舊節點
        if (oldNode.type !== newNode.type) {
            patches.push({type: patchesType.REPLACE, oldNode, newNode});
        }

        // 節點 type 相同, 表示需要檢查有哪些可以複用
        if(oldNode.type === newNode.type)  {

            let logAttributes = fiberDiffAttribute(oldNode.props, newNode.props);
        }
    }
}
