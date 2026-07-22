/** M20 模板列表 — 我的模板
 *
 * 展示用户自定义模板列表（模拟数据），标注"功能开发中"。
 * 支持查看模板卡片、跳转编辑器和新建模板入口。
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import type { TemplateSummary } from '@/shared/types';

const MOCK_TEMPLATES: TemplateSummary[] = [
  {
    id: 'tpl_agile_v1',
    name: '敏捷开发流程',
    description: '适用于互联网产品快速迭代，双周 Sprint 节奏，持续交付',
    category: 'software',
    source: 'custom',
    stageCount: 5,
    activityCount: 18,
    roleCount: 4,
    icon: '📋',
    createdAt: '2026-07-15',
    isBuiltin: false,
  },
  {
    id: 'tpl_content_v1',
    name: '内容创作 SOP',
    description: '适用于自媒体内容团队，从选题策划到发布复盘全流程',
    category: 'content',
    source: 'custom',
    stageCount: 4,
    activityCount: 12,
    roleCount: 3,
    icon: '📝',
    createdAt: '2026-07-10',
    isBuiltin: false,
  },
  {
    id: 'tpl_delivery_v1',
    name: '客户交付流程',
    description: '适用于 B2B 项目交付，需求确认到验收上线标准化管理',
    category: 'custom',
    source: 'custom',
    stageCount: 6,
    activityCount: 22,
    roleCount: 5,
    icon: '🚀',
    createdAt: '2026-06-28',
    isBuiltin: false,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  software: '软件开发',
  content: '内容创作',
  custom: '自定义',
  product_rd: '产品研发',
  medical: '医疗器械',
  marketing: '市场营销',
};

export default function TemplateListPage() {
  const navigate = useNavigate();

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-4xl px-4 py-4 md:py-6">
        {/* 顶部 */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-3 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeftOutlined />
            返回首页
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">我的模板</h1>
              <p className="mt-1 text-sm text-slate-400">
                管理和创建自定义业务流程模板
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/templates/new')}
              className="flex items-center gap-1.5 rounded-lg neon-btn-green px-4 py-2 text-sm font-medium text-white"
            >
              <PlusOutlined />
              新建模板
            </button>
          </div>
        </motion.div>

        {/* 开发中提示 */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">💡</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-300">模板功能开发中</h3>
                <p className="mt-1 text-sm text-amber-400/70">
                  以下为模板列表的效果预览。当前请使用内置 IPD 模板创建项目。
                  自定义模板的创建、编辑和删除功能将在后续版本中开放。
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 模板卡片列表 */}
        <div className="space-y-3">
          {MOCK_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              variants={itemVariants}
              custom={index}
              className="rounded-xl border border-deep-border bg-deep-card p-5 transition-colors hover:border-neon-blue/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-deep-surface text-2xl">
                    {template.icon}
                  </span>
                  {/* 信息 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-100">{template.name}</h3>
                      <span className="rounded-full bg-neon-blue/10 px-2 py-0.5 text-[10px] font-medium text-neon-blue">
                        {CATEGORY_LABELS[template.category] || template.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{template.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span>{template.stageCount} 阶段</span>
                      <span className="text-slate-600">·</span>
                      <span>{template.activityCount} 活动</span>
                      <span className="text-slate-600">·</span>
                      <span>{template.roleCount} 角色</span>
                      <span className="text-slate-600">·</span>
                      <span>创建于 {template.createdAt}</span>
                    </div>
                  </div>
                </div>
                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/templates/${template.id}/edit`)}
                    className="flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface px-3 py-1.5 text-xs text-slate-400 hover:border-neon-blue/50 hover:text-slate-200 transition-colors"
                  >
                    <EditOutlined />
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-1.5 text-xs text-slate-600 cursor-not-allowed"
                  >
                    <DeleteOutlined />
                    删除
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 空状态提示 */}
        {MOCK_TEMPLATES.length === 0 && (
          <motion.div variants={itemVariants} className="rounded-xl border border-dashed border-deep-border p-12 text-center">
            <span className="text-4xl">📂</span>
            <h3 className="mt-3 text-sm font-medium text-slate-400">暂无自定义模板</h3>
            <p className="mt-1 text-xs text-slate-500">创建你的第一个业务流程模板</p>
            <button
              type="button"
              onClick={() => navigate('/templates/new')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg neon-btn-green px-4 py-2 text-sm font-medium text-white"
            >
              <PlusOutlined />
              新建模板
            </button>
          </motion.div>
        )}
      </div>
    </AnimatedPageWrapper>
  );
}
