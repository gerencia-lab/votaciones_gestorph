
import React, { useState, useMemo, useEffect } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Layout } from './Layout.tsx';
import { Presentation, BarChart2, PieChart as PieChartIcon, Building2, ArrowLeft, Users, LayoutDashboard, History, ChevronDown, CheckCircle, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, LabelList, PieChart, Pie, Legend 
} from 'recharts';

interface ProjectionViewProps {
  setView: (view: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin') => void;
}

export const ProjectionView: React.FC<ProjectionViewProps> = ({ setView }) => {
  const { 
    activeQuestion, calculateResults, preguntas, copropiedades, 
    selectedCopropiedadId, selectedAsambleaId, asambleistas, getVoterCoefficient
  } = useAssembly();
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [manualQuestionId, setManualQuestionId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const currentBuilding = copropiedades.find(cp => cp.id === selectedCopropiedadId);
  
  const currentAsmUsers = asambleistas.filter(a => a.asambleaId === selectedAsambleaId);
  const totalCoefAttendance = currentAsmUsers.filter(a => a.asistenciaConfirmada).reduce((acc, a) => acc + getVoterCoefficient(a), 0);
  
  useEffect(() => {
    if (activeQuestion) {
      setManualQuestionId(null);
    }
  }, [activeQuestion]);

  useEffect(() => {
      if (activeQuestion?.status === 'ABIERTA' && activeQuestion.startedAt) {
          const interval = setInterval(() => {
              const startTime = new Date(activeQuestion.startedAt!).getTime();
              const now = Date.now();
              const elapsed = (now - startTime) / 1000;
              const remaining = Math.max(0, activeQuestion.tiempoRestante - elapsed);
              setTimeLeft(Math.floor(remaining));
          }, 1000);
          return () => clearInterval(interval);
      } else {
          setTimeLeft(0);
      }
  }, [activeQuestion]);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const lastClosedQuestion = useMemo(() => 
    preguntas.filter(p => p.status === 'CERRADA' && p.asambleaId === selectedAsambleaId).slice(-1)[0]
  , [preguntas, selectedAsambleaId]);

  const targetQuestion = activeQuestion 
    ? activeQuestion 
    : (manualQuestionId ? preguntas.find(p => p.id === manualQuestionId) : lastClosedQuestion);

  const availableHistory = useMemo(() => 
    preguntas.filter(p => p.asambleaId === selectedAsambleaId && p.status !== 'PENDIENTE').sort((a, b) => b.id.localeCompare(a.id))
  , [preguntas, selectedAsambleaId]);
  
  const coefResults = targetQuestion ? calculateResults(targetQuestion.id, 'coeficiente') : [];
  const nominalResults = targetQuestion ? calculateResults(targetQuestion.id, 'nominal') : [];

  const coefData = useMemo(() => coefResults.map(r => ({
    ...r,
    displayLabel: `${r.value.toFixed(1)}%`
  })), [coefResults]);

  const nominalData = useMemo(() => nominalResults.map(r => ({
    ...r,
    displayLabel: `${r.absoluteValue}`
  })), [nominalResults]);

  const isQuorumCheck = targetQuestion?.esVerificacionQuorum;
  const quorumStats = useMemo(() => {
    if (!isQuorumCheck || !targetQuestion) return { confirmed: 0, rawCoef: 0 };
    const presentOption = coefData[0];
    const presentNominal = nominalData[0];
    return {
      confirmed: presentNominal ? presentNominal.absoluteValue : 0,
      rawCoef: presentOption ? presentOption.absoluteValue : 0
    };
  }, [coefData, nominalData, isQuorumCheck, targetQuestion]);

  const COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#94a3b8'];

  // Función de etiquetas para PieChart mejorada
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (!percent || percent <= 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="text-[12px] font-black pointer-events-none select-none"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  if (!selectedCopropiedadId) {
    return (
      <Layout title="Proyección de Resultados" onBackToHome={() => setView('home')}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-6">
          <div className="bg-slate-100 p-6 rounded-full text-slate-300">
            <Presentation size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 uppercase">Sin sesión de asamblea</h2>
            <p className="text-xs font-medium text-slate-500 max-w-xs">Debe iniciar sesión como administrador y seleccionar un edificio para proyectar resultados.</p>
          </div>
          <button onClick={() => setView('home')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Ir al Inicio</button>
        </div>
      </Layout>
    );
  }

  const renderCharts = () => {
    if (isQuorumCheck) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-8 p-8">
                 <div className="flex gap-12 w-full max-w-5xl justify-center">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl border-4 border-emerald-100 flex flex-col items-center justify-center text-center space-y-4 flex-1">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                           <CheckCircle size={48} />
                        </div>
                        <div>
                           <h3 className="text-6xl font-black text-slate-900">{quorumStats.confirmed}</h3>
                           <p className="text-sm font-black uppercase text-slate-400 tracking-widest mt-2">Asistentes Confirmados</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl border-4 border-indigo-100 flex flex-col items-center justify-center text-center space-y-4 flex-1">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                           <Building2 size={48} />
                        </div>
                        <div>
                           <h3 className="text-6xl font-black text-slate-900">{quorumStats.rawCoef.toFixed(3)}%</h3>
                           <p className="text-sm font-black uppercase text-slate-400 tracking-widest mt-2">Coeficiente Representado</p>
                        </div>
                    </div>
                 </div>

                 <div className="w-full max-w-4xl bg-slate-50 p-8 rounded-[32px] border border-slate-200">
                    <div className="flex justify-between items-end mb-3">
                       <span className="text-sm font-black uppercase text-slate-500">Progreso de Verificación</span>
                       <span className="text-2xl font-black text-slate-900">{quorumStats.rawCoef.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-8 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-1000 ease-out" 
                         style={{ width: `${Math.min(quorumStats.rawCoef, 100)}%` }}
                       ></div>
                    </div>
                 </div>
            </div>
        )
    }

    return (
        <div className={`grid grid-cols-1 ${isFocusMode ? 'lg:grid-cols-2 gap-8 h-full items-center px-12 pb-12' : 'lg:grid-cols-2 gap-4 sm:gap-6'}`}>
            <div className={`bg-white rounded-[32px] shadow-xl border border-slate-100 flex flex-col ${isFocusMode ? 'h-full p-8 border-2' : 'p-5 sm:p-8'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl"><Building2 size={24} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Voto por Coeficiente</h3>
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  {chartType === 'bar' ? (
                    <BarChart data={coefData} margin={{ top: 30, right: 10, left: 10, bottom: 20 }}>
                      <XAxis dataKey="label" fontSize={isFocusMode ? 12 : 9} fontWeight="900" dy={10} interval={0} tick={{fill: '#475569'}} />
                      <YAxis hide />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} isAnimationActive={false}>
                        {coefData.map((e, i) => <Cell key={i} fill={e.label === 'SIN VOTAR' ? '#94a3b8' : COLORS[i % COLORS.length]} />)}
                        <LabelList 
                           dataKey="displayLabel" 
                           position="top" 
                           fontSize={isFocusMode ? 18 : 11} 
                           fontWeight="900" 
                           offset={10} 
                           fill="#1e293b"
                        />
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie 
                        data={coefData} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false} 
                        label={renderCustomizedLabel} 
                        outerRadius="80%" 
                        dataKey="value" 
                        nameKey="label" 
                        isAnimationActive={false}
                      >
                        {coefData.map((e, i) => <Cell key={i} fill={e.label === 'SIN VOTAR' ? '#94a3b8' : COLORS[i % COLORS.length]} strokeWidth={3} stroke="#fff" />)}
                      </Pie>
                      <Legend wrapperStyle={{fontSize: isFocusMode ? '14px' : '9px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px'}} iconSize={16} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`bg-white rounded-[32px] shadow-xl border border-slate-100 flex flex-col ${isFocusMode ? 'h-full p-8 border-2' : 'p-5 sm:p-8'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl"><Users size={24} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Voto Nominal (Personas)</h3>
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  {chartType === 'bar' ? (
                    <BarChart data={nominalData} margin={{ top: 30, right: 10, left: 10, bottom: 20 }}>
                      <XAxis dataKey="label" fontSize={isFocusMode ? 12 : 9} fontWeight="900" dy={10} interval={0} tick={{fill: '#475569'}} />
                      <YAxis hide />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} isAnimationActive={false}>
                        {nominalData.map((e, i) => <Cell key={i} fill={e.label === 'SIN VOTAR' ? '#94a3b8' : COLORS[i % COLORS.length]} />)}
                        <LabelList 
                           dataKey="displayLabel" 
                           position="top" 
                           fontSize={isFocusMode ? 18 : 11} 
                           fontWeight="900" 
                           offset={10} 
                           fill="#1e293b"
                        />
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie 
                        data={nominalData} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false} 
                        label={renderCustomizedLabel} 
                        outerRadius="80%" 
                        dataKey="value" 
                        nameKey="label" 
                        isAnimationActive={false}
                      >
                        {nominalData.map((e, i) => <Cell key={i} fill={e.label === 'SIN VOTAR' ? '#94a3b8' : COLORS[i % COLORS.length]} strokeWidth={3} stroke="#fff" />)}
                      </Pie>
                      <Legend wrapperStyle={{fontSize: isFocusMode ? '14px' : '9px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px'}} iconSize={16} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
        </div>
    );
  };

  if (isFocusMode && targetQuestion) {
      return (
          <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-500">
              <div className="bg-white shadow-md px-8 py-6 flex justify-between items-start gap-8 shrink-0 border-b border-slate-200">
                  <div className="flex-1">
                     <div className="flex items-center gap-3 mb-2">
                        <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm ${
                           targetQuestion.status === 'ABIERTA' 
                             ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse' 
                             : 'bg-slate-200 text-slate-600 border border-slate-300'
                        }`}>
                           {targetQuestion.status === 'ABIERTA' ? 'VOTACIÓN EN VIVO' : 'RESULTADO FINAL'}
                        </span>
                     </div>
                     <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight uppercase line-clamp-3">
                        {targetQuestion.texto}
                     </h1>
                  </div>

                  <div className="flex items-center gap-6">
                      <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Quórum en Sala</p>
                          <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl font-black text-2xl shadow-lg border-2 border-slate-700">
                              {totalCoefAttendance.toFixed(3)}%
                          </div>
                      </div>

                      {targetQuestion.status === 'ABIERTA' && (
                          <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tiempo Restante</p>
                              <div className={`px-6 py-2 rounded-2xl font-black font-mono text-3xl shadow-lg border-2 flex items-center gap-3 ${timeLeft < 30 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-white text-indigo-600 border-indigo-100"}`}>
                                  <Clock size={24} /> {formatTime(timeLeft)}
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              <div className="flex-1 bg-slate-50 relative p-6 overflow-hidden">
                 {renderCharts()}
              </div>

              <button 
                onClick={() => setIsFocusMode(false)}
                className="absolute bottom-6 right-6 bg-slate-900/10 hover:bg-slate-900 text-slate-500 hover:text-white p-3 rounded-full transition-all backdrop-blur-sm z-50"
                title="Salir de Pantalla Completa"
              >
                  <Minimize2 size={24} />
              </button>
          </div>
      );
  }

  return (
    <Layout title={null} onBackToHome={() => setView('home')}>
      <div className="space-y-4 sm:space-y-8 py-2 sm:py-4">
        <div className="flex flex-col gap-6 no-print px-2">
            <div className="border-b-4 border-indigo-600 w-fit pb-1">
                 <h2 className="text-sm sm:text-base font-black text-slate-400 uppercase tracking-widest">
                    Proyectando: <span className="text-slate-600">{currentBuilding?.nombre}</span>
                 </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button 
                    onClick={() => setView('admin')}
                    className="bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all"
                >
                    <LayoutDashboard size={14} /> Regresar al Panel
                </button>

                <div className="bg-white border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <Users size={14} /> Quórum en Sala: {totalCoefAttendance.toFixed(3)}%
                </div>

                <div 
                    className="relative z-20" 
                    onMouseLeave={() => setIsHistoryOpen(false)}
                >
                    <button 
                        onMouseEnter={() => setIsHistoryOpen(true)}
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`bg-white border px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all ${isHistoryOpen ? 'border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                    >
                        <History size={14} /> 
                        {activeQuestion ? 'Votación En Curso' : 'Historial'}
                        <ChevronDown size={14} />
                    </button>
                    
                    {isHistoryOpen && !activeQuestion && (
                        <div 
                            className="absolute top-full left-0 pt-2 w-72" 
                            onMouseEnter={() => setIsHistoryOpen(true)}
                        >
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {availableHistory.length > 0 ? availableHistory.map(q => (
                                    <button 
                                        key={q.id}
                                        onClick={() => { setManualQuestionId(q.id); setIsHistoryOpen(false); }}
                                        className={`w-full text-left p-3 rounded-xl text-[9px] font-bold uppercase mb-1 transition-colors leading-tight ${targetQuestion?.id === q.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${q.status === 'CERRADA' ? 'bg-slate-300' : 'bg-emerald-400'}`}></span>
                                            <span className="line-clamp-2">{q.texto}</span>
                                        </div>
                                    </button>
                                )) : (
                                    <p className="p-4 text-[9px] text-slate-400 text-center font-bold uppercase">No hay historial disponible</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {targetQuestion && (
                    <button 
                        onClick={() => setIsFocusMode(true)}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Maximize2 size={14} /> Proyectar
                    </button>
                )}
            </div>
        </div>

        {targetQuestion ? (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 mt-8">
            <div className="text-center space-y-4 px-2 relative">
              
              {targetQuestion.status === 'ABIERTA' && (
                  <div className="absolute top-0 right-0 hidden sm:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl animate-in fade-in zoom-in">
                      <Clock size={16} className={timeLeft < 30 ? "text-red-400 animate-pulse" : "text-emerald-400"} />
                      <span className={`text-lg font-black font-mono tracking-widest ${timeLeft < 30 ? "text-red-400" : "text-white"}`}>
                          {formatTime(timeLeft)}
                      </span>
                  </div>
              )}

              <div className="flex justify-center items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                  targetQuestion.status === 'ABIERTA' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse' 
                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                }`}>
                  {targetQuestion.status === 'ABIERTA' ? 'VOTACIÓN EN VIVO' : 'RESULTADO FINAL'}
                </span>
                {manualQuestionId && targetQuestion.status === 'CERRADA' && (
                  <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                    VISUALIZANDO HISTORIAL
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 max-w-5xl mx-auto leading-tight uppercase drop-shadow-sm">
                {targetQuestion.texto}
              </h2>

              {targetQuestion.status === 'ABIERTA' && (
                  <div className="sm:hidden flex justify-center items-center gap-2 mt-2">
                       <Clock size={14} className="text-slate-400" />
                       <span className="text-sm font-black font-mono text-slate-600 tracking-widest">{formatTime(timeLeft)}</span>
                  </div>
              )}
            </div>

            {renderCharts()}
            
            {!isQuorumCheck && (
              <div className="flex justify-center bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto no-print mt-6">
                 <button onClick={() => setChartType('bar')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${chartType === 'bar' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Gráfico Barras</button>
                 <button onClick={() => setChartType('pie')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${chartType === 'pie' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Gráfico Torta</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-pulse px-4">
             <div className="bg-slate-100 p-5 rounded-full text-slate-200"><Building2 size={40} /></div>
             <div className="space-y-2 text-center">
               <h2 className="text-lg font-black text-slate-300 uppercase leading-tight tracking-tight">Sin votaciones para proyectar</h2>
               <p className="text-[10px] font-bold text-slate-300 uppercase">Esperando que el administrador inicie un punto</p>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
