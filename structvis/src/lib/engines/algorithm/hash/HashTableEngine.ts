/**
 * 哈希表引擎 — HashTableEngine
 *
 * 教材第 9 章：哈希（散列）表。
 * 除留余数法 H(key) = key mod m 把关键字映射到 [0, m-1] 的槽位；
 * 冲突无法避免，本引擎演示两种经典解决方式：
 *   1) 线性探测再散列（开放定址）：从 H(key) 起依次探测后继槽位，遇空放入；
 *   2) 链地址法：同义词挂到同一槽位的链表上（本引擎采用表尾插入）。
 * 完成帧给出成功平均查找长度 ASL(成功) = 各关键字探测次数之和 / n。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	HashData,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';
import { parseNumberList } from '../parseInput';

export type HashMode = 'construct' | 'search' | 'chain';

export interface HashInput {
	keys: number[];
	mode: HashMode;
	size: number;
	target?: number;
}

const CONSTRUCT_PSEUDO: string[] = [
	'procedure createHash(T, m, keys)',
	'  for each key in keys do',
	'    h = H(key) = key mod m',
	'    i = 0',
	'    while T[(h + i) mod m] 非空 do',
	'      i = i + 1              // 冲突：线性探测下一槽',
	'    T[(h + i) mod m] = key   // 找到空槽，放入',
	'  end for',
	'end procedure'
];

const SEARCH_PSEUDO: string[] = [
	'procedure hashSearch(T, m, key)',
	'  h = H(key) = key mod m',
	'  i = 0',
	'  while T[(h + i) mod m] ≠ 空 且 T[(h + i) mod m] ≠ key do',
	'    i = i + 1',
	'  if T[(h + i) mod m] = key then return 成功',
	'  else return 失败             // 探测到空槽',
	'end procedure'
];

const CHAIN_PSEUDO: string[] = [
	'procedure chainCreate(H, m, keys)',
	'  for each key in keys do',
	'    h = H(key) = key mod m',
	'    在链表 H[h] 的表尾插入 key',
	'  end for',
	'end procedure'
];

const PSEUDO_BY_MODE: Record<HashMode, string[]> = {
	construct: CONSTRUCT_PSEUDO,
	search: SEARCH_PSEUDO,
	chain: CHAIN_PSEUDO
};

// 教材示例：线性探测（m = 11），关键字 22, 41, 53, 46, 30, 13, 01, 67
// 表尾结果：[22, 01, 46, 13, 67, 空, 空, 空, 41, 53, 30]，ASL(成功) = 14/8 = 1.75
const LINEAR_KEYS = [22, 41, 53, 46, 30, 13, 1, 67];

// 教材示例：链地址法（m = 13），ASL(成功) = 21/12 = 1.75
const CHAIN_KEYS = [19, 14, 23, 1, 68, 20, 84, 27, 55, 11, 10, 79];

// 显示为教材记法（01 而非 1）
const KEY_LABELS: Record<number, string> = { 1: '01' };

function keyText(k: number): string {
	return KEY_LABELS[k] ?? String(k);
}

const PRACTICE_BY_MODE: Record<HashMode, PracticeQuestion[]> = {
	construct: [
		{
			type: 'choose-next',
			stepIndex: 12,
			prompt: 'H(x) = x mod 11，插入 30 时探测了哪几个槽位？',
			options: ['8 → 9 → 10', '8 → 9', '2 → 3 → 4', '8 → 9 → 10 → 11'],
			correctAnswer: '8 → 9 → 10',
			hint: 'H(30) = 30 mod 11 = 8，冲突后沿后继槽位逐个探测',
			explanation:
				'H(30) = 8，但槽 8 已放 41、槽 9 已放 53，继续探测到槽 10 为空，放入。共探测 3 次。'
		},
		{
			type: 'choose-next',
			stepIndex: 23,
			prompt: '该哈希表的 ASL(成功)（成功平均查找长度）是多少？',
			options: ['14/8 = 1.75', '12/8 = 1.5', '16/8 = 2.0', '18/8 = 2.25'],
			correctAnswer: '14/8 = 1.75',
			hint: '每个关键字的探测次数之和 ÷ 关键字个数',
			explanation:
				'各关键字探测次数：22/41/53/46/01 各 1 次，13 为 2 次，30 为 3 次，67 为 4 次，合计 14，ASL(成功) = 14/8 = 1.75。'
		}
	],
	search: [
		{
			type: 'choose-next',
			stepIndex: 5,
			prompt: '在构造好的表中查找 67，需要探测几次？',
			options: ['2 次', '3 次', '4 次', '5 次'],
			correctAnswer: '4 次',
			hint: '从 H(67) = 67 mod 11 = 1 出发沿探测序列找',
			explanation:
				'H(67) = 1，槽 1 是 01、槽 2 是 46、槽 3 是 13，都不匹配，直到槽 4 命中 67，共探测 4 次。'
		}
	],
	chain: [
		{
			type: 'choose-next',
			stepIndex: 24,
			prompt: 'm = 13 的链地址法中，79 挂在哪个槽位？',
			options: ['槽 1（第 4 个结点）', '槽 6', '槽 3', '槽 10'],
			correctAnswer: '槽 1（第 4 个结点）',
			hint: 'H(79) = 79 mod 13 = 1，链上结点按插入顺序排列',
			explanation:
				'H(79) = 79 mod 13 = 1，槽 1 的链为 14 → 01 → 27 → 79（表尾插入），79 是第 4 个结点。'
		}
	]
};

export class HashTableEngine extends EngineBase<HashInput> {
	readonly name = '哈希表';
	readonly renderType = 'hashtable' as const;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'哈希表用散列函数 H(key) 把关键字直接映射到槽位，理想情况下一次存取。但两个关键字映射到同一槽位就会冲突，必须解决：线性探测沿后继槽位找空位，链地址法把同义词挂成链表。'
		},
		{
			type: 'compare',
			narration: '线性探测：从 H(key) 出发依次查看后继槽位，命中或遇空槽即停。'
		},
		{
			type: 'edge-reject',
			narration: '冲突：目标槽位已被占用，按探测函数继续找下一个可用位置。'
		},
		{
			type: 'edge-select',
			narration: '找到空槽放入关键字 / 探测命中目标。'
		},
		{
			type: 'complete',
			narration:
				'构造完成。装填因子 α = n/m 越大冲突越多：线性探测法应控制在 0.5~0.8，链地址法则允许 α 接近 1。'
		}
	];

	private _mode: HashMode = 'construct';
	private _size = 11;
	private _slots: (number | null)[] = [];
	private _chains: number[][] = [];
	private _curKey = -1;
	private _probe: number[] = [];
	private _current = -1;
	private _placed = -1;
	private _found: boolean | undefined = undefined;
	private _summary = '';

	presets: EnginePreset[] = [
		{ name: '线性探测·构造', description: '关键字 22,41,53,46,30,13,01,67，m = 11' },
		{ name: '线性探测·查找', description: '同一张表查找 67（探测 4 次命中）' },
		{ name: '链地址法·构造', description: '关键字 19,14,23,01,68,20,84,27,55,11,10,79，m = 13' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义哈希表',
		fields: [
			{
				key: 'mode',
				label: '演示内容',
				type: 'select',
				options: [
					{ value: 'construct', label: '线性探测·构造' },
					{ value: 'search', label: '线性探测·查找' },
					{ value: 'chain', label: '链地址法·构造' }
				],
				default: 'construct'
			},
			{
				key: 'size',
				label: '表长 m（槽位数）',
				type: 'text',
				placeholder: '整数，5 ~ 19',
				default: '11'
			},
			{
				key: 'keys',
				label: '关键字序列',
				type: 'text',
				placeholder: '逗号分隔，如 22, 41, 53, 46, 30, 13, 1, 67',
				default: '22, 41, 53, 46, 30, 13, 1, 67'
			},
			{
				key: 'target',
				label: '查找目标值（查找模式）',
				type: 'text',
				placeholder: '整数，如 67',
				default: '67'
			}
		]
	};

	applyPreset(name: string): void {
		if (name.includes('查找')) {
			this.init({ keys: LINEAR_KEYS, mode: 'search', size: 11, target: 67 });
		} else if (name.includes('链地址')) {
			this.init({ keys: CHAIN_KEYS, mode: 'chain', size: 13 });
		} else {
			this.init({ keys: LINEAR_KEYS, mode: 'construct', size: 11 });
		}
	}

	applyCustom(values: Record<string, string>): void {
		const size = parseInt((values.size ?? '').trim(), 10);
		if (isNaN(size) || size < 5 || size > 19) throw new Error('表长 m 必须是 5 ~ 19 的整数');
		const keys = parseNumberList(values.keys ?? '', { min: 2, max: size, label: '关键字' });
		for (const k of keys) {
			if (k < 0) throw new Error('关键字必须是非负整数');
		}
		const mode = (values.mode ?? 'construct') as HashMode;
		const target = parseInt((values.target ?? '').trim(), 10);
		if (mode === 'search' && isNaN(target)) throw new Error('查找模式需要输入目标值');
		this.init({ keys, mode, size, target });
	}

	init(input: HashInput): void {
		const { keys, mode, size, target } = input;
		this._mode = mode;
		this.pseudocode = PSEUDO_BY_MODE[mode];
		this.practiceQuestions = PRACTICE_BY_MODE[mode];

		this.steps = [];
		this._stepId = 0;
		this._size = size;
		this._slots = new Array(size).fill(null);
		this._chains = Array.from({ length: size }, () => []);
		this._summary = '';

		this._emit('init', `除留余数法 H(x) = x mod ${size}。${this._modeLabel(mode)}。`, 0, []);

		switch (mode) {
			case 'construct':
				this._genLinearBuild(keys);
				break;
			case 'search':
				this._genLinearBuild(keys, true);
				this._genLinearSearch(target ?? -1);
				break;
			case 'chain':
				this._genChainBuild(keys);
				break;
		}
		this.totalSteps = this.steps.length;
	}

	// ---------- 线性探测（构造 / 查找） ----------

	private _genLinearBuild(keys: number[], silent = false): void {
		let probesSum = 0;
		for (const k of keys) {
			const h = this._hash(k);
			if (silent) {
				// 查找模式：表已构造好，不逐帧回放
				probesSum += this._linearPlace(k, true);
				continue;
			}
			this._markKey(k);
			this._emit('compare', `H(${keyText(k)}) = ${keyText(k)} mod ${this._size} = ${h}。`, 2, [
				{ type: 'compare', indices: [h], label: `H=${h}` }
			]);
			const probes = this._linearPlace(k, false);
			probesSum += probes;
		}
		this._summary = `ASL(成功) = ${probesSum}/${keys.length} = ${(probesSum / keys.length).toFixed(2)}`;
		if (!silent) {
			this._emit(
				'complete',
				`构造完成：${this._summary}。装填因子 α = ${keys.length}/${this._size}。`,
				8,
				[]
			);
		}
	}

	/** 线性探测放入 key，返回探测次数；非 silent 时逐帧发步骤 */
	private _linearPlace(key: number, silent: boolean): number {
		const h = this._hash(key);
		let i = 0;
		while (i < this._size && this._slots[(h + i) % this._size] !== null) {
			const idx = (h + i) % this._size;
			if (!silent) {
				this._probe = [...this._probe, idx];
				this._current = idx;
				this._emit(
					'edge-reject',
					`冲突：槽 ${idx} 已被 ${this._slots[idx]} 占用，探测下一槽。`,
					5,
					[{ type: 'compare', indices: [idx], label: '冲突' }]
				);
			}
			i++;
		}
		const target = (h + i) % this._size;
		this._slots[target] = key;
		if (!silent) {
			this._probe = [...this._probe, target];
			this._current = -1;
			this._placed = target;
			this._emit(
				'edge-select',
				`槽 ${target} 为空，${keyText(key)} 放入槽 ${target}（探测 ${i + 1} 次）。`,
				7,
				[{ type: 'sorted', indices: [target], label: keyText(key) }]
			);
			this._probe = [];
			this._placed = -1;
		}
		return i + 1;
	}

	private _genLinearSearch(target: number): void {
		const h = this._hash(target);
		let i = 0;
		let found = false;
		this._markKey(target);
		this._emit(
			'compare',
			`查找 ${keyText(target)}：H = ${keyText(target)} mod ${this._size} = ${h}。`,
			1,
			[{ type: 'compare', indices: [h], label: `H=${h}` }]
		);
		while (i < this._size) {
			const idx = (h + i) % this._size;
			const v = this._slots[idx];
			if (v === null) break;
			if (v === target) {
				found = true;
				this._probe = [...this._probe, idx];
				this._current = -1;
				this._placed = idx;
				this._emit('edge-select', `槽 ${idx} = ${keyText(target)}，命中！共探测 ${i + 1} 次。`, 5, [
					{ type: 'sorted', indices: [idx], label: '命中' }
				]);
				break;
			}
			this._probe = [...this._probe, idx];
			this._current = idx;
			this._emit('edge-reject', `槽 ${idx} = ${v} ≠ ${keyText(target)}，继续探测。`, 3, [
				{ type: 'compare', indices: [idx], label: `${i + 1}` }
			]);
			i++;
		}
		this._found = found;
		if (!found) {
			const idx = (h + i) % this._size;
			this._probe = [...this._probe, idx];
			this._current = idx;
			this._emit(
				'edge-reject',
				`槽 ${idx} 为空：${keyText(target)} 不在表中，查找失败（探测 ${i + 1} 次）。`,
				4,
				[{ type: 'compare', indices: [idx], label: '空槽' }]
			);
		}
		this._emit(
			'complete',
			found
				? `查找成功：${keyText(target)} 位于槽 ${this._placed}。`
				: `查找失败：${keyText(target)} 不在表中。`,
			6,
			[]
		);
	}

	// ---------- 链地址法 ----------

	private _genChainBuild(keys: number[]): void {
		let probesSum = 0;
		for (const k of keys) {
			const h = this._hash(k);
			this._markKey(k);
			this._emit('compare', `H(${keyText(k)}) = ${keyText(k)} mod ${this._size} = ${h}。`, 2, [
				{ type: 'compare', indices: [h], label: `H=${h}` }
			]);
			this._chains[h].push(k);
			probesSum += this._chains[h].length;
			this._current = h;
			this._emit(
				'edge-select',
				`${keyText(k)} 挂到槽 ${h} 的链尾（第 ${this._chains[h].length} 个结点）。`,
				3,
				[{ type: 'sorted', indices: [h], label: keyText(k) }]
			);
			this._current = -1;
		}
		this._summary = `ASL(成功) = ${probesSum}/${keys.length} = ${(probesSum / keys.length).toFixed(2)}`;
		this._emit('complete', `构造完成：${this._summary}。`, 6, []);
	}

	// ---------- 工具 ----------

	private _hash(key: number): number {
		return ((key % this._size) + this._size) % this._size;
	}

	private _markKey(key: number): void {
		this._curKey = key;
		this._probe = [];
		this._current = -1;
		this._placed = -1;
		this._found = undefined;
	}

	private _modeLabel(mode: HashMode): string {
		return mode === 'chain'
			? '链地址法：同义词挂链表，表尾插入'
			: mode === 'search'
				? '线性探测查找'
				: '线性探测构造：冲突时探测后继槽位';
	}

	private _snapshot(): HashData {
		const out: HashData = {
			mode: this._mode === 'chain' ? 'chain' : 'linear',
			size: this._size,
			slots: [...this._slots],
			summary: this._summary
		};
		if (this._mode === 'chain') {
			const chains: Record<number, number[]> = {};
			for (let i = 0; i < this._size; i++) {
				if (this._chains[i].length > 0) chains[i] = [...this._chains[i]];
			}
			out.chains = chains;
		}
		if (this._curKey !== -1) {
			out.key = this._curKey;
			out.keyLabel = keyText(this._curKey);
			out.hashValue = this._hash(this._curKey);
		}
		if (this._probe.length) out.probe = [...this._probe];
		if (this._current !== -1) out.current = this._current;
		if (this._placed !== -1) out.placed = this._placed;
		if (this._found !== undefined) out.found = this._found;
		return out;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		highlights: Highlight[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			hash: this._snapshot()
		});
	}

}
