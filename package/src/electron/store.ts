/**
 * 安全存储模块
 *
 * 使用 electron-store 持久化存储配置数据。
 * 敏感字段（Token、API Key 等）通过 Electron safeStorage 加密存储。
 * 非敏感字段以明文 JSON 存储。
 */
import { safeStorage } from 'electron';
import Store from 'electron-store';

/** 敏感 key 列表 — 这些 key 的值会经过 safeStorage 加密 */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'auth_token',
  'refresh_token',
  'api_key',
  'openai_api_key',
  'anthropic_api_key',
  'deepseek_api_key',
  'encryption_key',
]);

/** 加密前缀，用于标识已加密的值 */
const ENCRYPTED_PREFIX = '__encrypted__:';

/** Electron Store 实例 */
const store = new Store<Record<string, string>>({
  name: 'ipdagents-config',
  encryptionKey: undefined, // 使用 safeStorage 逐字段加密，不依赖 store 内置加密
});

/**
 * 判断 key 是否为敏感字段
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

/**
 * 加密字符串值
 * 返回带前缀的 base64 编码密文
 */
function encryptValue(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage 加密不可用，请检查操作系统密钥链');
  }
  const encrypted = safeStorage.encryptString(plaintext);
  return ENCRYPTED_PREFIX + encrypted.toString('base64');
}

/**
 * 解密字符串值
 * 输入必须是带前缀的 base64 编码密文
 */
function decryptValue(encryptedWithPrefix: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage 加密不可用，请检查操作系统密钥链');
  }
  const base64 = encryptedWithPrefix.slice(ENCRYPTED_PREFIX.length);
  const buffer = Buffer.from(base64, 'base64');
  return safeStorage.decryptString(buffer);
}

/**
 * 存储值
 * - 敏感字段自动加密
 * - 非敏感字段明文存储
 */
export function setSecureValue(key: string, value: string): void {
  if (isSensitiveKey(key)) {
    const encrypted = encryptValue(value);
    store.set(key, encrypted);
  } else {
    store.set(key, value);
  }
}

/**
 * 读取值
 * - 敏感字段自动解密
 * - 非敏感字段直接返回
 * - 不存在的 key 返回 undefined
 */
export function getSecureValue(key: string): string | undefined {
  const raw = store.get(key);
  if (raw === undefined) {
    return undefined;
  }
  if (isSensitiveKey(key) && raw.startsWith(ENCRYPTED_PREFIX)) {
    return decryptValue(raw);
  }
  return raw;
}

/**
 * 删除存储的值
 */
export function deleteSecureValue(key: string): void {
  store.delete(key);
}

/**
 * 检查 key 是否存在
 */
export function hasSecureValue(key: string): boolean {
  return store.has(key);
}

/**
 * 获取所有存储的 key（用于调试）
 */
export function getAllKeys(): string[] {
  return Object.keys(store.store);
}

/**
 * 清空所有存储（用于重置应用）
 */
export function clearAll(): void {
  store.clear();
}