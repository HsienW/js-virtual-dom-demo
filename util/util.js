/** 判斷一個 node 是否為 string type **/

const TEXT_NODE = Symbol('text_node');

function isTextNode(type) {
    return type === TEXT_NODE;
}

/** 創建真實的 dom 節點 **/

function createDOM(node) {
    let type = node.type;
    return isTextNode(type) ? document.createTextNode(node.props.value) : document.createElement(type);
}

/** 在真實 dom 父節點之下插入一個新的節點 **/

function insertDOM(newNode) {
    let parent = newNode.parentNode.element;
    let children = parent.children;

    let element = newNode.element;
    let after = children[newNode.index];

    after ? parent.insertBefore(element, after) : parent.appendChild(element);
}

/** 向一個 dom 增加屬性 **/

function customSetAttribute(element, prop, value) {
    // 檢查是否 prop 帶有事件 handler
    // 若找到 on 開頭的 prop 屬性, indexOf 會回傳 index (這裡通常是0 因為都是第一個) isEventHandler = true
    // 若沒有 會是回傳 -1, isEventHandler = false
    let isEventHandler = prop.indexOf('on') === 0;

    if (isEventHandler) {
        // 對 element 掛上對應的 event
        let eventName = prop.toLowerCase();
        element.addEventListener(eventName, value);
    } else {
        // 對 element 掛上對應的一般屬性
        element.setAttribute(prop, value);
    }
}
