-- M2.8 JOIN 家族 seed：员工 / 部门（含互不匹配行，SQLite 方言）
CREATE TABLE "员工"
(
    "工号"     INTEGER,
    "姓名"     TEXT,
    "部门号"   INTEGER,
    "上级工号" INTEGER
);
INSERT INTO "员工" VALUES
  (1, '张三', 10, NULL),
  (2, '李四', 20, 1),
  (3, '王五', 30, 1),
  (4, '赵六', NULL, 2);

CREATE TABLE "部门" ("部门号" INTEGER, "部门名" TEXT);
INSERT INTO "部门" VALUES
  (10, '技术部'),
  (20, '市场部'),
  (40, '财务部');
