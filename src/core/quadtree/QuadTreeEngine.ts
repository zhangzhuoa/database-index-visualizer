import type { AnimationEvent, AnimationResult, IndexEngine } from '../common';
import { QuadTree } from './QuadTree';
import type { Bounds, Point, PointEntry, QuadTreeOptions, QuadTreeViewModel } from './quadtreeTypes';
import { createQuadTreeViewModel } from './viewModel';

export type QuadTreeInsertInput = PointEntry | Point;
export type QuadTreeSearchInput = Bounds;
export type QuadTreeRangeSearchInput = Bounds;

export type QuadTreeInsertResult = AnimationResult<{
  point: PointEntry;
  inserted: boolean;
}>;

export type QuadTreeSearchResult = AnimationResult<{
  points: PointEntry[];
  path: string[];
}>;

export type QuadTreeRangeSearchResult = QuadTreeSearchResult;

export type QuadTreeIndexEngine = IndexEngine<
  'quadtree',
  QuadTreeInsertInput,
  QuadTreeSearchInput,
  QuadTreeRangeSearchInput,
  { point: PointEntry; inserted: boolean },
  { points: PointEntry[]; path: string[] },
  { points: PointEntry[]; path: string[] },
  QuadTreeViewModel
>;

export class QuadTreeEngine implements QuadTreeIndexEngine {
  private tree: QuadTree;

  constructor(private readonly options: QuadTreeOptions = {}) {
    this.tree = new QuadTree(options);
  }

  getType() {
    return 'quadtree' as const;
  }

  insert(input: QuadTreeInsertInput): QuadTreeInsertResult {
    const result = this.tree.insert(input);
    const events: AnimationEvent[] = [];

    for (const nodeId of result.path) {
      events.push({
        type: 'quadtree_visit_node',
        nodeId,
        pointId: result.point.id,
        point: result.point.point,
      });
    }

    for (const choice of result.chosenQuadrants) {
      events.push({
        type: 'quadtree_choose_quadrant',
        nodeId: choice.nodeId,
        chosenNodeId: choice.childNodeId,
        quadrant: choice.quadrant,
        pointId: result.point.id,
        point: result.point.point,
      });
    }

    if (result.rejectedPoint) {
      events.push({
        type: 'quadtree_reject_point',
        nodeId: this.tree.getRoot().id,
        pointId: result.rejectedPoint.id,
        point: result.rejectedPoint.point,
        reason: result.reason,
      });
    } else if (result.insertedNodeId) {
      events.push({
        type: 'quadtree_insert_point',
        nodeId: result.insertedNodeId,
        pointId: result.point.id,
        point: result.point.point,
      });
    }

    if (result.splitNodeIds.length > 0) {
      events.push({
        type: 'quadtree_split_node',
        nodeId: result.splitNodeIds[0],
        childNodeIds: result.splitNodeIds.slice(1),
      });
    }

    for (const redistributed of result.redistributedPoints) {
      events.push({
        type: 'quadtree_redistribute_point',
        nodeId: redistributed.toNodeId,
        pointId: redistributed.pointId,
        quadrant: redistributed.quadrant,
      });
    }

    return {
      point: result.point,
      inserted: result.inserted,
      events,
    };
  }

  search(input: QuadTreeSearchInput): QuadTreeSearchResult {
    return this.query(input);
  }

  rangeSearch(input: QuadTreeRangeSearchInput): QuadTreeRangeSearchResult {
    return this.query(input);
  }

  getViewModel(): QuadTreeViewModel {
    return createQuadTreeViewModel(this.tree.getRoot());
  }

  reset() {
    this.tree = new QuadTree(this.options);
  }

  private query(input: Bounds): QuadTreeSearchResult {
    const result = this.tree.search(input);
    const events: AnimationEvent[] = [];

    for (const nodeId of result.visitedNodeIds) {
      events.push({
        type: 'quadtree_query_visit',
        nodeId,
        queryBounds: input,
      });
    }

    for (const nodeId of result.prunedNodeIds) {
      events.push({
        type: 'quadtree_query_prune',
        nodeId,
        queryBounds: input,
      });
    }

    for (const point of result.points) {
      events.push({
        type: 'quadtree_query_hit',
        nodeId: result.visitedNodeIds[result.visitedNodeIds.length - 1] ?? this.tree.getRoot().id,
        pointId: point.id,
        point: point.point,
        queryBounds: input,
      });
    }

    if (result.points.length === 0) {
      events.push({
        type: 'quadtree_query_miss',
        nodeId: this.tree.getRoot().id,
        queryBounds: input,
      });
    }

    return {
      points: result.points,
      path: result.visitedNodeIds,
      events,
    };
  }
}
