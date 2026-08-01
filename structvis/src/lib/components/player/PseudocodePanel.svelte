<script lang="ts">
	interface Props {
		lines: string[];
		activeLine: number;
	}

	let { lines, activeLine }: Props = $props();
</script>

<div class="pseudocode">
	<pre><code
			>{#each lines as line, i (i)}
				<span class="line {i === activeLine ? 'active' : ''}" data-line={i}>
	<span class="line-num">{i + 1}</span>
	<span class="line-text">{line || '\u00A0'}</span>
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
		align-items: stretch;
	}

	pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 0;
		tab-size: 2;
		flex: 1;
	}

	code {
		font-family: inherit;
		display: block;
	}

	.line {
		display: flex;
		gap: 12px;
		padding: 0 20px 0 16px;
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

	/* 激活行 */
	.line.active {
		background: rgba(217, 119, 6, 0.1);
		border-left-color: var(--color-accent);
		padding-left: 14px;
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
