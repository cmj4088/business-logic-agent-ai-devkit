/** M18 用量与设置模块 — 关于页面 */

import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '@/shared/components/AnimatedPageWrapper';

/** 第三方依赖信息 */
interface Dependency {
  name: string;
  version: string;
  license: string;
}

const DEPENDENCIES: Dependency[] = [
  { name: 'React', version: '18.3', license: 'MIT' },
  { name: 'React Router', version: '6.26', license: 'MIT' },
  { name: 'Axios', version: '1.7', license: 'MIT' },
  { name: 'Tailwind CSS', version: '3.4', license: 'MIT' },
  { name: 'FastAPI', version: '0.115', license: 'MIT' },
  { name: 'SQLAlchemy', version: '2.0', license: 'MIT' },
  { name: 'SQLite', version: '3.x', license: 'Public Domain' },
  { name: 'Electron', version: '33', license: 'MIT' },
  { name: 'Vite', version: '5.4', license: 'MIT' },
  { name: 'TypeScript', version: '5.5', license: 'Apache-2.0' },
];

const AboutPage: React.FC = () => {
  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <h2 className="text-xl font-bold text-slate-100">关于</h2>

      {/* 版本信息 */}
      <motion.div variants={itemVariants} className="rounded-xl border border-deep-border bg-deep-card p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Business Logic Agent</h1>
        <p className="text-sm text-slate-500 mb-2">v0.1.0 (MVP)</p>
        <p className="text-xs text-slate-500">2026 Business Logic Agent Team</p>
      </motion.div>

      {/* 技术栈 */}
      <motion.div variants={itemVariants} className="rounded-xl border border-deep-border bg-deep-card p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">技术栈</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-deep-surface text-slate-400 text-xs rounded-full border border-deep-border">Electron</span>
          <span className="px-3 py-1 bg-deep-surface text-slate-400 text-xs rounded-full border border-deep-border">React</span>
          <span className="px-3 py-1 bg-deep-surface text-slate-400 text-xs rounded-full border border-deep-border">FastAPI</span>
          <span className="px-3 py-1 bg-deep-surface text-slate-400 text-xs rounded-full border border-deep-border">SQLite</span>
        </div>
      </motion.div>

      {/* 第三方依赖 */}
      <motion.div variants={itemVariants} className="rounded-xl border border-deep-border bg-deep-card p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">开源依赖</h3>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-deep-border">
                <th className="text-left py-2 text-xs font-medium text-slate-500">名称</th>
                <th className="text-left py-2 text-xs font-medium text-slate-500">版本</th>
                <th className="text-left py-2 text-xs font-medium text-slate-500">许可</th>
              </tr>
            </thead>
            <tbody>
              {DEPENDENCIES.map((dep) => (
                <tr key={dep.name} className="border-b border-deep-border/50">
                  <td className="py-2 text-sm text-slate-300">{dep.name}</td>
                  <td className="py-2 text-sm text-slate-500">{dep.version}</td>
                  <td className="py-2 text-sm text-slate-500">{dep.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutPage;