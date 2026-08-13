<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';
	import { resolve } from '$app/paths';
	import { dsTopics, dbTopics } from '$lib/content/topics';
</script>

<div class="mx-auto max-w-7xl px-8 py-16">
	<!-- Hero：教科书扉页 -->
	<section class="mb-20 border-b pb-16 page-rise" style="border-color: var(--color-line-hair);">
		<div class="mb-8 flex items-end gap-6">
			<Logo size={60} />
			<h1
				class="font-display text-6xl leading-none font-semibold"
				style="letter-spacing: -0.02em; color: var(--color-ink);"
			>
				StructVis<span style="color: var(--color-accent); font-weight: 400;">/</span>
			</h1>
		</div>

		<p
			class="font-display max-w-2xl text-3xl font-medium"
			style="line-height: 1.35; color: var(--color-ink);"
		>
			看见数据结构与数据库的每一步跳动。
		</p>
		<p class="mt-4 max-w-xl text-base" style="color: var(--color-ink-2); line-height: 1.8;">
			StructVis 把抽象算法变成可步进、可交互、可试错的实时可视化练习，
			让自学者不靠老师也能把每个步骤搞明白。
		</p>

		<hr class="section-rule" style="max-width: 420px;" />

		<div class="mt-6 flex flex-wrap gap-3">
			<a href={resolve('/catalog')} class="btn btn-accent">进入课程目录</a>
			<a href={resolve('/progress')} class="btn btn-primary">查看学习进度</a>
			<a href={resolve('/about')} class="btn btn-ghost">了解项目</a>
		</div>
	</section>

	<!-- 核心功能 -->
	<section class="mb-20">
		<div class="section-label mb-6">Core Features</div>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="card card-note page-rise" style="animation-delay: 100ms;">
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

			<div class="card card-note page-rise" style="animation-delay: 200ms;">
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

			<div class="card card-note page-rise" style="animation-delay: 300ms;">
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

			<div class="card">
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
		<div class="section-label mb-6">Courses</div>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<a
				href={resolve('/catalog')}
				class="card card-note page-rise block no-underline"
				style="border-color: var(--color-line-hair); animation-delay: 400ms;"
			>
				<h2 class="font-display mb-2 text-2xl font-medium" style="letter-spacing: -0.01em;">
					数据结构与算法
				</h2>
				<p class="mb-4 text-sm" style="color: var(--color-ink-2);">
					李春葆《数据结构教程》第5版配套 · {dsTopics.length} 个知识点
				</p>
				<span class="tag tag-blue">排序 · 树 · 图 · 查找</span>
			</a>

			<a
				href={resolve('/catalog')}
				class="card card-note page-rise block no-underline"
				style="border-color: var(--color-line-hair); animation-delay: 480ms;"
			>
				<h2 class="font-display mb-2 text-2xl font-medium" style="letter-spacing: -0.01em;">
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
