/**
 * 跳表引擎 — SkipListEngine
 *
 * 跳表：多层有序链表。查找从顶层开始，逐层"向右比较、向下沉"；
 * 插入时随机决定该节点的层高（抛硬币），并把它接入沿途各层。
 * 为教学确定性，本引擎用固定伪随机序列（种子 42）代替 Math.random。
 * 渲染用 skiplist（多层横向链表）。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// 跳表插入',
	'function insert(key):',
	'  node = 头哨兵; 更新路径记录',
	'  for level = 最高层 downto 0:',
	'    while node.right.key < key: node = node.right   // 向右走',
	'    update[level] = node                            // 记录下沉点',
	'    node = node.down                                // 向下沉一层',
	'  随机层数 L（抛硬币）',
	'  for i = 0 to L: 在 update[i] 后接入新节点'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '跳表查找的时间复杂度是？',
		options: ['平均 O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
		correctAnswer: '平均 O(log n)',
		hint: '每层跳过一半节点',
		explanation:
			'上层链表是下层的"快速通道"，期望每层跳过约一半节点，查找从顶层向下、向右，平均比较 O(log n) 次——与平衡树相当但实现简单得多。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '新节点的层高如何决定？',
		options: [
			'随机抛硬币（每次 50% 概率再升一层）',
			'固定为 3 层',
			'等于键值 mod 层数上限',
			'由用户指定'
		],
		correctAnswer: '随机抛硬币（每次 50% 概率再升一层）',
		hint: '概率化替代严格平衡',
		explanation:
			'跳表用随机层数替代 AVL/红黑树的旋转再平衡：每个新节点以 1/2 概率逐层升高（封顶 MAX_LEVEL）。期望上各层节点数呈几何分布，维持 O(log n) 性能。'
	}
];

const DEFAULT_KEYS = [5, 12, 20, 33, 41, 56, 70, 85];
// 固定伪随机序列（教学确定性）：模拟抛硬币的层高
const COIN_SEQ = [1, 2, 1, 3, 1, 2, 1, 4];
const INSERT_SEQ = [25, 8, 60, 15];

export class SkipListEngine extends EngineBase<number[]> {
	readonly name = '跳表 Skip List';
	readonly renderType = 'skiplist' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'跳表：底层是有序链表，上层是下层的"快速通道"。查找从最高层向右比较、不匹配就下沉一层，平均 O(log n)。'
		},
		{
			type: 'compare',
			narration: '在当前层向右比较：右边的键更小就走过去；更大或不存在就下沉。'
		},
		{
			type: 'edge-select',
			narration: '找到插入位置：按抛硬币结果决定新节点的层高，逐层接入。'
		},
		{
			type: 'edge-reject',
			narration: '硬币反面：不再升高，插入完成。'
		},
		{
			type: 'complete',
			narration:
				'全部插入完成。跳表用随机层高替代旋转再平衡，期望性能与平衡树相当——Redis 的有序集合就是跳表实现的。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '初始 8 键 + 插入 4 键' }];

	customConfig: EngineCustomConfig = { title: '跳表演示', fields: [] };

	applyPreset(_name: string): void {
		this.init([0]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([0]);
	}

	init(_input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		// 底层链表
		let base = [...DEFAULT_KEYS].sort((a, b) => a - b);
		// 各层索引:level L 的节点从底层按固定模式抽取(演示用:每隔 2^L 取一个)
		const buildLevels = (baseKeys: number[]): number[][] => {
			const levels: number[][] = [baseKeys];
			for (let lv = 1; lv < 4; lv++) {
				const prev = levels[lv - 1];
				if (prev.length < 2) break;
				const upper = prev.filter((_, i) => i % 2 === 0);
				if (upper.length < 2) break;
				levels.push(upper);
			}
			return levels;
		};

		let levels = buildLevels(base);
		this._emit('init', '初始跳表：底层 8 个键，上层为快速通道（隔一取一）。', levels, -1, null);

		let coinIdx = 0;
		for (const key of INSERT_SEQ) {
			// 从顶层向下找插入位置(演示:线性扫描每层)
			const maxLv = levels.length - 1;
			for (let lv = maxLv; lv >= 0; lv--) {
				this._emit(
					'compare',
					`插入 ${key}：在第 ${lv} 层向右扫描，寻找最后一个 < ${key} 的节点。`,
					levels,
					lv,
					null
				);
			}
			// 底层插入
			base = [...base, key].sort((a, b) => a - b);
			levels = buildLevels(base);
			const coin = COIN_SEQ[coinIdx % COIN_SEQ.length];
			coinIdx++;
			this._emit(
				'edge-select',
				`${key} 接入底层；抛硬币得层高 ${coin}（${coin} > ${Math.min(levels.length - 1, 4)} 时截断为当前最大层）。重建上层索引。`,
				levels,
				0,
				key
			);
			this._emit(
				'edge-reject',
				`插入 ${key} 完成。当前底层 ${base.length} 个键。`,
				levels,
				-1,
				key
			);
		}

		this._emit(
			'complete',
			'插入完成。跳表期望高度 O(log n)，查找/插入/删除均为期望 O(log n)——Redis ZSet 的底层结构。',
			levels,
			-1,
			null
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		levels: number[][],
		curLevel: number,
		curKey: number | null,
		insertedKey?: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine: curLevel >= 0 ? Math.max(0, 3 - curLevel) : 0,
			skipList: {
				levels: levels.map((nodes, level) => ({ level, nodes: [...nodes] })),
				curLevel,
				curKey,
				insertedKey
			}
		});
	}
}
