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
 */
export function updateStreak(): void {
	const today = new Date().toISOString().slice(0, 10);

	progress.update((p) => {
		if (p.lastActiveDate === today) {
			return p; // 今天已经算过了
		}

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().slice(0, 10);

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
