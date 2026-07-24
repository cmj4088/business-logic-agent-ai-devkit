/** M17 模型参数面板 — temperature、max_tokens 等高级参数 */

import { useState, useCallback, useEffect } from 'react';

interface ModelParamsPanelProps {
  temperature: number;
  maxTokens: number;
  onTemperatureChange: (temp: number) => void;
  onMaxTokensChange: (tokens: number) => void;
  disabled?: boolean;
}

const TEMPERATURE_MIN = 0.0;
const TEMPERATURE_MAX = 2.0;
const TEMPERATURE_STEP = 0.1;

const TOKENS_MIN = 1024;
const TOKENS_MAX = 128000;
const TOKENS_STEP = 1024;

export function ModelParamsPanel({
  temperature,
  maxTokens,
  onTemperatureChange,
  onMaxTokensChange,
  disabled = false,
}: ModelParamsPanelProps) {
  const [localTemp, setLocalTemp] = useState(temperature);
  const [localTokens, setLocalTokens] = useState(maxTokens);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalTemp(temperature);
  }, [temperature]);

  useEffect(() => {
    setLocalTokens(maxTokens);
  }, [maxTokens]);

  const handleTempChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        setLocalTemp(val);
      }
    },
    [],
  );

  const handleTokensChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        setLocalTokens(val);
      }
    },
    [],
  );

  const tempPercent = ((localTemp - TEMPERATURE_MIN) / (TEMPERATURE_MAX - TEMPERATURE_MIN)) * 100;
  const tokensPercent = ((localTokens - TOKENS_MIN) / (TOKENS_MAX - TOKENS_MIN)) * 100;

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="text-base font-semibold text-slate-200">高级参数</h3>
        <span className="text-sm text-slate-500 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Temperature */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="temperature" className="text-sm font-medium text-slate-400">
                Temperature
              </label>
              <span className="text-sm font-mono text-slate-500">{localTemp.toFixed(1)}</span>
            </div>
            <div className="relative">
              <input
                id="temperature"
                type="range"
                min={TEMPERATURE_MIN}
                max={TEMPERATURE_MAX}
                step={TEMPERATURE_STEP}
                value={localTemp}
                onChange={handleTempChange}
                disabled={disabled}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-neon-blue disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${tempPercent}%, #334155 ${tempPercent}%, #334155 100%)`,
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{TEMPERATURE_MIN.toFixed(1)} — 精确</span>
                <span>{TEMPERATURE_MAX.toFixed(1)} — 创意</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              值越高输出越随机，值越低输出越确定。默认 0.7 适合大多数场景。
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="max-tokens" className="text-sm font-medium text-slate-400">
                Max Tokens
              </label>
              <span className="text-sm font-mono text-slate-500">{localTokens.toLocaleString()}</span>
            </div>
            <div className="relative">
              <input
                id="max-tokens"
                type="range"
                min={TOKENS_MIN}
                max={TOKENS_MAX}
                step={TOKENS_STEP}
                value={localTokens}
                onChange={handleTokensChange}
                disabled={disabled}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-neon-blue disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${tokensPercent}%, #334155 ${tokensPercent}%, #334155 100%)`,
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{TOKENS_MIN.toLocaleString()}</span>
                <span>{TOKENS_MAX.toLocaleString()}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              限制模型单次响应的最大 token 数。默认 32,000 适合大多数场景。
            </p>
          </div>

          {/* 预设快速选择 */}
          <div>
            <span className="mb-2 block text-xs font-medium text-slate-500">快速预设</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '精确模式', temp: 0.2, tokens: 16000 },
                { label: '默认模式', temp: 0.7, tokens: 32000 },
                { label: '创意模式', temp: 1.2, tokens: 64000 },
                { label: '长文模式', temp: 0.7, tokens: 128000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setLocalTemp(preset.temp);
                    setLocalTokens(preset.tokens);
                    onTemperatureChange(preset.temp);
                    onMaxTokensChange(preset.tokens);
                  }}
                  disabled={disabled}
                  className="rounded-full border border-deep-border bg-deep-surface px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:text-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}