import { useProjectCreation } from '../hooks/useProjectCreation';
import { IndustrySelector } from './IndustrySelector';
import { ComplexityPreview } from './ComplexityPreview';
import { useNavigate } from 'react-router-dom';

const BUILTIN_TEMPLATES = [
  { value: 'standard_ipd_v3', label: '硬件 IPD', group: '内置模板' },
  { value: 'software_ipd', label: '软件 IPD', group: '内置模板' },
  { value: 'medical_ipd', label: '医疗器械 IPD', group: '内置模板' },
] as const;

const CUSTOM_TEMPLATES = [
  { value: 'tpl_agile_v1', label: '敏捷开发流程', group: '我的模板' },
  { value: 'tpl_content_v1', label: '内容创作 SOP', group: '我的模板' },
  { value: 'tpl_delivery_v1', label: '客户交付流程', group: '我的模板' },
] as const;

const TEAM_SIZE_OPTIONS = [
  { label: '1-5人', value: 3 },
  { label: '6-20人', value: 10 },
  { label: '20人+', value: 30 },
] as const;

export function QuickStartForm({ preselectedTemplate }: { preselectedTemplate?: string }) {
  const navigate = useNavigate();
  const {
    formData,
    errors,
    isSubmitting,
    submitError,
    complexityPreview,
    updateField,
    handleSubmit,
  } = useProjectCreation(preselectedTemplate);

  const isFormValid =
    formData.name &&
    formData.name.trim().length >= 2 &&
    formData.name.length <= 50 &&
    formData.target_weeks !== undefined &&
    formData.target_weeks >= 1 &&
    formData.target_weeks <= 52 &&
    formData.team_size !== undefined &&
    formData.team_size >= 1 &&
    formData.budget_limit !== undefined &&
    formData.budget_limit >= 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      className="space-y-6 rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm"
    >
      {/* 产品名称 */}
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium text-slate-200 mb-1">
          产品名称 <span className="text-red-500">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          value={formData.name ?? ''}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="输入产品名称（2-50 字符）"
          maxLength={50}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-deep-surface focus:outline-none focus:ring-1 ${
            errors.name
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-deep-border focus:border-neon-blue focus:ring-neon-blue'
          } ${errors.name ? 'text-red-300' : 'text-slate-200'}`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* 选择模板 */}
      <div>
        <label htmlFor="project-template" className="block text-sm font-medium text-slate-200 mb-1">
          选择模板
        </label>
        <select
          id="project-template"
          value={formData.template_id ?? 'standard_ipd_v3'}
          onChange={(e) => {
            if (e.target.value === '__new_template__') {
              navigate('/templates/new');
              return;
            }
            updateField('template_id', e.target.value);
          }}
          className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
        >
          <optgroup label="── 内置模板 ──">
            {BUILTIN_TEMPLATES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="── 我的模板 ──">
            {CUSTOM_TEMPLATES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
          <option disabled>──────────────</option>
          <option value="__new_template__">+ 新建模板...</option>
        </select>
        {formData.template_id && CUSTOM_TEMPLATES.some((t) => t.value === formData.template_id) && (
          <p className="mt-1 text-xs text-amber-400/80">
            ⚠ 自定义模板功能开发中，当前使用模拟配置
          </p>
        )}
      </div>

      {/* 目标时间 */}
      <div>
        <label htmlFor="target-weeks" className="block text-sm font-medium text-slate-200 mb-1">
          目标时间（周） <span className="text-red-500">*</span>
        </label>
        <input
          id="target-weeks"
          type="number"
          min={1}
          max={52}
          value={formData.target_weeks ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            updateField('target_weeks', val);
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-deep-surface focus:outline-none focus:ring-1 ${
            errors.target_weeks
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-deep-border focus:border-neon-blue focus:ring-neon-blue'
          } ${errors.target_weeks ? 'text-red-300' : 'text-slate-200'}`}
        />
        {errors.target_weeks && <p className="mt-1 text-xs text-red-400">{errors.target_weeks}</p>}
      </div>

      {/* 团队规模 */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-200 mb-1">
          团队规模 <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-4">
          {TEAM_SIZE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                formData.team_size === opt.value
                  ? 'border-neon-blue bg-neon-blue/10 text-neon-blue'
                  : 'border-deep-border bg-deep-surface text-slate-400 hover:border-neon-blue/50'
              }`}
            >
              <input
                type="radio"
                name="team_size"
                value={opt.value}
                checked={formData.team_size === opt.value}
                onChange={() => updateField('team_size', opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.team_size && <p className="mt-1 text-xs text-red-400">{errors.team_size}</p>}
      </fieldset>

      {/* 预算上限 */}
      <div>
        <label htmlFor="budget-limit" className="block text-sm font-medium text-slate-200 mb-1">
          预算上限（美元） <span className="text-red-500">*</span>
        </label>
        <input
          id="budget-limit"
          type="number"
          min={0}
          step={1000}
          value={formData.budget_limit ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Number(e.target.value);
            updateField('budget_limit', val);
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 bg-deep-surface ${
            errors.budget_limit
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500 text-red-300'
              : 'border-deep-border focus:border-neon-blue focus:ring-neon-blue text-slate-200'
          }`}
        />
        {errors.budget_limit && <p className="mt-1 text-xs text-red-400">{errors.budget_limit}</p>}
      </div>

      {/* 行业选择 */}
      <IndustrySelector
        value={formData.industry ?? '消费电子'}
        onChange={(val) => updateField('industry', val)}
      />

      {/* 项目描述 */}
      <div>
        <label htmlFor="project-description" className="block text-sm font-medium text-slate-200 mb-1">
          项目描述 <span className="text-slate-400">（可选）</span>
        </label>
        <textarea
          id="project-description"
          value={formData.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="简要描述项目目标和范围..."
          rows={3}
          className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-200 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
        />
      </div>

      {/* 复杂度预览 */}
      <ComplexityPreview preview={complexityPreview} />

      {/* 提交错误 */}
      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{submitError}</p>
        </div>
      )}

      {/* 创建按钮 */}
      <button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="w-full rounded-lg neon-btn-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-deep-base disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? '创建中...' : '创建项目'}
      </button>
    </form>
  );
}