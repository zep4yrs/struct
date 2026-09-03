<script lang="ts">
	import { resolve } from '$app/paths';
	import { progress, isMistakeDue } from '$lib/stores/progress';
	import { dsTopics, dbTopics, TOPIC_ALIASES } from '$lib/content/topics';
	import { QUIZ_BANK } from '$lib/content/quiz-bank';
	import { reveal, revealOnScroll } from '$lib/utils/motion';

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

	// === 学习数据（progress 单源） ===
	const allTopics = [...dsTopics, ...dbTopics];
	const cardByTopicId = new Map(allTopics.map((t) => [t.topicId, t]));

	interface StudiedEntry {
		id: string;
		mastery: number;
		totalExercises: number;
		lastVisited: number;
		card?: (typeof allTopics)[number];
	}

	const studied = $derived.by(() => {
		const out: StudiedEntry[] = [];
		for (const [id, t] of Object.entries($progress.topics)) {
			if ((t.totalExercises ?? 0) <= 0) continue;
			out.push({
				id,
				mastery: t.mastery,
				totalExercises: t.totalExercises,
				lastVisited: t.lastVisited,
				card: cardByTopicId.get(id)
			});
		}
		return out.sort((a, b) => b.lastVisited - a.lastVisited);
	});

	const lastTopic = $derived(studied[0] ?? null);
	const recentTopics = $derived(studied.slice(0, 10).filter((t) => t.card));

	const dailyDone = $derived(
		typeof localStorage !== 'undefined' &&
			localStorage.getItem('structvis:daily:' + dayKey()) === '1'
	);
	const dueMistakes = $derived($progress.mistakes.filter((m) => isMistakeDue(m)).length);

	const avgMastery = $derived(
		studied.length > 0 ? Math.round(studied.reduce((n, t) => n + t.mastery, 0) / studied.length) : 0
	);
	const masteredCount = $derived(studied.filter((t) => t.mastery >= 80).length);
	const totalExercises = $derived(studied.reduce((n, t) => n + t.totalExercises, 0));

	// 掌握度环参数（SVG stroke-dasharray）
	const RING_R = 44;
	const RING_C = 2 * Math.PI * RING_R;
	const ringOffset = $derived(RING_C * (1 - (lastTopic?.mastery ?? 0) / 100));
</script>

