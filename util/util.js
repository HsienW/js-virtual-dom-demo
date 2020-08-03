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
    // 取出新節點的父節點
    let parent = newNode.parentNode.element;
    // 再從父節點取出全部的子節點
    let children = parent.children;
    // 取出新節點的真實 dom 引用
    let element = newNode.element;

    // 尋找要插入點的 index 位置
    let searchIndex = children[newNode.index];

    // 若有找到 searchIndex 就把新節點插入在 index 之前一個
    // 若沒找到 (當前沒有其他子節點) 就插入到父節點之下
    searchIndex ? parent.insertBefore(element, searchIndex) : parent.appendChild(element);
}

/** 向一個 dom 增加屬性 **/

function customSetAttribute(element = {}, prop = {}, value = null) {
    // 檢查是否 prop 帶有事件 handler
    // 若找到 on 開頭的 prop 屬性, indexOf 會回傳 index (這裡通常是0 因為都是第一個) isEventHandler = true
    // 若沒有 會是回傳 -1, isEventHandler = false
    let isEventHandler = Object.keys(prop).indexOf('on') === 0 ;

    if (isEventHandler) {
        // 對 element 掛上對應的 event
        let eventName = prop.toLowerCase();
        element.addEventListener(eventName, value);
    } else {
        // 對 element 掛上對應的一般屬性
        element.setAttribute(prop, value);
    }
}
