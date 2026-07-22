/** M16 AIBadge.test.tsx — AI 生成标识组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIBadge } from '../../components/AIBadge';
import type { AISource } from '../../types';

/** 创建测试 AI 来源 */
function createAISource(overrides: Partial<AISource> = {}): AISource {
  return {
    model: 'qwen2.5:7b',
    generatedAt: '2026-07-09T10:00:00Z',
    confidence: 85,
    reason: '自动生成 PRD 文档',
    ...overrides,
  };
}

describe('AIBadge', () => {
  it('AI 生成内容应显示"AI 生成"', () => {
    render(<AIBadge aiGenerated={true} />);
    expect(screen.getByText('AI 生成')).toBeInTheDocument();
  });

  it('非 AI 生成内容应显示"人工"', () => {
    render(<AIBadge aiGenerated={false} />);
    expect(screen.getByText('人工')).toBeInTheDocument();
  });

  it('有 AI 来源时应显示可信度百分比', () => {
    const source = createAISource({ confidence: 85 });
    render(<AIBadge aiGenerated={true} aiSource={source} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('AI 生成应有机器人图标', () => {
    render(<AIBadge aiGenerated={true} />);
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('人工应有用户图标', () => {
    render(<AIBadge aiGenerated={false} />);
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('高可信度（>=80）应显示绿色', () => {
    const source = createAISource({ confidence: 90 });
    render(<AIBadge aiGenerated={true} aiSource={source} />);
    const confidenceEl = screen.getByText('90%');
    expect(confidenceEl.className).toContain('text-green-600');
  });

  it('中可信度（50-79）应显示黄色', () => {
    const source = createAISource({ confidence: 65 });
    render(<AIBadge aiGenerated={true} aiSource={source} />);
    const confidenceEl = screen.getByText('65%');
    expect(confidenceEl.className).toContain('text-yellow-600');
  });

  it('低可信度（<50）应显示红色', () => {
    const source = createAISource({ confidence: 30 });
    render(<AIBadge aiGenerated={true} aiSource={source} />);
    const confidenceEl = screen.getByText('30%');
    expect(confidenceEl.className).toContain('text-red-600');
  });

  it('sm 尺寸应使用小号样式', () => {
    render(<AIBadge aiGenerated={true} size="sm" />);
    const badge = screen.getByText('AI 生成').parentElement!;
    expect(badge.className).toContain('text-xs');
  });

  it('md 尺寸应使用中号样式', () => {
    render(<AIBadge aiGenerated={true} size="md" />);
    const badge = screen.getByText('AI 生成').parentElement!;
    expect(badge.className).toContain('text-sm');
  });

  it('默认尺寸应为 md', () => {
    render(<AIBadge aiGenerated={true} />);
    const badge = screen.getByText('AI 生成').parentElement!;
    expect(badge.className).toContain('text-sm');
  });

  it('有 AI 来源时应有 title 提示', () => {
    const source = createAISource({ model: 'qwen2.5:7b', confidence: 85 });
    render(<AIBadge aiGenerated={true} aiSource={source} />);
    const badge = screen.getByText('AI 生成').parentElement!;
    expect(badge).toHaveAttribute('title');
    expect(badge.getAttribute('title')).toContain('qwen2.5:7b');
    expect(badge.getAttribute('title')).toContain('85%');
  });
});