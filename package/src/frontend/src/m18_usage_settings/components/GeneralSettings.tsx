/** M18 用量与设置模块 — 全局设置组件 */

import React, { useState, useEffect } from 'react';
import type { GlobalSettings, NotificationPreferences } from '../types';

interface GeneralSettingsProps {
  settings: GlobalSettings;
  onSave: (settings: GlobalSettings) => Promise<boolean>;
  isSaving: boolean;
}

const LANGUAGES: { value: GlobalSettings['language']; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
];

const THEMES: { value: GlobalSettings['theme']; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, onSave, isSaving }) => {
  const [language, setLanguage] = useState(settings.language);
  const [theme, setTheme] = useState(settings.theme);
  const [notifications, setNotifications] = useState<NotificationPreferences>(settings.notifications);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLanguage(settings.language);
    setTheme(settings.theme);
    setNotifications(settings.notifications);
  }, [settings]);

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setMessage(null);
    const newSettings: GlobalSettings = {
      language,
      theme,
      notifications,
    };
    const success = await onSave(newSettings);
    if (success) {
      setMessage({ type: 'success', text: '设置已保存' });
    } else {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-100">全局设置</h2>

      {/* 界面语言 & 主题 & 通知 */}
      <div className="bg-deep-card rounded-lg border border-deep-border p-4 space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400 w-24">界面语言</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as GlobalSettings['language'])}
            className="px-3 py-1.5 border border-deep-border rounded text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-neon-blue bg-deep-surface"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* 主题 */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 w-24">主题</span>
          <div className="flex gap-4">
            {THEMES.map((t) => (
              <label key={t.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={(e) => setTheme(e.target.value as GlobalSettings['theme'])}
                  className="w-4 h-4 text-neon-blue border-slate-500 focus:ring-neon-blue bg-deep-surface"
                />
                <span className="text-sm text-slate-400">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 通知 */}
        <div className="space-y-2">
          <span className="text-sm text-slate-400">通知偏好</span>
          <div className="space-y-2 ml-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.gate_ready}
                onChange={() => handleNotificationToggle('gate_ready')}
                className="w-4 h-4 text-neon-blue rounded border-slate-500 focus:ring-neon-blue bg-deep-surface"
              />
              <span className="text-sm text-slate-400">门禁就绪时通知</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.stage_complete}
                onChange={() => handleNotificationToggle('stage_complete')}
                className="w-4 h-4 text-neon-blue rounded border-slate-500 focus:ring-neon-blue bg-deep-surface"
              />
              <span className="text-sm text-slate-400">阶段完成时通知</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.budget_warning}
                onChange={() => handleNotificationToggle('budget_warning')}
                className="w-4 h-4 text-neon-blue rounded border-slate-500 focus:ring-neon-blue bg-deep-surface"
              />
              <span className="text-sm text-slate-400">预算偏差时通知</span>
            </label>
          </div>
        </div>

        {/* 保存 */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-neon-blue text-white text-sm rounded hover:bg-neon-blue/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;