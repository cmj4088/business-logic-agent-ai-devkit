/** M12 Dashboard — 快速入口组件
 *
 * 科技深色风：3D 透视悬停 + 霓虹图标卡片 + framer-motion 弹性动画。
 * 垂直列表布局，方便后续扩展更多快速入口。
 * "创建新项目"点击后弹出模板选择弹窗。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusOutlined, AuditOutlined, AppstoreAddOutlined, CloseOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface QuickAction {
  label: string;
  description: string;
  path: string;
  icon: ReactNode;
  gradient: string;
  glow: string;
  badge?: string;
  hasModal?: boolean;
}

interface TemplateOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  group: string;
  isBuiltin: boolean;
}

const BUILTIN_TEMPLATES: TemplateOption[] = [
  { value: 'standard_ipd_v3', label: '硬件 IPD', description: '标准硬件产品开发流程，6 阶段 8 门禁', icon: '🔧', group: '内置模板', isBuiltin: true },
  { value: 'software_ipd', label: '软件 IPD', description: '软件产品迭代流程，敏捷 + 门禁混合', icon: '💻', group: '内置模板', isBuiltin: true },
  { value: 'medical_ipd', label: '医疗器械 IPD', description: '合规医疗器械开发，含 FDA/CE 认证节点', icon: '🏥', group: '内置模板', isBuiltin: true },
];

const CUSTOM_TEMPLATES: TemplateOption[] = [
  { value: 'tpl_agile_v1', label: '敏捷开发流程', description: '双周 Sprint 节奏，持续交付', icon: '📋', group: '我的模板', isBuiltin: false },
  { value: 'tpl_content_v1', label: '内容创作 SOP', description: '选题策划到发布复盘全流程', icon: '📝', group: '我的模板', isBuiltin: false },
  { value: 'tpl_delivery_v1', label: '客户交付流程', description: 'B2B 项目交付标准化管理', icon: '🚀', group: '我的模板', isBuiltin: false },
];

const ACTIONS: QuickAction[] = [
  {
    label: '创建新项目',
    description: '快速启动业务流程',
    path: '/projects/new',
    icon: <PlusOutlined />,
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%)',
    glow: 'rgba(0, 212, 255, 0.4)',
    hasModal: true,
  },
  {
    label: '新建模板',
    description: '创建自定义业务流程模板',
    path: '/templates/new',
    icon: <AppstoreAddOutlined />,
    gradient: 'linear-gradient(135deg, #00ff9d 0%, #10b981 100%)',
    glow: 'rgba(0, 255, 157, 0.4)',
    badge: 'NEW',
  },
  {
    label: '审核仪表盘',
    description: '查看所有待审核事项',
    path: '/reviews',
    icon: <AuditOutlined />,
    gradient: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const handleActionClick = (action: QuickAction) => {
    if (action.hasModal) {
      setShowTemplateModal(true);
    } else {
      navigate(action.path);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setShowTemplateModal(false);
    navigate(`/projects/new?template=${templateId}`);
  };

  return (
    <>
      <div className="glass-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">快速入口</h2>
        <div className="flex flex-col gap-2">
          {ACTIONS.map((action, index) => (
            <motion.button
              key={action.path}
              type="button"
              onClick={() => handleActionClick(action)}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="card-3d flex cursor-pointer items-center gap-3 rounded-lg border border-deep-border bg-deep-surface/50 p-3 text-left transition-colors hover:border-neon-blue/30"
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
                style={{
                  background: action.gradient,
                  boxShadow: `0 0 12px ${action.glow}`,
                }}
              >
                {action.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-100">{action.label}</p>
                  {action.badge && (
                    <span className="rounded-full bg-neon-green/20 px-1.5 py-0.5 text-[10px] font-semibold text-neon-green">
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{action.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 模板选择弹窗 */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-deep-border bg-deep-card shadow-2xl"
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">选择模板</h3>
                  <p className="mt-0.5 text-xs text-slate-400">选择业务流程模板开始创建项目</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-deep-surface hover:text-slate-300 transition-colors"
                >
                  <CloseOutlined />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
                {/* 内置模板 */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    内置模板
                  </h4>
                  <div className="space-y-2">
                    {BUILTIN_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.value}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.value)}
                        className="flex w-full items-center gap-3 rounded-lg border border-deep-border bg-deep-surface/50 p-3 text-left transition-all hover:border-neon-blue/40 hover:bg-deep-surface"
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-deep-card text-xl">
                          {tpl.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-100">{tpl.label}</p>
                          <p className="text-xs text-slate-500">{tpl.description}</p>
                        </div>
                        <span className="text-xs text-slate-600">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 我的模板 */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    我的模板
                  </h4>
                  <div className="space-y-2">
                    {CUSTOM_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.value}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.value)}
                        className="flex w-full items-center gap-3 rounded-lg border border-deep-border bg-deep-surface/50 p-3 text-left transition-all hover:border-neon-green/40 hover:bg-deep-surface"
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-deep-card text-xl">
                          {tpl.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-100">{tpl.label}</p>
                          <p className="text-xs text-slate-500">{tpl.description}</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          开发中
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 弹窗底部 */}
              <div className="border-t border-deep-border px-6 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    navigate('/templates/new');
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-deep-border py-2 text-xs text-slate-500 hover:border-neon-green/50 hover:text-neon-green transition-colors"
                >
                  <AppstoreAddOutlined />
                  新建自定义模板
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}