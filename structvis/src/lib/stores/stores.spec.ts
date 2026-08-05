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

	it('浏览器环境：订阅后每次 set 都写入 localStorage', async () => {
		const { persistentStore } = await loadPersistent(true);
		const storage = localStorage as unknown as MockStorage;
		const s = persistentStore<{ n: number }>('k4', { n: 1 });
		const unsub = s.subscribe(() => {});
		s.set({ n: 2 });
		s.set({ n: 3 });
		unsub();
		expect(storage.getItem('k4')).toBe(JSON.stringify({ n: 3 }));
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

		// 模拟连续：把 lastActiveDate 拨到昨天再调用
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		progress.update((p) => ({ ...p, lastActiveDate: yesterday.toISOString().slice(0, 10) }));
		updateStreak();
		expect(state!.streakDays).toBe(2);

		// 断档：拨到 3 天前
		const old = new Date();
		old.setDate(old.getDate() - 3);
		progress.update((p) => ({ ...p, lastActiveDate: old.toISOString().slice(0, 10) }));
		updateStreak();
		expect(state!.streakDays).toBe(1);
	});
});
