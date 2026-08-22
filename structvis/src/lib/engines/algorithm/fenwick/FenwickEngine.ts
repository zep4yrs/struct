/**
 * 树状数组引擎 - FenwickEngine
 *
 * Fenwick Tree (Binary Indexed Tree): lowbit 分跳的前缀和结构。
 * 演示: 构建 + 单点更新 + 前缀和查询, 每步显示 lowbit 跳跃路径。
 * data = 内部 tree 数组 (1-based), highlights 标当前访问节点。渲染用 array。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// lowbit(x) = x & (-x)',
	'update(i, delta):',
	'  while i <= n: tree[i] += delta; i += lowbit(i)',
	'query(i):  // 前缀和 [1..i]',
	'  sum = 0',
	'  while i > 0: sum += tree[i]; i -= lowbit(i)'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'lowbit(12) 的值是？ (12 = 二进制 1100)',
		options: ['4', '12', '8', '2'],
		correctAnswer: '4',
		hint: '取最低位的 1 及其后的零',
		explanation:
			'lowbit(x) = x & (-x)。12 的二进制 1100，最低位 1 在值 4 的位置，所以 lowbit(12)=4。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: '树状数组 query(7) 会累加哪些 tree 节点？',
		options: [
			'tree[7], tree[6], tree[4]',
			'tree[1..7] 全部',
			'tree[7], tree[3], tree[1]',
			'只有 tree[7]'
		],
		correctAnswer: 'tree[7], tree[6], tree[4]',
		hint: '每次 i -= lowbit(i): 7→6→4→0',
		explanation:
			'query 从 i 开始不断减去 lowbit: 7(111)→6(110)→4(100)→0。三个节点的覆盖区间恰好拼出 [1..7]。'
	}
];

export class FenwickEngine extends EngineBase<number[]> {
	readonly name = '树状数组 Fenwick Tree';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'树状数组 (BIT)：用 lowbit 跳跃实现 O(log n) 的单点更新与前缀和查询——比线段树轻量，代码仅几行。'
		},
		{
			type: 'compare',
			narration: 'update 沿 i += lowbit(i) 向上更新父节点；query 沿 i -= lowbit(i) 向下累加。'
		},
		{ type: 'edge-select', narration: '跳跃路径上的每个 tree 节点都参与运算。' },
		{
			type: 'complete',
			narration:
				'完成。两种操作都是沿 lowbit 链走，复杂度均为 O(log n)——这就是 BIT 的精髓。区间查询 = query(r) - query(l-1)。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '初始 [3,2,5,7,1,4,6,8]' }];

	customConfig: EngineCustomConfig = { title: 'Fenwick 演示', fields: [] };

	applyPreset(_name: string): void {
		this.init(INIT_VALUES);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init(INIT_VALUES);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const values = (input.length >= 2 ? input : INIT_VALUES).slice(0, 10);
		const n = values.length;
		const tree = new Array(n + 1).fill(0);

		const lowbit = (x: number): number => x & -x;

		this._emit(
			'init',
			'初始数组 ' +
				values.join(', ') +
				'。tree 数组 1-based，tree[i] 管辖区间 [i-lowbit(i)+1, i]。',
			new Array(n).fill(0),
			1,
			[]
		);

		for (let i = 1; i <= n; i++) {
			let j = i;
			const path: number[] = [];
			while (j <= n) {
				tree[j] += values[i - 1];
				path.push(j);
				j += lowbit(j);
			}
			this._emit(
				'edge-select',
				'update(' +
					i +
					', ' +
					values[i - 1] +
					')：沿 lowbit 上行 ' +
					path.map((p) => 'tree[' + p + ']').join(' → ') +
					' 全部加上该值。',
				[...tree].slice(1),
				2,
				path.map((p) => p - 1)
			);
		}

		const qi = Math.min(7, n);
		let sum = 0;
		let cur = qi;
		const qPath: number[] = [];
		while (cur > 0) {
			sum += tree[cur];
			qPath.push(cur);
			cur -= lowbit(cur);
		}
		this._emit(
			'compare',
			'query(' +
				qi +
				')：沿 lowbit 下行 ' +
				qPath.map((p) => 'tree[' + p + '](' + tree[p] + ')').join(' + ') +
				'。',
			[...tree].slice(1),
			4,
			qPath.map((p) => p - 1)
		);
		this._emit(
			'edge-select',
			'前缀和 [1..' + qi + '] = ' + sum + '（两次跳跃链完成，O(log n)）。',
			[...tree].slice(1),
			5,
			qPath.map((p) => p - 1)
		);

		this._emit(
			'complete',
			'完成：update 与 query 都沿 lowbit 链跳跃，各 O(log n)。区间查询 = query(r) - query(l-1)。',
			[...tree].slice(1),
			6,
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		pseudocodeLine: number,
		hlIndices: number[]
	): void {
		const highlights: Highlight[] = [];
		if (hlIndices.length) highlights.push({ type: 'current', indices: hlIndices });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data,
			highlights,
			pseudocodeLine
		});
	}
}

const INIT_VALUES = [3, 2, 5, 7, 1, 4, 6, 8];
