<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import gsap from 'gsap';
	import type { AlgorithmEngine, StepType, PracticeQuestion } from '$lib/engines/algorithm/types';
	import { addMistake, updateTopicMastery } from '$lib/stores/progress';
	import ArrayRenderer from '$lib/visualization/array/ArrayRenderer.svelte';
	import TreeRenderer from '$lib/visualization/tree/TreeRenderer.svelte';
	import LinkedRenderer from '$lib/visualization/linkedlist/LinkedRenderer.svelte';
	import SqlTableRenderer from '$lib/visualization/sqltable/SqlTableRenderer.svelte';
	import StackRenderer from '$lib/visualization/stack/StackRenderer.svelte';
	import PseudocodePanel from './PseudocodePanel.svelte';
	import ControlBar from './ControlBar.svelte';
	import PracticePanel from './PracticePanel.svelte';

	interface Props {
		engine: AlgorithmEngine<unknown>;
		topicId?: string;
		topicName?: string;
	}

	let { engine, topicId = 'unknown', topicName = '未知主题' }: Props = $props();

	let isPlaying = $state(false);
	let speed = $state(1);
	let currentStepIdx = $state(0);
	let playbackPos = $state(0);

	let activeQuestion = $state<PracticeQuestion | null>(null);
	let answeredStepIds: number[] = [];

	let tl: gsap.core.Timeline | null = null;
	let renderProxy = { pos: 0 };

	const STEP_DURATIONS: Record<StepType, number> = {
		init: 0.8,
		compare: 1.0,
		swap: 1.2,
		'pivot-select': 1.0,
		'partition-start': 1.0,
		'partition-end': 1.2,
		'recurse-enter': 0.8,
		'recurse-exit': 0.8,
		complete: 1.5,
		default: 1.0
	};

	function buildTimeline() {
		if (tl) {
			tl.kill();
			tl = null;
		}
		if (engine.steps.length < 2) return;

		renderProxy.pos = 0;
		tl = gsap.timeline({ paused: true });

		for (let i = 0; i < engine.steps.length - 1; i++) {
			const nextStep = engine.steps[i + 1];
			const duration = STEP_DURATIONS[nextStep.type] || STEP_DURATIONS.default;

			tl.to(renderProxy, {
				pos: i + 1,
				duration,
				ease: 'power2.out',
				onUpdate: () => {
					playbackPos = renderProxy.pos;
					engine.setProgress(renderProxy.pos);
					if (isPlaying) {
						checkPracticeAt(Math.floor(renderProxy.pos));
					}
				},
				onComplete: () => {
					currentStepIdx = i + 1;
				}
			});
		}

		tl.eventCallback('onComplete', () => {
			isPlaying = false;
		});
	}

	// === 演示 / 练习模式 ===
	// demo：纯播放，不弹题；practice：播放到练习步骤暂停出题

	let mode = $state<'demo' | 'practice'>('demo');

	function checkPracticeAt(stepId: number) {
		if (mode !== 'practice') return;
		if (activeQuestion !== null) return;
		const question = engine.practiceQuestions?.find(
			(q) => q.stepIndex === stepId && !answeredStepIds.includes(stepId)
		);
		if (question) {
			pause();
			activeQuestion = question;
		}
	}

	function handlePracticeAnswered(result: { correct: boolean; answer: string }) {
		if (activeQuestion === null) return;
		const stepId = activeQuestion.stepIndex;
		answeredStepIds.push(stepId);

		if (result.correct) {
			updateTopicMastery(topicId, 10);
		} else {
			addMistake({
				topic: topicName,
				type: 'algorithm',
				question: activeQuestion.prompt,
				wrongAnswer: result.answer,
				correctAnswer: String(activeQuestion.correctAnswer),
				explanation: activeQuestion.explanation
			});
		}
	}

	function handlePracticeContinue() {
		activeQuestion = null;
	}

	function play() {
		if (!tl || engine.steps.length < 2) return;
		if (activeQuestion !== null) return;
		if (currentStepIdx >= engine.totalSteps - 1) {
			tl.seek(0);
			currentStepIdx = 0;
			playbackPos = 0;
		}
		tl.timeScale(speed);
		tl.play();
		isPlaying = true;
	}

	function pause() {
		if (!tl) return;
		tl.pause();
		isPlaying = false;
	}

	function prev() {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		const target = Math.max(0, Math.floor(playbackPos) - 1);
		tl.tweenTo(target);
		currentStepIdx = target;
	}

	function next() {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		const target = Math.min(engine.totalSteps - 1, Math.floor(playbackPos) + 1);
		tl.tweenTo(target);
		currentStepIdx = target;
		checkPracticeAt(target);
	}

	function reset() {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		tl.seek(0);
		currentStepIdx = 0;
		playbackPos = 0;
		engine.reset();
	}

	function jumpTo(step: number) {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		tl.seek(step);
		currentStepIdx = step;
		playbackPos = step;
		checkPracticeAt(step);
	}

	function changeSpeed(newSpeed: number) {
		speed = newSpeed;
		if (tl && isPlaying) {
			tl.timeScale(speed);
		}
	}

	$effect(() => {
		if (engine.steps.length > 0) {
			answeredStepIds = [];
			activeQuestion = null;
			tick().then(() => {
				buildTimeline();
				currentStepIdx = 0;
				playbackPos = 0;
			});
		}
	});

	onMount(() => {
		if (engine.steps.length > 0) {
			buildTimeline();
		}
	});

	onDestroy(() => {
		if (tl) {
			tl.kill();
			tl = null;
		}
	});

	let currentStep = $derived(engine.steps[Math.min(currentStepIdx, engine.steps.length - 1)]);
