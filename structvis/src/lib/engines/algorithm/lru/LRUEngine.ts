/**
 * LRU 缓存引擎 — LRUEngine
 *
 * LRU（最近最少使用）缓存：哈希表 + 双向链表。
 * get(key)：命中则把节点移到头部（MRU 端）；未命中返回 -1。
 * put(key)：存在则更新并移头；不存在则插入头部，超容量时淘汰尾部（LRU 端）。
 * 数组快照 data = 链表顺序（index 0 = MRU 头部，末尾 = LRU 尾部），渲染用 array。
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
	'// LRU：哈希表定位 + 双向链表维护顺序',
	'get(key):',
	'  if key in map: 节点移到链表头; return value',
	'  else: return -1',
	'put(key, value):',
	'  if key in map: 更新值 + 移到头',
	'  else:',
	'    if size == capacity: 淘汰链表尾（LRU）',
	'    新节点插到链表头'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'LRU 淘汰的是哪个元素？',
		options: ['最久未被访问的（链表尾）', '最早插入的', '值最小的', '随机一个'],
		correctAnswer: '最久未被访问的（链表尾）',
		hint: 'Least Recently Used',
		explanation:
			'LRU 维护"访问时间序"：每次 get/put 都把元素移到头部（MRU 端），链表尾就是最久未使用的——容量满时淘汰它。'
	},
	{
		type: 'choose-next',
		stepIndex: 5,
		prompt: '为什么用双向链表而不是单链表？',
		options: ['O(1) 删除中间节点（需要前驱指针）', '节省内存', '查找更快', '可以存更多数据'],
		correctAnswer: 'O(1) 删除中间节点（需要前驱指针）',
		hint: '移到头部 = 先删除再头插',
		explanation:
			'把节点移到头部需要先从中间摘除——单链表找前驱要 O(n)。双向链表直接 prev/next 修改指针，配合哈希表整体 O(1)。'
	}
];

interface LruOp {
	op: 'get' | 'put';
	key: number;
	value?: number;
}

const CAPACITY = 4;
const OPS: LruOp[] = [
	{ op: 'put', key: 1, value: 11 },
	{ op: 'put', key: 2, value: 22 },
	{ op: 'put', key: 3, value: 33 },
	{ op: 'get', key: 1 },
	{ op: 'put', key: 4, value: 44 },
	{ op: 'put', key: 5, value: 55 },
	{ op: 'get', key: 2 },
	{ op: 'put', key: 6, value: 66 }
];

export class LRUEngine extends EngineBase<number[]> {
	readonly name = 'LRU 缓存';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'LRU 缓存（容量 4）：哈希表 O(1) 定位 + 双向链表维护访问顺序。头部是最新访问，尾部即将被淘汰。'
		},
		{
			type: 'compare',
			narration: 'get 命中：节点移到链表头。'
		},
		{
			type: 'edge-select',
			narration: 'put 新键：插入头部；若超容量则淘汰尾部的最久未使用节点。'
		},
		{
			type: 'complete',
			narration:
				'操作序列结束。LeetCode 146 题就是这个结构——面试高频，核心是哈希表与双向链表的组合。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '容量 4，8 步操作序列' }];

	customConfig: EngineCustomConfig = { title: 'LRU 演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		const list: { key: number; value: number }[] = []; // index 0 = MRU
		const cap = CAPACITY;
		let hits = 0;
		let misses = 0;
		let evicted = 0;

		const snapshot = () => list.map((x) => x.key);

		this._emit(
			'init',
			`LRU 缓存（容量 ${cap}）：数组视图 = 双向链表顺序，左端 MRU / 右端 LRU。`,
			snapshot(),
			0,
			[],
			'空缓存'
		);

		for (const op of OPS) {
			if (op.op === 'get') {
				const idx = list.findIndex((x) => x.key === op.key);
				if (idx >= 0) {
					hits++;
					const [node] = list.splice(idx, 1);
					list.unshift(node);
					this._emit(
						'compare',
						`get(${op.key}) 命中（命中率 ${hits}/${hits + misses}）：节点移到链表头（MRU）。`,
						snapshot(),
						1,
						[0],
						`缓存: [${list.map((x) => x.key + '=' + x.value).join(', ')}]`
					);
				} else {
					misses++;
					this._emit(
						'edge-reject',
						`get(${op.key}) 未命中（返回 -1）。命中率 ${hits}/${hits + misses}。`,
						snapshot(),
						1,
						[],
						`缓存: [${list.map((x) => x.key + '=' + x.value).join(', ')}]`
					);
				}
			} else {
				const idx = list.findIndex((x) => x.key === op.key!);
				if (idx >= 0) {
					const [node] = list.splice(idx, 1);
					node.value = op.value!;
					list.unshift(node);
					this._emit(
						'edge-select',
						`put(${op.key}, ${op.value})：已存在 → 更新值并移到头部。`,
						snapshot(),
						4,
						[0],
						`缓存: [${list.map((x) => x.key + '=' + x.value).join(', ')}]`
					);
				} else {
					if (list.length >= cap) {
						const evictedNode = list.pop()!;
						evicted++;
						this._emit(
							'edge-reject',
							`缓存已满：淘汰尾部 LRU 节点 key=${evictedNode.key}（最久未使用）。`,
							snapshot(),
							5,
							[list.length - 1],
							`淘汰 key=${evictedNode.key}`
						);
					}
					list.unshift({ key: op.key!, value: op.value! });
					this._emit(
						'edge-select',
						`put(${op.key}, ${op.value})：新节点插入头部。当前 ${list.length}/${cap}。`,
						snapshot(),
						6,
						[0],
						`缓存: [${list.map((x) => x.key + '=' + x.value).join(', ')}]`
					);
				}
			}
		}

		this._emit(
			'complete',
			`操作完成：命中 ${hits} 次、未命中 ${misses} 次、淘汰 ${evicted} 次。最终缓存（MRU→LRU）：[${list.map((x) => x.key).join(', ')}]。`,
			snapshot(),
			7,
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		pseudocodeLine: number,
		hlIndices: number[],
		note?: string
	): void {
		const highlights: Highlight[] = [];
		if (hlIndices.length) highlights.push({ type: 'current', indices: hlIndices });
		this.steps.push({
			id: this._stepId++,
			type,
			description: note ? description + '　' + note : description,
			data,
			highlights,
			pseudocodeLine
		});
	}
}
