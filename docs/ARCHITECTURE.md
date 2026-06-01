# 架构说明

本项目是一个纯前端数据库索引结构可视化工具。v1.0 展示版支持 B+ 树索引、哈希索引、R 树索引、四叉树索引和网格索引，所有索引都通过统一 `IndexEngine` 接口接入页面。

项目不包含后端服务、数据库连接、用户系统或数据上传能力。所有演示数据都来自用户输入、内置示例和浏览器内存中的索引实例。

## 为什么 v1.0 不需要后端

- 项目目标是解释索引结构和算法过程，不需要真实数据库执行计划。
- 输入规模较小，浏览器内存足以完成算法演示和动画播放。
- 内置示例和用户输入都可以即时重置，不需要持久化。
- 静态部署更适合作为在线作品展示，可直接部署到 Vercel、GitHub Pages 或其他静态托管平台。

## 总体数据流

```text
用户输入 / 内置示例
  -> HomePage
  -> IndexEngine.insert/search/rangeSearch
  -> 核心索引结构更新内存状态
  -> 返回 AnimationEvent[]
  -> getViewModel()
  -> SVG 渲染组件
  -> 动画事件说明面板
```

页面层只负责交互编排，不直接实现核心算法。

## 核心模块关系

### IndexEngine

`IndexEngine` 位于 `src/core/common/`，是所有索引结构的统一适配接口。

它约定每个索引都需要提供：

- `getType()`
- `insert(input)`
- `search(input)`
- `rangeSearch(input)`
- `getViewModel()`
- `reset()`

当前实现：

- `BPlusTreeEngine`
- `HashIndexEngine`
- `RTreeEngine`
- `QuadTreeEngine`
- `GridIndexEngine`

### 核心索引算法

核心算法分别位于：

```text
src/core/bptree/
src/core/hash/
src/core/rtree/
src/core/quadtree/
src/core/grid/
```

这些模块负责真实的数据结构状态和算法过程，例如节点分裂、范围查询、冲突链、MBR 扩张、空间剪枝和 cell 映射。

React 组件不直接实现这些算法。

### AnimationEvent

`AnimationEvent` 描述算法执行过程中的关键事件，例如：

- 访问节点
- 插入 key
- 计算哈希值
- 定位 bucket
- 扩张 MBR
- 节点分裂
- 命中对象
- 剪枝节点或 cell

页面层根据事件序列实现播放、暂停、上一步、下一步和事件说明面板。

### ViewModel

每种索引都有对应 ViewModel，用来描述 SVG 渲染所需的数据：

- 节点、bucket、矩形、点或 cell
- 坐标和尺寸
- 画布宽高
- 父子关系或空间边界

ViewModel 不承载算法决策，只服务于渲染。

### SVG 渲染组件

SVG 组件位于 `src/components/`：

```text
src/components/BPlusTreeSvg.tsx
src/components/hash/HashIndexSvg.tsx
src/components/rtree/RTreeSvg.tsx
src/components/quadtree/QuadTreeSvg.tsx
src/components/grid/GridIndexSvg.tsx
```

这些组件只消费 ViewModel 和页面传入的高亮状态，不直接调用算法方法。

## 页面层职责

`src/pages/HomePage.tsx` 负责：

- 索引类型选择
- 输入解析
- 操作按钮分发
- 内置示例载入
- 动画播放状态管理
- 高亮状态管理
- 查询区域状态管理
- SVG 组件选择
- 动画事件说明面板

页面层不负责：

- B+ 树插入算法
- 哈希冲突处理算法
- R 树分裂算法
- 四叉树空间划分算法
- 网格 cell 映射算法

## v1.0 示例配置

`src/pages/showcaseConfig.ts` 维护展示版配置：

- 每种索引支持哪些操作
- 不支持操作的提示文案
- 每种索引的内置示例
- 示例覆盖标签

对应测试位于：

```text
src/pages/__tests__/showcaseConfig.test.ts
```

该测试保证每种索引至少有两个示例，并保证示例不会调用不支持的操作。

## 测试结构

项目使用 Vitest，主要测试范围：

- 核心算法行为
- engine 适配行为
- ViewModel 输出
- reset 行为
- 动画事件类型
- 多索引统一入口
- v1.0 示例配置

运行：

```bash
npm test
```

生产构建：

```bash
npm run build
```
