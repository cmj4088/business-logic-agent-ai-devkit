/** M13 IndustrySelector.test.tsx — 行业选择器组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustrySelector, INDUSTRY_OPTIONS } from '../../components/IndustrySelector';

describe('IndustrySelector', () => {
  it('应渲染所有行业选项', () => {
    render(<IndustrySelector value="消费电子" onChange={vi.fn()} />);

    for (const opt of INDUSTRY_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    }
  });

  it('应显示当前选中的行业', () => {
    render(<IndustrySelector value="医疗器械" onChange={vi.fn()} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('医疗器械');
  });

  it('选择行业应调用 onChange', () => {
    const onChange = vi.fn();
    render(<IndustrySelector value="消费电子" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '汽车电子' } });
    expect(onChange).toHaveBeenCalledWith('汽车电子');
  });

  it('应显示合规提示', () => {
    render(<IndustrySelector value="医疗器械" onChange={vi.fn()} />);

    expect(screen.getByText('合规提醒')).toBeInTheDocument();
    expect(screen.getByText(/NMPA\/FDA/)).toBeInTheDocument();
  });

  it('无合规要求的行业应显示无特殊要求', () => {
    render(<IndustrySelector value="消费电子" onChange={vi.fn()} />);

    expect(screen.getByText('当前行业无特殊合规要求')).toBeInTheDocument();
  });
});