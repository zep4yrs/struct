<script lang="ts">
	interface Props {
		lines: string[];
		activeLine: number;
		/** 断点行集合（0-based 伪代码行号） */
		breakpoints?: Set<number>;
		/** 点击行首圆点切换断点 */
		onToggleBreakpoint?: (line: number) => void;
	}

	let { lines, activeLine, breakpoints = new Set<number>(), onToggleBreakpoint }: Props = $props();
</script>

<div class="pseudocode">
	<pre><code
			>{#each lines as line, i (i)}
				<span
					class="line {i === activeLine ? 'active' : ''} {breakpoints.has(i) ? 'breakpoint' : ''}"
					data-line={i}>
					<button
						class="bp-dot"
						class:on={breakpoints.has(i)}
						aria-label={breakpoints.has(i) ? '移除断点' : '设置断点'}
						title="点击设置/移除断点"
						onclick={() => onToggleBreakpoint?.(i)}></button>
					<span class="line-num">{i + 1}</span>
					<span class="line-text">{line || ' '}</span>
				</span>
			{/each}</code
		></pre>
</div>

<style>
	.pseudocode {
		width: 100%;
		height: 100%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 0;
		tab-size: 2;
		flex: 1;
		overflow-x: auto;
	}

	code {
		font-family: inherit;
		display: block;
	}

	.line {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 20px 0 12px;
		border-left: 2px solid transparent;
		transition: background-color 120ms ease-out;
		white-space: pre;
	}

	.line-num {
		color: var(--color-ink-3);
		text-align: right;
		user-select: none;
		min-width: 20px;
		flex-shrink: 0;
		font-size: 11px;
		line-height: 1.5;
		vertical-align: top;
	}

	.line-text {
		color: var(--color-ink-2);
		flex: 1;
		line-height: 1.5;
		vertical-align: top;
	}

	/* 断点圆点 */
	.bp-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		border: 1.5px solid var(--color-ink-3);
		background: transparent;
		padding: 0;
		flex-shrink: 0;
		cursor: pointer;
		transition:
			background-color 120ms ease-out,
			border-color 120ms ease-out;
		opacity: 0.5;
	}

	.bp-dot:hover {
		opacity: 1;
		border-color: var(--color-danger);
	}

	.bp-dot.on {
		background: var(--color-danger);
		border-color: var(--color-danger);
		opacity: 1;
	}

	.line.breakpoint {
		background: rgba(155, 34, 38, 0.06);
	}

	/* 激活行 */
	.line.active {
		background: rgba(217, 119, 6, 0.1);
		border-left-color: var(--color-accent);
		padding-left: 10px;
	}

	.line.active .line-num {
		color: var(--color-accent);
		font-weight: 600;
	}

	.line.active .line-text {
		color: var(--color-ink);
		font-weight: 500;
	}
</style>
