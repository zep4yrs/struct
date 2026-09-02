-- M2.10 EXPLAIN 详解 seed：客户 / 订单（SQLite 方言）
CREATE TABLE "客户"
(
    "客户号" INTEGER PRIMARY KEY,
    "姓名"   TEXT
);
INSERT INTO "客户" VALUES
  (1, '张三'), (2, '李四'), (3, '王五');

CREATE TABLE "订单"
(
    "订单号" INTEGER,
    "客户号" INTEGER,
    "金额"   INTEGER
);
INSERT INTO "订单" VALUES
  (9001, 1, 300), (9002, 2, 450), (9003, 1, 260), (9004, 3, 520);
