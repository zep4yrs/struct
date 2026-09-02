-- M2.6 WHERE vs HAVING seed：订单表（SQLite 方言）
CREATE TABLE "订单" ("订单号" INTEGER, "区域" TEXT, "金额" INTEGER);
INSERT INTO "订单" VALUES
  (101, '华东', 500),
  (102, '华南', 200),
  (103, '华东', 350),
  (104, '华北', 150),
  (105, '华南', 600),
  (106, '华东', 250),
  (107, '华北', 450);
