export interface HashBucket {
  id: string;
  index: number;
  keys: number[];
}

export interface HashIndexViewBucket extends HashBucket {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HashIndexViewNode {
  id: string;
  kind: 'bucket';
  keys: number[];
  x: number;
  y: number;
  bucketIndex: number;
}

export interface HashIndexViewModel {
  indexType: 'hash';
  rootId: string;
  nodes: HashIndexViewNode[];
  buckets: HashIndexViewBucket[];
  bucketCount: number;
  hashFunction: string;
  width: number;
  height: number;
}
