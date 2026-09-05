<script lang="ts">
	import { resolve } from '$app/paths';
	import { progress, isMistakeDue } from '$lib/stores/progress';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import { reveal } from '$lib/utils/motion';

	/**
	 * 期末冲刺模式：设一个考试日期，把错题本 SRS、每日一题、薄弱课题串成每日任务包。
	 * 数据全部来自本地（progress store + localStorage），不引入新依赖。
	 */

	const allTopics = [...dsTopics, ...dbTopics];
	const titleByTopicId = new Map(allTopics.filter((t) => t.topicId).map((t) => [t.topicId!, t]));

	interface SprintCfg {
		examDate: string; // YYYY-MM-DD
	}

	const SPRINT_KEY = 'structvis:sprint';
	let cfg = $state<SprintCfg | null>(null);
	let dateInput = $state('');
	let today = $state('');

	function load() {
		today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }); // YYYY-MM-DD
		try {
			const raw = localStorage.getItem(SPRINT_KEY);
			cfg = raw ? (JSON.parse(raw) as SprintCfg) : null;
			dateInput = cfg?.examDate ?? '';
		} catch {
			cfg = null;
		}
	}

	function save() {
		if (!dateInput) return;
		cfg = { examDate: dateInput };
		localStorage.setItem(SPRINT_KEY, JSON.stringify(cfg));
	}

	function stop() {
		cfg = null;
		localStorage.removeItem(SPRINT_KEY);
	}

	// ── 倒计时 ──
	const daysLeft = $derived.by(() => {
		if (!cfg?.examDate) return 0;
		const exam = new Date(cfg.examDate + 'T23:59:59+08:00').getTime();
		return Math.max(0, Math.ceil((exam - Date.now()) / 86400000));
	});

	// ── 今日任务 ──
	const dailyKey = $derived('structvis:daily:' + today);
	const dailyDone = $derived(
		typeof localStorage !== 'undefined' && localStorage.getItem(dailyKey) === '1'
	);
	const dueMistakes = $derived($progress.mistakes.filter((m) => isMistakeDue(m)));
	const dueCleared = $derived($progress.mistakes.length > 0 && dueMistakes.length === 0);

	// 薄弱课题：练过且掌握度最低的 3 个
	const weakTopics = $derived.by(() => {
		const rows: { id: string; title: string; href: string; mastery: number }[] = [];
		for (const [id, t] of Object.entries($progress.topics)) {
			if ((t.totalExercises ?? 0) <= 0) continue;
			const card = titleByTopicId.get(id);
			if (card) rows.push({ id, title: card.title, href: card.href, mastery: t.mastery });
		}
		return rows.sort((a, b) => a.mastery - b.mastery).slice(0, 3);
	});
	const weakest = $derived(weakTopics[0] ?? null);

	// 每日错题配额：到期题全清即达成（SRS 本身就是按天排期的）
	const tasks = $derived([
		{
			key: 'mistakes',
			label: '清完今日到期错题',
			detail: dueMistakes.length > 0 ? `还有 ${dueMistakes.length} 道到期` : '今日到期错题已清空',
			href: resolve('/progress') + '#mistakes',
			done: dueCleared
		},
		{
			key: 'daily',
			label: '完成今日一题',
			detail: dailyDone ? '今日已完成 ✓' : '还没做，去学习进度页答题',
			href: resolve('/progress'),
			done: dailyDone
		},
		{
			key: 'weak',
			label: weakest ? `复习薄弱课题：${weakest.title}` : '复习薄弱课题',
			detail: weakest ? `当前掌握度 ${weakest.mastery}%` : '练过题之后这里会给你推荐',
			href: weakest ? resolve(weakest.href as '/ds/quick-sort') : resolve('/catalog'),
			done: false as boolean
		}
	]);
	const doneCount = $derived(tasks.filter((t) => t.done).length);

	// 冲刺期间累计练习（每日活动求和）
	const studied = $derived(Object.values($progress.dailyActivity).reduce((a, b) => a + b, 0));

	load();
</script>

