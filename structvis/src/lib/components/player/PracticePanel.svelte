<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import type { PracticeQuestion } from '$lib/engines/algorithm/types';

	interface Props {
		question: PracticeQuestion;
		onAnswered?: (result: { correct: boolean; answer: string }) => void;
		onContinue?: () => void;
	}

	let { question, onAnswered, onContinue }: Props = $props();

	let selectedIndex = $state<number | null>(null);
	let submitted = $state(false);
	let isCorrect = $state(false);
	let showHint = $state(false);

	const TYPE_LABELS: Record<string, string> = {
		'choose-next': '选择',
		'fill-array': '填空',
		'drag-pointer': '拖指针',
		'fill-code': '补全代码'
	};

	const LETTERS = 'ABCDEFGHIJ';

	function submit() {
		if (selectedIndex === null || submitted) return;
		const answer = question.options?.[selectedIndex] ?? '';
		isCorrect = answer === question.correctAnswer;
		submitted = true;
		onAnswered?.({ correct: isCorrect, answer });
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		if (!submitted && question.options?.length) {
			const num = parseInt(e.key, 10);
			if (num >= 1 && num <= question.options.length) {
				e.preventDefault();
				selectedIndex = num - 1;
				return;
			}
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			if (submitted) {
				onContinue?.();
			} else {
				submit();
			}
		}

		if (e.key.toLowerCase() === 'h' && !submitted) {
			e.preventDefault();
			showHint = !showHint;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	function prefersReducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	$effect(() => {
		selectedIndex = null;
		submitted = false;
		isCorrect = false;
		showHint = false;
	});
</script>

<div class="practice-overlay" transition:fade={{ duration: 240 }}>
	<div
		class="practice-card"
		transition:fly={{
			y: prefersReducedMotion() ? 0 : 12,
			duration: prefersReducedMotion() ? 0 : 240,
			easing: expoOut
		}}
	>
		<header class="practice-header">
			<span class="panel-title">练习 · Practice</span>
			<span class="tag tag-accent">{TYPE_LABELS[question.type] ?? question.type}</span>
		</header>

		<h3 class="question-title">{question.prompt}</h3>

		{#if question.options?.length}
			<div class="options" role="listbox" aria-label="选项">
				{#each question.options as option, i (i)}
					<button
						class="option"
						class:selected={selectedIndex === i && !submitted}
						class:correct={submitted && option === question.correctAnswer}
						class:wrong={submitted && selectedIndex === i && option !== question.correctAnswer}
						onclick={() => (selectedIndex = i)}
						disabled={submitted}
					>
						<span class="option-key">{LETTERS[i]}</span>
						<span class="option-text">{option}</span>
						{#if submitted && option === question.correctAnswer}
							<span class="mark mark-ok">✓</span>
						{:else if submitted && selectedIndex === i && option !== question.correctAnswer}
							<span class="mark mark-no">✗</span>
						{/if}
					</button>
				{/each}
			</div>
		{:else}
			<div class="unsupported">
				<p>该题型「{TYPE_LABELS[question.type] ?? question.type}」尚未实现，直接继续。</p>
			</div>
		{/if}

		{#if submitted}
			<div class="feedback" class:feedback-no={!isCorrect}>
				<div class="feedback-head">
					<span class="tag {isCorrect ? 'tag-success' : 'tag-danger'}">
						{isCorrect ? '回答正确' : '回答错误'}
					</span>
					{#if !isCorrect && question.correctAnswer !== undefined && question.correctAnswer !== null}
						<span class="correct-answer">
							正确答案：<span class="mono">{String(question.correctAnswer)}</span>
						</span>
					{/if}
				</div>
				<p class="explanation">{question.explanation}</p>
				{#if !isCorrect && question.hint}
					<div class="hint-box">
						<span class="hint-label">提示</span>
						<p>{question.hint}</p>
					</div>
				{/if}
			</div>

			<button class="btn btn-primary continue-btn" onclick={onContinue}>
				继续下一步
				<span class="btn-arrow">→</span>
			</button>
		{:else}
			<div class="actions">
				{#if question.hint}
					<button class="btn btn-ghost hint-btn" onclick={() => (showHint = !showHint)}>
						{showHint ? '收起提示' : '提示 (H)'}
					</button>
				{/if}
				<button class="btn btn-primary" disabled={selectedIndex === null} onclick={submit}>
					提交答案 (Enter)
				</button>
			</div>
			{#if showHint && question.hint}
				<div class="hint-box">
					<span class="hint-label">提示</span>
					<p>{question.hint}</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.practice-overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		background: rgba(20, 20, 20, 0.35);
	}

	.practice-card {
		width: 100%;
		max-width: 520px;
		max-height: 100%;
		overflow-y: auto;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-lg);
		padding: 16px 24px;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			0 8px 32px rgba(0, 0, 0, 0.06);
	}

	.practice-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.panel-title {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	.tag-danger {
		background: #fde8e8;
		border-color: #f5b5b5;
		color: #9b2226;
	}

	.question-title {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 500;
		line-height: 1.35;
		letter-spacing: -0.01em;
		color: var(--color-ink);
		margin: 0 0 18px;
	}

	/* 选项 */
	.options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 20px;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		text-align: left;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		border-left: 3px solid var(--color-line-regular);
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--color-ink-2);
		cursor: pointer;
		transition: all var(--dur-fast) var(--ease-out);
	}

	.option:hover:not(:disabled) {
		border-color: var(--color-ink);
		border-left-color: var(--color-ink);
		color: var(--color-ink);
	}

	.option.selected {
		border-color: var(--color-accent);
		border-left-color: var(--color-accent);
		color: var(--color-ink);
		background: rgba(217, 119, 6, 0.05);
	}

	.option.selected .option-key {
		color: var(--color-accent);
		font-weight: 600;
	}

	.option:disabled {
		cursor: default;
	}

	.option.correct {
		border-color: var(--color-success);
		border-left-color: var(--color-success);
		color: var(--color-ink);
		background: rgba(45, 106, 79, 0.05);
	}

	.option.wrong {
		border-color: var(--color-danger);
		border-left-color: var(--color-danger);
		color: var(--color-ink);
		background: rgba(155, 34, 38, 0.05);
	}

	.option-key {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
		min-width: 16px;
		flex-shrink: 0;
	}

	.option-text {
		flex: 1;
		line-height: 1.5;
	}

	.mark {
		font-size: 13px;
		font-weight: 600;
		flex-shrink: 0;
	}

	.mark-ok {
		color: var(--color-success);
	}

	.mark-no {
		color: var(--color-danger);
	}

	/* 反馈 */
	.feedback {
		padding: 14px 16px;
		margin-bottom: 16px;
		border: 1px solid var(--color-line-hair);
		border-left: 3px solid var(--color-success);
		border-radius: var(--radius-sm);
		background: var(--color-paper);
	}

	.feedback.feedback-no {
		border-left-color: var(--color-danger);
	}

	.feedback-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	.correct-answer {
		font-size: 13px;
		color: var(--color-ink-2);
	}

	.correct-answer .mono {
		color: var(--color-success);
		font-weight: 500;
	}

	.explanation {
		font-size: 13px;
		line-height: 1.7;
		color: var(--color-ink-2);
		margin: 0;
	}

	.hint-box {
		margin-top: 12px;
		padding: 10px 12px;
		background: rgba(217, 119, 6, 0.06);
		border: 1px dashed var(--color-accent);
		border-radius: var(--radius-sm);
	}

	.hint-label {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-accent);
		font-weight: 600;
		display: block;
		margin-bottom: 4px;
	}

	.hint-box p {
		font-size: 13px;
		line-height: 1.6;
		color: var(--color-ink-2);
		margin: 0;
	}

	/* 操作区 */
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.hint-btn {
		font-size: 13px;
	}

	.continue-btn {
		width: 100%;
		justify-content: center;
	}

	.btn-arrow {
		margin-left: 2px;
	}

	.unsupported {
		padding: 16px;
		margin-bottom: 16px;
		border: 1px dashed var(--color-line-regular);
		border-radius: var(--radius-sm);
		color: var(--color-ink-2);
		font-size: 13px;
	}
</style>
