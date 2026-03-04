
import React, { useState, useEffect } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Layout } from './Layout.tsx';
import { isFirebaseConfigured } from '../firebaseConfig.ts';
import { Auth } from './Auth.tsx';
import {
   QrCode, ShieldCheck, Globe, AlertCircle, User, Clock, Check,
   Database, Cloud, CheckCircle2, Zap, PieChart, FileCheck,
   Smartphone, Star, HelpCircle, X, Search, Loader2, Sparkles, Info,
   Gift, FileText, Lock, BookOpen, ArrowRight, Bot, Mic, Building2, Users, FileSpreadsheet
} from 'lucide-react';

export const Home: React.FC<{ setView: (view: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin' | 'payments' | 'manual') => void }> = ({ setView }) => {
   const { loginByToken, isDbReady } = useAssembly();
   const [token, setToken] = useState('');
   const [error, setError] = useState('');
   const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

   // Admin Login States controlled by Home, but content rendered by Auth component
   const [showAdminPortal, setShowAdminPortal] = useState<'none' | 'login' | 'register' | 'super'>('none');

   // Terms Modal State (For landing page usage)
   const [isTermsOpen, setIsTermsOpen] = useState(false);
   const [termsTab, setTermsTab] = useState<'FREE' | 'LEGAL'>('FREE');

   const configOk = isFirebaseConfigured();

   // EFECTO PARA LOGIN AUTOMÁTICO DESDE QR (URL)
   useEffect(() => {
      const checkUrlToken = async () => {
         if (!isDbReady) return; // Esperar a que la BD esté lista

         const params = new URLSearchParams(window.location.search);
         const urlToken = params.get('token');

         if (urlToken) {
            setIsAutoLoggingIn(true);
            setToken(urlToken); // Llenar el input visualmente

            // Limpiar la URL para que no se vea feo el token (opcional, mejora UX)
            window.history.replaceState({}, document.title, window.location.pathname);

            try {
               // Pequeño delay para asegurar que Firebase auth/conn esté caliente
               await new Promise(r => setTimeout(r, 500));

               const result = await loginByToken(urlToken);
               if (result.success) {
                  setView('voter');
               } else {
                  setError(result.message || 'El enlace QR ha expirado o es inválido.');
                  setIsAutoLoggingIn(false);
               }
            } catch (err) {
               console.error(err);
               setError('Error de conexión al validar el QR.');
               setIsAutoLoggingIn(false);
            }
         }
      };

      checkUrlToken();
   }, [isDbReady, loginByToken, setView]);

   const handleVoterLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!configOk) {
         setError('Error: Firebase no está configurado en firebaseConfig.ts');
         return;
      }
      setError('');
      try {
         const result = await loginByToken(token);
         if (result.success) {
            setView('voter');
         } else {
            setError(result.message || 'Token inválido.');
         }
      } catch (err) {
         setError('Error al intentar ingresar. Verifique su conexión.');
      }
   };

   const handlePurchase = (plan: string) => {
      setView('payments');
   };

   const handleResetHome = () => {
      setShowAdminPortal('none');
      setError('');
      setView('home');
   };

   // Delegar renderizado al componente Auth si se seleccionó una opción administrativa
   if (showAdminPortal !== 'none') {
      return (
         <Auth
            initialView={showAdminPortal}
            onBack={handleResetHome}
            setView={setView}
         />
      );
   }

   return (
      <Layout onBackToHome={handleResetHome}>
         <div className="max-w-7xl mx-auto py-6 sm:py-10 space-y-16">

            {/* HERO + LOGIN SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
               <div className="space-y-6 order-2 md:order-1">
                  <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                     <Star size={12} className="fill-indigo-700" /> La solución #1 en Colombia
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                     Gestión inteligente para sus <span className="text-indigo-600">Asambleas de PH.</span>
                  </h1>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-lg">
                     Plataforma certificada, segura y en tiempo real. Cumplimos con la Ley 675 de 2001. Votaciones rápidas, transparentes y sin complicaciones.
                  </p>
                  <div className="flex flex-wrap gap-4">
                     <button onClick={() => setShowAdminPortal('login')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                        Soy Administrador
                     </button>
                     <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-indigo-600 border border-indigo-100 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm">
                        Ver Tarifas
                     </button>
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-indigo-100 border border-slate-100 space-y-6 relative overflow-hidden order-1 md:order-2 max-w-lg w-full mx-auto md:ml-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>

                  <div className="relative z-10 text-center space-y-2">
                     <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg mb-4">
                        <QrCode size={32} />
                     </div>
                     <h2 className="text-xl font-black text-slate-900 uppercase">Ingreso a Votación</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zona para Asambleístas</p>
                  </div>

                  <form onSubmit={handleVoterLogin} className="space-y-4 relative z-10">
                     <div>
                        <input
                           type="text"
                           value={token}
                           onChange={(e) => {
                              setToken(e.target.value.toUpperCase());
                              setError('');
                           }}
                           placeholder="CÓDIGO DE ACCESO"
                           className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none text-center font-black text-lg tracking-[0.2em] uppercase transition-all text-slate-900 placeholder:text-slate-300"
                        />
                        {error && <p className="text-red-600 text-[10px] mt-3 font-black uppercase text-center tracking-wider bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
                     </div>
                     <button
                        type="submit"
                        disabled={isAutoLoggingIn}
                        className="w-full py-5 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 uppercase tracking-[0.15em] bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200/50 flex items-center justify-center gap-2"
                     >
                        {isAutoLoggingIn ? <Loader2 className="animate-spin" size={18} /> : null}
                        {isAutoLoggingIn ? 'Validando Acceso...' : 'Ingresar a la Sala'}
                     </button>
                  </form>

                  <div className="relative z-10 flex items-center justify-center gap-2 text-[9px] text-slate-400 font-bold uppercase pt-2">
                     <Lock size={12} /> Conexión Segura SSL
                  </div>
               </div>
            </div>

            {/* FEATURES SECTION */}
            <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-14 shadow-2xl">
               <div className="text-center mb-12 space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Potencia para tu Asamblea</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto">Características diseñadas para una gestión eficiente en propiedad horizontal</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
                  <div className="space-y-3">
                     <div className="bg-emerald-500/10 w-fit p-4 rounded-2xl text-emerald-400 mb-2"><Zap size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Resultados en Vivo</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Gráficos instantáneos que se actualizan segundo a segundo en todas las pantallas.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-indigo-500/10 w-fit p-4 rounded-2xl text-indigo-400 mb-2"><PieChart size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Quórum Automático</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Cálculo de coeficientes y asistencia nominal sin errores humanos.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-pink-500/10 w-fit p-4 rounded-2xl text-pink-400 mb-2"><Smartphone size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">100% Móvil</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Funciona en cualquier celular o tablet. Sin instalar aplicaciones extrañas.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-amber-500/10 w-fit p-4 rounded-2xl text-amber-400 mb-2"><FileCheck size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Actas Rápidas</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Generación de informes detallados y soporte para actas al finalizar.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-blue-500/10 w-fit p-4 rounded-2xl text-blue-400 mb-2"><ShieldCheck size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Voto Híbrido</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Soporte completo para votación Presencial y Virtual simultáneamente.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-purple-500/10 w-fit p-4 rounded-2xl text-purple-400 mb-2"><Globe size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Ley 675</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Cumplimiento normativa estricto para propiedad horizontal en Colombia.</p>
                  </div>
                  {/* NUEVAS CARACTERÍSTICAS */}
                  <div className="space-y-3">
                     <div className="bg-fuchsia-500/10 w-fit p-4 rounded-2xl text-fuchsia-400 mb-2"><Sparkles size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">I.A. Integrada</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Redacción automática de actas y resúmenes mediante Inteligencia Artificial.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-cyan-500/10 w-fit p-4 rounded-2xl text-cyan-400 mb-2"><Users size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Gestión de Poderes</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Unificación automática de coeficientes para representantes y apoderados.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-lime-500/10 w-fit p-4 rounded-2xl text-lime-400 mb-2"><FileSpreadsheet size={32} /></div>
                     <h3 className="font-extrabold text-base md:text-lg uppercase text-slate-100">Carga Excel</h3>
                     <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">Importación masiva de propietarios y unidades en segundos.</p>
                  </div>
               </div>
            </div>

            {/* PRICING SECTION */}
            <div id="pricing" className="scroll-mt-24 space-y-10">
               <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 uppercase">Planes & Tarifas</h2>
                  <p className="text-slate-500 text-sm font-medium">Precios claros y escalables según el tamaño de su copropiedad.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-4 lg:px-0">

                  {/* PLAN GRATIS */}
                  <div className="bg-white p-8 rounded-[32px] border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all flex flex-col relative group">
                     <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-widest border-b border-l border-emerald-200">
                        Beneficio Nuevo
                     </div>
                     <div className="mb-4 space-y-1">
                        <h3 className="text-lg font-black text-emerald-800 uppercase flex items-center gap-2">
                           <Sparkles size={18} className="fill-emerald-500 text-emerald-600" /> Primera Asamblea
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Para copropiedades nuevas</p>
                     </div>
                     <div className="mb-6">
                        <span className="text-4xl font-black text-slate-900">$0</span>
                        <span className="text-xs font-bold text-slate-400 uppercase ml-1">/ Evento</span>
                     </div>

                     <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-emerald-500 shrink-0" /> Funciones del Plan Autogestionado
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-emerald-500 shrink-0" /> Hasta 50 Unidades
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-slate-400 items-center">
                           <Info size={16} className="text-slate-300 shrink-0" />
                           <button
                              onClick={() => { setTermsTab('FREE'); setIsTermsOpen(true); }}
                              className="hover:text-emerald-600 underline decoration-dashed underline-offset-4 transition-colors text-left"
                           >
                              Ver condiciones del beneficio
                           </button>
                        </li>
                     </ul>

                     <button onClick={() => handlePurchase('Gratis')} className="w-full py-4 rounded-xl border-2 border-emerald-600 text-emerald-700 font-black uppercase text-xs tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                        Solicitar Beneficio
                     </button>
                  </div>

                  {/* PLAN AUTOGESTIONADO */}
                  <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all flex flex-col relative group">
                     <div className="mb-4 space-y-1">
                        <h3 className="text-lg font-black text-slate-900 uppercase">Autogestionado</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Para Administradores Expertos</p>
                     </div>

                     <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1"><Building2 size={12} /> Hasta 80 Unidades</span>
                           <span className="text-lg font-black text-indigo-600">$600.000</span>
                        </div>
                        <div className="w-full h-px bg-slate-200"></div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1"><Building2 size={12} /> Más de 80 Unidades</span>
                           <span className="text-lg font-black text-indigo-600">$800.000</span>
                        </div>
                     </div>

                     <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-emerald-500 shrink-0" /> Plataforma completa (Votos, Quórum, Poderes)
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-emerald-500 shrink-0" /> Operado por el Administrador
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-emerald-500 shrink-0" /> Soporte técnico remoto (Chat)
                        </li>
                     </ul>

                     <button onClick={() => handlePurchase('Autogestionado')} className="w-full py-4 rounded-xl border-2 border-slate-900 text-slate-900 font-black uppercase text-xs tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                        Seleccionar Plan
                     </button>
                  </div>

                  {/* PLAN ASISTIDO PREMIUM */}
                  <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl shadow-indigo-200 border border-slate-700 flex flex-col relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-bl-xl tracking-widest">
                        Más Popular
                     </div>

                     <div className="mb-4 space-y-1 relative z-10">
                        <h3 className="text-lg font-black text-white uppercase">Asistido Premium</h3>
                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Tranquilidad y Soporte Total</p>
                     </div>

                     <div className="space-y-3 mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 relative z-10">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Building2 size={12} /> Hasta 80 Unidades</span>
                           <span className="text-lg font-black text-white">$750.000</span>
                        </div>
                        <div className="w-full h-px bg-slate-700"></div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Building2 size={12} /> Más de 80 Unidades</span>
                           <span className="text-lg font-black text-white">$1.000.000</span>
                        </div>
                     </div>

                     <ul className="space-y-4 mb-8 flex-1 relative z-10">
                        <li className="flex gap-3 text-xs font-medium text-indigo-50">
                           <User size={16} className="text-emerald-400 shrink-0" /> <strong>Moderador Técnico Remoto</strong>
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-indigo-50">
                           <Check size={16} className="text-emerald-400 shrink-0" /> Carga de datos y configuración incluida
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-indigo-50">
                           <Check size={16} className="text-emerald-400 shrink-0" /> Generación de informes al finalizar
                        </li>
                     </ul>

                     <button onClick={() => handlePurchase('Asistido Premium')} className="relative z-10 w-full py-4 rounded-xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-50 shadow-lg shadow-indigo-900/50 transition-all flex justify-center items-center gap-2">
                        Contratar Ahora <ArrowRight size={14} />
                     </button>

                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                  </div>

                  {/* NUEVO PLAN: ACTA INTELIGENTE IA */}
                  <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-[32px] border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all flex flex-col relative group">
                     <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 text-[9px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-widest border-b border-l border-purple-200 flex items-center gap-1">
                        <Sparkles size={10} /> Nuevo
                     </div>
                     <div className="mb-4 space-y-1">
                        <h3 className="text-lg font-black text-purple-900 uppercase flex items-center gap-2">
                           <Bot size={20} className="text-purple-600" /> Actas con I.A.
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Transcripción Automática</p>
                     </div>

                     <div className="space-y-3 mb-6 bg-purple-100/50 p-4 rounded-2xl border border-purple-100">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-purple-700 flex items-center gap-1"><Mic size={12} /> Hasta 4 Horas</span>
                           <span className="text-lg font-black text-purple-900">$250.000</span>
                        </div>
                        <div className="w-full h-px bg-purple-200"></div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-purple-700 flex items-center gap-1"><Mic size={12} /> Hasta 6 Horas</span>
                           <span className="text-lg font-black text-purple-900">$400.000</span>
                        </div>
                     </div>

                     <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-purple-500 shrink-0" /> Transcripción de audio a texto
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-purple-500 shrink-0" /> Resumen ejecutivo de decisiones
                        </li>
                        <li className="flex gap-3 text-xs font-medium text-slate-600">
                           <Check size={16} className="text-purple-500 shrink-0" /> Formato legal editable (Word)
                        </li>
                     </ul>

                     <button onClick={() => handlePurchase('Acta IA')} className="w-full py-4 rounded-xl border-2 border-purple-600 text-purple-700 font-black uppercase text-xs tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                        Añadir al Plan
                     </button>
                  </div>

               </div>
            </div>

            {/* LEGAL COMPLIANCE & HELP */}
            <div className="bg-white rounded-[32px] p-2 border-2 border-indigo-50 shadow-xl flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1 flex items-center gap-4 p-4">
                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl shrink-0">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                     <h3 className="font-black text-slate-900 uppercase text-xs mb-1">Cumplimiento Legal Garantizado</h3>
                     <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-lg">
                        Plataforma auditada bajo los estándares de la <strong>Ley 675 de 2001</strong> y la Ley 1581 de 2012 (Habeas Data) para votaciones virtuales y mixtas en Colombia.
                     </p>
                  </div>
               </div>

               <div className="p-2 w-full md:w-auto">
                  <button
                     onClick={() => setView('manual')}
                     className="w-full md:w-auto bg-emerald-50 text-emerald-700 border-2 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-100 px-6 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
                  >
                     <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <BookOpen size={16} className="text-emerald-600" />
                     </div>
                     <span>Manual de Uso</span>
                  </button>
               </div>
            </div>

            {/* SUPER ADMIN ACCESS (RESTORED) */}
            <div className="flex justify-center pt-8 opacity-10 hover:opacity-100 transition-opacity">
               <button
                  onClick={() => setShowAdminPortal('super')}
                  className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
               >
                  <Lock size={10} /> Acceso Maestro
               </button>
            </div>
         </div>

         {/* MODAL TÉRMINOS Y CONDICIONES (HOME LOCAL) */}
         {isTermsOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
               <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">

                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                     <div>
                        <h3 className="font-black text-lg text-slate-900 uppercase">Marco Legal y Beneficios</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">GestorPH • Grupo Iart SAS</p>
                     </div>
                     <button onClick={() => setIsTermsOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
                  </div>

                  <div className="flex p-2 bg-slate-100 shrink-0 gap-2 mx-6 mt-4 rounded-xl">
                     <button
                        onClick={() => setTermsTab('FREE')}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${termsTab === 'FREE' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <Gift size={14} /> Beneficio Gratis
                     </button>
                     <button
                        onClick={() => setTermsTab('LEGAL')}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${termsTab === 'LEGAL' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <ShieldCheck size={14} /> Términos del Servicio
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                     {termsTab === 'FREE' ? (
                        <div className="space-y-6">
                           <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl">
                              <h4 className="font-black text-emerald-800 uppercase text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> ¿Cómo aplicar al Beneficio?</h4>
                              <ol className="list-decimal list-inside text-xs font-medium text-emerald-900 space-y-2">
                                 <li>Regístrese como Administrador en la plataforma.</li>
                                 <li>Cree su Copropiedad (Edificio/Conjunto) y configure las unidades.</li>
                                 <li>Envíe el RUT de la copropiedad a nuestro WhatsApp <strong>+57 3502809714</strong>.</li>
                                 <li>Una vez validado que el NIT es nuevo en nuestra red, activaremos el plan sin costo.</li>
                              </ol>
                           </div>

                           <div className="space-y-4">
                              <h4 className="font-black text-slate-900 uppercase text-sm border-b pb-2">Condiciones y Restricciones</h4>
                              <ul className="space-y-3">
                                 <li className="flex gap-3 text-xs text-slate-600">
                                    <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                    <span><strong>Un solo uso por NIT:</strong> El beneficio es válido exclusivamente para la primera asamblea realizada por la copropiedad en nuestra plataforma.</span>
                                 </li>
                                 <li className="flex gap-3 text-xs text-slate-600">
                                    <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                    <span><strong>Límite de Unidades:</strong> Aplica para copropiedades de hasta <strong>50 unidades inmobiliarias</strong>. Para copropiedades de más de 50, se ofrece un 30% de descuento en el primer evento.</span>
                                 </li>
                                 <li className="flex gap-3 text-xs text-slate-600">
                                    <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                    <span><strong>Modalidad Autogestionada:</strong> El beneficio otorga acceso completo al software, pero no incluye moderador remoto, ni personal de soporte presencial. El administrador opera la herramienta.</span>
                                 </li>
                                 <li className="flex gap-3 text-xs text-slate-600">
                                    <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                    <span><strong>Vigencia:</strong> El beneficio debe ser redimido dentro de los 30 días calendario posteriores al registro de la copropiedad.</span>
                                 </li>
                              </ul>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-6 text-xs text-slate-600 text-justify leading-relaxed">
                           <p><strong>1. OBJETO DEL SERVICIO:</strong> Grupo Iart SAS provee a "EL CLIENTE" (Copropiedad/Administrador) el acceso a la plataforma GestorPH bajo la modalidad SaaS (Software as a Service) para la gestión de votaciones en asambleas de propiedad horizontal.</p>

                           <p><strong>2. ALCANCE Y LIMITACIONES:</strong> La licencia de uso se otorga por evento (Asamblea), con una duración máxima de 24 horas continuas de operación. La plataforma garantiza la integridad del cálculo de coeficientes y quórum basado en la información suministrada por EL CLIENTE.</p>

                           <p><strong>3. HABEAS DATA Y PRIVACIDAD:</strong> En cumplimiento de la Ley 1581 de 2012, Grupo Iart SAS actúa como ENCARGADO del tratamiento de datos. EL CLIENTE garantiza que cuenta con la autorización de los titulares (propietarios) para cargar sus datos básicos (Nombre, Unidad, Email, Coeficiente) en la plataforma con fines exclusivamente logísticos para la asamblea.</p>

                           <p><strong>4. POLÍTICA DE REEMBOLSOS:</strong> Debido a la naturaleza digital del servicio y los costos de reserva de infraestructura en la nube, no se realizarán devoluciones de dinero una vez activada la asamblea o iniciado el evento, salvo fallas técnicas mayores imputables exclusivamente a la plataforma que impidan el desarrollo de la votación.</p>

                           <p><strong>5. SOPORTE TÉCNICO:</strong> El soporte se presta en horario hábil (Lunes a Viernes 8am - 6pm y Sábados 8am - 12pm). Para asambleas fuera de este horario, se requiere la contratación del plan "Asistido Premium".</p>
                        </div>
                     )}
                  </div>

                  <div className="p-6 border-t bg-slate-50 text-center">
                     <button onClick={() => setIsTermsOpen(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all">Entendido</button>
                  </div>
               </div>
            </div>
         )}

      </Layout>
   );
};
