/* === Create Element === */

const type = function (obj) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '')
}

const slice = function slice (arrayLike, index) {
    return Array.prototype.slice.call(arrayLike, index)
}

const truthy = function truthy (value) {
    return !!value
}

const isArray = function isArray (list) {
    return type(list) === 'Array'
}

const each = function each(array, fn) {
    for (let i = 0, len = array.length; i < len; i++) {
        fn(array[i], i)
    }
}

const toArray = function toArray(listLike) {
    if (!listLike) {
        return []
    }

    let list = []

    for (let i = 0, len = listLike.length; i < len; i++) {
        list.push(listLike[i])
    }

    return list
}

const setAttr = function setAttr(node, key, value) {
    switch (key) {
        case 'style':
            node.style.cssText = value
            break
        case 'value':
            let tagName = node.tagName || ''
            tagName = tagName.toLowerCase()
            if (
                tagName === 'input' || tagName === 'textarea'
            ) {
                node.value = value
            } else {
                // if it is not a input or textarea, use `setAttribute` to set
                node.setAttribute(key, value)
            }
            break
        default:
            node.setAttribute(key, value)
            break
    }
}


export const CustomElement = function (tagName, props, children) {
    if (!(this instanceof CustomElement)) {
        if (isArray(children) && children != null) {
            children = slice(arguments, 2).filter(truthy)
        }
        return new CustomElement(tagName, props, children)
    }

    if (isArray(props)) {
        children = props
        props = {}
    }

    this.tagName = tagName
    this.props = props || {}
    this.children = children || []
    this.key = props
        ? props.key
        : void 666

    let count = 0

    each(this.children, function (child, i) {
        if (child instanceof Element) {
            count += child.count
        } else {
            children[i] = '' + child
        }
        count++
    })

    this.count = count
}


// export const CustomElement = function (tagName, props, children) {
//     this.tagName = tagName;
//     this.props = props;
//     this.children = children;
//     this.key = props ? props.key : void 0;
// }

CustomElement.prototype.render = function () {
    let el = document.createElement(this.tagName)
    let props = this.props

    for (let propName in props) {
        let propValue = props[propName]
        setAttr(el, propName, propValue)
    }

    each(this.children, function (child) {
        let childEl = (child instanceof Element)
            ? child.render()
            : document.createTextNode(child)
        el.appendChild(childEl)
    })

    return el
}

// CustomElement.prototype.render = function () {
//     let element = document.createElement(this.tagName); // 依照 tagName 創建
//     let props = this.props;
//
//     for (let propName in props) { // 設定 DOM 的 Node 屬性
//         let propValue = props[propName];
//         element.setAttribute(propName, propValue);
//     }
//
//     let children = this.children || [];
//
//     children.forEach((child) => {
//         let childElement = (child instanceof CustomElement)
//             ? child.render() // 如果子節點也是虛擬 DOM, 遞迴創建 DOM 結點
//             : document.createTextNode(child) // 如果字串, 只創建文字結點
//         element.appendChild(childElement)
//     });
//
//     return element;
// }
