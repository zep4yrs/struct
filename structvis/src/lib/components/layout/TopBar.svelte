<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';

	interface Props {
		crumb?: string;
	}

	let { crumb }: Props = $props();
</script>

<header
	class="h-12 px-6 flex items-center justify-between border-b"
	style="border-color: var(--color-line-hair); background: var(--color-paper);"
>
	<div class="flex items-center gap-6">
		<a href="/" class="flex items-center gap-2 no-underline">
			<Logo size={28} />
			<span
				class="font-display text-lg font-medium"
				style="color: var(--color-ink); letter-spacing: -0.01em;"
			>
				StructVis
			</span>
			<span
				class="inline-block w-1.5 h-1.5 rounded-full ml-1"
				style="background: var(--color-accent);"
			></span>
		</a>

		{#if crumb}
			<nav
				class="text-xs font-mono uppercase tracking-wider hidden md:block"
				style="color: var(--color-ink-3); letter-spacing: 0.08em;"
			>
				{#each crumb.split(' / ') as part, i}
					{#if part.startsWith('[current]') && part.endsWith('[/current]')}
						<span style="color: var(--color-ink); font-weight: 500;">
							{part.slice(9, -10)}
						</span>
					{:else}
						{part}
					{/if}
					{#if i < crumb.split(' / ').length - 1}
						<span style="margin: 0 0.5em;">/</span>
					{/if}
				{/each}
			</nav>
		{/if}
	</div>

	<div class="flex items-center gap-3">
		<!-- 搜索入口（占位，v0.2 做） -->
		<button class="btn btn-ghost btn-icon" aria-label="搜索">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
		</button>

		<!-- 设置入口 -->
		<button class="btn btn-ghost btn-icon" aria-label="设置">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="3" />
				<path
					d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
				/>
			</svg>
		</button>
	</div>
</header>
