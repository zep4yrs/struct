/**
 * 算法引擎统一接口 — Algorithm Engine Interface
 *
 * 所有算法引擎都实现这个接口，播放器不需要知道具体算法是什么。
 * 引擎是纯逻辑的，不涉及任何 DOM 或 Canvas，只产出数据。
 */

export type HighlightType =
	| 'pivot' // 基准元素
	| 'compare' // 正在比较
	| 'swap' // 正在交换
	| 'sorted' // 已排序
	| 'current' // 当前关注
	| 'partition' // 当前分区范围
	| 'pointer-i' // 左指针 i
	| 'pointer-j'; // 右指针 j

export interface Highlight {
	type: HighlightType;
	indices: number[];
	label?: string;
}

/**
 * 步骤类型 — 决定动画时长和节奏感
 */
export type StepType =
	| 'init' // 初始化
	| 'compare' // 比较
	| 'swap' // 交换
	| 'pivot-select' // 选择 pivot
	| 'partition-start' // 开始分区
	| 'partition-end' // 分区完成
	| 'recurse-enter' // 进入递归
	| 'recurse-exit' // 递归返回
	| 'complete' // 全部完成
	| 'default'; // 默认

export interface AlgorithmStep {
	/** 步骤序号（0-based） */
	id: number;
	/** 这一步的类型（决定动画时长） */
	type: StepType;
	/** 一句话说明这一步在做什么 */
	description: string;
	/** 详细解释（可选，展示在步骤说明里） */
	detail?: string;
	/** 这一步的数组数据快照 */
	data: number[];
	/** 高亮标记 */
	highlights: Highlight[];
	/** 对应伪代码第几行（0-based） */
	pseudocodeLine: number;
	/** 讲授旁白（可选，演示投影模式优先使用；缺省回落到 demoScript 按步骤类型匹配） */
	presenterNote?: string;
	/** 当前递归调用栈深度（用于缩进展示） */
	recursionDepth?: number;
	/** 表格数据快照（仅 sql-table 渲染器使用） */
	table?: SqlTableData;
	/** E-R 图数据快照（仅 er 渲染器使用） */
	er?: ErDiagramData;
	/** B+ 树数据快照（仅 btree 渲染器使用） */
	btree?: BPlusTreeData;
	/** 图数据快照（仅 graph 渲染器使用） */
	graph?: GraphData;
}

/** SQL 表格数据（sql-table 渲染器） */
export interface SqlTableData {
	columns: string[];
	rows: (string | number)[][];
}

/** E-R 图节点类型 */
export type ErNodeType = 'entity' | 'attribute' | 'relationship' | 'relation' | 'fd';

/** E-R 图节点（引擎预设布局坐标，逻辑空间 760×560） */
export interface ErNode {
	id: string;
	type: ErNodeType;
	label: string;
	x: number;
	y: number;
	/** relation 节点内列出的字段（关系模式内容） */
	fields?: string[];
}

/** E-R 图连线；label 为基数（1/m/n）或标注，labelEnd 控制标签位置 */
export interface ErEdge {
	from: string;
	to: string;
	label?: string;
	labelEnd?: 'from' | 'to' | 'mid';
}

/** E-R 图数据（er 渲染器） */
export interface ErDiagramData {
	nodes: ErNode[];
	edges: ErEdge[];
}

/** B+ 树节点（索引引擎预设布局坐标，逻辑空间 720×420） */
export interface BPlusNode {
	id: string;
	/** 节点键值（内部节点为分隔键，叶子为全部数据键） */
	keys: (string | number)[];
	/** 是否为叶子节点（渲染叶子链表箭头） */
	leaf?: boolean;
	x: number;
	y: number;
}

/** B+ 树数据（btree 渲染器） */
export interface BPlusTreeData {
	nodes: BPlusNode[];
	edges: { from: string; to: string }[];
}

/** 图节点状态 */
export type GraphNodeState = 'unvisited' | 'frontier' | 'visited' | 'current' | 'done';

