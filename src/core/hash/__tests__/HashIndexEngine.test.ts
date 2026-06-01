import { describe, expect, test } from 'vitest';
import { HashIndexEngine } from '../HashIndexEngine';

describe('HashIndexEngine', () => {
  test('inserts keys into fixed buckets using key modulo bucket count', () => {
    const engine = new HashIndexEngine();

    engine.insert(10);

    const viewModel = engine.getViewModel();

    expect(engine.getType()).toBe('hash');
    expect(viewModel.indexType).toBe('hash');
    expect(viewModel.bucketCount).toBe(8);
    expect(viewModel.hashFunction).toBe('key % 8');
    expect(viewModel.buckets[2].keys).toEqual([10]);
  });

  test('stores collisions in a bucket chain', () => {
    const engine = new HashIndexEngine();

    engine.insert(10);
    engine.insert(18);

    expect(engine.getViewModel().buckets[2].keys).toEqual([10, 18]);
  });

  test('searches only the hashed bucket chain and reports hit or miss', () => {
    const engine = new HashIndexEngine();
    engine.insert(10);
    engine.insert(18);

    const hit = engine.search(10);
    const miss = engine.search(99);

    expect(hit.found).toBe(true);
    expect(hit.bucketIndex).toBe(2);
    expect(hit.path).toEqual(['bucket-2']);
    expect(hit.events.map((event) => event.type)).toEqual([
      'compute_hash',
      'highlight_bucket',
      'scan_key',
      'search_success',
    ]);
    expect(miss.found).toBe(false);
    expect(miss.bucketIndex).toBe(3);
    expect(miss.events.map((event) => event.type)).toEqual([
      'compute_hash',
      'highlight_bucket',
      'scan_key',
      'search_failed',
    ]);
  });

  test('resets all buckets without changing bucket count', () => {
    const engine = new HashIndexEngine();
    engine.insert(10);

    engine.reset();

    expect(engine.getViewModel().buckets.map((bucket) => bucket.keys)).toEqual([[], [], [], [], [], [], [], []]);
    expect(engine.getViewModel().bucketCount).toBe(8);
  });

  test('getViewModel includes buckets and operations generate animation events', () => {
    const engine = new HashIndexEngine();

    const insertResult = engine.insert(10);
    const searchResult = engine.search(10);
    const viewModel = engine.getViewModel();

    expect(viewModel.buckets).toHaveLength(8);
    expect(insertResult.events.length).toBeGreaterThan(0);
    expect(searchResult.events.length).toBeGreaterThan(0);
  });

  test('rangeSearch is a compatibility method and does not scan buckets', () => {
    const engine = new HashIndexEngine();
    engine.insert(10);

    const result = engine.rangeSearch({ left: 1, right: 20 });

    expect(result.supported).toBe(false);
    expect(result.keys).toEqual([]);
    expect(result.events).toEqual([]);
  });
});
