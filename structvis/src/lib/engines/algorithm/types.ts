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
	| 'edge-candidate' // 考察候选边（图算法）
	| 'edge-select' // 选中边 / 确定顶点（图算法）
	| 'edge-reject' // 跳过边（成环 / 松弛无效）
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
	/** KMP 匹配快照（仅 kmp 渲染器使用） */
	kmp?: KmpData;
	/** 哈夫曼树快照（仅 huffman 渲染器使用） */
	huffman?: HuffmanData;
	/** 哈希表快照（仅 hashtable 渲染器使用） */
	hash?: HashData;
	/** Trie 字典树快照（仅 trie 渲染器使用） */
	trie?: TrieData;
	/** 动态规划表格快照（仅 dp-table 渲染器使用：0-1 背包 / LCS） */
	dp?: DpTableData;
	/** 并查集森林快照（仅 union-find 渲染器使用） */
	unionFind?: UnionFindData;
	/** 单调栈快照（仅 monostack 渲染器使用） */
	monoStack?: MonoStackData;
	/** 跳表快照（仅 skiplist 渲染器使用） */
	skipList?: SkipListData;
	/** Sunday 匹配快照（仅 sunday 渲染器使用） */
	sunday?: SundayData;
	/** 八皇后棋盘快照（仅 queens 渲染器使用） */
	queens?: QueensData;
}

/** Trie 字典树数据 */
export interface TrieData {
	/** 节点列表（id = 数组下标） */
	nodes: { id: number; char: string; isWord: boolean; children: number[] }[];
	root: number;
	/** 当前高亮路径（插入/查找经过的节点 id） */
	active?: number[];
	/** 本次插入的单词（完整路径标记） */
	wordPath?: number[];
}

/** 动态规划表格数据（dp-table 渲染器：0-1 背包 / LCS 共用） */
export interface DpCellHighlight {
	row: number;
	col: number;
	/** current=刚填写的格子；depend=被引用的前置格子；keep=取上方值；take=取左上值+当前物品 */
	type: 'current' | 'depend' | 'keep' | 'take';
}

export interface DpTableData {
	/** 行头标签（如「物品 1 (w=2, v=3)」或 LCS 的字符） */
	rowHeaders: string[];
	/** 列头标签（如「容量 0..C」或 LCS 的字符） */
	colHeaders: string[];
	/** 表格值 grid[row][col]（含表头行列，值可为数/字符串） */
	grid: (string | number)[][];
	/** 高亮格子 */
	highlights?: DpCellHighlight[];
	/** 回溯箭头（LCS 用）：from → to */
	arrows?: { fromRow: number; fromCol: number; toRow: number; toCol: number }[];
	/** 角标（左上角说明文字） */
	cornerLabel?: string;
	/** 行/列标签说明 */
	rowLabel?: string;
	colLabel?: string;
}

/** 并查集森林数据（union-find 渲染器） */
export interface UnionFindData {
	/** 节点列表（id = 数组下标） */
	nodes: { id: number; label: string }[];
	/** parent[i] = i 的父节点（自身 = 根） */
	parent: number[];
	/** 树边（父 → 子） */
	edges: { from: number; to: number }[];
	/** 当前高亮节点（查找路径 / 合并涉及） */
	active?: number[];
	/** 根节点集合（可选，用于根标记） */
	roots?: number[];
}

/** 单调栈数据（monostack 渲染器：数组柱状 + 底部栈） */
export interface MonoStackData {
	temps: number[];
	/** 栈中下标（栈底 → 栈顶） */
	stack: number[];
	/** 答案数组 */
	answer: number[];
	/** 当前扫描位置（-1 = 未开始） */
	cur: number;
}

/** 跳表数据（skiplist 渲染器）：多层有序链表 */
export interface SkipListData {
	/** 每层节点（level 0 = 底层完整链表；nodes 为该层节点 key 序列） */
	levels: { level: number; nodes: number[] }[];
	/** 当前比较位置 */
	curLevel: number;
	curKey: number | null;
	/** 高亮新插入的键 */
	insertedKey?: number;
	/** 说明文字 */
	note?: string;
}

/** Sunday 匹配数据（sunday 渲染器）：文本行 + 模式行 + 偏移表 */
export interface SundayData {
	text: string;
	pattern: string;
	/** 模式对齐到文本的起始下标 */
	align: number;
	/** 当前比较位置（文本下标） */
	cur: number;
	/** 本帧表现 */
	phase: 'compare' | 'match-char' | 'mismatch' | 'shift' | 'found' | 'failed';
	/** 偏移表：每个字符 → 在模式中最右出现位置（1-based 从右数），未出现为 pattern.length+1 */
	offset: Record<string, number>;
	/** 对齐后参与判定的下一个文本字符 */
	nextChar?: string;
}

