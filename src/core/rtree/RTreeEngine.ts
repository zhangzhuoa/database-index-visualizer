import type { AnimationEvent, AnimationResult, IndexEngine } from '../common';
import { RTree } from './RTree';
import type { Rect, RTreeViewModel, SpatialEntry } from './rtreeTypes';
import { createRTreeViewModel } from './viewModel';

export type RTreeInsertInput = SpatialEntry | Rect;
export type RTreeSearchInput = Rect;
export type RTreeRangeSearchInput = Rect;

export type RTreeInsertResult = AnimationResult<{
  entry: SpatialEntry;
}>;

export type RTreeSearchResult = AnimationResult<{
  entries: SpatialEntry[];
  path: string[];
}>;

export type RTreeRangeSearchResult = RTreeSearchResult;

export type RTreeIndexEngine = IndexEngine<
  'rtree',
  RTreeInsertInput,
  RTreeSearchInput,
  RTreeRangeSearchInput,
  { entry: SpatialEntry },
  { entries: SpatialEntry[]; path: string[] },
  { entries: SpatialEntry[]; path: string[] },
  RTreeViewModel
>;

export class RTreeEngine implements RTreeIndexEngine {
  private tree: RTree;

  constructor(
    private readonly maxEntries = 4,
    private readonly minEntries = 2,
  ) {
    this.tree = new RTree(maxEntries, minEntries);
  }

  getType() {
    return 'rtree' as const;
  }

  insert(input: RTreeInsertInput): RTreeInsertResult {
    const result = this.tree.insert(input);
    const events: AnimationEvent[] = [];

    for (const nodeId of result.path) {
      events.push({
        type: 'rtree_choose_subtree',
        nodeId,
        entryId: result.entry.id,
        rect: result.entry.rect,
      });
    }

    for (const nodeId of result.expandedNodeIds) {
      events.push({
        type: 'rtree_expand_mbr',
        nodeId,
        entryId: result.entry.id,
        rect: result.entry.rect,
      });
    }

    events.push({
      type: 'rtree_insert_entry',
      nodeId: result.leafId,
      entryId: result.entry.id,
      rect: result.entry.rect,
    });

    for (let index = 0; index < result.splitNodeIds.length; index += 2) {
      const leftNodeId = result.splitNodeIds[index];
      const rightNodeId = result.splitNodeIds[index + 1];

      if (leftNodeId && rightNodeId) {
        events.push({
          type: 'rtree_split_node',
          nodeId: leftNodeId,
          leftNodeId,
          rightNodeId,
        });
      }
    }

    if (result.createdRootId) {
      events.push({
        type: 'rtree_create_root',
        nodeId: result.createdRootId,
      });
    }

    return {
      entry: result.entry,
      events,
    };
  }

  search(input: RTreeSearchInput): RTreeSearchResult {
    return this.query(input);
  }

  rangeSearch(input: RTreeRangeSearchInput): RTreeRangeSearchResult {
    return this.query(input);
  }

  getViewModel(): RTreeViewModel {
    return createRTreeViewModel(this.tree.getRoot());
  }

  reset() {
    this.tree = new RTree(this.maxEntries, this.minEntries);
  }

  private query(input: Rect): RTreeSearchResult {
    const result = this.tree.search(input);
    const events: AnimationEvent[] = [];

    for (const nodeId of result.visitedNodeIds) {
      events.push({
        type: 'rtree_visit_node',
        nodeId,
        rect: input,
      });
    }

    for (const nodeId of result.prunedNodeIds) {
      events.push({
        type: 'rtree_prune_node',
        nodeId,
        rect: input,
      });
    }

    for (const entry of result.entries) {
      events.push({
        type: 'rtree_search_hit',
        nodeId: result.visitedNodeIds[result.visitedNodeIds.length - 1] ?? this.tree.getRoot().id,
        entryId: entry.id,
        rect: entry.rect,
      });
    }

    if (result.entries.length === 0) {
      events.push({
        type: 'rtree_search_miss',
        nodeId: this.tree.getRoot().id,
        rect: input,
      });
    }

    return {
      entries: result.entries,
      path: result.visitedNodeIds,
      events,
    };
  }
}
