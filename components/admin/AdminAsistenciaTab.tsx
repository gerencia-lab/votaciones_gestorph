
import React, { useState, useMemo } from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import { Search, QrCode, X, Printer, Loader2, UserPlus, Ticket, CheckSquare, Square, LogOut, CheckCircle2, Mail, Key, Lock, AlertTriangle, Calculator, Scissors, UserCog, Trash2, Eraser, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { Asambleista, Unidad } from '../../types.ts';
import { PRODUCTION_DOMAIN } from '../../constants.tsx';

export const AdminAsistenciaTab: React.FC<any> = () => {
  const {
    unidades, asambleistas, selectedCopropiedadId, selectedAsambleaId, toggleAttendance,
    getAsambleistaByUnit, registerProxy, copropiedades, asambleas, generateMassCredentials, clearMassCredentials,
    updateBatchAttendance, addAsambleista, addProxyUnits, unlinkProxyUnits, deleteAsambleista
  } = useAssembly();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForQR, setSelectedForQR] = useState<any | null>(null);
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
  const [isMassPrintOpen, setIsMassPrintOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creatingTokenId, setCreatingTokenId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [selectedAsmIds, setSelectedAsmIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [proxyForm, setProxyForm] = useState({ nombre: '', documento: '' });
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [unitSearch, setUnitSearch] = useState('');

  // Estados de Ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    key: 'nombre' | 'propietario' | 'coeficiente' | 'asistencia' | 'tipo';
    direction: 'asc' | 'desc' | null;
  }>({ key: 'nombre', direction: 'asc' });

  const [editingProxy, setEditingProxy] = useState<Asambleista | null>(null);

  const currentUnidades = unidades.filter(u => u.copropiedadId === selectedCopropiedadId);
  const activeCopropiedad = copropiedades.find(cp => cp.id === selectedCopropiedadId);
  const activeAsamblea = asambleas.find(as => as.id === selectedAsambleaId);

  // Flag de Control de Auditoría
  const isFinished = activeAsamblea?.status === 'FINALIZADA';

  // Filtrar asambleístas válidos (que tengan unidades existentes) para evitar fantasmas
  const currentAsambleistas = useMemo(() => {
    return asambleistas.filter(a => {
      if (a.asambleaId !== selectedAsambleaId) return false;
      // Verificar que al menos una unidad del asambleista exista en la base de datos actual
      const hasValidUnits = a.unidadesIds.some(uid => unidades.some(u => u.id === uid));
      return hasValidUnits;
    });
  }, [asambleistas, selectedAsambleaId, unidades]);

  const filteredUnidades = useMemo(() => {
    let result = currentUnidades.filter(u =>
      (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.propietario || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        const asmA = getAsambleistaByUnit(a.id);
        const asmB = getAsambleistaByUnit(b.id);

        switch (sortConfig.key) {
          case 'nombre':
            aValue = a.nombre;
            bValue = b.nombre;
            break;
          case 'propietario':
            aValue = asmA && asmA.esApoderado ? asmA.nombre : a.propietario;
            bValue = asmB && asmB.esApoderado ? asmB.nombre : b.propietario;
            break;
          case 'coeficiente':
            aValue = a.coeficiente || a.coefficient || 0;
            bValue = b.coeficiente || b.coefficient || 0;
            break;
          case 'asistencia':
            aValue = asmA?.asistenciaConfirmada ? 1 : 0;
            bValue = asmB?.asistenciaConfirmada ? 1 : 0;
            break;
          case 'tipo':
            aValue = asmA ? (asmA.esApoderado ? 1 : 2) : 3;
            bValue = asmB ? (asmB.esApoderado ? 1 : 2) : 3;
            break;
          default:
            aValue = a.nombre;
            bValue = b.nombre;
        }

        if (aValue === bValue) return 0;
        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return result;
  }, [currentUnidades, searchTerm, sortConfig, getAsambleistaByUnit]);

  // Cálculo del total de coeficientes en SALA (Agregado para el Footer)
  const totalInSalaCoef = useMemo(() => {
    return currentUnidades.reduce((acc, u) => {
      const asm = getAsambleistaByUnit(u.id);
      return asm?.asistenciaConfirmada ? acc + (u.coeficiente || u.coefficient || 0) : acc;
    }, 0);
  }, [currentUnidades, getAsambleistaByUnit]);

  const totalPossibleCoef = useMemo(() => {
    return currentUnidades.reduce((acc, u) => acc + (u.coeficiente || u.coefficient || 0), 0);
  }, [currentUnidades]);

  // Calcular IDs de unidades que ya están asignadas a OTROS apoderados para excluirlas
  const excludedUnitIds = useMemo(() => {
    const ids = new Set<string>();
    currentAsambleistas.forEach(asm => {
      // Si es apoderado y NO es el que estamos editando actualmente
      if (asm.esApoderado && asm.id !== editingProxy?.id) {
        asm.unidadesIds.forEach(id => ids.add(id));
      }
    });
    return ids;
  }, [currentAsambleistas, editingProxy]);

  const availableUnitsForProxy = currentUnidades.filter(u =>
    !excludedUnitIds.has(u.id) && // Ocultar unidades ya tomadas por otros apoderados
    ((u.nombre || '').toLowerCase().includes(unitSearch.toLowerCase()) ||
      (u.propietario || '').toLowerCase().includes(unitSearch.toLowerCase()))
  );

  const visibleAsambleistaIds = useMemo(() => {
    return filteredUnidades
      .map(u => getAsambleistaByUnit(u.id))
      .filter(a => a !== undefined)
      .map(a => a!.id);
  }, [filteredUnidades, getAsambleistaByUnit]);

  const areAllSelected = visibleAsambleistaIds.length > 0 && visibleAsambleistaIds.every(id => selectedAsmIds.includes(id));

  // Helper para determinar la URL del QR
  const getQrBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.origin;
    }
    return PRODUCTION_DOMAIN;
  };

  const toggleSelectAll = () => {
    if (isFinished) return;
    if (areAllSelected) {
      setSelectedAsmIds(prev => prev.filter(id => !visibleAsambleistaIds.includes(id)));
    } else {
      const newIds = new Set([...selectedAsmIds, ...visibleAsambleistaIds]);
      setSelectedAsmIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (isFinished) return;
    setSelectedAsmIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkLogout = async () => {
    if (isFinished) return;
    if (selectedAsmIds.length === 0) return;
    if (!window.confirm(`¿Confirmar salida masiva de ${selectedAsmIds.length} asistentes?`)) return;

    setIsBulkProcessing(true);
    try {
      await updateBatchAttendance(selectedAsmIds, false);
      setSelectedAsmIds([]);
    } catch (error) {
      console.error("Error batch logout:", error);
      alert("Error al procesar la salida masiva.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleQuickCreateToken = async (unit: any) => {
    if (isFinished || creatingTokenId) return;
    setCreatingTokenId(unit.id);
    try {
      await addAsambleista({
        nombre: unit.propietario && unit.propietario.trim() !== '' ? unit.propietario : `Propietario ${unit.nombre}`,
        email: unit.email || '',
        documento: '',
        esApoderado: false,
        unidadesIds: [unit.id],
        token: unit.token
      });
      setCreatingTokenId(null);
    } catch (e) {
      alert("Error activando unidad.");
      setCreatingTokenId(null);
    }
  };

  const handleToggle = async (id: string) => {
    if (isFinished || loadingId) return;
    setLoadingId(id);
    try {
      await toggleAttendance(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleOpenNewProxy = () => {
    setEditingProxy(null);
    setProxyForm({ nombre: '', documento: '' });
    setSelectedUnitIds([]);
    setIsVoterModalOpen(true);
  };

  const handleEditProxy = (asm: Asambleista) => {
    setEditingProxy(asm);
    setProxyForm({ nombre: asm.nombre, documento: asm.documento || '' });
    setSelectedUnitIds(asm.unidadesIds);
    setIsVoterModalOpen(true);
  };

  const handleDeleteAsambleista = async (id: string, nombre: string) => {
    if (isFinished) return;
    if (!window.confirm(`¿Seguro que desea eliminar al apoderado ${nombre}? Esto desvinculará todas las unidades asignadas.`)) return;

    try {
      await deleteAsambleista(id);
    } catch (err) {
      alert("Error al eliminar apoderado.");
    }
  };

  const handleRegisterProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinished || isSubmitting) return;
    if (selectedUnitIds.length === 0) return alert("Seleccione al menos una unidad para representar.");

    setIsSubmitting(true);
    try {
      // ---------------------------------------------------------------
      // LIMPIEZA DE CONFLICTOS: Desvincular unidades de otros usuarios
      // ---------------------------------------------------------------
      for (const uid of selectedUnitIds) {
        const existingAsm = getAsambleistaByUnit(uid);
        // Si la unidad ya está asignada a alguien que NO es el apoderado actual
        if (existingAsm && existingAsm.id !== editingProxy?.id) {
          if (existingAsm.unidadesIds.length > 1) {
            // Si tiene múltiples unidades, solo quitamos esta
            await unlinkProxyUnits(existingAsm.id, [uid]);
          } else {
            // Si solo tiene esta unidad, eliminamos el registro completo para evitar duplicados
            await deleteAsambleista(existingAsm.id);
          }
        }
      }

      if (editingProxy) {
        // Lógica de Actualización (Diferencial)
        const currentIds = editingProxy.unidadesIds;
        const newIds = selectedUnitIds;

        const toAdd = newIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !newIds.includes(id));

        if (toAdd.length > 0) await addProxyUnits(editingProxy.id, toAdd);
        if (toRemove.length > 0) await unlinkProxyUnits(editingProxy.id, toRemove);
      } else {
        // Lógica de Creación
        await registerProxy({
          nombre: proxyForm.nombre,
          documento: proxyForm.documento,
          unitIds: selectedUnitIds
        });
      }
      setIsVoterModalOpen(false);
      setProxyForm({ nombre: '', documento: '' });
      setSelectedUnitIds([]);
      setEditingProxy(null);
    } catch (err: any) {
      alert(err.message || "Error al procesar apoderado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUnitSelection = (uid: string) => {
    setSelectedUnitIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  // NUEVA FUNCIÓN: Solo Generar/Regenerar Códigos (DB)
  const handleGenerateCodes = async () => {
    if (isFinished) return;
    if (!confirm("Esto asegurará que todas las unidades tengan un código de acceso válido para ESTA asamblea. ¿Confirmar generación?")) return;
    setIsGenerating(true);
    try {
      const result = await generateMassCredentials();
      alert(`Proceso completado.\n\nCódigos Nuevos: ${result.created}\nCódigos Sincronizados: ${result.updated}\n\nAhora puede proceder a imprimir las fichas.`);
    } catch (error) {
      alert("Error generando códigos.");
    } finally {
      setIsGenerating(false);
    }
  };

  // NUEVA FUNCIÓN: Borrar Códigos
  const handleClearCodes = async () => {
    if (isFinished) return;
    if (!confirm("⚠️ ADVERTENCIA: Esta acción invalidará TODOS los códigos de acceso actuales. Los usuarios no podrán ingresar hasta que genere nuevos códigos. \n\n¿Seguro que desea continuar?")) return;
    setIsClearing(true);
    try {
      await clearMassCredentials();
      alert("Códigos eliminados. Use el botón 'Generar Tokens' para crear nuevos accesos.");
    } catch (e) {
      alert("Error borrando códigos.");
    } finally {
      setIsClearing(false);
    }
  };

  // NUEVA FUNCIÓN: Solo Imprimir (UI)
  const handlePrintCredentials = () => {
    if (currentAsambleistas.length === 0) {
      alert("No se han generado códigos para esta asamblea. Por favor use el botón 'Generar Tokens' primero.");
      return;
    }
    setIsMassPrintOpen(true);
  };

  const openQRModal = (asm: Asambleista | undefined, unit: Unidad) => {
    if (asm) {
      setSelectedForQR(asm);
    } else if (unit.token) {
      setSelectedForQR({
        nombre: unit.propietario || `Propietario ${unit.nombre}`,
        documento: '',
        token: unit.token,
        unidadesIds: [unit.id],
        esApoderado: false,
        isPreview: true
      });
    }
  };

  const handleSort = (key: 'nombre' | 'propietario' | 'coeficiente' | 'asistencia' | 'tipo') => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortIcon = ({ column }: { column: 'nombre' | 'propietario' | 'coeficiente' | 'asistencia' | 'tipo' }) => {
    if (sortConfig.key !== column || !sortConfig.direction) return <ArrowUpDown size={12} className="ml-1 opacity-20 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-indigo-600" /> : <ChevronDown size={12} className="ml-1 text-indigo-600" />;
  };

  return (
    <div className="relative">
      {/* UI NORMAL */}
      <div className="bg-white rounded-[32px] p-4 sm:p-8 shadow-sm border border-slate-200 no-print animate-in fade-in duration-300">

        {isFinished && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-amber-800 animate-in slide-in-from-top-2">
            <Lock size={20} className="shrink-0" />
            <div>
              <h4 className="font-black text-xs uppercase">Registro Cerrado por Auditoría</h4>
              <p className="text-[10px] font-medium opacity-80">La asamblea ha finalizado. No es posible modificar la asistencia ni registrar nuevos participantes para garantizar la integridad de los resultados.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5 mb-8">
          {/* Row 1: Title + Search */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registro & Ingreso</h2>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar unidad o propietario..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-600 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Subtitle + Buttons */}
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Control de acceso y credenciales</p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleOpenNewProxy}
                disabled={isFinished}
                className={`flex-1 sm:flex-none bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:bg-indigo-700 active:scale-95'}`}
              >
                <UserPlus size={16} /> <span className="hidden sm:inline">Apoderado</span><span className="sm:hidden">Poder</span>
              </button>

              {/* BOTÓN SEPARADO: BORRAR TOKENS */}
              <button
                onClick={handleClearCodes}
                disabled={isClearing || isFinished}
                className={`flex-1 sm:flex-none bg-red-50 text-red-600 border border-red-100 px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${isFinished ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 active:scale-95'}`}
                title="Borrar todos los tokens para regenerar"
              >
                {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Eraser size={16} />}
                <span className="hidden sm:inline">Borrar Tokens</span>
              </button>

              {/* BOTÓN SEPARADO: GENERAR TOKENS */}
              <button
                onClick={handleGenerateCodes}
                disabled={isGenerating || isFinished}
                className={`flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:bg-emerald-700 active:scale-95'}`}
                title="Generar Códigos de Acceso"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                <span className="hidden sm:inline">Generar Tokens</span><span className="sm:hidden">Tokens</span>
              </button>

              {/* BOTÓN SEPARADO: IMPRIMIR */}
              <button
                onClick={handlePrintCredentials}
                disabled={isFinished}
                className={`flex-1 sm:flex-none bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:bg-slate-800 active:scale-95'}`}
                title="Imprimir Fichas"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Imprimir Fichas</span><span className="sm:hidden">Imprimir</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left table-auto sm:table-fixed">
            <thead className="border-b border-slate-100">
              <tr className="text-xs font-black uppercase text-slate-400 tracking-widest">
                <th className="pb-4 pl-4 sm:pl-2 w-10">
                  <button
                    onClick={toggleSelectAll}
                    disabled={isFinished}
                    className={`hover:text-indigo-600 transition-colors ${isFinished ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {areAllSelected ? <CheckSquare size={18} className={isFinished ? "text-slate-400" : "text-indigo-600"} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="pb-4 w-24 sm:w-32 cursor-pointer group" onClick={() => handleSort('nombre')}>
                  <div className="flex items-center">
                    Unidad <SortIcon column="nombre" />
                  </div>
                </th>
                <th className="pb-4 cursor-pointer group" onClick={() => handleSort('propietario')}>
                  <div className="flex items-center">
                    Propietario / Email <SortIcon column="propietario" />
                  </div>
                </th>
                <th className="pb-4 w-20 hidden md:table-cell cursor-pointer group" onClick={() => handleSort('tipo')}>
                  <div className="flex items-center">
                    Tipo <SortIcon column="tipo" />
                  </div>
                </th>
                <th className="pb-4 w-16 text-center cursor-pointer group" onClick={() => handleSort('coeficiente')}>
                  <div className="flex items-center justify-center">
                    Coef. <SortIcon column="coeficiente" />
                  </div>
                </th>
                <th className="pb-4 w-20 sm:w-24 text-center cursor-pointer group" onClick={() => handleSort('asistencia')}>
                  <div className="flex items-center justify-center">
                    Estado <SortIcon column="asistencia" />
                  </div>
                </th>
                <th className="pb-4 w-40 text-right pr-4 sm:pr-0">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUnidades.map(u => {
                const asm = getAsambleistaByUnit(u.id);
                const isPresent = asm?.asistenciaConfirmada;
                const isLoading = loadingId === asm?.id;
                const isSelected = asm ? selectedAsmIds.includes(asm.id) : false;
                const isCreating = creatingTokenId === u.id;
                const displayToken = asm?.token || u.token || '---';

                return (
                  <tr key={u.id} className={`hover:bg-slate-50 group transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                    <td className="py-3 pl-4 sm:pl-2">
                      <button
                        onClick={() => asm && toggleSelectOne(asm.id)}
                        disabled={!asm || isFinished}
                        className={`transition-colors ${(!asm || isFinished) ? 'opacity-20 cursor-not-allowed' : 'hover:text-indigo-600 cursor-pointer'} ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-xs sm:text-sm">{u.nombre}</span>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono text-slate-400 mt-0.5">
                          <Key size={10} />
                          <span className="tracking-tighter">{displayToken}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="max-w-[120px] sm:max-w-none">
                        <span className="block text-xs sm:text-sm font-bold text-slate-700 truncate">
                          {asm && asm.esApoderado ? asm.nombre : u.propietario}
                        </span>
                        {(asm?.email || u.email) && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                            <Mail size={10} className="shrink-0" />
                            <span className="lowercase truncate">
                              {asm && asm.esApoderado ? asm.email : u.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      {asm ? (
                        asm.esApoderado ?
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase">Pod.</span> :
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase">Prop.</span>
                      ) : (
                        <span className="text-slate-200 text-[10px] sm:text-xs uppercase font-bold">---</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono text-[10px] sm:text-xs font-bold text-indigo-600">{(u.coeficiente || u.coefficient || 0).toFixed(2)}%</span>
                    </td>
                    <td className="py-3 text-center">
                      {isPresent ? (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-1 rounded text-[10px] sm:text-xs font-black uppercase">SALA</span>
                      ) : (
                        <span className="bg-slate-50 text-slate-300 px-1.5 py-1 rounded text-[10px] sm:text-xs font-black uppercase">OUT</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-4 sm:pr-0">
                      <div className="flex items-center justify-end gap-1 flex-nowrap">
                        {asm && asm.esApoderado && (
                          <>
                            <button
                              onClick={() => handleEditProxy(asm)}
                              disabled={isFinished}
                              className={`p-1.5 bg-slate-100 text-slate-500 rounded-lg transition-colors hidden sm:flex ${isFinished ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
                              title="Editar Asignación"
                            >
                              <UserCog size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteAsambleista(asm.id, asm.nombre)}
                              disabled={isFinished}
                              className={`p-1.5 bg-slate-100 text-slate-500 rounded-lg transition-colors hidden sm:flex ${isFinished ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-500'}`}
                              title="Eliminar Apoderado"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openQRModal(asm, u)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors hidden sm:flex"
                        >
                          <QrCode size={13} />
                        </button>
                        {asm ? (
                          <button
                            onClick={() => handleToggle(asm.id)}
                            disabled={isLoading || isFinished}
                            className={`min-w-[55px] sm:min-w-[65px] px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center ${isFinished ? 'opacity-50 cursor-not-allowed' : ''} ${isPresent ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                          >
                            {isLoading ? <Loader2 size={10} className="animate-spin" /> : (isPresent ? 'OUT' : 'IN')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickCreateToken(u)}
                            disabled={isCreating || isFinished}
                            className={`px-2 py-1.5 bg-slate-800 text-white text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all flex items-center gap-1 ${isFinished ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600'}`}
                          >
                            {isCreating ? <Loader2 size={10} className="animate-spin" /> : <Ticket size={10} />}
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Pie de tabla con totales de quórum */}
            <tfoot className="border-t-2 border-slate-100 bg-slate-50/50">
              <tr className="text-xs font-black uppercase text-slate-500">
                <td colSpan={4} className="py-4 pl-4 sm:pl-2">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-indigo-600" />
                    <span>Resumen de Quórum en Sala</span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex flex-col">
                    <span className="text-indigo-600 text-sm">{totalInSalaCoef.toFixed(3)}%</span>
                    <span className="text-[9px] text-slate-400">DE {totalPossibleCoef.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className="bg-indigo-600 text-white px-2 py-1 rounded-full text-[10px]">
                    {currentAsambleistas.filter(a => a.asistenciaConfirmada).length} PERS.
                  </span>
                </td>
                <td className="py-4 text-right pr-4 sm:pr-0">
                  <span className="text-[10px] text-slate-300 italic">Cálculo Automático</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {selectedAsmIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 pl-4 pr-2 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-[100] max-w-[90vw]">
            <span className="text-[10px] font-black uppercase tracking-tight truncate">{selectedAsmIds.length} Sel.</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <button
              onClick={handleBulkLogout}
              disabled={isBulkProcessing || isFinished}
              className={`bg-red-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 transition-all ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isBulkProcessing ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              Salida
            </button>
            <button onClick={() => setSelectedAsmIds([])} className="p-2 text-slate-400"><X size={14} /></button>
          </div>
        )}
      </div>

      {/* MODAL IMPRESIÓN MASIVA - 8 FICHAS POR PÁGINA */}
      {isMassPrintOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col print-modal-wrapper">
          <style>{`
             @media print {
               @page { size: letter; margin: 0.5cm; }
               
               html, body { 
                 height: auto !important; 
                 overflow: visible !important; 
                 background: white !important;
               }

               /* Hide the main app root */
               body > *:not(.print-modal-wrapper) {
                 display: none !important;
               }
               
               /* Show only our portal content */
               .print-modal-wrapper { 
                 position: static !important;
                 top: 0 !important;
                 left: 0 !important;
                 width: 100% !important;
                 height: auto !important;
                 overflow: visible !important;
                 display: block !important;
                 background: white !important;
               }

               .print-scroll-container {
                 height: auto !important;
                 overflow: visible !important;
                 display: block !important;
                 padding: 0 !important;
               }

               .print-card-container { 
                 display: grid !important; 
                 grid-template-columns: 1fr 1fr !important; 
                 gap: 0 !important; 
                 width: 100% !important;
                 margin: 0 !important;
               }

               .print-card { 
                 height: 6.7cm !important;
                 width: 100% !important;
                 break-inside: avoid !important;
                 page-break-inside: avoid !important;
                 border: 1px dashed #000 !important; /* Changed to black for better visibility */
                 -webkit-print-color-adjust: exact !important; /* Force print colors */
                 print-color-adjust: exact !important;
                 margin: 0 !important;
                 padding: 8px !important;
                 box-shadow: none !important;
                 border-radius: 0 !important;
                 display: flex !important;
                 align-items: center !important;
                 justify-content: space-between !important;
               }
               
               .no-print { display: none !important; }
               ::-webkit-scrollbar { display: none; }
             }
           `}</style>

          {/* Header de Control */}
          <div className="no-print p-6 bg-slate-900 text-white flex justify-between items-center shadow-xl shrink-0">
            <div>
              <h3 className="text-xl font-black uppercase leading-none">Impresión de Fichas</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                Se generaron {currentAsambleistas.length} credenciales • Formato 8 fichas por página
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsMassPrintOpen(false)} className="px-6 py-3 rounded-xl font-black uppercase text-xs text-slate-400 hover:text-white transition-colors">Cerrar</button>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2">
                <Printer size={18} /> Imprimir Todo
              </button>
            </div>
          </div>

          {/* Área de Credenciales */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print-scroll-container">
            <div className="max-w-[21cm] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-0 print-card-container">
              {currentAsambleistas.map((asm) => {
                const myUnits = unidades.filter(u => asm.unidadesIds.includes(u.id));
                const totalCoef = myUnits.reduce((acc, u) => acc + (u.coeficiente || u.coefficient || 0), 0);

                return (
                  <div key={asm.id} className="print-card bg-white border border-dashed border-slate-300 p-4 flex items-center justify-between h-[6.8cm] relative overflow-hidden rounded-xl shadow-sm sm:shadow-none sm:rounded-none">

                    <div className="flex-1 pr-2 overflow-hidden">
                      <h2 className="text-[10px] font-black uppercase text-slate-900 leading-none mb-1 truncate">{activeCopropiedad?.nombre}</h2>
                      <p className="text-[8px] font-bold uppercase text-slate-500 tracking-widest mb-3 truncate">{activeAsamblea?.nombre}</p>

                      <div className="inline-block bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase mb-1">
                        {asm.esApoderado ? 'APODERADO' : 'PROPIETARIO'}
                      </div>
                      <h3 className="text-sm font-black uppercase leading-tight line-clamp-1">{asm.nombre}</h3>
                      <p className="text-[9px] font-bold text-slate-600 mt-1 line-clamp-1">{myUnits.map(u => u.nombre).join(', ')}</p>
                      <p className="text-[8px] font-mono mt-0.5 text-slate-400">Coef: {totalCoef.toFixed(3)}%</p>

                      <div className="flex items-center gap-1 mt-2 text-[7px] text-slate-300">
                        <Scissors size={8} /> Recortar por la línea punteada
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pl-2 border-l border-slate-100 shrink-0 w-[125px]">
                      <QRCodeCanvas value={`${getQrBaseUrl()}/?token=${asm.token}`} size={115} level="L" includeMargin={true} />
                      <p className="text-lg font-black font-mono mt-1 tracking-widest text-slate-900 leading-none">{asm.token}</p>
                      <p className="text-[7px] font-bold uppercase text-slate-400">Código de Acceso</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* QR Modal Individual */}
      {selectedForQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 no-print">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 uppercase">Credencial</h3>
              <button onClick={() => setSelectedForQR(null)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 uppercase">{selectedForQR.nombre}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activeCopropiedad?.nombre}</p>
              </div>
              <div className="bg-white p-3 rounded-[32px] border flex justify-center items-center mx-auto w-fit">
                <QRCodeCanvas value={`${getQrBaseUrl()}/?token=${selectedForQR.token}`} size={160} level="M" includeMargin={true} />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase mb-1">Código Único</p>
                <p className="text-xl font-black text-indigo-600 tracking-widest">{selectedForQR.token}</p>
              </div>
              <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registrar Apoderado Modal */}
      {isVoterModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4 no-print">
          <div className="bg-white rounded-t-[32px] sm:rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[95vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                {editingProxy ? <UserCog className="text-indigo-600" size={20} /> : <UserPlus className="text-indigo-600" size={20} />}
                <h3 className="text-base font-black text-slate-900 uppercase">{editingProxy ? 'Editar Apoderado' : 'Nuevo Apoderado'}</h3>
              </div>
              <button onClick={() => setIsVoterModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>

            <div className="p-4 sm:p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <form id="proxyForm" onSubmit={handleRegisterProxy} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                    <input disabled={!!editingProxy} required type="text" placeholder="Nombre completo" value={proxyForm.nombre} onChange={e => setProxyForm({ ...proxyForm, nombre: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Documento</label>
                    <input disabled={!!editingProxy} required type="text" placeholder="ID / Cédula" value={proxyForm.documento} onChange={e => setProxyForm({ ...proxyForm, documento: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black uppercase text-slate-400">Unidades Asignadas ({selectedUnitIds.length})</label>
                    <button type="button" onClick={() => setSelectedUnitIds([])} className="text-[11px] font-black text-indigo-600 uppercase">Limpiar</button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Filtrar unidades..." value={unitSearch} onChange={e => setUnitSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                  </div>

                  <div className="border border-slate-100 rounded-2xl max-h-[250px] overflow-y-auto p-2 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableUnitsForProxy.map(u => (
                      <div
                        key={u.id}
                        onClick={() => toggleUnitSelection(u.id)}
                        className={`p-3 rounded-xl cursor-pointer text-center transition-all border ${selectedUnitIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-white hover:bg-indigo-50 text-slate-700'}`}
                      >
                        <p className="font-black text-xs uppercase truncate">{u.nombre}</p>
                        <p className={`text-[10px] truncate opacity-60`}>{u.propietario}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t bg-slate-50 shrink-0">
              <button
                type="submit"
                form="proxyForm"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (editingProxy ? <UserCog size={16} /> : <UserPlus size={16} />)}
                {editingProxy ? 'Actualizar Asignación' : 'Confirmar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
