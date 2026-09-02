/**
 * 内容单源一致性校验（Story 5「全站数字只有一个来源」的守卫）。
 * 任何课题/图谱/章节的交叉引用漂移在这里直接红，而不是等到页面渲染或手测才发现。
 */

import { describe, it, expect } from 'vitest';
import { dbTopics, dsTopics, TOPIC_ALIASES } from './topics';
import { SKILL_NODES, SKILL_EDGES, SKILL_GROUP_ORDER } from './skill-graph';
import { CHAPTERS } from './chapters';

const allTopics = [...dsTopics, ...dbTopics];
const topicById = new Map(allTopics.filter((t) => t.topicId).map((t) => [t.topicId as string, t]));
const hrefs = new Set(allTopics.map((t) => t.href));

describe('topics.ts 课题单源', () => {
	it('href / topicId 均无重复', () => {
		const hrefSet = new Set(allTopics.map((t) => t.href));
		expect(hrefSet.size).toBe(allTopics.length);
		const ids = allTopics.map((t) => t.topicId).filter(Boolean) as string[];
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('别名表的 key 都指向真实课题路由（孤儿别名 = 搜索死链）', () => {
		for (const key of Object.keys(TOPIC_ALIASES)) {
			expect(hrefs.has(key), `别名表 key ${key} 不在任何课题的 href 中`).toBe(true);
		}
	});

	it('每个课题都有非空的徽标 / 分组 / 面包屑（聚合报告全部违规）', () => {
		const problems: string[] = [];
		for (const t of allTopics) {
			if (!t.badge.length) problems.push(`${t.href} 缺 badge`);
			if (!t.group.length) problems.push(`${t.href} 缺 group`);
			if (!t.crumb.includes(t.title))
				problems.push(`${t.href} 面包屑「${t.crumb}」未包含标题「${t.title}」`);
		}
		expect(problems, problems.join('\n')).toEqual([]);
	});
});

describe('skill-graph.ts 图谱单源', () => {
	it('节点 id 无重复，分组全部在行序表内', () => {
		const ids = SKILL_NODES.map((n) => n.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const n of SKILL_NODES) {
			expect(SKILL_GROUP_ORDER as readonly string[]).toContain(n.group);
		}
	});

	it('node.href 必须是真实课题路由（或 /catalog 概念锚点）', () => {
		for (const n of SKILL_NODES) {
			if (n.id === 'array') {
				expect(n.href).toBe('/catalog');
				expect(n.topicId).toBeUndefined();
				continue;
			}
			expect(hrefs.has(n.href), `图谱节点 ${n.id} 的 href ${n.href} 不在课题表中`).toBe(true);
		}
	});

	it('node.topicId 与课题表一致，href 与课题 href 严格相等（防复制粘贴漂移）', () => {
		for (const n of SKILL_NODES) {
			if (!n.topicId) continue;
			const topic = topicById.get(n.topicId);
			expect(topic, `图谱节点 ${n.id} 的 topicId ${n.topicId} 不在课题表中`).toBeDefined();
			expect(n.href, `图谱节点 ${n.id} 的 href 与课题 ${n.topicId} 的 href 不一致`).toBe(
				topic?.href
			);
		}
	});

	it('边的端点都存在，无自环、无重复边', () => {
		const ids = new Set(SKILL_NODES.map((n) => n.id));
		const seen = new Set<string>();
		for (const e of SKILL_EDGES) {
			expect(ids.has(e.from), `边起点 ${e.from} 不存在`).toBe(true);
			expect(ids.has(e.to), `边终点 ${e.to} 不存在`).toBe(true);
			expect(e.from).not.toBe(e.to);
			const key = e.from + '→' + e.to;
			expect(seen.has(key), `重复边 ${key}`).toBe(false);
			seen.add(key);
		}
	});
});

describe('chapters.ts 章节单源', () => {
	it('每个有 topicId 的 DS 课题都恰好归属一个章节（雷达全量覆盖）', () => {
		const dsIds = dsTopics.map((t) => t.topicId).filter(Boolean) as string[];
		const chapterIds = CHAPTERS.filter((c) => c.label !== 'SQL').flatMap((c) => c.topicIds);
		expect(new Set(chapterIds).size).toBe(chapterIds.length);
		for (const id of dsIds) {
			expect(chapterIds, `DS 课题 ${id} 未归入任何雷达章节`).toContain(id);
		}
	});

	it('SQL 章节覆盖全部有 topicId 的 DB 课题', () => {
		const sqlChapter = CHAPTERS.find((c) => c.label === 'SQL');
		expect(sqlChapter).toBeDefined();
		const dbIds = dbTopics.map((t) => t.topicId).filter(Boolean) as string[];
		for (const id of dbIds) {
			expect(sqlChapter?.topicIds, `DB 课题 ${id} 未归入 SQL 章节`).toContain(id);
		}
	});

	it('章节引用的 topicId 全部真实存在', () => {
		for (const ch of CHAPTERS) {
			for (const id of ch.topicIds) {
				expect(topicById.has(id), `章节「${ch.label}」引用了不存在的 topicId ${id}`).toBe(true);
			}
		}
	});
});
