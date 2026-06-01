import { describe, expect, test } from 'vitest';
import { DEMO_SCENARIOS, INDEX_OPERATION_CONFIG } from '../showcaseConfig';
import type { SelectableIndexType } from '../indexTypeOptions';

const INDEX_TYPES: SelectableIndexType[] = ['bptree', 'hash', 'rtree', 'quadtree', 'grid'];

describe('v1.0 showcase configuration', () => {
  test('provides at least two demo scenarios for each supported index type', () => {
    for (const indexType of INDEX_TYPES) {
      const scenarios = DEMO_SCENARIOS.filter((scenario) => scenario.indexType === indexType);

      expect(scenarios.length).toBeGreaterThanOrEqual(2);
      expect(scenarios.every((scenario) => scenario.title.length > 0 && scenario.description.length > 0)).toBe(true);
    }
  });

  test('keeps demo operations within the supported operation matrix', () => {
    for (const scenario of DEMO_SCENARIOS) {
      const operationConfig = INDEX_OPERATION_CONFIG[scenario.indexType];

      for (const operation of scenario.operations) {
        expect(operationConfig[operation.kind].supported).toBe(true);
      }
    }
  });

  test('documents the required v1.0 visual concepts through demo coverage tags', () => {
    const coverage = new Set(DEMO_SCENARIOS.flatMap((scenario) => scenario.covers));

    expect([...coverage]).toEqual(
      expect.arrayContaining([
        'bptree_split',
        'bptree_range',
        'hash_collision_chain',
        'rtree_mbr_expand',
        'rtree_split',
        'rtree_range_prune',
        'quadtree_partition',
        'grid_cell_mapping',
        'grid_range',
      ]),
    );
  });

  test('marks hash range search as unsupported while preserving insert and search', () => {
    expect(INDEX_OPERATION_CONFIG.hash.insert.supported).toBe(true);
    expect(INDEX_OPERATION_CONFIG.hash.search.supported).toBe(true);
    expect(INDEX_OPERATION_CONFIG.hash.rangeSearch.supported).toBe(false);
    expect(INDEX_OPERATION_CONFIG.hash.rangeSearch.reason).toContain('不支持范围查询');
  });
});
