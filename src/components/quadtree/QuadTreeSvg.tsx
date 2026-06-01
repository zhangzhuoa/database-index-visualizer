import type { Bounds, QuadTreeViewModel } from '../../core/quadtree';

interface QuadTreeSvgProps {
  tree: QuadTreeViewModel;
  highlightedNodeIds?: string[];
  prunedNodeIds?: string[];
  splitNodeIds?: string[];
  highlightedPointIds?: string[];
  rejectedPointIds?: string[];
  queryBounds?: Bounds | null;
}

const PADDING = 32;

export function QuadTreeSvg({
  tree,
  highlightedNodeIds = [],
  prunedNodeIds = [],
  splitNodeIds = [],
  highlightedPointIds = [],
  rejectedPointIds = [],
  queryBounds = null,
}: QuadTreeSvgProps) {
  const highlightedNodes = new Set(highlightedNodeIds);
  const prunedNodes = new Set(prunedNodeIds);
  const splitNodes = new Set(splitNodeIds);
  const highlightedPoints = new Set(highlightedPointIds);
  const rejectedPoints = new Set(rejectedPointIds);

  return (
    <svg
      className="quadtree-svg"
      viewBox={`0 0 ${tree.width} ${tree.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="四叉树空间索引可视化"
    >
      <rect className="quadtree-world" {...scaleBounds(tree.bounds, tree.bounds)} />

      <g className="quadtree-cells">
        {tree.nodes.map((node) => (
          <rect
            key={node.id}
            className={`quadtree-cell ${node.isLeaf ? 'quadtree-cell-leaf' : 'quadtree-cell-internal'} ${
              highlightedNodes.has(node.id) ? 'quadtree-cell-highlighted' : ''
            } ${prunedNodes.has(node.id) ? 'quadtree-cell-pruned' : ''} ${
              splitNodes.has(node.id) ? 'quadtree-cell-split' : ''
            }`}
            {...scaleBounds(node.bounds, tree.bounds)}
          />
        ))}
      </g>

      {queryBounds ? <rect className="quadtree-query" {...scaleBounds(queryBounds, tree.bounds)} /> : null}

      <g className="quadtree-points">
        {tree.points.map((point) => {
          const position = scalePoint(point.point, tree.bounds);
          const isHighlighted = highlightedPoints.has(point.id);
          const isRejected = rejectedPoints.has(point.id);

          return (
            <g
              key={point.id}
              className={`quadtree-point ${isHighlighted ? 'quadtree-point-hit' : ''} ${
                isRejected ? 'quadtree-point-rejected' : ''
              }`}
              transform={`translate(${position.x}, ${position.y})`}
            >
              <circle r={5} />
              <text x={8} y={-8}>
                {compactPointId(point.id)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function scaleBounds(bounds: Bounds, worldBounds: Bounds) {
  const xScale = (640 - PADDING * 2) / worldBounds.width;
  const yScale = (640 - PADDING * 2) / worldBounds.height;

  return {
    x: PADDING + (bounds.x - worldBounds.x) * xScale,
    y: PADDING + (bounds.y - worldBounds.y) * yScale,
    width: bounds.width * xScale,
    height: bounds.height * yScale,
  };
}

function scalePoint(point: { x: number; y: number }, worldBounds: Bounds) {
  const xScale = (640 - PADDING * 2) / worldBounds.width;
  const yScale = (640 - PADDING * 2) / worldBounds.height;

  return {
    x: PADDING + (point.x - worldBounds.x) * xScale,
    y: PADDING + (point.y - worldBounds.y) * yScale,
  };
}

function compactPointId(id: string) {
  return id.replace('point-', '#');
}
