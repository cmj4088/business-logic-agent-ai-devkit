/** M17 ApiKeyConfig.test.tsx — API Key 配置面板组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeyConfig } from '../../components/ApiKeyConfig';

/** Mock useModelTest */
vi.mock('../../hooks/useModelTest', () => ({
  useModelTest: () => ({
    isTesting: false,
    testResult: null,
    testError: null,
    runTest: vi.fn(),
    clearResult: vi.fn(),
  }),
}));

describe('ApiKeyConfig', () => {
  it('应渲染标题', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    expect(screen.getByText('云端 API（高级选项）')).toBeInTheDocument();
  });

  it('默认后端为 Ollama 时应显示"未启用"', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    expect(screen.getByText('未启用')).toBeInTheDocument();
  });

  it('应渲染 Anthropic API Key 输入框', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey="sk-ant-test123"
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Anthropic API Key')).toBeInTheDocument();
  });

  it('应渲染 OpenAI API Key 输入框', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey="sk-test456"
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
  });

  it('应显示数据出境提醒', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/数据将被发送到境外服务器/)).toBeInTheDocument();
  });

  it('输入 API Key 应调用 onChange', () => {
    const onAnthropicChange = vi.fn();
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey=""
        defaultBackend="ollama"
        onAnthropicKeyChange={onAnthropicChange}
        onDeepseekKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Anthropic API Key');
    fireEvent.change(input, { target: { value: 'sk-ant-newkey' } });
    expect(onAnthropicChange).toHaveBeenCalledWith('sk-ant-newkey');
  });

  it('有 API Key 时应显示脱敏文本', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey="sk-ant-abc123def456ghi789"
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    // 脱敏后应显示前4位和后4位
    expect(screen.getByText(/sk-a.*i789/)).toBeInTheDocument();
  });

  it('无 API Key 时测试按钮应禁用', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    const testButtons = screen.getAllByText('测试');
    for (const btn of testButtons) {
      expect(btn).toBeDisabled();
    }
  });

  it('有 API Key 时测试按钮应启用', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey="sk-ant-test123"
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
      />,
    );

    const testButtons = screen.getAllByText('测试');
    // 第二个测试按钮（Anthropic）应启用（第一个是 DeepSeek，无 Key 禁用）
    expect(testButtons[1]).not.toBeDisabled();
  });

  it('disabled 时应禁用所有输入', () => {
    render(
      <ApiKeyConfig
        deepseekApiKey=""
        anthropicApiKey=""
        openaiApiKey=""
        defaultBackend="ollama"
        onDeepseekKeyChange={vi.fn()}
        onAnthropicKeyChange={vi.fn()}
        onOpenaiKeyChange={vi.fn()}
        disabled={true}
      />,
    );

    const anthropicInput = screen.getByLabelText('Anthropic API Key');
    const openaiInput = screen.getByLabelText('OpenAI API Key');
    const deepseekInput = screen.getByLabelText('DeepSeek API Key');
    expect(deepseekInput).toBeDisabled();
    expect(anthropicInput).toBeDisabled();
    expect(openaiInput).toBeDisabled();
  });
});