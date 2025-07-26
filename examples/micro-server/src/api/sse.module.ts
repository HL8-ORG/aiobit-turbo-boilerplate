import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
// import { TodoSSEController } from "./todo.sse.controller";
import { ConfigModule } from "@nestjs/config";
// import { AuthModule } from "@/lib/infra/nest-auth-passport";
import configuration from "@/config/configuration";
import authConfiguration, {
  AuthEnvironmentVariables,
} from "@/config/auth.configuration";
import { ConfigService } from "@nestjs/config";
import {
  JetstreamModule,
  NatsStreamingIntegrationEventBus,
} from "@/lib/infra/nest-jetstream";

/**
 * SSE模块配置类
 *
 * @remarks
 * 该模块负责配置服务器发送事件(SSE)相关的依赖项和设置，包括：
 * 1. 事件发射器配置
 * 2. 应用配置管理
 * 3. 认证模块配置
 * 4. NATS消息流配置
 *
 * 使用NestJS的模块系统组织相关功能，通过依赖注入管理各组件生命周期
 */
@Module({
  imports: [
    /**
     * 事件发射器模块配置
     *
     * @remarks
     * 配置Node.js原生EventEmitter的扩展实现，提供应用内事件发布/订阅机制
     * 通过装饰器模式简化事件监听和触发
     */
    EventEmitterModule.forRoot({
      wildcard: false, // 是否启用通配符匹配事件名
      delimiter: ".", // 命名空间分隔符
      newListener: false, // 是否触发新监听器事件
      removeListener: false, // 是否触发移除监听器事件
      maxListeners: 10, // 单个事件最大监听器数量
      verboseMemoryLeak: false, // 内存泄漏时是否显示事件名
      ignoreErrors: false, // 是否忽略未处理的错误事件
    }),

    /**
     * 配置模块
     *
     * @remarks
     * 全局配置模块，从.env文件和环境变量加载配置
     * 支持多配置文件合并，提供类型安全的配置访问
     */
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用
      envFilePath: ".development.env", // 环境文件路径(TODO: 需改为动态加载)
      load: [configuration, authConfiguration], // 加载的配置文件
    }),

    /**
     * 认证模块
     *
     * @remarks
     * 异步配置的认证模块，包含JWT和PostgreSQL配置
     * 使用工厂模式动态注入配置服务
     */
    // AuthModule.forRootAsync({
    //   // JWT配置工厂
    //   jwtOptions: {
    //     useFactory: (
    //       configService: ConfigService<AuthEnvironmentVariables, true>
    //     ) => ({
    //       secret: configService.get("jwtSecret"), // JWT密钥
    //       signOptions: {
    //         expiresIn: `${configService.get("JWT_LIFETIME_SECONDS")}s`, // 过期时间
    //       },
    //     }),
    //     inject: [ConfigService], // 依赖注入配置服务
    //   },
    //   // PostgreSQL数据库配置工厂
    //   postgresOptions: {
    //     useFactory: (
    //       configService: ConfigService<AuthEnvironmentVariables, true>
    //     ) => ({
    //       database: configService.get("database.database", { infer: true }),
    //       host: configService.get("database.host", { infer: true }),
    //       port: configService.get("database.port", { infer: true }),
    //       user: configService.get("database.user", { infer: true }),
    //       password: configService.get("database.password", { infer: true }),
    //       max: 20, // 连接池最大连接数
    //     }),
    //     inject: [ConfigService],
    //   },
    //   // 集成事件总线(TODO: 需要修复类型断言)
    //   integrationEventBus: NatsStreamingIntegrationEventBus as any,
    // }),

    /**
     * NATS消息流模块
     *
     * @remarks
     * 配置NATS消息中间件连接，用于跨服务事件通信
     * 支持高吞吐量的发布/订阅模式
     */
    JetstreamModule.forRoot({
      servers: [
        `nats://${process.env.NATS_HOST ?? "localhost"}:${
          process.env.NATS_PORT ?? 4222
        }`, // NATS服务器地址
      ],
    }),
  ],
  controllers: [], // 模块控制器
  providers: [], // 模块服务提供者
  exports: [], // 模块导出项
})
export class SSEModule {}
