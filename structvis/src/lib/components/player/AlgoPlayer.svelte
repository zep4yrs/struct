<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import gsap from 'gsap';
	import type { AlgorithmEngine, StepType, PracticeQuestion } from '$lib/engines/algorithm/types';
	import { addMistake, updateTopicMastery } from '$lib/stores/progress';
	import ArrayRenderer from '$lib/visualization/array/ArrayRenderer.svelte';
	import TreeRenderer from '$lib/visualization/tree/TreeRenderer.svelte';
	import LinkedRenderer from '$lib/visualization/linkedlist/LinkedRenderer.svelte';
	import SqlTableRenderer from '$lib/visualization/sqltable/SqlTableRenderer.svelte';
	import StackRenderer from '$lib/visualization/stack/StackRenderer.svelte';
	import ErRenderer from '$lib/visualization/er/ErRenderer.svelte';
	import BPlusTreeRenderer from '$lib/visualization/btree/BPlusTreeRenderer.svelte';
	import GraphRenderer from '$lib/visualization/graph/GraphRenderer.svelte';
	import KmpRenderer from '$lib/visualization/kmp/KmpRenderer.svelte';
	import HuffmanRenderer from '$lib/visualization/huffman/HuffmanRenderer.svelte';
	import HashtableRenderer from '$lib/visualization/hashtable/HashtableRenderer.svelte';
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

	// === 演示数据 / 自定义弹窗 ===
	let showPresetModal = $state(false);
	let showCustomModal = $state(false);
	let activePresetName = $state('');
	let customValues = $state<Record<string, string>>({});
	let customError = $state('');
	let engineRevision = $state(0);

	// === 演示投影模式 ===
	let projector = $state(false);

	function enterProjector() {
		if (activeQuestion !== null) return;
		pause();
		mode = 'demo';
		projector = true;
	}

	function exitProjector() {
		projector = false;
	}

	function openPresetModal() {
		if (activeQuestion !== null) return;
		pause();
		showPresetModal = true;
	}

	function openCustomModal() {
		if (activeQuestion !== null) return;
		pause();
		customValues = {};
		for (const f of engine.customConfig?.fields ?? []) {
			customValues[f.key] = f.default ?? '';
		}
		customError = '';
		showCustomModal = true;
	}

	function applyPreset(name: string) {
		activePresetName = name;
		showPresetModal = false;
		engine.applyPreset?.(name);
		rebuildAfterEngineChange();
	}

	function applyCustom() {
		try {
			engine.applyCustom?.(customValues);
		} catch (e) {
			customError = (e as Error).message;
			return;
		}
		showCustomModal = false;
		rebuildAfterEngineChange();
	}

	function rebuildAfterEngineChange() {
		pause();
		answeredStepIds = [];
		activeQuestion = null;
		engineRevision++;
	}

	let tl: gsap.core.Timeline | null = null;
	let renderProxy = { pos: 0 };
	let canvasBodyRef = $state<HTMLDivElement | null>(null);

	const STEP_DURATIONS: Record<StepType, number> = {
		init: 0.8,
		compare: 1.0,
		swap: 1.2,
		'pivot-select': 1.0,
		'partition-start': 1.0,
		'partition-end': 1.2,
		'recurse-enter': 0.8,
		'recurse-exit': 0.8,
		'edge-candidate': 1.1,
		'edge-select': 1.2,
		'edge-reject': 0.9,
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
		if (projector) return;
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
		killControlTweens();
		const target = Math.max(0, Math.floor(playbackPos) - 1);
		tl.tweenTo(target);
		currentStepIdx = target;
	}

	function next() {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		killControlTweens();
		const target = Math.min(engine.totalSteps - 1, Math.floor(playbackPos) + 1);
		tl.tweenTo(target);
		currentStepIdx = target;
		checkPracticeAt(target);
	}

	// tweenTo() 生成的控制 tween 只向前播放；若不清除，seek 后退后它仍会把
	// 播放头拉回原位（Home/End/进度条跳动后步骤继续漂移的根因）。
	// getTweensOf(tl) 可能漏掉控制 tween，用 killTweensOf 一并清除。
	function killControlTweens() {
		if (!tl) return;
		gsap.killTweensOf(tl);
	}

	function reset() {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		killControlTweens();
		tl.seek(0);
		currentStepIdx = 0;
		playbackPos = 0;
		engine.reset();
	}

	function jumpTo(step: number) {
		if (!tl) return;
		if (activeQuestion !== null) return;
		pause();
		killControlTweens();
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
		if (engineRevision >= 0 && engine.steps.length > 0) {
			answeredStepIds = [];
			activeQuestion = null;
			tick().then(() => {
				// 旧 timeline 若带未完成的 tweenTo 控制 tween，重建后其 onComplete 仍会
				// 触发并改写 currentStepIdx（预设/自定义重建后步骤漂移的根因），必须先销毁；
				// 初始挂载（revision 0）时 tl 已由 onMount 创建，不可销毁
				if (engineRevision > 0 && tl) {
					tl.pause();
					gsap.killTweensOf(tl);
					tl.kill();
					tl = null;
				}
				if (engineRevision === 0 || !canvasBodyRef || prefersReducedMotion()) {
					buildTimeline();
					currentStepIdx = 0;
					playbackPos = 0;
					return;
				}
				gsap.killTweensOf(canvasBodyRef);
				gsap.to(canvasBodyRef, {
					opacity: 0,
					duration: 0.12,
					ease: 'power1.in',
					onComplete: () => {
						buildTimeline();
						currentStepIdx = 0;
						playbackPos = 0;
						gsap.to(canvasBodyRef, {
							opacity: 1,
							duration: 0.24,
							ease: 'power2.out',
							clearProps: 'opacity'
						});
					}
				});
			});
		}
	});

	function prefersReducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

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
		if (canvasBodyRef) {
			gsap.killTweensOf(canvasBodyRef);
		}
	});

	// 依赖 engineRevision：重建引擎后 steps 引用变化，即使 currentStepIdx 数值不变，
	// 也必须重新求值（否则状态栏/旁白滞留旧引擎的文案）
	let currentStep = $derived.by(() => {
		engineRevision;
		return engine.steps[Math.min(currentStepIdx, engine.steps.length - 1)];
	});

	// === 讲授旁白：优先步骤级 presenterNote，回落到 demoScript 按步骤类型匹配 ===
	let projectorNarration = $derived.by(() => {
		const s = currentStep;
		if (!s) return '';
		if (s.presenterNote) return s.presenterNote;
		return engine.demoScript?.find((m) => m.type === s.type)?.narration ?? '';
	});

	// 投影模式进出全屏
	$effect(() => {
		if (projector) {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen?.().catch(() => {});
			}
		} else if (document.fullscreenElement) {
			document.exitFullscreen?.().catch(() => {});
		}
	});
