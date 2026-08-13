<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/utils/motion';

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
	<div class="section-header">
		<div class="section-label" use:reveal>
			<span class="section-num" class:badge={variant === 'badge'}>{sectionNum}</span>
			<span class="section-name">{sectionName}</span>
		</div>
		<h1 class="page-title" use:reveal={{ delay: 90 }}>{title}</h1>
		<!-- 包装在组件内声明，.page-desc 作用域才有效（snippet 内容属于父组件作用域） -->
		<p class="page-desc" use:reveal={{ delay: 180 }}>{@render desc()}</p>
	</div>

	<div class="player-wrap" use:reveal={{ delay: 270 }}>
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
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.section-label::before {
		content: '';
		width: 24px;
		height: 1px;
		background: var(--color-line-regular);
	}

	.section-num {
		color: var(--color-accent);
		font-weight: 500;
	}

	.section-num.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		background: var(--color-academic);
		color: #fff;
		font-size: 11px;
		font-weight: 600;
	}

	.section-name {
		font-weight: 500;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 500;
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin: 0 0 8px 0;
		color: var(--color-ink);
	}

	.page-desc {
		font-size: 14px;
		line-height: 1.7;
		color: var(--color-ink-2);
		max-width: 620px;
		margin: 0;
	}
</style>
