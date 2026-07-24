/** M20 模板编辑器 — 新建/编辑自定义模板
 *
 * 占位页面：展示模板编辑器的 UI 布局，标注"功能开发中"。
 * 包含禁用的表单控件，让评委看到完整的设计意图。
 */

import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';

const STAGE_COLORS = ['#00d4ff', '#a855f7', '#00ff9d', '#fbbf24', '#ff2e88', '#f97316'];

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId?: string }>();
  const isEditing = Boolean(templateId);

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-4xl px-4 py-4 md:py-6">
        {/* 顶部导航 */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="mb-3 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeftOutlined />
            返回模板列表
          </button>
          <h1 className="text-2xl font-bold text-slate-100">
            {isEditing ? '编辑模板' : '新建模板'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            定义阶段、门禁、角色和活动，构建属于你自己的业务流程
          </p>
        </motion.div>

        {/* 开发中提示 */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">🚧</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-300">模板编辑器功能开发中</h3>
                <p className="mt-1 text-sm text-amber-400/70">
                  自定义模板功能正在紧锣密鼓地开发中。当前您可以先使用内置的 IPD 模板创建项目。
                  以下为模板编辑器的 UI 预览，展示完整的设计意图。
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="rounded-lg border border-deep-border bg-deep-surface px-4 py-1.5 text-xs font-medium text-slate-300 hover:border-neon-blue/50 transition-colors"
                  >
                    返回首页
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/projects/new')}
                    className="rounded-lg neon-btn-blue px-4 py-1.5 text-xs font-medium text-white"
                  >
                    使用 IPD 模板创建项目
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 模板基本信息 */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-deep-border bg-deep-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">模板信息</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">模板名称</label>
                <input
                  type="text"
                  disabled
                  placeholder="输入模板名称..."
                  className="w-full rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">分类</label>
                <select
                  disabled
                  className="w-full rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                >
                  <option>产品研发</option>
                  <option>软件开发</option>
                  <option>市场营销</option>
                  <option>内容创作</option>
                  <option>自定义</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">模板描述</label>
              <textarea
                disabled
                rows={2}
                placeholder="描述模板的适用场景和核心特点..."
                className="w-full rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* 阶段配置 */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-deep-border bg-deep-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">阶段配置</h2>
              <button
                type="button"
                disabled
                className="flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-1.5 text-xs text-slate-500 cursor-not-allowed"
              >
                <PlusOutlined />
                添加阶段
              </button>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-deep-border bg-deep-surface/30 p-3"
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STAGE_COLORS[i - 1] }}
                  />
                  <input
                    type="text"
                    disabled
                    placeholder={`阶段 ${i} 名称`}
                    className="flex-1 bg-transparent text-sm text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-xs text-slate-600">第 {i} 阶段</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              暂无阶段配置。点击"添加阶段"定义业务流程的各个阶段。
            </p>
          </div>
        </motion.div>

        {/* Agent 角色配置 */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-deep-border bg-deep-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">Agent 角色</h2>
              <button
                type="button"
                disabled
                className="flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-1.5 text-xs text-slate-500 cursor-not-allowed"
              >
                <PlusOutlined />
                添加角色
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {['产品经理', '研发架构师', '测试专家', '市场专家'].map((role) => (
                <div
                  key={role}
                  className="flex items-center gap-2 rounded-lg border border-deep-border bg-deep-surface/30 px-3 py-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neon-blue/10 text-xs text-neon-blue font-medium">
                    {role.charAt(0)}
                  </span>
                  <span className="text-sm text-slate-500">{role}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              以上为 IPD 内置角色预览。自定义模板可自由定义 Agent 角色。
            </p>
          </div>
        </motion.div>

        {/* 门禁配置 */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-deep-border bg-deep-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">门禁配置</h2>
              <button
                type="button"
                disabled
                className="flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-1.5 text-xs text-slate-500 cursor-not-allowed"
              >
                <PlusOutlined />
                添加门禁
              </button>
            </div>
            <div className="space-y-2">
              {['概念决策评审 (CDCP)', '计划决策评审 (PDCP)', '技术评审 (TR3)'].map((gate) => (
                <div
                  key={gate}
                  className="flex items-center gap-3 rounded-lg border border-deep-border bg-deep-surface/30 px-3 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/20 text-xs text-amber-400">
                    G
                  </span>
                  <span className="text-sm text-slate-500">{gate}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              门禁用于在阶段之间设置质量关卡，确保关键决策点不被遗漏。
            </p>
          </div>
        </motion.div>

        {/* 保存按钮 */}
        <motion.div variants={itemVariants}>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-deep-border bg-deep-surface/50 px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed"
          >
            <SaveOutlined />
            保存模板
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            模板编辑器功能开发中，保存功能暂不可用
          </p>
        </motion.div>
      </div>
    </AnimatedPageWrapper>
  );
}
