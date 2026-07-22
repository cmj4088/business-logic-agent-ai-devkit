/** M14a/M14b 项目详情页入口
 *
 * 三栏布局：左侧时间线 + 中间主内容区 + 右侧面板
 * 路由：/projects/:id
 * M14b 集成：AgentChat 流式输出、活动交互、阶段推进/回退、门禁投票、异常恢复、首次引导
 */

import { useParams } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import type { IPDStage } from '@/shared/types';
import { useProjectDetail } from './hooks/useProjectDetail';
import { useProjectWS } from './hooks/useProjectWS';
import { useStageControl } from './hooks/useStageControl';
import ProjectHeader from './components/ProjectHeader';
import StageTimeline from './components/StageTimeline';
import ActivityList from './components/ActivityList';
import AgentChat from './components/AgentChat';
import GateStatus from './components/GateStatus';
import GateVotingPanel from './components/GateVotingPanel';
import SidebarPanel from './components/SidebarPanel';
import StageAdvanceModal from './components/StageAdvanceModal';
import StageRollbackModal from './components/StageRollbackModal';
import RecoveryPanel from './components/RecoveryPanel';
import OnboardingGuide from './components/OnboardingGuide';
import { STAGE_LABELS } from './types';
import type { RecoveryAction, GateVoteResult } from './types';
import { fetchRecoveryStatus, executeRecoveryAction, submitGateVote, fetchOnboardingState, completeOnboardingStep } from './api';

