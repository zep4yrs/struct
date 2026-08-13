<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, stagger, spring } from 'animejs';
	import Scene3D from '$lib/components/ui/Scene3D.svelte';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import { reveal, revealOnScroll, prefersReducedMotion } from '$lib/utils/motion';

	let titleLine1: HTMLSpanElement | undefined = $state();
	let titleLine2: HTMLSpanElement | undefined = $state();
	let scrollHint: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (prefersReducedMotion()) return;
		const s = spring({ stiffness: 170, damping: 19 });
		// hero 时间线编排：两行标题依次浮现（弹簧），CTA 交错弹入，滚动提示最后
		animate(titleLine1!, { opacity: [0, 1], translateY: [34, 0], duration: 900, ease: s });
		animate(titleLine2!, {
			opacity: [0, 1],
			translateY: [34, 0],
			duration: 900,
			delay: 170,
			ease: s
		});
		const btns = document.querySelectorAll('.hero-cta');
		if (btns.length) {
			animate(btns, {
				opacity: [0, 1],
				translateY: [20, 0],
				duration: 700,
				delay: stagger(120, { start: 540 }),
				ease: s
			});
		}
		if (scrollHint) {
			animate(scrollHint, { opacity: [0, 1], delay: 1250, duration: 500, ease: 'easeOutQuad' });
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

		<p class="hero-sub" use:reveal={{ delay: 380 }}>
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
	<div class="home-chapter">
		<span class="home-chapter-num" aria-hidden="true" use:revealOnScroll>01</span>
		<div>
			<span class="section-label" use:revealOnScroll={{ delay: 40 }}>为什么它不一样</span>
			<h2 class="home-h2" use:revealOnScroll={{ delay: 80, split: true }}>
				把「看懂」变成「做对」
			</h2>
		</div>
	</div>

	<div class="home-features">
		<div class="home-feature" use:revealOnScroll={{ delay: 120 }}>
			<span class="home-feature-num">01</span>
			<div class="home-feature-head">
				<svg
					width="22"
					height="22"
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
				<h3 class="home-feature-title">步进可视化</h3>
			</div>
			<p>排序、树、图、SQL 每一步都能暂停、前进、后退，动画与伪代码同步高亮。</p>
		</div>

		<div class="home-feature" use:revealOnScroll={{ delay: 210 }}>
			<span class="home-feature-num">02</span>
			<div class="home-feature-head">
				<svg
					width="22"
					height="22"
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
				<h3 class="home-feature-title">即时练习反馈</h3>
			</div>
			<p>边看边答，做错了立刻看到正确答案与解析，而不是只给一个分数。</p>
		</div>

		<div class="home-feature" use:revealOnScroll={{ delay: 300 }}>
			<span class="home-feature-num">03</span>
			<div class="home-feature-head">
				<svg
					width="22"
					height="22"
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
				<h3 class="home-feature-title">错题本</h3>
			</div>
			<p>答错的题自动进错题本，可重新作答、标记已掌握，复习不遗忘。</p>
		</div>

		<div class="home-feature" use:revealOnScroll={{ delay: 390 }}>
			<span class="home-feature-num">04</span>
			<div class="home-feature-head">
				<svg
					width="22"
					height="22"
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
				<h3 class="home-feature-title">本地进度</h3>
			</div>
			<p>掌握度、正确率、连续学习天数全部保存在本地浏览器，不上传任何服务器。</p>
		</div>
	</div>
</section>

<!-- ══════════ 02 · 学什么 ══════════ -->
<section class="home-section home-section--band">
	<div class="home-chapter">
		<span class="home-chapter-num" aria-hidden="true" use:revealOnScroll>02</span>
		<div>
			<span class="section-label" use:revealOnScroll={{ delay: 40 }}>学什么</span>
			<h2 class="home-h2" use:revealOnScroll={{ delay: 80, split: true }}>
				两门课，{dsTopics.length + dbTopics.length} 个知识点
			</h2>
		</div>
	</div>

	<div class="home-courses">
		<a
			href={resolve('/catalog')}
			class="home-course no-underline"
			use:revealOnScroll={{ delay: 160 }}
		>
			<div class="home-course-tag tag tag-blue">数据结构</div>
			<h3 class="home-course-title">数据结构与算法</h3>
			<p>李春葆《数据结构教程》第5版配套 · {dsTopics.length} 个知识点</p>
			<span class="home-course-meta">排序 · 树 · 图 · 查找</span>
		</a>

		<a
			href={resolve('/catalog')}
			class="home-course no-underline"
			use:revealOnScroll={{ delay: 260 }}
		>
			<div class="home-course-tag tag tag-blue">MySQL</div>
			<h3 class="home-course-title">MySQL 数据库</h3>
			<p>杨宏霞《数据库技术及应用（MySQL）》配套 · {dbTopics.length} 个知识点</p>
			<span class="home-course-meta">查询 · 索引 · 事务 · 范式</span>
		</a>
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

	/* === 碑式特性（无框，列分隔线） === */
	.home-features {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
	}

	.home-feature {
		padding: 8px 28px;
	}

	.home-feature + .home-feature {
		border-left: 1px solid var(--color-line-hair);
	}

	.home-feature-num {
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.2em;
		color: var(--color-ink-3);
		margin-bottom: 18px;
	}

	.home-feature-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.home-feature-title {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.01em;
		margin: 0;
		color: var(--color-ink);
	}

	.home-feature p {
		font-size: 13px;
		line-height: 1.8;
		color: var(--color-ink-2);
	}

	/* === 碑式课程（无框，列分隔线） === */
	.home-courses {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
	}

	.home-course {
		display: block;
		padding: 12px 36px 12px 0;
	}

	.home-course + .home-course {
		border-left: 1px solid var(--color-line-hair);
		padding-left: 36px;
	}

	.home-course-title {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 500;
		letter-spacing: -0.01em;
		margin: 0 0 12px;
		color: var(--color-ink);
		transition: color 0.2s var(--ease-out);
	}

	.home-course p {
		font-size: 14px;
		line-height: 1.7;
		color: var(--color-ink-2);
		margin: 0 0 14px;
	}

	.home-course-tag {
		display: inline-block;
		margin-bottom: 16px;
	}

	.home-course:hover .home-course-title {
		color: var(--color-accent);
	}

	.home-course-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	@media (max-width: 760px) {
		.home-features,
		.home-courses {
			grid-template-columns: 1fr;
			gap: 36px;
		}

		.home-feature + .home-feature,
		.home-course + .home-course {
			border-left: none;
			border-top: 1px solid var(--color-line-hair);
			padding-top: 28px;
			padding-left: 0;
		}

		.home-chapter-num {
			font-size: 40px;
		}

		.home-h2 {
			font-size: 26px;
		}
	}
</style>
