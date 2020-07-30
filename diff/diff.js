/**定義 diff 發現 patches 的種類
 0. REMOVE = 移除節點 (沒有新節點, patche上不需要這個節點)
 1. REPLACE = 更換節點 (全新的節點替換舊節點)
 2. INSERT = 插入節點 (新增節點)
 3. UPDATE = 刷新節點 (節點 type 沒變, 屬性有變)
 4. REMOVE = 移動節點 (新舊節點位子不同)
 **/

const [REMOVE, REPLACE, INSERT, UPDATE, MOVE] = [0, 1, 2, 3, 4];
