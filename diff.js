export const REPLACE = 0; // 替換掉原來的 node, 例如把原本的 div 換成了 ul
export const REORDER = 1; // 移動、刪除、新增子節點, 例如原本有一個 ul, 把它跟其他同層的 node 順序互換
export const PROPS = 2; // 修改了節點的 props
export const TEXT = 3; // 文字類型的 node 修改, 文字內容可能會改變, 例如本來的一個 'test' 改成 'test2'

/* === Diff 算法 === */

export function diff(oldTree, newTree) {
    let index = 0 // 當前 Node 的 Index
    let patches = {} // 紀錄每個 Node Object 的差異

    completeDiffCheck(oldTree, newTree, index, patches)
    return patches
}

function completeDiffCheck(oldNode, newNode, index, patches) {
    let currentPatch = [];

    // node 的移除
    if (newNode === null) {
        // 處理重新排序, 真實的 dom 節點將被移除, 所以這邊不用做事
        return;
    }

    // 當 node type 是文字時
    if (oldNode instanceof String && newNode instanceof String) {
        // 如果新舊節點不同, 表示真實 dom 也需刷新, 紀錄進去 Patch
        if (newNode !== oldNode) {
            // type 是 TEXT 類型
            currentPatch.push({type: TEXT, content: newNode})
        }
        return;
    }

    // 當 node 不是文字, 且新舊節點的都相同時, 接著檢查新舊節點的 props and children
    if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
        // 檢查 props
        let propsPatches = propsDiffCheck(oldNode, newNode);

        // 如果檢查 props 後, 發現新舊兩個有差異
        if (propsPatches) {
            // props 有差異, 表示真實 dom 也需刷新, 紀錄進去 Patch
            // type 是 PROPS
            currentPatch.push({type: PROPS, props: propsPatches});
        }

        // 檢查 children. 如果新節點的 children 不是 ignore 的話, 就做 children diff check
        if (!isIgnoreChildren(newNode)) {
            childrenDiffCheck(oldNode.children, newNode.children, index, patches, currentPatch);
        }
    } else {
        // 新舊節點不相同時, 直接判定是差異, 紀錄進去 Patch
        currentPatch.push({type: REPLACE, node: newNode})
    }

    // 若是 currentPatch 有長度, 表示有差異, 並把記錄到的全部差異指向當前 index 的位置
    if (currentPatch.length) {
        patches[index] = currentPatch
    }

    return currentPatch;
}

// 對新舊兩個節點的 props 做檢查
function propsDiffCheck(oldNode, newNode) {
    let count = 0;
    let oldProps = oldNode.props;
    let newProps = newNode.props;
    let key, value;
    let propsPatches = {};

    // 先用 oldProps 取出來 props 一個個比對
    for (key in oldProps) {
        value = oldProps[key];
        if (newProps[key] !== value) {
            // 若有差異就 count +1
            count++;
            // 並把 newProps 的, 記錄到 propsPatches 上
            propsPatches[key] = newProps[key];
        }
    }

    // 檢查 newProps, 因為有可能是全新的 props, old 上沒有
    for (key in newProps) {
        value = newProps[key];

        // 檢查 newProps, 是否有以前 oldProps 沒有的
        if (!oldProps.hasOwnProperty(key)) {
            // 若有就 count +1
            count++;
            // 並把 newProps 的, 記錄到 propsPatches 上
            propsPatches[key] = newProps[key];
        }
    }

    // 如果 count 是 0 就表示新舊兩個 props 都一樣, 回傳 null
    if (count === 0) {
        return null
    }

    // 回傳 propsPatches, 比出差異的 object
    return propsPatches
}

// 檢查 children 屬性, 是否為 ignore
function isIgnoreChildren (node) {
    return (node.props && node.props.hasOwnProperty('ignore'))
}

// 對新舊兩棵 tree 的子節點 做檢查 (深度優先)
function childrenDiffCheck(oldChildren, newChildren, index, patches) {
    // left Node 為深度優先, 是從左邊開始往下檢查
    let leftNode = null;

    // 最初始為 0, 因為從 tree 最上層開始
    let currentNodeIndex = index;

    // 若 oldChildren 不為空, 從舊 tree 的 Children 下手
    if (oldChildren) {
        oldChildren.forEach((child, index) => {
            // 從 newChildren 中取出對應要比較的 New Node
            let newChildNode = newChildren[index];

            // 計算 Node 的標誌
            currentNodeIndex = (leftNode && leftNode.count)
                // 若 index & count 屬性為空 => 0 + null + 1 = 1
                ? currentNodeIndex + leftNode.count + 1

                // 若 index 為 1 => 1 + 1 = 2 以此類推
                : currentNodeIndex + 1
            completeDiffCheck(child, newChildNode, currentNodeIndex, patches) // 遞迴, 且深度優先的歷遍子節點
            leftNode = child;
        })
    }
}
