
import React, { useState, useEffect } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Cloud, CloudOff, WifiOff } from 'lucide-react';
import { APP_VERSION } from '../constants.tsx';

interface LayoutProps {
  children: React.ReactNode;
  title?: string | null; // Allow null to hide title bar but keep layout structure
  onBackToHome?: () => void;
  hideHeaderStatus?: boolean;
  showBottomStatus?: boolean;
  rightContent?: React.ReactNode; // Nuevo prop para contenido a la derecha del título
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBackToHome, hideHeaderStatus = false, showBottomStatus = false, rightContent }) => {
  const { isDbReady } = useAssembly();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'FREE' | 'LEGAL'>('FREE');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogoClick = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-xl sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left group"
            title="Ir al Inicio"
          >
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm group-active:scale-95 transition-transform border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                <path d="M9 22v-4h6v4"></path>
                <path d="M8 6h.01"></path>
                <path d="M16 6h.01"></path>
                <path d="M12 6h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 10h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 10h.01"></path>
                <path d="M8 14h.01"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-none text-white flex items-center">
                GestorPH <span className="text-indigo-200 font-medium tracking-normal text-sm border-l border-indigo-500/50 ml-2 pl-2">Votaciones</span>
              </h1>
            </div>
          </button>

          {!hideHeaderStatus && (
            <div className="hidden sm:flex items-center gap-2 bg-indigo-800/50 px-3 py-1.5 rounded-full border border-indigo-600/50 shadow-inner">
              {isDbReady ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Sincronizado</span>
                  <Cloud size={14} className="text-emerald-400 opacity-50" />
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Conectando...</span>
                  <CloudOff size={14} className="text-amber-400 opacity-50" />
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-[10px] font-black uppercase tracking-widest animate-pulse sticky top-[64px] z-40 shadow-md flex items-center justify-center gap-2">
          <WifiOff size={14} /> ⚠ Sin conexión a Internet - Verifique su red antes de votar
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-12">
        {(title || rightContent) && (
          <div className="mb-6 flex justify-between items-end gap-4">
            <div>
              {title && <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h2>}
              {title && <div className="h-1 w-12 bg-indigo-600 mt-1 rounded-full"></div>}
            </div>
            {rightContent}
          </div>
        )}
        {children}
      </main>

      <footer className="mt-auto py-6 text-center border-t border-slate-200 bg-white no-print">
        {showBottomStatus && (
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              {isDbReady ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Sincronizado</span>
                  <Cloud size={12} className="text-emerald-500 opacity-50" />
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">Conectando...</span>
                  <CloudOff size={12} className="text-amber-500 opacity-50" />
                </>
              )}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
          <p>
            Copyright © 2025{' '}
            <a
              href="https://grupoiart.com/portal/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 transition-colors font-black hover:underline"
            >
              Grupo Iart SAS
            </a>
            , Derechos reservados.
          </p>

          <span className="hidden sm:inline text-slate-300">•</span>

          <button
            className="hover:text-indigo-600 transition-colors font-black border-b border-transparent hover:border-indigo-200"
          >
            Términos, Condiciones y Política de Beneficios
          </button>

          <span className="hidden sm:inline text-slate-300">•</span>

          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[8px] tracking-widest font-black">v{APP_VERSION}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