/** 八皇后棋盘数据（queens 渲染器） */
export interface QueensData {
	/** 棋盘边长（N=8） */
	n: number;
	/** 已放置的皇后：每项为该行的列下标（index=行号） */
	placed: number[];
	/** 当前试探的格子（row, col；-1 表示无 */
	curRow: number;
	curCol: number;
	/** 冲突的格子列表 */
	conflicts?: { row: number; col: number }[];
	/** 本帧表现 */
	phase: 'try' | 'conflict' | 'place' | 'backtrack' | 'solution';
	/** 解编号 */
	solutionIndex?: number;
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
export type GraphNodeState = 'unvisited' | 'frontier' | 'visited' | 'current' | 'done' | 'selected';

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
	/** 布局方式：ring=环形（默认，图算法用）；chain=水平链式（架构/流程用） */
	layout?: 'ring' | 'chain';
	/** 有向图（渲染箭头） */
	directed?: boolean;
	/** 节点状态覆写（key 为节点 id，缺省 unvisited） */
	nodeState?: Record<number, GraphNodeState>;
	/** 边状态覆写（key 为边索引，缺省 normal） */
	edgeState?: Record<number, GraphEdgeState>;
	/** 节点下方标注（key 为节点 id；Dijkstra 的 dist 等） */
	nodeNote?: Record<number, string>;
}

/** KMP 匹配快照（kmp 渲染器：文本行 + 模式行 + next 数组行） */
export interface KmpData {
	/** 文本串 */
	text: string;
	/** 模式串 */
	pattern: string;
	/** 模式串对齐文本的起始下标（0-based；buildNext 阶段表示模式内 j 指针位置） */
	i: number;
	/** 模式串内比较位置（0-based；buildNext 阶段表示 k 指针位置，可 < 0） */
	j: number;
	/** 本帧表现：正在比较 / 命中 / 失配 / 整体命中 / 整体失败 */
	phase: 'compare' | 'match' | 'mismatch' | 'found' | 'failed';
	/** 是否在"求 next 数组"阶段（该阶段无文本对齐，直接显示模式串与 next 行） */
	buildNext?: boolean;
	/** next 数组（值为教材 1-based 记法，下标 0 恒为 0 占位；长度 = 模式长 + 1） */
	next: number[];
	/** 当前高亮的 next 位置（1-based 下标） */
	nextIndex?: number;
}

/** 哈夫曼树结点（森林由多个根并列） */
export interface HuffmanNode {
	id: number;
	value: number;
	left: number;
	right: number;
	parent: number;
}

/** 哈夫曼树快照（huffman 渲染器：森林并列布局） */
export interface HuffmanData {
	nodes: HuffmanNode[];
	/** 当前森林的根 id 列表（初始为全部叶子，逐步合并至单个根） */
	roots: number[];
	/** 累计带权路径长度（完成帧给出） */
	wpl: number;
}

/** 哈希表快照（hashtable 渲染器：槽位数组 + 探测序列） */
export interface HashData {
	/** 布局模式：线性探测（单行槽位）/ 链地址法（槽位 + 链表） */
	mode: 'linear' | 'chain';
	/** 槽位数 m */
	size: number;
	/** 槽位内容（null = 空槽；链地址法下恒为 null） */
	slots: (number | null)[];
	/** 链地址法：槽位下标 → 链上关键字（表头 → 表尾） */
	chains?: Record<number, number[]>;
	/** 正在插入/查找的关键字 */
	key?: number;
	/** 关键字的显示文本（如教材中的 "01"） */
	keyLabel?: string;
	/** H(key) = key mod m 的散列结果 */
	hashValue?: number;
	/** 当前探测序列（已探测过的槽位下标，含当前槽） */
	probe?: number[];
	/** 当前探测到的槽位（高亮） */
	current?: number;
	/** 放入/命中的槽位（成功色） */
	placed?: number;
	/** 查找是否命中（search 模式） */
	found?: boolean;
	/** 完成帧统计说明（ASL 等） */
	summary?: string;
}

/**
 * 渲染类型 — 告诉播放器用什么渲染器
 */
export type RenderType =
	| 'array'
	| 'tree'
	| 'linkedlist'
	| 'stack'
	| 'queue'
	| 'graph'
	| 'kmp'
	| 'huffman'
	| 'hashtable'
	| 'sql-table'
	| 'er'
	| 'btree'
	| 'trie'
	| 'dp-table'
	| 'union-find'
	| 'monostack'
	| 'skiplist'
	| 'sunday'
	| 'queens'
	| 'pseudocode';

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
