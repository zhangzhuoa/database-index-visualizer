import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { BPlusTreeSvg } from '../components/BPlusTreeSvg';
import { GridIndexSvg } from '../components/grid/GridIndexSvg';
import { HashIndexSvg } from '../components/hash/HashIndexSvg';
import { QuadTreeSvg } from '../components/quadtree/QuadTreeSvg';
import { RTreeSvg } from '../components/rtree/RTreeSvg';
import { VisualizationArea } from '../components/VisualizationArea';
import { BPlusTreeEngine } from '../core/bptree';
import type { AnimationEvent } from '../core/common';
import { GridIndexEngine } from '../core/grid';
import type { Bounds as GridBounds, GridPointEntry } from '../core/grid';
import { HashIndexEngine } from '../core/hash';
import { QuadTreeEngine } from '../core/quadtree';
import type { Bounds, Point, PointEntry } from '../core/quadtree';
import { RTreeEngine } from '../core/rtree';
import type { Rect, SpatialEntry } from '../core/rtree';
import { getIndexTypeLabel, INDEX_TYPE_OPTIONS } from './indexTypeOptions';
import type { SelectableIndexType } from './indexTypeOptions';
import { DEMO_SCENARIOS, INDEX_OPERATION_CONFIG } from './showcaseConfig';
import type { DemoScenario, ShowcaseOperationKind } from './showcaseConfig';

const DEFAULT_ANIMATION_STEP_MS = 650;
const ACTIVE_INDEX_TYPE: SelectableIndexType = 'bptree';
const ANIMATION_SPEED_OPTIONS = [
  { label: '慢速', value: 1000 },
  { label: '标准', value: DEFAULT_ANIMATION_STEP_MS },
  { label: '快速', value: 320 },
];

type ActiveIndexType = 'bptree' | 'hash' | 'rtree' | 'quadtree' | 'grid';
type HashSearchStatus = 'hit' | 'miss' | null;

interface AnimationVisualState {
  highlightedNodeIds: string[];
  rangeNodeIds: string[];
  splitNodeIds: string[];
  hashHighlightedKey: number | null;
  hashSearchStatus: HashSearchStatus;
  rtreePrunedNodeIds: string[];
  rtreeHighlightedEntryIds: string[];
  quadPrunedNodeIds: string[];
  quadHighlightedPointIds: string[];
  quadRejectedPointIds: string[];
  gridPrunedCellIds: string[];
  gridHighlightedPointIds: string[];
  gridRejectedPointIds: string[];
}

