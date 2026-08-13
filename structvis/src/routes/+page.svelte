<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, stagger } from 'animejs';
	import Logo from '$lib/components/ui/Logo.svelte';
	import Scene3D from '$lib/components/ui/Scene3D.svelte';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
	import { reveal, prefersReducedMotion } from '$lib/utils/motion';

	const TITLE_LETTERS = ['S', 't', 'r', 'u', 'c', 't', 'V', 'i', 's', '/'];

	let titleEl: HTMLHeadingElement | undefined = $state();

	onMount(() => {
		if (prefersReducedMotion()) return;
		const letters = titleEl?.querySelectorAll('.letter');
		if (letters?.length) {
			animate(letters, {
				opacity: [0, 1],
				translateY: [22, 0],
				rotateX: [45, 0],
				duration: 750,
				delay: stagger(45),
				easing: 'easeOutExpo'
			});
		}
	});
</script>

<div class="mx-auto max-w-7xl px-8 py-16">
	<!-- Hero -->
	<section class="relative mb-20 border-b pb-16" style="border-color: var(--color-line-hair);">
		<Scene3D />
		<div class="relative" style="z-index: 1;">
			<div class="mb-10 flex items-end gap-6" use:reveal>
				<Logo size={56} />
				<h1
					bind:this={titleEl}
					aria-label="StructVis"
					class="font-display text-5xl leading-none font-medium"
					style="letter-spacing: -0.03em; color: var(--color-ink);"
				>
					{#each TITLE_LETTERS as letter, i (i)}
						<span class="letter" style="display: inline-block;">{letter}</span>
					{/each}
				</h1>
			</div>

			<p
				class="max-w-2xl font-display text-3xl font-normal"
				style="line-height: 1.3; color: var(--color-ink);"
				use:reveal={{ delay: 260 }}
			>
				看见数据结构与数据库的每一步跳动。
			</p>
			<p
				class="mt-4 max-w-xl text-lg"
				style="color: var(--color-ink-2); line-height: 1.7;"
				use:reveal={{ delay: 380 }}
			>
				StructVis 把抽象算法变成可步进、可交互、可试错的实时可视化练习，
				让自学者不靠老师也能把每个步骤搞明白。
			</p>

			<div class="mt-10 flex flex-wrap gap-3">
				<a href={resolve('/catalog')} class="btn btn-accent" use:reveal={{ delay: 500 }}
					>进入课程目录</a
				>
				<a href={resolve('/progress')} class="btn btn-primary" use:reveal={{ delay: 580 }}
					>查看学习进度</a
				>
				<a href={resolve('/about')} class="btn btn-ghost" use:reveal={{ delay: 660 }}>了解项目</a>
			</div>
		</div>
	</section>

	<!-- 核心功能 -->
	<section class="mb-20">
		<div class="section-label mb-6" use:reveal>Core Features</div>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="card" use:reveal={{ delay: 100 }}>
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
					<h2 class="text-base font-medium" style="color: var(--color-ink);">步进可视化</h2>
				</div>
				<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
					排序、树、图、SQL 每一步都能暂停、前进、后退，动画与伪代码同步高亮。
				</p>
			</div>

			<div class="card" use:reveal={{ delay: 200 }}>
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
					<h2 class="text-base font-medium" style="color: var(--color-ink);">即时练习反馈</h2>
				</div>
				<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
					边看边答，做错了立刻看到正确答案与解析，而不是只给一个分数。
				</p>
			</div>

			<div class="card" use:reveal={{ delay: 300 }}>
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
					<h2 class="text-base font-medium" style="color: var(--color-ink);">错题本</h2>
				</div>
				<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
					答错的题自动进错题本，可重新作答、标记已掌握，复习不遗忘。
				</p>
			</div>

			<div class="card" use:reveal={{ delay: 400 }}>
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
					<h2 class="text-base font-medium" style="color: var(--color-ink);">本地进度</h2>
				</div>
				<p class="text-xs" style="color: var(--color-ink-2); line-height: 1.7;">
					掌握度、答题正确率、连续学习天数全部保存在本地浏览器，不上传任何服务器。
				</p>
			</div>
		</div>
	</section>

	<!-- 两门课程 -->
	<section class="mb-20">
		<div class="section-label mb-6" use:reveal={{ delay: 100 }}>Courses</div>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<a
				href={resolve('/catalog')}
				class="card block no-underline"
				style="border-color: var(--color-line-hair);"
				use:reveal={{ delay: 200 }}
			>
				<h2 class="mb-2 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
					数据结构与算法
				</h2>
				<p class="mb-4 text-sm" style="color: var(--color-ink-2);">
					李春葆《数据结构教程》第5版配套 · {dsTopics.length} 个知识点
				</p>
				<span class="tag tag-blue">排序 · 树 · 图 · 查找</span>
			</a>

			<a
				href={resolve('/catalog')}
				class="card block no-underline"
				style="border-color: var(--color-line-hair);"
				use:reveal={{ delay: 300 }}
			>
				<h2 class="mb-2 font-display text-2xl font-medium" style="letter-spacing: -0.01em;">
					MySQL 数据库
				</h2>
				<p class="mb-4 text-sm" style="color: var(--color-ink-2);">
					杨宏霞《数据库技术及应用（MySQL）》配套 · {dbTopics.length} 个知识点
				</p>
				<span class="tag tag-blue">查询 · 索引 · 事务 · 范式</span>
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer
		class="mt-20 flex items-center justify-between border-t pt-8 font-mono text-[11px] tracking-wider uppercase"
		style="border-color: var(--color-line-hair); color: var(--color-ink-3); letter-spacing: 0.08em;"
	>
		<span>StructVis</span>
		<span>© 2026 zep4yrs</span>
	</footer>
</div>
