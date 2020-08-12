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

function renderNodeChildren(node) {
    // 取出當前 node 的實例
    let instance = node.instance;
    // 這邊確認實例的 render 都是回傳單個節點
    let child = instance.render();
    // 將 render 回傳節點的屬性透過 fiber 再次更新
    node.children = createFiberLinked(node, [child]);
    // 最後 child 保存父節點的 index
    child.index = node.index;
}

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

    // 若這次的 fiberDiff 不存在 oldNode, 表示為全新的節點, 把它與它的子節點全部插入
    if (!oldNode) {

        // 判定當前的 newNode.type 是否為該節點的 constructor function
        if (typeof newNode.type === 'function') {
            // 取出 constructor function
            let component = newNode.type;
            // 建立節點的實例物件
            let instance = new component();

            // 實例物件保存對自己的 virtualNode 指向
            instance.virtualNode = newNode;
            // virtualNode 也保存對實例物件的指向
            newNode.instance = instance;
            // 最後 render 它的子節點
            renderNodeChildren(newNode);
        }
        patches.push({type: patchesType.INSERT, newNode})
    } 
    
    else {}
}