export function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [selectedIndexType, setSelectedIndexType] = useState<SelectableIndexType>(ACTIVE_INDEX_TYPE);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [rangeNodeIds, setRangeNodeIds] = useState<string[]>([]);
  const [splitNodeIds, setSplitNodeIds] = useState<string[]>([]);
  const [hashHighlightedKey, setHashHighlightedKey] = useState<number | null>(null);
  const [hashSearchStatus, setHashSearchStatus] = useState<HashSearchStatus>(null);
  const [rtreePrunedNodeIds, setRtreePrunedNodeIds] = useState<string[]>([]);
  const [rtreeHighlightedEntryIds, setRtreeHighlightedEntryIds] = useState<string[]>([]);
  const [rtreeQueryRect, setRtreeQueryRect] = useState<Rect | null>(null);
  const [quadPrunedNodeIds, setQuadPrunedNodeIds] = useState<string[]>([]);
  const [quadHighlightedPointIds, setQuadHighlightedPointIds] = useState<string[]>([]);
  const [quadRejectedPointIds, setQuadRejectedPointIds] = useState<string[]>([]);
  const [quadQueryBounds, setQuadQueryBounds] = useState<Bounds | null>(null);
  const [gridPrunedCellIds, setGridPrunedCellIds] = useState<string[]>([]);
  const [gridHighlightedPointIds, setGridHighlightedPointIds] = useState<string[]>([]);
  const [gridRejectedPointIds, setGridRejectedPointIds] = useState<string[]>([]);
  const [gridQueryBounds, setGridQueryBounds] = useState<GridBounds | null>(null);
  const [operationMessage, setOperationMessage] = useState('请输入 key、矩形或点对象，然后选择操作。');
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationEvents, setAnimationEvents] = useState<AnimationEvent[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [finalAnimationMessage, setFinalAnimationMessage] = useState('');
  const [animationStepMs, setAnimationStepMs] = useState(DEFAULT_ANIMATION_STEP_MS);
  const [selectedDemoId, setSelectedDemoId] = useState('');
  const [hasIndexContent, setHasIndexContent] = useState<Record<ActiveIndexType, boolean>>({
    bptree: false,
    hash: false,
    rtree: false,
    quadtree: false,
    grid: false,
  });
  const [treeVersion, setTreeVersion] = useState(0);
  const bplusTreeRef = useRef<BPlusTreeEngine | null>(null);
  const hashIndexRef = useRef<HashIndexEngine | null>(null);
  const rtreeRef = useRef<RTreeEngine | null>(null);
  const quadTreeRef = useRef<QuadTreeEngine | null>(null);
  const gridIndexRef = useRef<GridIndexEngine | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bplusTree = bplusTreeRef.current ?? new BPlusTreeEngine(4);
  bplusTreeRef.current = bplusTree;
  const hashIndex = hashIndexRef.current ?? new HashIndexEngine(8);
  hashIndexRef.current = hashIndex;
  const rtree = rtreeRef.current ?? new RTreeEngine();
  rtreeRef.current = rtree;
  const quadTree = quadTreeRef.current ?? new QuadTreeEngine();
  quadTreeRef.current = quadTree;
  const gridIndex = gridIndexRef.current ?? new GridIndexEngine();
  gridIndexRef.current = gridIndex;

  const activeIndexType = getActiveIndexType(selectedIndexType);
  const activeOperationConfig = INDEX_OPERATION_CONFIG[activeIndexType];
  const activeDemoScenarios = DEMO_SCENARIOS.filter((scenario) => scenario.indexType === activeIndexType);
  const currentAnimationEvent = currentStepIndex >= 0 ? animationEvents[currentStepIndex] : null;
  const canStepBackward = currentStepIndex > 0;
  const canStepForward = animationEvents.length > 0 && currentStepIndex < animationEvents.length - 1;

  const treeViewModel = useMemo(() => {
    if (!hasIndexContent.bptree) {
      return null;
    }

    return bplusTree.getViewModel();
  }, [bplusTree, hasIndexContent.bptree, treeVersion]);

  const hashViewModel = useMemo(() => {
    if (!hasIndexContent.hash) {
      return null;
    }

    return hashIndex.getViewModel();
  }, [hashIndex, hasIndexContent.hash, treeVersion]);

  const rtreeViewModel = useMemo(() => {
    if (!hasIndexContent.rtree) {
      return null;
    }

    return rtree.getViewModel();
  }, [hasIndexContent.rtree, rtree, treeVersion]);

  const quadTreeViewModel = useMemo(() => {
    if (!hasIndexContent.quadtree) {
      return null;
    }

    return quadTree.getViewModel();
  }, [hasIndexContent.quadtree, quadTree, treeVersion]);

  const gridViewModel = useMemo(() => {
    if (!hasIndexContent.grid) {
      return null;
    }

    return gridIndex.getViewModel();
  }, [gridIndex, hasIndexContent.grid, treeVersion]);

  useEffect(() => {
    return () => {
      clearPlaybackTimer(playbackTimerRef);
    };
  }, []);

  useEffect(() => {
    if (currentStepIndex < 0) {
      return;
    }

    applyVisualState(deriveAnimationVisualState(animationEvents, currentStepIndex));

    const currentEvent = animationEvents[currentStepIndex];
    if (currentEvent) {
      setOperationMessage(`步骤 ${currentStepIndex + 1}/${animationEvents.length}：${describeAnimationEvent(currentEvent)}`);
    }
  }, [animationEvents, currentStepIndex]);

  useEffect(() => {
    clearPlaybackTimer(playbackTimerRef);

    if (!isPlaying) {
      return;
    }

    if (animationEvents.length === 0) {
      setIsPlaying(false);
      setOperationMessage(finalAnimationMessage || '当前没有可播放的动画事件。');
      return;
    }

    if (currentStepIndex >= animationEvents.length - 1) {
      playbackTimerRef.current = setTimeout(() => {
        setOperationMessage(finalAnimationMessage);
        setIsPlaying(false);
      }, animationStepMs);
      return;
    }

    playbackTimerRef.current = setTimeout(() => {
      setCurrentStepIndex((stepIndex) => Math.min(stepIndex + 1, animationEvents.length - 1));
    }, animationStepMs);
  }, [animationEvents.length, animationStepMs, currentStepIndex, finalAnimationMessage, isPlaying]);

  const handleInsert = () => {
    setSelectedDemoId('');

    if (activeIndexType === 'rtree') {
      const rects = parseRects(inputValue);
      if (rects.length === 0) {
        clearHighlights();
        setOperationMessage('请输入矩形，格式如 x,y,width,height；多个矩形用分号分隔。');
        return;
      }

      setRtreeQueryRect(null);
      const events = rects.flatMap((rect) => rtree.insert(rect).events);
      setHasIndexContent((content) => ({ ...content, rtree: true }));
      setTreeVersion((version) => version + 1);
      playAnimation(events, createRTreeInsertMessage(rects, findLastEvent(events, 'rtree_split_node')));
      return;
    }

    if (activeIndexType === 'quadtree') {
      const points = parsePoints(inputValue);
      if (points.length === 0) {
        clearHighlights();
        setOperationMessage('请输入点，格式如 x,y；多个点用分号分隔。');
        return;
      }

      setQuadQueryBounds(null);
      const results = points.map((point) => quadTree.insert(point));
      const events = results.flatMap((result) => result.events);
      setHasIndexContent((content) => ({ ...content, quadtree: content.quadtree || results.some((result) => result.inserted) }));
      setTreeVersion((version) => version + 1);
      playAnimation(events, createQuadTreeInsertMessage(results.map((result) => result.point), results.some((result) => !result.inserted)));
      return;
    }

    if (activeIndexType === 'grid') {
      const points = parsePoints(inputValue);
      if (points.length === 0) {
        clearHighlights();
        setOperationMessage('请输入点，格式如 x,y；多个点用分号分隔。');
        return;
      }

      setGridQueryBounds(null);
      const results = points.map((point) => gridIndex.insert(point));
      const events = results.flatMap((result) => result.events);
      setHasIndexContent((content) => ({ ...content, grid: content.grid || results.some((result) => result.inserted) }));
      setTreeVersion((version) => version + 1);
      playAnimation(events, createGridIndexInsertMessage(results.map((result) => result.point), results.some((result) => !result.inserted)));
      return;
    }

    const keys = parseKeys(inputValue);
    if (keys.length === 0) {
      clearHighlights();
      setOperationMessage('请输入一个或多个数字 key。');
      return;
    }

    const events =
      activeIndexType === 'hash'
        ? keys.flatMap((key) => hashIndex.insert(key).events)
        : keys.flatMap((key) => bplusTree.insert(key).events);
    setHasIndexContent((content) => ({ ...content, [activeIndexType]: true }));
    setTreeVersion((version) => version + 1);
    playAnimation(events, createKeyInsertMessage(activeIndexType, keys, findLastEvent(events, 'split-node')));
  };

  const handleSearch = () => {
    setSelectedDemoId('');

    if (!hasIndexContent[activeIndexType]) {
      clearHighlights();
      setOperationMessage(activeIndexType === 'bptree' || activeIndexType === 'hash' ? '请先插入 key，再执行查找。' : '请先插入空间对象，再执行查询。');
      return;
    }

    if (activeIndexType === 'rtree') {
      const rect = parseFirstRect(inputValue);
      if (!rect) {
        clearHighlights();
        setOperationMessage('请输入查询矩形，格式如 x,y,width,height。');
        return;
      }

      setRtreeQueryRect(rect);
      const result = rtree.search(rect);
      playAnimation(result.events, `R 树相交查询：命中 ${formatSpatialEntryIds(result.entries)}`);
      return;
    }

    if (activeIndexType === 'quadtree') {
      const bounds = parseFirstBounds(inputValue);
      if (!bounds) {
        clearHighlights();
        setOperationMessage('请输入查询范围，格式如 x,y,width,height。');
        return;
      }

      setQuadQueryBounds(bounds);
      const result = quadTree.search(bounds);
      playAnimation(result.events, `四叉树查询：命中 ${formatPointIds(result.points)}`);
      return;
    }

    if (activeIndexType === 'grid') {
      const bounds = parseFirstBounds(inputValue);
      if (!bounds) {
        clearHighlights();
        setOperationMessage('请输入查询范围，格式如 x,y,width,height。');
        return;
      }

      setGridQueryBounds(bounds);
      const result = gridIndex.search(bounds);
      playAnimation(result.events, `网格索引查询：命中 ${formatGridPointIds(result.points)}`);
      return;
    }

    const key = parseFirstKey(inputValue);
    if (key === null) {
      clearHighlights();
      setOperationMessage('请输入一个数字 key。');
      return;
    }

    const result = activeIndexType === 'hash' ? hashIndex.search(key) : bplusTree.search(key);
    playAnimation(result.events, result.found ? `查找 ${key}：命中` : `查找 ${key}：未命中`);
  };

  const handleRangeSearch = () => {
    setSelectedDemoId('');

    if (activeIndexType === 'hash') {
      clearHighlights();
      setOperationMessage('哈希索引不支持范围查询。');
      return;
    }

    if (!hasIndexContent[activeIndexType]) {
      clearHighlights();
      setOperationMessage(activeIndexType === 'bptree' ? '请先插入 key，再执行范围查询。' : '请先插入空间对象，再执行范围查询。');
      return;
    }

    if (activeIndexType === 'rtree') {
      const rect = parseFirstRect(inputValue);
      if (!rect) {
        clearHighlights();
        setOperationMessage('请输入查询矩形，格式如 x,y,width,height。');
        return;
      }

      setRtreeQueryRect(rect);
      const result = rtree.rangeSearch(rect);
      playAnimation(result.events, `R 树范围查询：命中 ${formatSpatialEntryIds(result.entries)}`);
      return;
    }

    if (activeIndexType === 'quadtree') {
      const bounds = parseFirstBounds(inputValue);
      if (!bounds) {
        clearHighlights();
        setOperationMessage('请输入查询范围，格式如 x,y,width,height。');
        return;
      }

      setQuadQueryBounds(bounds);
      const result = quadTree.rangeSearch(bounds);
      playAnimation(result.events, `四叉树范围查询：命中 ${formatPointIds(result.points)}`);
      return;
    }

    if (activeIndexType === 'grid') {
      const bounds = parseFirstBounds(inputValue);
      if (!bounds) {
        clearHighlights();
        setOperationMessage('请输入查询范围，格式如 x,y,width,height。');
        return;
      }

      setGridQueryBounds(bounds);
      const result = gridIndex.rangeSearch(bounds);
      playAnimation(result.events, `网格索引范围查询：命中 ${formatGridPointIds(result.points)}`);
      return;
    }

    const range = parseRange(inputValue);
    if (!range) {
      clearHighlights();
      setOperationMessage('请输入范围，例如 6, 17 或 [6, 17]。');
      return;
    }

    const result = bplusTree.rangeSearch(range);
    playAnimation(result.events, `范围查询 [${range.left}, ${range.right}]：${formatResultKeys(result.keys)}`);
  };

  const handleIndexTypeChange = (nextIndexType: SelectableIndexType) => {
    clearHighlights();
    const nextActiveIndexType = getActiveIndexType(nextIndexType);

    if (nextActiveIndexType === 'hash') {
      hashIndex.reset();
    } else if (nextActiveIndexType === 'rtree') {
      rtree.reset();
    } else if (nextActiveIndexType === 'quadtree') {
      quadTree.reset();
    } else if (nextActiveIndexType === 'grid') {
      gridIndex.reset();
    } else {
      bplusTree.reset();
    }

    setHasIndexContent((content) => ({ ...content, [nextActiveIndexType]: false }));
    setTreeVersion((version) => version + 1);
    setSelectedIndexType(nextIndexType);
    setSelectedDemoId('');
    setInputValue('');
    setOperationMessage(getOperationHint(nextActiveIndexType));
  };

  const clearHighlights = () => {
    clearPlaybackTimer(playbackTimerRef);
    setIsPlaying(false);
    setAnimationEvents([]);
    setCurrentStepIndex(-1);
    setFinalAnimationMessage('');
    setHighlightedNodeIds([]);
    setRangeNodeIds([]);
    setSplitNodeIds([]);
    setHashHighlightedKey(null);
    setHashSearchStatus(null);
    setRtreePrunedNodeIds([]);
    setRtreeHighlightedEntryIds([]);
    setRtreeQueryRect(null);
    setQuadPrunedNodeIds([]);
    setQuadHighlightedPointIds([]);
    setQuadRejectedPointIds([]);
    setQuadQueryBounds(null);
    setGridPrunedCellIds([]);
    setGridHighlightedPointIds([]);
    setGridRejectedPointIds([]);
    setGridQueryBounds(null);
  };

  const playAnimation = (events: AnimationEvent[], finalMessage: string) => {
    clearPlaybackTimer(playbackTimerRef);
    setAnimationEvents(events);
    setFinalAnimationMessage(finalMessage);
    setCurrentStepIndex(events.length > 0 ? 0 : -1);
    setIsPlaying(events.length > 0);
    setHighlightedNodeIds([]);
    setRangeNodeIds([]);
    setSplitNodeIds([]);
    setRtreePrunedNodeIds([]);
    setRtreeHighlightedEntryIds([]);
    setQuadPrunedNodeIds([]);
    setQuadHighlightedPointIds([]);
    setQuadRejectedPointIds([]);
    setGridPrunedCellIds([]);
    setGridHighlightedPointIds([]);
    setGridRejectedPointIds([]);
    setOperationMessage(events.length > 0 ? `步骤 1/${events.length}：${describeAnimationEvent(events[0])}` : finalMessage);
  };

  const applyVisualState = (visualState: AnimationVisualState) => {
    setHighlightedNodeIds(visualState.highlightedNodeIds);
    setRangeNodeIds(visualState.rangeNodeIds);
    setSplitNodeIds(visualState.splitNodeIds);
    setHashHighlightedKey(visualState.hashHighlightedKey);
    setHashSearchStatus(visualState.hashSearchStatus);
    setRtreePrunedNodeIds(visualState.rtreePrunedNodeIds);
    setRtreeHighlightedEntryIds(visualState.rtreeHighlightedEntryIds);
    setQuadPrunedNodeIds(visualState.quadPrunedNodeIds);
    setQuadHighlightedPointIds(visualState.quadHighlightedPointIds);
    setQuadRejectedPointIds(visualState.quadRejectedPointIds);
    setGridPrunedCellIds(visualState.gridPrunedCellIds);
    setGridHighlightedPointIds(visualState.gridHighlightedPointIds);
    setGridRejectedPointIds(visualState.gridRejectedPointIds);
  };

  const handleTogglePlayback = () => {
    if (animationEvents.length === 0) {
      setOperationMessage('当前没有可播放的动画事件，请先执行操作或载入示例。');
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentStepIndex >= animationEvents.length - 1) {
      setCurrentStepIndex(0);
    }

    setIsPlaying(true);
  };

  const handlePreviousStep = () => {
    if (!canStepBackward) {
      return;
    }

    setIsPlaying(false);
    setCurrentStepIndex((stepIndex) => Math.max(0, stepIndex - 1));
  };

  const handleNextStep = () => {
    if (!canStepForward) {
      return;
    }

    setIsPlaying(false);
    setCurrentStepIndex((stepIndex) => Math.min(animationEvents.length - 1, stepIndex + 1));
  };

  const handleReset = () => {
    resetEngine(activeIndexType);
    clearHighlights();
    setHasIndexContent((content) => ({ ...content, [activeIndexType]: false }));
    setTreeVersion((version) => version + 1);
    setInputValue('');
    setSelectedDemoId('');
    setOperationMessage(`${getIndexTypeLabel(activeIndexType)} 已重置。${getOperationHint(activeIndexType)}`);
  };

  const handleLoadDemo = (scenarioId: string) => {
    const scenario = DEMO_SCENARIOS.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      return;
    }

    const scenarioIndexType = getActiveIndexType(scenario.indexType);
    resetEngine(scenarioIndexType);
    clearHighlights();

    const result = executeDemoScenario(scenario, scenarioIndexType);

    setSelectedIndexType(scenario.indexType);
    setSelectedDemoId(scenario.id);
    setInputValue(scenario.operations[scenario.operations.length - 1]?.input ?? '');
    setHasIndexContent((content) => ({ ...content, [scenarioIndexType]: result.hasContent }));
    setRtreeQueryRect(result.rtreeQueryRect);
    setQuadQueryBounds(result.quadQueryBounds);
    setGridQueryBounds(result.gridQueryBounds);
    setTreeVersion((version) => version + 1);
    playAnimation(result.events, `已载入示例「${scenario.title}」：${result.finalMessage}`);
  };

  const resetEngine = (indexType: ActiveIndexType) => {
    if (indexType === 'hash') {
      hashIndex.reset();
      return;
    }

    if (indexType === 'rtree') {
      rtree.reset();
      return;
    }

    if (indexType === 'quadtree') {
      quadTree.reset();
      return;
    }

    if (indexType === 'grid') {
      gridIndex.reset();
      return;
    }

    bplusTree.reset();
  };

  const executeDemoScenario = (scenario: DemoScenario, indexType: ActiveIndexType) => {
    const events: AnimationEvent[] = [];
    let hasContent = false;
    let finalMessage = scenario.description;
    let nextRtreeQueryRect: Rect | null = null;
    let nextQuadQueryBounds: Bounds | null = null;
    let nextGridQueryBounds: GridBounds | null = null;

    for (const operation of scenario.operations) {
      if (indexType === 'rtree') {
        if (operation.kind === 'insert') {
          const rects = parseRects(operation.input);
          events.push(...rects.flatMap((rect) => rtree.insert(rect).events));
          hasContent = hasContent || rects.length > 0;
          finalMessage = createRTreeInsertMessage(rects, findLastEvent(events, 'rtree_split_node'));
        } else {
          const rect = parseFirstRect(operation.input);
          if (rect) {
            nextRtreeQueryRect = rect;
            const result = operation.kind === 'search' ? rtree.search(rect) : rtree.rangeSearch(rect);
            events.push(...result.events);
            finalMessage = `R 树范围查询：命中 ${formatSpatialEntryIds(result.entries)}`;
          }
        }
        continue;
      }

      if (indexType === 'quadtree') {
        if (operation.kind === 'insert') {
          const points = parsePoints(operation.input);
          const results = points.map((point) => quadTree.insert(point));
          events.push(...results.flatMap((result) => result.events));
          hasContent = hasContent || results.some((result) => result.inserted);
          finalMessage = createQuadTreeInsertMessage(results.map((result) => result.point), results.some((result) => !result.inserted));
        } else {
          const bounds = parseFirstBounds(operation.input);
          if (bounds) {
            nextQuadQueryBounds = bounds;
            const result = operation.kind === 'search' ? quadTree.search(bounds) : quadTree.rangeSearch(bounds);
            events.push(...result.events);
            finalMessage = `四叉树范围查询：命中 ${formatPointIds(result.points)}`;
          }
        }
        continue;
      }

      if (indexType === 'grid') {
        if (operation.kind === 'insert') {
          const points = parsePoints(operation.input);
          const results = points.map((point) => gridIndex.insert(point));
          events.push(...results.flatMap((result) => result.events));
          hasContent = hasContent || results.some((result) => result.inserted);
          finalMessage = createGridIndexInsertMessage(results.map((result) => result.point), results.some((result) => !result.inserted));
        } else {
          const bounds = parseFirstBounds(operation.input);
          if (bounds) {
            nextGridQueryBounds = bounds;
            const result = operation.kind === 'search' ? gridIndex.search(bounds) : gridIndex.rangeSearch(bounds);
            events.push(...result.events);
            finalMessage = `网格索引范围查询：命中 ${formatGridPointIds(result.points)}`;
          }
        }
        continue;
      }

      if (operation.kind === 'insert') {
        const keys = parseKeys(operation.input);
        const operationEvents =
          indexType === 'hash'
            ? keys.flatMap((key) => hashIndex.insert(key).events)
            : keys.flatMap((key) => bplusTree.insert(key).events);
        events.push(...operationEvents);
        hasContent = hasContent || keys.length > 0;
        finalMessage = createKeyInsertMessage(indexType, keys, findLastEvent(events, 'split-node'));
        continue;
      }

      if (operation.kind === 'search') {
        const key = parseFirstKey(operation.input);
        if (key !== null) {
          const result = indexType === 'hash' ? hashIndex.search(key) : bplusTree.search(key);
          events.push(...result.events);
          finalMessage = `查找 ${key}：${result.found ? '命中' : '未命中'}`;
        }
        continue;
      }

      const range = parseRange(operation.input);
      if (range && indexType === 'bptree') {
        const result = bplusTree.rangeSearch(range);
        events.push(...result.events);
        finalMessage = `范围查询 [${range.left}, ${range.right}]：${formatResultKeys(result.keys)}`;
      }
    }

    return {
      events,
      finalMessage,
      gridQueryBounds: nextGridQueryBounds,
      hasContent,
      quadQueryBounds: nextQuadQueryBounds,
      rtreeQueryRect: nextRtreeQueryRect,
    };
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="page-header">
          <h1>数据库索引结构可视化工具</h1>
          <p>
            纯前端在线展示版，用 SVG 展示 B+ 树、哈希索引、R 树、四叉树和网格索引的插入、查找与范围查询过程。
          </p>
        </header>

        <div className="control-panel" aria-label="索引操作面板">
          <div className="index-type-field">
            <label className="field-label" htmlFor="index-type">
              索引类型
            </label>
            <select
              id="index-type"
              className="index-type-select"
              value={selectedIndexType}
              onChange={(event) => handleIndexTypeChange(event.target.value as SelectableIndexType)}
              disabled={isPlaying}
            >
              {INDEX_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="index-status">
            <p className="current-index-type">当前索引类型：{getIndexTypeLabel(selectedIndexType)}</p>
            <p className="operation-hint">{getOperationHint(activeIndexType)}</p>
          </div>

          <div className="operation-support" aria-label="当前索引支持的操作">
            {(Object.entries(activeOperationConfig) as Array<[ShowcaseOperationKind, (typeof activeOperationConfig)[ShowcaseOperationKind]]>).map(
              ([operationKind, config]) => (
                <span
                  key={operationKind}
                  className={`operation-chip ${config.supported ? 'operation-chip-supported' : 'operation-chip-disabled'}`}
                  title={config.supported ? config.inputHint : config.reason}
                >
                  {config.label}
                </span>
              ),
            )}
          </div>

          <div className="operation-row">
            <label className="key-input-label" htmlFor="key-sequence">
              {getInputLabel(activeIndexType)}
            </label>
            <input
              id="key-sequence"
              className="key-input"
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={getInputPlaceholder(activeIndexType)}
              disabled={isPlaying}
            />

            <div className="action-group">
              <button type="button" onClick={handleInsert} disabled={isPlaying || !activeOperationConfig.insert.supported}>
                插入
              </button>
              <button type="button" onClick={handleSearch} disabled={isPlaying || !activeOperationConfig.search.supported}>
                查找
              </button>
              <button
                type="button"
                onClick={handleRangeSearch}
                disabled={isPlaying || !activeOperationConfig.rangeSearch.supported}
                title={activeOperationConfig.rangeSearch.supported ? activeOperationConfig.rangeSearch.inputHint : activeOperationConfig.rangeSearch.reason}
              >
                范围查询
              </button>
              <button type="button" className="secondary-button" onClick={handleReset} disabled={isPlaying}>
                重置
              </button>
            </div>
          </div>

          <div className="demo-row">
            <label className="key-input-label" htmlFor="demo-scenario">
              内置演示案例
            </label>
            <select
              id="demo-scenario"
              className="index-type-select"
              value={selectedDemoId}
              onChange={(event) => handleLoadDemo(event.target.value)}
              disabled={isPlaying}
            >
              <option value="">选择示例</option>
              {activeDemoScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
            <p className="demo-description">
              {activeDemoScenarios.find((scenario) => scenario.id === selectedDemoId)?.description ?? '每种索引提供至少两个典型过程示例，可直接载入并播放。'}
            </p>
          </div>

          <div className="playback-row" aria-label="动画播放控制">
            <div className="playback-buttons">
              <button type="button" className="secondary-button" onClick={handleTogglePlayback} disabled={animationEvents.length === 0}>
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button type="button" className="secondary-button" onClick={handlePreviousStep} disabled={!canStepBackward}>
                上一步
              </button>
              <button type="button" className="secondary-button" onClick={handleNextStep} disabled={!canStepForward}>
                下一步
              </button>
            </div>
            <label className="speed-control" htmlFor="animation-speed">
              动画速度
              <select
                id="animation-speed"
                className="index-type-select"
                value={animationStepMs}
                onChange={(event) => setAnimationStepMs(Number(event.target.value))}
              >
                {ANIMATION_SPEED_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="operation-status">{operationMessage}</p>

        <div className="showcase-layout">
          <VisualizationArea label={`${getIndexTypeLabel(selectedIndexType)}可视化区域`}>
          {activeIndexType === 'bptree' && treeViewModel ? (
            <BPlusTreeSvg
              tree={treeViewModel}
              highlightedNodeIds={highlightedNodeIds}
              rangeNodeIds={rangeNodeIds}
              splitNodeIds={splitNodeIds}
            />
          ) : null}
          {activeIndexType === 'hash' && hashViewModel ? (
            <HashIndexSvg
              index={hashViewModel}
              highlightedNodeIds={highlightedNodeIds}
              highlightedKey={hashHighlightedKey}
              searchStatus={hashSearchStatus}
            />
          ) : null}
          {activeIndexType === 'rtree' && rtreeViewModel ? (
            <RTreeSvg
              tree={rtreeViewModel}
              highlightedNodeIds={highlightedNodeIds}
              prunedNodeIds={rtreePrunedNodeIds}
              splitNodeIds={splitNodeIds}
              highlightedEntryIds={rtreeHighlightedEntryIds}
              queryRect={rtreeQueryRect}
            />
          ) : null}
          {activeIndexType === 'quadtree' && quadTreeViewModel ? (
            <QuadTreeSvg
              tree={quadTreeViewModel}
              highlightedNodeIds={highlightedNodeIds}
              prunedNodeIds={quadPrunedNodeIds}
              splitNodeIds={splitNodeIds}
              highlightedPointIds={quadHighlightedPointIds}
              rejectedPointIds={quadRejectedPointIds}
              queryBounds={quadQueryBounds}
            />
          ) : null}
          {activeIndexType === 'grid' && gridViewModel ? (
            <GridIndexSvg
              index={gridViewModel}
              highlightedCellIds={highlightedNodeIds}
              prunedCellIds={gridPrunedCellIds}
              highlightedPointIds={gridHighlightedPointIds}
              rejectedPointIds={gridRejectedPointIds}
              queryBounds={gridQueryBounds}
            />
          ) : null}
            {!hasIndexContent[activeIndexType] ? (
              <div className="empty-visualization">选择操作或载入示例后开始可视化。</div>
            ) : null}
          </VisualizationArea>

          <aside className="event-panel" aria-label="动画事件说明面板">
            <div>
              <h2>动画事件</h2>
              <p className="event-summary">
                {animationEvents.length > 0 ? `${Math.max(currentStepIndex + 1, 0)} / ${animationEvents.length}` : '暂无事件'}
              </p>
            </div>
            <dl className="event-detail">
              <div>
                <dt>当前步骤</dt>
                <dd>{currentAnimationEvent ? describeAnimationEvent(currentAnimationEvent) : '执行操作或载入示例后显示。'}</dd>
              </div>
              <div>
                <dt>事件类型</dt>
                <dd>{currentAnimationEvent?.type ?? '-'}</dd>
              </div>
              <div>
                <dt>目标对象</dt>
                <dd>{currentAnimationEvent?.nodeId ?? currentAnimationEvent?.cellId ?? '-'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}

function getActiveIndexType(indexType: SelectableIndexType): ActiveIndexType {
  if (indexType === 'hash' || indexType === 'rtree' || indexType === 'quadtree' || indexType === 'grid') {
    return indexType;
  }

  return 'bptree';
}

function parseKeys(value: string) {
  return value
    .split(/[,，\s[\]]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));
}

function parseFirstKey(value: string) {
  const [firstValue] = parseKeys(value);
  return firstValue ?? null;
}

function parseRange(value: string) {
  const [left, right] = parseKeys(value);

  if (left === undefined || right === undefined || left > right) {
    return null;
  }

  return { left, right };
}

function parseRects(value: string): Rect[] {
  return value
    .split(';')
    .map((part) => parseRect(part))
    .filter((rect): rect is Rect => Boolean(rect));
}

function parseFirstRect(value: string) {
  return parseRects(value)[0] ?? null;
}

function parseRect(value: string): Rect | null {
  const [x, y, width, height] = value
    .split(/[,，\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));

  if (x === undefined || y === undefined || width === undefined || height === undefined || width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

function parsePoints(value: string): Point[] {
  return value
    .split(';')
    .map((part) => parsePoint(part))
    .filter((point): point is Point => Boolean(point));
}

function parsePoint(value: string): Point | null {
  const [x, y] = value
    .split(/[,，\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));

  if (x === undefined || y === undefined) {
    return null;
  }

  return { x, y };
}

function parseFirstBounds(value: string): Bounds | null {
  return parseRect(value);
}

function findLastEvent(events: AnimationEvent[], eventType: AnimationEvent['type']) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event.type === eventType) {
      return event;
    }
  }

  return undefined;
}

function getSplitNodeIds(splitEvent: AnimationEvent | undefined) {
  if (!splitEvent) {
    return [];
  }

  return [splitEvent.leftNodeId, splitEvent.rightNodeId].filter((nodeId): nodeId is string => Boolean(nodeId));
}

function createKeyInsertMessage(
  indexType: Exclude<ActiveIndexType, 'rtree' | 'quadtree' | 'grid'>,
  insertedKeys: number[],
  splitEvent: AnimationEvent | undefined,
) {
  const insertedText = insertedKeys.join(', ');

  if (indexType === 'hash') {
    return `插入 ${insertedText}：已写入哈希桶。`;
  }

  if (!splitEvent) {
    return `插入 ${insertedText}：未发生节点分裂。`;
  }

  return `插入 ${insertedText}：节点分裂，提升 key ${splitEvent.promotedKey}。`;
}

function createRTreeInsertMessage(insertedRects: Rect[], splitEvent: AnimationEvent | undefined) {
  if (!splitEvent) {
    return `R 树插入 ${insertedRects.length} 个矩形：MBR 已更新。`;
  }

  return `R 树插入 ${insertedRects.length} 个矩形：发生节点分裂。`;
}

function createQuadTreeInsertMessage(insertedPoints: PointEntry[], rejected: boolean) {
  if (rejected) {
    return `四叉树处理 ${insertedPoints.length} 个点：至少一个点超出世界边界。`;
  }

  return `四叉树插入 ${insertedPoints.length} 个点。`;
}

function createGridIndexInsertMessage(insertedPoints: GridPointEntry[], rejected: boolean) {
  if (rejected) {
    return `网格索引处理 ${insertedPoints.length} 个点：至少一个点超出世界边界。`;
  }

  return `网格索引插入 ${insertedPoints.length} 个点。`;
}

function formatResultKeys(resultKeys: number[]) {
  if (resultKeys.length === 0) {
    return '无结果';
  }

  return resultKeys.join(', ');
}

function formatSpatialEntryIds(entries: SpatialEntry[]) {
  if (entries.length === 0) {
    return '无结果';
  }

  return entries.map((entry) => entry.id).join(', ');
}

function formatPointIds(points: PointEntry[]) {
  if (points.length === 0) {
    return '无结果';
  }

  return points.map((point) => point.id).join(', ');
}

function formatGridPointIds(points: GridPointEntry[]) {
  if (points.length === 0) {
    return '无结果';
  }

  return points.map((point) => point.id).join(', ');
}

function clearPlaybackTimer(timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function createEmptyVisualState(): AnimationVisualState {
  return {
    gridHighlightedPointIds: [],
    gridPrunedCellIds: [],
    gridRejectedPointIds: [],
    hashHighlightedKey: null,
    hashSearchStatus: null,
    highlightedNodeIds: [],
    quadHighlightedPointIds: [],
    quadPrunedNodeIds: [],
    quadRejectedPointIds: [],
    rangeNodeIds: [],
    rtreeHighlightedEntryIds: [],
    rtreePrunedNodeIds: [],
    splitNodeIds: [],
  };
}

function deriveAnimationVisualState(events: AnimationEvent[], currentStepIndex: number) {
  const visualState = createEmptyVisualState();
  const visitedNodeIds: string[] = [];
  const scannedLeafIds: string[] = [];

  for (const event of events.slice(0, currentStepIndex + 1)) {
    applyEventToVisualState(event, visualState, visitedNodeIds, scannedLeafIds);
  }

  return visualState;
}

function applyEventToVisualState(
  event: AnimationEvent,
  visualState: AnimationVisualState,
  visitedNodeIds: string[],
  scannedLeafIds: string[],
) {
  if (event.type === 'visit-node') {
    visitedNodeIds.push(event.nodeId);
    visualState.highlightedNodeIds = [...visitedNodeIds];
    visualState.rangeNodeIds = [];
    visualState.splitNodeIds = [];
    visualState.hashHighlightedKey = null;
    visualState.hashSearchStatus = null;
    return;
  }

  if (event.type === 'range-scan') {
    scannedLeafIds.push(event.nodeId);
    visualState.rangeNodeIds = [...scannedLeafIds];
    visualState.splitNodeIds = [];
    return;
  }

  if (event.type === 'split-node') {
    visualState.splitNodeIds = getSplitNodeIds(event);
    return;
  }

  if (event.type === 'scan_key') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.hashHighlightedKey = event.scannedKey ?? null;
    visualState.hashSearchStatus = null;
    return;
  }

  if (event.type === 'search-hit' || event.type === 'search-miss') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.hashHighlightedKey = event.type === 'search-hit' ? (event.key ?? null) : null;
    visualState.hashSearchStatus = event.type === 'search-hit' ? 'hit' : 'miss';
    return;
  }

  if (event.type === 'search_success' || event.type === 'search_failed') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.hashHighlightedKey = event.type === 'search_success' ? (event.key ?? null) : null;
    visualState.hashSearchStatus = event.type === 'search_success' ? 'hit' : 'miss';
    return;
  }

  if (event.type === 'rtree_choose_subtree' || event.type === 'rtree_expand_mbr' || event.type === 'rtree_insert_entry') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.rtreePrunedNodeIds = [];
    if (event.entryId) {
      visualState.rtreeHighlightedEntryIds = [event.entryId];
    }
    return;
  }

  if (event.type === 'rtree_split_node') {
    visualState.splitNodeIds = getSplitNodeIds(event);
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    return;
  }

  if (event.type === 'rtree_create_root') {
    visualState.highlightedNodeIds = [event.nodeId];
    return;
  }

  if (event.type === 'rtree_visit_node') {
    visitedNodeIds.push(event.nodeId);
    visualState.highlightedNodeIds = [...visitedNodeIds];
    return;
  }

  if (event.type === 'rtree_prune_node') {
    visualState.rtreePrunedNodeIds = uniqueIds([...visualState.rtreePrunedNodeIds, event.nodeId]);
    return;
  }

  if (event.type === 'rtree_search_hit') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    if (event.entryId) {
      visualState.rtreeHighlightedEntryIds = uniqueIds([...visualState.rtreeHighlightedEntryIds, event.entryId]);
    }
    return;
  }

  if (event.type === 'quadtree_visit_node' || event.type === 'quadtree_choose_quadrant' || event.type === 'quadtree_insert_point') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.quadPrunedNodeIds = [];
    if (event.pointId) {
      visualState.quadHighlightedPointIds = [event.pointId];
    }
    return;
  }

  if (event.type === 'quadtree_split_node') {
    visualState.splitNodeIds = [event.nodeId, ...(event.childNodeIds ?? [])];
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    return;
  }

  if (event.type === 'quadtree_redistribute_point') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    if (event.pointId) {
      visualState.quadHighlightedPointIds = [event.pointId];
    }
    return;
  }

  if (event.type === 'quadtree_query_visit') {
    visitedNodeIds.push(event.nodeId);
    visualState.highlightedNodeIds = [...visitedNodeIds];
    return;
  }

  if (event.type === 'quadtree_query_prune') {
    visualState.quadPrunedNodeIds = uniqueIds([...visualState.quadPrunedNodeIds, event.nodeId]);
    return;
  }

  if (event.type === 'quadtree_query_hit') {
    if (event.pointId) {
      visualState.quadHighlightedPointIds = uniqueIds([...visualState.quadHighlightedPointIds, event.pointId]);
    }
    return;
  }

  if (event.type === 'quadtree_reject_point') {
    if (event.pointId) {
      visualState.quadRejectedPointIds = uniqueIds([...visualState.quadRejectedPointIds, event.pointId]);
    }
    return;
  }

  if (event.type === 'grid_compute_cell' || event.type === 'grid_highlight_cell' || event.type === 'grid_insert_point') {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.gridPrunedCellIds = [];
    if (event.pointId) {
      visualState.gridHighlightedPointIds = [event.pointId];
    }
    return;
  }

  if (event.type === 'grid_query_visit_cell') {
    visitedNodeIds.push(event.nodeId);
    visualState.highlightedNodeIds = [...visitedNodeIds];
    return;
  }

  if (event.type === 'grid_query_prune_cell') {
    visualState.gridPrunedCellIds = uniqueIds([...visualState.gridPrunedCellIds, event.nodeId]);
    return;
  }

  if (event.type === 'grid_query_scan_point' || event.type === 'grid_query_hit') {
    if (event.pointId) {
      visualState.gridHighlightedPointIds = uniqueIds([...visualState.gridHighlightedPointIds, event.pointId]);
    }
    return;
  }

  if (event.type === 'grid_reject_point') {
    if (event.pointId) {
      visualState.gridRejectedPointIds = uniqueIds([...visualState.gridRejectedPointIds, event.pointId]);
    }
    return;
  }

  if (
    event.type === 'insert-key' ||
    event.type === 'promote-key' ||
    event.type === 'compute_hash' ||
    event.type === 'highlight_bucket' ||
    event.type === 'insert_key'
  ) {
    visualState.highlightedNodeIds = uniqueIds([...visualState.highlightedNodeIds, event.nodeId]);
    visualState.hashHighlightedKey = null;
    visualState.hashSearchStatus = null;
  }
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

