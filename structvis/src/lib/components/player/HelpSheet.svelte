<script module lang="ts">
	function prefersReduced(): boolean {
		return (
			typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { eases } from 'animejs';
	const expoOut = eases.outExpo;

	/** 功能速查面板（Story-1 / audit-12）：? 按钮唤起，移动端唯一的功能说明通道 */
	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();
	let cardEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (open) {
			tick().then(() => cardEl?.focus());
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		}
	}

	const FEATURES = [
		['演示数据', '切换内置示例数据集，观察不同输入下的执行过程'],
		['自定义', '输入你自己的数据（如 9,4,6,2），播放器用它重建动画'],
		['分享', '复制链接，打开即恢复当前输入、步数与速度'],
		['动手', '先预测再验证：点击画布上的两个元素回答下一步的交换'],
		['投影', '全屏讲授模式：←→ 步进、空格播放、Esc 退出'],
		['剧本', '导入 / 导出每一步的讲解旁白，适合备课'],
		['演示 / 练习', '练习模式在关键步骤弹题，答错立刻给正确答案与解析']
	];

	const KEYS = [
		['/ 或 Ctrl+K', '全站搜索课程'],
		['→ / ←', '下一步 / 上一步'],
		['空格', '播放 / 暂停'],
		['Home / End', '回到开头 / 跳到最后'],
		['Esc', '关闭弹窗 / 退出投影']
	];
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="hs-root">
		<button
			class="hs-overlay"
			aria-label="关闭功能速查"
			onclick={onClose}
			transition:fade={{ duration: 150 }}
		></button>
		<div
			class="hs-card"
			role="dialog"
			aria-modal="true"
			aria-label="功能速查"
			tabindex="-1"
			bind:this={cardEl}
			transition:fly={{
				y: prefersReduced() ? 0 : 12,
				duration: prefersReduced() ? 0 : 220,
				easing: expoOut
			}}
		>
			<header class="hs-header">
				<span class="hs-title">功能速查</span>
				<button class="hs-close" aria-label="关闭" onclick={onClose}>✕</button>
			</header>

			<div class="hs-body">
				<p class="hs-section">操作区</p>
				<ul class="hs-list">
					{#each FEATURES as [name, desc] (name)}
						<li><b>{name}</b><span>{desc}</span></li>
					{/each}
				</ul>

				<p class="hs-section">键盘快捷键</p>
				<ul class="hs-list hs-keys">
					{#each KEYS as [k, desc] (k)}
						<li><kbd>{k}</kbd><span>{desc}</span></li>
					{/each}
				</ul>
			</div>

			<footer class="hs-footer">随时点播放器右上角的 ? 再次打开本速查</footer>
		</div>
	</div>
{/if}

<style>
	.hs-root {
		position: fixed;
		inset: 0;
		z-index: 85;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.hs-overlay {
		position: fixed;
		inset: 0;
		border: none;
		padding: 0;
		background: var(--color-scrim);
		cursor: default;
	}

	.hs-card {
		position: relative;
		z-index: 86;
		width: min(460px, 100%);
		max-height: min(600px, calc(100vh - 48px));
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-lg);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.08),
			0 16px 48px rgba(0, 0, 0, 0.14);
		outline: none;
	}

	.hs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.hs-title {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-2);
	}

	.hs-close {
		border: none;
		background: transparent;
		color: var(--color-ink-2);
		font-size: 13px;
		cursor: pointer;
		padding: 4px 6px;
		border-radius: 4px;
	}

	.hs-close:hover {
		color: var(--color-ink);
	}

	.hs-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 14px 18px;
	}

	.hs-section {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-2);
		margin: 10px 0 8px;
	}

	.hs-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.hs-list li {
		display: flex;
		gap: 10px;
		font-size: 13px;
		line-height: 1.55;
		color: var(--color-ink-2);
	}

	.hs-list b {
		flex-shrink: 0;
		color: var(--color-accent-text);
		font-weight: 600;
		min-width: 72px;
	}

	.hs-keys kbd {
		flex-shrink: 0;
		min-width: 88px;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 1px 6px;
		border: 1px solid var(--color-line-regular);
		border-bottom-width: 2px;
		border-radius: 4px;
		color: var(--color-ink);
		height: fit-content;
	}

	.hs-footer {
		padding: 10px 18px;
		border-top: 1px solid var(--color-line-hair);
		font-size: 11px;
		color: var(--color-ink-2);
	}
</style>
