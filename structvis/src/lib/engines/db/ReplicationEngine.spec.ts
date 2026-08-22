import { describe, it, expect } from 'vitest';
import { ReplicationEngine } from './ReplicationEngine';

function run(): ReplicationEngine {
	const e = new ReplicationEngine();
	e.init([0]);
	return e;
}

describe('ReplicationEngine 主从复制', () => {
	it('七节点全链路', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.graph!.nodes.length).toBe(7);
		}
	});

	it('覆盖三线程关键词', () => {
		const e = run();
		const descs = e.steps.map((s) => s.description).join(' ');
		expect(descs).toContain('dump');
		expect(descs).toContain('IO');
		expect(descs).toContain('SQL 线程');
	});
});
