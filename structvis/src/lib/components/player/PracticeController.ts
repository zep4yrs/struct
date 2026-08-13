import type { AlgorithmEngine, PracticeQuestion } from '$lib/engines/algorithm/types';
import { addMistake, recordExercise } from '$lib/stores/progress';

/**
 * 练习控制器 — 出题/判题/进度落库状态机（从 AlgoPlayer 中独立，可单测）。
 */
export class PracticeController {
	private engine: AlgorithmEngine<unknown>;
	private answeredStepIds: number[] = [];

	constructor(engine: AlgorithmEngine<unknown>) {
		this.engine = engine;
	}

	reset(): void {
		this.answeredStepIds = [];
	}

	/**
	 * 播放到某步时查找应弹出的题目：该步有题且未答过。
	 * 同一 step 多题（不同模式各一题）只会返回第一条——引擎侧按模式切换题目集，
	 * 因此同一时刻一个 step 只有一道题。
	 */
	findQuestionAt(stepId: number): PracticeQuestion | null {
		if (this.answeredStepIds.includes(stepId)) return null;
		const question = this.engine.practiceQuestions?.find((q) => q.stepIndex === stepId);
		return question ?? null;
	}

	/**
	 * 记录一次作答：答对加掌握度，答错扣掌握度并进错题本。
	 * 返回是否是新记录的题目（用于去重提示等）。
	 */
	recordAnswer(
		result: { correct: boolean; answer: string },
		question: PracticeQuestion,
		topicId: string,
		topicName: string
	): void {
		const stepId = question.stepIndex;
		this.answeredStepIds.push(stepId);

		if (result.correct) {
			recordExercise(topicId, true);
		} else {
			recordExercise(topicId, false);
			addMistake({
				topic: topicName,
				type: this.engine.renderType === 'sql-table' ? 'sql' : 'algorithm',
				question: question.prompt,
				options: question.options,
				wrongAnswer: result.answer,
				correctAnswer: String(question.correctAnswer),
				explanation: question.explanation
			});
		}
	}
}
