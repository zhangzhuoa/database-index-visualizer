import type { HashBucket } from './hashTypes';

export class HashIndex {
  private buckets: HashBucket[];

  constructor(private readonly bucketCount = 8) {
    if (!Number.isInteger(bucketCount) || bucketCount < 1) {
      throw new Error('Hash index bucket count must be a positive integer.');
    }

    this.buckets = this.createBuckets();
  }

  getBucketCount() {
    return this.bucketCount;
  }

  getBuckets() {
    return this.buckets.map((bucket) => ({
      ...bucket,
      keys: [...bucket.keys],
    }));
  }

  hash(key: number) {
    return key % this.bucketCount;
  }

  insert(key: number) {
    const bucketIndex = this.hash(key);
    const bucket = this.buckets[bucketIndex];

    bucket.keys.push(key);

    return {
      bucketIndex,
      bucket: {
        ...bucket,
        keys: [...bucket.keys],
      },
    };
  }

  search(key: number) {
    const bucketIndex = this.hash(key);
    const bucket = this.buckets[bucketIndex];
    const scannedKeys: number[] = [];
    let found = false;

    for (const currentKey of bucket.keys) {
      scannedKeys.push(currentKey);

      if (currentKey === key) {
        found = true;
        break;
      }
    }

    return {
      found,
      bucketIndex,
      bucket: {
        ...bucket,
        keys: [...bucket.keys],
      },
      scannedKeys,
    };
  }

  reset() {
    this.buckets = this.createBuckets();
  }

  private createBuckets() {
    return Array.from({ length: this.bucketCount }, (_, index) => ({
      id: `bucket-${index}`,
      index,
      keys: [],
    }));
  }
}
