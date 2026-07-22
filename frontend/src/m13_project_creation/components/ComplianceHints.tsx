interface ComplianceHintsProps {
  industry: string;
}

const COMPLIANCE_HINTS: Record<string, string> = {
  '医疗器械': '需要 NMPA/FDA 认证，预计 6-18 个月，建议完整模式',
  '汽车电子': '需要 IATF 16949 认证',
  '航空': '需要 DO-178C/DO-254 认证',
};

export function ComplianceHints({ industry }: ComplianceHintsProps) {
  const hint = COMPLIANCE_HINTS[industry];

  if (!hint) {
    return (
      <p className="text-sm text-slate-500 mt-1">当前行业无特殊合规要求</p>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
      <p className="text-sm font-medium text-amber-300">合规提醒</p>
      <p className="text-sm text-amber-400 mt-1">{hint}</p>
    </div>
  );
}