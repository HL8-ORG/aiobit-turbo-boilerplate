import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ApiController } from "./api/api.controller";
import { ApiService } from "./api/api.service";
import configuration from "./config/configuration";
import { ConfigModule } from "@nestjs/config";
import {
  AsyncContextProvider,
  FastifyPinoLogger,
  RequestIdMiddleware,
} from "@libs/fastify-pino-logger";
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || ".development.env",
      load: [configuration],
    }),
    UserModule,
  ],
  controllers: [ApiController],
  providers: [ApiService, AsyncContextProvider, FastifyPinoLogger],
})
export class ApiModule implements NestModule {
  /**
   * 配置全局中间件
   *
   * @param consumer - 中间件消费者
   * @remarks
   * - 应用RequestIdMiddleware到所有路由
   * - 为每个请求生成唯一ID便于追踪
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
