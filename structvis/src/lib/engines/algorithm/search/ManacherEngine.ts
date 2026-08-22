/**
 * Manacher 回文串引擎 — ManacherEngine
 *
 * 最长回文子串问题。本引擎用"中心扩展法"演示（Manacher 的线性版本复杂，
 * 中心扩展法更直观）：对每个中心（奇中心 i 与偶中心 i, i+1 间隙）向外逐步扩展，
 * 比较 text[l] == text[r]，同时记录至今看到的最长回文。
 * 每步 sunday 快照：text 为原串，pattern 为当前回文，align 为回文起点，
 * cur 为当前比较位置。渲染复用 sunday。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	PracticeQuestion,
	StepType,
	SundayData
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// 最长回文子串（中心扩展法）',
	'best ← ""',
	'for 每个中心 (奇中心 i 与偶中心 i, i+1 间隙) do',
	'  l ← 中心; r ← 中心',
	'  while 0 <= l-1 && r+1 < n && text[l-1] == text[r+1] do',
	'    l--; r++                // 向两边扩展',
	'    if len(text[l..r]) > best.length: best ← text[l..r]',
	'  end while',
	'end for'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '中心扩展法一共要考虑多少个中心？',
		options: ['n 个', 'n 个奇中心 + n-1 个偶中心间隙', '2n 个', 'n/2 个'],
		correctAnswer: 'n 个奇中心 + n-1 个偶中心间隙',
		hint: '单字符是奇中心，两个字符之间是偶中心',
		explanation:
			'长度为 n 的串有 n 个奇中心（单个字符）和 n-1 个偶中心（相邻字符的间隙），共 2n-1 个。对每个中心向两边扩展，时间复杂度 O(n²)。'
	},
	{
		type: 'choose-next',
		stepIndex: 6,
		prompt: '中心扩展法的时间复杂度是？',
		options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
		correctAnswer: 'O(n²)',
		hint: '每个中心最多扩展 O(n) 次',
		explanation:
			'有 O(n) 个中心，每个中心最多向外扩展 O(n) 次，故总复杂度 O(n²)。Manacher 算法通过记录对称信息把它优化到 O(n)。'
	}
];

const TEXT = 'babad';

export class ManacherEngine extends EngineBase<string[]> {
	readonly name = 'Manacher 回文串';
	readonly renderType = 'sunday' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'最长回文子串：用中心扩展法枚举每个中心（奇中心与偶中心间隙），向两边逐步比较，记录最长回文。'
		},
		{
			type: 'compare',
			narration: '比较左右字符是否相等，相等则向两边扩展当前回文。'
		},
		{
			type: 'edge-reject',
			narration: '左右失配或到达边界，当前中心扩展结束，换下一个中心。'
		},
		{
			type: 'complete',
			narration: '扫描完所有中心，得到最长回文子串。中心扩展法 O(n²)，Manacher 可优化到 O(n)。'
		}
	];

	presets: EnginePreset[] = [{ name: '教材示例', description: '字符串 babad' }];

	customConfig: EngineCustomConfig = {
		title: '固定示例数据',
		fields: []
	};

	applyPreset(_name: string): void {
		this.init([TEXT]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([TEXT]);
	}

	init(_input: string[]): void {
		this.steps = [];
		this._stepId = 0;

		const text = TEXT;
		const n = text.length;

		const mkSnap = (
			align: number,
			cur: number,
			pattern: string,
			phase: SundayData['phase'],
			nextChar?: string
		): SundayData => ({
			text,
			pattern,
			align,
			cur,
			phase,
			offset: {},
			nextChar
		});

		let bestStart = 0;
		let bestLen = 1;

		const consider = (start: number, len: number): boolean => {
			if (len > bestLen) {
				bestLen = len;
				bestStart = start;
				return true;
			}
			return false;
		};

		const runExpansion = (l: number, r: number, isEven: boolean): void => {
			const pal0 = text.slice(l, r + 1);
			this._emit(
				'compare',
				'检查' +
					(isEven ? '偶' : '奇') +
					'中心：当前回文 "' +
					pal0 +
					'"（下标 ' +
					l +
					'-' +
					r +
					'）长度 ' +
					pal0.length +
					'。',
				mkSnap(l, r, pal0, 'compare'),
				3
			);
			if (consider(l, pal0.length)) {
				this._emit(
					'edge-select',
					'更新最佳："' + pal0 + '" 长度 ' + pal0.length + '。',
					mkSnap(l, r, pal0, 'found'),
					5
				);
			}
			while (l - 1 >= 0 && r + 1 < n && text[l - 1] === text[r + 1]) {
				const a = l - 1;
				const b = r + 1;
				l = a;
				r = b;
				const pal = text.slice(l, r + 1);
				this._emit(
					'compare',
					'text[' +
						a +
						']="' +
						text[a] +
						'"==text[' +
						b +
						']="' +
						text[b] +
						'"，向两边扩展为 "' +
						pal +
						'"（下标 ' +
						l +
						'-' +
						r +
						'）长度 ' +
						pal.length +
						'。',
					mkSnap(l, r, pal, 'compare'),
					4
				);
				if (consider(l, pal.length)) {
					this._emit(
						'edge-select',
						'更新最佳："' + pal + '" 长度 ' + pal.length + '。',
						mkSnap(l, r, pal, 'found'),
						5
					);
				}
			}
			if (l - 1 >= 0 && r + 1 < n) {
				this._emit(
					'edge-reject',
					'text[' +
						(l - 1) +
						']="' +
						text[l - 1] +
						'" ≠ text[' +
						(r + 1) +
						']="' +
						text[r + 1] +
						'"：该中心扩展停止。',
					mkSnap(l, r, text.slice(l, r + 1), 'shift', text[r + 1]),
					6
				);
			} else {
				this._emit(
					'edge-reject',
					'到达边界，该中心扩展停止。',
					mkSnap(l, r, text.slice(l, r + 1), 'shift'),
					6
				);
			}
		};

		this._emit(
			'init',
			'字符串 "' +
				text +
				'"（长度 ' +
				n +
				'）。用中心扩展法求最长回文子串：枚举每个中心，向两边扩展。',
			mkSnap(0, 0, text.slice(0, 1), 'compare'),
			1
		);

		// 奇中心
		for (let c = 0; c < n; c++) runExpansion(c, c, false);
		// 偶中心（相邻字符间隙）
		for (let c = 0; c < n - 1; c++) {
			if (text[c] !== text[c + 1]) {
				this._emit(
					'compare',
					'偶中心 [' +
						c +
						',' +
						(c + 1) +
						']：text[' +
						c +
						']="' +
						text[c] +
						'" ≠ text[' +
						(c + 1) +
						']="' +
						text[c + 1] +
						'"，无偶回文。',
					mkSnap(c, c, text.slice(c, c + 1), 'shift', text[c + 1]),
					3
				);
				continue;
			}
			runExpansion(c, c + 1, true);
		}

		const best = text.slice(bestStart, bestStart + bestLen);
		this._emit(
			'complete',
			'完成！最长回文子串为 "' +
				best +
				'"（下标 ' +
				bestStart +
				'-' +
				(bestStart + bestLen - 1) +
				'），长度 ' +
				bestLen +
				'。',
			mkSnap(bestStart, bestStart + bestLen - 1, best, 'found'),
			7
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		snap: SundayData,
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights: [],
			pseudocodeLine,
			sunday: snap
		});
	}
}
