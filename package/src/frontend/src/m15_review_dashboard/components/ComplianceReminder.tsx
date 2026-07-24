/** 行业合规提醒组件 */

import type { ComplianceRule } from '../types';

/** 行业合规规则映射 */
const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    industry: '医疗器械',
    rules: [
      '需符合 NMPA 医疗器械注册管理办法',
      'ISO 13485 质量管理体系要求',
      '设计变更需进行风险再评估',
      '产品标签需包含注册证编号',
    ],
  },
  {
    industry: '汽车电子',
    rules: [
      '需符合 IATF 16949 质量管理体系',
      '功能安全需满足 ISO 26262 标准',
      '关键元器件变更需走 PPAP 流程',
      '电磁兼容性需满足 CISPR 25 要求',
    ],
  },
  {
    industry: '航空',
    rules: [
      '需符合 DO-178C 软件审定标准',
      'DO-254 硬件设计保证要求',
      'ARP4754A 系统开发过程',
      '所有变更需通过适航审定',
    ],
  },
  {
    industry: '消费电子',
    rules: [
      '需符合强制性产品认证（CCC）要求',
      '能效标识需符合 GB 标准',
      'RoHS 有害物质限制要求',
      '产品说明书需包含安全警告',
    ],
  },
  {
    industry: '软件',
    rules: [
      '需符合网络安全等级保护要求',
      '个人信息保护法合规检查',
      '数据安全法相关要求',
      '开源许可证合规审查',
    ],
  },
];

interface ComplianceReminderProps {
  industry: string;
}

export function ComplianceReminder({ industry }: ComplianceReminderProps) {
  const rule = COMPLIANCE_RULES.find((r) => r.industry === industry);

  if (!rule) {
    return (
      <div className="rounded-lg border border-deep-border bg-deep-surface p-4">
        <p className="text-sm text-slate-500">暂无特定行业合规提示</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-sm font-semibold text-blue-400">
          {industry} 行业合规提醒
        </h4>
      </div>
      <ul className="space-y-1.5">
        {rule.rules.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-blue-300">
            <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}