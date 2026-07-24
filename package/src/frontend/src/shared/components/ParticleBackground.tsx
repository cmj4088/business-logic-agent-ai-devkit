/** 共享粒子背景组件
 *
 * 科技深色风：霓虹蓝紫粒子 + 连线效果，营造科技氛围。
 * 使用 @tsparticles/react v4 API（ParticlesProvider + Particles）。
 */

import { useEffect, useMemo, useState } from 'react';
import Particles, { ParticlesProvider, useParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions, Engine } from '@tsparticles/engine';

/** 粒子引擎初始化函数 */
const initEngine = async (engine: Engine): Promise<void> => {
  await loadSlim(engine);
};

/** 内部粒子组件 — 等待 provider 初始化完成后渲染 */
function ParticlesContent({ options }: { options: ISourceOptions }) {
  const { loaded } = useParticlesProvider();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (loaded) {
      setMounted(true);
    }
  }, [loaded]);

  if (!mounted) return null;

  return (
    <Particles
      id="ipd-particles"
      options={options}
      className="absolute inset-0 h-full w-full"
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}

export function ParticleBackground() {
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: {
        color: { value: 'transparent' },
      },
      particles: {
        color: { value: ['#00d4ff', '#a855f7'] },
        links: {
          color: '#00d4ff',
          distance: 150,
          enable: true,
          opacity: 0.15,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: 'none',
          outModes: { default: 'out' },
        },
        number: {
          density: { enable: true, width: 1200, height: 800 },
          value: 50,
        },
        opacity: {
          value: { min: 0.1, max: 0.4 },
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  return (
    <div className="particles-container fixed inset-0 z-0 pointer-events-none">
      <ParticlesProvider init={initEngine}>
        <ParticlesContent options={options} />
      </ParticlesProvider>
    </div>
  );
}
