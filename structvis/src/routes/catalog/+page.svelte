<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';
	import TopicGrid from '$lib/components/ui/TopicGrid.svelte';
	import { dsTopics, dbTopics } from '$lib/content/topics';
</script>

<div class="mx-auto max-w-7xl px-8 py-16">
	<!-- 目录头 -->
	<section class="mb-20 border-b pb-12" style="border-color: var(--color-line-hair);">
		<div class="mb-8 flex items-end gap-6">
			<Logo size={56} />
			<h1
				class="font-display text-5xl leading-none font-medium"
				style="letter-spacing: -0.03em; color: var(--color-ink);"
			>
				课程目录<span style="color: var(--color-accent); font-weight: 400;">/</span>
			</h1>
		</div>

		<p
			class="font-display max-w-xl text-2xl font-normal italic"
			style="line-height: 1.35; color: var(--color-ink-2);"
		>
			看见数据结构与数据库的每一步跳动。<br />
			<span style="font-size: 0.8em; opacity: 0.6;">
				See every step of data structures &amp; databases, clearly.
			</span>
		</p>
	</section>

	<!-- 数据结构 -->
	<section class="mb-16">
		<div class="section-label mb-4">数据结构 · 李春葆《数据结构教程》第5版</div>
		<h2 class="font-display mb-6 text-2xl font-medium" style="letter-spacing: -0.01em;">
			数据结构与算法
		</h2>

		<TopicGrid topics={dsTopics} />
	</section>

	<!-- 数据库 -->
	<section>
		<div class="section-label mb-4">数据库 · 杨宏霞《数据库技术及应用（MySQL）》</div>
		<h2 class="font-display mb-6 text-2xl font-medium" style="letter-spacing: -0.01em;">
			MySQL 数据库
		</h2>

		<TopicGrid topics={dbTopics} />
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
