import { chooseQuadrant, containsPoint, intersectsBounds, splitBounds } from './geometry';
import type {
  Bounds,
  Point,
  PointEntry,
  QuadTreeInsertResult,
  QuadTreeNode,
  QuadTreeOptions,
  QuadTreeQuadrant,
  QuadTreeSearchResult,
} from './quadtreeTypes';

const DEFAULT_WORLD_BOUNDS: Bounds = { x: 0, y: 0, width: 100, height: 100 };

export class QuadTree {
  private root: QuadTreeNode;

  private nextNodeId = 1;

  private nextPointId = 1;

  private readonly worldBounds: Bounds;

  private readonly capacity: number;

  private readonly maxDepth: number;

  constructor(options: QuadTreeOptions = {}) {
    this.worldBounds = { ...(options.worldBounds ?? DEFAULT_WORLD_BOUNDS) };
    this.capacity = options.capacity ?? 4;
    this.maxDepth = options.maxDepth ?? 6;

    if (!Number.isInteger(this.capacity) || this.capacity < 1) {
      throw new Error('QuadTree capacity must be a positive integer.');
    }

    if (!Number.isInteger(this.maxDepth) || this.maxDepth < 0) {
      throw new Error('QuadTree maxDepth must be a non-negative integer.');
    }

    this.root = this.createNode('root', this.worldBounds, 0, 'root', null);
  }

  getRoot() {
    return this.root;
  }

  getBounds() {
    return { ...this.worldBounds };
  }

  insert(input: PointEntry | Point): QuadTreeInsertResult {
    const point = this.normalizePoint(input);
    const result: QuadTreeInsertResult = {
      point,
      inserted: false,
      path: [],
      chosenQuadrants: [],
      splitNodeIds: [],
      redistributedPoints: [],
    };

    if (!containsPoint(this.worldBounds, point.point)) {
      return {
        ...result,
        rejectedPoint: point,
        reason: 'outside_world_bounds',
      };
    }

    this.insertIntoNode(this.root, point, result);
    return result;
  }

  search(query: Bounds): QuadTreeSearchResult {
    const points: PointEntry[] = [];
    const visitedNodeIds: string[] = [];
    const prunedNodeIds: string[] = [];

    this.searchNode(this.root, query, points, visitedNodeIds, prunedNodeIds);

    return { points, visitedNodeIds, prunedNodeIds };
  }

  reset() {
    this.nextNodeId = 1;
    this.nextPointId = 1;
    this.root = this.createNode('root', this.worldBounds, 0, 'root', null);
  }

  private insertIntoNode(node: QuadTreeNode, point: PointEntry, result: QuadTreeInsertResult): void {
    result.path.push(node.id);

    if (node.isLeaf) {
      node.points.push(point);
      result.inserted = true;
      result.insertedNodeId = node.id;

      if (node.points.length > this.capacity && node.depth < this.maxDepth) {
        this.splitNode(node, result);
      }

      return;
    }

    const quadrant = chooseQuadrant(node.bounds, point.point);
    const child = this.getChildForQuadrant(node, quadrant);
    result.chosenQuadrants.push({ nodeId: node.id, childNodeId: child.id, quadrant });
    this.insertIntoNode(child, point, result);
  }

  private splitNode(node: QuadTreeNode, result: QuadTreeInsertResult) {
    const quadrantBounds = splitBounds(node.bounds);
    node.isLeaf = false;
    node.children = (['nw', 'ne', 'sw', 'se'] as const).map((quadrant) =>
      this.createNode(this.createNodeId(), quadrantBounds[quadrant], node.depth + 1, quadrant, node),
    );
    result.splitNodeIds.push(node.id, ...node.children.map((child) => child.id));

    const points = node.points;
    node.points = [];

    for (const point of points) {
      const quadrant = chooseQuadrant(node.bounds, point.point);
      const child = this.getChildForQuadrant(node, quadrant);
      child.points.push(point);
      result.redistributedPoints.push({
        pointId: point.id,
        fromNodeId: node.id,
        toNodeId: child.id,
        quadrant,
      });
    }
  }

  private searchNode(
    node: QuadTreeNode,
    query: Bounds,
    points: PointEntry[],
    visitedNodeIds: string[],
    prunedNodeIds: string[],
  ) {
    if (!intersectsBounds(node.bounds, query)) {
      prunedNodeIds.push(node.id);
      return;
    }

    visitedNodeIds.push(node.id);

    for (const point of node.points) {
      if (containsPoint(query, point.point)) {
        points.push(point);
      }
    }

    for (const child of node.children) {
      this.searchNode(child, query, points, visitedNodeIds, prunedNodeIds);
    }
  }

  private normalizePoint(input: PointEntry | Point): PointEntry {
    if ('point' in input) {
      return {
        id: input.id,
        point: { ...input.point },
      };
    }

    const id = `point-${this.nextPointId}`;
    this.nextPointId += 1;

    return {
      id,
      point: { ...input },
    };
  }

  private getChildForQuadrant(node: QuadTreeNode, quadrant: Exclude<QuadTreeQuadrant, 'root'>) {
    const child = node.children.find((candidate) => candidate.quadrant === quadrant);

    if (!child) {
      throw new Error(`Missing quadtree child for quadrant ${quadrant}.`);
    }

    return child;
  }

  private createNode(
    id: string,
    bounds: Bounds,
    depth: number,
    quadrant: QuadTreeQuadrant,
    parent: QuadTreeNode | null,
  ): QuadTreeNode {
    return {
      id,
      bounds: { ...bounds },
      depth,
      quadrant,
      parent,
      points: [],
      children: [],
      isLeaf: true,
    };
  }

  private createNodeId() {
    const id = `quadtree-node-${this.nextNodeId}`;
    this.nextNodeId += 1;
    return id;
  }
}
