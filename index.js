/**
 * 子Agent任务队列管理模块
 * 
 * 功能：
 * - 任务队列管理
 * - 状态追踪
 * - 任务派发
 */

const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', 'yinzi', 'yinzi-task-queue.md');

/**
 * 读取队列状态
 */
function readQueue() {
  try {
    return fs.readFileSync(QUEUE_FILE, 'utf-8');
  } catch (e) {
    return null;
  }
}

/**
 * 更新队列状态
 */
function updateQueue(content) {
  fs.writeFileSync(QUEUE_FILE, content, 'utf-8');
}

/**
 * 解析队列状态
 */
function parseQueueStatus(content) {
  const statusMatch = content.match(/\*\*影子状态\*\*:\s*(\S+)/);
  const currentMatch = content.match(/\*\*当前任务\*\*:\s*(.+)/);
  const lengthMatch = content.match(/\*\*队列长度\*\*:\s*(\d+)/);
  
  return {
    status: statusMatch ? statusMatch[1].trim() : '未知',
    currentTask: currentMatch ? currentMatch[1].trim() : '(无)',
    queueLength: lengthMatch ? parseInt(lengthMatch[1]) : 0
  };
}

module.exports = {
  readQueue,
  updateQueue,
  parseQueueStatus,
  QUEUE_FILE
};
