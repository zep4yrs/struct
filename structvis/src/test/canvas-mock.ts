/**
 * jsdom 无 Canvas 实现 — 记录式 2D 上下文 stub。
 * 每个 getContext('2d') 返回一个新实例；所有方法调用记录到模块级日志，
 * 并在调用时捕获当前 fillStyle/strokeStyle/lineWidth/globalAlpha，供断言颜色。
 */
import { vi } from 'vitest';

const METHODS = [
	'clearRect',
	'fillRect',
	'strokeRect',
	'beginPath',
	'closePath',
	'moveTo',
	'lineTo',
	'quadraticCurveTo',
	'bezierCurveTo',
	'arc',
	'arcTo',
	'ellipse',
	'rect',
	'roundRect',
	'fill',
	'stroke',
	'fillText',
	'strokeText',
	'measureText',
	'save',
	'restore',
	'scale',
	'translate',
	'rotate',
	'transform',
	'setTransform',
	'clip',
	'setLineDash',
	'getLineDash',
	'drawImage',
	'createLinearGradient',
	'createRadialGradient',
	'createPattern'
] as const;

export interface CanvasCall {
	method: string;
	args: unknown[];
	state: { fillStyle: string; strokeStyle: string; lineWidth: number; globalAlpha: number };
}

let calls: CanvasCall[] = [];
let state: { fillStyle: string; strokeStyle: string; lineWidth: number; globalAlpha: number } = {
	fillStyle: '#000',
	strokeStyle: '#000',
	lineWidth: 1,
	globalAlpha: 1
};

function makeContext(): CanvasRenderingContext2D {
	const ctx: Record<string, unknown> = {};

	for (const m of METHODS) {
		ctx[m] = (...args: unknown[]) => {
			calls.push({ method: m, args, state: { ...state } });
		};
	}

	ctx.measureText = (text: string) => ({ width: String(text).length * 7 });
	ctx.getLineDash = () => [];
	ctx.createLinearGradient = () => ({ addColorStop: vi.fn() });
	ctx.createRadialGradient = () => ({ addColorStop: vi.fn() });
	ctx.createPattern = () => null;

	for (const key of ['fillStyle', 'strokeStyle', 'globalAlpha', 'lineWidth'] as const) {
		Object.defineProperty(ctx, key, {
			get: () => state[key],
			set: (v: unknown) => {
				state = { ...state, [key]: v as never };
			}
		});
	}

	return ctx as unknown as CanvasRenderingContext2D;
}

export function installCanvasMock() {
	HTMLCanvasElement.prototype.getContext = (() =>
		makeContext()) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

export function resetCanvasMock() {
	calls = [];
	state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1 };
}

export function canvasCalls(): CanvasCall[] {
	return calls.slice();
}

export function fillTextCalls(): CanvasCall[] {
	return calls.filter((c) => c.method === 'fillText');
}

export function textsDrawn(): string[] {
	return fillTextCalls().map((c) => String(c.args[0]));
}

export function textDrawnWithStyle(
	text: string
): { fillStyle: string; strokeStyle: string; lineWidth: number; globalAlpha: number }[] {
	return fillTextCalls()
		.filter((c) => String(c.args[0]) === text)
		.map((c) => c.state);
}
