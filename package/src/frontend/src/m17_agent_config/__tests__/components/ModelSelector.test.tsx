/** M17 ModelSelector.test.tsx — LLM 后端选择器组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelector } from '../../components/ModelSelector';

describe('ModelSelector', () => {
  it('应渲染标题', () => {
    render(<ModelSelector value="ollama" onChange={vi.fn()} />);
    expect(screen.getByText('LLM 后端')).toBeInTheDocument();
  });

  it('应渲染所有后端选项', () => {
    render(<ModelSelector value="ollama" onChange={vi.fn()} />);

    expect(screen.getByText(/Ollama/)).toBeInTheDocument();
    expect(screen.getByText(/Anthropic/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
  });

  it('应显示 Ollama 推荐标签', () => {
    render(<ModelSelector value="ollama" onChange={vi.fn()} />);
    expect(screen.getByText('推荐')).toBeInTheDocument();
  });

  it('Anthropic 和 OpenAI 应显示云端标签', () => {
    render(<ModelSelector value="ollama" onChange={vi.fn()} />);
    const cloudBadges = screen.getAllByText('云端');
    expect(cloudBadges).toHaveLength(2);
  });

  it('应显示各后端的描述', () => {
    render(<ModelSelector value="ollama" onChange={vi.fn()} />);

    expect(screen.getByText(/数据在本地处理/)).toBeInTheDocument();
    expect(screen.getByText(/Claude API/)).toBeInTheDocument();
    expect(screen.getByText(/GPT API/)).toBeInTheDocument();
  });

  it('当前选中的后端应高亮', () => {
    render(<ModelSelector value="anthropic" onChange={vi.fn()} />);

    const anthropicRadio = screen.getByDisplayValue('anthropic');
    expect(anthropicRadio).toBeChecked();
  });

  it('选择后端应调用 onChange', () => {
    const onChange = vi.fn();
    render(<ModelSelector value="ollama" onChange={onChange} />);

    const anthropicRadio = screen.getByDisplayValue('anthropic');
    fireEvent.click(anthropicRadio);
    expect(onChange).toHaveBeenCalledWith('anthropic');
  });

  it('disabled 时应禁用所有选项', () => {
    render(<ModelSelector value="ollama" onChange={vi.fn()} disabled={true} />);

    const radios = screen.getAllByRole('radio');
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }
  });
});