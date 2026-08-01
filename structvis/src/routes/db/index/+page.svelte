<script lang="ts">
	let title = '索引原理';
	let category = '索引与视图';
	let description = 'B+ 树结构、索引查找过程、执行计划分析。用动画理解为什么索引能加速查询。';
</script>

<div class="p-8 max-w-4xl mx-auto">
	<div class="section-label mb-4">{category}</div>
	<h1 class="font-display text-3xl font-medium mb-2" style="letter-spacing: -0.02em;">
		{title}
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2); max-width: 560px;">
		{description}
	</p>

	<div
		class="p-12 rounded-lg border text-center"
		style="border-color: var(--color-line-hair); background: var(--color-surface);"
	>
		<div class="font-mono text-sm mb-4" style="color: var(--color-ink-3);">
			PLANNED
		</div>
		<p class="mb-2" style="color: var(--color-ink-2);">
			{title}规划中
		</p>
		<p style="color: var(--color-ink-3); font-size: 13px;">
			先完成基础查询，再深入索引原理
		</p>
	</div>
</div>
