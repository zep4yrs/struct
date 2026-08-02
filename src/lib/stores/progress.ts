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
	wrongAnswer: string; // 错误答案
	correctAnswer: string; // 正确答案
	explanation: string; // 解析
	timestamp: number;
	reviewCount: number; // 复习次数
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
 * 更新某个知识点的掌握度
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
export function addMistake(mistake: Omit<MistakeRecord, 'id' | 'timestamp' | 'reviewCount' | 'mastered'>): void {
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
