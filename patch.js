export const REPLACE = 0; // 替換掉原來的 node, 例如把原本的 div 換成了 ul
export const REORDER = 1; // 移動、刪除、新增子節點, 例如原本有一個 ul, 把它跟其他同層的 node 順序互換
export const PROPS = 2; // 修改了節點的 props
export const TEXT = 3; // 文字類型的 node 修改, 文字內容可能會改變, 例如本來的一個 'test' 改成 'test2'

/* === Patch to DOM === */

export function patch(node, patches) {
    let checker = {index: 0};
    patchCheck(node, checker, patches);
}

function patchCheck(node, checker, patches) {
    // 從 patches 取出與當前節點的差異
    let currentPatches = patches[checker.index];

    // 若被 Check 的節點, 沒有子節點的話, 將長度歸零, 表示深度到底了
    let length = node.childNodes ? node.childNodes.length : 0;

    // 開始深度歷遍子節點
    for (let i = 0; i < length; i++) {
        let child = node.childNodes[i];
        checker.index++;

        // 使用遞迴的方式做 Check
        patchCheck(child, checker, patches);
    }

    // 對當前已經抓出差異點的 node 做 DOM 的改變
    if (currentPatches) {
        applyPatches(node, currentPatches);
    }
}

function reorderChildren(node, moves) {
    let staticNodeList = [];
    let maps = {};

    node.childNodes.forEach((child) => {
        staticNodeList.push(child);
    });

    staticNodeList.forEach((node) => {
        if (node.nodeType === 1) {
            let key = node.getAttribute('key');
            if (key) {
                maps[key] = node;
            }
        }
    })
}

function setProps (node, props) {
    for (let key in props) {
        // void 不管後面跟什麼 value 一定回傳 undefined
        if (props[key] === void 0) {
            // 如果 props 屬性名為 undefined, 直接移除
            node.removeAttribute(key);
        } else {
            // 如果 props 屬性名存在, 取出它的值, 並執行 setAttribute
            let value = props[key];
            customSetAttribute(node, key, value);
        }
    }
}

function applyPatches(node, currentPatches) {
    currentPatches.forEach((currentPatch) => {
        switch (currentPatch.type) {
            case REPLACE:
                node.parentNode.replaceChild(currentPatch.node.render(), node);
                break
            // todo should add move function
            // case REORDER:
            //     reorderChildren(node, currentPatch.moves);
            //     break
            case PROPS:
                setProps(node, currentPatch.props);
                break
            case TEXT:
                node.textContent = currentPatch.content;
                break
            default:
                throw new Error('Unknown patch type ' + currentPatch.type);
        }
    })
}

const customSetAttribute = function(node, key, value) {
    switch (key) {
        // 如果 key 是 style, 表示是 css 屬性,直接覆蓋整個 node 的 style 屬性
        case 'style':
            node.style.cssText = value;
            break;

        // 如果 key 是 value, 表示是 props 的 content 被改動了
        case 'value':

            // 確認 tagName 的 value, 並轉成小寫方便比對
            let tagName = node.tagName || '';
            tagName = tagName.toLowerCase();

            // tagName 是文字類型的話
            if (tagName === 'input' || tagName === 'textarea') {
                // 直接把 node value 換上新值
                node.value = value;
            } else {
                // tagName 是其他類型的話, 就對 node 給予新屬性
                node.setAttribute(key, value);
            }
            break;
        default:
            node.setAttribute(key, value);
            break;
    }
}

