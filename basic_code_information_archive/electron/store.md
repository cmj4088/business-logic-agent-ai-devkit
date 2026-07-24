# store.ts — 安全存储模块

## 概述
该文件使用 `electron-store` 实现持久化存储配置数据，并使用 Electron 的 `safeStorage` API 对敏感字段进行加密。敏感字段（如 Token、API Key 等）使用操作系统级密钥链加密存储，非敏感字段以明文 JSON 存储。提供了读写删查等完整操作接口。

## 常量

### SENSITIVE_KEYS
- **类型**: `ReadonlySet<string>`
- **内容**: 需要加密存储的 key 列表
  - `auth_token` — 认证令牌
  - `refresh_token` — 刷新令牌
  - `api_key` — 通用 API 密钥
  - `openai_api_key` — OpenAI API 密钥
  - `anthropic_api_key` — Anthropic API 密钥
  - `deepseek_api_key` — DeepSeek API 密钥
  - `encryption_key` — 加密密钥

### ENCRYPTED_PREFIX
- **值**: `'__encrypted__:'`
- **用途**: 加密值的前缀标识，用于区分明文和密文

## 内部函数

### isSensitiveKey(key)
- **功能**: 判断 key 是否为敏感字段
- **参数**: `key: string`
- **返回值**: `boolean`

### encryptValue(plaintext)
- **功能**: 加密字符串值
- **参数**: `plaintext: string` — 明文字符串
- **返回值**: `string` — 带 `__encrypted__:` 前缀的 base64 编码密文
- **关键逻辑**:
  - 先检查 `safeStorage.isEncryptionAvailable()` 是否可用
  - 使用 `safeStorage.encryptString()` 加密
  - 将加密后的 Buffer 转为 base64 并添加前缀

### decryptValue(encryptedWithPrefix)
- **功能**: 解密字符串值
- **参数**: `encryptedWithPrefix: string` — 带前缀的 base64 编码密文
- **返回值**: `string` — 解密后的明文
- **关键逻辑**:
  - 先检查加密是否可用
  - 去除 `__encrypted__:` 前缀
  - 将 base64 转回 Buffer
  - 使用 `safeStorage.decryptString()` 解密

## 导出函数

### setSecureValue(key, value)
- **功能**: 存储值（敏感字段自动加密，非敏感字段明文存储）
- **参数**:
  - `key: string` — 存储键名
  - `value: string` — 要存储的值
- **关键逻辑**: 通过 `isSensitiveKey` 判断是否需要加密

### getSecureValue(key)
- **功能**: 读取值（敏感字段自动解密，非敏感字段直接返回）
- **参数**: `key: string` — 存储键名
- **返回值**: `string | undefined` — 解密后的值，不存在返回 undefined
- **关键逻辑**: 检查值是否以 `ENCRYPTED_PREFIX` 开头来决定是否解密

### deleteSecureValue(key)
- **功能**: 删除存储的值
- **参数**: `key: string` — 存储键名

### hasSecureValue(key)
- **功能**: 检查 key 是否存在
- **参数**: `key: string`
- **返回值**: `boolean`

### getAllKeys()
- **功能**: 获取所有存储的 key（用于调试）
- **返回值**: `string[]`

### clearAll()
- **功能**: 清空所有存储（用于重置应用）

## 存储实例

使用 `electron-store` 创建，配置如下：
- **name**: `'ipdagents-config'` — 存储文件名
- **encryptionKey**: `undefined` — 不使用 store 内置加密，自行使用 safeStorage 逐字段加密

## 加密原理

1. 写入时：敏感字段 → `safeStorage.encryptString()` → Buffer → base64 → 添加 `__encrypted__:` 前缀 → 写入 store
2. 读取时：从 store 读取 → 检查 `__encrypted__:` 前缀 → 去前缀 → base64 解码 → `safeStorage.decryptString()` → 明文返回
3. 非敏感字段：直接读写，不经过加解密流程

## 依赖关系
- `electron` — `safeStorage`
- `electron-store` — 持久化存储

## 注意事项
- `safeStorage` 依赖操作系统密钥链（Windows DPAPI、macOS Keychain、Linux libsecret），如果系统密钥链不可用则加密失败
- 加密值以 `__encrypted__:` 前缀标识，不要手动修改存储文件中的值
- 新增敏感字段时需要在 `SENSITIVE_KEYS` 集合中添加对应的 key
- `clearAll()` 会删除所有数据，不可恢复，使用时需谨慎
- 存储文件位于 Electron 的 `userData` 目录下