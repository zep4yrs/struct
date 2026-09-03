<script lang="ts">
	import { onDestroy } from 'svelte';
	import { recordExercise } from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/utils/motion';

	import { QUIZ_BANK as BANK, type QuizQuestion } from '$lib/content/quiz-bank';

	const CHAPTERS = ['线性结构', '树形结构', '图结构', '排序算法', '查找', 'SQL'];

	// === 自测状态 ===
	let chapter = $state(CHAPTERS[0]);
	let questions = $state<QuizQuestion[]>([]);
	let idx = $state(0);
	let picked = $state<number | null>(null);
	let answers = $state<number[]>([]);
	let started = $state(false);
	let finished = $state(false);
	let secondsLeft = $state(300); // 5 分钟
	let timer: ReturnType<typeof setInterval> | null = null;

	// 当前章节题池（文案与抽题共用同一来源，杜绝「承诺 8 题实给 3 题」，audit-3）
	const chapterPool = $derived(BANK.filter((q) => q.chapter === chapter));
	const quizSize = $derived(Math.min(8, chapterPool.length));

	function startQuiz() {
		const pool = [...chapterPool];
		// 打乱取题（题量随章节池动态决定）
		const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, quizSize);
		questions = shuffled;
		idx = 0;
		answers = [];
		picked = null;
		started = true;
		finished = false;
		secondsLeft = 300;
		if (timer) clearInterval(timer);
		timer = setInterval(() => {
			secondsLeft -= 1;
			if (secondsLeft <= 0) finishQuiz();
		}, 1000);
	}

	function pick(i: number) {
		if (picked !== null) return;
		picked = i;
		answers[idx] = i;
	}

	function nextQ() {
		if (idx < questions.length - 1) {
			idx += 1;
			picked = answers[idx] ?? null;
		} else {
			finishQuiz();
		}
	}

	function finishQuiz() {
		if (timer) clearInterval(timer);
		timer = null;
		finished = true;
		started = false;
		// 计入掌握度
		for (let i = 0; i < questions.length; i++) {
			recordExercise(questions[i].topicId, answers[i] === questions[i].answer);
		}
	}

	const score = $derived(questions.filter((q, i) => answers[i] === q.answer).length);

	// 离开页面即清理计时器（audit-4：防止路由离开后 interval 泄漏并在已销毁组件上交卷）
	onDestroy(() => {
		if (timer !== null) clearInterval(timer);
		timer = null;
	});
</script>

<div class="mx-auto max-w-3xl p-8">
	<div class="section-label mb-4" use:reveal>章节自测 · QUIZ</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		章节自测
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2);" use:reveal={{ delay: 160 }}>
		选一个章节，随机抽题限时作答。成绩计入对应知识点的掌握度。
	</p>

	{#if !started && !finished}
		<div class="glass liquid quiz-panel" use:reveal>
			<div class="quiz-chapters">
				{#each CHAPTERS as c (c)}
					<button class="quiz-chapter-btn" class:on={chapter === c} onclick={() => (chapter = c)}>
						{c}
					</button>
				{/each}
			</div>
			<div class="quiz-start-row">
				<span style="color: var(--color-ink-2); font-size: 13px;">
					{chapterPool.length} 道题可用 · 随机 {quizSize} 题 · 5 分钟限时
				</span>
				<button class="btn btn-accent" onclick={startQuiz}>开始自测</button>
			</div>
		</div>
	{/if}

	{#if started && questions.length > 0}
		<div class="glass liquid quiz-panel" use:reveal>
			<div class="quiz-top">
				<span class="quiz-progress">第 {idx + 1} / {questions.length} 题</span>
				<span class="quiz-timer" class:urgent={secondsLeft <= 60}
					>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span
				>
			</div>
			<div class="quiz-question">{questions[idx].q}</div>
			<div class="quiz-options">
				{#each questions[idx].options as opt, i (i)}
					<button
						class="quiz-opt"
						class:correct={picked !== null && i === questions[idx].answer}
						class:wrong={picked === i && i !== questions[idx].answer}
						disabled={picked !== null}
						onclick={() => pick(i)}
					>
						<span class="quiz-opt-key">{'ABCD'[i]}</span>
						{opt}
					</button>
				{/each}
			</div>
			{#if picked !== null}
				<div class="quiz-feedback" class:ok={picked === questions[idx].answer}>
					{picked === questions[idx].answer ? '回答正确' : '回答错误'}
					<span class="quiz-explain">{questions[idx].explain}</span>
				</div>
				<button class="btn btn-accent" onclick={nextQ}>
					{idx < questions.length - 1 ? '下一题 →' : '交卷'}
				</button>
			{/if}
		</div>
	{/if}

	{#if finished}
		<div class="glass quiz-panel quiz-result" use:reveal>
			<div class="quiz-score">{score} / {questions.length}</div>
			<div class="quiz-score-label">
				正确率 {Math.round((score / Math.max(1, questions.length)) * 100)}%
			</div>
			<div class="quiz-score-desc">
				{#if score === questions.length}满分！完美掌握。
				{:else if score >= Math.ceil(questions.length * 0.7)}不错！继续保持。
				{:else if score >= Math.ceil(questions.length * 0.5)}及格了，再复习一下错题。
				{:else}别灰心，去对应章节再看看动画。{/if}
			</div>
			<div class="quiz-actions">
				<button class="btn btn-accent" onclick={startQuiz}>再来一次</button>
				<a href={resolve('/progress')} class="btn btn-ghost">查看进度</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.quiz-panel {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 22px 26px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.quiz-chapters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.quiz-chapter-btn {
		padding: 6px 14px;
		font-size: 13px;
		color: var(--color-ink-2);
		background: transparent;
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.quiz-chapter-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.quiz-chapter-btn.on {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: rgba(217, 119, 6, 0.06);
	}

	.quiz-start-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.quiz-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.quiz-progress {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
	}

	.quiz-timer {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--color-ink-2);
		font-variant-numeric: tabular-nums;
	}

	.quiz-timer.urgent {
		color: var(--color-danger);
	}

	.quiz-question {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 500;
		color: var(--color-ink);
		line-height: 1.5;
	}

	.quiz-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.quiz-opt {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		text-align: left;
		font-size: 14px;
		color: var(--color-ink-2);
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			background 120ms var(--ease-out);
	}

	.quiz-opt:hover:not(:disabled) {
		border-color: var(--color-ink);
	}

	.quiz-opt.correct {
		border-color: var(--color-success);
		background: rgba(45, 106, 79, 0.1);
		color: var(--color-success);
	}

	.quiz-opt.wrong {
		border-color: var(--color-danger);
		background: rgba(155, 34, 38, 0.08);
		color: var(--color-danger);
	}

	.quiz-opt-key {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
		width: 22px;
		flex-shrink: 0;
	}

	.quiz-feedback {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-danger);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.quiz-feedback.ok {
		color: var(--color-success);
	}

	.quiz-explain {
		font-size: 12.5px;
		font-weight: 400;
		color: var(--color-ink-2);
		line-height: 1.6;
	}

	.quiz-result {
		align-items: center;
		text-align: center;
		padding: 40px 26px;
	}

	.quiz-score {
		font-family: var(--font-display);
		font-size: 56px;
		font-weight: 600;
		color: var(--color-ink);
		letter-spacing: -0.02em;
	}

	.quiz-score-label {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-ink-3);
	}

	.quiz-score-desc {
		font-size: 14px;
		color: var(--color-ink-2);
	}

	.quiz-actions {
		display: flex;
		gap: 10px;
	}
</style>
