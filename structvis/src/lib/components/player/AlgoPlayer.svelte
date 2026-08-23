<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import { animate } from 'animejs';
	import type { AlgorithmEngine, PracticeQuestion } from '$lib/engines/algorithm/types';
	import { settings } from '$lib/stores/settings';
	import { TimelineController } from './TimelineController';
	import { PracticeController } from './PracticeController';
	import {
		parseScript,
		serializeScript,
		loadScriptOverride,
		saveScriptOverride
	} from './script-manager';
	import type { DemoScriptItem } from '$lib/engines/algorithm/types';
	import RendererSwitch from './RendererSwitch.svelte';
	import PseudocodePanel from './PseudocodePanel.svelte';
	import ControlBar from './ControlBar.svelte';
	import PracticePanel from './PracticePanel.svelte';
	import CoachMarkLayer from './CoachMarkLayer.svelte';
	import HelpSheet from './HelpSheet.svelte';
	import { audioManifest } from '$lib/narration/audio-manifest';
	import { base } from '$app/paths';

	interface Props {
		engine: AlgorithmEngine<unknown>;
		topicId?: string;
		topicName?: string;
	}

	let { engine, topicId = 'unknown', topicName = '未知主题' }: Props = $props();

	let isPlaying = $state(false);
	// 初始速度取自设置页（0.5~2，任意值均有效）；播放中由 ControlBar 档位按钮调整
	let speed = $state($settings.animationSpeed);
	let currentStepIdx = $state(0);
	let playbackPos = $state(0);
	// 断点行集合（伪代码行号 0-based）——播放到断点行自动暂停
	let breakpoints = $state<Set<number>>(new Set());
	// 复杂度可视化：累计比较/交换次数（排序类引擎；其他引擎为 0 不显示）
	const compareCount = $derived(
		engine.steps.slice(0, Math.floor(playbackPos) + 1).filter((s) => s.type === 'compare').length
	);
	const swapCount = $derived(
		engine.steps.slice(0, Math.floor(playbackPos) + 1).filter((s) => s.type === 'swap').length
	);
	const showOps = $derived(engine.steps.some((s) => s.type === 'compare' || s.type === 'swap'));

	let activeQuestion = $state<PracticeQuestion | null>(null);
	// 控制器在 effect 内创建（engine prop 在播放器生命周期内不变，effect 只运行一次）
	let practice: PracticeController;
	let timeline: TimelineController;

	// === 演示数据 / 自定义弹窗 ===
	let showPresetModal = $state(false);
	let showCustomModal = $state(false);
	let activePresetName = $state('');
	let customValues = $state<Record<string, string>>({});
	let customError = $state('');
	let engineError = $state('');
	let engineRevision = $state(0);
	let presetModalCard = $state<HTMLDivElement | null>(null);
	let customModalCard = $state<HTMLDivElement | null>(null);

	// === 演示投影模式 ===
	let projector = $state(false);
	// 功能速查面板（Story-1）
	let helpOpen = $state(false);

	// === 讲授朗读（旁白驱动）：朗读当前步骤 → 动画到下一步 → 朗读下一步 ===
	let narrationOn = $state(false); // 朗读开关（投影模式工具栏）
	let currentAudio: HTMLAudioElement | null = null; // 预录音频（MiMo 生成）
	let speechUtterance: SpeechSynthesisUtterance | null = null; // TTS 回落
	let narrationAnimating = false; // 旁白读完、动画推进中（等待 onTweenEnd）

	function narrationTextFor(s: { type: string; presenterNote?: string }): string {
		if (s.presenterNote) return s.presenterNote;
		return effectiveScript?.find((m) => m.type === s.type)?.narration ?? '';
	}

	/** 预录音频：manifest 存在且旁白文本未变（防止文案改了音频过期） */
	function audioUrlFor(type: string, text: string): string | null {
		const entry = audioManifest[topicId]?.[type];
		if (!entry || entry.text !== text) return null;
		return `${base}/audio/${topicId}/${entry.file}`;
	}

	function stopNarration() {
		if (currentAudio) {
			currentAudio.pause();
			currentAudio = null;
		}
		if (speechUtterance) {
			speechSynthesis.cancel();
			speechUtterance = null;
		}
		narrationAnimating = false;
	}

	/** 朗读当前步骤；读完后推进动画（旁白驱动） */
	function playNarrationStep() {
		const s = currentStep;
		if (!s) return;
		const text = narrationTextFor(s);
		if (!text) {
			advanceAfterNarration();
			return;
		}
		const done = () => {
			currentAudio = null;
			speechUtterance = null;
			advanceAfterNarration();
		};
		// 优先预录音频（MiMo 神经语音）
		const url = audioUrlFor(s.type, text);
		if (url) {
			const a = new Audio(url);
			currentAudio = a;
			a.onended = done;
			a.onerror = done; // 音频加载失败 → 照常前进（不阻断讲授）
			void a.play().catch(done);
			return;
		}
		// 回落：Web Speech 文本朗读
		if (typeof speechSynthesis !== 'undefined' && speechSynthesis.getVoices().length > 0) {
			const u = new SpeechSynthesisUtterance(text);
			speechUtterance = u;
			u.lang = 'zh-CN';
			u.rate = Math.min(2, Math.max(0.5, speed));
			u.onend = done;
			u.onerror = done;
			speechSynthesis.speak(u);
			return;
		}
		// 无任何语音能力 → 直接推进
		advanceAfterNarration();
	}

	/** 旁白读完：播放当前步骤到下一步的动画（若已到最后则结束） */
	function advanceAfterNarration() {
		if (!narrationOn || !isPlaying) return;
		if (currentStepIdx >= engine.totalSteps - 1) {
			isPlaying = false;
			return;
		}
		narrationAnimating = true;
		timeline.tweenToStep(currentStepIdx + 1);
	}

	function toggleNarration() {
		narrationOn = !narrationOn;
		if (!narrationOn) {
			stopNarration();
		}
	}

	function enterProjector() {
		if (activeQuestion !== null) return;
		pause();
		mode = 'demo';
		projector = true;
		showScriptMenu = false; // 投影时收起剧本菜单，避免退出后状态错位
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
		lastAppliedInput = { kind: 'preset', name };
		showPresetModal = false;
		try {
			engine.applyPreset?.(name);
			engineError = '';
		} catch (e) {
			engineError = (e as Error).message;
			return;
		}
		rebuildAfterEngineChange();
	}

	function applyCustom() {
		try {
			engine.applyCustom?.(customValues);
			engineError = '';
		} catch (e) {
			customError = (e as Error).message;
			return;
		}
		lastAppliedInput = { kind: 'custom', values: { ...customValues } };
		showCustomModal = false;
		rebuildAfterEngineChange();
	}

	// === 手动模拟练习（动手模式） ===
	// 数组引擎：预测交换，点击画布两个柱子；树/图引擎：预测下一步动作，选项选择
	let handsOn = $state(false); // 动手模式开关
	let predictActive = $state(false); // 正在等待用户选择
	let selected = $state<number[]>([]); // 用户已选的柱下标
	let expectedSwap = $state<number[]>([]); // 引擎预期的交换下标
	let predictMsg = $state(''); // 反馈信息
	let predictOk = $state(false); // 最近一次判定是否正确
	let predictOptions = $state<string[]>([]); // 动作预测选项（树/图引擎）
	let predictAnswer = $state(-1); // 正确选项下标
	const isArrayEngine = $derived(engine.renderType === 'array');

	function toggleHandsOn() {
		handsOn = !handsOn;
		predictActive = false;
		selected = [];
		predictMsg = '';
		predictOk = false;
		if (handsOn) seekToNextAction();
	}

	/** 向后扫描找下一个"可预测"步骤：数组引擎找 swap（柱点击），树/图找关键动作（选项） */
	function seekToNextAction() {
		if (!timeline.hasTimeline) return;
		for (let i = currentStepIdx + 1; i < engine.steps.length; i++) {
			const s = engine.steps[i];
			if (isArrayEngine && s.type === 'swap' && i > 0) {
				const target = i - 1;
				pause();
				timeline.killControlTweens();
				timeline.seekToStep(target);
				currentStepIdx = target;
				playbackPos = target;
				const swapHl = s.highlights.find((h) => h.type === 'swap');
				expectedSwap = swapHl ? [...swapHl.indices] : [];
				selected = [];
				predictActive = expectedSwap.length === 2;
				predictMsg = predictActive ? '预测下一步：这两个元素会被交换。点击画布上的两个柱子。' : '';
				predictOk = false;
				return;
			}
			if (!isArrayEngine && i > 0 && (s.type === 'pivot-select' || s.type === 'edge-select')) {
				const target = i - 1;
				pause();
				timeline.killControlTweens();
				timeline.seekToStep(target);
				currentStepIdx = target;
				playbackPos = target;
				// 生成选项：正确动作 vs 干扰
				const actionMap: Record<string, { correct: string; wrong: string[] }> = {
					'pivot-select': {
						correct: '检测到失衡/需要调整：进行旋转或变色',
						wrong: ['继续正常比较', '本轮结束']
					},
					'edge-select': {
						correct: '这一步会选中它（添加边/命中）',
						wrong: ['这一步会跳过它', '这一步什么都不做']
					}
				};
				const def = actionMap[s.type];
				const opts = [def.correct, ...def.wrong];
				predictOptions = opts;
				predictAnswer = 0;
				selected = [];
				predictActive = true;
				predictMsg = '预测下一步操作（' + engine.name + '）：';
				predictOk = false;
				return;
			}
		}
		predictActive = false;
		predictMsg = '';
	}

	/** 用户点击柱子（数组引擎） */
	function handleBarClick(idx: number) {
		if (!predictActive) return;
		if (selected.includes(idx)) {
			selected = selected.filter((x) => x !== idx);
			return;
		}
		const next = [...selected, idx];
		if (next.length < 2) {
			selected = next;
			return;
		}
		selected = next;
		const a = [...next].sort((x, y) => x - y);
		const b = [...expectedSwap].sort((x, y) => x - y);
		const ok = a.length === b.length && a.every((v, i) => v === b[i]);
		predictOk = ok;
		predictMsg = ok
			? '正确！下一步确实交换这两个元素。点击「继续」看动画。'
			: '不对。交换的是位置 ' +
				b.map((v) => v + 1).join(' 和 ') +
				'。点击「重试」再试一次，或「跳过」看演示。';
	}

	/** 用户选择动作选项（树/图引擎） */
	function handleActionSelect(optIdx: number) {
		if (!predictActive) return;
		const ok = optIdx === predictAnswer;
		predictOk = ok;
		selected = [optIdx];
		predictMsg = ok
			? '正确！点击「继续」看这一步。'
			: '不对，' + predictOptions[predictAnswer] + '。可「重试」或「跳过」。';
	}

	function continueAfterPredict() {
		if (!handsOn) return;
		const target = Math.min(engine.totalSteps - 1, currentStepIdx + 1);
		pause();
		timeline.killControlTweens();
		timeline.tweenToStep(target);
		currentStepIdx = target;
		playbackPos = target;
		predictActive = false;
		selected = [];
		predictMsg = '';
		setTimeout(() => {
			if (handsOn && !isPlaying) seekToNextAction();
		}, 600);
	}

	function retryPredict() {
		selected = [];
		predictOk = false;
		predictMsg = isArrayEngine
			? '再试一次：点击两个会被交换的元素。'
			: '再试一次：选择正确的下一步操作。';
	}

	function skipPredict() {
		continueAfterPredict();
	}

	// === 状态分享快照：当前输入 + 位置 + 速度 + 断点 编码进 URL（?s=...） ===
	type ShareInput =
		{ kind: 'preset'; name: string } | { kind: 'custom'; values: Record<string, string> };
	let lastAppliedInput = $state<ShareInput | null>(null);
	let shareMsg = $state('');
	let pendingRestore: { step?: number; speed?: number; breakpoints?: number[] } | null = null;

	function toB64(s: string): string {
		const bytes = new TextEncoder().encode(s);
		let bin = '';
		for (const b of bytes) bin += String.fromCharCode(b);
		return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}

	function fromB64(s: string): string {
		const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
		const bin = atob(b64);
		const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	}

	function copyShareLink() {
		const payload: Record<string, unknown> = {};
		if (lastAppliedInput?.kind === 'preset') payload.p = lastAppliedInput.name;
		else if (lastAppliedInput?.kind === 'custom') payload.c = lastAppliedInput.values;
		if (currentStepIdx > 0) payload.i = currentStepIdx;
		if (speed !== 1) payload.sp = speed;
		if (breakpoints.size > 0) payload.b = [...breakpoints];
		const url = location.origin + location.pathname + '?s=' + toB64(JSON.stringify(payload));
		void navigator.clipboard.writeText(url).then(
			() => {
				shareMsg = '分享链接已复制：打开即恢复当前输入与位置';
				setTimeout(() => (shareMsg = ''), 3000);
			},
			() => {
				shareMsg = '复制失败，请手动复制地址栏链接';
				setTimeout(() => (shareMsg = ''), 3000);
			}
		);
	}

	/** 打开分享链接时恢复：输入 → 重建（revision effect）→ 位置/速度/断点 */
	function applyPendingRestore() {
		if (!pendingRestore) return;
		const r = pendingRestore;
		pendingRestore = null;
		if (r.speed && r.speed !== 1) speed = r.speed;
		if (r.breakpoints?.length) breakpoints = new Set(r.breakpoints);
		if (r.step && r.step > 0 && timeline.hasTimeline) {
			const target = Math.min(r.step, engine.totalSteps - 1);
			timeline.seekToStep(target);
			currentStepIdx = target;
			playbackPos = target;
		}
	}

	function restoreFromShareUrl() {
		if (typeof window === 'undefined') return;
		const s = new URLSearchParams(location.search).get('s');
		if (!s) return;
		try {
			const payload = JSON.parse(fromB64(s)) as {
				p?: string;
				c?: Record<string, string>;
				i?: number;
				sp?: number;
				b?: number[];
			};
			pendingRestore = {
				step: payload.i,
				speed: payload.sp,
				breakpoints: payload.b
			};
			if (payload.p) {
				applyPreset(payload.p);
			} else if (payload.c && engine.customConfig) {
				customValues = payload.c;
				applyCustom();
			} else {
				// 无输入信息：直接恢复位置（走 revision effect 的 build 分支）
				engineRevision++;
			}
		} catch {
			// URL 解析失败 → 静默忽略（用户正常访问）
		}
	}

	function rebuildAfterEngineChange() {
		pause();
		practice.reset();
		activeQuestion = null;
		engineRevision++;
	}

	let canvasBodyRef = $state<HTMLDivElement | null>(null);

	// 控制 tween（步进/跳转）期间在画布容器上暴露忙闲信号，供 E2E 轮询等待
	// tween 完成（替代固定 sleep；tween 未完成时 floor(playbackPos) 偏小会导致
	// 下一步跳到旧位置，是历史 flaky 根因）。
	function beginControlTween() {
		if (canvasBodyRef) canvasBodyRef.dataset.tweenBusy = 'true';
	}
	function endControlTween() {
		if (canvasBodyRef) canvasBodyRef.dataset.tweenBusy = 'false';
	}

	// 控制器创建：engine prop 在播放器生命周期内不变，此 effect 只在挂载时运行一次
	$effect(() => {
		practice = new PracticeController(engine);
		timeline = new TimelineController(engine, {
			onProgress: (pos) => {
				playbackPos = pos;
				engine.setProgress(pos);
				if (isPlaying) {
					checkPracticeAt(Math.floor(pos));
				}
			},
			onStep: (idx) => {
				currentStepIdx = idx;
				// 断点：到达断点伪代码行自动暂停（模拟调试器）
				const stepAt = engine.steps[idx];
				if (stepAt && breakpoints.has(stepAt.pseudocodeLine)) {
					pause();
				}
			},
			onFinished: () => {
				isPlaying = false;
			},
			onTweenStart: beginControlTween,
			onTweenEnd: () => {
				endControlTween();
				// 旁白驱动：动画播完 → 进入下一步 → 朗读下一步
				if (narrationAnimating) {
					narrationAnimating = false;
					currentStepIdx += 1;
					if (narrationOn && isPlaying) {
						playNarrationStep();
					}
				}
			}
		});
	});

	// === 演示 / 练习模式 ===
	// demo：纯播放，不弹题；practice：播放到练习步骤暂停出题

	let mode = $state<'demo' | 'practice'>('demo');

	function checkPracticeAt(stepId: number) {
		if (projector) return;
		if (mode !== 'practice') return;
		if (activeQuestion !== null) return;
		const question = practice.findQuestionAt(stepId);
		if (question) {
			pause();
			activeQuestion = question;
		}
	}

	function handlePracticeAnswered(result: { correct: boolean; answer: string }) {
		if (activeQuestion === null) return;
		practice.recordAnswer(result, activeQuestion, topicId, topicName);
	}

	function handlePracticeContinue() {
		activeQuestion = null;
	}

	function play() {
		if (!timeline.hasTimeline || engine.steps.length < 2) return;
		if (activeQuestion !== null) return;
		if (currentStepIdx >= engine.totalSteps - 1) {
			timeline.seekStart();
			currentStepIdx = 0;
			playbackPos = 0;
		}
		// 朗读模式：不走时间线连续播放，改为「朗读 → 动画 → 朗读」闭环
		if (narrationOn) {
			isPlaying = true;
			playNarrationStep();
			return;
		}
		timeline.play(speed);
		isPlaying = true;
	}

	function pause() {
		if (!timeline.hasTimeline) return;
		timeline.pause();
		isPlaying = false;
		stopNarration();
	}

	function prev() {
		if (!timeline.hasTimeline) return;
		if (activeQuestion !== null) return;
		pause();
		timeline.killControlTweens();
		const target = Math.max(0, Math.floor(playbackPos) - 1);
		timeline.tweenToStep(target);
		currentStepIdx = target;
	}

	function next() {
		if (!timeline.hasTimeline) return;
		if (activeQuestion !== null) return;
		pause();
		timeline.killControlTweens();
		const target = Math.min(engine.totalSteps - 1, Math.floor(playbackPos) + 1);
		timeline.tweenToStep(target);
		currentStepIdx = target;
		checkPracticeAt(target);
	}

	function reset() {
		if (!timeline.hasTimeline) return;
		if (activeQuestion !== null) return;
		pause();
		timeline.killControlTweens();
		endControlTween(); // kill 不会触发 onComplete，需显式复位忙闲信号
		timeline.seekStart();
		currentStepIdx = 0;
		playbackPos = 0;
		engine.reset();
	}

	function jumpTo(step: number) {
		if (!timeline.hasTimeline) return;
		if (activeQuestion !== null) return;
		pause();
		timeline.killControlTweens();
		// seek 瞬时跳转（进度条拖拽/End 键用，无需 busy 信号）
		timeline.seekToStep(step);
		currentStepIdx = step;
		playbackPos = step;
		checkPracticeAt(step);
		if (narrationOn) playNarrationStep();
	}

	function changeSpeed(newSpeed: number) {
		speed = newSpeed;
		if (timeline.hasTimeline && isPlaying) {
			timeline.play(speed); // 播放中改速：重设 timeScale 并继续播放
		}
	}

	$effect(() => {
		if (engineRevision >= 0 && engine.steps.length > 0) {
			practice.reset();
			activeQuestion = null;
			tick().then(() => {
				// 销毁延后到淡出完成——避免「无时间线空窗」吞掉用户操作
				//（anime onComplete 走 Engine tick，冷启动时空窗可达秒级）
				if (engineRevision === 0 || !canvasBodyRef || prefersReducedMotion()) {
					if (engineRevision > 0 && timeline.hasTimeline) timeline.destroy();
					timeline.build();
					currentStepIdx = 0;
					playbackPos = 0;
					applyPendingRestore();
					return;
				}
				const fadeEl = canvasBodyRef;
				animate(fadeEl, {
					opacity: [1, 0],
					duration: 120,
					ease: 'inQuad',
					onComplete: () => {
						if (timeline.hasTimeline) timeline.destroy();
						timeline.build();
						currentStepIdx = 0;
						playbackPos = 0;
						applyPendingRestore();
						animate(fadeEl, {
							opacity: [0, 1],
							duration: 240,
							ease: 'outQuad',
							onComplete: () => fadeEl?.style.removeProperty('opacity')
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
			timeline.build();
		}
		// 分享链接恢复：读 ?s= 参数（输入变化会走 revision effect 重建）
		restoreFromShareUrl();
		// 水合完成信号（e2e waitForSelector 锚点，替代 click-and-pray 探测）
		canvasBodyRef?.closest('.algo-player')?.setAttribute('data-ready', '1');
	});

	onDestroy(() => {
		// SSR 卸载时 $effect 未运行（timeline/practice 未创建），可选链守卫
		timeline?.destroy();
		stopNarration();
		if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
	});

	// 依赖 engineRevision：重建引擎后 steps 引用变化，即使 currentStepIdx 数值不变，
	// 也必须重新求值（否则状态栏/旁白滞留旧引擎的文案）
	let currentStep = $derived.by(() => {
		void engineRevision;
		return engine.steps[Math.min(currentStepIdx, engine.steps.length - 1)];
	});

	// === 讲授旁白：优先步骤级 presenterNote，回落到「剧本」按步骤类型匹配 ===
	// 剧本 = 外部导入的覆盖（localStorage 按引擎名持久化）或引擎默认 demoScript
	// eslint-disable-next-line svelte/prefer-writable-derived -- 剧本状态同时被导入/重置事件写入，不能是纯 derived
	let scriptOverride = $state<DemoScriptItem[] | null>(null);
	let scriptMsg = $state('');
	let scriptError = $state('');
	let scriptFileInput: HTMLInputElement | undefined = $state();
	let showScriptMenu = $state(false);

	$effect(() => {
		scriptOverride = loadScriptOverride(engine.name);
	});

	const effectiveScript = $derived(scriptOverride ?? engine.demoScript);

	let projectorNarration = $derived.by(() => {
		const s = currentStep;
		if (!s) return '';
		if (s.presenterNote) return s.presenterNote;
		return effectiveScript?.find((m) => m.type === s.type)?.narration ?? '';
	});

	function exportScript() {
		const items = effectiveScript ?? [];
		const json = serializeScript(items, engine.name);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `structvis-script-${engine.name}.json`;
		a.click();
		URL.revokeObjectURL(url);
		scriptMsg = `已导出 ${items.length} 条旁白（当前生效剧本）。`;
		scriptError = '';
	}

	function importScriptFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const parsed = parseScript(String(reader.result ?? ''));
				saveScriptOverride(engine.name, parsed.items);
				scriptOverride = parsed.items;
				scriptMsg = `剧本导入成功（${parsed.items.length} 条旁白${parsed.name ? '：「' + parsed.name + '」' : ''}）。`;
				scriptError = '';
			} catch (err) {
				scriptError = (err as Error).message;
				scriptMsg = '';
			}
		};
		reader.readAsText(file);
		if (scriptFileInput) scriptFileInput.value = '';
	}

	function resetScript() {
		saveScriptOverride(engine.name, null);
		scriptOverride = null;
		scriptMsg = '已恢复引擎默认剧本。';
		scriptError = '';
	}

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

	// 弹窗打开时把初始焦点移入卡片（模态 a11y）
	$effect(() => {
		if (showPresetModal) {
			tick().then(() => presetModalCard?.focus());
		} else if (showCustomModal) {
			tick().then(() => customModalCard?.focus());
		}
	});

	// 浏览器全屏被外部退出（用户按 Esc，事件被浏览器消费、页面收不到 keydown）时
	// 同步退出投影层——否则需要按两次 Esc 才能退出投影。
	$effect(() => {
		function onFullscreenChange() {
			if (!document.fullscreenElement && projector) {
				projector = false;
			}
		}
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
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
									data-coach="preset"
									onclick={openPresetModal}
									title="选择演示数据"
								>
									{activePresetName || '演示数据'}
									<span class="caret"></span>
								</button>
							{/if}
							{#if engine.customConfig}
								<button
									class="title-btn"
									data-coach="custom"
									onclick={openCustomModal}
									title="自定义输入">自定义</button
								>
							{/if}
							<button
								class="title-btn"
								data-coach="share"
								onclick={copyShareLink}
								title="复制分享链接：打开即恢复当前输入与步骤">分享</button
							>
							{#if shareMsg}
								<span class="share-msg" aria-live="polite">{shareMsg}</span>
							{/if}
						</div>
					{/if}
				</div>
				<div class="header-right">
					<button
						class="pj-entry help-entry"
						title="功能速查 (?)"
						aria-label="功能速查"
						onclick={() => (helpOpen = true)}
					>
						?
					</button>
					<button
						class="pj-entry {handsOn ? 'active' : ''}"
						data-coach="hands-on"
						onclick={toggleHandsOn}
						title="动手模式：预测每一步的交换，亲手点击两个柱子"
					>
						动手
					</button>
					{#if effectiveScript?.length}
						<button
							class="pj-entry"
							data-coach="projector"
							onclick={enterProjector}
							title="演示投影模式（全屏讲授）">投影</button
						>
						<div class="script-menu-wrap">
							<button
								class="pj-entry {scriptOverride ? 'active' : ''}"
								data-coach="script"
								onclick={() => (showScriptMenu = !showScriptMenu)}
								title="讲授剧本：导入 / 导出 / 重置"
							>
								剧本
							</button>
							{#if showScriptMenu}
								<div class="script-menu" role="menu" aria-label="讲授剧本">
									<button role="menuitem" onclick={exportScript}>导出当前剧本</button>
									<button role="menuitem" onclick={() => scriptFileInput?.click()}>导入剧本…</button
									>
									{#if scriptOverride}
										<button role="menuitem" onclick={resetScript}>恢复默认剧本</button>
									{/if}
									<input
										bind:this={scriptFileInput}
										type="file"
										accept="application/json,.json"
										class="hidden-file"
										onchange={importScriptFile}
									/>
									{#if scriptMsg}
										<div class="script-msg" aria-live="polite">{scriptMsg}</div>
									{/if}
									{#if scriptError}
										<div class="script-err" role="alert">{scriptError}</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
					<div class="mode-switch" role="tablist" aria-label="播放模式" data-coach="mode">
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
				<!-- data-tween-busy：控制 tween（步进/跳转）进行中为 true，供 E2E 轮询等待 -->
				<div class="canvas-body" bind:this={canvasBodyRef} data-tween-busy="false">
					{#if !projector}
						{#if engineError}
							<div class="engine-error" role="alert">{engineError}</div>
						{:else}
							<!-- 投影时卸载主区渲染器，避免双实例双份重绘/监听 -->
							<RendererSwitch
								{engine}
								{playbackPos}
								onBarClick={handleBarClick}
								clickSelected={selected}
							/>
						{/if}
					{/if}
				</div>
			{/key}

			<!-- 底部状态栏（字幕式步骤说明 + 复杂度计数器） -->
			<div class="status-bar">
				<span class="status-text" aria-live="polite">{currentStep?.description || 'Ready'}</span>
				{#if showOps}
					<span class="op-count" aria-label="操作计数">
						比较 {compareCount} · 交换 {swapCount}
					</span>
				{/if}
			</div>

			<!-- 动手模式：预测提示条 -->
			{#if handsOn}
				<div
					class="predict-bar"
					class:correct={predictOk}
					class:wrong={predictOk === false &&
						(isArrayEngine ? selected.length === 2 : selected.length > 0)}
				>
					<span class="predict-msg"
						>{predictMsg ||
							(isArrayEngine
								? '动手模式：即将交换的两个元素，点击画布预测。'
								: '动手模式：预测下一步操作。')}</span
					>
					{#if predictActive && !isArrayEngine && predictOptions.length > 0 && !predictOk}
						<div class="predict-options">
							{#each predictOptions as opt, i (i)}
								<button
									class="btn btn-ghost btn-sm"
									class:predict-opt-selected={selected.includes(i)}
									onclick={() => handleActionSelect(i)}
								>
									{opt}
								</button>
							{/each}
						</div>
					{/if}
					{#if predictMsg && (isArrayEngine ? selected.length === 2 : selected.length > 0)}
						<div class="predict-actions">
							{#if predictOk}
								<button class="btn btn-accent btn-sm" onclick={continueAfterPredict}>继续</button>
							{:else if !isArrayEngine}
								<button class="btn btn-ghost btn-sm" onclick={retryPredict}>重试</button>
								<button class="btn btn-ghost btn-sm" onclick={skipPredict}>跳过</button>
							{:else}
								<button class="btn btn-ghost btn-sm" onclick={retryPredict}>重试</button>
								<button class="btn btn-ghost btn-sm" onclick={skipPredict}>跳过</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- 右侧：伪代码 -->
		<div class="right-panel">
			<div class="panel-header">
				<span class="panel-title"
					>{engine.panelTitle ?? (engine.renderType === 'sql-table' ? '执行计划' : '伪代码')}</span
				>
			</div>
			<div class="panel-body">
				<PseudocodePanel
					lines={engine.pseudocode}
					activeLine={currentStep?.pseudocodeLine ?? 0}
					{breakpoints}
					onToggleBreakpoint={(line) => {
						breakpoints = new Set(breakpoints);
						if (breakpoints.has(line)) {
							breakpoints.delete(line);
						} else {
							breakpoints.add(line);
						}
					}}
				/>
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
				tabindex="-1"
				bind:this={presetModalCard}
				transition:fly={{
					y: prefersReducedMotion() ? 0 : 12,
					duration: prefersReducedMotion() ? 0 : 240,
					easing: expoOut
				}}
			>
				<header class="modal-header">
					<span class="modal-title">演示数据</span>
					<button class="modal-close" aria-label="关闭" onclick={() => (showPresetModal = false)}>
						<svg
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg
						>
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
				tabindex="-1"
				bind:this={customModalCard}
				transition:fly={{
					y: prefersReducedMotion() ? 0 : 12,
					duration: prefersReducedMotion() ? 0 : 240,
					easing: expoOut
				}}
			>
				<header class="modal-header">
					<span class="modal-title">{engine.customConfig.title ?? '自定义数据'}</span>
					<button class="modal-close" aria-label="关闭" onclick={() => (showCustomModal = false)}>
						<svg
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg
						>
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
					<button
						class="pj-btn"
						class:pj-on={narrationOn}
						onclick={toggleNarration}
						title="朗读旁白：读当前步骤讲解，读完自动前进到下一步（已生成 MiMo 语音）"
					>
						{narrationOn ? '朗读中' : '朗读'}
					</button>
					<button class="pj-btn pj-exit" onclick={exitProjector} title="退出投影 (Esc)"
						>退出投影</button
					>
				</div>
			</header>

			<main class="projector-body">
				<!-- steps 引用变化时渲染器由 props 驱动重绘，无需 {#key} 强制重建 -->
				<RendererSwitch
					{engine}
					{playbackPos}
					onBarClick={handleBarClick}
					clickSelected={selected}
				/>
			</main>

			<footer class="projector-footer">
				<div class="pj-narration">{projectorNarration || currentStep?.description || 'Ready'}</div>
				<div class="pj-actions">
					<button class="pj-ctrl" onclick={reset} title="重置 (Home)" aria-label="重置 (Home)"
						><svg
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							><polyline points="2 5 2 9 6 9"></polyline><path d="M3.5 12a6 6 0 1 0 1.5-7L2 9"
							></path></svg
						></button
					>
					<button class="pj-ctrl" onclick={prev} title="上一步 (←)" aria-label="上一步 (←)"
						><svg viewBox="0 0 16 16" fill="currentColor"
							><polygon points="10 3 4 8 10 13 10 3"></polygon><rect
								x="2"
								y="3"
								width="2"
								height="10"
								rx="1"
							></rect></svg
						></button
					>
					<button
						class="pj-ctrl pj-play"
						onclick={isPlaying ? pause : play}
						title="播放 / 暂停 (Space)"
						aria-label={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
					>
						{#if isPlaying}<svg viewBox="0 0 16 16" fill="currentColor"
								><rect x="4" y="3" width="2.5" height="10" rx="1"></rect><rect
									x="9.5"
									y="3"
									width="2.5"
									height="10"
									rx="1"
								></rect></svg
							>{:else}<svg viewBox="0 0 16 16" fill="currentColor"
								><polygon points="5 3 13 8 5 13 5 3"></polygon></svg
							>{/if}
					</button>
					<button class="pj-ctrl" onclick={next} title="下一步 (→)" aria-label="下一步 (→)"
						><svg viewBox="0 0 16 16" fill="currentColor"
							><polygon points="6 3 12 8 6 13 6 3"></polygon><rect
								x="12"
								y="3"
								width="2"
								height="10"
								rx="1"
							></rect></svg
						></button
					>
					<button
						class="pj-ctrl"
						onclick={() => jumpTo(engine.totalSteps - 1)}
						title="到最后 (End)"
						aria-label="到最后 (End)"
						><svg viewBox="0 0 16 16" fill="currentColor"
							><polygon points="9 3 3 8 9 13 9 3"></polygon><polygon points="13 3 7 8 13 13 13 3"
							></polygon></svg
						></button
					>
				</div>
				<div class="pj-hints">Esc 退出 · 空格 播放 / 暂停 · ← → 步进</div>
			</footer>
		</div>
	{/if}

	<HelpSheet open={helpOpen} onClose={() => (helpOpen = false)} />
	<CoachMarkLayer />
</div>

<svelte:window
	onkeydown={(e) => {
		const target = e.target as HTMLElement;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

		// ? 唤起功能速查（非投影态；投影态已有完整键盘体系）
		if (e.key === '?' && !projector) {
			helpOpen = !helpOpen;
			return;
		}

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
		-webkit-backdrop-filter: blur(14px) saturate(1.5);
		backdrop-filter: blur(14px) saturate(1.5);
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
		display: inline-block;
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 5px solid currentColor;
		opacity: 0.7;
		margin-left: 6px;
	}

	.share-msg {
		font-family: var(--font-body);
		font-size: 12px;
		color: var(--color-success);
		white-space: nowrap;
	}

	/* 投影模式入口按钮 */
	.pj-entry {
		padding: 4px 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-accent-text);
		background: transparent;
		border: 1px solid var(--color-accent);
		border-radius: 6px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.help-entry {
		min-width: 30px;
		padding-inline: 9px;
	}

	.pj-entry:hover {
		background: var(--color-accent);
		color: var(--color-paper);
	}

	.pj-entry.active {
		background: var(--color-accent);
		color: var(--color-paper);
	}

	.script-menu-wrap {
		position: relative;
	}

	.script-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		z-index: 40;
		min-width: 200px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px;
		background: var(--color-surface);
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-md);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			0 8px 32px rgba(0, 0, 0, 0.08);
	}

	.script-menu button {
		text-align: left;
		padding: 8px 10px;
		font-size: 13px;
		color: var(--color-ink-2);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background 120ms var(--ease-out);
	}

	.script-menu button:hover {
		background: var(--color-subtle);
		color: var(--color-ink);
	}

	.script-menu .hidden-file {
		display: none;
	}

	.script-msg {
		padding: 6px 10px;
		font-size: 12px;
		color: var(--color-success);
	}

	.script-err {
		padding: 6px 10px;
		font-size: 12px;
		color: var(--color-danger);
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
		color: var(--color-ink-2);
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
		color: var(--color-ink-2);
	}

	.meta-step .current-num {
		color: var(--color-accent-text);
		font-weight: 600;
	}

	.meta-step .total-num {
		color: var(--color-ink-2);
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.status-text {
		font-size: 13px;
		color: var(--color-ink-2);
		line-height: 1.5;
	}

	/* 复杂度计数器 */
	.op-count {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-2);
		letter-spacing: 0.04em;
	}

	/* 动手模式：预测提示条 */
	.predict-bar {
		padding: 10px 24px;
		border-top: 1px solid var(--color-line-hair);
		background: rgba(217, 119, 6, 0.05);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 13px;
		color: var(--color-ink);
	}

	.predict-bar.correct {
		background: rgba(45, 106, 79, 0.08);
	}

	.predict-bar.wrong {
		background: rgba(155, 34, 38, 0.06);
	}

	.predict-msg {
		line-height: 1.5;
	}

	.predict-actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.predict-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		flex-shrink: 0;
	}

	.predict-opt-selected {
		border-color: var(--color-accent) !important;
		color: var(--color-accent-text) !important;
	}

	.engine-error {
		padding: 12px 16px;
		font-size: 13px;
		color: var(--color-danger);
		background: rgba(155, 34, 38, 0.06);
		border: 1px solid rgba(155, 34, 38, 0.25);
		border-radius: var(--radius-sm);
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
		color: var(--color-ink-2);
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
		background: var(--color-scrim);
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
		color: var(--color-ink-2);
	}

	.modal-close {
		border: none;
		background: transparent;
		color: var(--color-ink-2);
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
		color: var(--color-ink-2);
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
		color: var(--color-ink-2);
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.projector-step .pj-num {
		color: var(--color-accent-text);
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

	/* 朗读开关激活态 */
	.pj-on {
		border-color: var(--color-accent);
		color: var(--color-accent-text);
		background: rgba(217, 119, 6, 0.08);
	}

	.pj-on:hover {
		border-color: var(--color-accent);
		color: var(--color-accent-text);
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

	.pj-ctrl svg {
		width: 16px;
		height: 16px;
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
		color: var(--color-ink-2);
	}

	@media (max-width: 900px) {
		.workspace {
			grid-template-columns: 1fr;
			height: auto;
		}

		/* 竖屏：画布优先（62vh），伪代码 38vh 可横滚 */
		.canvas-area {
			border-right: none;
			border-bottom: 1px solid var(--color-line-hair);
			height: min(62vh, 480px);
		}

		.right-panel {
			height: min(38vh, 340px);
		}

		.panel-body {
			align-items: flex-start;
			justify-content: flex-start;
			overflow-x: auto;
			padding: 12px 0;
		}
	}

	/* 投影模式：窄屏紧凑布局（移动端降级：无全屏 API 时覆盖层即全屏） */
	@media (max-width: 900px) {
		.projector-header {
			padding: 10px 16px;
			gap: 8px;
			flex-wrap: wrap;
		}

		.projector-title {
			font-size: 18px;
		}

		.projector-step {
			font-size: 12px;
		}

		.projector-btns {
			gap: 4px;
		}

		.projector-body {
			padding: 8px;
		}

		.pj-narration {
			font-size: 16px;
			line-height: 1.55;
			padding: 0 8px;
		}

		.projector-footer {
			padding: 12px 16px;
			gap: 10px;
		}
	}
</style>
