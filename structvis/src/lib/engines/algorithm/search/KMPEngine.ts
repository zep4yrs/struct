/**
 * KMP 串匹配引擎 — KMPEngine
 *
 * 教材第 4 章：KMP 匹配。两阶段：
 * 1) 求模式串的 next 数组（j/k 双指针，失配时 k 回退 next[k]）；
 * 2) 匹配（i 扫描文本，j 扫描模式，失配时 j 回退 next[j]，j 退到 -1 哨兵则 i 前进）。
 * 每帧携带 kmp 快照（文本行 + 模式行 + next 数组行），由 kmp 渲染器绘制。
 */

import type {
	AlgorithmStep,
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	KmpData,
	PracticeQuestion,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

export interface KmpInput {
	text: string;
	pattern: string;
}

const KMP_PSEUDO: string[] = [
	'procedure getNext(t, m, next)', // 0
	'  j = 1; k = 0; next[1] = 0', // 1
	'  while j < m do', // 2
	'    if k = 0 或 t[j] = t[k] then', // 3
	'      j++; k++; next[j] = k', // 4
	'    else', // 5
	'      k = next[k]        // 前缀回退', // 6
	'  end while', // 7
	'procedure KMP(s, n, t, m)', // 8
	'  i = 1; j = 1', // 9
	'  while i <= n 且 j <= m do', // 10
	'    if j = 0 或 s[i] = t[j] then', // 11
	'      i++; j++', // 12
	'    else', // 13
	'      j = next[j]        // 模式右滑，i 不回退', // 14
	'  end while', // 15
	'  if j > m then return i - m', // 16
	'  else return 0' // 17
];

// 教材示例：文本（17 字符），模式 'abaabcac'，首次匹配位置 6（1-based）
const DEFAULT_TEXT = 'acabaabaabcacaabc';
const DEFAULT_PATTERN = 'abaabcac';

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 7,
		prompt: "模式串 'abaabcac' 的 next[4] 等于？",
		options: ['1', '2', '3', '4'],
		correctAnswer: '2',
		hint: 'next[j] 是"失配时 j 回退的位置"，由最长相等前后缀决定',
		explanation:
			"前缀 'a' 与后缀 'a' 等长 1，教材 1-based 记法 next[4] = 2（长度 + 1）。完整 next 数组为 0, 1, 1, 2, 2, 3, 1, 2。"
	},
	{
		type: 'choose-next',
		stepIndex: 49,
		prompt: '模式首次出现在文本中的位置是？',
		options: ['4', '6', '8', '10'],
		correctAnswer: '6',
		hint: '匹配完成后 j = m + 1，起始位置 = i - m',
		explanation:
			'匹配成功后 i = 14（1-based），m = 8，起始位置 = 14 - 8 = 6。KMP 全程 i 不回退，只靠 next 数组右滑模式。'
	}
];

export class KMPEngine extends EngineBase<KmpInput> {
	readonly name = '串的模式匹配';
	readonly renderType = 'kmp' as const;

