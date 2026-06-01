import type { HashIndexViewModel } from '../../core/hash';

interface HashIndexSvgProps {
  index: HashIndexViewModel;
  highlightedNodeIds?: string[];
  highlightedKey?: number | null;
  searchStatus?: 'hit' | 'miss' | null;
}

const KEY_WIDTH = 48;
const KEY_HEIGHT = 32;
const KEY_GAP = 18;
const LABEL_WIDTH = 112;
const BUCKET_RADIUS = 6;

export function HashIndexSvg({
  index,
  highlightedNodeIds = [],
  highlightedKey = null,
  searchStatus = null,
}: HashIndexSvgProps) {
  const highlightedBuckets = new Set(highlightedNodeIds);

  return (
    <svg
      className="hash-index-svg"
      viewBox={`0 0 ${index.width} ${index.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="静态哈希索引可视化"
    >
      <g className="hash-buckets">
        {index.buckets.map((bucket) => {
          const isHighlighted = highlightedBuckets.has(bucket.id);

          return (
            <g
              key={bucket.id}
              className={`hash-bucket ${isHighlighted ? 'hash-bucket-highlighted' : ''} ${
                searchStatus === 'miss' && isHighlighted ? 'hash-bucket-miss' : ''
              }`}
              transform={`translate(${bucket.x}, ${bucket.y})`}
            >
              <rect className="hash-bucket-frame" width={bucket.width} height={bucket.height} rx={BUCKET_RADIUS} />
              <text className="hash-bucket-label" x={24} y={bucket.height / 2} dominantBaseline="middle">
                bucket {bucket.index}
              </text>
              <line className="hash-bucket-divider" x1={LABEL_WIDTH} y1={0} x2={LABEL_WIDTH} y2={bucket.height} />
              {bucket.keys.length === 0 ? (
                <text className="hash-bucket-empty" x={LABEL_WIDTH + 24} y={bucket.height / 2} dominantBaseline="middle">
                  空
                </text>
              ) : (
                bucket.keys.map((key, index) => {
                  const x = LABEL_WIDTH + 18 + index * (KEY_WIDTH + KEY_GAP);
                  const isKeyHighlighted = highlightedKey === key && isHighlighted;
                  const keyStatusClass =
                    isKeyHighlighted && searchStatus === 'hit'
                      ? 'hash-key-hit'
                      : isKeyHighlighted
                        ? 'hash-key-highlighted'
                        : '';

                  return (
                    <g
                      key={`${bucket.id}-${key}-${index}`}
                      className={`hash-key ${keyStatusClass}`}
                      transform={`translate(${x}, 15)`}
                    >
                      <rect width={KEY_WIDTH} height={KEY_HEIGHT} rx={4} />
                      <text x={KEY_WIDTH / 2} y={KEY_HEIGHT / 2} dominantBaseline="middle" textAnchor="middle">
                        {key}
                      </text>
                      {index < bucket.keys.length - 1 ? (
                        <text className="hash-chain-arrow" x={KEY_WIDTH + 6} y={KEY_HEIGHT / 2} dominantBaseline="middle">
                          {'->'}
                        </text>
                      ) : null}
                    </g>
                  );
                })
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
