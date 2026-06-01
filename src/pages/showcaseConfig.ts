import type { SelectableIndexType } from './indexTypeOptions';

export type ShowcaseOperationKind = 'insert' | 'search' | 'rangeSearch';
export type ShowcaseCoverageTag =
  | 'bptree_split'
  | 'bptree_range'
  | 'hash_collision_chain'
  | 'rtree_mbr_expand'
  | 'rtree_split'
  | 'rtree_range_prune'
  | 'quadtree_partition'
  | 'grid_cell_mapping'
  | 'grid_range';

export interface OperationSupport {
  supported: boolean;
  label: string;
  inputHint: string;
  reason?: string;
}

export type IndexOperationConfig = Record<ShowcaseOperationKind, OperationSupport>;

export interface DemoOperation {
  kind: ShowcaseOperationKind;
  input: string;
}

export interface DemoScenario {
  id: string;
  indexType: SelectableIndexType;
  title: string;
  description: string;
  operations: DemoOperation[];
  covers: ShowcaseCoverageTag[];
}

export const INDEX_OPERATION_CONFIG: Record<SelectableIndexType, IndexOperationConfig> = {
  bptree: {
    insert: {
      supported: true,
      label: '插入',
      inputHint: '一个或多个整数 key，例如 10, 20, 5, 6',
    },
    search: {
      supported: true,
      label: '查找',
      inputHint: '单个整数 key，例如 12',
    },
    rangeSearch: {
      supported: true,
      label: '范围查询',
      inputHint: '两个整数边界，例如 6, 17 或 [6, 17]',
    },
  },
  hash: {
    insert: {
      supported: true,
      label: '插入',
      inputHint: '一个或多个整数 key，例如 10, 18, 26',
    },
    search: {
      supported: true,
      label: '查找',
      inputHint: '单个整数 key，例如 26',
    },
    rangeSearch: {
      supported: false,
      label: '范围查询',
      inputHint: '哈希索引只适合等值查询。',
      reason: '哈希索引不支持范围查询。',
    },
  },
  rtree: {
    insert: {
      supported: true,
      label: '插入',
      inputHint: '矩形 x,y,width,height；多个矩形用分号分隔',
    },
    search: {
      supported: true,
      label: '查找',
      inputHint: '查询矩形 x,y,width,height',
    },
    rangeSearch: {
      supported: true,
      label: '范围查询',
      inputHint: '查询矩形 x,y,width,height',
    },
  },
  quadtree: {
    insert: {
      supported: true,
      label: '插入',
      inputHint: '点 x,y；多个点用分号分隔',
    },
    search: {
      supported: true,
      label: '查找',
      inputHint: '查询矩形 x,y,width,height',
    },
    rangeSearch: {
      supported: true,
      label: '范围查询',
      inputHint: '查询矩形 x,y,width,height',
    },
  },
  grid: {
    insert: {
      supported: true,
      label: '插入',
      inputHint: '点 x,y；多个点用分号分隔',
    },
    search: {
      supported: true,
      label: '查找',
      inputHint: '查询矩形 x,y,width,height',
    },
    rangeSearch: {
      supported: true,
      label: '范围查询',
      inputHint: '查询矩形 x,y,width,height',
    },
  },
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'bptree-split',
    indexType: 'bptree',
    title: '节点分裂演示',
    description: '连续插入整数 key，观察叶子节点分裂和父节点提升 key。',
    operations: [{ kind: 'insert', input: '10, 20, 5, 6, 12, 30, 7, 17' }],
    covers: ['bptree_split'],
  },
  {
    id: 'bptree-range',
    indexType: 'bptree',
    title: '范围查询演示',
    description: '先构建 B+ 树，再沿叶子链表扫描 [6, 17]。',
    operations: [
      { kind: 'insert', input: '10, 20, 5, 6, 12, 30, 7, 17' },
      { kind: 'rangeSearch', input: '6, 17' },
    ],
    covers: ['bptree_split', 'bptree_range'],
  },
  {
    id: 'hash-collision',
    indexType: 'hash',
    title: '冲突链演示',
    description: '插入同余 key，展示 key % 8 后落入同一 bucket 的链地址冲突。',
    operations: [{ kind: 'insert', input: '10, 18, 26, 34' }],
    covers: ['hash_collision_chain'],
  },
  {
    id: 'hash-search-chain',
    indexType: 'hash',
    title: '链上查找演示',
    description: '构造冲突链后查找 26，逐个扫描 bucket 链直到命中。',
    operations: [
      { kind: 'insert', input: '10, 18, 26, 34' },
      { kind: 'search', input: '26' },
    ],
    covers: ['hash_collision_chain'],
  },
  {
    id: 'rtree-split',
    indexType: 'rtree',
    title: 'MBR 扩张与分裂',
    description: '插入多个矩形对象，观察 MBR 扩张、叶子溢出和 R 树节点分裂。',
    operations: [{ kind: 'insert', input: '10,10,10,10; 35,12,8,8; 60,40,12,10; 90,52,14,16; 120,20,8,14' }],
    covers: ['rtree_mbr_expand', 'rtree_split'],
  },
  {
    id: 'rtree-range-prune',
    indexType: 'rtree',
    title: '范围查询剪枝',
    description: '构建 R 树后用查询矩形筛选相交对象，展示不相交 MBR 的剪枝。',
    operations: [
      { kind: 'insert', input: '10,10,10,10; 35,12,8,8; 60,40,12,10; 90,52,14,16; 120,20,8,14' },
      { kind: 'rangeSearch', input: '8,8,40,20' },
    ],
    covers: ['rtree_mbr_expand', 'rtree_split', 'rtree_range_prune'],
  },
  {
    id: 'quadtree-partition',
    indexType: 'quadtree',
    title: '空间划分演示',
    description: '插入分布在四象限的点，观察四叉树节点分裂和点重新分发。',
    operations: [{ kind: 'insert', input: '10,10; 80,10; 10,80; 80,80; 50,50' }],
    covers: ['quadtree_partition'],
  },
  {
    id: 'quadtree-range',
    indexType: 'quadtree',
    title: '四叉树范围查询',
    description: '构建空间划分后执行矩形范围查询，展示访问节点、剪枝节点和命中点。',
    operations: [
      { kind: 'insert', input: '10,10; 80,10; 10,80; 80,80; 50,50' },
      { kind: 'rangeSearch', input: '0,0,55,55' },
    ],
    covers: ['quadtree_partition'],
  },
  {
    id: 'grid-cell-mapping',
    indexType: 'grid',
    title: '单元映射演示',
    description: '插入多个点，展示固定 5x5 网格中点到 cell 的映射过程。',
    operations: [{ kind: 'insert', input: '10,10; 50,50; 90,90; 15,70' }],
    covers: ['grid_cell_mapping'],
  },
  {
    id: 'grid-range',
    indexType: 'grid',
    title: '网格范围查询',
    description: '先映射点到 cell，再执行范围查询，展示访问 cell、剪枝 cell 和命中点。',
    operations: [
      { kind: 'insert', input: '10,10; 50,50; 90,90; 15,70' },
      { kind: 'rangeSearch', input: '0,0,55,55' },
    ],
    covers: ['grid_cell_mapping', 'grid_range'],
  },
];