	pseudocode: string[] = KMP_PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'串匹配：在长文本中查找模式串。暴力匹配每次失配都要回退文本指针 i；KMP 预处理出 next 数组，失配时让模式右滑，i 从不回退。'
		},
		{
			type: 'compare',
			narration: '比较字符：先求出 next 数组，再进入匹配。'
		},
		{
			type: 'edge-select',
			narration: '字符相等，双指针前进，匹配位置前移。'
		},
		{
			type: 'edge-reject',
			narration: '字符失配：借助 next 数组右滑模式，保持文本指针不回退。'
		},
		{
			type: 'complete',
			narration:
				'匹配完成。KMP 时间复杂度 O(n + m)：next 数组预处理 O(m)，匹配阶段 i 只增不减。next 数组是 KMP 的灵魂，记录了模式串自身的结构。'
		}
	];

	private _text = '';
	private _pattern = '';
	private _next: number[] = [];

	presets: EnginePreset[] = [
		{ name: '教材示例（命中）', description: `文本 ${DEFAULT_TEXT}，模式 ${DEFAULT_PATTERN}` },
		{ name: '示例（失败）', description: '文本 acabaabaabcacaabc，模式 abab' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义串',
		fields: [
			{
				key: 'text',
				label: '文本串 s',
				type: 'text',
				placeholder: '字母/数字串，如 acabaabaabcacaabc',
				default: DEFAULT_TEXT
			},
			{
				key: 'pattern',
				label: '模式串 t',
				type: 'text',
				placeholder: '如 abaabcac',
				default: DEFAULT_PATTERN
			}
		]
	};

	applyPreset(name: string): void {
		if (name.includes('失败')) {
			this.init({ text: DEFAULT_TEXT, pattern: 'abab' });
		} else {
			this.init({ text: DEFAULT_TEXT, pattern: DEFAULT_PATTERN });
		}
	}

	applyCustom(values: Record<string, string>): void {
		const text = (values.text ?? '').trim();
		const pattern = (values.pattern ?? '').trim();
		if (!text) throw new Error('请输入文本串');
		if (!pattern) throw new Error('请输入模式串');
		if (text.length < 2 || text.length > 60) throw new Error('文本串长度需在 2 ~ 60 之间');
		if (pattern.length < 1 || pattern.length > text.length)
			throw new Error('模式串长度需在 1 ~ 文本长度之间');
		if (pattern.includes(' ') || text.includes(' ')) throw new Error('串中不能包含空格');
		this.init({ text, pattern });
	}

	init(input: KmpInput): void {
		const { text, pattern } = input;
		this._text = text;
		this._pattern = pattern;
		this._next = [];

		this.steps = [];
		this._stepId = 0;

		const n = text.length;
		const m = pattern.length;

		this._emit(
			'init',
			`文本串（${n} 字符）：${text}；模式串（${m} 字符）：${pattern}。第一步先求 next 数组。`,
			'compare',
			0,
			0,
			undefined,
			true,
			1
		);

		// 阶段 1：求 next（教材 1-based 记法，存到下标 1..m，下标 0 占位）
		const next: number[] = new Array(m + 1).fill(0);
		next[1] = 0;
		let j = 1;
		let k = 0;
		while (j < m) {
			if (k === 0 || pattern[j - 1] === pattern[k - 1]) {
				const stillJPos = k === 0 ? 1 : j;
				this._emit(
					'compare',
					k === 0
						? `k = 0：前缀指针归零，无条件让 j 与 k 前进。`
						: `t[${j}]（${pattern[j - 1]}）与 t[${k}]（${pattern[k - 1]}）相等，j 与 k 同时前进。`,
					'compare',
					stillJPos - 1,
					k === 0 ? 0 : k - 1,
					undefined,
					true,
					3
				);
				j++;
				k++;
				next[j] = k;
				this._next = [...next];
				this._emit(
					'edge-select',
					`next[${j}] = ${k}（最长相等前后缀长度 ${k - 1}，1-based 记法 +1）。`,
					'match',
					j - 1,
					k - 1,
					j,
					true,
					4
				);
			} else {
				this._emit(
					'edge-reject',
					`t[${j}]（${pattern[j - 1]}）≠ t[${k}]（${pattern[k - 1]}），k 回退：k = next[${k}] = ${next[k]}。`,
					'mismatch',
					j - 1,
					k - 1,
					undefined,
					true,
					6
				);
				k = next[k];
			}
		}
		this._next = [...next];

		// 阶段 2：匹配（j 为 0-based 模式下标，-1 为哨兵）
		this._emit(
			'compare',
			'next 数组计算完成：0, ... 1-based 值。进入匹配阶段，i 扫描文本、j 扫描模式，失配时 j 回退 next[j] 而 i 永不动。',
			'compare',
			0,
			0,
			undefined,
			true,
			8
		);

		let i = 0;
		j = 0;
		while (i < n && j < m) {
			if (j === -1 || text[i] === pattern[j]) {
				const fromSentinel = j === -1;
				this._emit(
					'compare',
					fromSentinel
						? `j 已回退到哨兵 -1：模式彻底右滑到头，i 前进一位，重新从模式头比较 s[${i + 1}]（${text[i]}）。`
						: `s[${i + 1}]（${text[i]}）= t[${j + 1}]（${pattern[j]}），i 与 j 同步前进。`,
					'compare',
					i,
					Math.max(j, 0),
					undefined,
					false,
					11
				);
				i++;
				j++;
				if (fromSentinel) {
					this._emit(
						'edge-reject',
						`i 前进到 ${i + 1}，j 重置为 0，重新与模式头比较。`,
						'compare',
						i,
						0,
						undefined,
						false,
						12
					);
				} else {
					this._emit(
						'edge-select',
						`已连续匹配 ${j} 个字符。`,
						'match',
						i,
						j - 1,
						undefined,
						false,
						12
					);
				}
			} else {
				this._emit(
					'edge-reject',
					`s[${i + 1}]（${text[i]}）≠ t[${j + 1}]（${pattern[j]}），j 回退：j = next[${j + 1}] = ${next[j + 1]}（0-based 记作 ${next[j + 1] - 1}），i 不回退。`,
					'mismatch',
					i,
					j,
					undefined,
					false,
					14
				);
				j = next[j + 1] - 1;
			}
		}

		if (j >= m) {
			const start = i - m;
			this._emit(
				'complete',
				`匹配成功：模式 ${pattern} 首次出现于文本位置 ${start + 1}（1-based）。i 全程单调不回退，共比较 ${i} 个字符。`,
				'found',
				start,
				m - 1,
				undefined,
				false,
				16
			);
		} else {
			this._emit(
				'complete',
				`匹配失败：模式 ${pattern} 未出现在文本中。`,
				'failed',
				i,
				0,
				undefined,
				false,
				17
			);
		}
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		phase: KmpData['phase'],
		i: number,
		j: number,
		nextIndex: number | undefined,
		buildNext: boolean,
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...this._next],
			highlights: [],
			pseudocodeLine,
			kmp: {
				text: this._text,
				pattern: this._pattern,
				i,
				j,
				phase,
				buildNext,
				next: [...this._next],
				nextIndex
			}
		});
	}

}
