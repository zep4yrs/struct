/**
 * 图的遍历引擎 — GraphTraversalEngine
 *
 * 支持广度优先（BFS，队列）与深度优先（DFS，递归）两种遍历，
 * 生成步进关键帧：起始顶点入队/入栈、出队/出栈访问、未访问邻居入队/递归进入。
 * 每帧携带 graph 快照（节点/边 + nodeState），由 graph 渲染器环形布局绘制。
 * 引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	GraphData,
	GraphNodeState,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseEdgeList, parseLabelList } from '../parseInput';

export type GraphTraversalMode = 'bfs' | 'dfs';

export interface GraphTraversalInput {
	/** 节点标签（索引即节点 id） */
	labels: string[];
	/** 无向边对 [from, to] */
	edges: [number, number][];
	mode: GraphTraversalMode;
	/** 起始顶点 id */
	start: number;
}

const BFS_PSEUDO: string[] = [
	'procedure BFS(G, v0)',
	'  visited ← 全 false',
	'  queue ← empty queue',
	'  visited[v0] ← true; enqueue(queue, v0)',
	'  while queue not empty do',
	'    u ← dequeue(queue); visit(u)',
	'    for each neighbor w of u do',
	'      if not visited[w] then',
	'        visited[w] ← true; enqueue(queue, w)',
	'  end while',
	'end procedure'
];

const DFS_PSEUDO: string[] = [
	'procedure DFS(G, u)',
	'  visited[u] ← true; visit(u)',
	'  for each neighbor w of u do',
	'    if not visited[w] then',
	'      DFS(G, w)',
	'  end for',
	'end procedure'
];

const PSEUDO_BY_MODE: Record<GraphTraversalMode, string[]> = {
	bfs: BFS_PSEUDO,
	dfs: DFS_PSEUDO
};

// 练习基于默认演示图（0-1, 0-2, 1-3, 1-4, 2-4, 2-5, 3-4, 4-5，从 0 出发）：
// BFS 序列 0,1,2,3,4,5；DFS 序列（邻居升序）0,1,3,4,2,5
const PRACTICE_BY_MODE: Record<GraphTraversalMode, PracticeQuestion[]> = {
	bfs: [
		{
			type: 'choose-next',
			stepIndex: 4,
			prompt: '从顶点 0 开始 BFS，第 3 个被访问的顶点是？',
			options: ['1', '2', '3', '5'],
			correctAnswer: '2',
			hint: 'BFS 按层扩展：先访问 0，再访问它的一层邻居 1、2',
			explanation:
				'BFS 序列为 0, 1, 2, 3, 4, 5。顶点 0 的邻居 1、2 先入队先被访问，第 3 个访问的是 2。'
		}
	],
	dfs: [
		{
			type: 'choose-next',
			stepIndex: 4,
			prompt: '从顶点 0 开始 DFS（邻居按编号升序），第 2 个被访问的顶点是？',
			options: ['1', '2', '3', '4'],
			correctAnswer: '1',
			hint: 'DFS 一头扎到底：0 → 1 → 3 → …',
			explanation: 'DFS 序列为 0, 1, 3, 4, 2, 5。0 的邻居中编号最小的是 1，因此第 2 个访问 1。'
		}
	]
};

const DEFAULT_EDGES: [number, number][] = [
	[0, 1],
	[0, 2],
	[1, 3],
	[1, 4],
	[2, 4],
	[2, 5],
	[3, 4],
	[4, 5]
];

