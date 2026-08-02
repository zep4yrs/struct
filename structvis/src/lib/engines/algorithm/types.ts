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
	/** 当前递归调用栈深度（用于缩进展示） */
	recursionDepth?: number;
	/** 表格数据快照（仅 sql-table 渲染器使用） */
	table?: SqlTableData;
}

/** SQL 表格数据（sql-table 渲染器） */
export interface SqlTableData {
	columns: string[];
	rows: (string | number)[][];
}

/**
 * 渲染类型 — 告诉播放器用什么渲染器
 */
export type RenderType = 'array' | 'tree' | 'linkedlist' | 'graph' | 'sql-table';

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

/**
 * 算法引擎统一接口
 */
export interface AlgorithmEngine<TInput = number[]> {
	// === 元信息 ===
	readonly name: string;
	readonly renderType: RenderType;
	readonly pseudocode: string[];
	readonly practiceQuestions: PracticeQuestion[];

	// === 状态 ===
	steps: AlgorithmStep[];
	totalSteps: number;
	playbackPos: number; // 浮点位置，0 ~ totalSteps-1

	// === 操作 ===
	/** 初始化，输入数据，生成所有步骤 */
	init(input: TInput): void;

	/** 获取当前步骤（向下取整后的关键帧） */
	getCurrentStep(): AlgorithmStep;

	/** 获取当前浮点进度 */
	getProgress(): number;

	/** 设置浮点进度（用于 GSAP 驱动） */
	setProgress(pos: number): void;

	/** 重置到第 0 步 */
	reset(): void;
}
