<script lang="ts">
	/** 概念自测题（overview/users 概念页共用） */
	export interface QuizItem {
		prompt: string;
		options: string[];
		correct: number;
		explanation: string;
	}

	interface Props {
		items: QuizItem[];
	}

	let { items }: Props = $props();

	let answered = $state<number[]>([]);
	let chosen = $state<(number | null)[]>([]);
	let finished = $state(false);

	const correctCount = $derived(answered.filter((i) => chosen[i] === items[i].correct).length);

	// items 变化（页面数据源切换）时重置作答状态
	$effect(() => {
		answered = [];
		chosen = items.map(() => null);
		finished = false;
	});

	function pick(qi: number, oi: number) {
		if (answered.includes(qi)) return;
		chosen[qi] = oi;
		answered = [...answered, qi];
		if (answered.length === items.length) finished = true;
	}
</script>

<section class="quiz-section">
	<div class="section-label">
		<span class="section-num">自测</span>
		<span class="section-name">概念练习</span>
	</div>
	{#each items as q, qi (qi)}
		<div class="quiz-item">
			<div class="quiz-prompt">
				<span class="quiz-index">{String(qi + 1).padStart(2, '0')}</span>
				{q.prompt}
				{#if answered.includes(qi)}
					<span class="tag {chosen[qi] === q.correct ? 'tag-success' : 'tag-danger'}">
						{chosen[qi] === q.correct ? '正确' : '错误'}
					</span>
				{/if}
			</div>
			<div class="quiz-options">
				{#each q.options as opt, oi (opt)}
					<button
						class="quiz-option
							{answered.includes(qi) && oi === q.correct ? 'correct' : ''}
							{answered.includes(qi) && oi === chosen[qi] && oi !== q.correct ? 'wrong' : ''}"
						onclick={() => pick(qi, oi)}
						disabled={answered.includes(qi)}
					>
						<span class="quiz-key">{String.fromCharCode(65 + oi)}</span>
						{opt}
					</button>
				{/each}
			</div>
			{#if answered.includes(qi)}
				<p class="quiz-explanation">{q.explanation}</p>
			{/if}
		</div>
	{/each}
	{#if finished}
		<div class="quiz-finished" aria-live="polite">
			<span class="tag tag-success">完成</span>
			全部作答完毕：{correctCount} / {items.length} 正确
			{#if correctCount === items.length}
				—— 概念掌握扎实！
			{:else}
				—— 回顾上方讲解后再试。
			{/if}
		</div>
	{/if}
</section>

<style>
	.quiz-section {
		margin-top: 8px;
	}

	.quiz-item {
		border: 1px solid var(--color-line-hair);
		border-radius: 8px;
		background: var(--color-surface);
		-webkit-backdrop-filter: blur(12px) saturate(1.4);
		backdrop-filter: blur(12px) saturate(1.4);
		padding: 16px 20px;
		margin-bottom: 12px;
	}

	.quiz-prompt {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
		margin-bottom: 12px;
	}

	.quiz-index {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-accent);
	}

	.quiz-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.quiz-option {
		border: 1px solid var(--color-line-regular);
		border-radius: 6px;
		background: var(--color-surface);
		padding: 8px 12px;
		font-size: 13px;
		color: var(--color-ink-2);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		transition:
			border-color 0.15s ease,
			background 0.15s ease,
			color 0.15s ease;
	}

	.quiz-option:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-ink);
	}

	.quiz-option.correct {
		border-color: var(--color-success);
		background: color-mix(in srgb, var(--color-success) 10%, transparent);
		color: var(--color-ink);
	}

	.quiz-option.wrong {
		border-color: var(--color-danger);
		background: color-mix(in srgb, var(--color-danger) 10%, transparent);
		color: var(--color-ink);
	}

	.quiz-option:disabled {
		cursor: default;
		opacity: 0.85;
	}

	.quiz-key {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.quiz-explanation {
		margin: 12px 0 0 0;
		font-size: 12.5px;
		line-height: 1.7;
		color: var(--color-ink-2);
		border-top: 1px dashed var(--color-line-hair);
		padding-top: 10px;
	}

	.quiz-finished {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--color-ink);
		border: 1px solid var(--color-line-regular);
		border-radius: 8px;
		padding: 14px 20px;
		background: color-mix(in srgb, var(--color-success) 6%, transparent);
	}
</style>
