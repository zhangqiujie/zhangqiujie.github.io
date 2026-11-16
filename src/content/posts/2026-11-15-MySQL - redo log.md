---
title: MySQL - redo log
description: InnoDB redo log 的预写日志原理、刷盘策略与崩溃恢复
author: zhang
date: 2026-11-15 00:00:00 +0800
categories: [MySQL, MySQL是怎样运行的 - 笔记]
tags: [MySQL, 学习笔记]
pin: false
---

## 一、为什么需要 redo log

InnoDB 先在 Buffer Pool 中修改数据页，修改后的页称为**脏页**。如果事务提交时必须把涉及的所有脏页写入数据文件，提交可能需要多次分散的页写入。InnoDB 使用 **redo log（重做日志）**记录页修改所需的恢复信息，让数据页可以稍后刷盘。

核心原则是 **WAL（Write-Ahead Logging，预写日志）**：修改后的数据页写入磁盘前，相关 redo 必须先持久化。在保证提交持久性的配置下，事务提交时先确保所需 redo 已刷盘，无需等待该事务涉及的所有脏页刷盘。这样即使之后发生崩溃，重启时仍可根据 redo 恢复已提交事务的修改。日志写入通常比在提交路径上刷多个分散的数据页更高效，但不能据此断言每次写入都更小、所有 I/O 都是顺序的，或任何场景下性能一定更好。

## 二、redo 记录什么

redo 记录的是 InnoDB 数据页修改的重做信息，并非原始 SQL 语句。理解“可以定位受影响的页并重做相关修改”即可；具体 `MLOG_*` 类型、数字编号和内部字段布局属于版本相关的实现细节。

InnoDB 使用 **LSN** 标识日志进度，通过 **checkpoint** 标记已完成必要数据页刷盘的进度，使较早的日志空间能够复用。理解它们与崩溃恢复范围、日志空间压力的关系即可，无须记忆内部编码格式。

## 三、Mini-Transaction 与日志组

InnoDB 将底层页修改组织为 **Mini-Transaction（mtr）**。一个用户事务可以包含多个 mtr；一个 mtr 也可能修改多个页，并产生多条 redo 记录。例如 B+ 树插入引起页分裂时，如果崩溃恢复只重做其中一部分页修改，索引结构就可能不一致。InnoDB 因此以完整的 redo 记录组作为恢复单位：未完整写入的组不会被部分应用。

mtr 的“原子”是底层页修改在恢复时作为整体处理，**不等于**用户事务的提交或回滚。mtr 本身没有业务层面的回滚语义；未提交的用户事务仍需在崩溃恢复中回滚。`MLOG_MULTI_REC_END` 是多记录组的内部结束标记，知道用途即可，无须记忆编码和具体日志类型。

## 四、redo 的写入路径

页修改产生的 redo 先由 mtr 在内部缓冲区收集，再写入内存中的 **log buffer**。log buffer 按 **redo log block** 组织日志数据；log block 是日志格式单元，不是数据页。随后后台日志线程将缓冲内容写入日志文件并刷盘。事务提交时是否等待相应 LSN 的 redo 刷盘，取决于 `innodb_flush_log_at_trx_commit` 等配置；日志进入 log buffer 不代表已经持久化。

### 哪些情况会推动 redo 写出或刷盘

`log buffer` 是内存缓冲区，日志**写入日志文件**与**刷盘持久化**是两步，不能把二者都称为“刷盘”。常见时机包括：

- `log buffer` 空间不足时，产生 redo 的线程需要等待缓冲空间释放，日志可能提前写出；这不等于每次都会执行磁盘同步。
- 事务提交时，是否等待所需 redo 刷盘由 `innodb_flush_log_at_trx_commit` 决定；值为 `1` 时每次提交都写入并刷盘，具体取舍见下节。
- 脏数据页写盘前，必须先保证该页最新修改对应的 redo 已刷盘，这是 WAL 的要求。
- 后台线程也会按 `innodb_flush_log_at_timeout` 指定的周期写入并刷盘；默认周期约为 1 秒，不是严格的最大间隔。

## 五、提交时日志何时刷盘

`innodb_flush_log_at_trx_commit` 决定事务提交时 redo 的写入和刷盘策略：

| 值 | 提交时的行为 | 持久性 |
| --- | --- | --- |
| `1`（默认） | 每次提交将 redo 写入日志文件并刷盘 | 通常用于要求提交后具备崩溃持久性的场景 |
| `2` | 每次提交写入日志文件，约每秒刷盘 | 操作系统或机器故障时可能丢失最近已提交的事务 |
| `0` | 提交时不要求写入日志文件，约每秒写入并刷盘 | mysqld 进程崩溃或机器故障时都可能丢失最近已提交的事务 |

“约每秒”不是严格的最大丢失窗口；调低刷盘频率是在吞吐与持久性之间做取舍。排查“提交成功后数据丢失”的问题时，应先检查这个参数及实际故障类型。若启用 binlog 且要求故障后的事务与复制日志保持持久和一致，还需配合 `sync_binlog=1`。

## 六、用一笔转账看提交与刷盘

