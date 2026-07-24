/** DisclaimerBanner — 免责声明横幅
 *
 * 在应用底部或侧边栏显示 AI 生成内容的免责声明。
 * 符合法律合规要求：AI 内容标识 + 免责声明。
 */

import { useState } from 'react';

interface DisclaimerBannerProps {
  /** 显示位置 */
  position?: 'bottom' | 'inline';
  /** 是否可关闭 */
  dismissible?: boolean;
}

export function DisclaimerBanner({ position = 'bottom', dismissible = true }: DisclaimerBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed && dismissible) return null;

  const positionClasses = position === 'bottom'
    ? 'fixed bottom-0 left-0 right-0 z-50'
    : '';

  return (
    <div className={`${positionClasses} border-t border-amber-200 bg-amber-50 px-4 py-2`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-amber-800">
          <span className="flex-shrink-0">⚠️</span>
          <span>
            <strong>AI 生成内容声明：</strong>
            本应用中的产出物由 AI 自动生成，仅供参考，不构成专业建议。AI 生成内容可能存在错误，请在使用前进行独立审查。
            {dismissible && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="ml-1 font-medium text-amber-900 underline hover:text-amber-700"
                >
                  知道了
                </button>
              </>
            )}
          </span>
        </div>
        {!dismissible && (
          <span className="flex-shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
            AI 生成
          </span>
        )}
      </div>
    </div>
  );
}