</script>

<div class="algo-player">
	<!-- 主工作区 -->
	<div class="workspace">
		<!-- 中间：可视化区 -->
		<div class="canvas-area">
			<!-- 顶部标题栏 -->
			<div class="canvas-header">
				<div class="canvas-title">{engine.name}</div>
				<div class="header-right">
					<div class="mode-switch" role="tablist" aria-label="播放模式">
						<button
							class="mode-btn {mode === 'demo' ? 'active' : ''}"
							role="tab"
							aria-selected={mode === 'demo'}
							onclick={() => (mode = 'demo')}
						>
							演示
						</button>
						<button
							class="mode-btn {mode === 'practice' ? 'active' : ''}"
							role="tab"
							aria-selected={mode === 'practice'}
							onclick={() => (mode = 'practice')}
						>
							练习
						</button>
					</div>
					<div class="canvas-meta">
						<span class="meta-step">
							第
							<span class="current-num">{String(currentStepIdx + 1).padStart(2, '0')}</span>
							<span class="total-num"> / {engine.totalSteps} 步</span>
						</span>
					</div>
				</div>
			</div>

			<!-- Canvas 主体 -->
			<div class="canvas-body">
				{#if engine.renderType === 'array'}
					<ArrayRenderer steps={engine.steps} {playbackPos} />
				{:else if engine.renderType === 'tree'}
					<TreeRenderer steps={engine.steps} {playbackPos} />
				{:else if engine.renderType === 'linkedlist'}
					<LinkedRenderer steps={engine.steps} {playbackPos} />
				{:else if engine.renderType === 'sql-table'}
					<SqlTableRenderer steps={engine.steps} {playbackPos} />
				{:else if engine.renderType === 'stack' || engine.renderType === 'queue'}
					<StackRenderer steps={engine.steps} {playbackPos} mode={engine.renderType} />
				{/if}

				{#if activeQuestion}
					<PracticePanel
						question={activeQuestion}
						onAnswered={handlePracticeAnswered}
						onContinue={handlePracticeContinue}
					/>
				{/if}
			</div>

			<!-- 底部状态栏（字幕式步骤说明） -->
			<div class="status-bar">
				<span class="status-text">{currentStep?.description || 'Ready'}</span>
			</div>
		</div>

		<!-- 右侧：伪代码 -->
		<div class="right-panel">
			<div class="panel-header">
				<span class="panel-title">伪代码</span>
			</div>
			<div class="panel-body">
				<PseudocodePanel lines={engine.pseudocode} activeLine={currentStep?.pseudocodeLine ?? 0} />
			</div>
			<div class="panel-controls">
				<ControlBar
					currentStep={currentStepIdx}
					totalSteps={engine.totalSteps}
					{isPlaying}
					{speed}
					disabled={activeQuestion !== null}
					onPlay={play}
					onPause={pause}
					onPrev={prev}
					onNext={next}
					onReset={reset}
					onJump={jumpTo}
					onSpeedChange={changeSpeed}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.algo-player {
		width: 100%;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			0 8px 32px rgba(0, 0, 0, 0.04);
	}

	.workspace {
		display: grid;
		grid-template-columns: 1fr 320px;
		height: 520px;
	}

	/* 可视化区 */
	.canvas-area {
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		border-right: 1px solid var(--color-line-hair);
	}

	.canvas-header {
		padding: 14px 24px;
		border-bottom: 1px solid var(--color-line-hair);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.canvas-title {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 500;
		color: var(--color-ink);
		letter-spacing: -0.01em;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.mode-switch {
		display: flex;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: 6px;
		padding: 2px;
		gap: 2px;
	}

	.mode-btn {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
		background: transparent;
		border: none;
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}

	.mode-btn:hover {
		color: var(--color-ink);
	}

	.mode-btn.active {
		background: var(--color-ink);
		color: var(--color-paper);
	}

	.canvas-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
	}

	.meta-step .current-num {
		color: var(--color-accent);
		font-weight: 600;
	}

	.meta-step .total-num {
		color: var(--color-ink-3);
	}

	.canvas-body {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		overflow: hidden;
	}

	/* 底部状态栏 — 字幕式 */
	.status-bar {
		padding: 10px 24px;
		border-top: 1px solid var(--color-line-hair);
		background: var(--color-paper);
		flex-shrink: 0;
	}

	.status-text {
		font-size: 13px;
		color: var(--color-ink-2);
		line-height: 1.5;
	}

	/* 右侧面板 */
	.right-panel {
		display: flex;
		flex-direction: column;
		background: var(--color-paper);
		overflow: hidden;
	}

	.panel-header {
		padding: 14px 20px;
		border-bottom: 1px solid var(--color-line-hair);
		flex-shrink: 0;
	}

	.panel-title {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel-controls {
		flex-shrink: 0;
		border-top: 1px solid var(--color-line-hair);
		background: var(--color-surface);
	}

	@media (max-width: 900px) {
		.workspace {
			grid-template-columns: 1fr;
			height: auto;
		}

		.canvas-area {
			border-right: none;
			border-bottom: 1px solid var(--color-line-hair);
			height: 380px;
		}

		.right-panel {
			height: 320px;
		}
	}
</style>
