/**
 * A* 寻路引擎 — AStarEngine
 *
 * 教材第 7 章扩展：启发式搜索。f(n) = g(n) + h(n)：
 * g = 起点到 n 的实际代价，h = n 到终点的估计代价（曼哈顿距离）。
 * 优先扩展 f 最小的节点，找到终点即结束（h 可采纳时最优）。
 * 渲染用 graph：网格 5×5，节点标注 f/g/h，nodeState 标记 open/closed/当前。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	GraphData,
	GraphEdgeState,
	GraphNodeState,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// A* 寻路',
	'open = { start }',
	'while open 非空 do',
	'  n = open 中 f(n) 最小的节点',
	'  if n == goal then 成功返回路径',
	'  for 每个邻居 m do',
	'    g(m) = g(n) + 代价',
	'    f(m) = g(m) + h(m)',
	'    open 加入 m 或更新',
	'  end for',
	'end while'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'A* 的估价函数 f(n) = g(n) + h(n)，其中 h(n) 是？',
		options: ['起点到 n 的实际代价', 'n 到终点的估计代价', 'n 的度数', '随机值'],
		correctAnswer: 'n 到终点的估计代价',
		hint: 'h 是启发式估计',
		explanation:
			'g(n) 是起点到 n 的实际代价，h(n) 是从 n 到终点的启发式估计（如曼哈顿距离）。f 最小的节点优先扩展——h 可采纳（不高估）时 A* 保证找到最短路径。'
	}
];

// 网格 5×5：0 起点，24 终点，障碍
const GRID_W = 5;
const GRID_H = 5;
const START = 0;
const GOAL = 24;
const OBSTACLES = new Set([7, 11, 17]); // 障碍格子

export class AStarEngine extends EngineBase<number[]> {
	readonly name = 'A* 寻路';
	readonly renderType = 'graph' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'A* 寻路：在网格中找到起点到终点的最短路径。每个格子有代价 f = g + h：g 是起点到它的实际步数，h 是它到终点的估计步数（曼哈顿距离）。每次都扩展 f 最小的格子。'
		},
		{
			type: 'compare',
			narration: '从 open 表中取出 f 值最小的格子进行扩展。'
		},
		{
			type: 'edge-candidate',
			narration: '考察邻居格子：计算它的 g、h、f，加入 open 表。'
		},
		{
			type: 'edge-select',
			narration: '当前格子已扩展完毕，移入 closed 表（不再考察）。'
		},
		{
			type: 'complete',
			narration:
				'找到终点！沿着记录的父指针回溯即可得到最短路径。A* 在启发式可采纳时保证最优，且比 Dijkstra 更快（有方向性地搜索）。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '5×5 网格', description: '起点(0,0) → 终点(4,4)，含 3 个障碍' }
	];

	customConfig: EngineCustomConfig = { title: '寻路演示', fields: [] };

	applyPreset(_name: string): void {
		this.init();
	}

	applyCustom(): void {
		this.init();
	}

	init(): void {
		this.steps = [];
		this._stepId = 0;

		this._emit('init', 'A* 寻路：起点 S(0,0) → 终点 G(4,4)，黑色为障碍。曼哈顿启发式。', 0);

		const total = GRID_W * GRID_H;
		const gScore = new Array(total).fill(Infinity);
		const fScore = new Array(total).fill(Infinity);
		const openSet = new Set<number>([START]);
		const closedSet = new Set<number>();
		const parent = new Map<number, number>();
		gScore[START] = 0;
		fScore[START] = this._h(START);

		let current = -1;
		while (openSet.size > 0) {
			// 取 f 最小的
			current = -1;
			let bestF = Infinity;
			for (const n of openSet) {
				if (fScore[n] < bestF) {
					bestF = fScore[n];
					current = n;
				}
			}
			if (current === -1) break;

			if (current === GOAL) break;

			openSet.delete(current);
			closedSet.add(current);
			this._emit(
				'edge-select',
				'扩展 f=' +
					this._fmt(fScore[current]) +
					' 的格子：' +
					this._name(current) +
					'，移入 closed。',
				4,
				this._states(openSet, closedSet, current, gScore, fScore)
			);

			for (const nb of this._neighbors(current)) {
				if (closedSet.has(nb) || OBSTACLES.has(nb)) continue;
				const tentative = gScore[current] + 1;
				if (tentative < gScore[nb]) {
					parent.set(nb, current);
					gScore[nb] = tentative;
					fScore[nb] = tentative + this._h(nb);
					openSet.add(nb);
				}
			}
			this._emit(
				'edge-candidate',
				'更新邻居的 g/h/f 值（f = g + h）。open 表 ' + openSet.size + ' 个候选。',
				3,
				this._states(openSet, closedSet, current, gScore, fScore)
			);
		}

		// 回溯路径
		const path: number[] = [];
		let p = GOAL;
		while (p !== -1) {
			path.unshift(p);
			p = parent.get(p) ?? -1;
		}
		const pathSet = new Set(path);

		this._emit(
			'complete',
			path.length > 1
				? '找到路径：' +
						path.map((n) => this._name(n)).join(' → ') +
						'，长度 ' +
						(path.length - 1) +
						'。'
				: '未找到路径。',
			6,
			this._states(openSet, closedSet, current, gScore, fScore, pathSet)
		);
		this.totalSteps = this.steps.length;
	}

	// ---------- 工具 ----------
	private _id(x: number, y: number): number {
		return y * GRID_W + x;
	}
	private _h(id: number): number {
		const gx = GOAL % GRID_W;
		const gy = Math.floor(GOAL / GRID_W);
		return Math.abs((id % GRID_W) - gx) + Math.abs(Math.floor(id / GRID_W) - gy);
	}
	private _name(id: number): string {
		return '(' + (id % GRID_W) + ',' + Math.floor(id / GRID_W) + ')';
	}
	private _fmt(v: number): string {
		return v === Infinity ? '∞' : String(v);
	}
	private _neighbors(id: number): number[] {
		const x = id % GRID_W;
		const y = Math.floor(id / GRID_W);
		const out: number[] = [];
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1]
		]) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) out.push(this._id(nx, ny));
		}
		return out;
	}
	private _states(
		open: Set<number>,
		closed: Set<number>,
		current: number,
		g: number[],
		f: number[],
		path?: Set<number>
	): void {
		// 状态注入到本次 emit
		this._lastStates = {
			open: new Set(open),
			closed: new Set(closed),
			current,
			g: [...g],
			f: [...f],
			path: path ? new Set(path) : undefined
		};
	}
	private _lastStates: {
		open: Set<number>;
		closed: Set<number>;
		current: number;
		g: number[];
		f: number[];
		path?: Set<number>;
	} | null = null;

	private _emit(type: StepType, description: string, pseudocodeLine: number, _states: void): void {
		// init 等无状态步骤：_lastStates 为 null 时用空状态兜底
		const s = this._lastStates ?? {
			open: new Set<number>(),
			closed: new Set<number>(),
			current: -1,
			g: new Array(GRID_W * GRID_H).fill(Infinity) as number[],
			f: new Array(GRID_W * GRID_H).fill(Infinity) as number[],
			path: undefined
		};
		const total = GRID_W * GRID_H;
		const nodeState: Record<number, GraphNodeState> = {};
		const nodeNote: Record<number, string> = {};
		for (let i = 0; i < total; i++) {
			if (OBSTACLES.has(i)) nodeState[i] = 'unvisited';
			else if (s.path?.has(i)) nodeState[i] = 'selected';
			else if (s.closed.has(i)) nodeState[i] = 'done';
			else if (s.open.has(i)) nodeState[i] = 'frontier';
			else nodeState[i] = 'unvisited';
			if (s.current === i) nodeState[i] = 'current';
			nodeNote[i] = this._fmt(s.f[i]) + ' ' + this._fmt(s.g[i]);
		}
		// 边：网格邻接（仅画非障碍连接）
		const edges: { from: number; to: number; weight: number }[] = [];
		for (let y = 0; y < GRID_H; y++) {
			for (let x = 0; x < GRID_W; x++) {
				const id = this._id(x, y);
				if (OBSTACLES.has(id)) continue;
				if (x + 1 < GRID_W && !OBSTACLES.has(this._id(x + 1, y)))
					edges.push({ from: id, to: this._id(x + 1, y), weight: 1 });
				if (y + 1 < GRID_H && !OBSTACLES.has(this._id(x, y + 1)))
					edges.push({ from: id, to: this._id(x, y + 1), weight: 1 });
			}
		}
		const edgeState: Record<number, GraphEdgeState> = {};
		const labels = Array.from({ length: total }, (_, i) =>
			OBSTACLES.has(i) ? '■' : i === START ? 'S' : i === GOAL ? 'G' : ''
		);
		const graph: GraphData = {
			nodes: labels.map((label, id) => ({ id, label })),
			edges,
			directed: false,
			nodeState,
			edgeState,
			nodeNote
		};
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [] as Highlight[],
			pseudocodeLine,
			graph
		});
	}
}
