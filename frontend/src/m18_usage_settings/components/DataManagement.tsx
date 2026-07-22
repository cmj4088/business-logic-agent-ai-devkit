/** M18 用量与设置模块 — 数据管理组件 */

import React, { useState } from 'react';

interface DataManagementProps {
  onExport: () => Promise<boolean>;
  onClear: (confirmation: string) => Promise<boolean>;
}

const DataManagement: React.FC<DataManagementProps> = ({ onExport, onClear }) => {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearInput, setClearInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    const success = await onExport();
    if (success) {
      setMessage({ type: 'success', text: '数据导出成功' });
    } else {
      setMessage({ type: 'error', text: '导出失败，请稍后重试' });
    }
    setIsExporting(false);
  };

  const handleClear = async () => {
    if (clearInput !== 'DELETE') {
      setMessage({ type: 'error', text: '请输入 DELETE 确认清除' });
      return;
    }
    setIsClearing(true);
    setMessage(null);
    const success = await onClear(clearInput);
    if (success) {
      setMessage({ type: 'success', text: '所有数据已清除' });
      setShowClearDialog(false);
      setClearInput('');
    } else {
      setMessage({ type: 'error', text: '清除失败，请稍后重试' });
    }
    setIsClearing(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">数据管理</h2>

      <div className="rounded-xl border border-deep-border bg-deep-card p-4 space-y-4">
        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-lg bg-neon-blue/20 px-4 py-2 text-sm font-medium text-neon-blue hover:bg-neon-blue/30 disabled:opacity-50 transition-colors"
          >
            {isExporting ? '导出中...' : '导出所有项目数据'}
          </button>
          <button
            onClick={() => {
              setShowClearDialog(true);
              setClearInput('');
              setMessage(null);
            }}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
          >
            清除所有数据...
          </button>
        </div>

        {/* 提示 */}
        <p className="text-xs text-slate-500">
          清除所有数据不可恢复，请先导出备份。
        </p>

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        )}

        {/* 清除确认对话框 */}
        {showClearDialog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="rounded-xl border border-deep-border bg-deep-card p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100 mb-2">清除所有数据</h3>
              <p className="text-sm text-red-400 mb-4">
                此操作不可恢复！所有项目数据、用量记录、设置将被永久删除。
              </p>
              <p className="text-sm text-slate-400 mb-4">
                请输入 <code className="bg-deep-surface px-1.5 py-0.5 rounded text-red-400 font-mono text-xs border border-deep-border">DELETE</code> 确认操作：
              </p>
              <input
                type="text"
                value={clearInput}
                onChange={(e) => setClearInput(e.target.value)}
                placeholder="输入 DELETE"
                className="w-full px-3 py-2 border border-deep-border rounded-lg bg-deep-surface text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearDialog(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClear}
                  disabled={clearInput !== 'DELETE' || isClearing}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isClearing ? '清除中...' : '确认清除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagement;