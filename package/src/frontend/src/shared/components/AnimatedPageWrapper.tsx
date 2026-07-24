/** 共享动画页面包装器
 *
 * 统一提供粒子背景 + 网格纹理 + 渐变色背景 + framer-motion 交错动画。
 * 所有页面共用相同的科技深色风动效，避免重复代码。
 */

import { motion } from 'framer-motion';
import { ParticleBackground } from './ParticleBackground';

interface AnimatedPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/** 内容区块交错动画 — 延迟递增 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export function AnimatedPageWrapper({ children, className = '' }: AnimatedPageWrapperProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* 粒子背景 */}
      <ParticleBackground />

      {/* 网格纹理叠加 */}
      <div className="grid-bg fixed inset-0 z-0 pointer-events-none" />

      {/* 内容 — 在粒子之上 */}
      <div className="relative z-10 gradient-mesh">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}