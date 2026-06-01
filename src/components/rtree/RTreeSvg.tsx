import type { Rect, RTreeViewModel, RTreeViewNode } from '../../core/rtree';

interface RTreeSvgProps {
  tree: RTreeViewModel;
  highlightedNodeIds?: string[];
  prunedNodeIds?: string[];
  splitNodeIds?: string[];
  highlightedEntryIds?: string[];
  queryRect?: Rect | null;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 108;
const NODE_RADIUS = 6;
const PREVIEW_X = 18;
const PREVIEW_Y = 34;
const PREVIEW_WIDTH = 184;
const PREVIEW_HEIGHT = 54;

export function RTreeSvg({
  tree,
  highlightedNodeIds = [],
  prunedNodeIds = [],
  splitNodeIds = [],
  highlightedEntryIds = [],
  queryRect = null,
}: RTreeSvgProps) {
  const nodesById = new Map(tree.nodes.map((node) => [node.id, node]));
  const highlightedNodes = new Set(highlightedNodeIds);
  const prunedNodes = new Set(prunedNodeIds);
  const splitNodes = new Set(splitNodeIds);
  const highlightedEntries = new Set(highlightedEntryIds);
  const highlightedEdges = new Set(
    highlightedNodeIds.slice(0, -1).map((nodeId, index) => `${nodeId}-${highlightedNodeIds[index + 1]}`),
  );
  const edges = tree.nodes.flatMap((node) =>
    (node.children ?? []).map((childId) => ({
      parent: node,
      child: nodesById.get(childId),
    })),
  );
  const worldBounds = getWorldBounds(tree, queryRect);

  return (
    <svg
      className="rtree-svg"
      viewBox={`0 0 ${tree.width} ${tree.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="R 树空间索引可视化"
    >
      <g className="rtree-edges">
        {edges.map(({ parent, child }) => {
          if (!child) {
            return null;
          }

          const edgeKey = `${parent.id}-${child.id}`;
          return (
            <line
              key={edgeKey}
              className={`tree-edge ${highlightedEdges.has(edgeKey) ? 'tree-edge-highlighted' : ''}`}
              x1={parent.x + NODE_WIDTH / 2}
              y1={parent.y + NODE_HEIGHT}
              x2={child.x + NODE_WIDTH / 2}
              y2={child.y}
            />
          );
        })}
      </g>

      <g className="rtree-nodes">
        {tree.nodes.map((node) => (
          <RTreeNodePreview
            key={node.id}
            node={node}
            nodesById={nodesById}
            bounds={worldBounds}
            highlighted={highlightedNodes.has(node.id)}
            pruned={prunedNodes.has(node.id)}
            split={splitNodes.has(node.id)}
            highlightedEntries={highlightedEntries}
            queryRect={queryRect}
          />
        ))}
      </g>
    </svg>
  );
}

interface RTreeNodePreviewProps {
  node: RTreeViewNode;
  nodesById: Map<string, RTreeViewNode>;
  bounds: Rect;
  highlighted: boolean;
  pruned: boolean;
  split: boolean;
  highlightedEntries: Set<string>;
  queryRect: Rect | null;
}

function RTreeNodePreview({
  node,
  nodesById,
  bounds,
  highlighted,
  pruned,
  split,
  highlightedEntries,
  queryRect,
}: RTreeNodePreviewProps) {
  const childRects = (node.children ?? [])
    .map((childId) => nodesById.get(childId))
    .filter((child): child is RTreeViewNode => Boolean(child?.mbr))
    .map((child) => ({ id: child.id, rect: child.mbr as Rect }));
  const entryRects = (node.entries ?? []).map((entry) => ({ id: entry.id, rect: entry.rect }));
  const previewRects = node.kind === 'internal' ? childRects : entryRects;

  return (
    <g
      className={`rtree-node ${node.kind === 'internal' ? 'rtree-node-internal' : 'rtree-node-leaf'} ${
        highlighted ? 'rtree-node-highlighted' : ''
      } ${pruned ? 'rtree-node-pruned' : ''} ${split ? 'rtree-node-split' : ''}`}
      transform={`translate(${node.x}, ${node.y})`}
    >
      <rect className="rtree-node-frame" width={NODE_WIDTH} height={NODE_HEIGHT} rx={NODE_RADIUS} />
      <text className="rtree-node-title" x={14} y={20}>
        {node.kind === 'internal' ? 'Internal' : 'Leaf'} {compactId(node.id)}
      </text>
      <text className="rtree-node-meta" x={NODE_WIDTH - 14} y={20} textAnchor="end">
        {node.kind === 'internal' ? `${node.children?.length ?? 0} children` : `${node.entries?.length ?? 0} entries`}
      </text>
      <rect className="rtree-preview-plane" x={PREVIEW_X} y={PREVIEW_Y} width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} rx={4} />

      {node.mbr ? (
        <rect className="rtree-mbr" {...scaleRect(node.mbr, bounds)} />
      ) : (
        <text className="rtree-empty-label" x={NODE_WIDTH / 2} y={PREVIEW_Y + PREVIEW_HEIGHT / 2} textAnchor="middle" dominantBaseline="middle">
          empty
        </text>
      )}

      {queryRect ? <rect className="rtree-query-rect" {...scaleRect(queryRect, bounds)} /> : null}

      {previewRects.map(({ id, rect }) => (
        <rect
          key={id}
          className={`${node.kind === 'internal' ? 'rtree-child-mbr' : 'rtree-entry-rect'} ${
            highlightedEntries.has(id) ? 'rtree-entry-hit' : ''
          }`}
          {...scaleRect(rect, bounds)}
        />
      ))}
    </g>
  );
}

function getWorldBounds(tree: RTreeViewModel, queryRect: Rect | null): Rect {
  const rects = [
    ...tree.nodes.flatMap((node) => (node.mbr ? [node.mbr] : [])),
    ...tree.entries.map((entry) => entry.rect),
    ...(queryRect ? [queryRect] : []),
  ];

  if (rects.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function scaleRect(rect: Rect, bounds: Rect) {
  const xScale = PREVIEW_WIDTH / bounds.width;
  const yScale = PREVIEW_HEIGHT / bounds.height;

  return {
    x: PREVIEW_X + (rect.x - bounds.x) * xScale,
    y: PREVIEW_Y + (rect.y - bounds.y) * yScale,
    width: Math.max(rect.width * xScale, 3),
    height: Math.max(rect.height * yScale, 3),
  };
}

function compactId(id: string) {
  if (id === 'root') {
    return 'root';
  }

  return id.replace('rtree-node-', '#');
}
