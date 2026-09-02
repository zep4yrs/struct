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
		/** 副控抽屉里的可选动作（朗读/帮助等，由宿主传入） */
		onNarrate?: () => void;
		onHelp?: () => void;
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
		onNarrate,
		onHelp,
		disabled = false
	}: Props = $props();

	let progressRef: HTMLDivElement | undefined;
	let isDragging = false;
	let moreOpen = $state(false);

	const speedOptions = [0.5, 1, 1.5, 2];

	function handleProgressClick(e: MouseEvent) {
		if (!progressRef) return;
		const rect = progressRef.getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		const step = Math.round(ratio * (totalSteps - 1));
		onJump(Math.max(0, Math.min(totalSteps - 1, step)));
	}

	function handleProgressMouseDown(e: MouseEvent) {
		if (disabled) return; // disabled 时鼠标拖拽同样失效（与键盘一致）
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

	// 键盘快捷键（audit-5 语义说明：键盘控制按模式分治——本监听拥有「普通模式」的
	// 空格/方向键/Home/End；投影模式的同名按键由 AlgoPlayer 的 svelte:window 接管，
	// 且投影时本组件被 disabled={activeQuestion !== null || projector} 整体关闭，
	// 两者不存在重复响应。请勿在两处同时放开同一按键。）
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

	// 点击抽屉外部关闭
	function closeOnOutside(e: MouseEvent) {
		const btn = e.target as HTMLElement;
		if (moreOpen && !btn.closest('.more-drawer') && !btn.closest('.more-btn')) {
			moreOpen = false;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('mousedown', closeOnOutside);
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('mousemove', handleProgressMouseMove);
		window.removeEventListener('mouseup', handleProgressMouseUp);
		window.removeEventListener('mousedown', closeOnOutside);
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
			aria-label="播放进度"
			aria-valuemin={0}
			aria-valuemax={totalSteps - 1}
			aria-valuenow={currentStep}
			tabindex={0}
			onkeydown={(e) => {
				if (disabled) return;
				if (e.key === 'ArrowLeft') {
					e.preventDefault();
					onJump(Math.max(0, currentStep - 1));
				} else if (e.key === 'ArrowRight') {
					e.preventDefault();
					onJump(Math.min(totalSteps - 1, currentStep + 1));
				}
			}}
		>
			<div class="progress-fill" style="width: {progressPercent}%;"></div>
		</div>
		<span class="step-count">
			<span class="current">{String(currentStep + 1).padStart(2, '0')}</span>
			<span class="sep">/</span>
			<span class="total">{totalSteps}</span>
		</span>
	</div>

	<!-- 控制按钮 + 速度 + 更多 -->
	<div class="controls-row">
		<div class="ctrl-buttons">
			<button class="icon-btn" onclick={onReset} title="重置 (Home)" aria-label="重置 (Home)">
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

			<button class="icon-btn" onclick={onPrev} title="上一步 (←)" aria-label="上一步 (←)">
				<svg viewBox="0 0 16 16" fill="currentColor">
					<polygon points="10 3 4 8 10 13 10 3"></polygon>
					<rect x="2" y="3" width="2" height="10" rx="1"></rect>
				</svg>
			</button>

			<button
				class="play-btn"
				onclick={isPlaying ? onPause : onPlay}
				title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
				aria-label={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
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

			<button class="icon-btn" onclick={onNext} title="下一步 (→)" aria-label="下一步 (→)">
				<svg viewBox="0 0 16 16" fill="currentColor">
					<polygon points="6 3 12 8 6 13 6 3"></polygon>
					<rect x="12" y="3" width="2" height="10" rx="1"></rect>
				</svg>
			</button>
		</div>

		<div class="right-controls">
			<div class="speed-group" role="group" aria-label="播放速度">
				<span class="speed-label" id="speed-label">速度</span>
				<div class="speed-opts" role="radiogroup" aria-labelledby="speed-label">
					{#each speedOptions as s (s)}
						<button
							class="speed-opt {speed === s ? 'active' : ''}"
							role="radio"
							aria-checked={speed === s}
							onclick={() => onSpeedChange(s)}
						>
							{s}x
						</button>
					{/each}
				</div>
			</div>

			<!-- 「⋯」更多：重置 / 朗读 / 帮助（窄屏主通道，桌面隐藏） -->
			<div class="more-wrap">
				<button
					class="icon-btn more-btn"
					onclick={() => (moreOpen = !moreOpen)}
					title="更多操作"
					aria-label="更多操作"
					aria-expanded={moreOpen}
				>
					<svg viewBox="0 0 16 16" fill="currentColor">
						<circle cx="8" cy="3.5" r="1.5"></circle>
						<circle cx="8" cy="8" r="1.5"></circle>
						<circle cx="8" cy="12.5" r="1.5"></circle>
					</svg>
				</button>

				{#if moreOpen}
					<div class="more-drawer" role="menu" aria-label="更多操作">
						<button
							class="more-item"
							role="menuitem"
							onclick={() => {
								moreOpen = false;
								onReset();
							}}
						>
							重置
						</button>
						{#if onNarrate}
							<button
								class="more-item"
								role="menuitem"
								onclick={() => {
									moreOpen = false;
									onNarrate();
								}}
							>
								朗读
							</button>
						{/if}
						{#if onHelp}
							<button
								class="more-item"
								role="menuitem"
								onclick={() => {
									moreOpen = false;
									onHelp();
								}}
							>
								帮助
							</button>
						{/if}
					</div>
				{/if}
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
		width: 100%;
		min-width: 0;
		max-width: 100%;
		box-sizing: border-box;
		overflow: hidden; /* 防 min-content 击穿（M0.1：532px→375px 溢出止血） */
	}

	/* 进度条行 */
	.progress-row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.progress-track {
		flex: 1;
		min-width: 0; /* 允许收缩 */
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
		color: var(--color-accent-text);
	}

	.step-count .sep {
		color: var(--color-ink-2);
	}

	.step-count .total {
		color: var(--color-ink-2);
	}

	/* 控制行 */
	.controls-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-width: 0;
		flex-wrap: wrap;
	}

	.right-controls {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
		min-width: 0;
	}

	.ctrl-buttons {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
	}

	/* 触控热区：44×44（M0.3） */
	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 1px solid var(--color-line-regular);
		border-radius: 6px;
		background: var(--color-surface);
		color: var(--color-ink-2);
		cursor: pointer;
		transition:
			border-color 120ms ease-out,
			color 120ms ease-out;
		flex-shrink: 0;
	}

	.icon-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.icon-btn svg {
		width: 16px;
		height: 16px;
	}

	.play-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: var(--color-ink);
		color: var(--color-ink-inverse);
		cursor: pointer;
		transition:
			background-color 150ms ease-out,
			transform 150ms ease-out;
		margin: 0 2px;
		flex-shrink: 0;
	}

	.play-btn:hover {
		background: var(--color-accent);
		transform: scale(1.05);
	}

	.play-btn:active {
		transform: scale(0.97);
	}

	.play-btn svg {
		width: 16px;
		height: 16px;
	}

	/* 速度 */
	.speed-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: flex-end;
		flex-shrink: 0;
	}

	.speed-label {
		font-family: var(--font-mono);
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-2);
	}

	.speed-opts {
		display: flex;
		gap: 1px;
		background: var(--color-subtle);
		border-radius: 4px;
		padding: 2px;
	}

	.speed-opt {
		padding: 4px 8px;
		font-family: var(--font-mono);
		font-size: 10px;
		border: none;
		border-radius: 2px;
		background: transparent;
		color: var(--color-ink-2);
		cursor: pointer;
		transition: color 120ms ease-out;
		min-height: 30px;
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

	/* 「⋯」更多抽屉 */
	.more-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.more-btn {
		display: none; /* 桌面隐藏：按钮全部直接可见 */
	}

	.more-drawer {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 120px;
		padding: 6px;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		z-index: 60;
	}

	.more-item {
		display: flex;
		align-items: center;
		min-height: 44px;
		padding: 0 14px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--color-ink-2);
		font-size: 14px;
		font-family: var(--font-body);
		cursor: pointer;
		text-align: left;
	}

	.more-item:hover {
		background: var(--color-subtle);
		color: var(--color-ink);
	}

	/* 窄屏（≤700px）：显示「⋯」；速度组换行独占一行（44px 热区全档达标） */
	@media (max-width: 700px) {
		.control-bar {
			padding: 10px 12px;
			gap: 8px;
		}

		.ctrl-buttons {
			gap: 2px;
		}

		.more-btn {
			display: flex;
		}

		.right-controls {
			flex-basis: 100%;
			justify-content: flex-end;
		}
	}

	/* 超窄屏（≤430px）：速度标签隐藏，速度与更多按钮合并行更省 */
	@media (max-width: 430px) {
		.speed-label {
			display: none;
		}

		.speed-group {
			flex-direction: row;
			align-items: center;
			gap: 6px;
		}

		.progress-row {
			gap: 6px;
		}

		.step-count {
			font-size: 10px;
		}
	}
</style>
