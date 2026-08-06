import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import PracticePanel from './PracticePanel.svelte';
import type { PracticeQuestion } from '$lib/engines/algorithm/types';

function makeQuestion(overrides: Partial<PracticeQuestion> = {}): PracticeQuestion {
	return {
		type: 'choose-next',
		stepIndex: 5,
		prompt: '下一步应选择哪个选项？',
		options: ['选项A', '选项B', '选项C'],
		correctAnswer: '选项C',
		hint: '注意比较顺序',
		explanation: '标准答案解释',
		...overrides
	};
}

beforeEach(() => cleanup());

describe('PracticePanel 渲染', () => {
	it('渲染题目、选项与选项键', () => {
		const { container } = render(PracticePanel, { props: { question: makeQuestion() } });
		expect(container.querySelector('.question-title')?.textContent).toBe('下一步应选择哪个选项？');
		const options = [...container.querySelectorAll('.option')];
		expect(options).toHaveLength(3);
		expect(options[0]?.querySelector('.option-key')?.textContent).toBe('A');
		expect(options[2]?.querySelector('.option-text')?.textContent).toBe('选项C');
	});

	it('未选择选项时提交按钮禁用', () => {
		const { container } = render(PracticePanel, { props: { question: makeQuestion() } });
		const submit = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('提交答案')
		)!;
		expect((submit as HTMLButtonElement).disabled).toBe(true);
	});

	it('无选项题型显示未实现提示', () => {
		const { container } = render(PracticePanel, {
			props: { question: makeQuestion({ options: undefined }) }
		});
		expect(container.querySelector('.unsupported')?.textContent).toContain('尚未实现');
	});
});

describe('PracticePanel 判题交互', () => {
	it('选择错误选项提交后触发 onAnswered(correct: false)，展示回答错误与正确答案', async () => {
		const onAnswered = vi.fn();
		const { container } = render(PracticePanel, {
			props: { question: makeQuestion(), onAnswered }
		});
		const options = [...container.querySelectorAll('.option')] as HTMLButtonElement[];
		await fireEvent.click(options[1]!);
		const submit = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('提交答案')
		)!;
		await fireEvent.click(submit);

		expect(onAnswered).toHaveBeenCalledOnce();
		expect(onAnswered).toHaveBeenCalledWith({ correct: false, answer: '选项B' });
		expect(container.querySelector('.tag-danger')?.textContent).toBe('回答错误');
		expect(container.querySelector('.correct-answer')?.textContent).toContain('选项C');
		expect(container.querySelector('.explanation')?.textContent).toBe('标准答案解释');
	});

	it('选择正确选项提交后触发 onAnswered(correct: true)，展示回答正确', async () => {
		const onAnswered = vi.fn();
		const { container } = render(PracticePanel, {
			props: { question: makeQuestion(), onAnswered }
		});
		const options = [...container.querySelectorAll('.option')] as HTMLButtonElement[];
		await fireEvent.click(options[2]!);
		const submit = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('提交答案')
		)!;
		await fireEvent.click(submit);

		expect(onAnswered).toHaveBeenCalledWith({ correct: true, answer: '选项C' });
		expect(container.querySelector('.tag-success')?.textContent).toBe('回答正确');
		expect(container.querySelector('.correct-answer')).toBeNull();
		expect(container.querySelector('.mark-ok')?.textContent).toBe('✓');
	});

	it('提交后选项禁用并显示标记，继续按钮触发 onContinue', async () => {
		const onContinue = vi.fn();
		const { container } = render(PracticePanel, {
			props: { question: makeQuestion(), onContinue }
		});
		const options = [...container.querySelectorAll('.option')] as HTMLButtonElement[];
		await fireEvent.click(options[2]!);
		const submit = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('提交答案')
		)!;
		await fireEvent.click(submit);

		expect(options.every((o) => o.disabled)).toBe(true);
		const next = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('继续下一步')
		)!;
		await fireEvent.click(next);
		expect(onContinue).toHaveBeenCalledOnce();
	});
});

describe('PracticePanel 键盘交互', () => {
	it('数字键选择选项，Enter 提交', async () => {
		const onAnswered = vi.fn();
		const { container } = render(PracticePanel, {
			props: { question: makeQuestion(), onAnswered }
		});
		await fireEvent.keyDown(window, { key: '3' });
		expect(container.querySelectorAll('.option')[2]?.classList.contains('selected')).toBe(true);
		await fireEvent.keyDown(window, { key: 'Enter' });
		expect(onAnswered).toHaveBeenCalledWith({ correct: true, answer: '选项C' });
	});

	it('提交后按 Enter 触发 onContinue', async () => {
		const onContinue = vi.fn();
		render(PracticePanel, { props: { question: makeQuestion(), onContinue } });
		await fireEvent.keyDown(window, { key: '1' });
		await fireEvent.keyDown(window, { key: 'Enter' });
		await fireEvent.keyDown(window, { key: 'Enter' });
		expect(onContinue).toHaveBeenCalledOnce();
	});

	it('H 键切换提示显示', async () => {
		const { container } = render(PracticePanel, { props: { question: makeQuestion() } });
		expect(container.querySelector('.hint-box')).toBeNull();
		await fireEvent.keyDown(window, { key: 'h' });
		expect(container.querySelector('.hint-box')?.textContent).toContain('注意比较顺序');
		await fireEvent.keyDown(window, { key: 'H' });
		expect(container.querySelector('.hint-box')).toBeNull();
	});

	it('提示按钮点击切换文案与提示框', async () => {
		const { container } = render(PracticePanel, { props: { question: makeQuestion() } });
		const hintBtn = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('提示')
		)!;
		expect(hintBtn.textContent).toBe('提示 (H)');
		await fireEvent.click(hintBtn);
		expect(container.querySelector('.hint-box')).not.toBeNull();
		expect(hintBtn.textContent).toBe('收起提示');
	});

	it('无提示的题目不渲染提示按钮', () => {
		const { container } = render(PracticePanel, {
			props: { question: makeQuestion({ hint: '' }) }
		});
		const hintBtn = [...container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('提示')
		);
		expect(hintBtn).toBeUndefined();
	});
});
