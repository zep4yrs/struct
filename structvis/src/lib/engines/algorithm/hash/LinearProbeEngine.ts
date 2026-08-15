/**
 * 哈希表：线性探测开放定址引擎 — LinearProbeEngine
 *
 * 教材第 8 章：除留余数法 H(x) = x mod m，冲突时从冲突槽开始依次探测后继槽位
 * （+1、+2…），遇到空槽放入。构造完成后统计 ASL（平均查找长度）。
 * 渲染用 hashtable 渲染器的 linear 模式：probe 数组高亮探测路径，placed 标记落点。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType,
	HashData
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// 线性探测法插入',
	'procedure hashInsert(T, key, m)',
	'  h = key mod m',
	'  while T[h] 非空 do',
	'    h = (h + 1) mod m     // 向后探测',
	'  end while',
	'  T[h] = key',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '线性探测遇到冲突时，下一步探测哪个位置？',
		options: ['随机位置', '冲突位置的下一个槽位', '表头', '重新散列'],
		correctAnswer: '冲突位置的下一个槽位',
		hint: '逐个向后找空位',
		explanation:
			'线性探测：冲突时按 (h+1) mod m、(h+2) mod m … 顺序向后探测，遇到空槽放入。缺点是容易产生聚集（连续占用区），但实现最简单。'
	}
];

export class LinearProbeEngine extends EngineBase<number[]> {
	readonly name = '线性探测（开放定址）';
	readonly renderType = 'hashtable' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'开放定址法解决哈希冲突：元素直接存在哈希表里，发生冲突时按线性探测规则（逐个向后）寻找下一个空槽放入。'
		},
		{
			type: 'compare',
			narration: '用除留余数法计算散列位置：H(x) = x mod m。'
		},
		{
			type: 'edge-candidate',
			narration: '目标槽被占用，发生冲突：开始线性探测，向后寻找空位。'
		},
		{
			type: 'edge-select',
			narration: '找到空槽，元素放入。'
		},
		{
			type: 'complete',
			narration:
				'构造完成。线性探测简单直观，但容易形成聚集：连续占用的槽越长，后续插入的探测次数越多。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '示例 A', description: '[47, 7, 29, 11, 16, 92, 22, 8, 3] · m=11' },
		{ name: '示例 B', description: '[19, 14, 23, 1, 68, 20, 84, 27, 55, 11, 10, 79] · m=13' }
	];

	customConfig: EngineCustomConfig = {
		title: '关键字序列',
		fields: [
			{
				key: 'data',
				label: '关键字序列',
				type: 'text',
				placeholder: '逗号分隔的整数，如 47, 7, 29, 11, 16',
				default: '47, 7, 29, 11, 16, 92, 22, 8, 3'
			}
		]
	};

	applyPreset(name: string): void {
		const data: number[] | undefined = {
			'示例 A': [47, 7, 29, 11, 16, 92, 22, 8, 3],
			'示例 B': [19, 14, 23, 1, 68, 20, 84, 27, 55, 11, 10, 79]
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(/[,，\s]+/)
			.map((s) => Number(s.trim()))
			.filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0);
		if (nums.length < 2) throw new Error('至少需要 2 个非负整数');
		this.init(nums);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;

		// 表长：大于元素数的最小素数附近（简单取 next odd > n*1.5）
		const n = input.length;
		let m = Math.max(7, Math.ceil(n * 1.5));
		if (m % 2 === 0) m += 1;
		this._size = m;
		this._slots = Array(m).fill(-1);

		this._emit(
			'init',
			'线性探测：表长 m = ' + m + '，H(x) = x mod ' + m + '，冲突时向后探测。',
			0,
			[]
		);

		let probesSum = 0;
		for (const k of input) {
			const h = this._hash(k);
			this._curKey = k;
			this._probe = [];
			this._current = -1;
			this._placed = -1;
			this._emit('compare', 'H(' + k + ') = ' + k + ' mod ' + m + ' = ' + h + '。', 2, [
				{ type: 'compare', indices: [h], label: 'H=' + h }
			]);
			let pos = h;
			let probes = 1;
			while (this._slots[pos] !== -1) {
				this._probe = [...this._probe, pos];
				this._current = pos;
				this._emit(
					'edge-candidate',
					'槽 ' + pos + ' 被 ' + this._slots[pos] + ' 占用，冲突：探测下一个位置。',
					3,
					[{ type: 'compare', indices: [pos], label: '冲突' }]
				);
				pos = (pos + 1) % m;
				probes++;
			}
			this._slots[pos] = k;
			this._probe = [...this._probe, pos];
			this._placed = pos;
			this._current = -1;
			probesSum += probes;
			this._emit(
				'edge-select',
				'槽 ' + pos + ' 空闲，' + k + ' 放入。探测 ' + probes + ' 次。',
				4,
				[{ type: 'sorted', indices: [pos], label: '' + k }]
			);
		}

		this._summary = 'ASL(成功) = ' + probesSum + '/' + n + ' = ' + (probesSum / n).toFixed(2);
		this._curKey = -1;
		this._probe = [];
		this._placed = -1;
		this._emit('complete', '构造完成：' + this._summary + '。', 5, []);
		this.totalSteps = this.steps.length;
	}

	// ---------- 状态 ----------
	private _size = 7;
	private _slots: number[] = [];
	private _curKey = -1;
	private _probe: number[] = [];
	private _current = -1;
	private _placed = -1;
	private _summary = '';

	private _hash(key: number): number {
		return ((key % this._size) + this._size) % this._size;
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		highlights: Highlight[]
	): void {
		const hash: HashData = {
			mode: 'linear',
			size: this._size,
			slots: [...this._slots],
			summary: this._summary
		};
		if (this._curKey !== -1) {
			hash.key = this._curKey;
			hash.keyLabel = String(this._curKey);
			hash.hashValue = this._hash(this._curKey);
		}
		if (this._probe.length) hash.probe = [...this._probe];
		if (this._current !== -1) hash.current = this._current;
		if (this._placed !== -1) hash.placed = this._placed;
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			hash
		});
	}
}
