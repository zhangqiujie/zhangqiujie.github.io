# InnoDB 数据页（Index Page）概览

## 页的简介
- 页是 InnoDB 管理存储空间的基本单位
- 常见页大小：16KB
- 存放表记录的页称为 **索引（INDEX）页**

## 索引页的七个部分
- File Header（固定 38 字节）
- Page Header（固定 56 字节）
- Infimum + Supremum（两个伪记录，固定 26 字节）
- User Records（真实记录区域，大小可变）
- Free Space（未使用空间）
- Page Directory（页目录 / 槽，存放偏移量）
- File Trailer（末尾校验，固定 8 字节）

## 行记录在页中的存储
- 新页初始无 User Records，插入第一条记录后从 Free Space 分配
- 记录通过页内链表（next_record）排序（按主键大小）

### 记录头信息（关键字段）
- heap_no
  - 表示记录在本页中的位置（最小伪记录 heap_no=0，最大伪记录 heap_no=1）
- record_type
  - 0 = 普通记录
  - 1 = B+树非叶子节点记录
  - 2 = 最小记录
  - 3 = 最大记录
- delete_mask
  - 标记是否删除（1 = 已删除）
  - 已删除记录从主链移除并加入垃圾链表，待复用
- n_owned
  - 记录分组时，组尾记录的 n_owned 表示该组记录数
- next_record
  - 按主键顺序的单链表指针（页内相对位置）

## Page Directory（页目录 / 槽）
- 构建流程：
  1. 将所有“正常记录”（含最小/最大，排除已删除）划分为若干组
  2. 每组最后一条记录的 n_owned 表示该组条数
  3. 将每组最后一条记录的地址偏移按序存到页尾，称为“槽”
- 分组规则（记录数限制）：
  - 最小记录所在组：只能有 1 条
  - 最大记录所在组：1 ~ 8 条
  - 其他组：4 ~ 8 条（当组内达到 8 条时会分裂）
- 槽为有序数组，可通过相邻槽快速定位组的最小主键
- 在页内查找主键的步骤：
  1. 二分查找确定目标记录所在槽（组）
  2. 从该槽对应组的最小记录开始，通过 next_record 遍历组内记录

## Page Header（页面头部，56 字节）——（了解）
- PAGE_N_DIR_SLOTS（2B）：页目录槽数
- PAGE_HEAP_TOP（2B）：未使用空间的最小地址（Free Space 起点）
- PAGE_N_HEAP（2B）：本页记录数量（含最小/最大/被标记删除）
- PAGE_FREE（2B）：第一个被标记删除记录地址（可复用）
- PAGE_GARBAGE（2B）：已删除记录占用字节数
- PAGE_LAST_INSERT（2B）：最后插入记录位置
- PAGE_DIRECTION（2B）：记录插入方向
- PAGE_N_DIRECTION（2B）：连续插入计数
- PAGE_N_RECS（2B）：有效记录数（不含最小/最大/已删除）
- PAGE_MAX_TRX_ID（8B）：修改本页的最大事务 ID（仅二级索引定义）
- PAGE_LEVEL（2B）：本页在 B+ 树中的层级
- PAGE_INDEX_ID（8B）：索引 ID（本页所属索引）
- PAGE_BTR_SEG_LEAF（10B）：B+树叶段头（仅 Root 页）
- PAGE_BTR_SEG_TOP（10B）：B+树非叶段头（仅 Root 页）

## File Header（文件头部，38 字节）——（了解）
- FIL_PAGE_SPACE_OR_CHKSUM（4B）：页校验或表空间 id
- FIL_PAGE_OFFSET（4B）：页号
- FIL_PAGE_PREV（4B）：上一个页号
- FIL_PAGE_NEXT（4B）：下一个页号
- FIL_PAGE_LSN（8B）：页面最后修改对应的 LSN
- FIL_PAGE_TYPE（2B）：页类型
- FIL_PAGE_FILE_FLUSH_LSN（8B）：文件已刷新到的最小 LSN（系统表空间部分页）
- FIL_PAGE_ARCH_LOG_NO_OR_SPACE_ID（4B）：表空间标识

- 说明：数据页之间通过 FIL_PAGE_PREV / FIL_PAGE_NEXT 组成双链表

## File Trailer（页尾，8 字节）
- 作用：校验页写入完整性与一致性（用于崩溃恢复 / 读取检查）
- 前 4 字节：页的校验和（应与 File Header 中的 checksum 一致）
- 后 4 字节：页最后修改时 LSN 的低 32 位（应与 Page Header 中 FIL_PAGE_LSN 的低 32 位一致）
- 若两者不匹配，可能存在刷盘中断或部分写（partial write）问题