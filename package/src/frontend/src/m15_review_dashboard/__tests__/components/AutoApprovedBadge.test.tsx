/** M15 AutoApprovedBadge.test.tsx — 自动通过标识组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoApprovedBadge } from '../../components/AutoApprovedBadge';

describe('AutoApprovedBadge', () => {
  it('应渲染"自动通过"文本', () => {
    render(<AutoApprovedBadge />);
    expect(screen.getByText('自动通过')).toBeInTheDocument();
  });

  it('不显示详情时不应渲染说明文字', () => {
    render(<AutoApprovedBadge showDetail={false} />);
    expect(screen.queryByText(/单人模式/)).not.toBeInTheDocument();
  });

  it('默认不显示详情', () => {
    render(<AutoApprovedBadge />);
    expect(screen.queryByText(/单人模式/)).not.toBeInTheDocument();
  });

  it('showDetail=true 时应显示说明文字', () => {
    render(<AutoApprovedBadge showDetail={true} />);
    expect(screen.getByText(/单人模式：自动通过，未经人工实质审查/)).toBeInTheDocument();
  });
});