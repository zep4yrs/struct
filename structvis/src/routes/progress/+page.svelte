<script lang="ts">
	import {
		progress,
		reviewMistake,
		markMistakeMastered,
		removeMistake,
		exportProgress,
		importProgress,
		isMistakeDue,
		mistakeDueText
	} from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import type { MistakeRecord, TopicProgress } from '$lib/stores/progress';
	import PracticePanel from '$lib/components/player/PracticePanel.svelte';
	import Mastery3D from '$lib/components/ui/Mastery3D.svelte';
	import ActivityHeatmap from '$lib/components/ui/ActivityHeatmap.svelte';
	import type { PracticeQuestion } from '$lib/engines/algorithm/types';
	import { onMount } from 'svelte';
	import { animate } from 'animejs';
	import { reveal, prefersReducedMotion } from '$lib/utils/motion';

	const TOPIC_NAMES: Record<string, string> = Object.fromEntries(
		[...dsTopics, ...dbTopics].filter((t) => t.topicId).map((t) => [t.topicId as string, t.title])
	);

	function topicName(id: string): string {
		return TOPIC_NAMES[id] ?? id;
	}

	function formatDate(ts: number): string {
		const d = new Date(ts);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	// 全部主题（数据结构 + 数据库），未学过的显示为 0% 空进度
	const EMPTY_TOPIC: TopicProgress = {
		mastery: 0,
		totalExercises: 0,
		correctExercises: 0,
		lastVisited: 0,
		completed: false
	};
	const allTopicIds = $derived(
		[...dsTopics, ...dbTopics].filter((t) => t.topicId).map((t) => t.topicId as string)
	);
	const topicEntries = $derived(
		allTopicIds
			.map((id) => [id, $progress.topics[id] ?? EMPTY_TOPIC] as const)
			.sort((a, b) => b[1].mastery - a[1].mastery || b[1].totalExercises - a[1].totalExercises)
	);

	const masteredCount = $derived(topicEntries.filter(([, t]) => t.completed).length);
	const totalMistakes = $derived($progress.mistakes.length);
	const pendingMistakes = $derived($progress.mistakes.filter((m) => isMistakeDue(m)).length);
	const totalExercises = $derived(topicEntries.reduce((acc, [, t]) => acc + t.totalExercises, 0));
	const correctExercises = $derived(
		topicEntries.reduce((acc, [, t]) => acc + t.correctExercises, 0)
	);
	const avgMastery = $derived(
		allTopicIds.length > 0
			? Math.round(
					allTopicIds.reduce((acc, id) => acc + ($progress.topics[id]?.mastery ?? 0), 0) /
						allTopicIds.length
				)
			: 0
	);
	const hasData = $derived(Object.keys($progress.topics).length > 0 || totalMistakes > 0);

	// 3D 掌握度总览数据
	const masteryData = $derived(
		[...dsTopics, ...dbTopics]
			.filter((t) => t.topicId)
			.map((t) => ({
				title: t.title,
				mastery: $progress.topics[t.topicId as string]?.mastery ?? 0,
				completed: $progress.topics[t.topicId as string]?.completed ?? false
			}))
	);

	// 学习路径：沿教材顺序找第一个未掌握的主题作为「下一步」
	const nextTopic = $derived(
		[...dsTopics, ...dbTopics].find(
			(t) => t.topicId && !t.planned && !$progress.topics[t.topicId]?.completed
		)
	);

	onMount(() => {
		// 掌握度进度条：进入视口时从 0 填充到目标宽度
		if (typeof IntersectionObserver !== 'undefined') {
			const io = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (!entry.isIntersecting) continue;
						const bar = entry.target as HTMLElement;
						bar.style.width = bar.dataset.target ?? '0%';
						io.unobserve(bar);
					}
				},
				{ threshold: 0.3 }
			);
			document.querySelectorAll('.topic-bar-fill').forEach((el) => io.observe(el));
		}
		if (prefersReducedMotion()) return;
		// 统计数字从 0 滚动到实际值
		document.querySelectorAll('.stat-num').forEach((el) => {
			const target = parseInt(el.textContent ?? '0', 10) || 0;
			const state = { v: 0 };
			el.textContent = '0';
			animate(state, {
				v: target,
				duration: 1000,
				delay: 350,
				ease: 'easeOutCubic',
				update: () => {
					el.textContent = String(Math.round(state.v));
				}
			});
		});
	});

	// === 错题复习 ===
	let reviewQuestion = $state<PracticeQuestion | null>(null);
	let reviewingMistake = $state<MistakeRecord | null>(null);
	let reviewAnswered = $state<boolean | null>(null);

	function startReview(m: MistakeRecord) {
		reviewingMistake = m;
		reviewAnswered = null;
		reviewQuestion = {
			type: 'choose-next',
			stepIndex: 0,
			prompt: m.question,
			options: m.options,
			correctAnswer: m.correctAnswer,
			hint: '',
			explanation: m.explanation
		};
	}

	function handleReviewAnswered(result: { correct: boolean }) {
		if (reviewingMistake === null) return;
		reviewAnswered = result.correct;
		reviewMistake(reviewingMistake.id, result.correct);
	}

	function scrollToMistakes() {
		document.querySelector('.mistake-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function handleReviewContinue() {
		if (reviewingMistake === null) return;
		if (reviewAnswered) {
			markMistakeMastered(reviewingMistake.id);
		}
		reviewQuestion = null;
		reviewingMistake = null;
		reviewAnswered = null;
	}

	// === 数据备份（导出/导入） ===
	let backupMsg = $state('');
	let backupError = $state('');
	let fileInputRef: HTMLInputElement | undefined = $state();

	function handleExport() {
		const json = exportProgress();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `structvis-progress-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		backupMsg = '已导出备份文件（含全部学习进度与错题）。';
		backupError = '';
	}

	function handleImportFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const result = importProgress(String(reader.result ?? ''));
			if (result.ok) {
				backupMsg = '导入成功，学习进度已恢复。';
				backupError = '';
			} else {
				backupError = result.error ?? '导入失败';
				backupMsg = '';
			}
		};
		reader.readAsText(file);
		// 允许再次选择同一文件
		if (fileInputRef) fileInputRef.value = '';
	}
</script>

<div class="mx-auto max-w-4xl p-8">
	<div class="section-label mb-4" use:reveal>学习进度</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		你的学习进度
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2); max-width: 500px;">
		所有数据保存在本地浏览器中，不会上传到任何服务器。
	</p>
	<div class="mb-8" use:reveal>
		<a href={resolve('/report')} class="btn btn-accent btn-sm">📊 生成学习报告</a>
	</div>

	<!-- SRS 到期提醒 -->
	{#if pendingMistakes > 0}
		<div
			class="glass srs-banner mb-8 flex flex-wrap items-center gap-3 rounded-lg border p-4"
			use:reveal
		>
			<span class="tag tag-accent">📌 复习提醒</span>
			<span style="font-size: 13px; color: var(--color-ink);">
				有 <b style="color: var(--color-accent);">{pendingMistakes}</b> 道错题今天到期，间隔复习效果最好
			</span>
			<button class="btn btn-accent btn-sm" style="margin-left: auto;" onclick={scrollToMistakes}
				>去复习</button
			>
		</div>
	{/if}

	<!-- 学习路径：下一步学什么 -->
	{#if hasData && nextTopic}
		<div
			class="glass mb-8 flex flex-wrap items-center gap-3 rounded-lg border p-4"
			style="border-color: var(--color-line-hair); background: var(--color-surface);"
			use:reveal
		>
			<span class="tag tag-accent">下一步</span>
			<a
				href={resolve(nextTopic.href as '/ds/quick-sort')}
				class="font-display text-lg font-medium no-underline"
				style="color: var(--color-ink);"
			>
				{nextTopic.title}
			</a>
			<span style="color: var(--color-ink-3); font-size: 12px;">
				已完成 {masteredCount} / {allTopicIds.length} 个主题
			</span>
			<a
				href={resolve(nextTopic.href as '/ds/quick-sort')}
				class="btn btn-accent btn-sm"
				style="margin-left: auto;"
			>
				开始学习
			</a>
		</div>
	{/if}

	{#if !hasData}
		<div class="empty-panel" use:reveal>
			<div class="empty-pct">0%</div>
			<div class="empty-line"></div>
			<p class="empty-desc">还没有学习记录，开始你的第一个练习吧</p>
			<a href={resolve('/ds/quick-sort')} class="btn btn-accent">开始快速排序练习</a>
		</div>
	{:else}
		<!-- 3D 掌握度总览 -->
		<div class="mb-10" use:reveal>
			<div class="overview-head">
				<span class="overview-label">掌握度总览 · 34 个知识点</span>
				<span class="overview-hint">鼠标移动可旋转视角</span>
			</div>
			<div
				class="glass relative overflow-hidden rounded-lg border"
				style="border-color: var(--color-line-hair); background: var(--color-surface); height: 300px;"
			>
				<Mastery3D topics={masteryData} avg={avgMastery} />
			</div>
		</div>

		<!-- 统计行（碑式） -->
		<div class="progress-stats mb-12">
			<div class="progress-stat" use:reveal={{ delay: 200 }}>
				<div class="progress-stat-label">连续学习</div>
				<div class="stat-row">
					<span class="stat-num progress-stat-num">{$progress.streakDays}</span>
					<span class="stat-unit">天</span>
				</div>
				<div class="stat-meta">
					{#if $progress.streakDays > 0}
						<span class="tag tag-accent">坚持中</span>
					{:else}
						<span class="tag">未开始</span>
					{/if}
				</div>
			</div>

			<div class="progress-stat" use:reveal={{ delay: 290 }}>
				<div class="progress-stat-label">平均掌握度</div>
				<div class="stat-row">
					<span class="stat-num progress-stat-num">{avgMastery}</span>
					<span class="stat-unit">%</span>
				</div>
				<div class="stat-meta">
					<span class="stat-count">{masteredCount} / {topicEntries.length} 个主题已掌握</span>
				</div>
				<div class="mt-3 h-1 w-full rounded-full" style="background: var(--color-subtle);">
					<div
						class="h-full rounded-full transition-all"
						style="width: {avgMastery}%; background: var(--color-success);"
					></div>
				</div>
			</div>

			<div class="progress-stat" use:reveal={{ delay: 380 }}>
				<div class="progress-stat-label">练习答题</div>
				<div class="stat-row">
					<span class="stat-num progress-stat-num">{correctExercises}</span>
					<span class="stat-unit">/{totalExercises} 题</span>
				</div>
				<div class="stat-meta">
					{#if totalExercises > 0}
						<span class="stat-count"
							>正确率 {Math.round((correctExercises / totalExercises) * 100)}%</span
						>
					{:else}
						<span class="stat-count">完成练习后显示正确率</span>
					{/if}
				</div>
			</div>

			<div class="progress-stat" use:reveal={{ delay: 470 }}>
				<div class="progress-stat-label">错题本</div>
				<div class="stat-row">
					<span class="stat-num progress-stat-num">{totalMistakes}</span>
					<span class="stat-unit">道</span>
				</div>
				<div class="stat-meta">
					{#if pendingMistakes > 0}
						<span class="tag tag-accent">{pendingMistakes} 道待复习</span>
					{:else if totalMistakes > 0}
						<span class="tag tag-success">全部掌握</span>
					{:else}
						<span class="tag">暂无错题</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- 学习热力图 -->
		<section class="mb-12" use:reveal>
			<div class="chapter-head">
				<div class="section-label">学习热力图</div>
				<span class="chapter-count">最近一年</span>
			</div>
			<ActivityHeatmap activity={$progress.dailyActivity} />
		</section>

		<!-- 掌握度 -->
		{#if topicEntries.length > 0}
			<section class="mb-12" use:reveal>
				<div class="chapter-head">
					<div class="section-label">掌握度</div>
					<span class="chapter-count">{masteredCount} / {topicEntries.length} 已掌握</span>
				</div>
				<div class="topic-list">
					{#each topicEntries as [id, t] (id)}
						<div class="topic-row">
							<div class="topic-info">
								<span class="topic-name">{topicName(id)}</span>
								<span class="topic-exercises">
									{t.correctExercises} / {t.totalExercises} 题正确
								</span>
							</div>
							<div class="topic-right">
								<div class="topic-bar">
									<div
										class="topic-bar-fill"
										style="width: 0%;"
										data-target="{t.mastery}%"
										class:done={t.completed}
									></div>
								</div>
								<span class="topic-pct">{t.mastery}%</span>
								{#if t.completed}
									<span class="tag tag-success">已掌握</span>
								{:else}
									<span class="tag">学习中</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 错题本 -->
		{#if totalMistakes > 0}
			<section class="mb-12" use:reveal>
				<div class="chapter-head">
					<div class="section-label">错题本</div>
					<span class="chapter-count">{pendingMistakes} 道待复习</span>
				</div>
				<div class="mistake-list">
					{#each $progress.mistakes as mistake (mistake.id)}
						<div class="mistake-row">
							<div class="mistake-head">
								<span class="mistake-question">{mistake.question}</span>
								<div class="mistake-tags">
									{#if mistake.mastered}
										<span class="tag tag-success">已掌握</span>
									{:else}
										<span class="tag {isMistakeDue(mistake) ? 'tag-accent' : ''}"
											>{mistakeDueText(mistake)} · 复习 {mistake.reviewCount} 次</span
										>
									{/if}
									<span class="tag tag-blue">{mistake.type === 'sql' ? 'SQL' : '算法'}</span>
								</div>
							</div>
							<div class="mistake-answers">
								<div class="answer-line wrong">
									<span class="answer-label">我的答案</span>
									<span class="answer-text">{mistake.wrongAnswer || '—'}</span>
								</div>
								<div class="answer-line right">
									<span class="answer-label">正确答案</span>
									<span class="answer-text">{mistake.correctAnswer}</span>
								</div>
							</div>
							{#if mistake.explanation}
								<p class="mistake-explanation">{mistake.explanation}</p>
							{/if}
							<div class="mistake-meta">
								<span>{topicName(mistake.topic)}</span>
								<span>{formatDate(mistake.timestamp)}</span>
							</div>
							<div class="mistake-actions">
								{#if !mistake.mastered}
									<button class="btn btn-ghost btn-sm" onclick={() => startReview(mistake)}>
										重新作答
									</button>
									<button
										class="btn btn-ghost btn-sm"
										onclick={() => markMistakeMastered(mistake.id)}
									>
										标记已掌握
									</button>
								{/if}
								<button class="btn btn-ghost btn-sm" onclick={() => removeMistake(mistake.id)}>
									移除
								</button>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}

	<!-- 数据备份：空状态也可见（换设备后第一件事就是导入恢复） -->
	<section class="mb-12" use:reveal>
		<div class="chapter-head">
			<div class="section-label">数据备份</div>
			<span class="chapter-count">本地存储 · 不会上传</span>
		</div>
		<div class="backup-panel">
			<p class="backup-desc">
				学习进度与错题保存在本地浏览器。可导出为备份文件，换设备或清理浏览器后重新导入，避免数据丢失。
			</p>
			<div class="backup-actions">
				<button class="btn btn-accent btn-sm" onclick={handleExport}>导出备份</button>
				<button class="btn btn-ghost btn-sm" onclick={() => fileInputRef?.click()}>导入备份</button>
				<input
					bind:this={fileInputRef}
					type="file"
					accept="application/json,.json"
					class="hidden-file"
					onchange={handleImportFile}
				/>
			</div>
			{#if backupMsg}
				<p class="backup-msg" aria-live="polite">{backupMsg}</p>
			{/if}
			{#if backupError}
				<p class="backup-err" role="alert" aria-live="polite">{backupError}</p>
			{/if}
		</div>
	</section>

	{#if reviewQuestion !== null}
		<PracticePanel
			question={reviewQuestion}
			onAnswered={handleReviewAnswered}
			onContinue={handleReviewContinue}
		/>
	{/if}
</div>

<style>
	.stat-row {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	/* === 碑式统计 === */
	.progress-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
	}

	.progress-stat {
		padding: 8px 24px;
	}

	.progress-stat + .progress-stat {
		border-left: 1px solid var(--color-line-hair);
	}

	.progress-stat-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.18em;
		color: var(--color-ink-3);
		margin-bottom: 14px;
	}

	.progress-stat-num {
		font-family: var(--font-display);
		font-size: 42px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	/* === 3D 总览标题条 === */
	.overview-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}

	.overview-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.2em;
		color: var(--color-ink-3);
	}

	.overview-hint {
		font-size: 11px;
		color: var(--color-ink-3);
	}

	@media (max-width: 760px) {
		.progress-stats {
			grid-template-columns: repeat(2, 1fr);
			row-gap: 28px;
		}

		.progress-stat:nth-child(odd) {
			border-left: none;
		}

		.overview-hint {
			display: none;
		}
	}

	.stat-num {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 500;
		line-height: 1;
		color: var(--color-ink);
	}

	.stat-unit {
		font-size: 13px;
		color: var(--color-ink-3);
	}

	.stat-meta {
		margin-top: 10px;
	}

	.stat-count {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	/* 章节标题行 */
	.chapter-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
	}

	.chapter-count {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
		flex-shrink: 0;
	}

	/* 掌握度列表（无框） */
	.topic-list {
		border-top: 1px solid var(--color-line-hair);
	}

	/* 掌握度行 */
	.topic-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin: 0 -12px;
		padding: 14px 12px;
		border-bottom: 1px solid var(--color-line-hair);
		border-radius: var(--radius-sm);
		transition:
			background var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}

	.topic-row:last-child {
		border-bottom: none;
	}

	.topic-row:hover {
		background: var(--color-surface);
	}

	.topic-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.topic-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
		transition: color var(--dur-fast) var(--ease-out);
	}

	.topic-row:hover .topic-name {
		color: var(--color-accent);
	}

	.topic-exercises {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.topic-right {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}

	.topic-bar {
		width: 140px;
		height: 4px;
		background: var(--color-subtle);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.topic-bar-fill {
		transition: width 1s var(--ease-out);

		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width var(--dur-base) var(--ease-out);
	}

	.topic-bar-fill.done {
		background: var(--color-success);
	}

	.topic-pct {
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 500;
		color: var(--color-ink);
		min-width: 36px;
		text-align: right;
	}

	/* 错题列表（无框） */
	.mistake-list {
		border-top: 1px solid var(--color-line-hair);
	}

	/* 错题行 */
	.mistake-row {
		margin: 0 -12px;
		padding: 16px 12px;
		border-bottom: 1px solid var(--color-line-hair);
		border-radius: var(--radius-sm);
		transition:
			background var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}

	.mistake-row:last-child {
		border-bottom: none;
	}

	.mistake-row:hover {
		background: var(--color-surface);
	}

	.mistake-question {
		transition: color var(--dur-fast) var(--ease-out);
	}

	.mistake-row:hover .mistake-question {
		color: var(--color-accent);
	}

	.mistake-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	.mistake-question {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
		line-height: 1.5;
	}

	.mistake-tags {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.mistake-answers {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 10px;
	}

	.answer-line {
		display: flex;
		align-items: baseline;
		gap: 10px;
		font-size: 13px;
	}

	.answer-label {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		min-width: 56px;
		flex-shrink: 0;
	}

	.answer-line.wrong .answer-label {
		color: var(--color-danger);
	}

	.answer-line.wrong .answer-text {
		color: var(--color-ink-2);
		text-decoration: line-through;
		text-decoration-color: var(--color-danger);
		text-decoration-thickness: 1px;
	}

	.answer-line.right .answer-label {
		color: var(--color-success);
	}

	.answer-line.right .answer-text {
		color: var(--color-success);
		font-weight: 500;
	}

	.mistake-explanation {
		font-size: 13px;
		line-height: 1.6;
		color: var(--color-ink-2);
		margin: 0 0 10px;
	}

	.mistake-meta {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mistake-actions {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}

	.btn-sm {
		font-size: 12px;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
	}

	/* 数据备份（无框） */
	.backup-panel {
		border-top: 1px solid var(--color-line-hair);
	}

	.backup-desc {
		font-size: 13px;
		line-height: 1.7;
		color: var(--color-ink-2);
		margin: 0 0 12px;
		max-width: 520px;
	}

	.backup-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.hidden-file {
		display: none;
	}

	.backup-msg {
		margin: 10px 0 0;
		font-size: 13px;
		color: var(--color-success);
	}

	.backup-err {
		margin: 10px 0 0;
		font-size: 13px;
		color: var(--color-danger);
	}

	.tag-blue {
		background: #e8f0fe;
		border-color: #c5d5f5;
		color: #1a3a8f;
	}

	/* 空状态（无学习记录） */
	.empty-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 14px;
		padding: 56px 24px;
		border: 1px dashed var(--color-line-regular);
		border-radius: var(--radius-md);
	}

	.empty-pct {
		font-family: var(--font-display);
		font-size: 64px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--color-ink);
	}

	.empty-line {
		width: 40px;
		height: 1px;
		background: var(--color-line-regular);
	}

	.empty-desc {
		margin: 0;
		font-size: 14px;
		color: var(--color-ink-2);
	}
</style>
