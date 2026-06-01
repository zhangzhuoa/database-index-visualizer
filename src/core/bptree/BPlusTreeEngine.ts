import type { AnimationResult, IndexEngine, IndexViewModel } from '../common';
import { BPlusTree } from './BPlusTree';

export interface BPlusTreeRangeSearchInput {
  left: number;
  right: number;
}

export type BPlusTreeEngineInsertResult = AnimationResult<object>;

export type BPlusTreeEngineSearchResult = AnimationResult<{
  found: boolean;
  path: string[];
}>;

export type BPlusTreeEngineRangeSearchResult = AnimationResult<{
  keys: number[];
  path: string[];
}>;

export type BPlusTreeIndexEngine = IndexEngine<
  'bptree',
  number,
  number,
  BPlusTreeRangeSearchInput,
  object,
  { found: boolean; path: string[] },
  { keys: number[]; path: string[] }
>;

export class BPlusTreeEngine
  implements BPlusTreeIndexEngine
{
  private tree: BPlusTree;

  constructor(private readonly order = 4) {
    this.tree = new BPlusTree(order);
  }

  getType() {
    return 'bptree' as const;
  }

  insert(input: number): BPlusTreeEngineInsertResult {
    return this.tree.insert(input);
  }

  search(input: number): BPlusTreeEngineSearchResult {
    return this.tree.search(input);
  }

  rangeSearch(input: BPlusTreeRangeSearchInput): BPlusTreeEngineRangeSearchResult {
    return this.tree.rangeSearch(input.left, input.right);
  }

  getViewModel(): IndexViewModel<'bptree', 'internal' | 'leaf'> {
    return {
      indexType: this.getType(),
      ...this.tree.toViewModel(),
    };
  }

  reset() {
    this.tree = new BPlusTree(this.order);
  }
}
