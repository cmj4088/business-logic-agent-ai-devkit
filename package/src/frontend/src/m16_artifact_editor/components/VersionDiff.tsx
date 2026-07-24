/** M16 产出物编辑器 — 版本对比视图（并排 diff） */

import type { VersionDiff as VersionDiffType } from '../types';

interface VersionDiffProps {
  /** 版本对比数据 */
  diff: VersionDiffType;
  /** 关闭对比视图 */
  onClose: () => void;
}

/**
 * 版本对比视图，并排显示两个版本的差异，高亮变更部分。
 * - 新增行：绿色背景
 * - 删除行：红色背景
 * - 未变更行：无背景
 */
export function VersionDiff({ diff, onClose }: VersionDiffProps): React.ReactElement {
  // 左侧（旧版本）显示删除行和未变更行
  const leftLines = diff.lines.filter((l) => l.type !== 'added');
  // 右侧（新版本）显示新增行和未变更行
  const rightLines = diff.lines.filter((l) => l.type !== 'removed');

  const addedCount = diff.lines.filter((l) => l.type === 'added').length;
  const removedCount = diff.lines.filter((l) => l.type === 'removed').length;
  const unchangedCount = diff.lines.filter((l) => l.type === 'unchanged').length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* 对比头部 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-700">
            版本对比
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-200 border border-green-300" />
              <span className="text-slate-500">新增 {addedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-100 border border-red-200" />
              <span className="text-slate-500">删除 {removedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-white border border-slate-200" />
              <span className="text-slate-500">未变 {unchangedCount}</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
        >
          关闭对比
        </button>
      </div>

      {/* 版本标签行 */}
      <div className="grid grid-cols-2 border-b border-slate-200">
        <div className="px-4 py-2 border-r border-slate-200 bg-red-50/30">
          <span className="text-xs font-semibold text-slate-600">
            v{diff.oldVersion}（旧版本）
          </span>
        </div>
        <div className="px-4 py-2 bg-green-50/30">
          <span className="text-xs font-semibold text-slate-600">
            v{diff.newVersion}（新版本）
          </span>
        </div>
      </div>

      {/* 并排差异内容 */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 max-h-[600px] overflow-y-auto">
        {/* 左侧：旧版本 */}
        <div className="font-mono text-xs leading-6">
          {leftLines.map((line, idx) => (
            <div
              key={`left-${idx}`}
              className={`flex ${
                line.type === 'removed'
                  ? 'bg-red-50 border-l-2 border-red-300'
                  : 'border-l-2 border-transparent'
              }`}
            >
              <span className="flex-shrink-0 w-10 text-right pr-2 text-slate-300 select-none">
                {line.type === 'removed' ? line.lineNumber : ''}
              </span>
              <span
                className={`flex-1 px-2 whitespace-pre-wrap break-all ${
                  line.type === 'removed'
                    ? 'text-red-700 bg-red-50'
                    : 'text-slate-700'
                }`}
              >
                {line.type === 'removed' && (
                  <span className="text-red-400 select-none mr-1">- </span>
                )}
                {line.content}
              </span>
            </div>
          ))}
        </div>

        {/* 右侧：新版本 */}
        <div className="font-mono text-xs leading-6">
          {rightLines.map((line, idx) => (
            <div
              key={`right-${idx}`}
              className={`flex ${
                line.type === 'added'
                  ? 'bg-green-50 border-l-2 border-green-300'
                  : 'border-l-2 border-transparent'
              }`}
            >
              <span className="flex-shrink-0 w-10 text-right pr-2 text-slate-300 select-none">
                {line.type === 'added' ? line.lineNumber : ''}
              </span>
              <span
                className={`flex-1 px-2 whitespace-pre-wrap break-all ${
                  line.type === 'added'
                    ? 'text-green-700 bg-green-50'
                    : 'text-slate-700'
                }`}
              >
                {line.type === 'added' && (
                  <span className="text-green-400 select-none mr-1">+ </span>
                )}
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}