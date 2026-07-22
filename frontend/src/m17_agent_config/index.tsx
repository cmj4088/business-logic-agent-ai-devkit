/** M17 Agent 配置页 — Agent 和 LLM 模型配置 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import type { AgentRole } from '@/shared/types';
import { useAgentConfig } from './hooks/useAgentConfig';
import { useModelTest } from './hooks/useModelTest';
import { updatePromptTemplate } from './api';
import { ModelSelector } from './components/ModelSelector';
import { OllamaConfig } from './components/OllamaConfig';
import { ApiKeyConfig } from './components/ApiKeyConfig';
import { ModelTestPanel } from './components/ModelTestPanel';
import { AgentRoleList } from './components/AgentRoleList';
import { AgentRoleEditor } from './components/AgentRoleEditor';
import { PromptPreview } from './components/PromptPreview';
import { ModelParamsPanel } from './components/ModelParamsPanel';
import { PluginSelector } from './components/PluginSelector';
import { AgentPluginModal } from './components/AgentPluginModal';
import { AGENT_ROLE_META } from './types';

export default function AgentConfigPage() {
  const {
    config,
    promptTemplates,
    isLoadingTemplates,
    modelsLoading,
    loadError,
    setBackend,
    setOllamaUrl,
    setDefaultModel,
    setTemperature,
    setMaxTokens,
    setAnthropicApiKey,
    setOpenaiApiKey,
    setDeepseekApiKey,
    refreshModels,
    refreshTemplates,
  } = useAgentConfig();

  const { runTest } = useModelTest();

  // 编辑状态
  const [editingRole, setEditingRole] = useState<AgentRole | null>(null);
  const [previewingRole, setPreviewingRole] = useState<AgentRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 插件管理弹窗状态
  const [pluginManagerRole, setPluginManagerRole] = useState<AgentRole | null>(null);

  // 获取当前编辑角色的模板
  const editingTemplate = editingRole
    ? promptTemplates.find((t) => t.role === editingRole) ?? null
    : null;

  // 获取当前预览角色的提示词
  const previewingPrompt = previewingRole
    ? promptTemplates.find((t) => t.role === previewingRole)?.systemPrompt ?? ''
    : '';

  /** 查看提示词 */
  const handleViewPrompt = useCallback((role: AgentRole) => {
    setEditingRole(role);
    setPreviewingRole(null);
  }, []);

  /** 测试角色 */
  const handleTestRole = useCallback(
    (_role: AgentRole) => {
      const apiKey = config.defaultBackend === 'anthropic'
        ? config.anthropicApiKey
        : config.defaultBackend === 'openai'
          ? config.openaiApiKey
          : undefined;
      void runTest({
        backend: config.defaultBackend,
        model: config.defaultModel,
        ollamaUrl: config.defaultBackend === 'ollama' ? config.ollamaUrl : undefined,
        apiKey,
      });
    },
    [config, runTest],
  );

  /** 保存提示词 */
  const handleSavePrompt = useCallback(async (role: AgentRole, systemPrompt: string) => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updatePromptTemplate(role, { systemPrompt });
      setSaveMessage('提示词保存成功');
      await refreshTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存失败';
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [refreshTemplates]);

  /** 预览提示词 */
  const handlePreviewPrompt = useCallback((role: AgentRole) => {
    setPreviewingRole(role);
    setEditingRole(null);
  }, []);

  /** 关闭编辑/预览 */
  const handleCloseEditor = useCallback(() => {
    setEditingRole(null);
    setSaveMessage(null);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewingRole(null);
  }, []);

  /** 管理 Agent 插件 */
  const handleManagePlugins = useCallback((role: AgentRole) => {
    setPluginManagerRole(role);
  }, []);

  /** 关闭插件管理弹窗 */
  const handleClosePluginManager = useCallback(() => {
    setPluginManagerRole(null);
  }, []);

  /** 获取当前管理插件的 Agent 元数据 */
  const managedAgentMeta = pluginManagerRole
    ? AGENT_ROLE_META.find((m) => m.role === pluginManagerRole)
    : null;

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
        {/* 页面标题 */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Agent 配置</h1>
          <p className="mt-1 text-sm text-slate-400">
            配置 LLM 后端、API Key、Agent 角色和模型参数
          </p>
        </motion.div>

        {/* 保存消息 */}
        {saveMessage && (
          <motion.div variants={itemVariants} className="mb-4 rounded-md border border-green-500/30 bg-green-500/10 p-3">
            <p className="text-sm text-green-400">{saveMessage}</p>
          </motion.div>
        )}

        {/* 加载错误 */}
        {loadError && (
          <motion.div variants={itemVariants} className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{loadError}</p>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-6">
          {/* 1. LLM 后端选择 */}
          <ModelSelector
            value={config.defaultBackend}
            onChange={setBackend}
          />

          {/* 2. Ollama 配置（仅 Ollama 后端时显示） */}
          {config.defaultBackend === 'ollama' && (
            <OllamaConfig
              ollamaUrl={config.ollamaUrl}
              defaultModel={config.defaultModel}
              availableModels={config.availableModels}
              modelsLoading={modelsLoading}
              onUrlChange={setOllamaUrl}
              onModelChange={setDefaultModel}
              onRefreshModels={refreshModels}
            />
          )}

          {/* 3. Ollama 模型测试 */}
          {config.defaultBackend === 'ollama' && (
            <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-200">模型连接测试</h3>
              <ModelTestPanel
                backend="ollama"
                model={config.defaultModel}
                ollamaUrl={config.ollamaUrl}
              />
            </div>
          )}

          {/* 4. 云端 API Key 配置 */}
          <ApiKeyConfig
            deepseekApiKey={config.deepseekApiKey}
            anthropicApiKey={config.anthropicApiKey}
            openaiApiKey={config.openaiApiKey}
            defaultBackend={config.defaultBackend}
            onDeepseekKeyChange={setDeepseekApiKey}
            onAnthropicKeyChange={setAnthropicApiKey}
            onOpenaiKeyChange={setOpenaiApiKey}
          />

          {/* 5. Agent 角色列表 */}
          <AgentRoleList
            onViewPrompt={handleViewPrompt}
            onTestRole={handleTestRole}
            onManagePlugins={handleManagePlugins}
          />

          {/* 6. 插件管理 */}
          <PluginSelector />

          {/* 7. Agent 角色编辑器 */}
          {editingRole && (
            <AgentRoleEditor
              role={editingRole}
              template={editingTemplate}
              isLoading={isLoadingTemplates}
              isSaving={isSaving}
              onSave={handleSavePrompt}
              onPreview={handlePreviewPrompt}
              onClose={handleCloseEditor}
            />
          )}

          {/* 8. 提示词预览 */}
          {previewingRole && (
            <PromptPreview
              role={previewingRole}
              systemPrompt={previewingPrompt}
              onClose={handleClosePreview}
            />
          )}

          {/* 9. 高级参数 */}
          <ModelParamsPanel
            temperature={config.temperature}
            maxTokens={config.maxTokens}
            onTemperatureChange={setTemperature}
            onMaxTokensChange={setMaxTokens}
          />
        </motion.div>
      </div>

      {/* Agent 插件管理弹窗 */}
      {pluginManagerRole && managedAgentMeta && (
        <AgentPluginModal
          agentRole={pluginManagerRole}
          agentLabel={managedAgentMeta.label}
          agentIcon={managedAgentMeta.icon}
          onClose={handleClosePluginManager}
        />
      )}
    </AnimatedPageWrapper>
  );
}

export { useAgentConfig } from './hooks/useAgentConfig';
export { useModelTest } from './hooks/useModelTest';
export type {
  AgentConfig,
  LLMBackend,
  ModelInfo,
  PromptTemplate,
  PromptPreviewRequest,
  PromptPreviewResponse,
  ModelTestRequest,
  ModelTestResponse,
} from './types';