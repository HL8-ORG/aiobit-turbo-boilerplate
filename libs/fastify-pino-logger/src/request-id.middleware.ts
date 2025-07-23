import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { REQUEST_ID_HEADER } from './fastify-pino.util';

/**
 * 请求ID中间件
 * @description 处理请求ID的生成和传递
 *
 * @remarks
 * 工作机制：
 * 1. 从Fastify请求对象中获取自动生成的请求ID
 * 2. 如果存在请求ID，则将其设置到响应头中(X-Request-Id)
 * 3. 确保请求ID在整个请求链路中可追踪
 * 4. 适用于日志追踪和分布式系统调试
 *
 * @example
 * 使用方式：
 * 在NestJS模块中通过app.use()全局注册
 * 或通过@Module()装饰器的providers数组注入
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  /**
   * 中间件核心处理方法
   * @param req Fastify请求对象
   * @param res Fastify响应对象(原始Node.js响应)
   * @param next 中间件链控制函数
   *
   * @remarks
   * 处理流程：
   * 1. Fastify会自动为每个请求生成唯一ID(req.id)
   * 2. 将该ID通过响应头返回给客户端
   * 3. 确保后续日志记录器可以获取该ID进行关联
   */
  use(req: FastifyRequest, res: FastifyReply['raw'], next: () => void) {
    const requestId = req.id;

    if (requestId) {
      res.setHeader(REQUEST_ID_HEADER, requestId);
    }

    next();
  }
}
