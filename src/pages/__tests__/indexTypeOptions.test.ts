import { describe, expect, test } from 'vitest';
import { INDEX_TYPE_OPTIONS, getIndexTypeLabel } from '../indexTypeOptions';

describe('index type options', () => {
  test('enables B+ tree, hash, R tree, quadtree, and grid index options for the current page', () => {
    expect(INDEX_TYPE_OPTIONS).toEqual([
      { value: 'bptree', label: 'B+ 树索引', disabled: false },
      { value: 'hash', label: '哈希索引', disabled: false },
      { value: 'rtree', label: 'R 树索引', disabled: false },
      { value: 'quadtree', label: '四叉树', disabled: false },
      { value: 'grid', label: '网格索引', disabled: false },
    ]);
  });

  test('returns the display label for enabled index types', () => {
    expect(getIndexTypeLabel('bptree')).toBe('B+ 树索引');
    expect(getIndexTypeLabel('hash')).toBe('哈希索引');
    expect(getIndexTypeLabel('rtree')).toBe('R 树索引');
    expect(getIndexTypeLabel('quadtree')).toBe('四叉树');
    expect(getIndexTypeLabel('grid')).toBe('网格索引');
  });
});
