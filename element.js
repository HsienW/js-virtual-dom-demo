/* === Create Element === */

export const CustomElement = function (tagName, props, children) {
    this.tagName = tagName;
    this.props = props;
    this.children = children;
}

CustomElement.prototype.render = function () {
    let element = document.createElement(this.tagName); // 依照 tagName 創建
    let props = this.props;

    for (let propName in props) { // 設定 DOM 的 Node 屬性
        let propValue = props[propName];
        element.setAttribute(propName, propValue);
    }

    let children = this.children || [];

    children.forEach((child) => {
        let childElement = (child instanceof CustomElement)
            ? child.render() // 如果子節點也是虛擬 DOM, 遞迴創建 DOM 結點
            : document.createTextNode(child) // 如果字串, 只創建文字結點
        element.appendChild(childElement)
    });

    return element;
}
