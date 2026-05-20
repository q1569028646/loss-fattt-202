/**
 * 日志记录工具
 * 用于统一管理和记录应用中的错误和警告
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  stack?: string;
}

// 最大日志条目数
const MAX_LOG_ENTRIES = 100;

// 内存中的日志存储
const logBuffer: LogEntry[] = [];

/**
 * 添加日志条目
 */
function addLogEntry(level: LogLevel, message: string, data?: unknown, error?: Error): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    stack: error?.stack,
  };

  // 添加到缓冲区
  logBuffer.push(entry);

  // 限制缓冲区大小
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.shift();
  }

  // 在开发环境下输出到控制台
  if (__DEV__) {
    const consoleMethod = level === 'error' ? console.error : 
                          level === 'warn' ? console.warn : 
                          level === 'info' ? console.info : console.log;
    
    if (error) {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, error, data);
    } else if (data) {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
    } else {
      consoleMethod(`[${level.toUpperCase()}] ${message}`);
    }
  }
}

/**
 * 记录调试信息
 */
export function debug(message: string, data?: unknown): void {
  addLogEntry('debug', message, data);
}

/**
 * 记录一般信息
 */
export function info(message: string, data?: unknown): void {
  addLogEntry('info', message, data);
}

/**
 * 记录警告
 */
export function warn(message: string, data?: unknown): void {
  addLogEntry('warn', message, data);
}

/**
 * 记录错误
 */
export function error(message: string, err?: Error | unknown, data?: unknown): void {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  addLogEntry('error', message, data, errorObj);
}

/**
 * 获取所有日志条目
 */
export function getLogs(): LogEntry[] {
  return [...logBuffer];
}

/**
 * 清空日志
 */
export function clearLogs(): void {
  logBuffer.length = 0;
}

/**
 * 导出日志为字符串
 */
export function exportLogs(): string {
  return logBuffer
    .map(entry => {
      let line = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
      if (entry.data) {
        line += ` | Data: ${JSON.stringify(entry.data)}`;
      }
      if (entry.stack) {
        line += `\nStack: ${entry.stack}`;
      }
      return line;
    })
    .join('\n---\n');
}

/**
 * 包装异步函数，自动捕获错误
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (err) {
      error(`Error in ${context}`, err);
      throw err;
    }
  }) as T;
}

// 声明全局变量
declare const __DEV__: boolean;
