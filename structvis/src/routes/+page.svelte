<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, stagger } from 'animejs';
	import Scene3D from '$lib/components/ui/Scene3D.svelte';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import { reveal, prefersReducedMotion } from '$lib/utils/motion';

	const TOTAL_TOPICS = dsTopics.length + dbTopics.length;

	let titleLine1: HTMLSpanElement | undefined = $state();
	let titleLine2: HTMLSpanElement | undefined = $state();
	let scrollHint: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (prefersReducedMotion()) return;
		// 主标题两行依次浮现
		animate(titleLine1!, {
			opacity: [0, 1],
			translateY: [30, 0],
			duration: 850,
			easing: 'easeOutExpo'
		});
		animate(titleLine2!, {
			opacity: [0, 1],
			translateY: [30, 0],
			duration: 850,
			delay: 160,
			easing: 'easeOutExpo'
		});
		// CTA 按钮交错弹入
		const btns = document.querySelectorAll('.hero-cta');
		if (btns.length) {
			animate(btns, {
				opacity: [0, 1],
				translateY: [18, 0],
				duration: 620,
				delay: stagger(110, { start: 520 }),
				easing: 'easeOutCubic'
			});
		}
		// 滚动提示浮现
		if (scrollHint) {
			animate(scrollHint, { opacity: [0, 1], delay: 1300, duration: 600, easing: 'easeOutCubic' });
		}
	});
</script>

<Scene3D />

<!-- ══════════ 首屏 Hero：整屏电影海报 ══════════ -->
<section class="hero">
	<div class="hero-inner">
		<div class="hero-eyebrow" use:reveal>STRUCTVIS · 数据结构与数据库可视化学习工具</div>

		<h1 class="hero-title" aria-label="StructVis：看见数据结构与数据库的每一步跳动">
			<span class="hero-title-line" bind:this={titleLine1}>看见数据结构与数据库的</span><span
				class="hero-title-line hero-title-accent"
				bind:this={titleLine2}>每一步跳动</span
			>
		</h1>

		<p class="hero-sub" use:reveal={{ delay: 340 }}>
			把抽象的算法过程变成可步进、可交互、可试错的实时可视化练习——不靠老师，也能把每一步搞明白。
		</p>

		<div class="hero-actions">
			<a href={resolve('/catalog')} class="btn btn-accent hero-cta">进入课程目录</a>
			<a href={resolve('/progress')} class="btn btn-primary hero-cta">查看学习进度</a>
			<a href={resolve('/about')} class="btn btn-ghost hero-cta">了解项目</a>
		</div>
	</div>

	<div class="hero-scroll" bind:this={scrollHint} aria-hidden="true">
		<span>SCROLL</span>
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 5v14M5 12l7 7 7-7" />
		</svg>
	</div>
</section>

<!-- ══════════ 01 · 为什么它不一样 ══════════ -->
<section class="home-section">
	<div class="home-chapter" use:reveal>
		<span class="home-chapter-num" aria-hidden="true">01</span>
		<div>
			<span class="section-label">为什么它不一样</span>
			<h2 class="home-h2">把「看懂」变成「做对」</h2>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="card home-card" use:reveal={{ delay: 100 }}>
			<div class="mb-3 flex items-center gap-2">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					style="color: var(--color-accent);"
				>
					<polygon points="5 3 19 12 5 21 5 3" />
				</svg>
				<h3 class="text-base font-medium" style="color: var(--color-ink);">步进可视化</h3>
			</div>
			<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
				排序、树、图、SQL 每一步都能暂停、前进、后退，动画与伪代码同步高亮。
			</p>
		</div>

		<div class="card home-card" use:reveal={{ delay: 190 }}>
			<div class="mb-3 flex items-center gap-2">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					style="color: var(--color-success);"
				>
					<path d="M20 6 9 17l-5-5" />
				</svg>
				<h3 class="text-base font-medium" style="color: var(--color-ink);">即时练习反馈</h3>
			</div>
			<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
				边看边答，做错了立刻看到正确答案与解析，而不是只给一个分数。
			</p>
		</div>

		<div class="card home-card" use:reveal={{ delay: 280 }}>
			<div class="mb-3 flex items-center gap-2">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					style="color: var(--color-danger);"
				>
					<path d="M12 9v4M12 17h.01" />
					<circle cx="12" cy="12" r="9" />
				</svg>
				<h3 class="text-base font-medium" style="color: var(--color-ink);">错题本</h3>
			</div>
			<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
				答错的题自动进错题本，可重新作答、标记已掌握，复习不遗忘。
			</p>
		</div>

		<div class="card home-card" use:reveal={{ delay: 370 }}>
			<div class="mb-3 flex items-center gap-2">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					style="color: var(--color-academic);"
				>
					<path d="M12 20v-6M6 20V10M18 20V4" />
				</svg>
				<h3 class="text-base font-medium" style="color: var(--color-ink);">本地进度</h3>
			</div>
			<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
				掌握度、正确率、连续学习天数全部保存在本地浏览器，不上传任何服务器。
			</p>
		</div>
	</div>
