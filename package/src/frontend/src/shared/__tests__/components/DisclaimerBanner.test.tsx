/** DisclaimerBanner.test.tsx — 免责声明横幅组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisclaimerBanner } from '../../components/DisclaimerBanner';

describe('DisclaimerBanner', () => {
  it('应渲染 AI 生成内容声明', () => {
    render(<DisclaimerBanner />);

    expect(screen.getByText('AI 生成内容声明：')).toBeInTheDocument();
    expect(screen.getByText(/AI 自动生成，仅供参考/)).toBeInTheDocument();
  });

  it('默认应显示"知道了"按钮', () => {
    render(<DisclaimerBanner />);

    expect(screen.getByText('知道了')).toBeInTheDocument();
  });

  it('点击"知道了"应隐藏横幅', () => {
    render(<DisclaimerBanner />);

    fireEvent.click(screen.getByText('知道了'));
    expect(screen.queryByText('AI 生成内容声明：')).not.toBeInTheDocument();
  });

  it('dismissible=false 时不应显示"知道了"按钮', () => {
    render(<DisclaimerBanner dismissible={false} />);

    expect(screen.queryByText('知道了')).not.toBeInTheDocument();
  });

  it('dismissible=false 时应显示 AI 生成标签', () => {
    render(<DisclaimerBanner dismissible={false} />);

    expect(screen.getByText('AI 生成')).toBeInTheDocument();
  });

  it('position=bottom 应使用 fixed 定位', () => {
    render(<DisclaimerBanner position="bottom" />);

    const banner = screen.getByText('AI 生成内容声明：').closest('div')?.parentElement?.parentElement;
    expect(banner?.className).toContain('fixed');
  });

  it('position=inline 不应使用 fixed 定位', () => {
    render(<DisclaimerBanner position="inline" />);

    const banner = screen.getByText('AI 生成内容声明：').closest('div')?.parentElement?.parentElement;
    expect(banner?.className).not.toContain('fixed');
  });

  it('应显示警告图标', () => {
    render(<DisclaimerBanner />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});