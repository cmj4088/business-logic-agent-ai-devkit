/** M18 用量与设置模块 — 每日趋势图（CSS 柱状图） */

import React from 'react';
import type { DailyTrendItem } from '../types';

interface DailyTrendChartProps {
  data: DailyTrendItem[];
}

/** 模型对应颜色映射 */
const MODEL_COLORS: Record<string, string> = {
  ollama: 'bg-green-500',
  'claude-sonnet': 'bg-neon-blue',
  'claude-opus': 'bg-blue-600',
  'gpt-4o': 'bg-purple-500',
  'gpt-4': 'bg-purple-600',
  default: 'bg-slate-600',
};

/** 获取模型对应的颜色类名 */
function getModelColor(modelName: string): string {
  return MODEL_COLORS[modelName] ?? MODEL_COLORS.default;
}

/** 格式化数字 */
function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(0)}K`;
  }
  return n.toString();
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-deep-card rounded-lg border border-deep-border p-6 text-center text-slate-500">
        暂无趋势数据
      </div>
    );
  }

  // 计算最大值用于高度比例
  const maxTokens = Math.max(...data.map((d) => d.total_tokens), 1);

  // 收集所有出现的模型名
  const allModels = new Set<string>();
  data.forEach((d) => {
    Object.keys(d.model_breakdown).forEach((m) => allModels.add(m));
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">每日趋势</h2>

      <div className="bg-deep-card rounded-lg border border-deep-border p-4">
        {/* 图例 */}
        <div className="flex flex-wrap gap-4 mb-4">
          {Array.from(allModels).map((model) => (
            <div key={model} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${getModelColor(model)}`} />
              <span className="text-xs text-slate-400">{model}</span>
            </div>
          ))}
        </div>

        {/* 柱状图 */}
        <div className="relative" style={{ height: '240px' }}>
          {/* Y 轴标尺 */}
          <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between">
            <span className="text-xs text-slate-500 text-right pr-1">{formatNumber(maxTokens)}</span>
            <span className="text-xs text-slate-500 text-right pr-1">{formatNumber(Math.floor(maxTokens / 2))}</span>
            <span className="text-xs text-slate-500 text-right pr-1">0</span>
          </div>

          {/* 柱状图区域 */}
          <div className="ml-10 h-full flex items-end gap-1 overflow-x-auto">
            {data.map((item) => (
              <div
                key={item.date}
                className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full"
                title={`${item.date}: ${formatNumber(item.total_tokens)} tokens`}
              >
                {/* 堆叠柱状图 */}
                <div className="w-full flex flex-col-reverse">
                  {Object.entries(item.model_breakdown).map(([model, count]) => {
                    const heightPercent = (count / maxTokens) * 100;
                    if (heightPercent < 1) return null;
                    return (
                      <div
                        key={model}
                        className={`w-full ${getModelColor(model)} transition-all duration-200 hover:opacity-80`}
                        style={{ height: `${heightPercent * 2}px`, minHeight: '2px' }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* X 轴标签 */}
          <div className="ml-10 flex gap-1 overflow-x-auto mt-1">
            {data.map((item) => (
              <div
                key={item.date}
                className="flex-1 min-w-[20px] text-center"
              >
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {formatDate(item.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTrendChart;