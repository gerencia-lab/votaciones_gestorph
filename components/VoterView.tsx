
import React, { useState, useMemo, useEffect } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Layout } from './Layout.tsx';
import {
  CheckCircle, Info, LogOut, Clock, History, BarChart3,
  ChevronDown, UserCheck, AlertCircle, Loader2, PlayCircle, Lock,
  Vote, Hand, CheckSquare, Circle, Briefcase, Building2, Cloud, CloudOff, Home
} from 'lucide-react';

interface VoterViewProps {
  setView: (view: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin') => void;
}

export const VoterView: React.FC<VoterViewProps> = ({ setView }) => {
  const {
    currentUser, activeQuestion, sessionStatus, logout,
    submitVote, votos, getVoterCoefficient, getVoterUnidades,
    asambleas, selectedAsambleaId, preguntas, calculateResults,
    copropiedades, isDbReady
  } = useAssembly();

  const [activeTab, setActiveTab] = useState<'vote' | 'history'>('vote');
  const [isVoting, setIsVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Estado para la cuenta regresiva de cierre de sesión
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  // Seguridad: Redirigir si no hay usuario
  useEffect(() => {
    if (!currentUser) {
      setView('home');
    }
  }, [currentUser, setView]);

  // RESET de selección cuando cambia la pregunta
  useEffect(() => {
    setSelectedOptions([]);
  }, [activeQuestion?.id]);

  // LOGICA DE CIERRE AUTOMÁTICO DE SESIÓN AL FINALIZAR ASAMBLEA
  useEffect(() => {
    if (sessionStatus === 'FINALIZADA' && currentUser && logoutCountdown === null) {
      // Iniciamos cuenta regresiva de 5 segundos para cerrar sesión
      setLogoutCountdown(5);
    }
  }, [sessionStatus, currentUser, logoutCountdown]);

  useEffect(() => {
    let timer: any;
    if (logoutCountdown !== null && logoutCountdown > 0) {
      timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
    } else if (logoutCountdown === 0) {
      logout();
      setView('home');
    }
    return () => clearTimeout(timer);
  }, [logoutCountdown, logout, setView]);

  const activeAsamblea = asambleas.find(as => as.id === selectedAsambleaId);
  const activeCopropiedad = copropiedades.find(c => c.id === currentUser?.copropiedadId);
  const myCoefficient = getVoterCoefficient(currentUser);
  const myUnits = getVoterUnidades(currentUser);

  const alreadyVoted = activeQuestion
    ? votos.some(v => v.preguntaId === activeQuestion.id && v.asambleistaId === currentUser?.id)
    : false;

  const historyQuestions = useMemo(() =>
    preguntas
      .filter(p => p.asambleaId === selectedAsambleaId && p.status === 'CERRADA')
      .sort((a, b) => {
        const timeA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const timeB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return timeB - timeA;
      })
    , [preguntas, selectedAsambleaId]);

  const lastClosedQuestion = historyQuestions[0];

  const handleToggleOption = (opcId: string) => {
    if (!activeQuestion) return;
    if (activeQuestion.esMultiple) {
      setSelectedOptions(prev => prev.includes(opcId) ? prev.filter(id => id !== opcId) : [...prev, opcId]);
    } else {
      setSelectedOptions([opcId]);
    }
  };

  const handleVote = async () => {
    if (!activeQuestion || selectedOptions.length === 0 || !currentUser || isVoting) return;
    setIsVoting(true);
    try {
      await submitVote(activeQuestion.id, currentUser.id, selectedOptions);
      setSelectedOptions([]);
    } finally {
      setIsVoting(false);
    }
  };

  const handleQuorumConfirm = async () => {
    if (!activeQuestion || !activeQuestion.opciones[0] || !currentUser || isVoting) return;
    setIsVoting(true);
    try {
      await submitVote(activeQuestion.id, currentUser.id, [activeQuestion.opciones[0].id]);
    } finally {
      setIsVoting(false);
    }
  };

  if (!currentUser) return null;

  // PANTALLA DE CIERRE AUTOMÁTICO (ASAMBLEA FINALIZADA)
  if (sessionStatus === 'FINALIZADA') {
    return (
      <Layout title="Sesión Terminada" hideHeaderStatus={true} showBottomStatus={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-50">
            <CheckCircle size={48} />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">Asamblea Finalizada</h2>
            <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">
              La administración ha dado por concluida la sesión. Gracias por su valiosa participación.
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-[32px] w-full max-w-xs text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Home size={40} /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Cerrando Sesión en</p>
            <div className="text-6xl font-black">{logoutCountdown}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Redirigiendo al portal principal...</p>
          </div>

          <button
            onClick={() => { logout(); setView('home'); }}
            className="text-indigo-600 font-black uppercase text-xs hover:underline flex items-center gap-2"
          >
            Salir ahora &rarr;
          </button>
        </div>
      </Layout>
    );
  }

  // MODAL DE QUÓRUM
  if (activeQuestion?.esVerificacionQuorum && !alreadyVoted) {
    return (
      <Layout title={`${activeAsamblea?.nombre || 'Mi Asamblea'}`} onBackToHome={() => setView('home')} hideHeaderStatus={true} showBottomStatus={true}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in zoom-in duration-300">
          <div className="text-center space-y-2">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-pulse shadow-xl shadow-emerald-50">
              <UserCheck size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase pt-4">Control de Asistencia</h2>
            {activeCopropiedad && (
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mx-auto w-fit">
                {activeCopropiedad.nombre}
              </p>
            )}
            <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">
              El administrador requiere que confirme su presencia en la sala para el cálculo del quórum.
            </p>
          </div>

          <button
            onClick={handleQuorumConfirm}
            disabled={isVoting}
            className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white p-8 rounded-[40px] shadow-2xl shadow-emerald-200 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            {isVoting ? <Loader2 size={48} className="mx-auto animate-spin relative z-10" /> : <Hand size={48} className="mx-auto group-hover:-translate-y-2 transition-transform relative z-10" />}
            <p className="mt-4 font-black text-xl uppercase tracking-widest relative z-10">{isVoting ? 'CONFIRMANDO...' : '¡ESTOY PRESENTE!'}</p>
          </button>

          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Unidades Representadas</p>
            <p className="font-bold text-slate-700 text-sm mt-1">{myUnits.map(u => u.nombre).join(', ')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${activeAsamblea?.nombre || 'Mi Asamblea'}`} onBackToHome={() => setView('home')} hideHeaderStatus={true} showBottomStatus={true}>
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">

        <div className="bg-white p-5 rounded-[24px] sm:rounded-[32px] border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className={`p-2.5 rounded-xl shadow-lg shrink-0 ${currentUser.asistenciaConfirmada ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
              <UserCheck size={20} />
            </div>
            <div className="truncate flex-1">
              {activeCopropiedad && (
                <div className="flex items-center gap-1 mb-1">
                  <Building2 size={10} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase truncate max-w-[250px]">{activeCopropiedad.nombre}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-black text-slate-900 uppercase leading-none text-lg sm:text-2xl truncate max-w-[200px]">{currentUser.nombre}</h3>
                {currentUser.esApoderado && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-200 shrink-0 flex items-center gap-1">
                    <Briefcase size={8} /> Apoderado
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Poder de Voto: <span className="text-indigo-600 font-black text-sm">{(myCoefficient || 0).toFixed(3)}%</span>
              </p>
            </div>
          </div>
          <button onClick={logout} className="w-full sm:w-auto text-xs font-black text-slate-400 uppercase flex items-center justify-center gap-1 hover:text-red-500 transition-colors py-2 sm:py-0 border-t sm:border-t-0 border-slate-50">
            <LogOut size={12} /> Salir
          </button>
        </div>

        <div className="flex p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'vote' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Vote size={14} /> Votación Activa
            {activeQuestion && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <History size={14} /> Historial
          </button>
        </div>

        {activeTab === 'vote' && (
          <div className="animate-in slide-in-from-left-4 duration-300 space-y-4">
            {sessionStatus === 'PROGRAMADA' && (
              <div className="bg-white p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 animate-pulse">
                  <Clock size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase leading-none">Esperando Inicio</h2>
                <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">
                  La asamblea aún no ha sido activada por el administrador.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}

            {sessionStatus === 'EN_CURSO' && (
              <div className="space-y-4 sm:space-y-6">
                {activeQuestion ? (
                  <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border-2 border-indigo-600 shadow-2xl shadow-indigo-100 animate-in zoom-in duration-300">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            Votación Abierta
                          </span>
                        </div>
                        {activeQuestion.esMultiple && (
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded w-fit">Selección Múltiple</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[11px] font-black uppercase">En Vivo</span>
                      </div>
                    </div>

                    <h2 className="text-lg sm:text-3xl font-black text-slate-900 uppercase leading-tight mb-6 sm:mb-8 break-words">
                      {activeQuestion.texto}
                    </h2>

                    {alreadyVoted ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-3">
                        <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
                          <CheckCircle size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-emerald-900 uppercase text-sm">
                            ¡Voto Registrado!
                          </h4>
                          <p className="text-xs font-bold text-emerald-600 mt-1 uppercase">Su participación ha sido procesada correctamente.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {activeQuestion.opciones.map(opc => {
                          const isSelected = selectedOptions.includes(opc.id);
                          return (
                            <button
                              key={opc.id}
                              onClick={() => handleToggleOption(opc.id)}
                              className={`w-full p-4 rounded-xl border-2 font-black uppercase text-left transition-all flex justify-between items-center group text-sm sm:text-lg ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-1' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-white'}`}
                            >
                              <span className="truncate pr-2">{opc.texto}</span>
                              {isSelected ? (activeQuestion.esMultiple ? <CheckSquare size={18} className="shrink-0" /> : <CheckCircle size={18} className="shrink-0" />) : (activeQuestion.esMultiple ? <CheckSquare size={18} className="shrink-0 opacity-30" /> : <Circle size={18} className="shrink-0 opacity-30" />)}
                            </button>
                          );
                        })}

                        <button
                          onClick={handleVote}
                          disabled={selectedOptions.length === 0 || isVoting}
                          className="w-full mt-4 sm:mt-6 bg-slate-900 text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-[0.1em] shadow-xl hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                        >
                          {isVoting ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                          {isVoting ? 'ENVIANDO...' : 'ENVIAR MI VOTO'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lastClosedQuestion && (
                      <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-red-50 text-red-500 p-2.5 rounded-xl shrink-0">
                            <Lock size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 uppercase leading-none">Votación Cerrada</h3>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase leading-snug break-words">{lastClosedQuestion.texto}</p>
                            <button onClick={() => setActiveTab('history')} className="mt-2 text-xs font-black text-indigo-600 uppercase hover:underline">Ver Resultados &rarr;</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 p-10 sm:p-12 rounded-[32px] sm:rounded-[40px] border border-slate-100 text-center space-y-3 shadow-inner">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                        <Clock size={24} />
                      </div>
                      <h3 className="font-black text-slate-400 uppercase text-base sm:text-xl">Sesión Activa</h3>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">Esperando que el administrador publique el siguiente punto del orden del día.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {historyQuestions.length === 0 ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-100 text-center">
                <History className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aún no hay resultados históricos</p>
              </div>
            ) : (
              historyQuestions.map(q => {
                const results = calculateResults(q.id, 'coeficiente');
                return (
                  <div key={q.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase leading-tight pr-4 break-words">{q.texto}</h4>
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-black uppercase shrink-0">Cerrada</span>
                    </div>
                    <div className="space-y-3">
                      {results.map((res, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-black uppercase">
                            <span className="text-slate-600 truncate max-w-[70%]">{res.label}</span>
                            <span className="text-indigo-600">{res.value.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${res.value}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'vote' && (
          <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 ml-2">
              <BarChart3 size={14} className="text-slate-400" />
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mis Unidades Representadas</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {myUnits.map(unit => (
                <div key={unit.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                  {currentUser.esApoderado && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>}
                  <div className="flex justify-between items-start pl-2">
                    <div className="overflow-hidden">
                      <p className="font-black text-slate-800 uppercase text-sm truncate">{unit.nombre}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Prop:</span> {unit.propietario}
                      </p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-black shrink-0 ml-2">
                      {(unit.coeficiente || unit.coefficient || 0).toFixed(3)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
