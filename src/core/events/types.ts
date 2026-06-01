export type AnimationEventType =
  | 'visit-node'
  | 'insert-key'
  | 'split-node'
  | 'promote-key'
  | 'search-hit'
  | 'search-miss'
  | 'range-scan'
  | 'compute_hash'
  | 'highlight_bucket'
  | 'insert_key'
  | 'scan_key'
  | 'search_success'
  | 'search_failed'
  | 'rtree_choose_subtree'
  | 'rtree_expand_mbr'
  | 'rtree_insert_entry'
  | 'rtree_split_node'
  | 'rtree_create_root'
  | 'rtree_visit_node'
  | 'rtree_prune_node'
  | 'rtree_search_hit'
  | 'rtree_search_miss'
  | 'quadtree_visit_node'
  | 'quadtree_choose_quadrant'
  | 'quadtree_insert_point'
  | 'quadtree_split_node'
  | 'quadtree_redistribute_point'
  | 'quadtree_query_visit'
  | 'quadtree_query_prune'
  | 'quadtree_query_hit'
  | 'quadtree_query_miss'
  | 'quadtree_reject_point'
  | 'grid_compute_cell'
  | 'grid_highlight_cell'
  | 'grid_insert_point'
  | 'grid_reject_point'
  | 'grid_query_start'
  | 'grid_query_visit_cell'
  | 'grid_query_prune_cell'
  | 'grid_query_scan_point'
  | 'grid_query_hit'
  | 'grid_query_miss';

export interface AnimationEvent {
  type: AnimationEventType;
  nodeId: string;
  key?: number;
  keys?: number[];
  promotedKey?: number;
  leftNodeId?: string;
  rightNodeId?: string;
  bucketIndex?: number;
  hashValue?: number;
  scannedKey?: number;
  entryId?: string;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  mbr?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  candidateNodeIds?: string[];
  chosenNodeId?: string;
  resultEntryIds?: string[];
  pointId?: string;
  point?: {
    x: number;
    y: number;
  };
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  queryBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quadrant?: 'nw' | 'ne' | 'sw' | 'se';
  childNodeIds?: string[];
  resultPointIds?: string[];
  cellId?: string;
  row?: number;
  col?: number;
  reason?: string;
}