function describeAnimationEvent(event: AnimationEvent) {
  if (event.type === 'visit-node') return `访问节点 ${event.nodeId}`;
  if (event.type === 'insert-key') return `插入 key ${event.key}`;
  if (event.type === 'split-node') return `节点分裂，提升 key ${event.promotedKey}`;
  if (event.type === 'promote-key') return `父节点更新，提升 key ${event.promotedKey}`;
  if (event.type === 'search-hit') return `找到 key ${event.key}`;
  if (event.type === 'search-miss') return `未找到 key ${event.key}`;
  if (event.type === 'compute_hash') return `计算哈希值：key ${event.key} -> bucket ${event.bucketIndex}`;
  if (event.type === 'highlight_bucket') return `定位 bucket ${event.bucketIndex}`;
  if (event.type === 'scan_key') return `扫描 bucket ${event.bucketIndex}`;
  if (event.type === 'insert_key') return `写入 bucket ${event.bucketIndex}`;
  if (event.type === 'search_success') return `找到 key ${event.key}`;
  if (event.type === 'search_failed') return `未找到 key ${event.key}`;
  if (event.type === 'rtree_choose_subtree') return `选择 R 树子树 ${event.nodeId}`;
  if (event.type === 'rtree_expand_mbr') return `扩展 R 树 MBR ${event.nodeId}`;
  if (event.type === 'rtree_insert_entry') return `插入空间对象 ${event.entryId}`;
  if (event.type === 'rtree_split_node') return `R 树节点分裂 ${event.nodeId}`;
  if (event.type === 'rtree_create_root') return `创建 R 树新根 ${event.nodeId}`;
  if (event.type === 'rtree_visit_node') return `访问 R 树节点 ${event.nodeId}`;
  if (event.type === 'rtree_prune_node') return `剪枝 R 树节点 ${event.nodeId}`;
  if (event.type === 'rtree_search_hit') return `命中空间对象 ${event.entryId}`;
  if (event.type === 'rtree_search_miss') return 'R 树查询未命中';
  if (event.type === 'quadtree_visit_node') return `访问四叉树节点 ${event.nodeId}`;
  if (event.type === 'quadtree_choose_quadrant') return `选择象限 ${event.quadrant}`;
  if (event.type === 'quadtree_insert_point') return `插入点 ${event.pointId}`;
  if (event.type === 'quadtree_split_node') return `四叉树节点分裂 ${event.nodeId}`;
  if (event.type === 'quadtree_redistribute_point') return `重新分发点 ${event.pointId}`;
  if (event.type === 'quadtree_query_visit') return `查询访问节点 ${event.nodeId}`;
  if (event.type === 'quadtree_query_prune') return `查询剪枝节点 ${event.nodeId}`;
  if (event.type === 'quadtree_query_hit') return `查询命中点 ${event.pointId}`;
  if (event.type === 'quadtree_query_miss') return '四叉树查询未命中';
  if (event.type === 'quadtree_reject_point') return `拒绝超界点 ${event.pointId}`;
  if (event.type === 'grid_compute_cell') return `计算网格单元 ${event.cellId}`;
  if (event.type === 'grid_highlight_cell') return `定位网格单元 ${event.cellId}`;
  if (event.type === 'grid_insert_point') return `插入点 ${event.pointId}`;
  if (event.type === 'grid_reject_point') return `拒绝超界点 ${event.pointId}`;
  if (event.type === 'grid_query_start') return '开始网格范围查询';
  if (event.type === 'grid_query_visit_cell') return `访问网格单元 ${event.cellId}`;
  if (event.type === 'grid_query_prune_cell') return `剪枝网格单元 ${event.cellId}`;
  if (event.type === 'grid_query_scan_point') return `扫描点 ${event.pointId}`;
  if (event.type === 'grid_query_hit') return `查询命中点 ${event.pointId}`;
  if (event.type === 'grid_query_miss') return '网格索引查询未命中';
  return `扫描节点 ${event.nodeId}`;
}

