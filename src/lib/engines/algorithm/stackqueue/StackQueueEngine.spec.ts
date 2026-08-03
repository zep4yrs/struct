import { describe, it, expect } from 'vitest';
import { StackQueueEngine } from './StackQueueEngine';

describe('StackQueueEngine', () => {
	it('压栈：66 入栈后序列为 栈底→栈顶 末尾追加', () => {
		const e = new StackQueueEngine();
		e.init({ structure: 'stack', values: [12, 99, 37], operation: 'push', target: 66 });
		expect(e.renderType).toBe('stack');
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([12, 99, 37, 66]);
		// 压栈时新元素高亮为 current
		const hasCurrent = e.steps.some((s) =>
			s.highlights.some((h) => h.type === 'current' && h.indices.includes(3))
		);
		expect(hasCurrent).toBe(true);
	});

	it('出栈：目标与栈顶一致时移除末尾元素', () => {
		const e = new StackQueueEngine();
		e.init({ structure: 'stack', values: [12, 99, 37], operation: 'pop', target: 37 });
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([12, 99]);
		// 取出前先 pivot 高亮栈顶
		const hasPivot = e.steps.some((s) =>
			s.highlights.some((h) => h.type === 'pivot' && h.indices.includes(2))
		);
		expect(hasPivot).toBe(true);
	});

	it('出栈：目标与栈顶不一致时报错且数据不变', () => {
		const e = new StackQueueEngine();
		e.init({ structure: 'stack', values: [12, 99, 37], operation: 'pop', target: 66 });
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([12, 99, 37]);
		expect(last.description).toContain('不一致');
	});

	it('入队：66 入队后追加到队尾', () => {
		const e = new StackQueueEngine();
		e.init({ structure: 'queue', values: [12, 99, 37], operation: 'enqueue', target: 66 });
		expect(e.renderType).toBe('queue');
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([12, 99, 37, 66]);
	});

	it('出队：移除队头元素（先进先出）', () => {
		const e = new StackQueueEngine();
		e.init({ structure: 'queue', values: [12, 99, 37], operation: 'dequeue', target: 12 });
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([99, 37]);
		// 取出前 pivot 高亮队头（index 0）
		const hasPivot = e.steps.some((s) =>
			s.highlights.some((h) => h.type === 'pivot' && h.indices.includes(0))
		);
		expect(hasPivot).toBe(true);
	});

	it('空栈出栈：下溢错误步骤', () => {
		const e = new StackQueueEngine();
		e.init({ structure: 'stack', values: [], operation: 'pop', target: 1 });
		expect(e.steps[e.steps.length - 1].description).toContain('为空');
	});

	it('练习题随结构切换（栈=栈顶，队=队尾）', () => {
		const stack = new StackQueueEngine();
		stack.init({ structure: 'stack', values: [1], operation: 'push', target: 2 });
		const queue = new StackQueueEngine();
		queue.init({ structure: 'queue', values: [1], operation: 'enqueue', target: 2 });
		expect(stack.practiceQuestions[0].correctAnswer).toBe('栈顶');
		expect(queue.practiceQuestions[0].correctAnswer).toBe('队尾');
	});
});
