import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { type FastifyBaseLogger } from 'fastify';
import pino from 'pino';
import { AsyncContextProvider } from './async-context.provider';

/**
 * Fastify Pino 日志记录器
 * @description 基于Fastify和Pino的日志记录器实现，扩展自NestJS的ConsoleLogger
 *
 * @remarks
 * 工作机制：
 * 1. 使用TRANSIENT作用域，每个注入点获得独立实例
 * 2. 支持从异步上下文中获取请求级日志记录器
 * 3. 自动处理错误对象和消息格式化
 * 4. 兼容NestJS标准日志接口
 */
@Injectable({ scope: Scope.TRANSIENT })
export class FastifyPinoLogger extends ConsoleLogger {
  /** 日志上下文字段名 */
  protected readonly contextName: string = 'context';
  /** 日志消息字段名 */
  private readonly messageKey: string;
  /** 错误对象字段名 */
  private readonly errorKey: string;

  /**
   * 构造函数
   * @param asyncContext 异步上下文提供者
   * @param logger Fastify基础日志记录器
   *
   * @remarks
   * 初始化过程：
   * 1. 从pino符号中获取消息和错误键名，默认为'msg'和'err'
   * 2. 调用父类ConsoleLogger的构造函数
   */
  constructor(
    private readonly asyncContext: AsyncContextProvider,
    private readonly logger: FastifyBaseLogger,
  ) {
    super();
    this.messageKey =
      (this.logger as any)[pino.symbols.messageKeySym as any] || 'msg';
    this.errorKey =
      (this.logger as any)[pino.symbols.errorKeySym as any] || 'err';
  }

  /**
   * 格式化日志消息
   * @param message 原始消息
   * @returns 格式化后的字符串
   *
   * @remarks
   * 处理逻辑：
   * 1. 字符串直接返回
   * 2. 非字符串对象转为JSON字符串
   */
  private formatMsg(message: any) {
    return typeof message === 'string' ? message : JSON.stringify(message);
  }

  /**
   * 带错误级别的日志记录核心方法
   * @param level 日志级别
   * @param message 日志消息
   * @param context 日志上下文
   * @param optionalParams 额外参数
   *
   * @remarks
   * 处理流程：
   * 1. 获取请求级日志记录器
   * 2. 格式化消息内容
   * 3. 构建日志对象结构
   * 4. 特殊处理Error对象
   * 5. 调用Pino日志方法
   */
  private logWithErrLevel(
    level: 'info' | 'warn' | 'debug' | 'trace' | 'error' | 'fatal',
    message: any,
    context?: string,
    ...optionalParams: any[]
  ) {
    const reqLogger = this.getRequestLogger();
    const formattedMessage = this.formatMsg(message);

    const extra =
      optionalParams.length === 0 ||
      optionalParams.every((param) => param == null)
        ? undefined
        : optionalParams;

    const logObject = {
      [this.messageKey]: formattedMessage,
      [this.contextName]: context,
      ...(extra && { extra }),
    } as Record<string, any>;

    if (message instanceof Error) {
      logObject[this.messageKey] = message.message;
      logObject[this.errorKey] = message;
    }

    reqLogger[level](logObject);
  }

  /**
   * 通用日志记录方法
   * @param level 日志级别
   * @param message 日志消息
   * @param contextOrParams 上下文或参数
   * @param optionalParams 额外参数
   *
   * @remarks
   * 参数处理逻辑：
   * 1. 识别contextOrParams是否为上下文字符串
   * 2. 重组参数数组
   * 3. 调用核心日志方法
   */
  private logMessage(
    level: 'info' | 'warn' | 'debug' | 'trace' | 'error' | 'fatal',
    message: any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ) {
    const context =
      typeof contextOrParams === 'string' ? contextOrParams : undefined;
    const additionalParams = context
      ? optionalParams
      : [contextOrParams, ...optionalParams];
    this.logWithErrLevel(level, message, context, ...additionalParams);
  }

  // 以下为标准NestJS日志接口实现，每个方法对应不同日志级别
  // 通过方法重载支持多种参数组合

  /** INFO级别日志 */
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(
    message: any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ): void {
    this.logMessage('info', message, contextOrParams, ...optionalParams);
  }

  /** ERROR级别日志 */
  error(message: any, stackOrContext?: string, context?: string): void;
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(
    message: any,
    stackOrContext?: string | any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ): void {
    const stack =
      typeof stackOrContext === 'string' ? stackOrContext : undefined;
    const context =
      typeof contextOrParams === 'string' ? contextOrParams : undefined;
    const additionalParams = context
      ? optionalParams
      : [contextOrParams, ...optionalParams];
    this.logWithErrLevel('error', message, context, stack, ...additionalParams);
  }

  /** WARN级别日志 */
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(
    message: any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ): void {
    this.logMessage('warn', message, contextOrParams, ...optionalParams);
  }

  /** DEBUG级别日志 */
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(
    message: any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ): void {
    this.logMessage('debug', message, contextOrParams, ...optionalParams);
  }

  /** VERBOSE级别日志(映射为Pino的TRACE级别) */
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(
    message: any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ): void {
    this.logMessage('trace', message, contextOrParams, ...optionalParams);
  }

  /** FATAL级别日志 */
  fatal(message: any, context?: string): void;
  fatal(message: any, ...optionalParams: [...any, string?]): void;
  fatal(
    message: any,
    contextOrParams?: string | any,
    ...optionalParams: any[]
  ): void {
    this.logMessage('fatal', message, contextOrParams, ...optionalParams);
  }

  /**
   * 获取请求级日志记录器
   * @returns Fastify日志记录器实例
   *
   * @remarks
   * 获取逻辑：
   * 1. 优先从异步上下文中获取请求级日志记录器
   * 2. 不存在时返回基础日志记录器
   */
  private getRequestLogger(): FastifyBaseLogger {
    return this.asyncContext.get<FastifyBaseLogger>('log') || this.logger;
  }
}
