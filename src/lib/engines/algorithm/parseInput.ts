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
