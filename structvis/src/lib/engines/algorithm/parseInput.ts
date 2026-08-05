/**
 * 引擎通用输入解析 — 供各引擎的 applyCustom 复用。
 */

/** 解析逗号/空格分隔的数字序列；校验失败抛 Error（展示在自定义弹窗中） */
export function parseNumberList(
	text: string,
	opts: { min?: number; max?: number; label?: string } = {}
): number[] {
	const { min, max, label = '数据' } = opts;
	const parts = text
		.split(/[,，\s]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (parts.length === 0) {
		throw new Error(`请输入${label}`);
	}
	const nums = parts.map((s) => {
		const n = parseInt(s, 10);
		if (isNaN(n)) throw new Error(`"${s}" 不是有效数字`);
		return n;
	});
	if (min !== undefined && nums.length < min) {
		throw new Error(`至少需要 ${min} 个${label === '数据' ? '元素' : '节点'}`);
	}
	if (max !== undefined && nums.length > max) {
		throw new Error(`最多支持 ${max} 个${label === '数据' ? '元素' : '节点'}`);
	}
	return nums;
}

/** 解析逗号分隔的任意标签（图节点名，允许中文/字母/数字） */
export function parseLabelList(
	text: string,
	opts: { min?: number; max?: number; label?: string } = {}
): string[] {
	const { min, max, label = '节点' } = opts;
	const parts = text
		.split(/[,，\s]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (parts.length === 0) throw new Error(`请输入${label}列表`);
	if (min !== undefined && parts.length < min) throw new Error(`至少需要 ${min} 个${label}`);
	if (max !== undefined && parts.length > max) throw new Error(`最多支持 ${max} 个${label}`);
	return parts;
}

/**
 * 解析图的边列表，如 "0-1, 1-2, 2-0"。
 * 返回 [from, to] 对；校验端点非负且不超过 maxIndex。
 */
export function parseEdgeList(
	text: string,
	opts: { maxIndex: number; min?: number; label?: string } = { maxIndex: 0 }
): [number, number][] {
	const { maxIndex, min, label = '边' } = opts;
	const parts = text
		.split(/[,，\s]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (parts.length === 0) throw new Error(`请输入${label}列表`);
	const edges: [number, number][] = [];
	for (const p of parts) {
		const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(p);
		if (!m) throw new Error(`"${p}" 不是有效的边，格式应为 0-1`);
		const a = parseInt(m[1], 10);
		const b = parseInt(m[2], 10);
		if (a === b) throw new Error(`边 "${p}" 两端不能是同一个顶点`);
		if (a > maxIndex || b > maxIndex) throw new Error(`边 "${p}" 的顶点编号超出节点范围`);
		edges.push([a, b]);
	}
	if (min !== undefined && edges.length < min) throw new Error(`至少需要 ${min} 条${label}`);
	return edges;
}
