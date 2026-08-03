<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		currentStep: number;
		totalSteps: number;
		isPlaying: boolean;
		speed: number;
		onPlay: () => void;
		onPause: () => void;
		onPrev: () => void;
		onNext: () => void;
		onReset: () => void;
		onJump: (step: number) => void;
		onSpeedChange: (speed: number) => void;
		disabled?: boolean;
	}

	let {
		currentStep,
		totalSteps,
		isPlaying,
		speed,
		onPlay,
		onPause,
		onPrev,
		onNext,
		onReset,
		onJump,
		onSpeedChange,
		disabled = false
	}: Props = $props();

	let progressRef: HTMLDivElement | undefined;
	let isDragging = false;

	const speedOptions = [0.5, 1, 1.5, 2];

	function handleProgressClick(e: MouseEvent) {
		if (!progressRef) return;
		const rect = progressRef.getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		const step = Math.round(ratio * (totalSteps - 1));
		onJump(Math.max(0, Math.min(totalSteps - 1, step)));
	}

	function handleProgressMouseDown(e: MouseEvent) {
		isDragging = true;
		handleProgressClick(e);
		window.addEventListener('mousemove', handleProgressMouseMove);
		window.addEventListener('mouseup', handleProgressMouseUp);
	}

	function handleProgressMouseMove(e: MouseEvent) {
		if (!isDragging || !progressRef) return;
		const rect = progressRef.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const step = Math.round(ratio * (totalSteps - 1));
		onJump(Math.max(0, Math.min(totalSteps - 1, step)));
	}

	function handleProgressMouseUp() {
		isDragging = false;
		window.removeEventListener('mousemove', handleProgressMouseMove);
		window.removeEventListener('mouseup', handleProgressMouseUp);
	}

	// 键盘快捷键
	function handleKeyDown(e: KeyboardEvent) {
		if (disabled) return;
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

		switch (e.key) {
			case ' ':
				e.preventDefault();
				if (isPlaying) {
					onPause();
				} else {
					onPlay();
				}
				break;
			case 'ArrowLeft':
				e.preventDefault();
				onPrev();
				break;
			case 'ArrowRight':
				e.preventDefault();
				onNext();
				break;
			case 'Home':
				e.preventDefault();
				onReset();
				break;
			case 'End':
				e.preventDefault();
				onJump(totalSteps - 1);
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('mousemove', handleProgressMouseMove);
		window.removeEventListener('mouseup', handleProgressMouseUp);
	});

	let progressPercent = $derived(totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0);
</script>

<div class="control-bar">
	<!-- 进度条 -->
	<div class="progress-row">
		<div
			class="progress-track"
			bind:this={progressRef}
			onmousedown={handleProgressMouseDown}
			role="slider"
			aria-valuemin={0}
			aria-valuemax={totalSteps - 1}
			aria-valuenow={currentStep}
			tabindex={0}
		>
			<div class="progress-fill" style="width: {progressPercent}%;"></div>
		</div>
		<span class="step-count">
			<span class="current">{String(currentStep + 1).padStart(2, '0')}</span>
			<span class="sep">/</span>
			<span class="total">{totalSteps}</span>
		</span>
	</div>

	<!-- 控制按钮 + 速度 -->
	<div class="controls-row">
		<div class="ctrl-buttons">
			<button class="icon-btn" onclick={onReset} title="重置 (Home)">
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="2 5 2 9 6 9"></polyline>
					<path d="M3.5 12a6 6 0 1 0 1.5-7L2 9"></path>
				</svg>
			</button>

			<button class="icon-btn" onclick={onPrev} title="上一步 (←)">
				<svg viewBox="0 0 16 16" fill="currentColor">
					<polygon points="10 3 4 8 10 13 10 3"></polygon>
					<rect x="2" y="3" width="2" height="10" rx="1"></rect>
				</svg>
			</button>

			<button
				class="play-btn"
				onclick={isPlaying ? onPause : onPlay}
				title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
			>
				{#if isPlaying}
					<svg viewBox="0 0 16 16" fill="currentColor">
						<rect x="4" y="3" width="2.5" height="10" rx="1"></rect>
						<rect x="9.5" y="3" width="2.5" height="10" rx="1"></rect>
					</svg>
				{:else}
					<svg viewBox="0 0 16 16" fill="currentColor">
						<polygon points="5 3 13 8 5 13 5 3"></polygon>
					</svg>
				{/if}
			</button>

			<button class="icon-btn" onclick={onNext} title="下一步 (→)">
				<svg viewBox="0 0 16 16" fill="currentColor">
					<polygon points="6 3 12 8 6 13 6 3"></polygon>
					<rect x="12" y="3" width="2" height="10" rx="1"></rect>
				</svg>
			</button>
		</div>

		<div class="speed-group">
			<span class="speed-label">速度</span>
			<div class="speed-opts">
				{#each speedOptions as s (s)}
					<button class="speed-opt {speed === s ? 'active' : ''}" onclick={() => onSpeedChange(s)}>
						{s}x
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.control-bar {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 20px;
		background: var(--color-surface);
	}

	/* 进度条行 */
	.progress-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.progress-track {
		flex: 1;
		position: relative;
		height: 3px;
		background: var(--color-subtle);
		border-radius: 2px;
		cursor: pointer;
		transition: height 120ms ease-out;
	}

	.progress-track:hover {
		height: 5px;
	}

	.progress-fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		background: var(--color-accent);
		border-radius: 2px;
		transition: width 120ms ease-out;
	}

	.step-count {
		font-family: var(--font-mono);
		font-size: 11px;
		flex-shrink: 0;
		display: flex;
		align-items: baseline;
		gap: 2px;
	}

	.step-count .current {
		font-weight: 600;
		color: var(--color-accent);
	}

	.step-count .sep {
		color: var(--color-ink-3);
	}

	.step-count .total {
		color: var(--color-ink-3);
	}

	/* 控制行 */
	.controls-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.ctrl-buttons {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid var(--color-line-regular);
		border-radius: 4px;
		background: var(--color-surface);
		color: var(--color-ink-2);
		cursor: pointer;
		transition: all 120ms ease-out;
	}

	.icon-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.icon-btn svg {
		width: 13px;
		height: 13px;
	}

	.play-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border: none;
		border-radius: 50%;
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		cursor: pointer;
		transition: all 150ms ease-out;
		margin: 0 2px;
	}

	.play-btn:hover {
		background: var(--color-accent);
		transform: scale(1.05);
	}

	.play-btn:active {
		transform: scale(0.97);
	}

	.play-btn svg {
		width: 14px;
		height: 14px;
	}

	/* 速度 */
	.speed-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: flex-end;
	}

	.speed-label {
		font-family: var(--font-mono);
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
	}

	.speed-opts {
		display: flex;
		gap: 1px;
		background: var(--color-subtle);
		border-radius: 4px;
		padding: 2px;
	}

	.speed-opt {
		padding: 2px 6px;
		font-family: var(--font-mono);
		font-size: 10px;
		border: none;
		border-radius: 2px;
		background: transparent;
		color: var(--color-ink-2);
		cursor: pointer;
		transition: all 120ms ease-out;
	}

	.speed-opt:hover {
		color: var(--color-ink);
	}

	.speed-opt.active {
		background: var(--color-surface);
		color: var(--color-ink);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		font-weight: 500;
	}
</style>
