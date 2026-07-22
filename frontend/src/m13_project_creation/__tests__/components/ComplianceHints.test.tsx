/** M13 ComplianceHints.test.tsx — 合规提示组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComplianceHints } from '../../components/ComplianceHints';

describe('ComplianceHints', () => {
  it('医疗器械应显示 NMPA/FDA 认证提示', () => {
    render(<ComplianceHints industry="医疗器械" />);

    expect(screen.getByText('合规提醒')).toBeInTheDocument();
    expect(screen.getByText(/NMPA\/FDA 认证/)).toBeInTheDocument();
    expect(screen.getByText(/6-18 个月/)).toBeInTheDocument();
  });

  it('汽车电子应显示 IATF 16949 认证提示', () => {
    render(<ComplianceHints industry="汽车电子" />);

    expect(screen.getByText('合规提醒')).toBeInTheDocument();
    expect(screen.getByText(/IATF 16949/)).toBeInTheDocument();
  });

  it('航空应显示 DO-178C/DO-254 认证提示', () => {
    render(<ComplianceHints industry="航空" />);

    expect(screen.getByText('合规提醒')).toBeInTheDocument();
    expect(screen.getByText(/DO-178C\/DO-254/)).toBeInTheDocument();
  });

  it('无合规要求的行业应显示无特殊要求', () => {
    render(<ComplianceHints industry="消费电子" />);

    expect(screen.getByText('当前行业无特殊合规要求')).toBeInTheDocument();
    expect(screen.queryByText('合规提醒')).not.toBeInTheDocument();
  });

  it('未知行业应显示无特殊要求', () => {
    render(<ComplianceHints industry="未知行业" />);

    expect(screen.getByText('当前行业无特殊合规要求')).toBeInTheDocument();
  });
});