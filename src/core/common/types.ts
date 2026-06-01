import type { AnimationEvent as BPlusTreeAnimationEvent } from '../events';

export interface IndexTypeRegistry {
  bptree: unknown;
  hash: unknown;
  rtree: unknown;
  quadtree: unknown;
  grid: unknown;
}

export type IndexType = keyof IndexTypeRegistry;

export type IndexOperation = 'insert' | 'search' | 'rangeSearch';

export type AnimationEvent = BPlusTreeAnimationEvent;

export type IndexViewNodeKind = 'internal' | 'leaf' | 'bucket';

export interface IndexViewNode<TKind extends string = IndexViewNodeKind> {
  id: string;
  kind: TKind;
  keys: number[];
  x: number;
  y: number;
  children?: string[];
  nextLeaf?: string;
}

export interface IndexViewModel<TType extends IndexType = IndexType, TKind extends string = IndexViewNodeKind> {
  indexType: TType;
  rootId: string;
  nodes: IndexViewNode<TKind>[];
  width: number;
  height: number;
}

export type AnimationResult<TData extends object = object> = TData & {
  events: AnimationEvent[];
};

export interface IndexEngine<
  TType extends IndexType = IndexType,
  TInsertInput = unknown,
  TSearchInput = unknown,
  TRangeSearchInput = unknown,
  TInsertData extends object = object,
  TSearchData extends object = Record<string, unknown>,
  TRangeSearchData extends object = Record<string, unknown>,
  TViewModel extends object = IndexViewModel<TType>,
> {
  getType(): TType;
  insert(input: TInsertInput): AnimationResult<TInsertData>;
  search(input: TSearchInput): AnimationResult<TSearchData>;
  rangeSearch(input: TRangeSearchInput): AnimationResult<TRangeSearchData>;
  getViewModel(): TViewModel;
  reset(): void;
}
