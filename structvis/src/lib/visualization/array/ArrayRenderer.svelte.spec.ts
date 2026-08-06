import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import ArrayRenderer from './ArrayRenderer.svelte';
import {
	resetCanvasMock,
	textsDrawn,
	textDrawnWithStyle,
	canvasCalls
} from '../../../test/canvas-mock';
import type { AlgorithmStep } from '$lib/engines/algorithm/types';

// 颜色断言值 = test-setup 注入的 token 值
const ACCENT = '#D97706'; // --color-accent（current / pointer-i）
const ACADEMIC = '#1B4965'; // --color-academic（compare / pointer-j）
const DANGER = '#9B2226'; // --color-danger（pivot / swap）
const SUCCESS = '#2D6A4F'; // --color-success（sorted）

function makeStep(overrides: Partial<AlgorithmStep> = {}): AlgorithmStep {
	return {
		id: 0,
		type: 'compare',
		description: '',
		data: [5, 3, 8, 1],
		highlights: [],
		pseudocodeLine: 0,
		...overrides
	};
}

async function mountAndDraw(steps: AlgorithmStep[]) {
	const { container } = render(ArrayRenderer, {
		props: { steps, playbackPos: steps.length - 1 }
	});
	await tick();
	return container;
}

beforeEach(() => {
	resetCanvasMock();
});

afterEach(() => cleanup());

describe('ArrayRenderer 基础绘制', () => {
	it('绘制全部柱子数值与底部索引', async () => {
		await mountAndDraw([makeStep()]);
		const texts = textsDrawn();
		for (const v of ['5', '3', '8', '1']) {
			expect(texts).toContain(v);
		}
		for (const idx of ['[0]', '[1]', '[2]', '[3]']) {
			expect(texts).toContain(idx);
		}
	});

	it('基线绘制触发 moveTo/lineTo 与 clearRect', async () => {
		await mountAndDraw([makeStep()]);
		const methods = canvasCalls().map((c) => c.method);
		expect(methods).toContain('clearRect');
		expect(methods.filter((m) => m === 'moveTo').length).toBeGreaterThan(0);
		expect(methods.filter((m) => m === 'lineTo').length).toBeGreaterThan(0);
	});
});

describe('ArrayRenderer 高亮颜色映射', () => {
	it('compare 高亮：柱子数值用学术蓝，且不叠覆盖 pivot/sorted', async () => {
		await mountAndDraw([makeStep({ highlights: [{ type: 'compare', indices: [1, 2] }] })]);
		expect(textDrawnWithStyle('3')[0]?.fillStyle).toBe(ACADEMIC);
		expect(textDrawnWithStyle('8')[0]?.fillStyle).toBe(ACADEMIC);
		expect(textDrawnWithStyle('5')[0]?.fillStyle).toBe('#9A9A9A');
	});

	it('sorted 高亮：柱子数值用成功绿', async () => {
		await mountAndDraw([makeStep({ highlights: [{ type: 'sorted', indices: [0, 1] }] })]);
		expect(textDrawnWithStyle('5')[0]?.fillStyle).toBe(SUCCESS);
		expect(textDrawnWithStyle('3')[0]?.fillStyle).toBe(SUCCESS);
	});

	it('pivot 高亮：柱子数值用警示红', async () => {
		await mountAndDraw([makeStep({ highlights: [{ type: 'pivot', indices: [3] }] })]);
		expect(textDrawnWithStyle('1')[0]?.fillStyle).toBe(DANGER);
	});

	it('swap 高亮：数值用警示红', async () => {
		await mountAndDraw([makeStep({ highlights: [{ type: 'swap', indices: [0, 3] }] })]);
		expect(textDrawnWithStyle('5')[0]?.fillStyle).toBe(DANGER);
	});

	it('pointer-i / pointer-j 高亮：数值分别用 accent / 学术蓝', async () => {
		await mountAndDraw([makeStep({ highlights: [{ type: 'pointer-i', indices: [0] }] })]);
		expect(textDrawnWithStyle('5')[0]?.fillStyle).toBe(ACCENT);

		resetCanvasMock();
		await mountAndDraw([makeStep({ highlights: [{ type: 'pointer-j', indices: [2] }] })]);
		expect(textDrawnWithStyle('8')[0]?.fillStyle).toBe(ACADEMIC);
	});
});

describe('ArrayRenderer 指针标签与分区背景', () => {
	it('绘制 i / j / 基准 标签且颜色正确', async () => {
		await mountAndDraw([
			makeStep({
				highlights: [
					{ type: 'pointer-i', indices: [0] },
					{ type: 'pointer-j', indices: [2] },
					{ type: 'pivot', indices: [3] }
				]
			})
		]);
		expect(textDrawnWithStyle('i')[0]?.fillStyle).toBe(ACCENT);
		expect(textDrawnWithStyle('j')[0]?.fillStyle).toBe(ACADEMIC);
		expect(textDrawnWithStyle('基准')[0]?.fillStyle).toBe(DANGER);
	});

	it('partition 高亮触发虚线矩形与 fillRect', async () => {
		await mountAndDraw([makeStep({ highlights: [{ type: 'partition', indices: [0, 3] }] })]);
		const calls = canvasCalls();
		expect(calls.some((c) => c.method === 'setLineDash' && c.args[0] !== undefined)).toBe(true);
		const fills = calls.filter((c) => c.method === 'fillRect');
		expect(fills.length).toBeGreaterThan(0);
		expect(fills[0]?.state.fillStyle).toBe('rgba(27, 73, 101, 0.04)');
	});

	it('无高亮时不绘制任何指针标签', async () => {
		await mountAndDraw([makeStep()]);
		const texts = textsDrawn();
		expect(texts).not.toContain('i');
		expect(texts).not.toContain('j');
		expect(texts).not.toContain('基准');
	});
});

describe('ArrayRenderer 边界', () => {
	it('空 steps 不绘制（draw 提前返回）', async () => {
		await mountAndDraw([]);
		const methods = canvasCalls().map((c) => c.method);
		expect(methods).not.toContain('clearRect');
		expect(methods).not.toContain('fillText');
	});
});
