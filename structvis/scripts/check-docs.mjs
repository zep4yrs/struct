/**
 * 文档防漂移校验（Story 5「全站数字只有一个来源」的 CI 闭环）。
 *
 * 从源码计算真值（课题数/页面数/渲染器数），与根 README 的陈述数字比对；
 * 任何数字漂移让 `npm run lint` 直接红，而不是等读者发现。
 *
 * 已知边界：测试徽章（unit/e2e 条数）由 vitest/playwright 运行期决定，
 * 脚本不做静态校验——更新测试后请顺手更新徽章（README 防漂移约定第 3 条）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // structvis/
const ROOT = path.dirname(PKG); // 仓库根（含 README.md）
const SRC = path.join(PKG, 'src');
const README = readFileSync(path.join(ROOT, 'README.md'), 'utf8');

const problems = [];
const ok = (label, n) => console.log(`  ✓ ${label}: ${n}`);

// --- 课题数（topics.ts 中 ds/db 条目的 href 计数） ---
const topicsTs = readFileSync(path.join(SRC, 'lib', 'content', 'topics.ts'), 'utf8');
const dsCount = (topicsTs.match(/href: '\/ds\//g) ?? []).length;
const dbCount = (topicsTs.match(/href: '\/db\//g) ?? []).length;
// MySQL 课程（非实验组）与 SQL 实验台（实验组）拆分——与目录页三分段一致
const dbLabCount = (topicsTs.match(/group: '实验'/g) ?? []).length;
const mysqlCourseCount = dbCount - dbLabCount;
ok('数据结构课题', dsCount);
ok('数据库课题（课程+实验）', dbCount);
ok('MySQL 课程课题', mysqlCourseCount);
ok('SQL 实验台课题', dbLabCount);

// --- 页面数（routes 下所有 +page.svelte） ---
function countPages(dir) {
	let n = 0;
	for (const name of readdirSync(dir)) {
		const p = path.join(dir, name);
		if (statSync(p).isDirectory()) n += countPages(p);
		else if (name === '+page.svelte') n += 1;
	}
	return n;
}
const pageCount = countPages(path.join(SRC, 'routes'));
ok('页面数', pageCount);

// --- 渲染器数（RendererSwitch 分支数） ---
const switchSrc = readFileSync(
	path.join(SRC, 'lib', 'components', 'player', 'RendererSwitch.svelte'),
	'utf8'
);
const rendererCount = (switchSrc.match(/renderType ===/g) ?? []).length;
ok('渲染器分支', rendererCount);

// --- README 陈述比对 ---
const expectReadme = (regex, label, actual) => {
	const m = README.match(regex);
	if (!m) {
		problems.push(`README 找不到「${label}」的陈述（正则 ${regex}）`);
		return;
	}
	const stated = Number(m[1]);
	if (stated !== actual) {
		problems.push(`README「${label}」写的是 ${stated}，源码实际 ${actual}`);
	}
};

// 课程全景表：「87 个知识点」标题行 + 模块表数据结构 49 / MySQL 11+SQL 27（=db 总数）
expectReadme(/\*\*(\d+) 个知识点\*\*/, '知识点总数（hero 行）', dsCount + dbCount);
// Architecture 代码块：「# 99 个页面（/、/home、/catalog、ds×49、db×38…）」
expectReadme(/# (\d+) 个页面/, '页面数（架构图）', pageCount);
expectReadme(/ds×(\d+)/, 'ds×N（架构图）', dsCount);
expectReadme(/db×(\d+)/, 'db×N（架构图）', dbCount);
// 课程全景表：「| 数据结构   |   49   |」——prettier 会按列宽重排空格，用 \s* 容忍
expectReadme(/\| 数据结构\s+\|\s+(\d+)\s+\|/, '数据结构课题（课程表）', dsCount);
expectReadme(/\| MySQL 课程\s+\|\s+(\d+)\s+\|/, 'MySQL 课程课题（课程表）', mysqlCourseCount);
expectReadme(
	/\| SQL 实验台\s+\|\s+(\d+)\s+\|/,
	'SQL 实验台课题（课程表）',
	dbCount - mysqlCourseCount
);

if (problems.length) {
	console.error('\n✗ 文档漂移检测失败：');
	for (const p of problems) console.error('  - ' + p);
	console.error('\n请按 structvis/README「文档同步」约定更新 README 后重试。');
	process.exit(1);
}
console.log('\n✓ README 数字与源码一致（测试徽章请按需人工更新）');
