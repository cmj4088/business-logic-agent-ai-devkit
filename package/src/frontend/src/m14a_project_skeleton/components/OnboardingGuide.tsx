/** M14b OnboardingGuide — 首次使用引导
 *
 * 用户首次进入项目详情时触发，分 4 步引导了解关键功能区域。
 * 引导步骤：
 * 1. 项目时间线 — Agent 按阶段推进
 * 2. Agent 对话区 — 查看协作讨论
 * 3. 侧边栏 — 预算和供应链状态
 * 4. 设置入口 — 切换本地模型或云端 API
 */

import type { FC } from 'react';
import { useState, useCallback } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  position: 'top' | 'bottom';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'stage_timeline',
    title: '项目时间线',
    description: '这里展示 6 个 IPD 阶段，Agent 将按阶段推进项目。当前阶段高亮显示，点击可查看详情。',
    position: 'top',
  },
  {
    id: 'agent_chat',
    title: 'Agent 协作区',
    description: '在这里可以看到 6 个 Agent（产品经理、研发、测试、市场、制造、财务）的实时讨论和决策记录。',
    position: 'top',
  },
  {
    id: 'sidebar',
    title: '侧边栏面板',
    description: '侧边栏显示项目预算、供应链状态、竞品分析和认证信息。数据由 Agent 自动更新。',
    position: 'bottom',
  },
  {
    id: 'settings',
    title: '模型设置',
    description: '在设置页面可以切换本地 Ollama 模型或配置云端 API（Anthropic/OpenAI）。使用云端 API 需要数据出境告知。',
    position: 'bottom',
  },
];

interface OnboardingGuideProps {
  isOpen: boolean;
  completedSteps: string[];
  onComplete: (stepId: string) => void;
  onFinish: () => void;
}

const OnboardingGuide: FC<OnboardingGuideProps> = ({
  isOpen,
  onComplete,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    const step = ONBOARDING_STEPS[currentStep];
    onComplete(step.id);
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onFinish();
    }
  }, [currentStep, onComplete, onFinish]);

  const handleSkip = useCallback(() => {
    onFinish();
  }, [onFinish]);

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-deep-card shadow-2xl border border-deep-border">
        {/* 进度条 */}
        <div className="h-1 w-full rounded-t-2xl bg-deep-border">
          <div
            className="h-full rounded-t-2xl bg-neon-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-6 py-5">
          {/* 步骤计数 */}
          <p className="text-xs font-medium text-neon-blue mb-2">
            第 {currentStep + 1} 步 / 共 {ONBOARDING_STEPS.length} 步
          </p>

          {/* 标题 */}
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{step.title}</h3>

          {/* 描述 */}
          <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

          {/* 指示器 */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {ONBOARDING_STEPS.map((_, index) => (
              <span
                key={index}
                className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                  index === currentStep ? 'bg-neon-blue' : 'bg-deep-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between border-t border-deep-border px-6 py-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            跳过引导
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1"
          >
            {currentStep < ONBOARDING_STEPS.length - 1 ? '下一步' : '开始使用'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;