<div class="dash">
	<!-- ═══ 首屏：问候 + 继续学习 hero + 今日待办 ═══ -->
	<header class="dash-head" use:reveal>
		<p class="dash-eyebrow">STRUCTVIS · 我的学习台</p>
		<h1 class="dash-title">{greeting()}，继续吗？</h1>
	</header>

	<section class="hero-row">
		<!-- 继续学习大卡 -->
		{#if lastTopic?.card}
			<a class="resume-hero liquid" href={resolve(lastTopic.card.href as '/ds/quick-sort')}>
				<div class="resume-left">
					<span class="resume-kicker">继续学习 · {lastTopic.card.group}</span>
					<span class="resume-title">{lastTopic.card.title}</span>
					<span class="resume-meta">
						掌握度 {lastTopic.mastery}% · 已练 {lastTopic.totalExercises} 题
						{#if lastTopic.mastery >= 80}· 已掌握 ✓{/if}
					</span>
					<span class="resume-cta">继续这一课 →</span>
				</div>
				<div class="ring" role="img" aria-label="掌握度 {lastTopic.mastery}%">
					<svg viewBox="0 0 100 100">
						<circle class="ring-bg" cx="50" cy="50" r={RING_R} />
						<circle
							class="ring-fill"
							cx="50"
							cy="50"
							r={RING_R}
							stroke-dasharray={RING_C}
							stroke-dashoffset={ringOffset}
						/>
					</svg>
					<span class="ring-num">{lastTopic.mastery}<i>%</i></span>
				</div>
			</a>
		{:else}
			<a class="resume-hero resume-empty liquid" href={resolve('/catalog')}>
				<div class="resume-left">
					<span class="resume-kicker">开始学习</span>
					<span class="resume-title">从第一课开始</span>
					<span class="resume-meta">{allTopics.length} 个课题 · 全部可交互 · 数据留在本地</span>
					<span class="resume-cta">浏览课程目录 →</span>
				</div>
				<div class="ring-empty ring" aria-hidden="true">
					<svg viewBox="0 0 100 100">
						<circle class="ring-bg" cx="50" cy="50" r={RING_R} />
						<circle
							class="ring-fill"
							cx="50"
							cy="50"
							r={RING_R}
							stroke-dasharray={RING_C}
							stroke-dashoffset={RING_C}
						/>
					</svg>
					<span class="ring-num">GO</span>
				</div>
			</a>
		{/if}

		<!-- 今日待办竖列 -->
		<div class="todo-col">
			<a class="todo-item liquid" href={resolve('/progress')}>
				<span class="todo-dot" class:done={dailyDone}></span>
				<span class="todo-name">每日一题</span>
				<span class="todo-state" class:done={dailyDone}>{dailyDone ? '已完成 ✓' : '待完成'}</span>
			</a>
			<a class="todo-item liquid" href={resolve('/progress')}>
				<span class="todo-dot" class:done={dueMistakes === 0}></span>
				<span class="todo-name">错题复习</span>
				<span class="todo-state" class:done={dueMistakes === 0}>
					{dueMistakes > 0 ? `${dueMistakes} 道到期` : '无到期'}
				</span>
			</a>
			<a class="todo-item liquid" href={resolve('/report')}>
				<span class="todo-dot"></span>
				<span class="todo-name">学习报告</span>
				<span class="todo-state">查看 →</span>
			</a>
		</div>
	</section>

	<!-- ═══ 统计条（紧凑一行） ═══ -->
	{#if studied.length > 0}
		<section class="stat-bar liquid" use:reveal={{ delay: 100 }}>
			<div class="stat-cell">
				<span class="stat-num">{$progress.streakDays}</span>
				<span class="stat-label">连续天数</span>
			</div>
			<div class="stat-sep"></div>
			<div class="stat-cell">
				<span class="stat-num">{avgMastery}%</span>
				<span class="stat-label">平均掌握</span>
			</div>
			<div class="stat-sep"></div>
			<div class="stat-cell">
				<span class="stat-num">{masteredCount}<i>/{allTopics.length}</i></span>
				<span class="stat-label">已掌握</span>
			</div>
			<div class="stat-sep"></div>
			<div class="stat-cell">
				<span class="stat-num">{totalExercises}</span>
				<span class="stat-label">累计练习</span>
			</div>
		</section>

		<!-- ═══ 最近在学（横滑） ═══ -->
		{#if recentTopics.length > 1}
			<section class="recent">
				<h2 class="block-label" use:revealOnScroll>最近在学</h2>
				<div class="recent-scroll">
					{#each recentTopics as t (t.id)}
						<a
							class="recent-card liquid"
							href={resolve(t.card!.href as '/ds/quick-sort')}
							use:reveal={{ delay: 60, y: 10 }}
						>
							<span class="recent-title">{t.card!.title}</span>
							<span class="recent-meta">{t.card!.group} · {t.mastery}%</span>
							<span class="recent-bar">
								<i class:mastered={t.mastery >= 80} style="width:{t.mastery}%"></i>
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/if}

	<!-- ═══ 门面区：产品全景 ═══ -->
	<section class="facade">
		<div class="block-head" use:revealOnScroll>
			<span class="block-eyebrow">全景</span>
			<h2 class="block-title">一个学习台，四件兵器</h2>
		</div>
		<div class="facade-grid">
			<a
				class="facade-card liquid"
				href={resolve('/catalog')}
				use:revealOnScroll={{ delay: 80, y: 16 }}
			>
				<span class="facade-num">01</span>
				<h3 class="facade-title">步进可视化</h3>
				<p class="facade-desc">
					{allTopics.length} 个课题全部逐帧播放——排序、树、图、SQL，每一步可暂停、可回放、可改数据重演。
				</p>
			</a>
			<a
				class="facade-card liquid"
				href={resolve('/progress')}
				use:revealOnScroll={{ delay: 140, y: 16 }}
			>
				<span class="facade-num">02</span>
				<h3 class="facade-title">练习闭环</h3>
				<p class="facade-desc">
					{QUIZ_BANK.length} 题库 · 四类题型 · 答错即进错题本 SRS 复习——掌握度实时写回每个课题。
				</p>
			</a>
			<a
				class="facade-card liquid"
				href={resolve('/race')}
				use:revealOnScroll={{ delay: 200, y: 16 }}
			>
				<span class="facade-num">03</span>
				<h3 class="facade-title">实验竞技场</h3>
				<p class="facade-desc">
					竞速实验室 30 引擎同屏对垒 · SQL 剧本站 19 主题真实执行（sql.js 本地跑，数据不出浏览器）。
				</p>
			</a>
			<a
				class="facade-card liquid"
				href={resolve('/map')}
				use:revealOnScroll={{ delay: 260, y: 16 }}
			>
				<span class="facade-num">04</span>
				<h3 class="facade-title">路径导航</h3>
				<p class="facade-desc">
					技能图谱点亮前置依赖 · 学习报告雷达定位弱项 · Ctrl+K 直达
					{allTopics.length} 主题 + {Object.keys(TOPIC_ALIASES).length} 组别名。
				</p>
			</a>
		</div>
	</section>

	<!-- ═══ 两门课程入口 ═══ -->
	<section class="courses">
		<div class="block-head" use:revealOnScroll>
			<span class="block-eyebrow">课程</span>
			<h2 class="block-title">两门课，{allTopics.length} 个知识点</h2>
		</div>
		<div class="courses-grid">
			<a
				class="course-card liquid"
				href={resolve('/catalog')}
				use:revealOnScroll={{ delay: 100, y: 18 }}
			>
				<div class="course-tag">数据结构</div>
				<h3 class="course-title">
					数据结构与算法<span class="course-count">{dsTopics.length}</span>
				</h3>
				<p class="course-desc">李春葆《数据结构教程》第5版配套</p>
				<span class="course-meta">排序 · 树 · 图 · 查找 · 动态规划</span>
			</a>
			<a
				class="course-card liquid"
				href={resolve('/catalog')}
				use:revealOnScroll={{ delay: 180, y: 18 }}
			>
				<div class="course-tag tag-blue">MySQL</div>
				<h3 class="course-title">
					MySQL 数据库<span class="course-count">{dbTopics.length}</span>
				</h3>
				<p class="course-desc">杨宏霞《数据库技术及应用（MySQL）》配套</p>
				<span class="course-meta">查询 · 索引 · 事务 · 范式 · SQL 实验</span>
			</a>
		</div>
	</section>

	<footer class="dash-foot">
		<a href={resolve('/about')}>关于 StructVis</a>
		<span>© 2026 zep4yrs</span>
	</footer>
</div>

<style>
	.dash {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 24px 140px;
	}

	/* ═══ 首屏头部 ═══ */
	.dash-head {
		padding: 34px 0 20px;
	}

	.dash-eyebrow {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--color-ink-3);
		margin: 0 0 8px;
	}

	.dash-title {
		font-family: var(--font-display);
		font-size: clamp(30px, 4.4vw, 44px);
		font-weight: 500;
		letter-spacing: -0.025em;
		color: var(--color-ink);
		margin: 0;
	}

	/* ═══ 首屏行：hero 大卡 + 待办竖列 ═══ */
	.hero-row {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 14px;
		align-items: stretch;
		min-height: 250px;
	}

	.resume-hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 30px 36px;
		border-radius: 20px;
		text-decoration: none;
	}

	.resume-left {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.resume-kicker {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-accent);
	}

	.resume-title {
		font-family: var(--font-display);
		font-size: clamp(26px, 3.2vw, 38px);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		line-height: 1.12;
	}

	.resume-meta {
		font-size: 13.5px;
		color: var(--color-ink-2);
	}

	.resume-cta {
		margin-top: 6px;
		font-size: 14.5px;
		font-weight: 600;
		color: var(--color-accent-text);
		transition: transform 150ms var(--ease-out);
	}

	.resume-hero:hover .resume-cta {
		transform: translateX(4px);
	}

	/* 掌握度环 */
	.ring {
		position: relative;
		width: 116px;
		height: 116px;
		flex-shrink: 0;
	}

	.ring svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	.ring-bg {
		fill: none;
		stroke: var(--color-line-hair);
		stroke-width: 7;
	}

	.ring-fill {
		fill: none;
		stroke: var(--color-accent);
		stroke-width: 7;
		stroke-linecap: round;
		transition: stroke-dashoffset 700ms var(--ease-out);
	}

	.ring-num {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.ring-num i {
		font-style: normal;
		font-size: 13px;
		color: var(--color-ink-3);
		margin-left: 1px;
	}

	.ring-empty .ring-num {
		font-size: 22px;
		letter-spacing: 0.04em;
		color: var(--color-accent);
	}

	.resume-empty {
		background: color-mix(in srgb, var(--color-surface) 46%, transparent);
	}

	/* 待办竖列 */
	.todo-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.todo-item {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 18px;
		border-radius: 16px;
		text-decoration: none;
	}

	.todo-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-accent);
		flex-shrink: 0;
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent);
	}

	.todo-dot.done {
		background: var(--color-success);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-success) 18%, transparent);
	}

	.todo-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.todo-state {
		margin-left: auto;
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.todo-state.done {
		color: var(--color-success);
		font-weight: 500;
	}

	/* ═══ 统计条 ═══ */
	.stat-bar {
		display: flex;
		align-items: center;
		justify-content: space-around;
		margin-top: 14px;
		padding: 18px 12px;
		border-radius: 16px;
	}

	.stat-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 90px;
	}

	.stat-num {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-accent-text);
	}

	.stat-num i {
		font-style: normal;
		font-size: 14px;
		color: var(--color-ink-3);
	}

	.stat-label {
		font-size: 11.5px;
		color: var(--color-ink-2);
	}

	.stat-sep {
		width: 1px;
		height: 34px;
		background: var(--color-line-hair);
	}

	/* ═══ 区块头（门面/课程共用） ═══ */
	.block-head {
		margin: 48px 0 18px;
	}

	.block-eyebrow {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--color-accent);
	}

	.block-title {
		font-family: var(--font-display);
		font-size: clamp(22px, 2.6vw, 30px);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		margin: 4px 0 0;
	}

	.block-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-ink-3);
		margin: 26px 0 10px;
	}

	/* ═══ 最近在学（横滑） ═══ */
	.recent-scroll {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		padding-bottom: 6px;
		scrollbar-width: thin;
	}

	.recent-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 190px;
		padding: 14px 16px;
		border-radius: 14px;
		text-decoration: none;
	}

	.recent-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.recent-meta {
		font-size: 11.5px;
		color: var(--color-ink-2);
	}

	.recent-bar {
		height: 4px;
		border-radius: 2px;
		background: var(--color-line-hair);
		overflow: hidden;
	}

	.recent-bar i {
		display: block;
		height: 100%;
		border-radius: 2px;
		background: var(--color-accent);
		transition: width 500ms var(--ease-out);
	}

	.recent-bar i.mastered {
		background: var(--color-success);
	}

	/* ═══ 门面区：产品全景四卡 ═══ */
	.facade-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 14px;
	}

	.facade-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 22px 22px 20px;
		border-radius: 18px;
		text-decoration: none;
	}

	.facade-num {
		position: absolute;
		top: 16px;
		right: 18px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-ink-3);
		opacity: 0.7;
	}

	.facade-title {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-ink);
		margin: 0;
	}

	.facade-desc {
		font-size: 13px;
		line-height: 1.65;
		color: var(--color-ink-2);
		margin: 0;
	}

	/* ═══ 两门课程入口 ═══ */
	.courses-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 14px;
	}

	.course-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 26px;
		border-radius: 20px;
		text-decoration: none;
	}

	.course-tag {
		align-self: flex-start;
		font-family: var(--font-mono);
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
		border-radius: 999px;
		padding: 3px 10px;
	}

	.course-tag.tag-blue {
		color: var(--color-academic);
		border-color: color-mix(in srgb, var(--color-academic) 40%, transparent);
	}

	.course-title {
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		margin: 4px 0 0;
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.course-count {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 500;
		color: var(--color-ink-3);
	}

	.course-desc {
		font-size: 13px;
		color: var(--color-ink-2);
		margin: 0;
	}

	.course-meta {
		margin-top: 6px;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.04em;
		color: var(--color-ink-3);
	}

	/* ═══ 页脚 ═══ */
	.dash-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 52px;
		padding-top: 16px;
		border-top: 1px solid var(--color-line-hair);
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.dash-foot a {
		color: var(--color-ink-2);
		text-decoration: none;
	}

	.dash-foot a:hover {
		color: var(--color-ink);
	}

	@media (max-width: 767px) {
		.hero-row {
			grid-template-columns: 1fr;
		}

		.resume-hero {
			flex-direction: column;
			align-items: flex-start;
			padding: 24px;
		}

		.ring {
			align-self: flex-end;
			margin-top: -64px;
		}

		.stat-bar {
			flex-wrap: wrap;
			gap: 12px;
		}

		.stat-sep {
			display: none;
		}
	}
</style>
