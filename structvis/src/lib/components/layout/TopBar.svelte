<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';
	import { settings, toggleTheme } from '$lib/stores/settings';
	import { resolve } from '$app/paths';
	import SearchDialog from './SearchDialog.svelte';

	interface Props {
		crumb?: string;
		showSidebarBtn?: boolean;
		sidebarOpen?: boolean;
		onToggleSidebar?: () => void;
	}

	let { crumb, showSidebarBtn = false, sidebarOpen = false, onToggleSidebar }: Props = $props();

	const isDark = $derived($settings.theme === 'dark');

	let searchOpen = $state(false);

	// 快捷键：/ 或 Ctrl+K 打开搜索（输入框/文本域中不响应）
	$effect(() => {
		function onKeydown(e: KeyboardEvent) {
			const target = e.target as HTMLElement;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
			if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
				e.preventDefault();
				searchOpen = true;
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

<header
	class="flex h-12 items-center justify-between border-b px-6"
	style="border-color: var(--color-line-hair); background: var(--color-paper);"
>
	<div class="flex items-center gap-6">
		{#if showSidebarBtn}
			<button
				class="btn btn-ghost btn-icon-lg"
				style="color: {sidebarOpen ? 'var(--color-accent)' : 'var(--color-ink-2)'};"
				aria-label={sidebarOpen ? '隐藏导航' : '显示导航'}
				title={sidebarOpen ? '隐藏导航' : '显示导航'}
				onclick={onToggleSidebar}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<path d="M9 3v18" />
					<line x1="12" y1="8" x2="17" y2="8" />
					<line x1="12" y1="12" x2="17" y2="12" />
					<line x1="12" y1="16" x2="17" y2="16" />
				</svg>
			</button>
		{/if}
		<a href={resolve('/')} class="flex items-center gap-2 no-underline">
			<Logo size={28} />
			<span
				class="font-display text-lg font-medium"
				style="color: var(--color-ink); letter-spacing: -0.01em;"
			>
				StructVis
			</span>
			<span
				class="ml-1 inline-block h-1.5 w-1.5 rounded-full"
				style="background: var(--color-accent);"
			></span>
		</a>

		{#if crumb}
			<nav
				class="hidden font-mono text-xs tracking-wider uppercase md:block"
				style="color: var(--color-ink-3); letter-spacing: 0.08em;"
			>
				{#each crumb.split(' / ') as part, i (i)}
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
		<!-- 全站搜索 -->
		<button
			class="btn btn-ghost btn-icon"
			aria-label="搜索课程"
			title="搜索课程 (/)"
			onclick={() => (searchOpen = true)}
		>
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

		<!-- 主题切换（亮/暗） -->
		<button
			class="btn btn-ghost btn-icon"
			aria-label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
			title={isDark ? '切换到亮色主题' : '切换到暗色主题'}
			onclick={toggleTheme}
		>
			{#if isDark}
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="4" />
					<path
						d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
					/>
				</svg>
			{:else}
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			{/if}
		</button>

		<!-- 设置 -->
		<a
			href={resolve('/settings')}
			class="btn btn-ghost btn-icon"
			aria-label="设置"
			title="设置"
		>
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
					d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
			</svg>
		</a>
	</div>
</header>

<SearchDialog open={searchOpen} onClose={() => (searchOpen = false)} />
