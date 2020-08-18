/** 把 virtual node 結構的修改成 fiber

 舊有的 diff 到 patch 到最後 render 出來是採用遞迴的方式, 產生的效能問題是
 一旦 dom tree 非常大時, 無法算到一半中斷接著再繼續, 每次都要一口氣做完, 會導致 render 感覺上會卡住, fiber 就是為了解決這個問題

 fiber 本質是個深度優先的 tree 鏈結, 每個節點都具有 4個屬性
 1. parent = 指向上一個節點
 2. current = 指的是自己 (一般不會特別寫出來)
 3. child = 指向下一個節點 (第一個子節點)
 4. sibling = 指向自己右邊的第一個節點 (同層的兄弟節點)

 基於這 4個屬性, 可以把遞迴結構修改成循環結構, 可以中斷又復原
 **/


// 設定 FTP 是 30, 就是一秒更新30 幀
 const frameLength = 1000 / 30;

// 保存每次切片的執行時間(deadline), 每次只要執行新的切片會更新成 getCurrentTime() + frameLength
let frameDeadline;

// 拿取當前時間
function getCurrentTime() {
    return new Date();
}
// 用來判定 fiber 在什麼時候被暫停
function shouldYield() {
    return getCurrentTime() > frameDeadline;
}

function createFiberNode(type, props = {}, children = []) {
    // 保存每個 node 的 key
    let key = props.key;

    // 保存第一個子節點 (next child)
    let firstChild;

    // 已經取出另存為 key 到 virtual node 上, 可從 props 移除
    delete props.key;

    // 建立 virtual node object (父節點)
    let virtualNode = {
        type,
        props,
        key,
        element: null
    };

    // 替 virtual node object 增加 children 屬性, 從傳入的 children 而來
    virtualNode.children = children.map((child, index) => {

        // 若當前的 child 沒有 type, 通常為 string
        if (!child.type) {

            // 對這個 child 增加 type & props 等等...屬性, 並把它歸類為 string 的 child
            child = {
                type: TEXT_NODE,
                props: {
                    value: child
                },
                children: []
            }
        }

        child.index = index;

        // 讓每個 child 都帶有 parentNode, 可以存取自己的父層
        child.parentNode = virtualNode;

        // 若當前 firstChild 不存在, 表示第一次跑到 tree 的這層 child
        if (!firstChild) {
            // 父節點要保存對第一個子節點的指向
            virtualNode.child = child;
        }
        // 若當前 firstChild 已經存在, 表示已經跑過 tree 的同層
        else {
            // firstChild 保存對下一個兄弟節點指向 (由左至右)
            firstChild.sibling = child;
        }

        firstChild = child;
        return child;
    })

    return virtualNode;
}

function createFiberVirtualRoot(data) {
    let childrenData = data.children.map(item => {
        return createFiberNode(
            item.type,
            item.props,
            [item]
        )
    });

    let rootData = createFiberNode(
        data.type,
        data.props,
        childrenData
    );

    return rootData;
}

/** 用來把之前產出的 fiber virtual node object 轉換為真實的 dom 並掛上 **/

// 這邊會使用遞迴的方式執行轉換, 因為 node 結構為 tree, 適合使用
// 要掛上子節點前需要先生成父節點 (使用先序)

function fiberVirtualNodeToDOM(rootNode, parentDOM) {
    // 對傳入的 root node 取出屬性
    let {type, props, children} = rootNode;

    // 當前的 virtual node render 成對應的 dom (後面要掛入的 root dom)
    let dom;

    // 若 rootNode type 為 string, 直接對 dom 掛上當前的 text node
    if (isTextNode(type)) {
        dom = document.createTextNode(rootNode.props.nodeValue);
    }
    // 若 rootNode type 為其他, 就先處理 rootNode 的每個 props, 在掛上 element
    else {
        dom = document.createElement(type);

        // 透過迴圈對 element 掛上對應的屬性
        for (let key in props) {
            customSetAttribute(dom, key, props[key]);
        }
    }

    // 使用遞迴方式處理 rootNode 的 children, 一併掛上 dom
    if (Array.isArray(children)) {
        children.forEach((child) => {
            fiberVirtualNodeToDOM(child, dom);
        });
    }

    // 若這次處理有 parentDOM 就表示該次的 dom 需要掛入到父層節點之下
    if (parentDOM) {
        parentDOM.appendChild(dom);
    }

    // 最後對 rootNode 的 element 加上, 對於這次完整產出的 dom 的引用
    rootNode.element = dom;

    return dom;
}
