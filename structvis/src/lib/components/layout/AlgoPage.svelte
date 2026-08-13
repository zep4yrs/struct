<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		sectionNum: string;
		sectionName: string;
		title: string;
		/** 页面描述（渲染为 .page-desc 段） */
		desc: Snippet;
		/** 播放器区域内容 */
		children: Snippet;
		/** 变体：badge = 章节号圆形徽标（graph-storage 风格） */
		variant?: 'badge';
	}

	let { sectionNum, sectionName, title, desc, children, variant }: Props = $props();
</script>

<div class="page">
	<div class="section-header page-rise">
		<!-- 页眉行：装订线章节号 + 章节名 + 细线 -->
		<div class="section-label">
			<span class="section-num" class:badge={variant === 'badge'}>{sectionNum}</span>
			<span class="section-name">{sectionName}</span>
			<span class="label-line" aria-hidden="true"></span>
		</div>
		<h1 class="page-title">{title}</h1>
		<!-- 包装在组件内声明，.page-desc 作用域才有效（snippet 内容属于父组件作用域） -->
		<p class="page-desc">{@render desc()}</p>
	</div>

	<div class="player-wrap page-rise" style="animation-delay: 80ms;">
		{@render children()}
	</div>
</div>

<style>
	.page {
		max-width: min(1440px, 100%);
		margin: 0 auto;
		padding: 48px 32px 64px;
		min-height: calc(100vh - 48px);
		display: flex;
		flex-direction: column;
	}

	.player-wrap {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 32px;
		margin-bottom: 32px;
	}

	.section-header {
		margin-bottom: 32px;
	}

	.section-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
		margin-bottom: 14px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	/* 装订线章节号：琥珀竖线 + § 号（教科书页边标记） */
	.section-num {
		position: relative;
		padding-left: 10px;
		color: var(--color-accent);
		font-weight: 600;
	}

	.section-num::before {
		content: '';
		position: absolute;
		left: 0;
		top: 1px;
		bottom: 1px;
		width: 3px;
		background: var(--color-accent);
		border-radius: 2px;
	}

	.section-num.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding-left: 0;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-sm);
		background: var(--color-academic);
		color: var(--color-ink-inverse);
		font-size: 11px;
		font-weight: 600;
	}

	.section-num.badge::before {
		display: none;
	}

	.section-name {
		font-weight: 500;
		color: var(--color-ink-2);
	}

	/* 页眉延展线：章节名右侧点线（像目录引导线） */
	.label-line {
		flex: 1;
		max-width: 160px;
		border-bottom: 1px dotted var(--color-line-regular);
		transform: translateY(-2px);
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 34px;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.01em;
		margin: 0 0 10px 0;
		color: var(--color-ink);
	}

	/* 标题下教科书双线 */
	.page-title::after {
		content: '';
		display: block;
		width: 64px;
		height: 3px;
		margin-top: 12px;
		border-top: 2px solid var(--color-ink);
		border-bottom: 1px solid var(--color-ink);
		border-radius: 1px;
	}

	.page-desc {
		font-size: 14px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 640px;
		margin: 14px 0 0;
	}
</style>
