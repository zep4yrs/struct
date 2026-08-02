import { describe, it, expect } from 'vitest';
import { BinaryTreeEngine } from '../binarytree/BinaryTreeEngine';

const TREE = [10, 5, 15, 3, 7, 12, 20];

function collectSeq(mode: 'preorder' | 'inorder' | 'postorder' | 'levelorder'): number[] {
	const e = new BinaryTreeEngine();
	e.init({ tree: TREE, mode });
	const seq: number[] = [];
	for (const s of e.steps) {
		const c = s.highlights.find((h) => h.type === 'current');
		if (c) seq.push(s.data[c.indices[0]]);
	}
	return seq;
}

describe('BinaryTreeEngine', () => {
	it('前序遍历序列正确', () => {
		expect(collectSeq('preorder')).toEqual([10, 5, 3, 7, 15, 12, 20]);
	});

	it('中序遍历序列正确', () => {
		expect(collectSeq('inorder')).toEqual([3, 5, 7, 10, 12, 15, 20]);
	});

	it('后序遍历序列正确', () => {
		expect(collectSeq('postorder')).toEqual([3, 7, 5, 12, 20, 15, 10]);
	});

	it('层序遍历序列正确', () => {
		expect(collectSeq('levelorder')).toEqual([10, 5, 15, 3, 7, 12, 20]);
	});
});
