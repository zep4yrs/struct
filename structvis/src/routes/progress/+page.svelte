<script lang="ts">
	import {
		progress,
		reviewMistake,
		markMistakeMastered,
		removeMistake,
		exportProgress,
		importProgress
	} from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import type { MistakeRecord } from '$lib/stores/progress';
	import PracticePanel from '$lib/components/player/PracticePanel.svelte';
	import type { PracticeQuestion } from '$lib/engines/algorithm/types';

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

	const topicEntries = $derived(
		Object.entries($progress.topics).sort((a, b) => b[1].mastery - a[1].mastery)
	);

	const masteredCount = $derived(topicEntries.filter(([, t]) => t.completed).length);
	const totalMistakes = $derived($progress.mistakes.length);
	const pendingMistakes = $derived($progress.mistakes.filter((m) => !m.mastered).length);
	const totalExercises = $derived(topicEntries.reduce((acc, [, t]) => acc + t.totalExercises, 0));
	const correctExercises = $derived(
		topicEntries.reduce((acc, [, t]) => acc + t.correctExercises, 0)
	);
	const avgMastery = $derived(
		topicEntries.length > 0
			? Math.round(topicEntries.reduce((acc, [, t]) => acc + t.mastery, 0) / topicEntries.length)
			: 0
	);
	const hasData = $derived(topicEntries.length > 0 || totalMistakes > 0);

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
		reviewMistake(reviewingMistake.id);
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
	<div class="section-label mb-4">学习进度</div>
	<h1 class="font-display mb-2 text-3xl font-medium" style="letter-spacing: -0.02em;">
		你的学习进度
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2); max-width: 500px;">
		所有数据保存在本地浏览器中，不会上传到任何服务器。
	</p>

	{#if !hasData}
		<div
			class="rounded-lg border p-8 text-center"
			style="border-color: var(--color-line-hair); background: var(--color-surface);"
		>
			<div class="font-display mb-2 text-5xl font-medium" style="color: var(--color-ink);">0%</div>
			<p style="color: var(--color-ink-3); font-size: 14px;">
				还没有学习记录，开始你的第一个练习吧 → <a href={resolve('/ds/quick-sort')}>快速排序</a>
			</p>
		</div>
	{:else}
		<!-- 统计行 -->
		<div class="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
			<div class="card">
				<div class="card-title" style="font-size: 15px;">连续学习</div>
				<div class="stat-row">
					<span class="stat-num">{$progress.streakDays}</span>
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

			<div class="card">
				<div class="card-title" style="font-size: 15px;">平均掌握度</div>
				<div class="stat-row">
					<span class="stat-num">{avgMastery}</span>
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

			<div class="card">
				<div class="card-title" style="font-size: 15px;">练习答题</div>
				<div class="stat-row">
					<span class="stat-num">{correctExercises}</span>
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

			<div class="card">
				<div class="card-title" style="font-size: 15px;">错题本</div>
				<div class="stat-row">
					<span class="stat-num">{totalMistakes}</span>
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

		<!-- 掌握度 -->
		{#if topicEntries.length > 0}
			<section class="mb-10">
				<div class="section-label mb-3">掌握度</div>
				<div class="card" style="padding: 8px 0;">
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
										style="width: {t.mastery}%;"
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
			<section>
				<div class="section-label mb-3">错题本</div>
				<div class="card" style="padding: 0;">
					{#each $progress.mistakes as mistake (mistake.id)}
						<div class="mistake-row">
							<div class="mistake-head">
								<span class="mistake-question">{mistake.question}</span>
								<div class="mistake-tags">
									{#if mistake.mastered}
										<span class="tag tag-success">已掌握</span>
									{:else}
										<span class="tag tag-accent">待复习 · {mistake.reviewCount} 次</span>
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
	<section class="mb-10">
		<div class="section-label mb-3">数据备份</div>
		<div class="card">
			<p class="backup-desc">
				学习进度与错题保存在本地浏览器。可导出为备份文件，换设备或清理浏览器后重新导入，避免数据丢失。
			</p>
			<div class="backup-actions">
				<button class="btn btn-ghost btn-sm" onclick={handleExport}>导出备份</button>
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
	.card-title {
		font-family: var(--font-display);
		font-weight: 500;
		margin-bottom: 8px;
	}

	.stat-row {
		display: flex;
		align-items: baseline;
		gap: 4px;
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

	/* 掌握度行 */
	.topic-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 24px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.topic-row:last-child {
		border-bottom: none;
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

	/* 错题行 */
	.mistake-row {
		padding: 16px 24px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.mistake-row:last-child {
		border-bottom: none;
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

	/* 数据备份 */
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
</style>
