/** 插件管理 — API 调用 */

import { get, post, put, del } from '@/shared/api-client';
import type {
  PluginInfo,
  PluginInstallRequest,
  PluginToggleRequest,
  PluginConfigUpdateRequest,
  PluginTestResult,
} from './types';

/** 获取已安装的插件列表 */
export async function fetchInstalledPlugins(): Promise<PluginInfo[]> {
  return get<PluginInfo[]>('/api/plugins');
}

/** 获取可用插件市场列表 */
export async function fetchAvailablePlugins(): Promise<PluginInfo[]> {
  return get<PluginInfo[]>('/api/plugins/available');
}

/** 安装插件 */
export async function installPlugin(data: PluginInstallRequest): Promise<PluginInfo> {
  return post<PluginInfo>('/api/plugins/install', data);
}

/** 获取插件详情 */
export async function fetchPluginDetail(pluginId: string): Promise<PluginInfo> {
  return get<PluginInfo>(`/api/plugins/${pluginId}`);
}

/** 更新插件配置 */
export async function updatePlugin(
  pluginId: string,
  data: PluginConfigUpdateRequest,
): Promise<PluginInfo> {
  return put<PluginInfo>(`/api/plugins/${pluginId}`, data);
}

/** 卸载插件 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  return del<void>(`/api/plugins/${pluginId}`);
}

/** 启用/禁用插件 */
export async function togglePlugin(
  pluginId: string,
  data: PluginToggleRequest,
): Promise<PluginInfo> {
  return post<PluginInfo>(`/api/plugins/${pluginId}/toggle`, data);
}

/** 测试插件连接 */
export async function testPlugin(pluginId: string): Promise<PluginTestResult> {
  return post<PluginTestResult>(`/api/plugins/${pluginId}/test`);
}