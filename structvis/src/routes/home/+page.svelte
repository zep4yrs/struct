<script lang="ts">
	import { resolve } from '$app/paths';
	import { progress, isMistakeDue } from '$lib/stores/progress';
	import { dsTopics, dbTopics } from '$lib/content/topics';

	function greeting(): string {
		const h = new Date().getHours();
		if (h < 6) return '夜深了';
		if (h < 11) return '早上好';
		if (h < 14) return '中午好';
		if (h < 18) return '下午好';
		return '晚上好';
	}

	function dayKey(): string {
		const d = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
	}

	// === 学习数据（全部本地 progress 单源） ===
	const topicEntries = $derived(Object.entries($progress.topics).map(([id, t]) => ({ id, ...t })));
	const studiedTopics = $derived(topicEntries.filter((t) => (t.totalExercises ?? 0) > 0));

	// 继续学习：最近一次有记录的课题
	const topicCardById = new Map<string, { title: string; href: string; group: string }>(
		[...dsTopics, ...dbTopics].map((t) => [
			t.href,
			{ title: t.title, href: t.href, group: t.group }
		])
	);
	const lastTopic = $derived.by(() => {
		const sorted = [...studiedTopics].sort((a, b) => b.lastVisited - a.lastVisited);
		const top = sorted[0];
		if (!top) return null;
		const card = topicCardById.get('/' + top.id) ?? topicCardById.get(top.id);
		return card ? { ...card, mastery: top.mastery, total: top.totalExercises } : null;
	});

	// 今日待办
	const dailyDone = $derived(
		typeof localStorage !== 'undefined' &&
			localStorage.getItem('structvis:daily:' + dayKey()) === '1'
	);
	const dueMistakes = $derived($progress.mistakes.filter((m) => isMistakeDue(m)).length);

	// 数据概览
	const avgMastery = $derived(
		studiedTopics.length > 0
			? Math.round(studiedTopics.reduce((n, t) => n + t.mastery, 0) / studiedTopics.length)
			: 0
	);
	const masteredCount = $derived(studiedTopics.filter((t) => t.mastery >= 80).length);
	const totalExercises = $derived(studiedTopics.reduce((n, t) => n + (t.totalExercises ?? 0), 0));
</script>