</section>

<!-- ══════════ 02 · 学什么 ══════════ -->
<section class="home-section home-section--band">
	<div class="home-chapter" use:reveal>
		<span class="home-chapter-num" aria-hidden="true">02</span>
		<div>
			<span class="section-label">学什么</span>
			<h2 class="home-h2">两门课，{TOTAL_TOPICS} 个知识点</h2>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<a href={resolve('/catalog')} class="card home-course no-underline" use:reveal={{ delay: 160 }}>
			<div class="home-course-tag tag tag-blue">数据结构</div>
			<h3 class="mb-2 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
				数据结构与算法
			</h3>
			<p class="mb-4 text-sm" style="color: var(--color-ink-2);">
				李春葆《数据结构教程》第5版配套 · {dsTopics.length} 个知识点
			</p>
			<span class="home-course-meta">排序 · 树 · 图 · 查找</span>
		</a>

		<a href={resolve('/catalog')} class="card home-course no-underline" use:reveal={{ delay: 260 }}>
			<div class="home-course-tag tag tag-blue">MySQL</div>
			<h3 class="mb-2 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
				MySQL 数据库
			</h3>
			<p class="mb-4 text-sm" style="color: var(--color-ink-2);">
				杨宏霞《数据库技术及应用（MySQL）》配套 · {dbTopics.length} 个知识点
			</p>
			<span class="home-course-meta">查询 · 索引 · 事务 · 范式</span>
		</a>
	</div>
</section>

<!-- ══════════ 03 · 数据背后 ══════════ -->
<section class="home-section">
	<div class="home-chapter" use:reveal>
		<span class="home-chapter-num" aria-hidden="true">03</span>
		<div>
			<span class="section-label">数据背后</span>
			<h2 class="home-h2">每一帧都是可验证的</h2>
		</div>
	</div>

	<div class="home-stats">
		<div class="home-stat" use:reveal={{ delay: 120 }}>
			<div class="home-stat-num">{TOTAL_TOPICS}</div>
			<div class="home-stat-label">门课程</div>
		</div>
		<div class="home-stat" use:reveal={{ delay: 200 }}>
			<div class="home-stat-num">12</div>
			<div class="home-stat-label">类可视化渲染器</div>
		</div>
		<div class="home-stat" use:reveal={{ delay: 280 }}>
			<div class="home-stat-num">419</div>
			<div class="home-stat-label">项自动化测试</div>
		</div>
		<div class="home-stat" use:reveal={{ delay: 360 }}>
			<div class="home-stat-num">0</div>
			<div class="home-stat-label">台后端服务器</div>
		</div>
	</div>
</section>

<!-- Footer -->
<footer
	class="mt-12 flex items-center justify-between border-t pt-8 font-mono text-[11px] tracking-wider uppercase"
	style="border-color: var(--color-line-hair); color: var(--color-ink-3); letter-spacing: 0.08em; position: relative; z-index: 1;"
