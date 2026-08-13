import type {
	AlgorithmEngine,
	AlgorithmStep,
	PracticeQuestion,
	RenderType
} from './types';

/**
 * 引擎基类 — 收敛各引擎重复的状态样板（steps/playbackPos/totalSteps/_stepId
 * 与 getCurrentStep/getProgress/setProgress/reset）。
 *
 * 约定：
 * - setProgress 统一夹取到 [0, totalSteps-1+0.999]（越界输入不再穿透到渲染器）；
 * - getCurrentStep 对空 steps 返回 undefined 前的防御：空数组时回退第 0 步取不到，
 *   播放器在 steps 为空时不会调用（AlgoPlayer 有 totalSteps 守卫）。
 * - 引擎只需实现 init() 与算法，其余操作全部继承。
 */
export abstract class EngineBase<TInput = number[]> implements AlgorithmEngine<TInput> {
	abstract readonly name: string;
	abstract readonly renderType: RenderType;
	readonly panelTitle?: string;

	pseudocode: string[] = [];
	practiceQuestions: PracticeQuestion[] = [];

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	protected _stepId = 0;

	abstract init(input: TInput): void;

	getCurrentStep(): AlgorithmStep {
		const idx = Math.min(Math.floor(this.playbackPos), this.steps.length - 1);
		return this.steps[Math.max(0, idx)];
	}

	getProgress(): number {
		return this.playbackPos;
	}

	setProgress(pos: number): void {
		this.playbackPos = Math.max(0, Math.min(this.totalSteps - 1 + 0.999, pos));
	}

	reset(): void {
		this.playbackPos = 0;
	}
}
