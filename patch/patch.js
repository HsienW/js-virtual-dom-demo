/** 把找到的差異 render 到正式的 dom 上
 patch render 三大要素
 1.type = 先前在 diff 定義的種類, 這點會影響 patch 處理的先後 (重新建立 dom的優先處理)
 2.oldNode = 舊有已經存在的節點, 是已經正式 render 在畫面上的 element
 3.newNode = 新節點要畫的樣子, 還是 virtual node object, 還沒在畫面上

 執行 patch render 時的重點
 1.virtual node 的 element = 指向 virtual node 產生的真實 dom
 2.element 的初始值為 null
 3.element = 當 virtual node 與真實 dom 做為比較的引用
 4.parentNode = 當 virtual node 與真實 dom 的父節點做為比較的引用
 **/

// REPLACE & UPDATE & INSERT 三種類型的 patch 會需要重新建立 dom
// 而 virtual node render 前需要與真實 dom 比較, 所以額外建立 beforeRenderReady 來處理, 確保比較時 dom 都已被建立
const beforeRenderReady = {
    // REPLACE = 完全更換節點, 將建立的新節點, 給予 element 屬性
    REPLACE: function (oldNode, newNode) {
        newNode.element = createDOM(newNode);
    },

    // UPDATE = 節點 type 沒變但屬性有變, element 屬性可以沿用舊的, 只需要更新屬性就好
    UPDATE: function (oldNode, newNode) {
        newNode.element = oldNode.element;
    },

    // INSERT = 新增節點, 將建立的新節點, 給予 element 屬性
    INSERT: function (oldNode, newNode) {
        newNode.element = createDOM(newNode);
    }
};

// 到這個步驟時, beforeRenderReady 應該已經執行過, 所以 virtual node 的 element 該是已經被建立
const doRender = {
    // REMOVE = 移除節點, 我們在做 diff 算法時, 已經在 virtual node 上移除了
    // 所以這邊也必須對舊節點 (已經在畫面上的真實 dom) 做移除
    // parentNode (父節點的引用) 也要移除
    REMOVE: function (oldNode) {
        oldNode.parentNode.element.removeChild(oldNode.element);
    },

    // REPLACE = 完全更換節點
    // 所以必須把舊節點 (已經在畫面上的真實 dom) 換成新節點
    // parentNode (父節點的引用) 也要更換
    REPLACE: function (oldNode, newNode) {
        // 從舊節點的父節點 element 取出引用
        let parent = oldNode.parentNode.element;
        // 從舊節點自己身上 element 取出引用
        let oldElement = oldNode.element;
        // 從新節點 (virtual node) 的自己身上 element 取出新的引用
        let newElement = newNode.element;

        // 在要更換的新節點上刷新屬性
        customSetAttribute(newNode, newNode.props);
        // 在舊節點的父節點上插入新的 element
        parent.insertBefore(newElement, oldElement);
        // 接著從舊節點的父節點上移除舊的 element
        parent.removeChild(oldElement);
    },

    // UPDATE = 節點 type 沒變, 只有屬性有變
    UPDATE: function (oldNode, newNode) {
        // 只需對 newNode 刷新 diff 檢查到的屬性改變即可
        customSetAttribute(newNode, newNode.props);
    },

    // INSERT = 新增節點, 舊的完全沒有這個節點
    INSERT: function (oldNode, newNode) {
        // 對 newNode 插入屬性即可
        customSetAttribute(newNode, newNode.props);
        // 把 newNode 執行插入真實 dom
        insertDOM(newNode);
    }
}

function renderPatchToDom(patches) {
    // 先處理需要重新建立 dom 的 patch 類型
    // 需要與真實 dom 做比較, 所以使用 beforeRenderReady, 先建立 dom
    patches.forEach(patch => {
        // 取出三大要素 type, oldNode, newNode
        const {type, oldNode, newNode} = patch;
        // 透過 type 取出對應的 handler function
        let readyHandler = beforeRenderReady[type];
        readyHandler(oldNode, newNode);
    });

    // 把每個 patch 開始 render 到畫面上
    patches.forEach(patch => {
        // 取出三大要素 type, oldNode, newNode
        const {type, oldNode, newNode} = patch;
        // 透過 type 取出對應的 handler function
        let renderHandler = doRender[type];
        renderHandler(oldNode, newNode);
    });
}
