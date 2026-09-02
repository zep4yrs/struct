<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, stagger, spring } from 'animejs';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics, TOPIC_ALIASES } from '$lib/content/topics';
	import { QUIZ_BANK } from '$lib/content/quiz-bank';
	import { reveal, revealOnScroll, prefersReducedMotion } from '$lib/utils/motion';
	import SplashOverlay from '$lib/components/splash/SplashOverlay.svelte';

	const topicTotal = dsTopics.length + dbTopics.length;
	// 别名组数从搜索别名单源派生（避免文案硬编码漂移）
	const aliasCount = Object.keys(TOPIC_ALIASES).length;

	let titleLine1: HTMLSpanElement | undefined = $state();
	let titleLine2: HTMLSpanElement | undefined = $state();
	let scrollHint: HTMLDivElement | undefined = $state();
	let splashDone = $state(false);

	function heroPlay() {
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
	}

	// 开屏播完（或被跳过/门控跳过）后再启动 hero 入场动画，避免动画在开屏下空转
	$effect(() => {
		if (splashDone) heroPlay();
	});

	onMount(() => {
		// hero 入场改为等开屏完成；若开屏已门控跳过，splashDone 会立刻为 true
	});
</script>

<!-- ══════════ 开屏动画（首次访问，可跳过/设置关闭） ══════════ -->
<SplashOverlay onfinished={() => (splashDone = true)} />

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
			把抽象的算法与 SQL 过程，变成可步进、可交互、可试错的实时可视化练习——SQL
			语句本地执行，数据绝不离开浏览器。
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
		<span class="home-chapter-num" aria-hidden="true" use:revealOnScroll={{ loop: 'breathe' }}
			>01</span
		>
		<div>
			<span class="section-label" use:revealOnScroll={{ delay: 40 }}>为什么它不一样</span>
			<h2 class="home-h2" use:revealOnScroll={{ delay: 80, split: true }}>
				把「看懂」变成「做对」
			</h2>
		</div>
	</div>

	<div class="home-features">
		<div class="home-feature" use:revealOnScroll={{ delay: 120, loop: 'float' }}>
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

		<div class="home-feature" use:revealOnScroll={{ delay: 210, loop: 'float' }}>
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

		<div class="home-feature" use:revealOnScroll={{ delay: 300, loop: 'float' }}>
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

		<div class="home-feature" use:revealOnScroll={{ delay: 390, loop: 'float' }}>
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

		<a
			href={resolve('/progress')}
			class="home-feature no-underline"
			use:revealOnScroll={{ delay: 480, loop: 'float' }}
		>
			<span class="home-feature-num">05</span>
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
					><rect x="3" y="4" width="18" height="17" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"
					></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="16" y1="2" x2="16" y2="6"
					></line></svg
				>
				<h3 class="home-feature-title">每日一题</h3>
			</div>
			<p>每天一道核心题，答对点亮今日章节；连续天数不中断，复习不遗忘。</p>
		</a>

		<a
			href={resolve('/catalog')}
			class="home-feature no-underline"
			use:revealOnScroll={{ delay: 570, loop: 'float' }}
		>
			<span class="home-feature-num">06</span>
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
					><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.5" y2="16.5"
					></line></svg
				>
				<h3 class="home-feature-title">全局搜索</h3>
			</div>
			<p>Ctrl+K 一键直达任意知识点——{topicTotal} 个主题 + {aliasCount} 组惯用别名。</p>
		</a>
	</div>
</section>

