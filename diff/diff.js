/**定義 diff 發現節點 patches 的種類
 0. REMOVE = 移除節點 (沒有新節點, patches 上不需要這個節點)
 1. REPLACE = 更換節點 (全新的節點替換舊節點)
 2. INSERT = 插入節點 (新增節點)
 3. UPDATE = 刷新節點 (節點 type 沒變, 屬性有變)
 4. MOVE = 移動節點 (新舊節點位子不同)
 **/

// const [REMOVE, REPLACE, INSERT, UPDATE, MOVE] = [0, 1, 2, 3, 4];
const patchesType = {
    REMOVE: 'REMOVE',
    REPLACE: 'REPLACE',
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    MOVE: 'MOVE'
};

/** 透過 index 檢查子節點差異
 若根據 index 來判定檢查會有問題
 在舊有的兩個節點中間, 插入一個新節點, 會無法覆用節點
 例如: 一個 array [div, li] => [div, p, li], 將導致 [1]&[2] 都執行 REPLACE, 無法覆用舊 li
 執行步驟等於是:
 1.先移除舊 li
 2.插入 p
 3.建立一個新 li
 4.新 li 插入到最後
 **/

function diffChildrenForIndex(oldChildren, newChildren, patches) {
    // 用來檢查舊子節點沒有, 而新子節點有的 index
    let checkIndex = 0;

    // "舊子節點" 當檢查標準開始比對
    if (oldChildren && oldChildren.length) {
        oldChildren.forEach((child, index) => {
            // 把對應的當下 index 中的新子節點丟進 diff 做比對
            diff(child, newChildren[index] || null, patches);
            // 每次都增加 checkIndex
            checkIndex++;
        });
    }

    // 處理如果 "新子節點" 有多出來, 沒比較到的節點, 最後也丟進 diff 做比對
    // 處理 type 會被判定為 INSERT (新增)
    if (newChildren && newChildren.length) {

        // while 迴圈會在 checkIndex, 追上 newChildren.length 之前不斷丟給 diff 剩餘沒比對的
        while (checkIndex < newChildren.length) {
            diff(oldChildren[checkIndex], newChildren[checkIndex], patches);
            checkIndex++;
        }
    }
}

/** 透過 key & type 檢查子節點差異 **/

function diffChildrenForKey(oldChildren, newChildren, patches) {
    // 對 newChildren 建立一個 backup 用來找 key 相同的子節點
    // 做 backup 原因是要避免影響之後掛回父節點的 newChildren
    let backupNewChildren = newChildren.slice();

    // keyMap 用來存找到帶有 key 的子節點
    let keyMap = {};

    backupNewChildren.forEach((child, index) => {
        // 取出每個 child 的 key, 沒有 key 的會拿到 undefined
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
                console.warn(`${key}必須要是唯一的`, child)
            }
        }
    })
}

/** 檢查節點上的屬性差異 **/

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

function diff(oldNode, newNode, patches = []) {
    // 若這次沒有新節點, 表示該節點沒變化
    if (!newNode) {
        // patches 紀錄不需要這個節點, 所以移除舊節點 & 它的子節點
        patches.push({type: patchesType.REMOVE, oldNode});
    }

    // 若這次沒有舊節點, 表示該節點是全新的, 紀錄上沒有
    else if (!oldNode) {
        // patches 紀錄要這個全新節點, 所以插入它 & 它的子節點
        patches.push({type: patchesType.INSERT, newNode});

        // 插入的子節點, 一樣執行 diff 檢查, 因為是全新節點, 所以 oldChildren 給 []
        diffChildrenForIndex([], newNode.children, patches);
    }

    // 若這次新舊節點都有, 但 type 不同, 表示節點 tag 改變, 需要整個更換
    else if (oldNode.type !== newNode.type) {
        // 用新節點更換舊節點
        patches.push({type: patchesType.REPLACE, oldNode, newNode});

        // tag 改變表示子節點全部都需要一同更換, 一樣執行 diff 檢查, 所以 oldChildren 給 []
        diffChildrenForIndex([], newNode.children, patches);
    }

    // 新舊節點都有, 且 type 相同, 表示只是它的屬性值有改變
    else {
        // 檢查哪個屬性是有改變的, 並記錄到 logAttributes
        let logAttributes = diffAttribute(oldNode.props, newNode.props);

        // 用新節點的屬性, 去更換舊節點的屬性
        if (Object.keys(logAttributes).length > 0) {
            patches.push({type: patchesType.UPDATE, oldNode, newNode, logAttributes});
        }

        // 剩餘相同的, 就覆用舊節點即可
        newNode.element = oldNode.element;

        // 子節點一樣執行 diff 檢查
        diffChildrenForIndex(oldNode.children, newNode.children, patches);
    }

    // 回傳整個收集完的 patches
    return patches;
}
