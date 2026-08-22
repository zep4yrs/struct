/**
 * 智能设计排序 — IntelligentDesignSortEngine (趣味)
 * "数组本来就有序"——直接宣布完成。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	StepType
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = ['// 无需操作', '// 数组已经是设计好的有序状态'];

export class IntelligentDesignSortEngine extends EngineBase<number[]> {
	readonly name = '智能设计排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '智能设计排序: 相信数组天生有序。' },
		{ type: 'complete', narration: '完成(零步)。谁质疑就驳倒谁——反正结果就是原数组。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '智能设计排序', fields: [] };

	applyPreset(_name: string): void {
		this.init([5, 2, 8, 1, 9, 3]);
	}

	applyCustom(values: Record<string, string>): void {
		const nums = (values.data ?? '')
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !Number.isNaN(n));
		this.init(nums.length >= 2 ? nums : [5, 2, 8, 1, 9, 3]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const arr = [...input];
		this._emit('init', '输入数组: ' + arr.join(' '), arr, 0);
		this._emit(
			'complete',
			'宣告: 该数组的每个元素都处在它应在的位置——这就是智能设计的秩序。(未做任何操作)',
			arr,
			1,
			[]
		);
		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		arr: number[],
		line: number,
		hl?: Highlight[]
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...arr],
			highlights: hl ?? [],
			pseudocodeLine: line
		});
	}
}
