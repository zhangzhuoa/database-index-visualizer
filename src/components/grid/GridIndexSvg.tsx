import type { Bounds, GridIndexViewModel } from '../../core/grid';

interface GridIndexSvgProps {
  index: GridIndexViewModel;
  highlightedCellIds?: string[];
  prunedCellIds?: string[];
  highlightedPointIds?: string[];
  rejectedPointIds?: string[];
  queryBounds?: Bounds | null;
}

const PADDING = 32;
const PLANE_SIZE = 640;

export function GridIndexSvg({
  index,
  highlightedCellIds = [],
  prunedCellIds = [],
  highlightedPointIds = [],
  rejectedPointIds = [],
  queryBounds = null,
}: GridIndexSvgProps) {
  const highlightedCells = new Set(highlightedCellIds);
  const prunedCells = new Set(prunedCellIds);
  const highlightedPoints = new Set(highlightedPointIds);
  const rejectedPoints = new Set(rejectedPointIds);

  return (
    <svg
      className="grid-index-svg"
      viewBox={`0 0 ${index.width} ${index.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="网格索引空间可视化"
    >
      <rect className="grid-world" {...scaleBounds(index.bounds, index.bounds)} />

      <g className="grid-cells">
        {index.cells.map((cell) => {
          const position = scaleBounds(cell.bounds, index.bounds);

          return (
            <g
              key={cell.id}
              className={`grid-cell ${highlightedCells.has(cell.id) ? 'grid-cell-highlighted' : ''} ${
                prunedCells.has(cell.id) ? 'grid-cell-pruned' : ''
              }`}
            >
              <rect {...position} />
              {cell.entries.length > 0 ? (
                <text x={position.x + 6} y={position.y + 16}>
                  {cell.entries.length}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>

      {queryBounds ? <rect className="grid-query" {...scaleBounds(queryBounds, index.bounds)} /> : null}

      <g className="grid-points">
        {index.points.map((point) => {
          const position = scalePoint(point.point, index.bounds);
          const isHighlighted = highlightedPoints.has(point.id);
          const isRejected = rejectedPoints.has(point.id);

          return (
            <g
              key={point.id}
              className={`grid-point ${isHighlighted ? 'grid-point-hit' : ''} ${
                isRejected ? 'grid-point-rejected' : ''
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
  const xScale = (PLANE_SIZE - PADDING * 2) / worldBounds.width;
  const yScale = (PLANE_SIZE - PADDING * 2) / worldBounds.height;

  return {
    x: PADDING + (bounds.x - worldBounds.x) * xScale,
    y: PADDING + (bounds.y - worldBounds.y) * yScale,
    width: bounds.width * xScale,
    height: bounds.height * yScale,
  };
}

function scalePoint(point: { x: number; y: number }, worldBounds: Bounds) {
  const xScale = (PLANE_SIZE - PADDING * 2) / worldBounds.width;
  const yScale = (PLANE_SIZE - PADDING * 2) / worldBounds.height;

  return {
    x: PADDING + (point.x - worldBounds.x) * xScale,
    y: PADDING + (point.y - worldBounds.y) * yScale,
  };
}

function compactPointId(id: string) {
  return id.replace('point-', '#');
}
