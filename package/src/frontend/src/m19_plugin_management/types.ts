/** 插件管理 — 类型定义 */

export interface PluginTool {
  tool_name: string;
  tool_schema: Record<string, unknown>;
}

export interface PluginInfo {
  /** 内部记录 ID（仅已安装插件有） */
  id?: string;
  /** 插件 ID */
  plugin_id: string;
  /** 插件名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 描述 */
  description: string;
  /** 分类 */
  category: string;
  /** 是否已安装 */
  installed: boolean;
  /** 是否已启用 */
  enabled?: boolean;
  /** 配置 Schema */
  config_schema?: Record<string, unknown>;
  /** 当前配置 */
  config?: Record<string, unknown>;
  /** 工具列表 */
  tools: PluginTool[];
  /** 安装时间 */
  installed_at?: string;
}

export interface PluginInstallRequest {
  plugin_id: string;
  config?: Record<string, unknown>;
}

export interface PluginToggleRequest {
  enabled: boolean;
}

export interface PluginConfigUpdateRequest {
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export interface PluginTestResult {
  success: boolean;
  message: string;
  plugin_id: string;
  search_engine?: string;
}