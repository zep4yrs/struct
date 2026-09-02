-- M2.12 视图更新限制 seed：成绩表 + 好成绩视图（SQLite 方言）
CREATE TABLE "成绩" ("学号" INTEGER, "课程" TEXT, "分数" INTEGER);
INSERT INTO "成绩" VALUES
  (1, '数学', 90),
  (2, '数学', 75),
  (1, '英语', 85),
  (2, '英语', 60);

CREATE VIEW "数学好成绩" AS
SELECT * FROM "成绩" WHERE 课程 = '数学' AND 分数 >= 80;
