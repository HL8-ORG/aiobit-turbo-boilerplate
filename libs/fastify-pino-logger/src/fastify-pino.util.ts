import { FastifyLoggerOptions, PinoLoggerOptions } from 'fastify/types/logger';
import hyperid from 'hyperid';

/**
 * 请求ID头部字段名
 * @description 用于从HTTP头中获取或设置请求ID
 */
export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * 日志环境类型
 * @description 定义支持的日志环境类型
 */
export type FastifyLoggerEnv =
  | 'local'
  | 'development'
  | 'staging'
  | 'production';

/**
 * 开发环境日志配置
 * @returns FastifyLoggerOptions & PinoLoggerOptions 日志配置对象
 *
 * @remarks
 * 工作机制：
 * 1. 使用pino-pretty进行格式化输出，适合开发环境阅读
 * 2. 配置了请求/响应的序列化器，提取关键信息
 * 3. 设置了敏感信息脱敏规则，符合GDPR要求
 * 4. 自定义了不同场景的日志消息格式
 */
const developmentLogger = (): any => {
  return {
    messageKey: 'msg',
    errorKey: 'err',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: true,
      },
    },
    level: 'debug',
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        id: req.id,
        path: req.routeOptions.url,
        parameters: req.params,
        headers: req.headers,
      }),
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
    customSuccessMessage,
    customReceivedMessage,
    customErrorMessage,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.email',
        'req.body.password',
        'req.body.oldPassword',
      ],
      censor: '**GDPR COMPLIANT**',
    },
  } as FastifyLoggerOptions & PinoLoggerOptions;
};

/**
 * 自定义成功日志消息
 * @param req 请求对象
 * @param res 响应对象
 * @param responseTime 响应时间(毫秒)
 * @returns 格式化后的日志消息
 */
const customSuccessMessage = (req: any, res: any, responseTime: number) => {
  return `[${req.id || '*'}] "${req.method} ${req.url}" ${res.statusCode} - "${req.headers['host']}" "${req.headers['user-agent']}" - ${responseTime} ms`;
};

/**
 * 自定义接收请求日志消息
 * @param req 请求对象
 * @returns 格式化后的日志消息
 */
const customReceivedMessage = (req: any) => {
  return `[${req.id || '*'}] "${req.method} ${req.url}"`;
};

/**
 * 自定义错误日志消息
 * @param req 请求对象
 * @param res 响应对象
 * @param err 错误对象
 * @returns 格式化后的日志消息
 */
const customErrorMessage = (req: any, res: any, err: any) => {
  return `[${req.id || '*'}] "${req.method} ${req.url}" ${res.statusCode} - "${req.headers['host']}" "${req.headers['user-agent']}" - message: ${err.message}`;
};

/**
 * 生成请求ID
 * @returns 请求ID生成函数
 *
 * @remarks
 * 工作机制：
 * 1. 优先从请求头中获取X-Request-Id
 * 2. 如果不存在则使用hyperid生成唯一ID
 */
export function genReqId() {
  return (req: any) => req.headers[REQUEST_ID_HEADER] || hyperid().uuid;
}

/**
 * 根据环境获取Pino日志配置
 * @param env 当前环境
 * @returns 对应环境的日志配置
 *
 * @remarks
 * 工作机制：
 * 1. 开发环境使用详细日志配置
 * 2. 生产环境使用精简配置
 * 3. 默认返回true表示使用Fastify默认日志
 */
export function fastifyPinoOptions(
  env: FastifyLoggerEnv,
): (FastifyLoggerOptions & PinoLoggerOptions) | boolean {
  const envToLogger = {
    local: developmentLogger(),
    development: developmentLogger(),
    production: {
      level: 'debug',
    },
    staging: {
      level: 'debug',
    },
  } as const;

  return envToLogger[env] ?? true;
}
