/** 一個 virtual dom 下的 node 展開後, 類似下面這個 element demo object **/

let nodeElement = {
    type: 'ul',  // Node 標籤名
    props: {  // DOM 的屬性, 用一個 object 其他屬性
        key: 'key-1',
        class: 'list',
    },
    children: [  // Node 的子節點
        {
            type: 'li',
            props: {
                key: 'li-1',
                class: 'li-1',
                value: 'I am li-1'
            }
        }
    ]
};

/** 用來建立 virtual node 結構的 object **/

function createVirtualNode(type, props = {}, children = []) {

    // 保存每個 node 的 key
    let key = props.key;

    // 已經取出另存為 key 到 virtual node 上, 可從 props 移除
    delete props.key;

    // 建立 virtual node object (父節點)
    let virtualNode = {
        type,
        props,
        key,
        element: null,
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

        return child;
    })

    return virtualNode;
}

/** 用來把之前產出的 virtual node object 轉換為真實的 dom 並掛上 **/

// 這邊會使用遞迴的方式執行轉換, 因為 node 結構為 tree, 適合使用
// 要掛上子節點前需要先生成父節點 (使用先序)

function virtualNodeToDOM(rootNode, parentDOM) {

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
        console.log(type);
        dom = document.createElement(type);

        // 透過迴圈對 element 掛上對應的屬性
        for (let key in props) {
            customSetAttribute(dom, key, props[key]);
        }
    }

    // 使用遞迴方式處理 rootNode 的 children, 一併掛上 dom
    if (Array.isArray(children)) {
        children.forEach((child) => {
            virtualNodeToDOM(child, dom);
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
