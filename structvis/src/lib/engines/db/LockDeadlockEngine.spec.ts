import { describe, it, expect } from 'vitest';
import { LockDeadlockEngine } from './LockDeadlockEngine';

function run(): LockDeadlockEngine {
	const e = new LockDeadlockEngine();
	e.init([0]);
	return e;
}

describe('LockDeadlockEngine 锁机制与死锁', () => {
	it('描述死锁形成与检测', () => {
		const e = run();
		const descs = e.steps.map((s) => s.description).join(' ');
		expect(descs).toContain('死锁');
		expect(descs).toContain('回滚');
	});

	it('每步带 chain 布局图快照', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.graph).toBeDefined();
			expect(s.graph!.layout).toBe('chain');
			expect(s.graph!.nodes.length).toBe(2);
		}
	});
});
