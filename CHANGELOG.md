# CHANGELOG

## v1.0 在线展示版

- 整理为可部署的纯前端静态网站，线上地址为 Vercel 部署版本。
- 保留五种索引结构：B+ 树索引、哈希索引、R 树索引、四叉树索引、网格索引。
- 统一首页标题、项目说明、索引选择、当前索引说明、支持操作和输入格式提示。
- 新增重置、播放 / 暂停、上一步 / 下一步、动画速度控制。
- 每种索引提供至少 2 个内置演示案例。
- 新增动画事件说明面板，展示当前步骤、事件类型和目标对象。
- 增加 v1.0 展示配置测试，约束示例覆盖和操作支持矩阵。
- 更新 README、架构文档、AI Coding 说明和部署说明，使项目更适合作为面试展示作品。

## v0.5 网格索引可视化 MVP

- 新增 `src/core/grid/`，实现固定网格初始化、点插入、cell 映射、范围查询和 reset。
- 新增 `GridIndexEngine`，接入统一 `IndexEngine`。
- 新增 `src/components/grid/GridIndexSvg.tsx`，展示网格、点对象、查询矩形、访问 cell、剪枝 cell 和命中点。
- 扩展测试覆盖网格索引核心逻辑、engine 适配和多索引入口。

## v0.4 四叉树可视化 MVP

- 新增 `src/core/quadtree/`，实现点插入、四象限分裂、点重分发、范围查询和 reset。
- 新增 `QuadTreeEngine`，接入统一 `IndexEngine`。
- 新增 `src/components/quadtree/QuadTreeSvg.tsx`，展示空间划分、点对象、查询矩形、剪枝节点和命中点。
- 扩展测试覆盖四叉树核心逻辑、engine 适配和多索引入口。

## v0.3 R 树可视化 MVP

- 新增 `src/core/rtree/`，实现矩形插入、MBR 更新、节点分裂、空间相交查询和 reset。
- 新增 `RTreeEngine`，接入统一 `IndexEngine`。
- 新增 `src/components/rtree/RTreeSvg.tsx`，展示 R 树层级、MBR、空间对象、查询矩形、剪枝和命中状态。
- 扩展测试覆盖 R 树核心逻辑、engine 适配和 ViewModel 输出。

## v0.2 哈希索引可视化 MVP

- 新增静态哈希索引核心逻辑，采用 `key % bucketCount` 映射到固定 bucket。
- 冲突处理采用链地址法。
- 新增 `HashIndexEngine`，接入统一 `IndexEngine`。
- 新增 `HashIndexSvg`，展示 bucket 数组和冲突链。
- 哈希索引范围查询在页面层禁用，不遍历全部 bucket。

## v0.1 B+ 树可视化 MVP

- 实现 B+ 树插入、查找和范围查询。
- 实现节点访问、插入、分裂、提升 key 和范围扫描动画事件。
- 新增 B+ 树 SVG 可视化，展示内部节点、叶子节点、父子连线和叶子链表。
- 引入 Vitest，为核心逻辑和动画事件增加自动化测试。
