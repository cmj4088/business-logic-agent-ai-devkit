import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import { QuickStartForm } from './components/QuickStartForm';

export default function ProjectCreationPage() {
  const [searchParams] = useSearchParams();
  const preselectedTemplate = searchParams.get('template') ?? undefined;

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-2xl px-4 py-4 md:py-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">创建新项目</h1>
          <p className="text-slate-400 mb-6">填写以下信息，快速启动业务流程（内置 IPD 模板）</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <QuickStartForm preselectedTemplate={preselectedTemplate} />
        </motion.div>
      </div>
    </AnimatedPageWrapper>
  );
}

export { useProjectCreation } from './hooks/useProjectCreation';