import { persistentStore } from './persistent';

export interface TopicProgress {
	mastery: number; // 0~100 掌握度
	totalExercises: number; // 总练习题数
	correctExercises: number; // 做对的题数
	lastVisited: number; // 时间戳
	completed: boolean; // 是否标记为已掌握
}

export interface MistakeRecord {
	id: string;
	topic: string; // 所属知识点
	type: 'algorithm' | 'sql';
	question: string; // 题目描述
	options?: string[]; // 原题选项（重新作答用）
	wrongAnswer: string; // 错误答案
	correctAnswer: string; // 正确答案
	explanation: string; // 解析
	timestamp: number;
	reviewCount: number; // 复习次数
	lastReviewed?: number; // 最近一次复习时间戳
	mastered: boolean; // 是否已掌握
}

export interface ProgressData {
	topics: Record<string, TopicProgress>;
	mistakes: MistakeRecord[];
	totalStudyTime: number; // 总学习时长（秒，粗略统计）
	streakDays: number; // 连续学习天数
	lastActiveDate: string; // 上次活跃日期 YYYY-MM-DD
}

const defaultProgress: ProgressData = {
	topics: {},
	mistakes: [],
	totalStudyTime: 0,
	streakDays: 0,
	lastActiveDate: ''
};

export const progress = persistentStore<ProgressData>('structvis:progress', defaultProgress);

/**
 * 记录一次练习作答：累加答题数，答对加掌握度、答错扣减。
 * 掌握度达到 80 标记为已掌握；答对答错都会记入 totalExercises。
 */
export function recordExercise(topicId: string, correct: boolean): void {
	progress.update((p) => {
		const topic = p.topics[topicId] ?? {
			mastery: 0,
			totalExercises: 0,
			correctExercises: 0,
			lastVisited: Date.now(),
			completed: false
		};

		topic.totalExercises += 1;
		if (correct) {
			topic.correctExercises += 1;
			topic.mastery = Math.min(100, topic.mastery + 10);
		} else {
			topic.mastery = Math.max(0, topic.mastery - 10);
		}
		topic.lastVisited = Date.now();
		if (topic.mastery >= 80) {
			topic.completed = true;
		}

		p.topics[topicId] = topic;
		return p;
	});
}

/**
 * 更新某个知识点的掌握度（兼容旧调用：直接加减掌握度，不计答题数）
 */
export function updateTopicMastery(topicId: string, delta: number): void {
	progress.update((p) => {
		const topic = p.topics[topicId] ?? {
			mastery: 0,
			totalExercises: 0,
			correctExercises: 0,
			lastVisited: Date.now(),
			completed: false
		};

		topic.mastery = Math.max(0, Math.min(100, topic.mastery + delta));
		topic.lastVisited = Date.now();
		if (topic.mastery >= 80) {
			topic.completed = true;
		}

		p.topics[topicId] = topic;
		return p;
	});
}

/**
 * 添加错题记录
 */
export function addMistake(
	mistake: Omit<MistakeRecord, 'id' | 'timestamp' | 'reviewCount' | 'mastered'>
): void {
	progress.update((p) => {
		p.mistakes.push({
			...mistake,
			id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			timestamp: Date.now(),
			reviewCount: 0,
			mastered: false
		});
		return p;
	});
}

/**
 * 复习一次错题：累计复习次数并记录最近复习时间
 */
export function reviewMistake(id: string): void {
	progress.update((p) => {
		const m = p.mistakes.find((x) => x.id === id);
		if (m) {
			m.reviewCount += 1;
			m.lastReviewed = Date.now();
		}
		return p;
	});
}

/**
 * 标记错题为已掌握（复习答对后）
 */
export function markMistakeMastered(id: string): void {
	progress.update((p) => {
		const m = p.mistakes.find((x) => x.id === id);
		if (m) m.mastered = true;
		return p;
	});
}

/**
 * 移除一条错题记录
 */
export function removeMistake(id: string): void {
	progress.update((p) => {
		p.mistakes = p.mistakes.filter((x) => x.id !== id);
		return p;
	});
}

/**
 * 更新连续学习天数（每次打开应用时调用）
 * 注意：必须用本地日期而非 toISOString()（UTC）——东八区 00:00-08:00 学习会被
 * toISOString 记成前一天，跨午夜连续学习会被误判为中断。
 */
function localDateStr(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function updateStreak(): void {
	const today = localDateStr(new Date());

	progress.update((p) => {
		if (p.lastActiveDate === today) {
			return p; // 今天已经算过了
		}

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = localDateStr(yesterday);

		if (p.lastActiveDate === yesterdayStr) {
			p.streakDays += 1; // 连续
		} else if (p.lastActiveDate !== '') {
			p.streakDays = 1; // 断了，重新开始
		} else {
			p.streakDays = 1; // 第一天
		}

		p.lastActiveDate = today;
		return p;
	});
}

// === 学习数据备份（导出/导入） ===

/** 把当前进度导出为 JSON 字符串（含版本信封，与 localStorage 存储格式一致） */
export function exportProgress(): string {
	let snapshot: ProgressData | null = null;
	let unsub: (() => void) | null = null;
	// 同步读取当前值：订阅后立即回调一次当前快照
	unsub = progress.subscribe((p) => {
		snapshot = p;
		unsub?.();
		unsub = null;
	});
	return JSON.stringify({ __sv: 1, data: snapshot }, null, 2);
}

export interface ImportProgressResult {
	ok: boolean;
	error?: string;
}

/**
 * 从 JSON 字符串导入进度。校验结构完整性，字段缺失时以默认值补齐；
 * 校验失败返回错误信息且不修改任何数据。
 */
export function importProgress(json: string): ImportProgressResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { ok: false, error: '文件不是有效的 JSON' };
	}

	// 兼容两种格式：新版 { __sv, data } 信封 与 旧版裸 ProgressData
	let data = parsed as Partial<ProgressData>;
	if (
		parsed !== null &&
		typeof parsed === 'object' &&
		'__sv' in (parsed as Record<string, unknown>) &&
		'data' in (parsed as Record<string, unknown>)
	) {
		data = (parsed as { data: Partial<ProgressData> }).data;
	}
	if (data === null || typeof data !== 'object') {
		return { ok: false, error: '文件内容不是学习数据对象' };
	}

	const topics = data.topics ?? {};
	const mistakes = data.mistakes ?? [];
	if (typeof topics !== 'object' || !Array.isArray(mistakes)) {
		return { ok: false, error: '数据结构不完整（缺少 topics / mistakes）' };
	}

	const normalized: ProgressData = {
		topics,
		mistakes,
		totalStudyTime: typeof data.totalStudyTime === 'number' ? data.totalStudyTime : 0,
		streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
		lastActiveDate: typeof data.lastActiveDate === 'string' ? data.lastActiveDate : ''
	};

	progress.set(normalized);
	return { ok: true };
}
