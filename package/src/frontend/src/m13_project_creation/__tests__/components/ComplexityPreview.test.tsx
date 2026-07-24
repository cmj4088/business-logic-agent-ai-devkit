/** M13 ComplexityPreview.test.tsx — 复杂度预览组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComplexityPreview } from '../../components/ComplexityPreview';
import type { ComplexityPreview as ComplexityPreviewType } from '../../types';

/** 创建测试复杂度预览 */
function createPreview(overrides: Partial<ComplexityPreviewType> = {}): ComplexityPreviewType {
  return {
    tier: 'standard',
    reason: '基于 10 人团队 + 12 周周期',
    activity_count: 24,
    estimated_duration: '12-16 周',
    ...overrides,
  };
}

describe('ComplexityPreview', () => {
  it('应渲染标题', () => {
    render(<ComplexityPreview preview={createPreview()} />);
    expect(screen.getByText('复杂度预览')).toBeInTheDocument();
  });

  it('应显示复杂度等级', () => {
    render(<ComplexityPreview preview={createPreview({ tier: 'standard' })} />);
    expect(screen.getByText('标准模式')).toBeInTheDocument();
  });

  it('lite 模式应显示"轻量模式"', () => {
    render(<ComplexityPreview preview={createPreview({ tier: 'lite' })} />);
    expect(screen.getByText('轻量模式')).toBeInTheDocument();
  });

  it('full 模式应显示"完整模式"', () => {
    render(<ComplexityPreview preview={createPreview({ tier: 'full' })} />);
    expect(screen.getByText('完整模式')).toBeInTheDocument();
  });

  it('auto 模式应显示"自动"', () => {
    render(<ComplexityPreview preview={createPreview({ tier: 'auto' })} />);
    expect(screen.getByText('自动')).toBeInTheDocument();
  });

  it('应显示复杂度原因', () => {
    render(<ComplexityPreview preview={createPreview({ reason: '小团队快速原型' })} />);
    expect(screen.getByText('小团队快速原型')).toBeInTheDocument();
  });

  it('应显示活动数量', () => {
    render(<ComplexityPreview preview={createPreview({ activity_count: 36 })} />);
    expect(screen.getByText('36')).toBeInTheDocument();
  });

  it('应显示预计周期', () => {
    render(<ComplexityPreview preview={createPreview({ estimated_duration: '4-8 周' })} />);
    expect(screen.getByText('4-8 周')).toBeInTheDocument();
  });

  it('未知等级应显示原始值', () => {
    render(<ComplexityPreview preview={createPreview({ tier: 'unknown' as any })} />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});