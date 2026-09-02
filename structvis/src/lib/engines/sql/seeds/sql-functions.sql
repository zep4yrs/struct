-- M2.5 SQL 函数演练 seed：员工表（含邮箱 / 入职日 / 奖金，SQLite 方言）
CREATE TABLE "员工"
(
    "工号"   INTEGER,
    "姓名"   TEXT,
    "邮箱"   TEXT,
    "入职日" TEXT,
    "工资"   INTEGER,
    "奖金"   INTEGER
);
INSERT INTO "员工" VALUES
  (1, '张三', 'zhangsan@corp.com', '2021-03-15', 12000, 5000),
  (2, '李四', 'lisi@corp.com',     '2022-07-01', 9000,  NULL),
  (3, '王五', 'wangwu@corp.com',   '2020-11-20', 8500,  3000),
  (4, '赵六', 'zhaoliu@corp.com',  '2023-05-09', 9500,  NULL),
  (5, '孙七', 'sunqi@corp.com',    '2019-12-01', 7000,  2000),
  (6, '周八', 'zhouba@corp.com',   '2024-02-18', 15000, 8000);