</script>

<div class="algo-player">
	<!-- 主工作区 -->
	<div class="workspace">
		<!-- 中间：可视化区 -->
		<div class="canvas-area">
			<!-- 顶部标题栏 -->
			<div class="canvas-header">
				<div class="title-area">
					<div class="canvas-title">{engine.name}</div>
					{#if engine.presets?.length || engine.customConfig}
						<div class="title-actions">
							{#if engine.presets?.length}
								<button
									class="title-btn {activePresetName ? 'active' : ''}"
									onclick={openPresetModal}
									title="选择演示数据"
								>
									{activePresetName || '演示数据'}
									<span class="caret">▾</span>
								</button>
							{/if}
							{#if engine.customConfig}
								<button class="title-btn" onclick={openCustomModal} title="自定义输入"
									>自定义</button
								>
							{/if}
						</div>
					{/if}
				</div>
				<div class="header-right">
					{#if engine.demoScript}
						<button class="pj-entry" onclick={enterProjector} title="演示投影模式（全屏讲授）"
							>投影</button
						>
					{/if}
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
			{#key engineRevision}
				<div class="canvas-body" bind:this={canvasBodyRef}>
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
					{:else if engine.renderType === 'er'}
						<ErRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'btree'}
						<BPlusTreeRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'graph'}
						<GraphRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'kmp'}
						<KmpRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'huffman'}
						<HuffmanRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'hashtable'}
						<HashtableRenderer steps={engine.steps} {playbackPos} />
					{/if}
				</div>
			{/key}

			<!-- 底部状态栏（字幕式步骤说明） -->
			<div class="status-bar">
				<span class="status-text">{currentStep?.description || 'Ready'}</span>
			</div>
		</div>

		<!-- 右侧：伪代码 -->
		<div class="right-panel">
			<div class="panel-header">
				<span class="panel-title"
					>{engine.panelTitle ?? (engine.renderType === 'sql-table' ? '执行计划' : '伪代码')}</span
				>
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
					disabled={activeQuestion !== null || projector}
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

	<!-- 练习选择题：固定弹窗（在画布外） -->
	{#if activeQuestion}
		<PracticePanel
			question={activeQuestion}
			onAnswered={handlePracticeAnswered}
			onContinue={handlePracticeContinue}
		/>
	{/if}

	<!-- 演示数据选择弹窗 -->
	{#if showPresetModal && engine.presets}
		<div class="modal-root">
			<button
				class="modal-overlay"
				aria-label="关闭演示数据弹窗"
				onclick={() => (showPresetModal = false)}
				transition:fade={{ duration: 240 }}
			></button>
			<div
				class="modal-card"
				role="dialog"
				aria-modal="true"
				aria-label="演示数据"
				transition:fly={{
					y: prefersReducedMotion() ? 0 : 12,
					duration: prefersReducedMotion() ? 0 : 240,
					easing: expoOut
				}}
			>
				<header class="modal-header">
					<span class="modal-title">演示数据</span>
					<button class="modal-close" aria-label="关闭" onclick={() => (showPresetModal = false)}>
						✕
					</button>
				</header>
				<div class="preset-list">
					{#each engine.presets as p (p.name)}
						<button
							class="preset-item {activePresetName === p.name ? 'active' : ''}"
							onclick={() => applyPreset(p.name)}
						>
							<span class="preset-name">{p.name}</span>
							{#if p.description}
								<span class="preset-desc">{p.description}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- 自定义输入弹窗 -->
	{#if showCustomModal && engine.customConfig}
		<div class="modal-root">
			<button
				class="modal-overlay"
				aria-label="关闭自定义弹窗"
				onclick={() => (showCustomModal = false)}
				transition:fade={{ duration: 240 }}
			></button>
			<div
				class="modal-card"
				role="dialog"
				aria-modal="true"
				aria-label={engine.customConfig.title ?? '自定义数据'}
				transition:fly={{
					y: prefersReducedMotion() ? 0 : 12,
					duration: prefersReducedMotion() ? 0 : 240,
					easing: expoOut
				}}
			>
				<header class="modal-header">
					<span class="modal-title">{engine.customConfig.title ?? '自定义数据'}</span>
					<button class="modal-close" aria-label="关闭" onclick={() => (showCustomModal = false)}>
						✕
					</button>
				</header>
				<div class="custom-fields">
					{#each engine.customConfig.fields as f (f.key)}
						<label class="custom-field">
							<span class="custom-label">{f.label}</span>
							{#if f.type === 'select'}
								<select
									bind:value={customValues[f.key]}
									name={f.key}
									autocomplete="off"
									class="custom-control"
								>
									{#each f.options as o (o.value)}
										<option value={o.value}>{o.label}</option>
									{/each}
								</select>
							{:else if f.type === 'textarea'}
								<textarea
									bind:value={customValues[f.key]}
									name={f.key}
									autocomplete="off"
									class="custom-control"
									placeholder={f.placeholder}
									rows="3"></textarea>
							{:else}
								<input
									bind:value={customValues[f.key]}
									name={f.key}
									autocomplete="off"
									type="text"
									class="custom-control"
									placeholder={f.placeholder}
								/>
							{/if}
						</label>
					{/each}
				</div>
				{#if customError}
					<div class="custom-error" aria-live="polite">{customError}</div>
				{/if}
				<div class="modal-actions">
					<button class="btn btn-ghost" onclick={() => (showCustomModal = false)}>取消</button>
					<button class="btn btn-primary" onclick={applyCustom}>应用</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- 演示投影模式：全屏讲授 -->
	{#if projector}
		<div class="projector" role="dialog" aria-modal="true" aria-label="演示投影模式">
			<header class="projector-header">
				<div class="projector-title">{engine.name} · 讲授演示</div>
				<div class="projector-step">
					第
					<span class="pj-num">{String(currentStepIdx + 1).padStart(2, '0')}</span>
					<span> / {engine.totalSteps} 步</span>
				</div>
				<div class="projector-btns">
					{#if engine.presets?.length}
						<button class="pj-btn" onclick={openPresetModal}>演示数据</button>
					{/if}
					{#if engine.customConfig}
						<button class="pj-btn" onclick={openCustomModal}>自定义</button>
					{/if}
					<button class="pj-btn pj-exit" onclick={exitProjector} title="退出投影 (Esc)"
						>退出投影</button
					>
				</div>
			</header>

			<main class="projector-body">
				{#key engineRevision}
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
					{:else if engine.renderType === 'er'}
						<ErRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'btree'}
						<BPlusTreeRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'graph'}
						<GraphRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'kmp'}
						<KmpRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'huffman'}
						<HuffmanRenderer steps={engine.steps} {playbackPos} />
					{:else if engine.renderType === 'hashtable'}
						<HashtableRenderer steps={engine.steps} {playbackPos} />
					{/if}
				{/key}
			</main>

			<footer class="projector-footer">
				<div class="pj-narration">{projectorNarration || currentStep?.description || 'Ready'}</div>
				<div class="pj-actions">
					<button class="pj-ctrl" onclick={reset} title="重置 (Home)" aria-label="重置 (Home)"
						>⏮</button
					>
					<button class="pj-ctrl" onclick={prev} title="上一步 (←)" aria-label="上一步 (←)"
						>◀</button
					>
					<button
						class="pj-ctrl pj-play"
						onclick={isPlaying ? pause : play}
						title="播放 / 暂停 (Space)"
						aria-label={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
					>
						{#if isPlaying}⏸{:else}▶{/if}
					</button>
					<button class="pj-ctrl" onclick={next} title="下一步 (→)" aria-label="下一步 (→)"
						>▶</button
					>
					<button
						class="pj-ctrl"
						onclick={() => jumpTo(engine.totalSteps - 1)}
						title="到最后 (End)"
						aria-label="到最后 (End)">⏭</button
					>
				</div>
				<div class="pj-hints">Esc 退出 · 空格 播放 / 暂停 · ← → 步进</div>
			</footer>
		</div>
	{/if}
</div>

<svelte:window
	onkeydown={(e) => {
		const target = e.target as HTMLElement;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

		if (e.key === 'Escape') {
			if (projector) {
				projector = false;
				return;
			}
			showPresetModal = false;
			showCustomModal = false;
		}
		if (!projector) return;
		switch (e.key) {
			case ' ':
				e.preventDefault();
				if (activeQuestion === null) {
					if (isPlaying) {
						pause();
					} else {
						play();
					}
				}
				break;
			case 'ArrowLeft':
				e.preventDefault();
				prev();
				break;
			case 'ArrowRight':
				e.preventDefault();
				next();
				break;
		}
	}}
/>

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
		grid-template-columns: 1fr 380px;
		height: max(480px, min(640px, calc(100vh - 160px)));
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

	.title-area {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
	}

	.title-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.title-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-2);
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: 6px;
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.title-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.title-btn.active {
		background: var(--color-ink);
		border-color: var(--color-ink);
		color: var(--color-ink-inverse);
	}

	.title-btn .caret {
		font-size: 9px;
		opacity: 0.7;
	}

	/* 投影模式入口按钮 */
	.pj-entry {
		padding: 4px 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-accent);
		background: transparent;
		border: 1px solid var(--color-accent);
		border-radius: 6px;
		cursor: pointer;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.pj-entry:hover {
		background: var(--color-accent);
		color: var(--color-paper);
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
		transition:
			color 0.15s,
			background 0.15s;
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
		padding: 20px;
		overflow: auto;
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

	/* === 弹窗 === */
	.modal-root {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 70;
		border: none;
		padding: 0;
		background: rgba(20, 20, 20, 0.35);
		cursor: default;
	}

	.modal-card {
		position: relative;
		z-index: 71;
		width: 100%;
		max-width: 520px;
		max-height: min(560px, calc(100vh - 96px));
		overflow-y: auto;
		overscroll-behavior: contain;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-lg);
		padding: 16px 24px;
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			0 8px 32px rgba(0, 0, 0, 0.06);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--color-line-hair);
	}

	.modal-title {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ink-3);
	}

	.modal-close {
		border: none;
		background: transparent;
		color: var(--color-ink-3);
		font-size: 13px;
		cursor: pointer;
		padding: 4px 6px;
		border-radius: 4px;
		transition: color 120ms;
	}

	.modal-close:hover {
		color: var(--color-ink);
	}

	.preset-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.preset-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;
		padding: 10px 14px;
		text-align: left;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		border-left: 3px solid var(--color-line-regular);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			border-left-color 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.preset-item:hover {
		border-color: var(--color-ink);
		border-left-color: var(--color-ink);
	}

	.preset-item.active {
		border-color: var(--color-accent);
		border-left-color: var(--color-accent);
		background: rgba(217, 119, 6, 0.05);
	}

	.preset-item.active .preset-name {
		color: var(--color-accent);
	}

	.preset-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-ink);
	}

	.preset-desc {
		font-size: 12px;
		color: var(--color-ink-2);
		line-height: 1.5;
	}

	.custom-fields {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-bottom: 18px;
	}

	.custom-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.custom-label {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-ink-3);
	}

	.custom-control {
		padding: 8px 12px;
		font-family: var(--font-mono);
		font-size: 13px;
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		background: var(--color-paper);
		color: var(--color-ink);
		outline: none;
		transition: border-color 120ms var(--ease-out);
	}

	.custom-control:focus {
		border-color: var(--color-ink);
	}

	.custom-error {
		margin-bottom: 16px;
		padding: 10px 12px;
		font-size: 12px;
		color: var(--color-danger);
		background: rgba(155, 34, 38, 0.06);
		border: 1px solid rgba(155, 34, 38, 0.25);
		border-radius: var(--radius-sm);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	/* === 演示投影模式 === */
	.projector {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
	}

	.projector-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 18px 32px;
		border-bottom: 1px solid var(--color-line-hair);
		flex-shrink: 0;
	}

	.projector-title {
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 600;
		color: var(--color-ink);
		letter-spacing: -0.01em;
	}

	.projector-step {
		font-family: var(--font-mono);
		font-size: 15px;
		color: var(--color-ink-3);
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.projector-step .pj-num {
		color: var(--color-accent);
		font-weight: 600;
	}

	.projector-btns {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pj-btn {
		padding: 6px 14px;
		font-family: var(--font-mono);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-ink-2);
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: 6px;
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.pj-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.pj-exit {
		color: var(--color-danger);
	}

	.pj-exit:hover {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.projector-body {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		overflow: auto;
	}

	.projector-footer {
		flex-shrink: 0;
		border-top: 1px solid var(--color-line-hair);
		background: var(--color-paper);
		padding: 20px 32px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.pj-narration {
		max-width: 860px;
		text-align: center;
		font-size: 21px;
		line-height: 1.65;
		font-weight: 500;
		color: var(--color-ink);
	}

	.pj-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.pj-ctrl {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 46px;
		height: 46px;
		padding: 0 16px;
		border: 1px solid var(--color-line-regular);
		border-radius: 8px;
		background: var(--color-surface);
		color: var(--color-ink);
		font-size: 16px;
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.pj-ctrl:hover {
		border-color: var(--color-ink);
		transform: translateY(-1px);
	}

	.pj-play {
		background: var(--color-ink);
		border-color: var(--color-ink);
		color: var(--color-ink-inverse);
	}

	.pj-play:hover {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.pj-hints {
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.06em;
		color: var(--color-ink-3);
	}

	@media (max-width: 900px) {
		.workspace {
			grid-template-columns: 1fr;
			height: auto;
		}

		.canvas-area {
			border-right: none;
			border-bottom: 1px solid var(--color-line-hair);
			height: 460px;
		}

		.right-panel {
			height: 320px;
		}
	}
</style>
