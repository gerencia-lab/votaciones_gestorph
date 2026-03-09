import React, { useState, useEffect, useMemo } from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import {
  PlusCircle, BarChart, Edit2, Play, Square, X,
  Clock, ListPlus, ChevronDown, Trash2, CheckCircle2, Sparkles, RefreshCw, Database, Lock, Zap, ChevronUp, AlertCircle, ToggleLeft, ToggleRight,
  UserCheck, UserX, ArrowUpDown, GripVertical
} from 'lucide-react';
import { PlantillaPregunta, Pregunta } from '../../types.ts';

interface AdminVotacionesTabProps {
  setView?: (view: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin' | 'payments' | 'manual' | 'loyalty') => void;
}

export const AdminVotacionesTab: React.FC<AdminVotacionesTabProps> = ({ setView }) => {
  const {
    preguntas, asambleas, selectedAsambleaId, addQuestion, updateQuestion, openQuestion,
    closeQuestion, reopenQuestion, calculateResults, votos, plantillas,
    initializeDatabase, activeQuestion, asambleistas, unidades, reorderQuestions
  } = useAssembly();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // New State for Voted/Missing Modals
  const [viewingVotedFor, setViewingVotedFor] = useState<string | null>(null);
  const [viewingMissingFor, setViewingMissingFor] = useState<string | null>(null);

  // Estado ampliado para incluir esMultiple y opciones como array
  const [newQuestion, setNewQuestion] = useState<{
    texto: string;
    opciones: string[];
    tiempo: string;
    esMultiple: boolean;
  }>({ texto: '', opciones: ['', ''], tiempo: '2', esMultiple: false });

  const [showTemplatesAccordion, setShowTemplatesAccordion] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [reopenId, setReopenId] = useState<string | null>(null);
  const [reopenTime, setReopenTime] = useState('2');

  // Estado de Reordenamiento Drag & Drop
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [reorderList, setReorderList] = useState<Pregunta[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Estado de Ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    key: 'texto' | 'status' | 'createdAt';
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'asc' });

  const activeAsamblea = asambleas.find(a => a.id === selectedAsambleaId);
  const isFinished = activeAsamblea?.status === 'FINALIZADA';
  const isStarted = activeAsamblea?.status === 'EN_CURSO';

