import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	parseScript,
	serializeScript,
	loadScriptOverride,
	saveScriptOverride,
	scriptStorageKey
} from './script-manager';
import type { DemoScriptItem } from '$lib/engines/algorithm/types';

function sampleItems(): DemoScriptItem[] {
	return [
		{ type: 'compare', narration: '比较两个元素' },
		{ type: 'swap', narration: '交换它们' }
	];
}

describe('script-manager 讲授剧本', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => null),
			setItem: vi.fn(),
			removeItem: vi.fn()
		});
	});

	it('parseScript：解析合法剧本', () => {
		const json = JSON.stringify({ version: 1, name: '我的讲法', items: sampleItems() });
		const parsed = parseScript(json);
		expect(parsed.items).toHaveLength(2);
		expect(parsed.name).toBe('我的讲法');
	});

	it('parseScript：拒绝非法 JSON / 版本 / 类型 / 空旁白', () => {
		expect(() => parseScript('{bad')).toThrow('JSON');
		expect(() => parseScript(JSON.stringify({ version: 2, items: [] }))).toThrow('版本');
		expect(() => parseScript(JSON.stringify({ version: 1, items: [] }))).toThrow('没有旁白');
		expect(() =>
			parseScript(JSON.stringify({ version: 1, items: [{ type: 'nope', narration: 'x' }] }))
		).toThrow('未知的步骤类型');
		expect(() =>
			parseScript(JSON.stringify({ version: 1, items: [{ type: 'compare', narration: '  ' }] }))
		).toThrow('旁白');
	});

	it('serializeScript → parseScript 往返一致', () => {
		const json = serializeScript(sampleItems(), '快速排序');
		const parsed = parseScript(json);
		expect(parsed.items).toEqual(sampleItems());
		expect(parsed.name).toBe('快速排序');
	});

	it('saveScriptOverride/loadScriptOverride：按引擎名隔离持久化，null 清除', () => {
		const storage = new Map<string, string>();
		vi.stubGlobal('localStorage', {
			getItem: (k: string) => storage.get(k) ?? null,
			setItem: (k: string, v: string) => storage.set(k, v),
			removeItem: (k: string) => storage.delete(k)
		});

		expect(loadScriptOverride('快速排序')).toBeNull();
		saveScriptOverride('快速排序', sampleItems());
		expect(loadScriptOverride('快速排序')).toEqual(sampleItems());
		expect(loadScriptOverride('冒泡排序')).toBeNull(); // 引擎间隔离
		expect(storage.has(scriptStorageKey('快速排序'))).toBe(true);

		saveScriptOverride('快速排序', null);
		expect(loadScriptOverride('快速排序')).toBeNull();
		expect(storage.has(scriptStorageKey('快速排序'))).toBe(false);
	});

	it('loadScriptOverride：损坏数据返回 null 而非抛错', () => {
		const storage = new Map<string, string>([['structvis:script:快速排序', '{bad']]);
		vi.stubGlobal('localStorage', {
			getItem: (k: string) => storage.get(k) ?? null,
			setItem: vi.fn(),
			removeItem: vi.fn()
		});
		expect(loadScriptOverride('快速排序')).toBeNull();
	});
});
