import type { HashBucket, HashIndexViewModel } from './hashTypes';

const BUCKET_WIDTH = 520;
const BUCKET_HEIGHT = 62;
const BUCKET_GAP = 18;
const PADDING = 48;

export function createHashIndexViewModel(buckets: HashBucket[]): HashIndexViewModel {
  const viewBuckets = buckets.map((bucket, index) => ({
    ...bucket,
    x: PADDING,
    y: PADDING + index * (BUCKET_HEIGHT + BUCKET_GAP),
    width: BUCKET_WIDTH,
    height: BUCKET_HEIGHT,
  }));

  return {
    indexType: 'hash',
    rootId: buckets[0]?.id ?? 'bucket-0',
    nodes: viewBuckets.map((bucket) => ({
      id: bucket.id,
      kind: 'bucket',
      keys: [...bucket.keys],
      x: bucket.x,
      y: bucket.y,
      bucketIndex: bucket.index,
    })),
    buckets: viewBuckets,
    bucketCount: buckets.length,
    hashFunction: `key % ${buckets.length}`,
    width: PADDING * 2 + BUCKET_WIDTH,
    height: PADDING * 2 + buckets.length * BUCKET_HEIGHT + Math.max(0, buckets.length - 1) * BUCKET_GAP,
  };
}
