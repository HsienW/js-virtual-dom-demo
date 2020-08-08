// function renderNodeChildren(node) {
//     // 取出當前 node 的實例
//     let instance = node.instance;
//     // 這邊固定實例的 render 都是回傳單個節點
//     let child = instance.render();
//     // 將 render 回傳節點的屬性透過 fiber 再次更新
//     node.children = bindFiber(node, [child])
//     // 最後 child 保存父節點的 index
//     child.index = node.index
// }

function fiberDiffSync(oldFiberNode, newFiberNode) {
    // 對新的節點添加一個對於舊節點的指向, 以便之後中斷跟復原做查找
    newFiberNode.oldFiberNode = oldFiberNode;

    // 將新節點當作 currentFiberNode 當下處理的
    let currentFiberNode = newFiberNode;

    // 保存 Diff 檢查差異的結果
    let patches = [];

    while (currentFiberNode) {
        currentFiberNode = performUnitWork(currentFiberNode, patches);
    }
    return patches;
}

function performUnitWork(fiberNode, patches) {
    let oldFiber = fiberNode.oldFiberNode;
    let oldChildren = oldFiber.children || [];

    // 一樣是比對當前新舊節點的差異
    fiberDiff(oldFiber, fiberNode, patches);
}

function fiberDiff(oldNode, newNode, patches) {
    // todo should add fiberDiff
}