<!-- ══════════ 02 · 学完之后：检验与竞技 ══════════ -->
<section class="home-section">
	<div class="home-chapter">
		<span class="home-chapter-num" aria-hidden="true" use:revealOnScroll={{ loop: 'breathe' }}
			>02</span
		>
		<div>
			<span class="section-label" use:revealOnScroll={{ delay: 40 }}>学完之后</span>
			<h2 class="home-h2" use:revealOnScroll={{ delay: 80, split: true }}>检验、竞技与复盘</h2>
		</div>
	</div>

	<div class="home-tools">
		<a
			href={resolve('/progress')}
			class="home-tool no-underline"
			use:revealOnScroll={{ delay: 120, loop: 'float' }}
		>
			<span class="home-tool-num">01</span>
			<h3 class="home-tool-title">学习进度</h3>
			<p>每日一题、连续天数与掌握度热力图——全部保存在本地浏览器。</p>
			<span class="home-tool-meta">看进度 →</span>
		</a>

		<a
			href={resolve('/quiz')}
			class="home-tool no-underline"
			use:revealOnScroll={{ delay: 200, loop: 'float' }}
		>
			<span class="home-tool-num">02</span>
			<h3 class="home-tool-title">章节自测</h3>
			<p>{QUIZ_BANK.length} 道题库按章随机抽题，5 分钟限时，成绩直接写回掌握度。</p>
			<span class="home-tool-meta">去自测 →</span>
		</a>

		<a
			href={resolve('/race')}
			class="home-tool no-underline"
			use:revealOnScroll={{ delay: 200, loop: 'float' }}
		>
			<span class="home-tool-num">03</span>
			<h3 class="home-tool-title">竞速实验室</h3>
			<p>30 个排序引擎同屏竞速——21 条经典跑道对垒 9 条玩梗跑道，复杂度一目了然。</p>
			<span class="home-tool-meta">开赛 →</span>
		</a>

		<a
			href={resolve('/map')}
			class="home-tool no-underline"
			use:revealOnScroll={{ delay: 280, loop: 'float' }}
		>
			<span class="home-tool-num">04</span>
			<h3 class="home-tool-title">技能图谱</h3>
			<p>{topicTotal} 个知识点的前置依赖网络，看清「先学什么、再去哪里」。</p>
			<span class="home-tool-meta">看图谱 →</span>
		</a>

		<a
			href={resolve('/report')}
			class="home-tool no-underline"
			use:revealOnScroll={{ delay: 360, loop: 'float' }}
		>
			<span class="home-tool-num">05</span>
			<h3 class="home-tool-title">学习报告</h3>
			<p>掌握度雷达、热力图与错题分布，一键生成可分享的阶段总结。</p>
			<span class="home-tool-meta">生成报告 →</span>
		</a>
	</div>
</section>

<!-- ══════════ 03 · 学什么 ══════════ -->
<section class="home-section">
	<div class="home-chapter">
		<span class="home-chapter-num" aria-hidden="true" use:revealOnScroll={{ loop: 'breathe' }}
			>03</span
		>
		<div>
			<span class="section-label" use:revealOnScroll={{ delay: 40 }}>学什么</span>
			<h2 class="home-h2" use:revealOnScroll={{ delay: 80, split: true }}>
				两门课，{topicTotal} 个知识点
			</h2>
		</div>
	</div>

	<div class="home-courses">
		<a
			href={resolve('/catalog')}
			class="home-course no-underline"
			use:revealOnScroll={{ delay: 160, loop: 'float' }}
		>
			<div class="home-course-tag tag tag-blue">数据结构</div>
			<h3 class="home-course-title">
				数据结构与算法<span class="home-course-count">{dsTopics.length} 知识点</span>
			</h3>
			<p>李春葆《数据结构教程》第5版配套 · {dsTopics.length} 个知识点</p>
			<span class="home-course-meta">排序 · 树 · 图 · 查找</span>
		</a>

		<a
			href={resolve('/catalog')}
			class="home-course no-underline"
			use:revealOnScroll={{ delay: 260, loop: 'float' }}
		>
			<div class="home-course-tag tag tag-blue">MySQL</div>
			<h3 class="home-course-title">
				MySQL 数据库<span class="home-course-count">{dbTopics.length} 知识点</span>
			</h3>
			<p>杨宏霞《数据库技术及应用（MySQL）》配套 · {dbTopics.length} 个知识点</p>
			<span class="home-course-meta">查询 · 索引 · 事务 · 范式</span>
		</a>
	</div>
