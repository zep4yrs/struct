<script lang="ts">
	let title = '建表练习';
	let category = '数据库和表';
	let description = 'CREATE TABLE、数据类型、约束。给出需求，你写建表语句，即时校验结果。';
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
			WORK IN PROGRESS
		</div>
		<p class="mb-2" style="color: var(--color-ink-2);">
			{title}正在开发中
		</p>
		<p style="color: var(--color-ink-3); font-size: 13px;">
			即将支持：即时校验 · 错误提示 · MySQL 方言
		</p>
	</div>
</div>