export class GraphTraversalEngine extends EngineBase<GraphTraversalInput> {
	readonly name = '图的遍历';
	readonly renderType = 'graph' as const;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'这是一个无向图：圆圈是顶点，连线是边。遍历就是按某种规则不重复地访问每个顶点一次。图可以用邻接矩阵或邻接表存储，遍历算法只关心"每个顶点的邻居是谁"。'
		},
		{
			type: 'recurse-enter',
			narration:
				'发现未访问的邻居，把它加入待访问集合：广度优先用队列（先来先访问），深度优先递归深入。'
		},
		{
			type: 'compare',
			narration: '从待访问集合取出当前顶点并访问，把它记入访问序列。'
		},
		{
			type: 'complete',
			narration:
				'遍历完成。BFS 像水波逐层扩散，适合求最短路径；DFS 像钻头一路向下，适合判断连通性与拓扑排序。'
		}
	];

	private _labels: string[] = [];
	private _edges: [number, number][] = [];
	private _adj: number[][] = [];
	private _mode: GraphTraversalMode = 'bfs';

	presets: EnginePreset[] = [
		{ name: '广度优先 BFS', description: '队列逐层扩展（教材示例图，从 0 出发）' },
		{ name: '深度优先 DFS', description: '递归一路到底（教材示例图，从 0 出发）' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义图',
		fields: [
			{
				key: 'mode',
				label: '遍历方式',
				type: 'select',
				options: [
					{ value: 'bfs', label: '广度优先 BFS' },
					{ value: 'dfs', label: '深度优先 DFS' }
				],
				default: 'bfs'
			},
			{
				key: 'labels',
				label: '顶点列表',
				type: 'text',
				placeholder: '逗号分隔，如 0, 1, 2, 3, 4, 5',
				default: '0, 1, 2, 3, 4, 5'
			},
			{
				key: 'edges',
				label: '边列表',
				type: 'text',
				placeholder: '如 0-1, 0-2, 1-3',
				default: '0-1, 0-2, 1-3, 1-4, 2-4, 2-5, 3-4, 4-5'
			},
			{
				key: 'start',
				label: '起始顶点编号',
				type: 'text',
				placeholder: '0 ~ 顶点数-1',
				default: '0'
			}
		]
	};

	applyPreset(name: string): void {
		const mode: GraphTraversalMode = name.startsWith('深度') ? 'dfs' : 'bfs';
		this.init({ labels: ['0', '1', '2', '3', '4', '5'], edges: DEFAULT_EDGES, mode, start: 0 });
	}

	applyCustom(values: Record<string, string>): void {
		const labels = parseLabelList(values.labels ?? '', { min: 2, max: 12 });
		const edges = parseEdgeList(values.edges ?? '', { maxIndex: labels.length - 1 });
		const start = parseInt((values.start ?? '').trim(), 10);
		if (isNaN(start)) throw new Error('请输入起始顶点编号');
		if (start < 0 || start >= labels.length) throw new Error('起始顶点编号超出范围');
		const mode = (values.mode ?? 'bfs') as GraphTraversalMode;
		this.init({ labels, edges, mode, start });
	}

	init(input: GraphTraversalInput): void {
		const { labels, edges, mode, start } = input;
		this._labels = [...labels];
		this._edges = [...edges];
		this._mode = mode;
		this.pseudocode = PSEUDO_BY_MODE[mode];
		this.practiceQuestions = PRACTICE_BY_MODE[mode];

		// 邻接表
		this._adj = labels.map(() => []);
		for (const [a, b] of edges) {
			this._adj[a].push(b);
			this._adj[b].push(a);
		}
		this._adj = this._adj.map((ns) => [...ns].sort((x, y) => x - y));

		this.steps = [];
		this._stepId = 0;

		this._emit(
			'init',
			`无向图共 ${labels.length} 个顶点、${edges.length} 条边。从顶点 ${this._label(start)} 开始${mode === 'bfs' ? '广度优先（队列）' : '深度优先（递归）'}遍历。`,
			[],
			[],
			0
		);

		const visitedSeq: number[] = [];
		if (mode === 'bfs') this._genBfs(start, visitedSeq);
		else this._genDfs(start, visitedSeq);

		this._emit(
			'complete',
			`遍历完成，访问序列：${visitedSeq.map((i) => this._label(i)).join(', ')}。`,
			visitedSeq,
			[],
			0
		);
		this.totalSteps = this.steps.length;
	}

	private _label(id: number): string {
		return this._labels[id] ?? String(id);
	}

	private _genBfs(start: number, visitedSeq: number[]): void {
		const visited = new Set<number>();
		const frontier = new Set<number>([start]);
		const queue: number[] = [start];
		this._emit(
			'recurse-enter',
			`起始顶点 ${this._label(start)} 入队。`,
			visitedSeq,
			[...frontier],
			3
		);

		while (queue.length > 0) {
			const u = queue.shift()!;
			frontier.delete(u);
			visited.add(u);
			visitedSeq.push(u);
			this._emit(
				'compare',
				`出队访问顶点 ${this._label(u)}，已访问序列：[${visitedSeq.map((i) => this._label(i)).join(', ')}]。`,
				visitedSeq,
				[...frontier],
				5,
				[u]
			);
			for (const w of this._adj[u]) {
				if (visited.has(w) || frontier.has(w)) continue;
				frontier.add(w);
				queue.push(w);
				this._emit(
					'recurse-enter',
					`顶点 ${this._label(u)} 的邻接点 ${this._label(w)} 未访问，入队。`,
					visitedSeq,
					[...frontier],
					8
				);
			}
		}
	}

	private _genDfs(start: number, visitedSeq: number[]): void {
		const visited = new Set<number>();
		this._dfs(start, visited, visitedSeq);
	}

	private _dfs(u: number, visited: Set<number>, visitedSeq: number[]): void {
		visited.add(u);
		visitedSeq.push(u);
		this._emit(
			'compare',
			`访问顶点 ${this._label(u)}，已访问序列：[${visitedSeq.map((i) => this._label(i)).join(', ')}]。`,
			visitedSeq,
			[],
			1,
			[u]
		);
		for (const w of this._adj[u]) {
			if (visited.has(w)) continue;
			this._emit(
				'recurse-enter',
				`顶点 ${this._label(u)} 的邻接点 ${this._label(w)} 未访问，递归深入。`,
				visitedSeq,
				[],
				4
			);
			this._dfs(w, visited, visitedSeq);
		}
	}

	/**
	 * 生成 graph 快照
	 * @param visitedSeq 已访问顶点序列
	 * @param frontier 队/栈中顶点
	 * @param current 当前正在访问的顶点（可选）
	 */
	private _graph(visitedSeq: number[], frontier: number[], current: number[]): GraphData {
		const nodeState: Record<number, GraphNodeState> = {};
		for (const id of current) nodeState[id] = 'current';
		for (const id of frontier) {
			if (!(id in nodeState)) nodeState[id] = 'frontier';
		}
		for (const id of visitedSeq) {
			if (!(id in nodeState)) nodeState[id] = 'visited';
		}
		return {
			nodes: this._labels.map((label, id) => ({ id, label })),
			edges: this._edges.map(([from, to]) => ({ from, to })),
			nodeState
		};
	}

	private _emit(
		type: StepType,
		description: string,
		visitedSeq: number[],
		frontier: number[],
		pseudocodeLine: number,
		current?: number[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...visitedSeq],
			highlights: [],
			pseudocodeLine,
			graph: this._graph(visitedSeq, frontier, current ?? [])
		});
	}

}
