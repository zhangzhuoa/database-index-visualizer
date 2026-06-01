import type { AnimationEvent, AnimationResult, IndexEngine } from '../common';
import { HashIndex } from './HashIndex';
import type { HashIndexViewModel } from './hashTypes';
import { createHashIndexViewModel } from './viewModel';

export interface HashIndexRangeSearchInput {
  left: number;
  right: number;
}

export type HashIndexInsertResult = AnimationResult<{
  bucketIndex: number;
}>;

export type HashIndexSearchResult = AnimationResult<{
  found: boolean;
  bucketIndex: number;
  path: string[];
}>;

export type HashIndexRangeSearchResult = AnimationResult<{
  keys: number[];
  path: string[];
  supported: false;
  message: string;
}>;

export type HashIndexEngineType = IndexEngine<
  'hash',
  number,
  number,
  HashIndexRangeSearchInput,
  { bucketIndex: number },
  { found: boolean; bucketIndex: number; path: string[] },
  { keys: number[]; path: string[]; supported: false; message: string }
>;

export class HashIndexEngine implements HashIndexEngineType {
  private index: HashIndex;

  constructor(bucketCount = 8) {
    this.index = new HashIndex(bucketCount);
  }

  getType() {
    return 'hash' as const;
  }

  insert(input: number): HashIndexInsertResult {
    const bucketIndex = this.index.hash(input);
    const events = this.createHashEvents(input, bucketIndex);
    const result = this.index.insert(input);

    events.push({
      type: 'insert_key',
      nodeId: result.bucket.id,
      key: input,
      keys: [...result.bucket.keys],
      bucketIndex,
      hashValue: bucketIndex,
    });

    return { bucketIndex, events };
  }

  search(input: number): HashIndexSearchResult {
    const result = this.index.search(input);
    const { bucket, bucketIndex, found } = result;
    const events = this.createHashEvents(input, bucketIndex);

    for (const scannedKey of result.scannedKeys) {
      events.push({
        type: 'scan_key',
        nodeId: bucket.id,
        key: input,
        keys: [...bucket.keys],
        bucketIndex,
        hashValue: bucketIndex,
        scannedKey,
      });
    }

    if (result.scannedKeys.length === 0) {
      events.push({
        type: 'scan_key',
        nodeId: bucket.id,
        key: input,
        keys: [],
        bucketIndex,
        hashValue: bucketIndex,
      });
    }

    events.push({
      type: found ? 'search_success' : 'search_failed',
      nodeId: bucket.id,
      key: input,
      keys: [...bucket.keys],
      bucketIndex,
      hashValue: bucketIndex,
    });

    return {
      found,
      bucketIndex,
      path: [bucket.id],
      events,
    };
  }

  rangeSearch(input: HashIndexRangeSearchInput): HashIndexRangeSearchResult {
    if (input.left > input.right) {
      throw new Error('Range left boundary must be less than or equal to right boundary.');
    }

    return {
      keys: [],
      path: [],
      supported: false,
      message: '哈希索引不支持范围查询',
      events: [],
    };
  }

  getViewModel(): HashIndexViewModel {
    return createHashIndexViewModel(this.index.getBuckets());
  }

  reset() {
    this.index.reset();
  }

  private createHashEvents(key: number, bucketIndex: number): AnimationEvent[] {
    const bucket = this.index.getBuckets()[bucketIndex];

    return [
      {
        type: 'compute_hash',
        nodeId: bucket.id,
        key,
        bucketIndex,
        hashValue: bucketIndex,
      },
      {
        type: 'highlight_bucket',
        nodeId: bucket.id,
        key,
        keys: [...bucket.keys],
        bucketIndex,
        hashValue: bucketIndex,
      },
    ];
  }
}
