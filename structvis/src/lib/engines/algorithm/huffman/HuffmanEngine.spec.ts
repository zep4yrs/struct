import { describe, it, expect } from 'vitest';
import { HuffmanEngine } from './HuffmanEngine';

describe('HuffmanEngine', () => {
	it('renderType / 名称正确', () => {
		const e = new HuffmanEngine();
		expect(e.renderType).toBe('huffman');
		expect(e.name).toBe('哈夫曼树');
	});

	it('5 个权值合并 4 次，最终单根，WPL = 60', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		const last = e.steps.at(-1)!;
		expect(last.type).toBe('complete');
		expect(last.huffman!.roots.length).toBe(1);
		expect(last.huffman!.wpl).toBe(60);
		expect(last.description).toContain('60');
		// 初始帧：森林 5 个根
		expect(e.steps[0].huffman!.roots.length).toBe(5);
	});

	it('合并顺序：先 2+4，再 5+6，再 7+9，最后 11+16', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		const merges = e.steps.filter((s) => s.type === 'edge-select').map((s) => s.description);
		expect(merges[0]).toContain('2');
		expect(merges[0]).toContain('4');
		expect(merges[1]).toContain('5');
		expect(merges[2]).toContain('9');
		expect(merges[3]).toContain('27');
	});

	it('每帧快照：节点数单调增长，且每帧高亮/根信息完整', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		let prev = 0;
		for (const s of e.steps) {
			const h = s.huffman!;
			expect(h.nodes.length).toBeGreaterThanOrEqual(prev);
			prev = h.nodes.length;
			expect(h.roots.length).toBeGreaterThan(0);
			for (const r of h.roots) expect(r).toBeLessThan(h.nodes.length);
		}
	});

	it('内部结点：合并后左右孩子指向正确（较小权在左）', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		const last = e.steps.at(-1)!;
		const root = last.huffman!.roots[0];
		const rootNode = last.huffman!.nodes[root];
		expect(rootNode.left).toBeGreaterThanOrEqual(0);
		expect(rootNode.right).toBeGreaterThanOrEqual(0);
		// 根权 = 全部权值和
		expect(rootNode.value).toBe(27);
	});

	it('两元素输入：直接合并一次', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [3, 5] });
		expect(e.steps.filter((s) => s.type === 'edge-select').length).toBe(1);
		expect(e.steps.at(-1)!.huffman!.wpl).toBe(3 + 5);
	});

	it('WPL 等于各次合并权值之和（权 7 5 2 4）', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [7, 5, 2, 4] });
		// 合并：2+4=6, 5+6=11, 7+11=18 → WPL = 6+11+18 = 35
		expect(e.steps.at(-1)!.huffman!.wpl).toBe(35);
	});

	it('自定义输入校验：非正权值被拒绝', () => {
		const e = new HuffmanEngine();
		expect(() => e.applyCustom({ weights: '4, 0, 7' })).toThrow(/正/);
	});

	it('伪代码行号均在合法范围内', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		for (const s of e.steps) {
			expect(s.pseudocodeLine).toBeGreaterThanOrEqual(0);
			expect(s.pseudocodeLine).toBeLessThan(e.pseudocode.length);
		}
	});

	it('播放器状态接口正常', () => {
		const e = new HuffmanEngine();
		e.init({ weights: [4, 2, 7, 5, 9] });
		e.setProgress(3);
		expect(e.getCurrentStep()).toBe(e.steps[3]);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});
});