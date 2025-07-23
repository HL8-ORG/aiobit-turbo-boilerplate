import { Injectable, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * 异步上下文提供者
 * @description 基于AsyncLocalStorage实现的异步上下文管理服务
 *
 * @remarks
 * 工作机制：
 * 1. 使用Node.js的AsyncLocalStorage API创建异步本地存储
 * 2. 通过Map结构存储键值对数据
 * 3. 在异步调用链中保持上下文数据隔离
 * 4. 适用于需要跟踪请求链路的场景，如日志记录、请求追踪等
 */
@Injectable()
export class AsyncContextProvider implements OnModuleInit {
  /**
   * 异步本地存储实例
   * @description 使用Map作为存储结构，支持任意类型的键值对
   */
  private readonly asyncLocalStorage = new AsyncLocalStorage<
    Map<string, any>
  >();

  onModuleInit() {}

  /**
   * 在指定上下文中运行回调函数
   * @param callback 要执行的函数
   * @param store 上下文数据存储Map
   *
   * @remarks
   * 原理：
   * 1. 通过AsyncLocalStorage.run方法建立新的存储上下文
   * 2. 在该上下文中执行回调函数
   * 3. 回调函数内部可通过get/set访问上下文数据
   */
  run(callback: () => void, store: Map<string, any>) {
    this.asyncLocalStorage.run(store, callback);
  }

  /**
   * 获取上下文中的值
   * @param key 要获取的键名
   * @returns 键对应的值，未找到返回undefined
   *
   * @typeParam T 返回值类型
   */
  get<T>(key: string): T | undefined {
    const store = this.asyncLocalStorage.getStore();
    return store?.get(key);
  }

  /**
   * 设置上下文中的值
   * @param key 要设置的键名
   * @param value 要设置的值
   *
   * @remarks
   * 注意：
   * 1. 必须在run方法建立的上下文中调用才有效
   * 2. 如果当前没有活跃的上下文，调用无效
   */
  set(key: string, value: any) {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store.set(key, value);
    }
  }
}
