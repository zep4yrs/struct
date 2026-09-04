<script lang="ts">
	/** 返回顶部：滚动超过一屏后浮现（长列表页用），玻璃胶囊风格 */
	let visible = $state(false);

	function onScroll() {
		visible = window.scrollY > window.innerHeight * 0.9;
	}

	function toTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:window onscroll={onScroll} />

{#if visible}
	<button class="back-top liquid" aria-label="返回顶部" onclick={toTop}>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<polyline points="18 15 12 9 6 15" />
		</svg>
	</button>
{/if}

<style>
	.back-top {
		position: fixed;
		right: 18px;
		bottom: calc(88px + env(safe-area-inset-bottom)); /* 避让底导胶囊 */
		z-index: 50;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		color: var(--color-ink-2);
		cursor: pointer;
		animation: backtop-in 220ms var(--ease-out);
	}

	.back-top svg {
		width: 20px;
		height: 20px;
	}

	@keyframes backtop-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back-top {
			animation: none;
		}
	}
</style>
