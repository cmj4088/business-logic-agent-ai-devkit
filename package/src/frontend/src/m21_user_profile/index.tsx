/** M21 用户设置 — 账号管理、修改密码、头像设置
 *
 * 科技深色风：玻璃拟态卡片 + 霓虹蓝紫渐变 + framer-motion 入场动画。
 * 点击导航栏用户名或首页头像打开。
 * 支持图片裁切：选择图片后弹出裁切框，可拖拽调整位置，确认后压缩为 200×200 JPEG。
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, message, Modal } from 'antd';
import { UserOutlined, CameraOutlined, EditOutlined, LockOutlined, LogoutOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '@/m11_auth_pages';
import { useNavigate } from 'react-router-dom';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

/** 将图片裁切为 200×200 正方形并返回压缩后的 base64 JPEG */
function cropToSquare(img: HTMLImageElement, cropX: number, cropY: number, cropSize: number): string {
  const TARGET_SIZE = 200;
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, TARGET_SIZE, TARGET_SIZE);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 裁切弹窗状态
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropImgSize, setCropImgSize] = useState({ w: 0, h: 0 }); // 图片在容器内的显示尺寸
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  if (!user) return null;

  /* ---------- 头像选择 + 裁切 ---------- */
  const handleAvatarClick = () => {
    console.log('[Avatar] handleAvatarClick called');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Avatar] handleFileChange called');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('[Avatar] No file selected');
      return;
    }
    console.log('[Avatar] File:', file.name, 'size:', file.size, 'type:', file.type);
    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      console.log('[Avatar] FileReader onload');
      const img = new Image();
      img.onload = () => {
        console.log('[Avatar] Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
        // 计算显示尺寸：让图片填满裁切容器（cover 模式）
        const CONTAINER_SIZE = 224; // w-56 = 14rem = 224px
        const aspect = img.naturalWidth / img.naturalHeight;
        let displayW: number, displayH: number;
        if (aspect > 1) {
          displayH = CONTAINER_SIZE;
          displayW = Math.round(CONTAINER_SIZE * aspect);
        } else {
          displayW = CONTAINER_SIZE;
          displayH = Math.round(CONTAINER_SIZE / aspect);
        }
        console.log('[Avatar] display size:', displayW, 'x', displayH);
        setCropImgSize({ w: displayW, h: displayH });
        setCropImg(img);
        setCropOffset({ x: 0, y: 0 });
        setCropOpen(true);
        console.log('[Avatar] cropOpen set to true');
      };
      img.onerror = () => {
        console.error('[Avatar] Image load error');
        message.error('图片加载失败，请尝试其他图片');
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      console.error('[Avatar] FileReader error');
      message.error('文件读取失败');
    };
    reader.readAsDataURL(file);
    // 重置 file input 以便重复选择同一文件
    e.target.value = '';
  };

  /** 确认裁切 */
  const handleCropConfirm = () => {
    console.log('[Avatar] handleCropConfirm called');
    if (!cropImg) {
      console.log('[Avatar] cropImg is null');
      return;
    }
    const container = cropContainerRef.current;
    if (!container) {
      console.log('[Avatar] container is null');
      return;
    }
    const cropSize = container.clientWidth; // 正方形裁切框
    const scale = cropImg.naturalWidth / cropImgSize.w;
    const cx = cropOffset.x * scale;
    const cy = cropOffset.y * scale;
    const cs = cropSize * scale;
    console.log('[Avatar] crop params:', { cropSize, scale, cx, cy, cs, naturalW: cropImg.naturalWidth, naturalH: cropImg.naturalHeight });
    try {
      const cropped = cropToSquare(cropImg, cx, cy, cs);
      console.log('[Avatar] cropped data length:', cropped.length);
      setAvatarPreview(cropped);
      setCropOpen(false);
      setCropImg(null);
    } catch (err) {
      console.error('[Avatar] cropToSquare error:', err);
      message.error('图片裁切失败');
    }
  };

  /** 取消裁切 */
  const handleCropCancel = () => {
    setCropOpen(false);
    setCropImg(null);
  };

  /** 鼠标拖拽移动图片 */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: cropOffset.x, oy: cropOffset.y };
  }, [cropOffset.x, cropOffset.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !cropImg || !cropContainerRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const container = cropContainerRef.current;
    const maxOX = cropImgSize.w - container.clientWidth;
    const maxOY = cropImgSize.h - container.clientHeight;
    setCropOffset({
      x: Math.max(0, Math.min(maxOX, dragStart.current.ox + dx)),
      y: Math.max(0, Math.min(maxOY, dragStart.current.oy + dy)),
    });
  }, [isDragging, cropImg, cropImgSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* ---------- 保存资料 ---------- */
  const handleSaveProfile = async () => {
    console.log('[Avatar] handleSaveProfile called');
    console.log('[Avatar] displayName:', displayName, 'avatarPreview length:', avatarPreview?.length ?? 0);
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        avatar: avatarPreview ?? undefined,
      });
      console.log('[Avatar] updateProfile success');
      message.success('资料更新成功');
      setAvatarPreview(null);
    } catch (err: unknown) {
      console.error('[Avatar] updateProfile error:', err);
      message.error((err as Error).message || '更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- 修改密码（带确认对话框） ---------- */
  const handleChangePassword = () => {
    if (!oldPassword) {
      message.error('请输入当前密码');
      return;
    }
    if (!newPassword) {
      message.error('请输入新密码');
      return;
    }
    if (newPassword.length < 8) {
      message.error('新密码至少 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    if (newPassword === oldPassword) {
      message.error('新密码不能与旧密码相同');
      return;
    }

    Modal.confirm({
      title: '确认修改密码',
      content: `确定要将密码修改为 "${newPassword}" 吗？修改后需要重新登录。`,
      okText: '确认修改',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setIsChangingPwd(true);
        try {
          await changePassword(oldPassword, newPassword);
          message.success('密码修改成功，请重新登录');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          logout();
          navigate('/login');
          onClose();
        } catch (err: unknown) {
          message.error((err as Error).message || '密码修改失败');
        } finally {
          setIsChangingPwd(false);
        }
      },
    });
  };

  /* ---------- 退出 ---------- */
  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const displayAvatar = avatarPreview || user.avatar;

  return (
    <>
    {/* 隐藏的 file input，放在 div 外部避免 click 事件冒泡导致递归调用 */}
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleFileChange}
    />
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-deep-border bg-deep-card shadow-2xl"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-100">用户设置</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-deep-surface hover:text-slate-300 transition-colors"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* 头像区域 */}
            <div className="flex flex-col items-center border-b border-deep-border px-6 py-6">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div
                    className="absolute inset-0 rounded-full opacity-60 blur-md"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
                  />
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={user.display_name}
                      className="relative h-20 w-20 rounded-full border-2 border-neon-blue/50 object-cover"
                    />
                  ) : (
                    <Avatar
                      size={80}
                      icon={<UserOutlined />}
                      className="relative border-2 border-neon-blue/50"
                      style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
                      }}
                    />
                  )}
                  {/* 悬浮相机图标 */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CameraOutlined className="text-white text-xl" />
                  </div>
                </motion.div>
              </div>
              <p className="mt-3 text-sm text-slate-400">点击头像更换图片</p>
              <p className="mt-1 text-xs text-slate-500">{user.email}</p>
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b border-deep-border">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-neon-blue border-b-2 border-neon-blue'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <EditOutlined />
                账号管理
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'text-neon-blue border-b-2 border-neon-blue'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LockOutlined />
                修改密码
              </button>
            </div>

            {/* Tab 内容 */}
            <div className="px-6 py-4">
              {activeTab === 'profile' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">显示名称</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                      className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      placeholder="输入显示名称"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">邮箱</label>
                    <input
                      type="text"
                      value={user.email}
                      disabled
                      className="w-full rounded-lg border border-deep-border bg-deep-surface/50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-slate-600">邮箱暂不支持修改</p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full neon-btn-blue rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '保存中...' : '保存修改'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">旧密码</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      placeholder="输入当前密码"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      placeholder="输入新密码（至少 8 位）"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">确认新密码</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      placeholder="再次输入新密码"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPwd || !oldPassword || !newPassword || !confirmPassword}
                    className="w-full neon-btn-blue rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPwd ? '修改中...' : '修改密码'}
                  </button>
                </div>
              )}
            </div>

            {/* 底部 — 退出登录 */}
            <div className="border-t border-deep-border px-6 py-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogoutOutlined />
                退出登录
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* ===== 裁切弹窗（独立于 AnimatePresence，避免渲染冲突） ===== */}
      {cropOpen && cropImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={handleCropCancel}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-deep-border bg-deep-card shadow-2xl overflow-hidden"
          >
            {/* 裁切标题 */}
            <div className="flex items-center justify-between border-b border-deep-border px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-100">裁切头像</h3>
              <button
                onClick={handleCropCancel}
                className="rounded-lg p-1 text-slate-500 hover:bg-deep-surface hover:text-slate-300 transition-colors"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* 裁切区域 */}
            <div className="px-5 py-4 select-none">
              <p className="text-xs text-slate-500 mb-3">拖拽图片调整位置，将裁切为正方形头像</p>

              <div
                ref={cropContainerRef}
                className="relative mx-auto w-56 h-56 overflow-hidden rounded-lg border-2 border-neon-blue/60 bg-deep-surface"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <img
                  src={cropImg.src}
                  alt="裁切预览"
                  className="absolute block pointer-events-none"
                  style={{
                    width: cropImgSize.w,
                    height: cropImgSize.h,
                    left: -cropOffset.x,
                    top: -cropOffset.y,
                    maxWidth: 'none',
                  }}
                />

                <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none" />
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white pointer-events-none" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3 border-t border-deep-border px-5 py-4">
              <button
                onClick={handleCropCancel}
                className="flex-1 rounded-lg border border-deep-border bg-deep-surface py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 neon-btn-blue rounded-lg py-2 text-sm font-medium text-white"
              >
                确认裁切
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}