import type { BPlusTreeViewModel, BPlusTreeViewNode } from '../core/bptree/viewModel';

interface BPlusTreeSvgProps {
  tree: BPlusTreeViewModel;
  highlightedNodeIds?: string[];
  rangeNodeIds?: string[];
  splitNodeIds?: string[];
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 56;
const NODE_RADIUS = 6;

function getNodeCenter(node: BPlusTreeViewNode) {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  };
}

function formatKeys(keys: number[]) {
  return keys.join(' | ');
}

export function BPlusTreeSvg({
  tree,
  highlightedNodeIds = [],
  rangeNodeIds = [],
  splitNodeIds = [],
}: BPlusTreeSvgProps) {
  const nodesById = new Map(tree.nodes.map((node) => [node.id, node]));
  const highlightedNodes = new Set(highlightedNodeIds);
  const rangeNodes = new Set(rangeNodeIds);
  const splitNodes = new Set(splitNodeIds);
  const highlightedEdges = new Set(
    highlightedNodeIds.slice(0, -1).map((nodeId, index) => `${nodeId}-${highlightedNodeIds[index + 1]}`),
  );
  const edges = tree.nodes.flatMap((node) =>
    (node.children ?? []).map((childId) => ({
      parent: node,
      child: nodesById.get(childId),
    })),
  );
  const leafLinks = tree.nodes
    .filter((node) => node.kind === 'leaf' && node.nextLeaf)
    .map((node) => ({
      from: node,
      to: nodesById.get(node.nextLeaf ?? ''),
    }));

  return (
    <svg
      className="bplus-tree-svg"
      viewBox={`0 0 ${tree.width} ${tree.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="B+ 树可视化示例"
    >
      <defs>
        <marker
          id="leaf-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
          viewBox="0 0 8 8"
        >
          <path d="M0,0 L8,4 L0,8 Z" />
        </marker>
      </defs>

      <g className="tree-edges">
        {edges.map(({ parent, child }) => {
          if (!child) {
            return null;
          }

          const parentCenter = getNodeCenter(parent);
          const childCenter = getNodeCenter(child);

          return (
            <line
              key={`${parent.id}-${child.id}`}
              className={`tree-edge ${highlightedEdges.has(`${parent.id}-${child.id}`) ? 'tree-edge-highlighted' : ''}`}
              x1={parentCenter.x}
              y1={parent.y + NODE_HEIGHT}
              x2={childCenter.x}
              y2={child.y}
            />
          );
        })}
      </g>

      <g className="leaf-links">
        {leafLinks.map(({ from, to }) => {
          if (!to) {
            return null;
          }

          return (
            <line
              key={`${from.id}-${to.id}`}
              className="leaf-link"
              markerEnd="url(#leaf-arrow)"
              x1={from.x + NODE_WIDTH + 12}
              y1={from.y + NODE_HEIGHT / 2}
              x2={to.x - 12}
              y2={to.y + NODE_HEIGHT / 2}
            />
          );
        })}
      </g>

      <g className="tree-nodes">
        {tree.nodes.map((node) => (
          <g
            key={node.id}
            className={`tree-node ${node.kind === 'internal' ? 'tree-node-internal' : 'tree-node-leaf'} ${
              highlightedNodes.has(node.id) ? 'tree-node-highlighted' : ''
            } ${rangeNodes.has(node.id) ? 'tree-node-range' : ''} ${splitNodes.has(node.id) ? 'tree-node-split' : ''}`}
            transform={`translate(${node.x}, ${node.y})`}
          >
            <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx={NODE_RADIUS} />
            <text x={NODE_WIDTH / 2} y={NODE_HEIGHT / 2} dominantBaseline="middle" textAnchor="middle">
              {formatKeys(node.keys)}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