<div class="mx-auto max-w-5xl px-5 pb-28">
	<header class="home-head">
		<h1 class="home-title">{greeting()}</h1>
		<p class="home-sub">
			{#if studiedTopics.length > 0}
				连续学习 {$progress.streakDays} 天 · 今天也来薄一步
			{:else}
				从这里开始你的可视化学习之旅
			{/if}
		</p>
	</header>

	<!-- 继续学习 -->
	<section class="section">
		{#if lastTopic}
			<a class="resume-card" href={resolve(lastTopic.href as '/ds/quick-sort')}>
				<div class="resume-info">
					<span class="resume-kicker">继续学习</span>
					<span class="resume-title">{lastTopic.title}</span>
					<span class="resume-meta">
						{lastTopic.group} · 掌握度 {lastTopic.mastery}% · 已练 {lastTopic.total} 题
					</span>
				</div>
				<span class="resume-go">继续 →</span>
			</a>
		{:else}
			<a class="resume-card resume-empty" href={resolve('/catalog')}>
				<div class="resume-info">
					<span class="resume-kicker">开始学习</span>
					<span class="resume-title">从课程目录选择你的第一课</span>
					<span class="resume-meta">49 个数据结构 + 37 个数据库课题，全部可交互</span>
				</div>
				<span class="resume-go">去选课 →</span>
			</a>
		{/if}
	</section>

	<!-- 今日待办 -->
	<section class="section">
		<h2 class="section-title">今日待办</h2>
		<div class="todo-grid">
			<a class="todo-card" href={resolve('/progress')}>
				<span class="todo-icon" style="color: var(--color-accent);">📝</span>
				<span class="todo-name">每日一题</span>
				<span class="todo-state" class:done={dailyDone}>
					{dailyDone ? '今日已完成 ✓' : '待完成'}
				</span>
			</a>
			<a class="todo-card" href={resolve('/progress')}>
				<span class="todo-icon" style="color: var(--color-danger);">⚡</span>
				<span class="todo-name">错题复习</span>
				<span class="todo-state" class:done={dueMistakes === 0}>
					{dueMistakes > 0 ? `${dueMistakes} 道到期` : '无到期错题'}
				</span>
			</a>
		</div>
	</section>

	<!-- 数据概览 -->
	<section class="section">
		<h2 class="section-title">学习概览</h2>
		<div class="stats-grid">
			<div class="stat-card">
				<span class="stat-num">{$progress.streakDays}</span>
				<span class="stat-label">连续天数</span>
			</div>
			<div class="stat-card">
				<span class="stat-num">{avgMastery}%</span>
				<span class="stat-label">平均掌握度</span>
			</div>
			<div class="stat-card">
				<span class="stat-num">{masteredCount}</span>
				<span class="stat-label">已掌握课题</span>
			</div>
			<div class="stat-card">
				<span class="stat-num">{totalExercises}</span>
				<span class="stat-label">累计练习</span>
			</div>
		</div>
	</section>

	<!-- 快捷入口 -->
	<section class="section">
		<h2 class="section-title">快捷入口</h2>
		<div class="quick-grid">
			<a class="quick-card" href={resolve('/catalog')}>
				<span class="quick-title">课程目录</span>
				<span class="quick-desc">{dsTopics.length + dbTopics.length} 个课题</span>
			</a>
			<a class="quick-card" href={resolve('/race')}>
				<span class="quick-title">竞速实验室</span>
				<span class="quick-desc">30 引擎同屏竞速</span>
			</a>
			<a class="quick-card" href={resolve('/map')}>
				<span class="quick-title">技能图谱</span>
				<span class="quick-desc">规划学习路径</span>
			</a>
			<a class="quick-card" href={resolve('/report')}>
				<span class="quick-title">学习报告</span>
				<span class="quick-desc">阶段总结一键生成</span>
			</a>
		</div>
	</section>

	<footer class="home-foot">
		<a href={resolve('/about')}>关于 StructVis</a>
		<span>© 2026 zep4yrs</span>
	</footer>
</div>

<style>
	.home-head {
		padding: 28px 0 20px;
	}

	.home-title {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		margin: 0;
	}

	.home-sub {
		font-size: 13.5px;
		color: var(--color-ink-2);
		margin: 6px 0 0;
	}

	.section {
		margin-top: 26px;
	}

	.section-title {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-ink-3);
		margin: 0 0 10px;
	}

	/* 继续学习 */
	.resume-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 20px 22px;
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-lg, 14px);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-accent) 7%, var(--color-surface)),
			var(--color-surface)
		);
		text-decoration: none;
		transition:
			border-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	.resume-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 8px 28px rgba(217, 119, 6, 0.14);
	}

	.resume-card.resume-empty {
		background: var(--color-surface);
	}

	.resume-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.resume-kicker {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-accent);
	}

	.resume-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.resume-meta {
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.resume-go {
		flex-shrink: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-accent-text);
	}

	/* 今日待办 */
	.todo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 12px;
	}

	.todo-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px 18px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md, 12px);
		background: var(--color-surface);
		text-decoration: none;
		transition:
			border-color 120ms var(--ease-out),
			box-shadow 120ms var(--ease-out);
	}

	.todo-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 4px 14px rgba(217, 119, 6, 0.1);
	}

	.todo-icon {
		font-size: 16px;
	}

	.todo-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.todo-state {
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.todo-state.done {
		color: var(--color-success);
		font-weight: 500;
	}

	/* 数据概览 */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 12px;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 16px 18px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md, 12px);
		background: var(--color-surface);
	}

	.stat-num {
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 600;
		color: var(--color-accent-text);
	}

	.stat-label {
		font-size: 11.5px;
		color: var(--color-ink-2);
	}

	/* 快捷入口 */
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 12px;
	}

	.quick-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md, 12px);
		background: var(--color-surface);
		text-decoration: none;
		transition:
			border-color 120ms var(--ease-out),
			box-shadow 120ms var(--ease-out);
	}

	.quick-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 4px 14px rgba(217, 119, 6, 0.1);
	}

	.quick-title {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.quick-desc {
		font-size: 11.5px;
		color: var(--color-ink-2);
	}

	.home-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 40px;
		padding-top: 16px;
		border-top: 1px solid var(--color-line-hair);
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.home-foot a {
		color: var(--color-ink-2);
		text-decoration: none;
	}

	.home-foot a:hover {
		color: var(--color-ink);
	}
</style>
