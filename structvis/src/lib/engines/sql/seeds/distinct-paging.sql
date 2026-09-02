-- M2.7 DISTINCT 与分页 seed：选课记录（含重复课程，SQLite 方言）
CREATE TABLE "选课" ("学号" INTEGER, "课程" TEXT);
INSERT INTO "选课" VALUES
  (20101, 'C001'),
  (20101, 'C002'),
  (20102, 'C001'),
  (20102, 'C002'),
  (20103, 'C001'),
  (20103, 'C003');
