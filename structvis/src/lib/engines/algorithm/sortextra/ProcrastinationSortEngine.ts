/**
 * 拖延排序 — ProcrastinationSortEngine (趣味)
 * "明天再排"——永不执行。
 */

import type { DemoScriptItem, EngineCustomConfig, EnginePreset, StepType } from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = ['procedure sort(a):', '  // 明天再说', '  pass'];

export class ProcrastinationSortEngine extends EngineBase<number[]> {
	readonly name = '拖延排序';
	readonly renderType = 'array' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions = [];

	readonly demoScript: DemoScriptItem[] = [
		{ type: 'init', narration: '拖延排序启动……算了, 明天再排。' },
		{ type: 'complete', narration: '复杂度 O(∞): 永远不会执行, 也永远不会出错。' }
	];

	presets: EnginePreset[] = [{ name: '随机数据', description: '竞速演示' }];
	customConfig: EngineCustomConfig = { title: '拖延排序', fields: [] };

	applyPreset(_name: string): void {
		this.init([5, 2, 8, 1, 9, 3]);
	}

	applyCustom(_values: Record<string, string>): void {
		this.init([5, 2, 8, 1, 9, 3]);
	}

	init(input: number[]): void {
		this.steps = [];
		this._stepId = 0;
		const arr = [...input];
		this._emit('init', '收到排序任务: [' + arr.join(', ') + ']。', arr, 0);
		this._emit('edge-reject', '今天先到这, 明天一定排。', arr, 1);
		this._emit('complete', '任务被无限期搁置——这就是 O(∞) 的含义。', arr, 2);
		this.totalSteps = this.steps.length;
	}

	private _emit(type: StepType, description: string, arr: number[], line: number): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...arr],
			highlights: [],
			pseudocodeLine: line
		});
	}
}
