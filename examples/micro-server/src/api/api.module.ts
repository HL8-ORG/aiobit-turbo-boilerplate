import {
  AsyncContextProvider,
  FastifyPinoLogger,
} from "@libs/fastify-pino-logger";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import configuration from "@/config/configuration";
import { TracingModule } from "@/lib/infra/telemetry";
import {
  JetstreamModule,
  NatsStreamingMessageBus,
} from "@/lib/infra/nest-jetstream";
import { SSEModule } from "./sse.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env", // TODO make dynamic
      load: [configuration],
    }),
    JetstreamModule.forRoot({
      servers: [
        `nats://${process.env.NATS_HOST ?? "localhost"}:${
          process.env.NATS_PORT ?? 4222
        }`,
      ],
    }),
    SSEModule,
    TracingModule.register({
      messageBus: NatsStreamingMessageBus,
    }),
  ],
  controllers: [],
  providers: [AsyncContextProvider, FastifyPinoLogger],
})
// implements NestModule
export class ApiModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  // }
}
