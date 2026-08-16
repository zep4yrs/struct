/**
 * MySQL 架构总览引擎 — MySqlArchEngine
 *
 * 一条 SQL 查询在 MySQL 内部走过的完整链路：
 *   连接器 → 查询缓存(8.0 移除) → 解析器 → 预处理器 → 优化器 → 执行器 → 存储引擎
 * 每个阶段一个节点，边标注数据流方向；逐步高亮当前阶段并说明职责。
 * 渲染用 graph（链式布局，节点下方标注产物/说明）。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	GraphData,
	GraphNodeState,
	PracticeQuestion,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';

const PSEUDO: string[] = [
	'SELECT * FROM student WHERE score > 85',
	'',
	'① 连接器：建立连接、鉴权',
	'② 解析器：词法/语法分析 → 语法树',
	'③ 优化器：选择执行计划（索引/连接顺序）',
	'④ 执行器：调用存储引擎接口逐行执行',
	'⑤ 存储引擎：InnoDB 读写数据/索引',
	'⑥ 返回结果集'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'MySQL 中「解析器」的主要职责是？',
		options: ['把 SQL 转成语法树并检查语法', '决定用哪个索引', '建立客户端连接', '把结果写回磁盘'],
		correctAnswer: '把 SQL 转成语法树并检查语法',
		hint: 'SQL 先要能被理解',
		explanation:
			'解析器先做词法分析（拆 token）再做语法分析（按 SQL 文法构建语法树），语法错误在这一步被捕获。优化器则在语法树基础上生成执行计划。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '优化器与执行器的分工是？',
		options: [
			'优化器选计划，执行器按计划调存储引擎',
			'执行器选计划，优化器执行',
			'两者都做同样的事',
			'优化器只处理 UPDATE'
		],
		correctAnswer: '优化器选计划，执行器按计划调存储引擎',
		hint: '先决策后执行',
		explanation:
			'优化器基于统计信息（行数、索引基数）从多种执行方案中选成本最低的（如走索引还是全表扫描）；执行器逐行调用存储引擎接口完成计划，返回结果。'
	}
];

interface ArchNode {
	id: number;
	label: string;
	note: string;
	detail: string;
}

const NODES: ArchNode[] = [
	{
		id: 0,
		label: '连接器',
		note: '鉴权 · 连接管理',
		detail: '建立连接、校验账号密码、权限表检查。线程池复用连接。'
	},
	{
		id: 1,
		label: '解析器',
		note: '词法/语法 → 语法树',
		detail: '词法分析拆 token，语法分析按文法构建语法树。语法错误在此报出。'
	},
	{
		id: 2,
		label: '优化器',
		note: '选执行计划',
		detail:
			'基于统计信息（行数、索引基数）在多个执行方案中选成本最低者：走索引还是全表扫描、连接顺序等。'
	},
	{
		id: 3,
		label: '执行器',
		note: '按计划执行',
		detail: '根据执行计划逐行调用存储引擎接口，做条件判断、组装结果集。'
	},
	{
		id: 4,
		label: '存储引擎',
		note: 'InnoDB 读写',
		detail: '真正读写磁盘数据页与索引页；事务、锁、MVCC 都在这一层。'
	}
];

const EDGE_LABELS = ['SQL 语句', '语法树', '执行计划', '逐行调用', '数据页'];

export class MySqlArchEngine extends EngineBase<number[]> {
	readonly name = 'MySQL 架构';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'MySQL 架构总览：一条 SQL 依次经过连接器、解析器、优化器、执行器，最后到达存储引擎读写数据。'
		},
		{
			type: 'compare',
			narration: '当前阶段处理中：观察它接收什么、产出什么。'
		},
		{
			type: 'edge-select',
			narration: '进入下一阶段。'
		},
		{
			type: 'complete',
			narration: '全链路完成。理解架构能帮你定位性能问题：慢在哪一层、为什么走错索引。'
		}
	];

	presets: EnginePreset[] = [{ name: '查询链路', description: 'SELECT 全流程' }];

	customConfig: EngineCustomConfig = { title: '架构演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const n = NODES.length;
		const graph: GraphData = {
			nodes: NODES.map((nd) => ({ id: nd.id, label: nd.label })),
			edges: Array.from({ length: n - 1 }, (_, i) => ({
				from: i,
				to: i + 1,
				label: EDGE_LABELS[i]
			})),
			directed: true
		};

		// 每步:当前节点 current,已走过的 done
		const mkState = (cur: number): Record<number, GraphNodeState> => {
			const st: Record<number, GraphNodeState> = {};
			for (let i = 0; i < n; i++) {
				if (i === cur) st[i] = 'current';
				else if (i < cur) st[i] = 'done';
				else st[i] = 'unvisited';
			}
			return st;
		};

		this._emit(
			'init',
			'一条 SQL：SELECT * FROM student WHERE score > 85。全链路：连接器 → 解析器 → 优化器 → 执行器 → 存储引擎。',
			graph,
			mkState(0),
			{},
			0,
			NODES.map((nd) => nd.note)
		);

		for (let i = 0; i < n; i++) {
			const nd = NODES[i];
			if (i > 0) {
				this._emit(
					'edge-select',
					'进入「' + nd.label + '」。',
					graph,
					mkState(i),
					{},
					0,
					NODES.map((x) => x.note)
				);
			}
			const type: StepType = i === 0 ? 'compare' : i === n - 1 ? 'edge-select' : 'compare';
			this._emit(
				type,
				nd.label + '：' + nd.detail,
				graph,
				mkState(i),
				{},
				i + 1,
				NODES.map((x) => x.note)
			);
		}

		this._emit(
			'complete',
			'链路完成。每个阶段只做一件事：连接→解析→优化→执行→存取。定位慢查询时，EXPLAIN 看的是优化器选的计划。',
			graph,
			mkState(n - 1),
			{},
			n,
			NODES.map((x) => x.note)
		);

		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		graph: GraphData,
		nodeState: Record<number, GraphNodeState>,
		edgeState: Record<number, 'current'>,
		pseudocodeLine: number,
		notes: string[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine,
			graph: {
				nodes: graph.nodes.map((x) => ({ ...x })),
				edges: graph.edges.map((x) => ({ ...x })),
				layout: 'chain',
				directed: true,
				nodeState,
				edgeState,
				nodeNote: Object.fromEntries(notes.map((t, i) => [i, t]))
			}
		});
	}
}
