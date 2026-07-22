/** M16 产出物编辑器 — AI 生成标识组件 */

import type { AISource } from '../types';

interface AIBadgeProps {
  /** 是否为 AI 生成 */
  aiGenerated: boolean;
  /** AI 来源信息 */
  aiSource?: AISource;
  /** 尺寸 */
  size?: 'sm' | 'md';
}

/**
 * 显示产出物的 AI 生成标识和可信度信息。
 * 如果非 AI 生成，显示人工标识。
 */
export function AIBadge({ aiGenerated, aiSource, size = 'md' }: AIBadgeProps): React.ReactElement {
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  if (!aiGenerated) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-deep-surface text-slate-400 font-medium ${sizeClasses}`}
      >
        <span className="text-xs">👤</span>
        <span>人工</span>
      </span>
    );
  }

  const confidenceColor = aiSource
    ? aiSource.confidence >= 80
      ? 'text-green-400'
      : aiSource.confidence >= 50
        ? 'text-yellow-400'
        : 'text-red-400'
    : '';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-neon-blue/10 text-neon-blue font-medium ${sizeClasses}`}
      title={aiSource ? `模型: ${aiSource.model}\n可信度: ${aiSource.confidence}%` : undefined}
    >
      <span className="text-xs">🤖</span>
      <span>AI 生成</span>
      {aiSource && (
        <span className={`ml-0.5 font-bold ${confidenceColor}`}>
          {aiSource.confidence}%
        </span>
      )}
    </span>
  );
}