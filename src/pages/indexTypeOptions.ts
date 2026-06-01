import type { IndexType } from '../core/common';

export type SelectableIndexType = IndexType;

export interface IndexTypeOption {
  value: SelectableIndexType;
  label: string;
  disabled: boolean;
}

export const INDEX_TYPE_OPTIONS: IndexTypeOption[] = [
  { value: 'bptree', label: 'B+ 树索引', disabled: false },
  { value: 'hash', label: '哈希索引', disabled: false },
  { value: 'rtree', label: 'R 树索引', disabled: false },
  { value: 'quadtree', label: '四叉树', disabled: false },
  { value: 'grid', label: '网格索引', disabled: false },
];

export function getIndexTypeLabel(indexType: SelectableIndexType) {
  return INDEX_TYPE_OPTIONS.find((option) => option.value === indexType)?.label ?? indexType;
}
