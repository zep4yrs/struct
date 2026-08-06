<script lang="ts">
	import { tick } from 'svelte';
	import { base } from '$app/paths';
	import { dsTopics, dbTopics, type TopicCard } from '$lib/content/topics';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	type SearchItem = TopicCard & { group: string };

	const allItems: SearchItem[] = [
		...dsTopics.map((t) => ({ ...t, group: '数据结构' })),
		...dbTopics.map((t) => ({ ...t, group: 'MySQL 数据库' }))
	];

	let query = $state('');
	let selected = $state(0);
	let inputRef: HTMLInputElement | undefined = $state();

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (q.length === 0) return [];
		return allItems.filter((t) => (t.title + ' ' + t.description).toLowerCase().includes(q));
	});

	function reset() {
		query = '';
		selected = 0;
	}

	function close() {
		reset();
		onClose();
	}

	function go(item: SearchItem) {
		if (item.planned) return;
		reset();
		onClose();
		window.location.href = base + item.href;
	}

	function move(delta: number) {
		const n = results.length;
		if (n === 0) return;
		selected = (selected + delta + n) % n;
	}

	$effect(() => {
		if (open) {
			tick().then(() => inputRef?.focus());
		}
	});

	$effect(() => {
		if (!open) return;
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.preventDefault();
				close();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				move(1);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				move(-1);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const item = results[selected];
				if (item) go(item);
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

{#if open}
	<div class="search-root">
		<button class="search-overlay" aria-label="关闭搜索" onclick={close}></button>
		<div class="search-card" role="dialog" aria-modal="true" aria-label="搜索课程">
			<div class="search-head">
				<svg
					class="search-icon"
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
				<input
					bind:this={inputRef}
					class="search-input"
					type="text"
					bind:value={query}
					placeholder="搜索课程，如：排序、二叉树、索引"
					aria-label="搜索关键词"
					autocomplete="off"
					spellcheck="false"
				/>
				<button class="search-close" aria-label="关闭搜索" onclick={close}>Esc</button>
			</div>

			<div class="search-body">
				{#if query.trim().length === 0}
					<div class="search-hint">输入关键词，在全部课程中查找</div>
				{:else if results.length === 0}
					<div class="search-empty">没有找到与 “{query.trim()}” 匹配的课程</div>
				{:else}
					<ul class="search-list" role="listbox" aria-label="搜索结果">
						{#each results as item, i (item.href + item.title)}
							<li role="option" aria-selected={i === selected}>
								<button
									class="search-item {i === selected ? 'active' : ''} {item.planned
										? 'planned'
										: ''}"
									onclick={() => go(item)}
									onmouseenter={() => (selected = i)}
									disabled={item.planned}
								>
									<span class="si-main">
										<span class="si-title">{item.title}</span>
										<span class="si-desc">{item.description}</span>
									</span>
									<span class="si-side">
										<span class="si-group">{item.group}</span>
										{#if item.planned}
											<span class="si-badge">规划中</span>
										{:else}
											<span class="si-badge">{item.badge}</span>
										{/if}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.search-root {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 12vh 24px 24px;
	}

	.search-overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		border: none;
		padding: 0;
		background: rgba(20, 20, 20, 0.35);
		cursor: default;
	}

	.search-card {
		position: relative;
		z-index: 81;
		width: 100%;
		max-width: 560px;
		max-height: min(480px, calc(100vh - 24vh - 48px));
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-lg);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			0 8px 32px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.search-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-line-hair);
		flex-shrink: 0;
	}

	.search-icon {
		width: 16px;
		height: 16px;
		color: var(--color-ink-3);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		font-family: var(--font-body);
		font-size: 15px;
		color: var(--color-ink);
		outline: none;
		padding: 4px 0;
	}

	.search-input::placeholder {
		color: var(--color-ink-3);
	}

	.search-close {
		flex-shrink: 0;
		border: 1px solid var(--color-line-regular);
		background: var(--color-surface);
		color: var(--color-ink-3);
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			border-color 120ms ease-out,
			color 120ms ease-out;
	}

	.search-close:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.search-body {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 8px;
		min-height: 64px;
	}

	.search-hint,
	.search-empty {
		padding: 20px 16px;
		font-size: 13px;
		color: var(--color-ink-3);
		text-align: center;
	}

	.search-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.search-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		cursor: pointer;
		text-align: left;
		transition:
			background-color 120ms ease-out,
			opacity 120ms ease-out;
	}

	.search-item.active {
		background: var(--color-subtle);
	}

	.search-item.planned {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.si-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.si-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.si-desc {
		font-size: 12px;
		color: var(--color-ink-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.si-side {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}

	.si-group {
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
	}

	.si-badge {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 4px;
		padding: 1px 6px;
		background: rgba(217, 119, 6, 0.08);
	}
</style>
