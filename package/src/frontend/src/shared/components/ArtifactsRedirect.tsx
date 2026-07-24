/** 产出物重定向 — 自动跳转到第一个项目的产出物页面 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '@/shared/api-client';

interface ProjectItem {
  id: string;
  name: string;
}

export function ArtifactsRedirect() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      try {
        const data = await get<{ items: ProjectItem[] }>('/api/projects');
        if (cancelled) return;

        if (data.items && data.items.length > 0) {
          navigate(`/projects/${data.items[0].id}/artifacts`, { replace: true });
        } else {
          setStatus('no-project');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void redirect();
    return () => { cancelled = true; };
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">加载中...</p>
      </div>
    );
  }

  if (status === 'no-project') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">还没有项目，请先创建一个项目</p>
          <button
            type="button"
            onClick={() => navigate('/projects/new')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            创建项目
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-red-500">加载项目列表失败，请重试</p>
    </div>
  );
}