>
	<span>StructVis</span>
	<span>© 2026 zep4yrs</span>
</footer>

<style>
	/* === Hero === */
	.hero {
		position: relative;
		z-index: 1;
		min-height: calc(100vh - 48px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 72px 24px 64px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		max-width: 880px;
	}

	.hero-eyebrow {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--color-ink-3);
		margin-bottom: 28px;
	}

	.hero-title {
		font-family: var(--font-display);
		font-size: clamp(44px, 7vw, 84px);
		line-height: 1.08;
		letter-spacing: -0.03em;
		margin: 0 0 28px;
		color: var(--color-ink);
	}

	.hero-title-line {
		display: block;
	}

	.hero-title-accent {
		color: var(--color-accent);
	}

	.hero-sub {
		font-size: 17px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 620px;
		margin: 0 auto;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
		margin-top: 44px;
	}

	.hero-actions :global(.btn) {
		padding: 12px 28px;
		font-size: 15px;
	}

	.hero-scroll {
		position: absolute;
		bottom: 26px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.3em;
		color: var(--color-ink-3);
		animation: hero-float 2.4s ease-in-out infinite;
	}

	@keyframes hero-float {
		0%,
		100% {
			transform: translateX(-50%) translateY(0);
		}
		50% {
			transform: translateX(-50%) translateY(7px);
		}
	}

	/* === 内容分区 === */
	.home-section {
		position: relative;
		z-index: 1;
		max-width: 1080px;
		margin: 0 auto;
		padding: 96px 24px 24px;
	}

	.home-section--band {
		max-width: none;
		padding: 96px 24px;
		background: var(--color-subtle);
		border-top: 1px solid var(--color-line-hair);
		border-bottom: 1px solid var(--color-line-hair);
	}

	.home-section--band > :global(*) {
		max-width: 1080px;
		margin-left: auto;
		margin-right: auto;
	}

	/* 章节式页眉：大编号 + 标题组 */
	.home-chapter {
		display: flex;
		align-items: flex-end;
		gap: 28px;
		margin-bottom: 44px;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.home-chapter-num {
		font-family: var(--font-display);
		font-size: 56px;
		font-weight: 500;
		line-height: 0.9;
		letter-spacing: -0.03em;
		color: var(--color-ink-3);
		opacity: 0.55;
		user-select: none;
	}

	.home-h2 {
		font-family: var(--font-display);
		font-size: 34px;
		font-weight: 500;
		letter-spacing: -0.02em;
		margin: 8px 0 0;
		color: var(--color-ink);
	}

	/* 卡片 hover 反馈 */
	.home-card,
	.home-course {
		transition:
			transform 0.22s var(--ease-out),
			box-shadow 0.22s var(--ease-out),
			border-color 0.22s var(--ease-out);
	}

	.home-card:hover,
	.home-course:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 30px -14px rgb(0 0 0 / 0.22);
		border-color: var(--color-ink);
	}

	.home-card:active,
	.home-course:active {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px -6px rgb(0 0 0 / 0.18);
	}

	.home-course {
		position: relative;
		padding: 28px;
	}

	.home-course-tag {
		display: inline-block;
		margin-bottom: 14px;
	}

	.home-course-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	/* === 统计（数据碑） === */
	.home-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
	}

	.home-stat {
		text-align: center;
		padding: 12px 24px;
	}

	.home-stat + .home-stat {
		border-left: 1px solid var(--color-line-hair);
	}

	.home-stat-num {
		font-family: var(--font-display);
		font-size: 60px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--color-ink);
		background: linear-gradient(180deg, var(--color-ink), var(--color-ink-3));
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.home-stat-label {
		margin-top: 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.16em;
		color: var(--color-ink-3);
	}

	@media (max-width: 760px) {
		.home-stats {
			grid-template-columns: repeat(2, 1fr);
			row-gap: 36px;
		}

		.home-stat + .home-stat {
			border-left: none;
		}

		.home-chapter-num {
			font-size: 40px;
		}

		.home-h2 {
			font-size: 26px;
		}
	}
</style>
