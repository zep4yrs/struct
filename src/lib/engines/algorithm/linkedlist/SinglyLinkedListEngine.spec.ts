import { describe, it, expect } from 'vitest';
import { SinglyLinkedListEngine } from './SinglyLinkedListEngine';

describe('SinglyLinkedListEngine', () => {
	it('插入操作：第 3 位插入 66 后链表正确', () => {
		const e = new SinglyLinkedListEngine();
		e.init({ values: [12, 99, 37, 8], operation: 'insert', target: 3, value: 66 });
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([12, 99, 66, 37, 8]);
		expect(e.steps[0].data).toEqual([12, 99, 37, 8]);
	});

	it('删除操作：删除 37 后链表正确', () => {
		const e = new SinglyLinkedListEngine();
		e.init({ values: [12, 99, 37, 8], operation: 'delete', target: 37 });
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([12, 99, 8]);
		// 删除前先定位到了 37（pivot 高亮）
		const hasPivot = e.steps.some((s) =>
			s.highlights.some((h) => h.type === 'pivot' && h.indices.includes(2))
		);
		expect(hasPivot).toBe(true);
	});

	it('插入步骤包含新节点创建', () => {
		const e = new SinglyLinkedListEngine();
		e.init({ values: [12, 99, 37, 8], operation: 'insert', target: 3, value: 66 });
		const createStep = e.steps[1];
		expect(createStep.description).toContain('66');
	});
});
