import { describe, it, expect, vi, beforeEach } from 'vitest';

interface MockStorage {
	getItem: (k: string) => string | null;
	setItem: (k: string, v: string) => void;
	removeItem: (k: string) => void;
	clear: () => void;
	data: Map<string, string>;
}

function createMockStorage(): MockStorage {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => {
			data.set(k, v);
		},
		removeItem: (k) => {
			data.delete(k);
		},
		clear: () => data.clear()
	};
}

async function loadPersistent(browserValue: boolean): Promise<typeof import('./persistent')> {
	vi.resetModules();
	vi.doMock('$app/environment', () => ({ browser: browserValue }));
	return await import('./persistent');
}

describe('persistentStore', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createMockStorage());
	});

	it('非浏览器环境：不读写 localStorage，返回默认值', async () => {
		const { persistentStore } = await loadPersistent(false);
		const storage = localStorage as unknown as MockStorage;
		const s = persistentStore<{ n: number }>('k1', { n: 42 });
		let value: { n: number } | undefined;
		s.subscribe((v) => (value = v));
		expect(value).toEqual({ n: 42 });
		expect(storage.data.size).toBe(0);
		expect(storage.getItem('k1')).toBeNull();
	});

	it('浏览器环境：从 localStorage 读取已有 JSON 作为初始值', async () => {
		const { persistentStore } = await loadPersistent(true);
		(localStorage as unknown as MockStorage).setItem('k2', JSON.stringify({ n: 7 }));
		const s = persistentStore<{ n: number }>('k2', { n: 42 });
		let value: { n: number } | undefined;
		s.subscribe((v) => (value = v));
		expect(value).toEqual({ n: 7 });
	});

	it('浏览器环境：localStorage 数据损坏时回落默认值', async () => {
		const { persistentStore } = await loadPersistent(true);
		(localStorage as unknown as MockStorage).setItem('k3', '{bad json');
		const s = persistentStore<{ n: number }>('k3', { n: 42 });
		let value: { n: number } | undefined;
		s.subscribe((v) => (value = v));
		expect(value).toEqual({ n: 42 });
	});

	it('浏览器环境：订阅后每次 set 都写入 localStorage（版本信封格式）', async () => {
		const { persistentStore } = await loadPersistent(true);
		const storage = localStorage as unknown as MockStorage;
		const s = persistentStore<{ n: number }>('k4', { n: 1 });
		const unsub = s.subscribe(() => {});
		s.set({ n: 2 });
		s.set({ n: 3 });
		unsub();
		expect(storage.getItem('k4')).toBe(JSON.stringify({ __sv: 1, data: { n: 3 } }));
	});

	it('浏览器环境：读取 v1 信封格式数据', async () => {
		const { persistentStore } = await loadPersistent(true);
		(localStorage as unknown as MockStorage).setItem(
			'k5',
			JSON.stringify({ __sv: 1, data: { n: 7 } })
		);
		const s = persistentStore<{ n: number }>('k5', { n: 42 });
		let value: { n: number } | undefined;
		s.subscribe((v) => (value = v));
		expect(value).toEqual({ n: 7 });
	});

	it('浏览器环境：信封版本非法或未知时回落默认值', async () => {
		const { persistentStore } = await loadPersistent(true);
		(localStorage as unknown as MockStorage).setItem(
			'k6',
			JSON.stringify({ __sv: 'x', data: { n: 7 } })
		);
		const s = persistentStore<{ n: number }>('k6', { n: 42 });
		let value: { n: number } | undefined;
		s.subscribe((v) => (value = v));
		expect(value).toEqual({ n: 42 });
	});
});

describe('settings store', () => {
	it('toggleTheme 在明暗主题间切换', async () => {
		vi.stubGlobal('localStorage', createMockStorage());
		const { settings, toggleTheme } = await loadSettings();
		let theme: string | undefined;
		settings.subscribe((s) => (theme = s.theme));
		expect(theme).toBe('light');
		toggleTheme();
		expect(theme).toBe('dark');
		toggleTheme();
		expect(theme).toBe('light');
	});

	async function loadSettings() {
		vi.resetModules();
		vi.doMock('$app/environment', () => ({ browser: false }));
		return await import('./settings');
	}
});