function getOperationHint(indexType: ActiveIndexType) {
  if (indexType === 'hash') {
    return '哈希索引：支持插入和查找；不支持范围查询。';
  }

  if (indexType === 'rtree') {
    return 'R 树：插入矩形 x,y,width,height；查找和范围查询使用矩形。';
  }

  if (indexType === 'quadtree') {
    return '四叉树：插入点 x,y；查找和范围查询使用矩形 x,y,width,height。';
  }

  if (indexType === 'grid') {
    return '网格索引：插入点 x,y；查找和范围查询使用矩形 x,y,width,height。';
  }

  return 'B+ 树：支持插入 key、查找 key 和数值范围查询。';
}

function getInputLabel(indexType: ActiveIndexType) {
  if (indexType === 'rtree') return '矩形序列';
  if (indexType === 'quadtree' || indexType === 'grid') return '点 / 查询范围';
  return 'key 序列';
}

function getInputPlaceholder(indexType: ActiveIndexType) {
  if (indexType === 'rtree') return '例如：10,10,20,15; 45,30,12,18';
  if (indexType === 'quadtree') return '插入：10,10; 45,30；查询：0,0,50,50';
  if (indexType === 'grid') return '插入：10,10; 45,30；查询：0,0,50,50';
  return '例如：10, 20, 5, 6';
}
