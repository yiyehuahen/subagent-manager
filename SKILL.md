---
name: subagent-manager
description: 子Agent任务队列管理技能。当需要管理多个子任务的派发、等待完成、依次执行时使用此技能。包括任务池、状态追踪、结果汇报。
---

# 子Agent管理技能

## 概述

本技能用于管理子Agent（影子）的工作流程：
- 任务队列管理
- 依次派发任务
- 追踪执行状态
- 完成后汇报结果

## 核心概念

### 1. 任务队列文件

位置：`yinzi/yinzi-task-queue.md`

格式：
```markdown
# 影子任务队列

## 队列状态
- **影子状态**: 🟢 空闲 / 🔴 工作中
- **当前任务**: 任务名称
- **队列长度**: N

## 任务队列
1. [ ] 任务1描述
2. [ ] 任务2描述
3. [ ] 任务3描述

## 执行日志
- 时间 - 任务 - 结果
```

### 2. 状态标志

| 状态 | 含义 |
|------|------|
| 🟢 空闲 | 影子可以接收新任务 |
| 🔴 工作中 | 影子正在执行任务 |

## 操作流程

### 步骤1: 接收任务

当用户给出多个任务时：
1. 读取当前队列状态
2. 将任务追加到队列
3. 更新队列文件

```javascript
// 伪代码
function addTasksToQueue(tasks) {
  const queue = readQueue();
  tasks.forEach(task => {
    queue.tasks.push({ status: 'pending', description: task });
  });
  writeQueue(queue);
  return `已添加 ${tasks.length} 个任务到队列`;
}
```

### 步骤2: 检查状态

派发任务前，先检查影子状态：
- 读取 yinzi-task-queue.md
- 如果状态是"🟢 空闲"，可以派发
- 如果状态是"🔴 工作中"，等待

### 步骤3: 派发任务

使用 `sessions_spawn` 派发任务给影子：

```javascript
// 派发任务给影子
sessions_spawn({
  task: "执行任务描述",
  runtime: "subagent",  // 或 "acp"
  mode: "run",         // run=一次性, session=持续
  cleanup: "delete",   // 完成后删除
  label: "yinzi-task-1"
})
```

### 步骤4: 更新状态

派发后立即更新队列状态：
- 状态改为 "🔴 工作中"
- 记录当前任务ID

### 步骤5: 等待完成

可以通过以下方式检查完成：
1. 使用 `subagents(action=list)` 查看状态
2. 使用 `sessions_history` 查看返回结果
3. 或者依赖定时任务/回调

### 步骤6: 汇报结果

任务完成后：
1. 从影子获取结果
2. 更新队列状态为 "🟢 空闲"
3. 汇报给用户

### 步骤7: 处理重做

如果用户要求重做：
1. 将任务重新加入队列头部
2. 状态改为 "🔴 工作中"
3. 重新派发给影子

### 步骤8: 派发下一个

完成当前任务后：
1. 从队列取出下一个任务
2. 派发给影子
3. 更新状态

## 完整流程图

```
用户 → [接收任务] → [加入队列]
                         ↓
                  [检查状态]
                         ↓
            ┌───────────┴───────────┐
            ↓                           ↓
       🟢 空闲                      🔴 工作中
            ↓                           ↓
      [派发任务]                   [等待完成]
            ↓                           ↓
      [更新状态]              ┌─────────┴─────────┐
            ↓                 ↓                   ↓
      [执行中...]         完成              需要重做
                           ↓                   ↓
                    [汇报用户]          [重新派发]
                           ↓                   ↓
                    [取下一个任务] ──────→ [派发任务]
```

## 配置参数

### sessions_spawn 常用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| task | 任务描述 | "帮我整理文档" |
| runtime | 运行时类型 | "subagent" 或 "acp" |
| mode | 运行模式 | "run"(一次性) / "session"(持续) |
| cleanup | 完成后清理 | "delete"(删除) / "keep"(保留) |
| label | 任务标签 | "yinzi-task-1" |
| model | 使用模型 | "mm2.5/minimax-m2.5" |

### 完整示例

```javascript
// 创建影子任务
const result = sessions_spawn({
  task: `你是紫馨的影子。请执行以下任务：
1. 读取 yinzi-task-queue.md 获取任务
2. 执行任务描述中的内容
3. 直接向用户汇报结果

任务内容：${taskDescription}`,
  runtime: "subagent",
  mode: "run",
  cleanup: "delete",
  label: `yinzi-task-${Date.now()}`,
  model: "mm2.5/minimax-m2.5"
});
```

## 队列管理命令

### 添加任务
```markdown
## 任务队列
1. [ ] 任务A
2. [ ] 任务B
```

### 标记进行中
```markdown
## 队列状态
- **影子状态**: 🔴 工作中
- **当前任务**: 任务A
```

### 标记完成
```markdown
## 任务队列
1. [x] 任务A
2. [ ] 任务B
```

### 标记失败/重做
```markdown
## 任务队列
1. [ ] 任务A (重做)
2. [ ] 任务B
```

## 注意事项

1. **一次只派发一个任务** - 不要一次性给影子多个任务
2. **状态要及时更新** - 派发和完成都要更新队列
3. **直接汇报给用户** - 影子完成后直接汇报给用户，不要经过中间人
4. **重做要循环** - 直到用户确认完成才派发下一个任务

## 相关工具

- `sessions_spawn` - 创建子Agent
- `sessions_send` - 向子Agent发送消息
- `subagents` - 查看/管理子Agent列表
- `sessions_history` - 获取子Agent历史
- `sessions_list` - 列出所有会话