</section>

<!-- ══════════ 04 · 上课时 ══════════ -->
<section class="home-section">
	<div class="home-chapter">
		<span class="home-chapter-num" aria-hidden="true" use:revealOnScroll={{ loop: 'breathe' }}
			>04</span
		>
		<div>
			<span class="section-label" use:revealOnScroll={{ delay: 40 }}>上课时</span>
			<h2 class="home-h2" use:revealOnScroll={{ delay: 80, split: true }}>看得懂，更要上手拆</h2>
		</div>
	</div>

	<div class="home-features">
		<div class="home-feature" use:revealOnScroll={{ delay: 120, loop: 'float' }}>
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
					><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"
					></polyline></svg
				>
				<h3 class="home-feature-title">伪代码同步高亮</h3>
			</div>
			<p>动画走到哪一行，伪代码亮到哪一行；点高亮行也能反跳动画。</p>
		</div>

		<div class="home-feature" use:revealOnScroll={{ delay: 210, loop: 'float' }}>
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
					><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"
					></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"
					></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"
					></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"
					></line><line x1="17" y1="16" x2="23" y2="16"></line></svg
				>
				<h3 class="home-feature-title">自定义数据</h3>
			</div>
			<p>输入自己的数组、字符串或二叉树，动画与结果立刻重演，亲手验证直觉。</p>
		</div>

		<div class="home-feature" use:revealOnScroll={{ delay: 300, loop: 'float' }}>
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
					><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path
						d="M18.5 5.5a9 9 0 0 1 0 13"
					></path></svg
				>
				<h3 class="home-feature-title">朗读与快捷键</h3>
			</div>
			<p>空格播放、←→ 步进、Home/End 跳转、? 唤起速查——全程支持语音朗读。</p>
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
		grid-template-columns: repeat(3, 1fr);
	}

	.home-feature:nth-child(3n + 1) {
		border-left: none;
	}

	.home-feature:nth-child(n + 4) {
		border-top: 1px solid var(--color-line-hair);
		padding-top: 28px;
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

	.home-course-count {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		color: var(--color-ink-2);
		border: 1px solid var(--color-line-regular);
		padding: 3px 10px;
		border-radius: 999px;
		margin-left: 12px;
		vertical-align: middle;
		white-space: nowrap;
	}

	.home-course-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	/* === 碑式工具入口（学完之后） === */
	.home-tools {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
	}

	.home-tool:nth-child(5n + 1) {
		border-left: none;
	}

	.home-tool:nth-child(n + 6) {
		border-top: 1px solid var(--color-line-hair);
		padding-top: 28px;
	}

	.home-tool {
		display: block;
		padding: 8px 28px;
		transition: background 0.2s var(--ease-out);
	}

	.home-tool + .home-tool {
		border-left: 1px solid var(--color-line-hair);
	}

	.home-tool:hover {
		background: var(--color-subtle);
	}

	.home-tool-num {
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.2em;
		color: var(--color-ink-3);
		margin-bottom: 18px;
	}

	.home-tool-title {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.01em;
		margin: 0 0 10px;
		color: var(--color-ink);
		transition: color 0.2s var(--ease-out);
	}

	.home-tool:hover .home-tool-title {
		color: var(--color-accent-text);
	}

	.home-tool p {
		font-size: 13px;
		line-height: 1.8;
		color: var(--color-ink-2);
		margin-bottom: 14px;
	}

	.home-tool-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		color: var(--color-accent-text);
	}

	@media (max-width: 760px) {
		.home-features,
		.home-courses,
		.home-tools {
			grid-template-columns: 1fr;
			gap: 36px;
		}

		.home-feature + .home-feature,
		.home-course + .home-course,
		.home-tool + .home-tool {
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