<div class="mx-auto max-w-4xl p-8 pb-28">
	<div class="section-label mb-4" use:reveal>期末冲刺 · SPRINT</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em"
		use:reveal={{ delay: 90 }}
	>
		冲刺计划
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2)" use:reveal={{ delay: 160 }}>
		设一个考试日期，错题、每日一题和薄弱课题会自动排成每天的任务包。
	</p>

	{#if !cfg}
		<div class="liquid p-6" use:reveal>
			<label class="mb-2 block text-sm" style="color: var(--color-ink-2)" for="sprint-date"
				>考试日期（或你想完成复习的日期）</label
			>
			<div class="flex flex-wrap items-center gap-3">
				<input
					id="sprint-date"
					type="date"
					bind:value={dateInput}
					class="rounded-md border px-3 py-2"
					style="border-color: var(--color-line-regular); background: var(--color-surface); color: var(--color-ink)"
				/>
				<button class="btn btn-accent" onclick={save}>开始冲刺</button>
			</div>
			<p class="mt-3 text-xs" style="color: var(--color-ink-3)">
				只存本地浏览器，随时可以停止冲刺。
			</p>
		</div>
	{:else}
		<!-- 倒计时 hero -->
		<div class="liquid sprint-hero" use:reveal>
			<div>
				<div class="sprint-label">距离 {cfg.examDate}</div>
				<div class="sprint-days">{daysLeft}<i> 天</i></div>
			</div>
			<div class="sprint-side">
				<div class="sprint-side-num">{doneCount}/3</div>
				<div class="sprint-side-label">今日任务</div>
				<button class="btn btn-ghost btn-sm" onclick={stop}>停止冲刺</button>
			</div>
		</div>

		<!-- 今日任务包 -->
		<h2 class="mt-8 mb-4 font-display text-2xl font-semibold" use:reveal>今日任务包</h2>
		<div class="grid gap-3">
			{#each tasks as t (t.key)}
				<a class="liquid sprint-task" class:done={t.done} href={t.href} use:reveal={{ y: 10 }}>
					<span class="sprint-dot" class:ok={t.done}></span>
					<span class="sprint-task-label">{t.label}</span>
					<span class="sprint-task-detail" class:ok-text={t.done}>{t.detail}</span>
					<span class="sprint-go">{t.done ? '已完成' : '去做 →'}</span>
				</a>
			{/each}
		</div>

		<!-- 薄弱课题榜 -->
		<h2 class="mt-8 mb-4 font-display text-2xl font-semibold" use:reveal>薄弱课题榜</h2>
		{#if weakTopics.length}
			<div class="grid gap-2">
				{#each weakTopics as w, i (w.id)}
					<a
						class="liquid weak-row"
						href={resolve(w.href as '/ds/quick-sort')}
						use:reveal={{ y: 8 }}
					>
						<span class="weak-rank">{i + 1}</span>
						<span class="weak-title">{w.title}</span>
						<span
							class="weak-pct"
							style="color: {w.mastery >= 80 ? 'var(--color-success)' : 'var(--color-accent-text)'}"
							>{w.mastery}%</span
						>
					</a>
				{/each}
			</div>
		{:else}
			<p class="text-sm" style="color: var(--color-ink-3)">
				还没有练习数据——先去
				<a href={resolve('/catalog')} style="color: var(--color-accent-text)">课程目录</a>
				挑一个课题开始，练过之后这里会自动排出你的薄弱项。
			</p>
		{/if}

		<p class="mt-8 text-xs" style="color: var(--color-ink-3)" use:reveal>
			冲刺期间累计练习 {studied} 次 · 数据全部保存在本地浏览器
		</p>
	{/if}
</div>

<svelte:head><title>期末冲刺 · StructVis</title></svelte:head>

<style>
	.sprint-hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		border-radius: var(--radius-lg);
		padding: 26px 30px;
	}

	.sprint-label {
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	.sprint-days {
		font-family: var(--font-display);
		font-size: 64px;
		font-weight: 600;
		letter-spacing: -0.03em;
		color: var(--color-accent-text);
		line-height: 1.1;
	}

	.sprint-days i {
		font-style: normal;
		font-size: 22px;
		color: var(--color-ink-3);
		margin-left: 4px;
	}

	.sprint-side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}

	.sprint-side-num {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.sprint-side-label {
		font-size: 12px;
		color: var(--color-ink-3);
		margin-bottom: 4px;
	}

	.sprint-task {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px 18px;
		border-radius: var(--radius-md);
		text-decoration: none;
	}

	.sprint-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--color-line-regular);
		flex-shrink: 0;
	}

	.sprint-dot.ok {
		background: var(--color-success);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-success) 18%, transparent);
	}

	.sprint-task-label {
		font-weight: 500;
		font-size: 14.5px;
		color: var(--color-ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sprint-task-detail {
		margin-left: auto;
		font-size: 12.5px;
		color: var(--color-ink-3);
		white-space: nowrap;
	}

	.sprint-task-detail.ok-text {
		color: var(--color-success);
	}

	.sprint-go {
		flex-shrink: 0;
		font-size: 12.5px;
		color: var(--color-accent-text);
		font-weight: 500;
	}

	.weak-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: var(--radius-md);
		text-decoration: none;
	}

	.weak-rank {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
		width: 18px;
	}

	.weak-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.weak-pct {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 13px;
	}

	@media (max-width: 640px) {
		.sprint-task {
			flex-wrap: wrap;
		}

		.sprint-task-detail {
			margin-left: 22px;
			flex-basis: 100%;
			order: 3;
		}
	}
</style>