describe('progress store', () => {
	async function loadProgress() {
		vi.resetModules();
		vi.doMock('$app/environment', () => ({ browser: false }));
		return await import('./progress');
	}

	it('recordExercise：答对累计正确数与题数、加掌握度，答错扣掌握度', async () => {
		const { progress, recordExercise } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		recordExercise('quick-sort', true);
		recordExercise('quick-sort', true);
		recordExercise('quick-sort', false);

		const t = state!.topics['quick-sort'];
		expect(t.totalExercises).toBe(3);
		expect(t.correctExercises).toBe(2);
		expect(t.mastery).toBe(10);
		expect(t.completed).toBe(false);
	});

	it('recordExercise：掌握度达到 80 标记 completed', async () => {
		const { progress, recordExercise } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		for (let i = 0; i < 8; i++) recordExercise('bst', true);
		expect(state!.topics['bst'].completed).toBe(true);
		expect(state!.topics['bst'].mastery).toBe(80);
	});

	it('updateTopicMastery：首次更新创建记录，掌握度累加并夹在 0~100', async () => {
		const { progress, updateTopicMastery } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		updateTopicMastery('quick-sort', 30);
		updateTopicMastery('quick-sort', 40);
		expect(state!.topics['quick-sort'].mastery).toBe(70);
		expect(state!.topics['quick-sort'].totalExercises).toBe(0);
		expect(state!.topics['quick-sort'].completed).toBe(false);

		updateTopicMastery('quick-sort', 50);
		expect(state!.topics['quick-sort'].mastery).toBe(100);
		updateTopicMastery('quick-sort', -500);
		expect(state!.topics['quick-sort'].mastery).toBe(0);
	});

	it('updateTopicMastery：掌握度达到 80 标记 completed', async () => {
		const { progress, updateTopicMastery } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		updateTopicMastery('bst', 80);
		expect(state!.topics['bst'].completed).toBe(true);
	});

	it('addMistake：追加错题记录并初始化 id/timestamp/reviewCount/mastered', async () => {
		const { progress, addMistake } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		addMistake({
			topic: 'kmp',
			type: 'algorithm',
			question: 'Q?',
			wrongAnswer: 'A',
			correctAnswer: 'B',
			explanation: 'E'
		});
		addMistake({
			topic: 'sql',
			type: 'sql',
			question: 'Q2?',
			wrongAnswer: 'X',
			correctAnswer: 'Y',
			explanation: 'Z'
		});

		expect(state!.mistakes).toHaveLength(2);
		const m = state!.mistakes[0];
		expect(m.id).toMatch(/^m_/);
		expect(m.reviewCount).toBe(0);
		expect(m.mastered).toBe(false);
		expect(m.timestamp).toBeGreaterThan(0);
		expect(state!.mistakes[1].type).toBe('sql');
	});

	it('reviewMistake：累计复习次数并记录最近复习时间', async () => {
		const { progress, addMistake, reviewMistake } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		addMistake({
			topic: 'kmp',
			type: 'algorithm',
			question: 'Q?',
			wrongAnswer: 'A',
			correctAnswer: 'B',
			explanation: 'E'
		});
		const id = state!.mistakes[0]!.id;
		reviewMistake(id);
		reviewMistake(id);

		expect(state!.mistakes[0]!.reviewCount).toBe(2);
		expect(state!.mistakes[0]!.lastReviewed).toBeGreaterThan(0);
	});

	it('markMistakeMastered：标记错题为已掌握', async () => {
		const { progress, addMistake, markMistakeMastered } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		addMistake({
			topic: 'sql',
			type: 'sql',
			question: 'Q?',
			wrongAnswer: 'X',
			correctAnswer: 'Y',
			explanation: 'Z'
		});
		markMistakeMastered(state!.mistakes[0]!.id);

		expect(state!.mistakes[0]!.mastered).toBe(true);
	});

	it('removeMistake：按 id 移除错题记录', async () => {
		const { progress, addMistake, removeMistake } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		addMistake({
			topic: 'kmp',
			type: 'algorithm',
			question: 'Q?',
			wrongAnswer: 'A',
			correctAnswer: 'B',
			explanation: 'E'
		});
		addMistake({
			topic: 'sql',
			type: 'sql',
			question: 'Q2?',
			wrongAnswer: 'X',
			correctAnswer: 'Y',
			explanation: 'Z'
		});
		const first = state!.mistakes[0]!.id;
		removeMistake(first);

		expect(state!.mistakes).toHaveLength(1);
		expect(state!.mistakes[0]!.id).not.toBe(first);
	});

	it('updateStreak：首日设为 1，连续日 +1，同日不重复计，断档重置为 1', async () => {
		const { progress, updateStreak } = await loadProgress();
		let state: import('./progress').ProgressData | undefined;
		progress.subscribe((p) => (state = p));

		updateStreak();
		expect(state!.streakDays).toBe(1);
		expect(state!.lastActiveDate).not.toBe('');

		// 同日再次调用不叠加
		updateStreak();
		expect(state!.streakDays).toBe(1);

		// 模拟连续：把 lastActiveDate 拨到昨天再调用（必须用本地日期，与实现一致）
		const localDateStr = (d: Date) =>
			d.getFullYear() +
			'-' +
			String(d.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(d.getDate()).padStart(2, '0');
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		progress.update((p) => ({ ...p, lastActiveDate: localDateStr(yesterday) }));
		updateStreak();
		expect(state!.streakDays).toBe(2);

		// 断档：拨到 3 天前
		const old = new Date();
		old.setDate(old.getDate() - 3);
		progress.update((p) => ({ ...p, lastActiveDate: localDateStr(old) }));
		updateStreak();
		expect(state!.streakDays).toBe(1);
	});
});

describe('progress 数据备份（导出/导入）', () => {
	async function loadProgressModule() {
		vi.resetModules();
		vi.doMock('$app/environment', () => ({ browser: false }));
		return await import('./progress');
	}

	it('exportProgress 输出含版本信封的 JSON，可回读完整数据', async () => {
		const { recordExercise, addMistake, exportProgress } = await loadProgressModule();
		recordExercise('quick-sort', true);
		recordExercise('kmp', false);
		addMistake({
			topic: 'kmp',
			type: 'algorithm',
			question: 'Q?',
			wrongAnswer: 'A',
			correctAnswer: 'B',
			explanation: 'E'
		});

		const json = exportProgress();
		const parsed = JSON.parse(json) as { __sv: number; data: import('./progress').ProgressData };
		expect(parsed.__sv).toBe(1);
		expect(parsed.data.topics['quick-sort']?.mastery).toBe(10);
		expect(parsed.data.topics['kmp']?.mastery).toBe(0);
		expect(parsed.data.mistakes).toHaveLength(1);
	});

	it('importProgress 导入有效数据并覆盖当前进度', async () => {
		const { importProgress, exportProgress } = await loadProgressModule();
		// 先导入一份数据
		const seed = JSON.stringify({
			__sv: 1,
			data: {
				topics: {
					bst: {
						mastery: 60,
						totalExercises: 6,
						correctExercises: 5,
						lastVisited: 1,
						completed: false
					}
				},
				mistakes: [],
				totalStudyTime: 120,
				streakDays: 3,
				lastActiveDate: '2026-08-01'
			}
		});
		const result = importProgress(seed);
		expect(result.ok).toBe(true);

		const json = exportProgress();
		const parsed = JSON.parse(json) as { data: import('./progress').ProgressData };
		expect(parsed.data.topics['bst']?.mastery).toBe(60);
		expect(parsed.data.streakDays).toBe(3);
		expect(parsed.data.lastActiveDate).toBe('2026-08-01');
	});

	it('importProgress 兼容旧版裸数据格式（无版本信封）', async () => {
		const { importProgress, exportProgress } = await loadProgressModule();
		const legacy = JSON.stringify({
			topics: {
				'hash-table': {
					mastery: 30,
					totalExercises: 3,
					correctExercises: 1,
					lastVisited: 9,
					completed: false
				}
			},
			mistakes: [],
			totalStudyTime: 0,
			streakDays: 0,
			lastActiveDate: ''
		});
		const result = importProgress(legacy);
		expect(result.ok).toBe(true);
		const parsed = JSON.parse(exportProgress()) as { data: import('./progress').ProgressData };
		expect(parsed.data.topics['hash-table']?.mastery).toBe(30);
	});

	it('importProgress 拒绝非法 JSON 与残缺结构，且不修改数据', async () => {
		const { importProgress, exportProgress, recordExercise } = await loadProgressModule();
		recordExercise('quick-sort', true);

		expect(importProgress('{bad json').ok).toBe(false);
		expect(importProgress('"just a string"').ok).toBe(false);
		expect(importProgress(JSON.stringify({ topics: 'nope' })).ok).toBe(false);

		// 数据未被破坏
		const parsed = JSON.parse(exportProgress()) as { data: import('./progress').ProgressData };
		expect(parsed.data.topics['quick-sort']?.mastery).toBe(10);
	});
});
