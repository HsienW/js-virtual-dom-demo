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

function diffChildrenForKey(oldChildren, newChildren, patches) {

    if (newChildren === undefined || oldChildren === undefined) {
        return;
    }

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

    // typeMap 用來存放帶有 type 的子節點
    let typeMap = {};

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
            // 最後把當前的 child & 暫存的 virtualNode 丟入 diff
            // 用遞迴的方式檢查它的屬性 & 子節點是否有變
            diff(child, virtualNode, patches);
        }
        // Step2. 表示其餘 oldChildren 的 type 相同, 但 key 不同的子節點, 用 typeMap 存起來跟剩下的新節點做比較
        else {
            // 若是 typeMap 中不存在這個 type, 就把它清空 ex: li
            if (!typeMap[type]) {
                typeMap[type] = [];
            }
            // 若是 typeMap 中已經有這個 type 了, 就先全部收集起來 ex: li
            typeMap[type].push(child);
        }
    })

    // Step3. backupNewChildren 剩下的節點一一與 typeMap 做比較
    for (let i = 0; i < backupNewChildren.length; i++) {

        // 取出當前的節點
        let currentNode = backupNewChildren[i];

        // 若當前節點不存在, 表示在前面時已經被比較過, 所以被清空了
        if (!currentNode) {
            continue // 終止這次
        }

        // 若當前節點的 type 還有存在於 typeMap 中, 表示
        if (typeMap[currentNode.type] && typeMap[currentNode.type].length) {

            // 比對到這個步驟時, typeMap 中同樣的 currentNode.type 的最多就會是2個節點,
            let oldNode = typeMap[currentNode.type].shift();
            diff(oldNode, currentNode, patches);
        } else {
            diff(null, currentNode, patches);
        }
    }

    // 剩下沒用到的舊節點, 就把它移除
    Object.keys(typeMap).forEach(type => {
        // 從 typeMap 中取出剩下的節點
        let oldNodes = typeMap[type];

        // 給與 diff 新節點為空, 表示可以移除
        oldNodes.forEach((node) => {
            diff(node, null, patches);
        })
    })
}

function createFiberLinked(parent, children) {
    // 保存第一個子節點 (next child)
    let firstChild;

    // 取出每個子節點, 並建立鏈結指向
    return children.map((child, index) => {
        // 每個 child 都帶有 parentNode, 指向自己的父節點
        child.parentNode = parent;
        // 同時每個 child 也帶有自己在同層的中的 index
        child.index = index;

        // 若當前 firstChild 不存在, 表示第一次跑到 tree 的這層 child
        if (!firstChild) {
            // 父節點要保存對第一個子節點的指向
            parent.child = child;
        }

        // 若當前 firstChild 已經存在, 表示已經跑過 tree 的同層
        else {
            // firstChild 保存對下一個兄弟節點指向 (由左至右)
            firstChild.sibling = child;
        }

        firstChild = child;
        return child;
    })
}

// function renderNodeChildren(node) {
//     // 取出當前 node 的實例
//     let instance = node.instance;
//     // 這邊確認實例的 render 都是回傳單個節點
//     let child = instance.render();
//     // 將 render 回傳節點的屬性透過 fiber 再次更新
//     node.children = createFiberLinked(node, [child]);
//     // 最後 child 保存父節點的 index
//     child.index = node.index;
// }

function fiberDiffSync(oldFiberNode, newFiberNode) {
    // 對新的節點添加一個對於舊節點的指向, 以便之後中斷跟復原做查找
    newFiberNode.oldFiberNode = oldFiberNode;

    // 將新節點當作 currentFiberNode 當下處理的節點
    let currentFiberNode = newFiberNode;

    // patches 用來保存 Diff 檢查差異的結果
    let patches = [];

    while (currentFiberNode) {
        currentFiberNode = syncUnitFiber(currentFiberNode, patches);
    }
    return patches;
}

function syncUnitFiber(fiberNode, patches) {
    let oldFiber = fiberNode.oldFiberNode;
    let oldChildren = oldFiber.children || [];

    // 一樣是比對當前新舊節點的差異
    fiberDiff(oldFiber, fiberNode, patches);
}

function fiberDiff(oldNode, newNode, patches) {
    // 若當前不存在舊節點, 表示當下這個為全新的節點
    if (!oldNode) {
        // 把全新的節點跟它的子節點全部都插入
        patches.push({type: patchesType.INSERT, newNode});
    }
    // 若當前有存在舊節點, 表示要替當下這個節點做新舊對比的屬性檢查
    else {
        // 檢查哪個屬性是有改變的, 並記錄到 logAttributes
        let logAttributes = diffAttribute(oldNode.props, newNode.props);

        // 用新節點的屬性, 去更換舊節點的屬性
        if (Object.keys(logAttributes).length > 0) {
            patches.push({type: patchesType.UPDATE, oldNode, newNode, logAttributes})
        }

        // 若舊節點與新節點 index 不符, 表示節點需要移動位子
        if (oldNode.index !== newNode.index) {
            patches.push({type: patchesType.MOVE, oldNode, newNode})
        }
        // 剩餘相同的, 就覆用舊節點即可
        newNode.element = oldNode.element;

        // 子節點一樣執行 diff 檢查
        diffChildrenForKey(oldNode.children, newNode.children, patches);
    }
}
