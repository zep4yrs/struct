/**
 * 数组可视化渲染器工具函数
 *
 * 处理柱状图的 Canvas 绘制，包含：
 * - 柱子位置补间插值（交换时平滑滑动）
 * - 颜色插值（高亮状态平滑过渡）
 * - 标签绘制（pivot、i、j 指针等）
 */

import type { AlgorithmStep, HighlightType } from '$lib/engines/algorithm/types';

/** 单个柱子的视觉状态 */
export interface VisualBar {
	id: number; // 唯一 ID（原始索引）
	value: number; // 数值（决定高度）
	x: number; // 当前 x 坐标
	y: number; // 当前 y 坐标（顶部）
	width: number;
	height: number;
	color: string; // 当前颜色
	label?: string; // 柱子上方标签
	subLabel?: string; // 柱子下方标签（索引）
}

/** 高亮颜色映射 — 从 CSS 变量读取 */
const HIGHLIGHT_COLORS: Record<HighlightType, string> = {
	pivot: 'var(--color-danger)',
	compare: 'var(--color-academic)',
	swap: 'var(--color-danger)',
	sorted: 'var(--color-success)',
	current: 'var(--color-accent)',
	partition: 'var(--color-academic)',
	'pointer-i': 'var(--color-accent)',
	'pointer-j': 'var(--color-academic)'
};

/** 普通柱子颜色 */
const DEFAULT_COLOR = 'var(--color-ink)';

/**
 * 预计算每一步的柱子 ID 映射
 *
 * 通过比较相邻步骤，追踪每个柱子（按原始索引）在每一步的位置。
 * 通用匹配策略（不止两元素交换）：
 * - 值相同优先继承（保持相对顺序），实现交换 / 单位置复制 / 区间重排的滑动动画
 * - 同一来源被多位置引用时，值未变化的位置让位（克隆新 id，原地淡入），变化位置继承原 id
 */
export function precomputeBarIdentities(steps: AlgorithmStep[]): number[][] {
	if (steps.length === 0) return [];

	const n = steps[0].data.length;
	// barIdsAtPosition[step][position] = barId (original index)
	const barIdsAtPosition: number[][] = [];

	// 第 0 步：位置 i 的柱子就是原始索引 i
	barIdsAtPosition[0] = Array.from({ length: n }, (_, i) => i);

	let cloneCounter = n;

	// 对每一步，比较和上一步的数据，算出哪些位置的柱子交换了
	for (let s = 1; s < steps.length; s++) {
		const prevData = steps[s - 1].data;
		const currData = steps[s].data;
		const prevIds = barIdsAtPosition[s - 1];
		const currIds = [...prevIds];

		// 找出数据变化的位置
		const changed: number[] = [];
		for (let i = 0; i < n; i++) {
			if (prevData[i] !== currData[i]) {
				changed.push(i);
			}
		}

		if (changed.length > 0) {
			const changedSet = new Set(changed);
			// id -> 当前占用位置（先登记所有未变化的位置）
			const holder = new Map<number, number>();
			for (let i = 0; i < n; i++) {
				if (!changedSet.has(i)) holder.set(prevIds[i], i);
			}

			const used = new Set<number>();
			for (const pos of changed) {
				const v = currData[pos];
				// 在上一轮变化位置中找第一个值相等且未被占用的来源
				let src = -1;
				for (const q of changed) {
					if (!used.has(q) && prevData[q] === v) {
						src = q;
						break;
					}
				}

				if (src < 0) {
					// 值找不到来源（理论上是新值），分配克隆 id（原地淡入）
					currIds[pos] = cloneCounter++;
					continue;
				}

				used.add(src);
				const id = prevIds[src];
				const existingPos = holder.get(id);

				if (existingPos === undefined) {
					holder.set(id, pos);
					currIds[pos] = id;
				} else if (prevData[existingPos] === currData[existingPos]) {
					// 占用者值未变：让位克隆，变化位置继承 id（产生滑动动画）
					holder.delete(id);
					holder.set(id, pos);
					currIds[existingPos] = cloneCounter++;
					currIds[pos] = id;
				} else {
					// 占用者也变了：新来者克隆
					currIds[pos] = cloneCounter++;
				}
			}
		}

		barIdsAtPosition[s] = currIds;
	}

	return barIdsAtPosition;
}

/**
 * 计算某一步中每个柱子的高亮颜色
 */
export function getBarColors(step: AlgorithmStep): Map<HighlightType, number[]> {
	const colorMap = new Map<HighlightType, number[]>();

	for (const hl of step.highlights) {
		const existing = colorMap.get(hl.type) || [];
		colorMap.set(hl.type, [...existing, ...hl.indices]);
	}

	return colorMap;
}

/**
 * 获取某个位置的柱子在当前步骤的颜色
 * 优先级：pivot > swap > compare > pointer-i > pointer-j > sorted > 默认
 */
export function getBarColorAtPosition(
	position: number,
	highlights: ReturnType<typeof getBarColors>
): string {
	const priority: HighlightType[] = [
		'pivot',
		'swap',
		'compare',
		'pointer-i',
		'pointer-j',
		'sorted',
		'partition',
		'current'
	];

	for (const type of priority) {
		const indices = highlights.get(type);
		if (indices && indices.includes(position)) {
			return HIGHLIGHT_COLORS[type];
		}
	}

	return DEFAULT_COLOR;
}

/**
 * 颜色插值 — 在两个颜色之间平滑过渡
 *
 * 输入是 CSS 变量名（如 'var(--color-accent)'），
 * 我们从 computed style 里解析出实际颜色值再插值。
 */
export function interpolateColor(
	colorA: string,
	colorB: string,
	progress: number,
	computedStyles: CSSStyleDeclaration
): string {
	// 解析 CSS 变量得到实际颜色
	const actualA = resolveColor(colorA, computedStyles);
	const actualB = resolveColor(colorB, computedStyles);

	if (!actualA || !actualB) return colorA;

	const r = Math.round(actualA.r + (actualB.r - actualA.r) * progress);
	const g = Math.round(actualA.g + (actualB.g - actualA.g) * progress);
	const b = Math.round(actualA.b + (actualB.b - actualA.b) * progress);

	return `rgb(${r}, ${g}, ${b})`;
}

function resolveColor(
	colorStr: string,
	computedStyles: CSSStyleDeclaration
): { r: number; g: number; b: number } | null {
	// 如果是 CSS 变量，先解析
	if (colorStr.startsWith('var(')) {
		const varName = colorStr.slice(4, -1).trim();
		const resolved = computedStyles.getPropertyValue(varName).trim();
		if (resolved) {
			return parseColor(resolved);
		}
		return null;
	}
	return parseColor(colorStr);
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
	// #RRGGBB
	if (color.startsWith('#')) {
		const hex = color.slice(1);
		if (hex.length === 6) {
			return {
				r: parseInt(hex.slice(0, 2), 16),
				g: parseInt(hex.slice(2, 4), 16),
				b: parseInt(hex.slice(4, 6), 16)
			};
		}
	}
	// rgb(r, g, b)
	const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	if (rgbMatch) {
		return {
			r: parseInt(rgbMatch[1]),
			g: parseInt(rgbMatch[2]),
			b: parseInt(rgbMatch[3])
		};
	}
	return null;
}

/**
 * 线性插值
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * 缓动函数 — easeOutCubic
 */
export function easeOutCubic(t: number): number {
	return 1 - Math.pow(1 - t, 3);
}