/** IPD 阶段顺序 */
const STAGE_ORDER: IPDStage[] = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? '';

  const {
    project,
    stageData,
    activities,
    gateStatuses,
    isLoading,
    isNotFound,
    error,
    refresh,
  } = useProjectDetail(projectId);

  const {
    isOperating,
    error: stageError,
    advance,
    rollback,
    clearError: clearStageError,
  } = useStageControl(projectId);

  // 弹窗状态
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [targetStage, setTargetStage] = useState<IPDStage>('concept');

  // 门禁投票状态
  const [gateResults, setGateResults] = useState<Record<string, GateVoteResult>>({});
  const [isVoting, setIsVoting] = useState(false);

  // 恢复状态
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [isRecoveryExecuting, setIsRecoveryExecuting] = useState(false);

  // 引导状态
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  /** 加载恢复状态 */
  const loadRecoveryStatus = useCallback(async () => {
    try {
      const status = await fetchRecoveryStatus(projectId);
      if (status.hasActiveActions) {
        setRecoveryActions(status.activeActions);
      }
    } catch {
      // 静默处理
    }
  }, [projectId]);

  /** 加载引导状态 */
  const loadOnboardingState = useCallback(async () => {
    try {
      const state = await fetchOnboardingState();
      if (state.isFirstVisit) {
        setShowOnboarding(true);
      }
      setCompletedSteps(state.completedSteps);
    } catch {
      // 首次访问默认显示引导
      setShowOnboarding(true);
    }
  }, []);

  // 初始加载恢复状态和引导状态
  useEffect(() => {
    if (projectId) {
      loadRecoveryStatus();
      loadOnboardingState();
    }
  }, [projectId, loadRecoveryStatus, loadOnboardingState]);

  /** WebSocket 实时更新 */
  const handleWSMessage = useCallback(
    (data: unknown) => {
      const msg = data as { type?: string };
      if (msg.type === 'stage_changed' || msg.type === 'activity_changed' || msg.type === 'project_updated') {
        refresh();
      }
      if (msg.type === 'recovery_action') {
        // 收到新的恢复动作，刷新恢复状态
        loadRecoveryStatus();
      }
    },
    [refresh, loadRecoveryStatus],
  );

  useProjectWS(projectId, handleWSMessage);

  /** 阶段推进 */
  const handleAdvanceClick = useCallback(() => {
    if (!project) return;
    const currentIdx = STAGE_ORDER.indexOf(project.currentStage);
    if (currentIdx < STAGE_ORDER.length - 1) {
      setTargetStage(STAGE_ORDER[currentIdx + 1]);
      setShowAdvanceModal(true);
    }
  }, [project]);

  const handleAdvanceConfirm = useCallback(async () => {
    const result = await advance(targetStage);
    if (result) {
      setShowAdvanceModal(false);
      refresh();
    }
  }, [advance, targetStage, refresh]);

  /** 阶段回退 */
  const handleRollbackClick = useCallback(() => {
    if (!project) return;
    const currentIdx = STAGE_ORDER.indexOf(project.currentStage);
    if (currentIdx > 0) {
      setTargetStage(STAGE_ORDER[currentIdx - 1]);
      setShowRollbackModal(true);
    }
  }, [project]);

  const handleRollbackConfirm = useCallback(async (reason: string) => {
    const result = await rollback(targetStage, reason);
    if (result) {
      setShowRollbackModal(false);
      refresh();
    }
  }, [rollback, targetStage, refresh]);

  /** 门禁投票 */
  const handleGateVote = useCallback(async (gateId: string, vote: 'approve' | 'reject' | 'abstain', comment?: string) => {
    setIsVoting(true);
    try {
      const result = await submitGateVote(projectId, { gateId, vote, comment });
      setGateResults((prev) => ({ ...prev, [gateId]: result }));
      refresh();
    } catch {
      // 错误由 useStageControl 处理
    } finally {
      setIsVoting(false);
    }
  }, [projectId, refresh]);

  /** 恢复动作执行 */
  const handleRecoveryExecute = useCallback(async (actionId: string, resolution: string) => {
    setIsRecoveryExecuting(true);
    try {
      await executeRecoveryAction(projectId, actionId, resolution);
      setRecoveryActions((prev) => prev.filter((a) => a.id !== actionId));
      refresh();
    } catch {
      // 保持面板显示
    } finally {
      setIsRecoveryExecuting(false);
    }
  }, [projectId, refresh]);

  /** 引导步骤完成 */
  const handleOnboardingComplete = useCallback(async (stepId: string) => {
    setCompletedSteps((prev) => [...prev, stepId]);
    try {
      await completeOnboardingStep(stepId);
    } catch {
      // 本地状态已更新即可
    }
  }, []);

  const handleOnboardingFinish = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // ===== 加载/错误状态 =====

  if (isLoading) {
    return (
      <AnimatedPageWrapper className="bg-deep-base">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">正在加载项目详情...</p>
          </div>
        </div>
      </AnimatedPageWrapper>
    );
  }

  if (isNotFound || (!project && !isLoading)) {
    return (
      <AnimatedPageWrapper className="bg-deep-base">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl text-slate-600 mb-4">404</div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">项目不存在</h2>
            <p className="text-slate-500 text-sm mb-6">未找到 ID 为 {projectId} 的项目</p>
            <a href="/dashboard" className="inline-block px-4 py-2 text-sm rounded-md neon-btn-blue text-white transition-colors">
              返回首页
            </a>
          </div>
        </div>
      </AnimatedPageWrapper>
    );
  }

  if (error && !project) {
    return (
      <AnimatedPageWrapper className="bg-deep-base">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl text-slate-600 mb-4">!</div>
            <h2 className="text-xl font-bold text-slate-200 mb-2">加载失败</h2>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button type="button" onClick={refresh} className="inline-block px-4 py-2 text-sm rounded-md neon-btn-blue text-white transition-colors">
              重试
            </button>
          </div>
        </div>
      </AnimatedPageWrapper>
    );
  }

  if (!project) return null;

  const currentStageLabel = STAGE_LABELS[project.currentStage] ?? project.currentStage;
  const currentStageIdx = STAGE_ORDER.indexOf(project.currentStage);
  const canAdvance = currentStageIdx < STAGE_ORDER.length - 1;
  const canRollback = currentStageIdx > 0;

  return (
    <AnimatedPageWrapper className="bg-deep-base flex flex-col">
      {/* 项目头部 */}
      <ProjectHeader project={project} />

      {/* 三栏主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：时间线 */}
        <motion.aside variants={itemVariants} className="w-56 shrink-0 border-r border-deep-border bg-deep-surface/80 overflow-y-auto">
          <div className="px-4 py-3 border-b border-deep-border">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">阶段时间线</h2>
          </div>
          <StageTimeline
            stages={stageData?.allStages ?? []}
            currentStage={project.currentStage}
            onStageClick={(_stage) => {
              // 点击已完成阶段查看历史
            }}
          />
        </motion.aside>

        {/* 中间：主内容区 */}
        <motion.main variants={itemVariants} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl space-y-6">
            {/* 当前阶段标题 + 操作 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  当前阶段：{currentStageLabel}阶段
                </h2>
                {stageData?.currentStage?.description && (
                  <p className="text-sm text-slate-400 mt-1">{stageData.currentStage.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canRollback && (
                  <button
                    type="button"
                    onClick={handleRollbackClick}
                    disabled={isOperating}
                    className="rounded-lg border border-deep-border bg-deep-surface px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-deep-card focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    回退
                  </button>
                )}
                {canAdvance && (
                  <button
                    type="button"
                    onClick={handleAdvanceClick}
                    disabled={isOperating}
                    className="rounded-lg neon-btn-blue px-3 py-1.5 text-xs font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-deep-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    推进阶段
                  </button>
                )}
              </div>
            </div>

            {/* 阶段控制错误 */}
            {stageError && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-400">{stageError}</p>
                  <button type="button" onClick={clearStageError} className="text-xs text-red-400 hover:text-red-300">
                    忽略
                  </button>
                </div>
              </div>
            )}

            {/* 恢复面板 */}
            {recoveryActions.map((action) => (
              <RecoveryPanel
                key={action.id}
                action={action}
                isExecuting={isRecoveryExecuting}
                onExecute={handleRecoveryExecute}
                onClose={() => setRecoveryActions((prev) => prev.filter((a) => a.id !== action.id))}
              />
            ))}

            {/* 活动列表 */}
            <div className="border border-deep-border rounded-lg bg-deep-card overflow-hidden">
              <div className="px-4 py-3 border-b border-deep-border">
                <h3 className="text-sm font-medium text-slate-200">活动列表</h3>
              </div>
              <div className="p-4">
                <ActivityList projectId={projectId} activities={activities} onActivityChange={refresh} />
              </div>
            </div>

            {/* Agent 对话区 */}
            <AgentChat projectId={projectId} stage={project.currentStage} />

            {/* 门禁状态 + 投票 */}
            <div className="space-y-3">
              <GateStatus gates={gateStatuses} />
              {gateStatuses.filter((g) => g.status === 'pending' || g.status === 'voting').map((g) => (
                <GateVotingPanel
                  key={g.name}
                  gate={g}
                  gateResult={gateResults[g.name] ?? null}
                  isVoting={isVoting}
                  onVote={handleGateVote}
                />
              ))}
            </div>
          </div>
        </motion.main>

        {/* 右侧：面板 */}
        <motion.aside variants={itemVariants} className="w-64 shrink-0 border-l border-deep-border bg-deep-surface/80 overflow-y-auto p-4">
          <SidebarPanel projectId={project.id} />
        </motion.aside>
      </div>

      {/* 阶段推进确认弹窗 */}
      <StageAdvanceModal
        isOpen={showAdvanceModal}
        currentStage={project.currentStage}
        targetStage={targetStage}
        isOperating={isOperating}
        onConfirm={handleAdvanceConfirm}
        onClose={() => setShowAdvanceModal(false)}
      />

      {/* 阶段回退确认弹窗 */}
      <StageRollbackModal
        isOpen={showRollbackModal}
        currentStage={project.currentStage}
        targetStage={targetStage}
        isOperating={isOperating}
        onConfirm={handleRollbackConfirm}
        onClose={() => setShowRollbackModal(false)}
      />

      {/* 首次使用引导 */}
      <OnboardingGuide
        isOpen={showOnboarding}
        completedSteps={completedSteps}
        onComplete={handleOnboardingComplete}
        onFinish={handleOnboardingFinish}
      />
    </AnimatedPageWrapper>
  );
}

export { useProjectDetail } from './hooks/useProjectDetail';
export { useProjectWS } from './hooks/useProjectWS';
export { useAgentChat } from './hooks/useAgentChat';
export { useActivityActions } from './hooks/useActivityActions';
export { useStageControl } from './hooks/useStageControl';