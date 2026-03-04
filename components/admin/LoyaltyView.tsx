
import React, { useMemo } from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import { Layout } from '../Layout.tsx';
import { ArrowLeft, Award, TrendingUp, TrendingDown, Calendar, Star, Clock, CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';

interface LoyaltyViewProps {
  setView: (view: 'admin') => void;
}

export const LoyaltyView: React.FC<LoyaltyViewProps> = ({ setView }) => {
  const { currentAdmin, phAdmins, loyaltyTransactions } = useAssembly();

  // Obtener datos frescos del admin desde la lista global sincronizada
  const freshAdmin = useMemo(() => 
    phAdmins.find(a => a.id === currentAdmin?.id) || currentAdmin
  , [phAdmins, currentAdmin]);

  if (!freshAdmin) {
      setView('admin');
      return null;
  }

  // Filtrar transacciones del admin actual y ordenar por fecha descendente
  const myTransactions = useMemo(() => 
    loyaltyTransactions
      .filter(t => t.adminId === freshAdmin.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  , [loyaltyTransactions, freshAdmin.id]);

  // CÁLCULO CRÍTICO: Sumar solo lo aprobado para mostrar el saldo real
  const validatedBalance = useMemo(() => 
    myTransactions
      .filter(t => t.status === 'APROBADO')
      .reduce((acc, t) => acc + t.amount, 0)
  , [myTransactions]);

  const formatPoints = (points: number) => points.toLocaleString('es-CO');

  return (
    <Layout title="Programa de Fidelización" onBackToHome={() => setView('admin')}>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        
        {/* Header Nav */}
        <button 
            onClick={() => setView('admin')} 
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors"
        >
            <ArrowLeft size={14} /> Volver al Panel
        </button>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[32px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-white/10">
                        <Star size={12} className="text-amber-400 fill-amber-400" /> Nivel Administrador
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Mis Puntos</h1>
                    <p className="text-indigo-200 text-sm font-medium">Acumule puntos por cada gestión. El Super Admin valida cada movimiento.</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl min-w-[240px] text-center">
                    <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest mb-1">Saldo Validado</p>
                    <div className="text-5xl font-black text-amber-400 drop-shadow-sm flex items-center justify-center gap-2">
                        {formatPoints(validatedBalance)}
                    </div>
                </div>
            </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 px-2">
                <Calendar size={20} className="text-slate-400"/> Historial de Movimientos
            </h3>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                {myTransactions.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {myTransactions.map(t => {
                            const status = t.status || 'PENDIENTE';
                            const isRejected = status === 'RECHAZADO';
                            const isPending = status === 'PENDIENTE';
                            const isApproved = status === 'APROBADO';
                            
                            return (
                                <div key={t.id} className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group gap-4 ${isRejected ? 'bg-slate-50/30' : ''}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-1 transition-colors ${
                                            isRejected ? 'bg-red-50 text-red-400' : 
                                            (t.amount >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500')
                                        }`}>
                                            {isRejected ? <Ban size={20} /> : (t.amount >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className={`font-black uppercase text-xs sm:text-sm tracking-tight transition-colors ${isRejected ? 'text-slate-400' : 'text-slate-900'}`}>{t.description}</p>
                                            
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                    {new Date(t.timestamp).toLocaleDateString()}
                                                </p>
                                                <span className="text-slate-200 text-[8px]">•</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border transition-all ${
                                                    isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    isRejected ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {isApproved && <CheckCircle2 size={10}/>}
                                                    {isRejected && <XCircle size={10}/>}
                                                    {isPending && <Clock size={10} className="animate-pulse" />}
                                                    {status}
                                                </span>
                                            </div>

                                            {isRejected && t.rejectionReason && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-left-2 max-w-sm">
                                                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-[9px] text-red-800 font-black uppercase">Motivo del rechazo:</p>
                                                        <p className="text-[11px] text-red-700 font-medium leading-tight mt-0.5 italic">"{t.rejectionReason}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`text-xl font-black text-right shrink-0 transition-all ${
                                        isRejected ? 'text-red-600 line-through opacity-60 scale-95' : 
                                        (t.amount >= 0 ? 'text-emerald-600' : 'text-red-500')
                                    }`}>
                                        {t.amount > 0 ? '+' : ''}{formatPoints(t.amount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                            <Award size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aún no hay movimientos registrados</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </Layout>
  );
};
