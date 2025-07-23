import * as winston from "winston";
import "winston-daily-rotate-file";
import { WinstonModuleAsyncOptions } from "nest-winston";
import { ConfigService } from "@nestjs/config";

export const winstonConfig: WinstonModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => {
    // 获取日志文件路径配置
    const infoLogConfig = configService.get("application.logger.info");
    const errorLogConfig = configService.get("application.logger.error");

    // 确保日志目录存在
    const fs = require("fs");
    const path = require("path");
    const logDir = path.dirname(infoLogConfig.filename);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    return {
      level: "debug",
      levels: { ...winston.config.syslog.levels, sql: 8 },
      transports: [
        // 普通日志文件 - 每日轮转
        new winston.transports.DailyRotateFile({
          dirname: infoLogConfig.dirname || "logs",
          filename: infoLogConfig.filename || "application-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: infoLogConfig.maxSize || "20m",
          maxFiles: infoLogConfig.maxFiles || "14d",
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.printf((logs) => {
              const { timestamp, level, message, context = "App" } = logs;
              return `[${timestamp}] [${level
                .toUpperCase()
                .padEnd(7)}] [${context}]: ${(message as string).replace(
                /\u001b\[[0-9;]*m/g,
                ""
              )}\r\n`;
            })
          ),
          level: "info",
        }),

        // 错误日志文件 - 每日轮转
        new winston.transports.DailyRotateFile({
          dirname: errorLogConfig.dirname || "logs",
          filename: errorLogConfig.filename || "error-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: errorLogConfig.maxSize || "20m",
          maxFiles: errorLogConfig.maxFiles || "30d",
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.printf((logs) => {
              const {
                timestamp,
                level,
                message,
                stack,
                context = "App",
              } = logs;
              let formattedStack = "";
              if (stack) {
                formattedStack =
                  typeof stack === "string"
                    ? stack
                    : JSON.stringify(stack, null, 2);
              }
              return `[${timestamp}] [${level
                .toUpperCase()
                .padEnd(7)}] [${context}]: ${(message as string).replace(
                /\u001b\[[0-9;]*m/g,
                ""
              )}\r\n${
                formattedStack ? `Stack Trace:\r\n${formattedStack}\r\n` : ""
              }`;
            })
          ),
          level: "error",
        }),

        // 控制台输出 (可以保留或者在生产环境中移除)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.colorize({ all: true }),
            winston.format.printf((logs) => {
              const { timestamp, level, message, context = "App" } = logs;
              return `[${timestamp}] [${level}] [${context}]: ${message}`;
            })
          ),
        }),
      ],
    };
  },
  inject: [ConfigService],
};
