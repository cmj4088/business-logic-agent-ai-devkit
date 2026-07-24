/** M18 GeneralSettings.test.tsx — 全局设置组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneralSettings from '../../components/GeneralSettings';
import type { GlobalSettings } from '../../types';

/** 创建默认设置 */
function createSettings(overrides: Partial<GlobalSettings> = {}): GlobalSettings {
  return {
    language: 'zh-CN',
    theme: 'light',
    notifications: {
      gate_ready: true,
      stage_complete: true,
      budget_warning: false,
    },
    ...overrides,
  };
}

describe('GeneralSettings', () => {
  it('应渲染标题', () => {
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByText('全局设置')).toBeInTheDocument();
  });

  it('应显示界面语言选项', () => {
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByText('界面语言')).toBeInTheDocument();
    expect(screen.getByDisplayValue('简体中文')).toBeInTheDocument();
  });

  it('应显示主题选项', () => {
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByText('主题')).toBeInTheDocument();
    expect(screen.getByText('浅色')).toBeInTheDocument();
    expect(screen.getByText('深色')).toBeInTheDocument();
    expect(screen.getByText('跟随系统')).toBeInTheDocument();
  });

  it('应显示通知偏好选项', () => {
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByText('通知偏好')).toBeInTheDocument();
    expect(screen.getByText('门禁就绪时通知')).toBeInTheDocument();
    expect(screen.getByText('阶段完成时通知')).toBeInTheDocument();
    expect(screen.getByText('预算偏差时通知')).toBeInTheDocument();
  });

  it('应显示保存按钮', () => {
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('保存中应显示"保存中..."并禁用按钮', () => {
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={vi.fn()}
        isSaving={true}
      />,
    );

    expect(screen.getByText('保存中...')).toBeInTheDocument();
    expect(screen.getByText('保存中...')).toBeDisabled();
  });

  it('点击保存应调用 onSave 并传入当前设置', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const settings = createSettings();
    render(
      <GeneralSettings
        settings={settings}
        onSave={onSave}
        isSaving={false}
      />,
    );

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        language: 'zh-CN',
        theme: 'light',
        notifications: {
          gate_ready: true,
          stage_complete: true,
          budget_warning: false,
        },
      });
    });
  });

  it('保存成功应显示成功消息', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={onSave}
        isSaving={false}
      />,
    );

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(screen.getByText('设置已保存')).toBeInTheDocument();
    });
  });

  it('保存失败应显示错误消息', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={onSave}
        isSaving={false}
      />,
    );

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(screen.getByText('保存失败，请稍后重试')).toBeInTheDocument();
    });
  });

  it('切换通知偏好应更新状态', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const settings = createSettings({
      notifications: { gate_ready: true, stage_complete: true, budget_warning: true },
    });
    render(
      <GeneralSettings
        settings={settings}
        onSave={onSave}
        isSaving={false}
      />,
    );

    // 取消勾选 gate_ready
    const gateReadyCheckbox = screen.getByLabelText('门禁就绪时通知');
    fireEvent.click(gateReadyCheckbox);

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: {
            gate_ready: false,
            stage_complete: true,
            budget_warning: true,
          },
        }),
      );
    });
  });

  it('切换语言应更新设置', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(
      <GeneralSettings
        settings={createSettings()}
        onSave={onSave}
        isSaving={false}
      />,
    );

    const select = screen.getByDisplayValue('简体中文');
    fireEvent.change(select, { target: { value: 'en' } });

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'en' }),
      );
    });
  });

  it('设置变化时 useEffect 应同步 props', () => {
    const settings1 = createSettings({ language: 'zh-CN' });
    const settings2 = createSettings({ language: 'en' });

    const { rerender } = render(
      <GeneralSettings
        settings={settings1}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    expect(screen.getByDisplayValue('简体中文')).toBeInTheDocument();

    rerender(
      <GeneralSettings
        settings={settings2}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    // 语言选择应更新
    const select = screen.getByDisplayValue('English');
    expect(select).toBeInTheDocument();
  });
});