/** 图边状态 */
export type GraphEdgeState = 'normal' | 'candidate' | 'tried' | 'selected' | 'current';

/** 图节点（graph 渲染器；坐标由渲染器自动布局，引擎不预置） */
export interface GraphNode {
	id: number;
	label: string;
}

/** 图边；weight 用于有权图（MST/最短路），label 为可选边上的文字 */
export interface GraphEdge {
	from: number;
	to: number;
	weight?: number;
	label?: string;
}

/** 图数据快照（graph 渲染器） */
export interface GraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
	/** 有向图（渲染箭头） */
	directed?: boolean;
	/** 节点状态覆写（key 为节点 id，缺省 unvisited） */
	nodeState?: Record<number, GraphNodeState>;
	/** 边状态覆写（key 为边索引，缺省 normal） */
	edgeState?: Record<number, GraphEdgeState>;
}

/**
 * 渲染类型 — 告诉播放器用什么渲染器
 */
export type RenderType =
	'array' | 'tree' | 'linkedlist' | 'stack' | 'queue' | 'graph' | 'sql-table' | 'er' | 'btree';

/**
 * 练习题类型
 */
export type PracticeType = 'choose-next' | 'fill-array' | 'drag-pointer' | 'fill-code';

export interface PracticeQuestion {
	type: PracticeType;
	stepIndex: number;
	prompt: string;
	options?: string[];
	correctAnswer: string | number | boolean;
	hint: string;
	explanation: string;
}

/** 演示数据预设（播放器头部「演示数据」弹窗列出） */
export interface EnginePreset {
	name: string;
	description?: string;
}

/** 自定义输入字段 */
export type EngineCustomField =
	| {
			key: string;
			label: string;
			type: 'text' | 'textarea';
			placeholder?: string;
			default?: string;
	  }
	| {
			key: string;
			label: string;
			type: 'select';
			options: { value: string; label: string }[];
			default?: string;
	  };

/** 自定义输入配置（提供则播放器头部显示「自定义」按钮） */
export interface EngineCustomConfig {
	title?: string;
	fields: EngineCustomField[];
}

/** 讲授剧本条目：在某类步骤处展示的旁白（演示投影模式用） */
export interface DemoScriptItem {
	/** 匹配的步骤类型 */
	type: StepType;
	/** 该步骤类型的讲授旁白 */
	narration: string;
}

/**
 * 算法引擎统一接口
 */
export interface AlgorithmEngine<TInput = number[]> {
	// === 元信息 ===
	readonly name: string;
	readonly renderType: RenderType;
	/** 右侧面板标题（缺省：sql-table → 执行计划，其余 → 伪代码） */
	readonly panelTitle?: string;
	readonly pseudocode: string[];
	readonly practiceQuestions: PracticeQuestion[];

	// === 状态 ===
	steps: AlgorithmStep[];
	totalSteps: number;
	playbackPos: number; // 浮点位置，0 ~ totalSteps-1

	// === 操作 ===
	/** 初始化，输入数据，生成所有步骤 */
	init(input: TInput): void;

	// === 演示数据 / 自定义（可选） ===
	/** 演示数据预设（有则头部显示「演示数据」按钮） */
	presets?: EnginePreset[];
	/** 自定义输入配置（有则头部显示「自定义」按钮） */
	customConfig?: EngineCustomConfig;
	/** 应用演示预设（重建 steps） */
	applyPreset?(name: string): void;
	/** 应用自定义输入（校验失败抛 Error，重建 steps） */
	applyCustom?(values: Record<string, string>): void;

	/** 讲授剧本（可选，有则播放器头部显示「投影」按钮进入演示投影模式） */
	demoScript?: DemoScriptItem[];

	/** 获取当前步骤（向下取整后的关键帧） */
	getCurrentStep(): AlgorithmStep;

	/** 获取当前浮点进度 */
	getProgress(): number;

	/** 设置浮点进度（用于 GSAP 驱动） */
	setProgress(pos: number): void;

	/** 重置到第 0 步 */
	reset(): void;
}
