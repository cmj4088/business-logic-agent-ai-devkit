/** M14a 侧边栏面板容器 */

import type { FC } from 'react';
import BudgetWidget from './SidebarPanel/BudgetWidget';
import SupplyChainWidget from './SidebarPanel/SupplyChainWidget';
import CertificationWidget from './SidebarPanel/CertificationWidget';
import CompetitorWidget from './SidebarPanel/CompetitorWidget';

interface SidebarPanelProps {
  projectId: string;
}

const SidebarPanel: FC<SidebarPanelProps> = ({ projectId }) => {
  return (
    <div className="flex flex-col gap-4">
      <BudgetWidget projectId={projectId} />
      <SupplyChainWidget projectId={projectId} />
      <CertificationWidget projectId={projectId} />
      <CompetitorWidget projectId={projectId} />
    </div>
  );
};

export default SidebarPanel;