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

function fiberDiff(oldFiber, newFiber, callBack) {
    // 判斷是否有前一個 diff 還沒結束, 但又遇到要開始新舊的 fiberDiff 比較
    if (currentRootFiber && currentRootFiber !== newFiber) {
        // todo should add cancel diff work function
    }

    // 把 newFiber 暫存給 currentRootFiber 以便後續使用
    let currentRootFiber = newFiber;

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

//
// function createFiberLinked(parent, children) {
//     // 保存第一個子節點 (next child)
//     let firstChild;
//
//     // 取出每個子節點, 並建立鏈結指向
//     return children.map((child, index) => {
//         // 每個 child 都帶有 parentNode, 指向自己的父節點
//         child.parentNode = parent;
//         // 同時每個 child 也帶有自己在同層的中的 index
//         child.index = index;
//
//         // 若當前 firstChild 不存在, 表示第一次跑到 tree 的這層 child
//         if (!firstChild) {
//             // 父節點要保存對第一個子節點的指向
//             parent.child = child;
//         }
//
//         // 若當前 firstChild 已經存在, 表示已經跑過 tree 的同層
//         else {
//             // firstChild 保存對下一個兄弟節點指向 (由左至右)
//             firstChild.sibling = child;
//         }
//
//         firstChild = child;
//         return child;
//     })
// }

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

// function unitFiberDiffWork(oldFiberNode, newFiberNode) {
//     // 對新的節點添加一個對於舊節點的指向, 以便之後中斷跟復原做查找
//     newFiberNode.oldFiberNode = oldFiberNode;
//
//     // 將新節點當作 currentFiberNode 當下處理的節點
//     let currentFiberNode = newFiberNode;
//
//     // patches 用來保存 Diff 檢查差異的結果
//     let patches = [];
//
//     while (currentFiberNode) {
//         currentFiberNode = syncUnitFiber(currentFiberNode, patches);
//     }
//     return patches;
// }


    // patches 用來保存 Diff 檢查差異的結果
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

// function fiberDiff(oldFiber, newFiber, callBack) {
//     // 判定是否上一個 diff 還沒做完, 就又有新的 diff 進來
//     // 並把新舊 diff 做比對
//     if (currentDiffRoot && currentDiffRoot !== newFiber) {
//         // todo should add cancel function
//     }
//
//     // 紀錄當前的正在執行的 diff
//     let currentDiffRoot = newFiber;
//
//     // 讓 newFiber 保存對 oldFiber 的指向
//     newFiber.oldFiber = oldFiber;
//
//     // pointer 是當前正在做 督 的節點
//     // workLoop 透過閉包依然可以拿到它, 所以下一次 diff 可以從上次暫停點繼續
//     let pointer = newFiber;
//
//     // 紀錄每個 diff 的差異
//     let patches = [];
//
//     // workLoop 用來解析每個切片要執行的 diff 任務
//     const workLoop = () => {
//         while (pointer) {
//             // shouldYield 會在每次 diff 檢查完一個節點後 call 它
//             // 用來檢查是否有要中斷當前執行的 diff
//             // 若 shouldYield 回傳 true 表示當前能做事的時間已經沒了, 需等待下一次
//             if (shouldYield()) {
//                 // 若回傳 true 表示當前的 diff 還沒比對完, 下次從這個節點開始
//                 return true;
//             }
//             // 若時間還夠的話, 就繼續比對下一個節點的 diff
//             else {
//                 // 執行 doUnitFiber 刷新當前 diff 節點的鏈結 (下一個節點 or 兄弟節點)
//                 // 並將 pointer 刷新為 null 表示當前 diff 比對完畢
//                 pointer = doUnitFiber(pointer, patches);
//             }
//         }
//         // 做完 diff 把收集到的 patches 傳給 callBack 使用
//         callBack(patches);
//
//         // 刷新 currentDiffRoot 為 null 表示當前這段 fiber Unit 做完了
//         currentDiffRoot = null;
//         return false;
//     }
//     // scheduleWork(workLoop);
// }

// function fiberDiff(oldNode, newNode, patches) {
//     // 若當前不存在舊節點, 表示當下這個為全新的節點
//     if (!oldNode) {
//         // 把全新的節點跟它的子節點全部都插入
//         patches.push({type: patchesType.INSERT, newNode});
//     }
//     // 若當前有存在舊節點, 表示要替當下這個節點做新舊對比的屬性檢查
//     else {
//         // 檢查哪個屬性是有改變的, 並記錄到 logAttributes
//         let logAttributes = diffAttribute(oldNode.props, newNode.props);
//
//         // 用新節點的屬性, 去更換舊節點的屬性
//         if (Object.keys(logAttributes).length > 0) {
//             patches.push({type: patchesType.UPDATE, oldNode, newNode, logAttributes});
//         }
//
//         // 若舊節點與新節點 index 不符, 表示節點需要移動位子
//         if (oldNode.index !== newNode.index) {
//             patches.push({type: patchesType.MOVE, oldNode, newNode});
//         }
//         // 剩餘相同的, 就覆用舊節點即可
//         newNode.element = oldNode.element;
//
//         // 子節點一樣執行 diff 檢查
//         diffChildrenForKey(oldNode.children, newNode.children, patches);
//     }
// }
