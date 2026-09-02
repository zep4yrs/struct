/**
 * 学习报告章节单源 — /report 雷达图的章节分组唯一数据源。
 *
 * 章节不再手工罗列 topicId（旧版已漂移：漏掉 mono-stack/skip-list/trie 等），
 * 而是从 topics.ts 的 group 全量派生：DS 每个侧边栏分组 = 一个雷达章节，
 * DB 全部课题合并为一个「SQL」章节。新课程入册后雷达自动跟上，零手工同步。
 */

import { dbTopics, dsTopics, DS_GROUP_ORDER } from './topics';

export interface Chapter {
	label: string;
	topicIds: string[];
}

/** 章节 = DS 各分组（全量派生）+ SQL（全部 DB 课题） */
export const CHAPTERS: Chapter[] = [
	...DS_GROUP_ORDER.map((group) => ({
		label: group,
		topicIds: dsTopics.filter((t) => t.topicId && t.group === group).map((t) => t.topicId as string)
	})),
	{ label: 'SQL', topicIds: dbTopics.map((t) => t.topicId).filter((id): id is string => !!id) }
];

type MasterySource = Record<string, { mastery: number } | undefined>;

/** 每章平均掌握度（只统计已开始学习的课题；全章未学计 0） */
export function chapterAverages(topics: MasterySource): Record<string, number> {
	const out: Record<string, number> = {};
	for (const ch of CHAPTERS) {
		const vals = ch.topicIds.map((id) => topics[id]?.mastery ?? 0).filter((v) => v > 0);
		out[ch.label] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
	}
	return out;
}