  const asambleaPreguntas = useMemo(() => {
    return preguntas
      .filter(p => p.asambleaId === selectedAsambleaId)
      .sort((a, b) => {
        // Si ambos tienen orden definido, respetar ese orden primero
        const aOrden = a.orden ?? Infinity;
        const bOrden = b.orden ?? Infinity;
        if (aOrden !== bOrden) return aOrden - bOrden;

        // Fallback al sortConfig del usuario
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'texto':
            aValue = a.texto.toLowerCase();
            bValue = b.texto.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'createdAt':
          default:
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
        }

        if (aValue === bValue) return 0;
        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [preguntas, selectedAsambleaId, sortConfig]);
  const isVotingInProgress = asambleaPreguntas.some(p => p.status === 'ABIERTA');

  useEffect(() => {
    if (!activeQuestion || !activeQuestion.startedAt) return;
    const interval = setInterval(() => {
      const startTime = new Date(activeQuestion.startedAt!).getTime();
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      if (elapsed >= activeQuestion.tiempoRestante) {
        closeQuestion(activeQuestion.id);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuestion, closeQuestion]);

  const handleAddOrUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinished) return;

    const ops = newQuestion.opciones.map(o => o.trim()).filter(o => o !== '');
    if (ops.length < 1) return alert("Debe incluir al menos una opción.");

    const seconds = parseInt(newQuestion.tiempo) * 60;

    if (editingQuestionId) {
      await updateQuestion(editingQuestionId, newQuestion.texto, ops, seconds, newQuestion.esMultiple);
    } else {
      await addQuestion(newQuestion.texto, ops, seconds, newQuestion.esMultiple);
    }

    setIsModalOpen(false);
    setEditingQuestionId(null);
    setNewQuestion({ texto: '', opciones: ['', ''], tiempo: '2', esMultiple: false });
    setShowTemplatesAccordion(false);
  };

  const handleEditClick = (p: Pregunta) => {
    if (isFinished) return;
    setEditingQuestionId(p.id);
    setNewQuestion({
      texto: p.texto,
      opciones: p.opciones.map(o => o.texto),
      tiempo: String(Math.ceil(p.tiempoRestante / 60)),
      esMultiple: p.esMultiple || false
    });
    setIsModalOpen(true);
    setShowTemplatesAccordion(false);
  };

  const useTemplate = (template: PlantillaPregunta) => {
    if (isFinished) return;
    setNewQuestion({
      texto: template.texto,
      opciones: template.opcionesSugeridas.split(',').map(o => o.trim()),
      tiempo: String(Math.ceil(template.tiempoSugerido / 60)),
      esMultiple: false
    });
    setShowTemplatesAccordion(false);
  };

  const addOption = () => {
    setNewQuestion(prev => ({ ...prev, opciones: [...prev.opciones, ''] }));
  };

  const removeOption = (index: number) => {
    if (newQuestion.opciones.length <= 1) return;
    const newOps = [...newQuestion.opciones];
    newOps.splice(index, 1);
    setNewQuestion(prev => ({ ...prev, opciones: newOps }));
  };

  const updateOption = (index: number, value: string) => {
    const newOps = [...newQuestion.opciones];
    newOps[index] = value;
    setNewQuestion(prev => ({ ...prev, opciones: newOps }));
  };

  const handleReopen = async () => {
    if (!reopenId || isFinished || !isStarted) return;
    const seconds = parseInt(reopenTime) * 60;
    await reopenQuestion(reopenId, seconds);
    if (setView) setView('projection');
    setReopenId(null);
  };

  const handleInitDb = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFinished) return;
    setIsInitializing(true);
    try {
      await initializeDatabase();
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  };

  // --- LOGIC FOR VOTING STATUS LISTS ---
  const getVotedUnits = (questionId: string) => {
    const questionVotes = votos.filter(v => v.preguntaId === questionId);
    const votedAsmIds = new Set(questionVotes.map(v => v.asambleistaId));

    // Find units represented by voted asambleistas
    const votedUnits: any[] = [];
    votedAsmIds.forEach(asmId => {
      const asm = asambleistas.find(a => a.id === asmId);
      if (asm && asm.unidadesIds) {
        asm.unidadesIds.forEach(uid => {
          const unit = unidades.find(u => u.id === uid);
          if (unit) votedUnits.push({ ...unit, votedBy: asm.nombre });
        });
      }
    });
    return votedUnits;
  };

  const getMissingUnits = (questionId: string) => {
    const questionVotes = votos.filter(v => v.preguntaId === questionId);
    const votedAsmIds = new Set(questionVotes.map(v => v.asambleistaId));

    // Find present asambleistas who HAVEN'T voted
    const missingAsm = asambleistas.filter(a =>
      a.asambleaId === selectedAsambleaId &&
      a.asistenciaConfirmada &&
      !votedAsmIds.has(a.id)
    );

    const missingUnits: any[] = [];
    missingAsm.forEach(asm => {
      if (asm.unidadesIds) {
        asm.unidadesIds.forEach(uid => {
          const unit = unidades.find(u => u.id === uid);
          if (unit) missingUnits.push({ ...unit, representedBy: asm.nombre });
        });
      }
    });
    return missingUnits;
  };

  const votedList = useMemo(() => viewingVotedFor ? getVotedUnits(viewingVotedFor) : [], [viewingVotedFor, votos, asambleistas, unidades]);
  const missingList = useMemo(() => viewingMissingFor ? getMissingUnits(viewingMissingFor) : [], [viewingMissingFor, votos, asambleistas, unidades]);

  const handleSort = (key: 'texto' | 'status' | 'createdAt') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- DRAG & DROP HANDLERS ---
  const openReorderModal = () => {
    setReorderList([...asambleaPreguntas]);
    setIsReorderOpen(true);
  };

  const handleDragStart = (idx: number, e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...reorderList];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setReorderList(updated);
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      await reorderQuestions(reorderList.map(p => p.id));
      setIsReorderOpen(false);
    } catch (err) {
      console.error('Error saving order', err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const SortButton = ({ column, label }: { column: 'texto' | 'status' | 'createdAt', label: string }) => {
    const isActive = sortConfig.key === column;
    return (
      <button
        onClick={() => handleSort(column)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
      >
        {label}
        {isActive ? (
          sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ArrowUpDown size={12} className="opacity-30" />
        )}
      </button>
    );
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300 no-print">

      {isFinished && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 animate-in slide-in-from-top-2">
          <Lock size={20} className="shrink-0" />
          <div>
            <h4 className="font-black text-xs uppercase">Votaciones Cerradas por Auditoría</h4>
            <p className="text-[10px] font-medium opacity-80">La asamblea ha finalizado. No es posible crear, editar ni reabrir preguntas.</p>
          </div>
        </div>
      )}

      {!isStarted && !isFinished && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 text-indigo-800 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <h4 className="font-black text-xs uppercase">Modo de Planificación</h4>
            <p className="text-[10px] font-medium opacity-80">Puede crear y editar las preguntas, pero <strong>no podrá activarlas</strong> hasta que inicie la asamblea (Botón "Abrir Asamblea" en panel superior).</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase">Orden del Día</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
              {asambleaPreguntas.length} puntos creados
            </p>
          </div>

          {/* Ordenamiento UI */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <span className="text-[8px] font-black text-slate-400 uppercase px-2">Ordenar:</span>
            <SortButton column="createdAt" label="Fecha" />
            <SortButton column="texto" label="A-Z" />
            <SortButton column="status" label="Estado" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {asambleaPreguntas.length > 1 && !isFinished && (
            <button
              onClick={openReorderModal}
              className="px-3 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase flex items-center gap-1.5 bg-slate-700 text-white shadow-lg hover:bg-slate-800 hover:scale-105 transition-all"
            >
              <ArrowUpDown size={14} /> Ordenar
            </button>
          )}
          <button
            onClick={() => {
              if (isFinished) return;
              if (isVotingInProgress) {
                alert("Hay una votación en curso. Debe cerrarla antes de crear una nueva.");
                return;
              }
              setEditingQuestionId(null);
              setNewQuestion({ texto: '', opciones: ['', ''], tiempo: '2', esMultiple: false });
              setShowTemplatesAccordion(false);
              setIsModalOpen(true);
            }}
            disabled={isFinished}
            className={`px-4 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase flex items-center gap-2 shadow-xl hover:scale-105 transition-transform ${isFinished ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70' : (isVotingInProgress ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white')}`}
          >
            {isFinished ? <Lock size={14} /> : (isVotingInProgress ? <Lock size={14} /> : <PlusCircle size={14} />)}
            {isFinished ? 'Bloqueado' : 'Crear Votación'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {asambleaPreguntas.map((p) => {
          const results = calculateResults(p.id, 'coeficiente');
          // Para mostrar participación aproximada, contar votos unicos
          // Guard votos access to prevent crash on empty context
          const uniqueVotes = new Set((votos || []).filter(v => v.preguntaId === p.id).map(v => v.asambleistaId)).size;
          const isThisOpen = p.status === 'ABIERTA';

          return (
            <div key={p.id} className={`bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 border-2 transition-all ${isThisOpen ? 'border-indigo-600 shadow-xl shadow-indigo-50' : 'border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between items-start gap-4 mb-4 sm:mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${isThisOpen ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                      p.status === 'CERRADA' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {p.status}
                    </span>
                    {p.esMultiple && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">Múltiple</span>}
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      #{p.id.slice(-4)}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-base font-black text-slate-900 leading-tight uppercase">{p.texto}</h3>
                </div>

                <div className="flex gap-1.5 items-center">
                  {/* MODIFIED: Add Status Buttons always visible (or at least when open/closed) */}
                  <button
                    onClick={() => setViewingVotedFor(p.id)}
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Ver quiénes votaron"
                  >
                    <UserCheck size={16} />
                  </button>
                  <button
                    onClick={() => setViewingMissingFor(p.id)}
                    className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Ver quiénes faltan"
                  >
                    <UserX size={16} />
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>

                  {p.status === 'PENDIENTE' && (
                    <>
                      <button
                        onClick={() => handleEditClick(p)}
                        disabled={isFinished}
                        className={`p-2.5 rounded-xl transition-colors ${isFinished ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          openQuestion(p.id);
                          if (setView) setView('projection');
                        }}
                        disabled={!isStarted || isVotingInProgress || isFinished}
                        className={`p-2.5 rounded-xl transition-colors shadow-lg ${(!isStarted || isVotingInProgress || isFinished) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        title={!isStarted ? "Debe Iniciar la Asamblea primero" : (isVotingInProgress ? "Ya hay una votación activa" : "Abrir Votación")}
                      >
                        <Play size={16} fill="currentColor" />
                      </button>
                    </>
                  )}
                  {p.status === 'ABIERTA' && (
                    <button
                      onClick={() => closeQuestion(p.id)}
                      disabled={isFinished}
                      className={`p-2.5 rounded-xl transition-colors shadow-lg ${isFinished ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                      title="Cerrar Votación"
                    >
                      <Square size={16} fill="currentColor" />
                    </button>
                  )}
                  {p.status === 'CERRADA' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(p)}
                        disabled={isFinished}
                        className={`p-2.5 rounded-xl transition-colors ${isFinished ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title="Corregir Pregunta"
                      >
                        <Edit2 size={16} />
                      </button>

                      {reopenId === p.id && !isFinished && isStarted ? (
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 animate-in zoom-in">
                          <input
                            type="number"
                            value={reopenTime}
                            onChange={e => setReopenTime(e.target.value)}
                            className="w-12 text-center bg-white rounded-lg text-xs font-bold border border-slate-200 py-1"
                            placeholder="Min"
                          />
                          <button onClick={handleReopen} className="p-1.5 bg-indigo-600 text-white rounded-lg ml-1 hover:bg-indigo-700"><CheckCircle2 size={14} /></button>
                          <button onClick={() => setReopenId(null)} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setReopenId(p.id); setReopenTime('2'); }}
                            disabled={!isStarted || isVotingInProgress || isFinished}
                            className={`p-2.5 rounded-xl transition-colors ${(!isStarted || isVotingInProgress || isFinished) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                            title={!isStarted ? "Debe Iniciar la Asamblea primero" : (isVotingInProgress ? "Acción no disponible" : "Reabrir Votación")}
                          >
                            <RefreshCw size={16} />
                          </button>
                          <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl border border-slate-100">
                            <CheckCircle2 size={16} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(p.status === 'ABIERTA' || p.status === 'CERRADA') && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Participación: {uniqueVotes} personas</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {results.map((res, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-black uppercase">
                          <span className="text-slate-700 truncate max-w-[70%]">{res.label}</span>
                          <span className="text-indigo-600">{res.value.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${res.label === 'SIN VOTAR' ? 'bg-slate-300' : (p.status === 'ABIERTA' ? 'bg-indigo-500' : 'bg-slate-500')
                              }`}
                            style={{ width: `${res.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {asambleaPreguntas.length === 0 && (
          <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 mx-2">
            <ListPlus className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest px-8">No hay puntos de votación creados</p>
          </div>
        )}
      </div>

      {/* --- MODAL FOR VOTED/MISSING LISTS --- */}
      {(viewingVotedFor || viewingMissingFor) && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b flex justify-between items-center shrink-0">
              <h3 className={`font-black text-sm uppercase tracking-wide flex items-center gap-2 ${viewingVotedFor ? 'text-emerald-600' : 'text-amber-600'}`}>
                {viewingVotedFor ? <UserCheck size={18} /> : <UserX size={18} />}
                {viewingVotedFor ? 'Unidades que Votaron' : 'Faltan por Votar (En Sala)'}
              </h3>
              <button onClick={() => { setViewingVotedFor(null); setViewingMissingFor(null); }} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-0">
              {(viewingVotedFor ? votedList : missingList).length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {(viewingVotedFor ? votedList : missingList).map((u, i) => (
                    <div key={i} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{u.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{u.propietario}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-600 text-xs">{Number(u.coeficiente || u.coefficient || 0).toFixed(3)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  <p className="text-xs font-medium">No se encontraron registros.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-slate-50 shrink-0 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total: {(viewingVotedFor ? votedList : missingList).length} Unidades
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE REORDENAMIENTO DRAG & DROP --- */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b flex justify-between items-center shrink-0">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <ArrowUpDown size={18} className="text-indigo-600" />
                Ordenar Puntos del Día
              </h3>
              <button onClick={() => setIsReorderOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-4 space-y-1">
              {reorderList.map((p, idx) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(idx, e)}
                  onDragOver={(e) => handleDragOver(idx, e)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all cursor-grab active:cursor-grabbing select-none ${dragIdx === idx ? 'opacity-40 scale-95 border-indigo-300 bg-indigo-50' :
                    overIdx === idx ? 'border-indigo-400 bg-indigo-50 shadow-lg' :
                      'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                >
                  <GripVertical size={16} className="text-slate-300 shrink-0" />
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-xs font-bold text-slate-800 truncate">{p.texto}</span>
                  <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest shrink-0 ${p.status === 'ABIERTA' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'CERRADA' ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-slate-50 shrink-0 flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{reorderList.length} puntos</p>
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingOrder ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Guardar Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && !isFinished && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-[32px] sm:rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                {editingQuestionId ? 'EDITAR VOTACIÓN' : 'NUEVA VOTACIÓN'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto custom-scrollbar">

              {/* --- ACORDEÓN DE PLANTILLAS (RESTAURADO) --- */}
              {!editingQuestionId && (
                <div className="bg-indigo-50 rounded-2xl overflow-hidden border border-indigo-100">
                  <button
                    type="button"
                    onClick={() => setShowTemplatesAccordion(!showTemplatesAccordion)}
                    className="w-full px-5 py-4 flex items-center justify-between text-indigo-700 hover:bg-indigo-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">Preguntas Frecuentes</span>
                    </div>
                    {showTemplatesAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showTemplatesAccordion && (
                    <div className="border-t border-indigo-100 max-h-48 overflow-y-auto custom-scrollbar bg-white">
                      {plantillas.length > 0 ? (
                        plantillas.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => useTemplate(t)}
                            className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-start gap-3 group transition-colors"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${(t.color || 'bg-slate-400').replace('bg-', 'bg-')}`}></div>
                            <div>
                              <p className="text-xs font-black uppercase text-slate-700 group-hover:text-indigo-600">{t.titulo}</p>
                              <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-500">{t.texto}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-[9px] text-slate-400 mb-2">No se encontraron plantillas</p>
                          <button onClick={handleInitDb} className="text-[9px] font-bold text-indigo-600 flex items-center justify-center gap-1 mx-auto hover:underline">
                            {isInitializing ? <RefreshCw size={10} className="animate-spin" /> : <Database size={10} />} Cargar Default
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleAddOrUpdateQuestion} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Pregunta o Proposición</label>
                  <textarea
                    required
                    placeholder="Ej: ¿Aprueba los estados financieros 2023?"
                    value={newQuestion.texto}
                    onChange={e => setNewQuestion({ ...newQuestion, texto: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm min-h-[100px] focus:outline-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black uppercase text-slate-400">Opciones de Respuesta</label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <PlusCircle size={12} /> Añadir Opción
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 max-h-60 overflow-y-auto px-1 py-1 custom-scrollbar">
                    {newQuestion.opciones.map((opcion, index) => (
                      <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                        <div className="flex-1 relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                            {index + 1}
                          </div>
                          <input
                            required
                            placeholder={`Opción ${index + 1}`}
                            value={opcion}
                            onChange={e => updateOption(index, e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:border-indigo-600 transition-colors shadow-sm"
                          />
                        </div>
                        {newQuestion.opciones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar opción"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 pl-2 italic">Nota: El sistema calculará automáticamente los "Sin Votar".</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Tiempo (Minutos)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="number"
                        value={newQuestion.tiempo}
                        onChange={e => setNewQuestion({ ...newQuestion, tiempo: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Configuración</label>
                    <button
                      type="button"
                      onClick={() => setNewQuestion({ ...newQuestion, esMultiple: !newQuestion.esMultiple })}
                      className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${newQuestion.esMultiple ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      <span className="text-sm font-bold uppercase">Selección Múltiple</span>
                      {newQuestion.esMultiple ? <ToggleRight size={20} className="text-indigo-600" /> : <ToggleLeft size={20} className="text-slate-300" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                  {editingQuestionId ? 'Actualizar Votación' : 'Publicar Votación'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
