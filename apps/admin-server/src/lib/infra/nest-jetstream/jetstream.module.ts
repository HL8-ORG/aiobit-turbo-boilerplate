import { DynamicModule, Module } from '@nestjs/common';
import { ConnectionOptions } from 'nats';

import { JetstreamModuleFeatureConfig } from './interfaces/module-feature-input.interface';
import { JetstreamCoreModule } from './jetstream-core.module';

/**
 * Jetstream 核心模块
 *
 * @remarks
 * 这是一个NestJS动态模块，提供与NATS JetStream消息系统的集成。
 * 采用模块化设计，通过forRoot()初始化全局连接，forFeature()配置具体功能。
 * 实际功能委托给JetstreamCoreModule实现，遵循NestJS模块封装最佳实践。
 */
@Module({})
export class JetstreamModule {
  /**
   * 配置模块根选项
   *
   * @param connectionOptions - NATS连接配置选项
   * @param timeoutMillis - 可选，操作超时时间(毫秒)
   *
   * @returns 返回动态模块配置
   *
   * @remarks
   * 1. 初始化全局NATS连接
   * 2. 设置默认超时时间
   * 3. 通过JetstreamCoreModule实现实际功能
   * 4. 此方法应在根模块调用一次
   */
  static forRoot(
    connectionOptions: ConnectionOptions,
    timeoutMillis?: number,
  ): DynamicModule {
    return {
      module: JetstreamModule,
      imports: [JetstreamCoreModule.forRoot(connectionOptions, timeoutMillis)],
    };
  }

  /**
   * 配置模块特性选项
   *
   * @param config - 特性模块配置
   *
   * @returns 返回动态模块配置
   *
   * @remarks
   * 1. 注册特定主题的消息处理器
   * 2. 配置流(Stream)和消费者(Consumer)
   * 3. 通过JetstreamCoreModule实现实际功能
   * 4. 可在特性模块中多次调用
   */
  static forFeature(config: JetstreamModuleFeatureConfig): DynamicModule {
    return {
      module: JetstreamModule,
      imports: [JetstreamCoreModule.forFeature(config)],
    };
  }
}
