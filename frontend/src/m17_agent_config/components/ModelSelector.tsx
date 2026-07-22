/** M17 模型选择器 — 选择默认 LLM 后端 */

import type { LLMBackend } from '../types';
import { LLM_BACKEND_OPTIONS } from '../types';

interface ModelSelectorProps {
  value: LLMBackend;
  onChange: (backend: LLMBackend) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-200">LLM 后端</h3>
      <fieldset disabled={disabled}>
        <legend className="sr-only">选择默认 LLM 后端</legend>
        <div className="space-y-3">
          {LLM_BACKEND_OPTIONS.map((opt) => {
            const isCloud = opt.value === 'anthropic' || opt.value === 'openai';
            const isRecommended = opt.value === 'ollama';
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  value === opt.value
                    ? 'border-neon-blue/50 bg-neon-blue/10'
                    : 'border-deep-border bg-deep-surface hover:border-deep-border/70'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="llm-backend"
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 text-neon-blue focus:ring-neon-blue"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{opt.label}</span>
                    {isRecommended && (
                      <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                        推荐
                      </span>
                    )}
                    {isCloud && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                        云端
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}