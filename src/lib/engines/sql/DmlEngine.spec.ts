import { describe, it, expect } from 'vitest';
import { DmlEngine } from './DmlEngine';

const TABLE = {
	columns: ['学号', '姓名', '专业', '成绩'],
	rows: [
		[20101, '张三', '计算机', 88],
		[20102, '李四', '软件工程', 92],
		[20105, '孙七', '软件工程', 63]
	]
};

function run(sql: string) {
	const e = new DmlEngine();
	e.init({ sql, table: TABLE });
	return e;
}

describe('DmlEngine', () => {
	it('INSERT 在表尾追加一行', () => {
		const e = run("INSERT INTO 学生 VALUES (20107, '吴九', '网络工程', 78)");
		const last = e.steps[e.steps.length - 1];
		expect(last.table!.rows).toHaveLength(4);
		expect(last.table!.rows[3]).toEqual([20107, '吴九', '网络工程', 78]);
	});

	it('INSERT 按列名插入，未给列填空值', () => {
		const e = run("INSERT INTO 学生 (学号, 姓名) VALUES (20108, '郑十')");
		const last = e.steps[e.steps.length - 1];
		expect(last.table!.rows[3]).toEqual([20108, '郑十', '', '']);
	});

	it('UPDATE 只修改命中 WHERE 的行', () => {
		const e = run('UPDATE 学生 SET 成绩 = 60 WHERE 成绩 < 65');
		const last = e.steps[e.steps.length - 1];
		expect(last.table!.rows).toEqual([
			[20101, '张三', '计算机', 88],
			[20102, '李四', '软件工程', 92],
			[20105, '孙七', '软件工程', 60]
		]);
	});

	it('UPDATE 无 WHERE 时更新所有行', () => {
		const e = run('UPDATE 学生 SET 成绩 = 100');
		const last = e.steps[e.steps.length - 1];
		expect(last.table!.rows.every((r) => r[3] === 100)).toBe(true);
	});

	it('DELETE 删除命中行', () => {
		const e = run('DELETE FROM 学生 WHERE 成绩 < 70');
		const last = e.steps[e.steps.length - 1];
		expect(last.table!.rows).toEqual([
			[20101, '张三', '计算机', 88],
			[20102, '李四', '软件工程', 92]
		]);
	});

	it('DELETE 无 WHERE 删除全部行', () => {
		const e = run('DELETE FROM 学生');
		const last = e.steps[e.steps.length - 1];
		expect(last.table!.rows).toHaveLength(0);
	});

	it('不支持的语句抛出错误', () => {
		expect(() => run('SELECT * FROM 学生')).toThrowError(/INSERT|UPDATE|DELETE/);
	});

	it('执行计划算子链按语句生成', () => {
		const e = run('UPDATE 学生 SET 成绩 = 60 WHERE 成绩 < 65');
		expect(e.pseudocode).toContain('FILTER 成绩 < 65');
		expect(e.pseudocode).toContain('UPDATE SET 成绩 = 60');
	});
});
