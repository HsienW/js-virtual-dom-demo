/** 把 virtual node 結構的修改成 fiber
 舊有的 diff 到 patch 到最後 render 出來是採用遞迴的方式, 產生的效能問題是
 一旦 dom tree 非常大時, 無法算到一半中斷接著再繼續, 每次都要一口氣做完, 會導致 render 感覺上會卡住, fiber 就是為了解決這個問題
 fiber 本質是個深度優先的鏈結, 每個節點都具有 4個屬性
 1. parent = 指向上一個節點
 2. current = 指的是自己 (一般不會特別寫出來)
 3. child = 指向下一個節點 (第一個子節點)
 4. sibling = 指向自己右邊的第一個節點 (同層的兄弟節點)

 基於這4個屬性, 可以把遞迴結構修改成循環結構, 可以中斷又復原
 * **/

function createFiber(type, props = {}, children = []) {
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

        // 若當前 firstChild 不存在, 表示第一次跑到 tree 的這層 child
        if (!firstChild) {
            // 父節點同時也保存對第一個子節點
            virtualNode.child = child;
        }
        // 若當前 firstChild 已經存在, 表示已經跑過 tree 的同層
        else {
            // firstChild 保存對下一個兄弟節點
            firstChild.sibling = child;
        }

        firstChild = child;

        return child;
    })

    return virtualNode;
}
