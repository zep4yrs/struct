/**
 * Sunday 匹配引擎 — SundayEngine
 *
 * Sunday 算法（BM 的简化变体）：
 *   对齐后从左到右比较；失配时看「参与对齐区间的下一个文本字符 c」，
 *   若 c 在模式中出现，把模式右移使两者的最右出现对齐；否则直接跳过 |P|+1 位。
 *   平均复杂度 O(n)，实践中比 KMP 更快。
 * 每步 sunday 快照：文本行 + 模式行 + 偏移表。渲染用 sunday。
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
	'// Sunday 匹配',
	'构建偏移表 offset[c] = 字符 c 在模式中最右出现位置（从右数）',
	'i = 0',
	'while i + |P| <= |T|:',
	'  j = 0..|P|-1 逐位比较 T[i+j] 与 P[j]',
	'  if 全部匹配: 命中于 i',
	'  else: c = T[i + |P|]',
	'    i += offset[c] ?? |P| + 1   // 大步跳跃'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: 'Sunday 失配时看哪个字符决定跳跃？',
		options: [
			'参与对齐区间的下一个文本字符 T[i+|P|]',
			'失配位置的文本字符',
			'模式的最后一个字符',
			'文本的第一个字符'
		],
		correctAnswer: '参与对齐区间的下一个文本字符 T[i+|P|]',
		hint: '看"还没参与比较"的那一位',
		explanation:
			'Sunday 的精髓：失配后看对齐区间紧后面的那个文本字符。它在下一轮必然参与对齐，提前用它决策可以跳得更远。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '若 T[i+|P|] 不在模式中出现过，模式怎么移动？',
		options: ['整体跳过 |P|+1 位', '右移 1 位', '回退到开头', '不动'],
		correctAnswer: '整体跳过 |P|+1 位',
		hint: '这个字符谁也对不上',
		explanation:
			'该字符不在模式中，无论怎么对齐都会失配——模式可以直接跳过它，移动 |P|+1 位，这是 Sunday 平均速度快的来源。'
	}
];

const DEFAULT_TEXT = 'HERE IS A SIMPLE EXAMPLE';
const DEFAULT_PATTERN = 'EXAMPLE';

export class SundayEngine extends EngineBase<string[]> {
	readonly name = 'Sunday 匹配';
	readonly renderType = 'sunday' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'Sunday 匹配：先建偏移表（每个字符在模式中最右出现位置），再从左到右逐位比较，失配时大步跳跃。'
		},
		{
			type: 'compare',
			narration: '对齐后从左到右逐位比较文本与模式。'
		},
		{
			type: 'edge-reject',
			narration: '失配：看对齐区间后面的那个字符，按偏移表大步右移。'
		},
		{
			type: 'complete',
			narration: '匹配完成。Sunday 平均 O(n)——比 KMP 跳得更远，是实践中最快的单模式匹配之一。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '教材示例', description: 'HERE IS A SIMPLE EXAMPLE 找 EXAMPLE' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义数据',
		fields: [
			{
				key: 'data',
				label: '文本,模式（逗号分隔）',
				type: 'text',
				placeholder: '如 HERE IS A SIMPLE EXAMPLE,EXAMPLE',
				default: 'HERE IS A SIMPLE EXAMPLE,EXAMPLE'
			}
		]
	};

	applyPreset(_name: string): void {
		this.init(['', '']);
	}

	applyCustom(values: Record<string, string>): void {
		const parts = (values.data ?? '').split(',').map((x) => x.trim());
		if (!parts[0] || !parts[1]) throw new Error('需要文本与模式两个串');
		this.init([parts[0], parts[1]]);
	}

	init(_input: string[]): void {
		this.steps = [];
		this._stepId = 0;

		const text = DEFAULT_TEXT;
		const pattern = DEFAULT_PATTERN;
		const n = text.length;
		const m = pattern.length;

		// 偏移表
		const offset: Record<string, number> = {};
		for (let i = 0; i < m; i++) offset[pattern[i]] = m - i;
		for (let i = 0; i < m; i++) {
			const c = pattern[i];
			offset[c] = Math.min(offset[c], m - i);
		}

		const mkSnap = (
			align: number,
			cur: number,
			phase: 'compare' | 'match-char' | 'mismatch' | 'shift' | 'found' | 'failed',
			nextChar?: string
		) => ({
			text,
			pattern,
			align,
			cur,
			phase,
			offset: { ...offset },
			nextChar
		});

		this._emit(
			'init',
			`文本 "${text}"，模式 "${pattern}"。偏移表已构建：每个字符记录其在模式中最右出现位置（从右数）。`,
			mkSnap(0, -1, 'compare'),
			0
		);

		let i = 0;
		while (i + m <= n) {
			let j = 0;
			while (j < m && text[i + j] === pattern[j]) {
				this._emit(
					'compare',
					`对齐 ${i}：T[${i + j}]='${text[i + j]}' == P[${j}]='${pattern[j]}'，继续。`,
					mkSnap(i, i + j, 'match-char'),
					3
				);
				j++;
			}
			if (j === m) {
				this._emit(
					'complete',
					`命中！模式出现在文本下标 ${i} 处（共比较 ${i + m} 位以内）。Sunday 平均 O(n)。`,
					mkSnap(i, i + m - 1, 'found'),
					4
				);
				this.totalSteps = this.steps.length;
				return;
			}
			this._emit(
				'compare',
				`失配：T[${i + j}]='${text[i + j]}' ≠ P[${j}]='${pattern[j]}'。`,
				mkSnap(i, i + j, 'mismatch'),
				5
			);
			const nc = text[i + m];
			const shift = offset[nc] ?? m + 1;
			this._emit(
				'edge-reject',
				nc === undefined
					? `对齐区间后的字符越界，结束。`
					: `看 T[${i + m}]='${nc}'：` +
							(offset[nc] !== undefined
								? `在模式中最右出现距右端 ${offset[nc]} → 右移 ${offset[nc]} 位。`
								: `不在模式中 → 直接跳过 ${m + 1} 位。`),
				mkSnap(i, i + m, 'shift', nc),
				7
			);
			i += shift;
		}

		this._emit('complete', '文本扫描完毕，未找到模式。', mkSnap(Math.max(0, i), -1, 'failed'), 7);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		snap: {
			text: string;
			pattern: string;
			align: number;
			cur: number;
			phase: 'compare' | 'match-char' | 'mismatch' | 'shift' | 'found' | 'failed';
			offset: Record<string, number>;
			nextChar?: string;
		},
		pseudocodeLine: number
	): void {
		const highlights: Highlight[] = [];
		if (snap.cur >= 0) highlights.push({ type: 'current', indices: [snap.cur] });
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			sunday: snap
		});
	}
}