假设 `account` 使用 InnoDB，账户 1 和 2 的初始余额均为 100，且 `innodb_flush_log_at_trx_commit=1`：

```sql
BEGIN;
UPDATE account SET balance = balance - 10 WHERE id = 1;
UPDATE account SET balance = balance + 10 WHERE id = 2;
COMMIT;
```

| 执行阶段 | Buffer Pool 中的数据页 | undo 与 redo | 磁盘数据页 |
| --- | --- | --- | --- |
| `BEGIN` 后 | 这笔转账尚未修改数据页 | 尚无这两次更新对应的记录 | 这笔转账尚未要求写盘 |
| 第一次 `UPDATE` 后 | 账户 1 的余额改为 90，相关页成为脏页 | 产生用于撤销修改的 undo，以及用于重做页修改的 redo；redo 可能已经写盘 | 不要求已更新，但后台也可能已刷页 |
| 第二次 `UPDATE` 后 | 账户 2 的余额改为 110，相关页成为脏页 | 再产生相应的 undo 与 redo；提交前的 redo 也可能提前刷盘 | 两个账户的页都不要求已刷，也可能已有页写盘 |
| `COMMIT` 成功返回 | 修改后的页可能仍是脏页 | 所需 redo 已按配置刷盘；undo 可能仍需保留以供多版本读取 | **无法仅凭提交成功判断这两个页是否已刷盘** |

表中的 redo、undo 都是对机制的概括，一条 `UPDATE` 不一定只产生一条日志。数据页即使在提交前写盘，也须遵守 WAL：其对应 redo 先持久化。若在 `COMMIT` 前崩溃，已写盘的 redo 或数据页并不等于事务已提交，恢复时仍需回滚；若提交成功后数据页尚未刷盘，重启时可用持久化的 redo 恢复修改。

## 七、崩溃恢复与边界

InnoDB 重启后会应用需要的 redo，随后回滚崩溃时尚未提交的事务。**redo 不等于 undo**：redo 用于重做页修改，undo 用于回滚和多版本读取。**redo 也不等于 binlog**：binlog 主要服务于复制和备份后的按时间点恢复，redo 用于 InnoDB 本机崩溃恢复。

redo 不能代替备份，也不能单独解决数据页写入一半造成的损坏；InnoDB 的双写机制用于处理这类页写入问题。

## 参考资料

- [MySQL 8.4：InnoDB Redo Log](https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html)
- [MySQL 8.4：InnoDB Recovery](https://dev.mysql.com/doc/refman/8.4/en/innodb-recovery.html)
- [MySQL 8.4：InnoDB 系统变量](https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html)
- [MySQL 8.4：Binary Log](https://dev.mysql.com/doc/refman/8.4/en/binary-log.html)
- [MySQL 8.4：Doublewrite Buffer](https://dev.mysql.com/doc/refman/8.4/en/innodb-doublewrite-buffer.html)
- [MySQL 8.4 源码文档：InnoDB redo log](https://dev.mysql.com/doc/dev/mysql-server/8.4.11/PAGE_INNODB_REDO_LOG.html)
- [MySQL 8.4 源码文档：mtr 日志类型](https://dev.mysql.com/doc/dev/mysql-server/8.4.11/mtr0types_8h.html)
- [MySQL 8.4：术语表](https://dev.mysql.com/doc/refman/8.4/en/glossary.html)

## 面试考点与案例

1. **转账事务在 `innodb_flush_log_at_trx_commit=1` 下收到 `COMMIT` 成功，能断定两个账户的数据页都已写盘吗？** 不能。提交保证所需 redo 已刷盘；数据页可能此前已刷，也可能仍为脏页，之后再刷。崩溃时可根据 redo 恢复未落盘的修改。
2. **`innodb_flush_log_at_trx_commit` 设为 `0`、`1`、`2`，故障时有什么差别？** `1` 每次提交写入并刷盘；`2` 每次提交写入日志文件但约每秒刷盘，操作系统或机器故障可能丢失近期提交；`0` 约每秒才写入并刷盘，mysqld 进程故障也可能丢失。间隔并非严格一秒。
3. **事务还没 `COMMIT`，redo 可能已经写入日志文件甚至刷盘吗？为什么？** 会。log buffer 空间压力可能推动日志提前写出；后台周期写刷，脏页刷盘前也须先让对应 redo 持久化。写入文件不等于刷盘，redo 已持久化也不等于用户事务已提交。
4. **mtr 的日志组完整恢复，是否意味着对应的用户事务已提交？** 不意味着。恢复时只应用完整的 mtr 日志组，避免 B+ 树多页修改只恢复一部分；一个用户事务可包含多个 mtr。即使提交前 redo 或数据页已经写盘，未提交事务的影响随后仍需回滚。
5. **redo、undo、binlog 分别解决什么问题？** redo 支持 InnoDB 本机崩溃恢复；undo 支持回滚与多版本读取；binlog 主要用于复制及备份后的按时间点恢复。
6. **磁盘数据页只写了一半，已有 redo 就足够修复吗？** 不足。redo 不能单独处理损坏的半页，InnoDB 还依靠双写机制处理这类页写入故障。
