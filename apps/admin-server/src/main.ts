import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import config from "./config/configuration";
import { writeFileSync } from "fs";
import {
  AsyncContextProvider,
  FastifyLoggerEnv,
  FastifyPinoLogger,
  fastifyPinoOptions,
  genReqId,
  REQUEST_ID_HEADER,
} from "@libs/fastify-pino-logger";
import { ApiModule } from "@/api/api.module";
async function bootstrap() {
  // 初始化Fastify适配器，配置请求ID和日志
  const fastifyAdapter = new FastifyAdapter({
    requestIdHeader: REQUEST_ID_HEADER, // 请求ID头字段
    genReqId: genReqId(), // 生成唯一请求ID
    logger: fastifyPinoOptions(process.env.NODE_ENV as FastifyLoggerEnv), // 根据环境配置Pino日志
  });
  const api = await NestFactory.create<NestFastifyApplication>(
    ApiModule,
    new FastifyAdapter({
      logger: true,
    }),
    { abortOnError: false }
  );
  // 配置异步上下文和日志系统
  const asyncContext = api.get(AsyncContextProvider);
  const logger = new FastifyPinoLogger(
    asyncContext,
    fastifyAdapter.getInstance().log
  );
  api.useLogger(logger); // 设置应用使用自定义日志
  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle("API Documentation")
    .setDescription("API description")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(api, swaggerConfig);
  SwaggerModule.setup("api", api, document);

  writeFileSync("swagger.json", JSON.stringify(document, null, 2));

  api.enableCors({
    origin: [
      "http://localhost:5175",
      "http://localhost:4173",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Last-Event-ID",
      "x-request-id",
      "x-user-agent",
      "cache-hash",
    ],
    exposedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  });
  const appConfig = config();

  api.useGlobalPipes(new ValidationPipe());
  await api.listen(appConfig.http.port, appConfig.http.ip, () => {
    console.log(
      `HTTP server is listening on ${appConfig.http.ip}:${appConfig.http.port}`
    );
    console.log(
      `Swagger documentation available at http://${appConfig.http.ip}:${appConfig.http.port}/api`
    );
  });

  await NestFactory.createMicroservice(AppModule);
}
bootstrap();
