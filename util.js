export const createArray = function (target) {
    if (!target) {
        return [];
    }

    let targetArray = [];

    for (let i = 0, len = target.length; i < len; i++) {
        targetArray.push(target[i]);
    }

    return targetArray;
}

export const customSetAttribute = function (node, key, value) {
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
