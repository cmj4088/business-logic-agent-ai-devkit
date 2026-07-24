/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron preload API 类型声明
interface ElectronAPI {
  getSecure: (key: string) => Promise<string | null>;
  setSecure: (key: string, value: string) => Promise<void>;
  deleteSecure: (key: string) => Promise<void>;
  showNotification: (title: string, body: string) => Promise<void>;
  openFileDialog: (options: { filters: { name: string; extensions: string[] }[] }) => Promise<string[] | null>;
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}