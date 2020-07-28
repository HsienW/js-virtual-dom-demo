const TEXT_NODE = Symbol('text_node');

function isTextNode(type) {
    return type === TEXT_NODE;
}

function createVirtualNode(type, props = {}, children = []) {

    // 保存每個 node 的 key
    let key = props.key

    // 已經取出另存為 key 到 virtual node 上, 可從 props 移除
    delete props.key

    // 建立 virtual node object
    let virtualNode = {
        type,
        props,
        key,
        element: null,
    }

    // 替 virtual node object 增加 children 屬性, 從傳入的 children 而來
    virtualNode.children = children.map((child, index) => {

        // 若當前的 child 沒有 type, 通常為 string
        if (!child.type) {

            // 對這個 child 增加 type & props 等等...屬性, 並把它歸類為 string 的 child
            child = {
                type: TEXT_NODE,
                props: {
                    nodeValue: child
                },
                children: []
            }
        }

        child.index = index;

        // 讓每個 child 都帶有 parentNode, 可以存取自己的父層
        child.parentNode = virtualNode;
        return child
    })

    return virtualNode;
}
