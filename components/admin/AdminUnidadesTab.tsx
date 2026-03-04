
import React, { useState, useRef, useMemo } from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import {
  FileUp, Plus, Edit2, Trash2, Building2, X, Download, Info, Loader2,
  FileSpreadsheet, ClipboardPaste, ArrowRight, CheckCircle2, AlertTriangle, UploadCloud,
  Mail, Key, RefreshCw, Wand2, AlertCircle, Lock, List, LayoutGrid, CheckSquare, Square, MoreHorizontal, Send, ShieldCheck,
  ChevronUp, ChevronDown, ArrowUpDown
} from 'lucide-react';
import { Unidad } from '../../types.ts';

export const AdminUnidadesTab: React.FC = () => {
  const {
    unidades, selectedCopropiedadId, addUnit, updateUnit, deleteUnit,
    bulkAddUnits, getTotalBuildingCoefficient, regenerateUnitToken,
    asambleas, selectedAsambleaId, sendEmailInvitation, registerBulkEmailSent
  } = useAssembly();

  // Estados CRUD individual
  const [isSingleUnitModalOpen, setIsSingleUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState({ nombre: '', coeficiente: '', propietario: '', email: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingTokenId, setRegeneratingTokenId] = useState<string | null>(null);
  const [confirmRegenerateId, setConfirmRegenerateId] = useState<string | null>(null);

  // Estados Email
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados Importación Masiva
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'INPUT' | 'PREVIEW'>('INPUT');
  const [importMethod, setImportMethod] = useState<'FILE' | 'TEXT'>('TEXT');
  const [textData, setTextData] = useState('');
  const [parsedUnits, setParsedUnits] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Novedades: Vista y Selección Masiva
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Estados de Ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Unidad | 'coeficiente';
    direction: 'asc' | 'desc' | null;
  }>({ key: 'nombre', direction: 'asc' });

  const currentUnidades = useMemo(() => {
    let result = unidades.filter(u => u.copropiedadId === selectedCopropiedadId);

    if (sortConfig.direction) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Unidad];
        const bValue = b[sortConfig.key as keyof Unidad];

        if (aValue === bValue) return 0;

        if (sortConfig.direction === 'asc') {
          return aValue! > bValue! ? 1 : -1;
        } else {
          return aValue! < bValue! ? 1 : -1;
        }
      });
    }

    return result;
  }, [unidades, selectedCopropiedadId, sortConfig]);

  const totalBuildingCoef = getTotalBuildingCoefficient(selectedCopropiedadId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if assembly is finished
  const activeAsamblea = asambleas.find(a => a.id === selectedAsambleaId);
  const isFinished = activeAsamblea?.status === 'FINALIZADA';

  // Limits Check
  const isBulkEmailUsed = (activeAsamblea?.bulkEmailCount || 0) > 0;

  // --- LÓGICA SELECCIÓN MASIVA ---
  const toggleSelectAll = () => {
    if (isFinished) return;
    if (selectedUnitIds.length === currentUnidades.length) {
      setSelectedUnitIds([]);
    } else {
      setSelectedUnitIds(currentUnidades.map(u => u.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (isFinished) return;
    setSelectedUnitIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (isFinished) return;
    if (selectedUnitIds.length === 0) return;

    if (!window.confirm(`¿Está seguro de eliminar ${selectedUnitIds.length} unidades permanentemente? Esta acción no se puede deshacer.`)) return;

    setIsBulkDeleting(true);
    try {
      // Ejecutamos las promesas en paralelo para mayor velocidad
      await Promise.all(selectedUnitIds.map(id => deleteUnit(id)));
      setSelectedUnitIds([]);
    } catch (error) {
      console.error("Error bulk delete:", error);
      alert("Ocurrió un error al eliminar algunas unidades.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // --- LÓGICA ENVÍO DE CORREOS ---
  const handleSendEmail = async (unit: Unidad) => {
    if (isFinished || sendingEmailId) return;

    const sentCount = unit.emailSentCount || 0;
    if (sentCount >= 2) {
      alert("Límite de envíos alcanzado (2/2) para esta unidad. Contacte al SuperAdmin si requiere más.");
      return;
    }

    // Confirmación rápida
    if (!confirm("¿Enviar invitación de acceso a este propietario?")) return;

    setSendingEmailId(unit.id);
    try {
      const res = await sendEmailInvitation(unit.id);
      if (res.success) {
        alert("Correo enviado exitosamente.");
      } else {
        alert("Error: " + res.message);
      }
    } catch (e) {
      alert("Error de conexión enviando correo.");
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleBulkEmail = async () => {
    if (isFinished || isBulkSending) return;

    if (isBulkEmailUsed) {
      alert("El envío masivo solo se permite UNA VEZ por asamblea. Para envíos adicionales, contacte al SuperAdmin.");
      return;
    }

    const unitsWithEmail = currentUnidades.filter(u => u.email && u.email.includes('@'));
    if (unitsWithEmail.length === 0) return alert("No hay unidades con correo electrónico registrado.");

    if (!confirm(`Se enviarán invitaciones a ${unitsWithEmail.length} unidades. Esta acción solo se puede realizar una vez. ¿Confirmar?`)) return;

    setIsBulkSending(true);
    try {
      // Procesamiento en serie para no saturar el backend (rate limits)
      let sentCount = 0;
      let errorCount = 0;

      for (const unit of unitsWithEmail) {
        // Internal check inside sendEmailInvitation handles the per-unit limit too, 
        // but bulk override logic usually assumes first fresh send.
        const res = await sendEmailInvitation(unit.id);
        if (res.success) sentCount++;
        else errorCount++;
      }

      if (selectedAsambleaId) {
        await registerBulkEmailSent(selectedAsambleaId);
      }

      alert(`Proceso finalizado.\nEnviados: ${sentCount}\nErrores: ${errorCount}`);
    } catch (e) {
      console.error(e);
      alert("Error en el proceso masivo.");
    } finally {
      setIsBulkSending(false);
    }
  };

  // --- LÓGICA VALIDACIÓN ---
  const validateUnit = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!unitForm.nombre.trim()) newErrors.nombre = 'El identificador es obligatorio.';
    if (!unitForm.propietario.trim()) newErrors.propietario = 'El nombre del propietario es obligatorio.';

    const coef = parseFloat(unitForm.coeficiente);
    if (isNaN(coef) || coef <= 0) newErrors.coeficiente = 'Debe ser un número mayor a 0.';
    else if (coef > 100) newErrors.coeficiente = 'No puede superar el 100%.';

    if (unitForm.email.trim() && !emailRegex.test(unitForm.email.trim())) {
      newErrors.email = 'Formato de correo inválido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- LÓGICA CRUD INDIVIDUAL ---
  const handleSingleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinished) return;
    if (!validateUnit()) return;

    const data = {
      nombre: unitForm.nombre,
      coeficiente: parseFloat(unitForm.coeficiente) || 0,
      propietario: unitForm.propietario,
      email: unitForm.email
    };
    if (editingUnitId) await updateUnit(editingUnitId, data);
    else await addUnit(data);
    setIsSingleUnitModalOpen(false);
    setEditingUnitId(null);
    setUnitForm({ nombre: '', coeficiente: '', propietario: '', email: '' });
  };

  const openEditUnit = (u: Unidad) => {
    if (isFinished) return;
    setErrors({});
    setEditingUnitId(u.id);
    setUnitForm({
      nombre: u.nombre,
      coeficiente: String(u.coeficiente || 0),
      propietario: u.propietario,
      email: u.email || ''
    });
    setIsSingleUnitModalOpen(true);
  };

  const openCreateUnit = () => {
    if (isFinished) return;
    setErrors({});
    setEditingUnitId(null);
    setUnitForm({ nombre: '', coeficiente: '', propietario: '', email: '' });
    setIsSingleUnitModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (isFinished) return;
    if (!window.confirm("¿Seguro que desea eliminar esta unidad permanentemente?")) return;
    setDeletingId(id);
    try {
      await deleteUnit(id);
    } catch (err) {
      alert("Error al eliminar la unidad. Verifique su conexión.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerateToken = (e: React.MouseEvent, id: string, hasToken: boolean) => {
    e.stopPropagation();
    if (isFinished) return;

    if (hasToken) {
      setConfirmRegenerateId(id);
    } else {
      executeRegeneration(id);
    }
  };

  const executeRegeneration = async (id: string) => {
    setRegeneratingTokenId(id);
    try {
      await regenerateUnitToken(id);
      setConfirmRegenerateId(null);
    } catch (err) {
      console.error("Error generating token:", err);
      alert("No se pudo generar el token. Intente de nuevo.");
    } finally {
      setRegeneratingTokenId(null);
    }
  };

  // --- LÓGICA IMPORTACIÓN MASIVA ---
  const processRawData = (content: string) => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) return;

    let separator = ',';
    if (lines[0].includes('\t')) separator = '\t';
    else if (lines[0].includes(';')) separator = ';';

    const detectedUnits: any[] = [];

    const firstLineParts = lines[0].split(separator);
    // FIX: Guard against undefined replace
    const startIdx = isNaN(parseFloat((firstLineParts[1] || '').replace(',', '.') || 'NaN')) ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(separator).map(p => p.replace(/["]/g, '').trim());
      if (parts.length >= 2) {
        const coef = parseFloat(parts[1]?.replace(',', '.'));
        detectedUnits.push({
          nombre: parts[0],
          coeficiente: isNaN(coef) ? 0 : coef,
          propietario: parts[2] || 'Propietario Pendiente',
          email: parts[3] || '',
          isValid: !isNaN(coef) && parts[0].length > 0
        });
      }
    }
    setParsedUnits(detectedUnits);
    setImportStep('PREVIEW');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processRawData(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = async () => {
    if (isFinished) return;
    const validUnits = parsedUnits.filter(u => u.isValid);
    if (validUnits.length === 0) return alert("No hay datos válidos para importar.");

    setIsImporting(true);
    try {
      const cleanData = validUnits.map(({ isValid, ...rest }) => rest);
      await bulkAddUnits(cleanData);
      setIsImportModalOpen(false);
      setParsedUnits([]);
      setTextData('');
      setImportStep('INPUT');
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar los datos.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSort = (key: keyof Unidad | 'coeficiente') => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortIcon = ({ column }: { column: keyof Unidad | 'coeficiente' }) => {
    if (sortConfig.key !== column || !sortConfig.direction) return <ArrowUpDown size={12} className="ml-1 opacity-20 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-indigo-600" /> : <ChevronDown size={12} className="ml-1 text-indigo-600" />;
  };

  const allSelected = currentUnidades.length > 0 && selectedUnitIds.length === currentUnidades.length;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-200 no-print animate-in fade-in duration-300 relative">

      {isFinished && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-amber-800 animate-in slide-in-from-top-2">
          <Lock size={20} className="shrink-0" />
          <div>
            <h4 className="font-black text-xs uppercase">Gestión de Unidades Cerrada</h4>
            <p className="text-[10px] font-medium opacity-80">La asamblea ha finalizado. No es posible agregar, modificar o eliminar unidades para preservar la integridad del acta.</p>
          </div>
        </div>
      )}

      {/* HEADER DE LA PESTAÑA */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">GESTIÓN DE UNIDADES</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Total: {currentUnidades.length}</span>
            <span className="text-xs text-slate-300">•</span>
            <span className={`text-xs font-black uppercase ${totalBuildingCoef > 100.1 ? 'text-red-500' : totalBuildingCoef < 99.9 ? 'text-amber-500' : 'text-emerald-600'}`}>
              Coeficiente: {totalBuildingCoef.toFixed(3)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* View Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Lista"
            >
              <List size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          {isBulkEmailUsed ? (
            <a
              href="https://wa.me/573502809714?text=Hola,%20necesito%20aumento%20de%20cupo%20de%20envío%20de%20correos"
              target="_blank"
              className="flex-1 sm:flex-none bg-slate-100 text-slate-500 border border-slate-200 px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-sm"
              title="Límite alcanzado"
            >
              <ShieldCheck size={16} /> Contactar SuperAdmin
            </a>
          ) : (
            <button
              onClick={handleBulkEmail}
              disabled={isFinished || isBulkSending}
              className={`flex-1 sm:flex-none bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : ''}`}
            >
              {isBulkSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isBulkSending ? 'Enviando...' : 'Enviar Accesos (Masivo)'}
            </button>
          )}

          <button
            onClick={() => { setIsImportModalOpen(true); setImportStep('INPUT'); }}
            disabled={isFinished}
            className={`flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-100 ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400 shadow-none hover:bg-slate-400' : ''}`}
          >
            <FileSpreadsheet size={16} /> Importar
          </button>
          <button
            onClick={openCreateUnit}
            disabled={isFinished}
            className={`flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100 ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400 shadow-none hover:bg-slate-400' : ''}`}
          >
            <Plus size={16} /> Crear
          </button>
        </div>
      </div>

      {/* --- VISTA: CUADRÍCULA --- */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentUnidades.map(u => {
            const isSelected = selectedUnitIds.includes(u.id);
            const isSending = sendingEmailId === u.id;
            const sentCount = u.emailSentCount || 0;
            const isLimit = sentCount >= 2;

            return (
              <div key={u.id} className={`p-5 border-2 rounded-[24px] bg-white transition-all group relative overflow-hidden shadow-sm ${isSelected ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-50 hover:border-indigo-100'}`}>

                {/* Selection Checkbox (Absolute) */}
                <div className="absolute top-3 left-3 z-20">
                  <button
                    onClick={() => toggleSelectOne(u.id)}
                    disabled={isFinished}
                    className={`transition-colors ${isFinished ? 'opacity-30 cursor-not-allowed' : 'hover:text-indigo-600'}`}
                  >
                    {isSelected ? <CheckSquare size={20} className="text-indigo-600 fill-white" /> : <Square size={20} className="text-slate-300" />}
                  </button>
                </div>

                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-bl-2xl z-10">
                  {u.email && (
                    <button
                      onClick={() => handleSendEmail(u)}
                      disabled={isFinished || isSending || isLimit}
                      className={`p-1.5 hover:bg-indigo-50 rounded-lg ${isFinished || isLimit ? 'opacity-50 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700'}`}
                      title={isLimit ? "Límite 2 envíos alcanzado" : "Enviar Invitación"}
                    >
                      {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  )}
                  <button
                    onClick={() => openEditUnit(u)}
                    disabled={isFinished}
                    className={`text-indigo-500 p-1.5 hover:bg-indigo-50 rounded-lg ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id || isFinished}
                    className={`text-red-500 p-1.5 hover:bg-red-50 rounded-lg disabled:opacity-50 ${isFinished ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {deletingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>

                <div className="space-y-4 pt-2 pl-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Unidad</p>
                      <p className="font-black text-xl text-slate-900 uppercase leading-none">{u.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-indigo-400 uppercase">Coef.</p>
                      <p className="font-black text-lg text-indigo-600">{(u.coeficiente || 0).toFixed(3)}%</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Propietario</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{u.propietario}</p>
                    </div>
                    {u.email && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail size={12} />
                        <p className="text-xs font-medium truncate">{u.email}</p>
                        {sentCount > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${sentCount >= 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{sentCount}/2</span>}
                      </div>
                    )}

                    {/* ZONA DE TOKEN */}
                    <div className={`p-2 rounded-xl flex items-center justify-between transition-all ${!u.token ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                      {u.token ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Key size={14} className="text-slate-400" />
                            <span className="text-sm font-mono font-black text-slate-700 tracking-[0.15em]">
                              {u.token}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleRegenerateToken(e, u.id, true)}
                            disabled={regeneratingTokenId === u.id || isFinished}
                            className={`text-indigo-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded-lg transition-colors ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Regenerar Token"
                          >
                            {regeneratingTokenId === u.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => handleRegenerateToken(e, u.id, false)}
                          disabled={regeneratingTokenId === u.id || isFinished}
                          className={`w-full flex items-center justify-center gap-2 text-indigo-600 font-black text-xs uppercase py-1 hover:bg-indigo-100 rounded-lg transition-colors ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {regeneratingTokenId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                          GENERAR TOKEN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- VISTA: LISTA (TABLA) --- */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 w-10 text-center">
                  <button onClick={toggleSelectAll} disabled={isFinished} className={isFinished ? 'opacity-50' : 'hover:text-indigo-600'}>
                    {allSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="p-4 cursor-pointer group" onClick={() => handleSort('nombre')}>
                  <div className="flex items-center">
                    Unidad <SortIcon column="nombre" />
                  </div>
                </th>
                <th className="p-4 text-center cursor-pointer group" onClick={() => handleSort('coeficiente')}>
                  <div className="flex items-center justify-center">
                    Coef. <SortIcon column="coeficiente" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer group" onClick={() => handleSort('propietario')}>
                  <div className="flex items-center">
                    Propietario <SortIcon column="propietario" />
                  </div>
                </th>
                <th className="p-4 hidden md:table-cell cursor-pointer group" onClick={() => handleSort('email')}>
                  <div className="flex items-center">
                    Email <SortIcon column="email" />
                  </div>
                </th>
                <th className="p-4 w-32 cursor-pointer group" onClick={() => handleSort('token')}>
                  <div className="flex items-center">
                    Token <SortIcon column="token" />
                  </div>
                </th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentUnidades.map(u => {
                const isSelected = selectedUnitIds.includes(u.id);
                const isSending = sendingEmailId === u.id;
                const sentCount = u.emailSentCount || 0;
                const isLimit = sentCount >= 2;

                return (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleSelectOne(u.id)} disabled={isFinished} className={isFinished ? 'opacity-50' : 'hover:text-indigo-600'}>
                        {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}
                      </button>
                    </td>
                    <td className="p-4 font-black text-slate-800 uppercase">{u.nombre}</td>
                    <td className="p-4 text-center font-mono text-indigo-600 font-bold">{(u.coeficiente || 0).toFixed(3)}%</td>
                    <td className="p-4 font-medium text-slate-600 truncate max-w-[150px]">{u.propietario}</td>
                    <td className="p-4 hidden md:table-cell text-slate-400 truncate max-w-[150px]">
                      {u.email || '-'}
                      {u.email && sentCount > 0 && <span className={`ml-2 text-[8px] font-black px-1.5 py-0.5 rounded ${sentCount >= 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{sentCount}/2</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold tracking-wider px-2 py-1 rounded text-xs ${u.token ? 'bg-slate-100 text-slate-700' : 'text-slate-300'}`}>
                          {u.token || '---'}
                        </span>
                        <button
                          onClick={(e) => handleRegenerateToken(e, u.id, !!u.token)}
                          disabled={regeneratingTokenId === u.id || isFinished}
                          className={`p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors ${isFinished ? 'hidden' : ''}`}
                          title="Regenerar"
                        >
                          {regeneratingTokenId === u.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.email && (
                          <button
                            onClick={() => handleSendEmail(u)}
                            disabled={isFinished || isSending || isLimit}
                            className={`p-1.5 rounded bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 transition-colors ${isFinished || isLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isLimit ? "Límite 2 envíos alcanzado" : "Enviar Accesos"}
                          >
                            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        )}
                        <button
                          onClick={() => openEditUnit(u)}
                          disabled={isFinished}
                          className={`p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id || isFinished}
                          className={`p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {deletingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {currentUnidades.length === 0 && (
        <div className="col-span-full py-16 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 mt-4">
          <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest px-8 mb-4">No hay unidades registradas</p>
          <button onClick={() => !isFinished && setIsImportModalOpen(true)} disabled={isFinished} className={`text-indigo-600 font-black text-sm uppercase hover:underline ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}>Importar desde Excel</button>
        </div>
      )}

      {/* BOTÓN FLOTANTE ELIMINACIÓN MASIVA */}
      {selectedUnitIds.length > 0 && !isFinished && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 pl-4 pr-2 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-[100] max-w-[90vw]">
          <span className="text-[10px] font-black uppercase tracking-tight truncate">{selectedUnitIds.length} Seleccionadas</span>
          <div className="h-4 w-px bg-slate-700"></div>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all hover:bg-red-700"
          >
            {isBulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Eliminar Todo
          </button>
          <button onClick={() => setSelectedUnitIds([])} className="p-2 text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Modal Unidad Individual */}
      {isSingleUnitModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg uppercase">{editingUnitId ? 'Editar Unidad' : 'Nueva Unidad'}</h3>
              <button onClick={() => setIsSingleUnitModalOpen(false)} className="text-slate-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleSingleUnitSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Identificador</label>
                <input
                  placeholder="Ej: Apto 101"
                  value={unitForm.nombre}
                  onChange={e => { setUnitForm({ ...unitForm, nombre: e.target.value }); if (errors.nombre) setErrors({ ...errors, nombre: '' }); }}
                  className={`w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm ${errors.nombre ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.nombre && <p className="text-[9px] text-red-500 font-bold ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Coeficiente (%)</label>
                <input
                  placeholder="Ej: 0.520"
                  type="number"
                  step="0.0001"
                  value={unitForm.coeficiente}
                  onChange={e => { setUnitForm({ ...unitForm, coeficiente: e.target.value }); if (errors.coeficiente) setErrors({ ...errors, coeficiente: '' }); }}
                  className={`w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm ${errors.coeficiente ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.coeficiente && <p className="text-[9px] text-red-500 font-bold ml-1">{errors.coeficiente}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Propietario</label>
                <input
                  placeholder="Nombre Propietario"
                  value={unitForm.propietario}
                  onChange={e => { setUnitForm({ ...unitForm, propietario: e.target.value }); if (errors.propietario) setErrors({ ...errors, propietario: '' }); }}
                  className={`w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm ${errors.propietario ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.propietario && <p className="text-[9px] text-red-500 font-bold ml-1">{errors.propietario}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={unitForm.email}
                  onChange={e => { setUnitForm({ ...unitForm, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  className={`w-full px-5 py-3 bg-slate-50 border rounded-xl font-bold text-sm ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email}</p>}
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase shadow-xl mt-4 tracking-widest active:scale-95 transition-all">Guardar Datos</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORTACIÓN MASIVA MEJORADO */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">

            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><FileSpreadsheet size={20} /></div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 uppercase leading-none">Importar Base de Datos</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                    Paso {importStep === 'INPUT' ? '1: Cargar Datos' : '2: Verificar y Guardar'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setParsedUnits([]); setTextData(''); }} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-slate-50/50">

              {/* STEP 1: INPUT */}
              {importStep === 'INPUT' && (
                <div className="space-y-8">
                  {/* Format Info */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-4 items-start">
                    <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-blue-800">Estructura requerida de columnas:</p>
                      <div className="flex gap-2 text-xs font-mono bg-white p-2 rounded-lg border border-blue-100 text-slate-600 overflow-x-auto">
                        <span className="font-black text-indigo-600">Nombre Unidad</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-black text-emerald-600">Coeficiente</span>
                        <span className="text-slate-300">|</span>
                        <span>Propietario</span>
                        <span className="text-slate-300">|</span>
                        <span>Email (Opcional)</span>
                      </div>
                      <p className="text-[10px] text-blue-600 font-medium">
                        Ejemplo: <br />
                        Apto 101, 0.45, Juan Pérez, juan@mail.com <br />
                        Apto 102, 0.52, María Gómez, maria@mail.com
                      </p>
                    </div>
                  </div>

                  {/* Method Selection Tabs */}
                  <div className="flex bg-slate-200 p-1 rounded-xl w-fit mx-auto">
                    <button
                      onClick={() => setImportMethod('TEXT')}
                      className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${importMethod === 'TEXT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <ClipboardPaste size={14} /> Pegar desde Excel
                    </button>
                    <button
                      onClick={() => setImportMethod('FILE')}
                      className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${importMethod === 'FILE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <UploadCloud size={14} /> Subir Archivo CSV
                    </button>
                  </div>

                  {/* Input Area */}
                  {importMethod === 'TEXT' ? (
                    <div className="space-y-2">
                      <textarea
                        value={textData}
                        onChange={e => setTextData(e.target.value)}
                        placeholder={`Pegue aquí sus datos... (Ctrl+V)\n\nApto 101\t0.52\tJuan Perez\t juan@mail.com\nApto 102\t0.52\tMaria Garcia`}
                        className="w-full h-64 p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none font-mono text-xs leading-relaxed resize-none"
                      />
                      <button
                        disabled={!textData.trim()}
                        onClick={() => processRawData(textData)}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        Procesar Datos <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-4 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <UploadCloud size={32} />
                      </div>
                      <div>
                        <p className="font-black text-slate-700 uppercase">Haga clic o arrastre su archivo aquí</p>
                        <p className="text-xs text-slate-400 mt-1">Soporta formatos CSV o Texto plano</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: PREVIEW */}
              {importStep === 'PREVIEW' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-900 uppercase">Resumen de Importación</h4>
                      <div className="flex gap-3">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> {parsedUnits.filter(u => u.isValid).length} Válidos</span>
                        <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> {parsedUnits.filter(u => !u.isValid).length} Errores</span>
                      </div>
                    </div>
                    <button onClick={() => setImportStep('INPUT')} className="text-xs font-bold text-indigo-600 hover:underline">← Volver / Corregir</button>
                  </div>

                  <div className="border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                        <tr>
                          <th className="p-3">Unidad</th>
                          <th className="p-3">Coeficiente</th>
                          <th className="p-3">Propietario</th>
                          <th className="p-3">Email</th>
                          <th className="p-3 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-xs">
                        {parsedUnits.map((u, idx) => (
                          <tr key={idx} className={!u.isValid ? 'bg-red-50' : ''}>
                            <td className="p-3 font-bold">{u.nombre || <span className="text-red-400 italic">Vacío</span>}</td>
                            <td className="p-3 font-mono">{u.coeficiente}</td>
                            <td className="p-3 text-slate-500">{u.propietario}</td>
                            <td className="p-3 text-slate-400">{u.email}</td>
                            <td className="p-3 text-right">
                              {u.isValid ? <CheckCircle2 size={16} className="text-emerald-500 ml-auto" /> : <X size={16} className="text-red-500 ml-auto" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {importStep === 'PREVIEW' && (
              <div className="p-6 border-t bg-white flex justify-end gap-3">
                <button onClick={() => setImportStep('INPUT')} className="px-6 py-3 rounded-xl font-black uppercase text-xs text-slate-400 hover:bg-slate-50">Cancelar</button>
                <button
                  onClick={confirmImport}
                  disabled={isImporting || parsedUnits.filter(u => u.isValid).length === 0}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                  {isImporting ? 'Importando...' : `Confirmar Importación (${parsedUnits.filter(u => u.isValid).length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Regenerar Token (Seguridad) */}
      {confirmRegenerateId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                <AlertTriangle size={40} strokeWidth={2.5} />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">¡Atención de Seguridad!</h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed px-2">
                  Si regeneras el token, el código anterior <span className="text-red-600">dejará de funcionar de inmediato</span>.
                </p>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 text-[11px] font-black uppercase text-left flex items-start gap-3">
                  <Info size={16} className="shrink-0" />
                  <span>Cualquier sticker, credencial o material impreso con el código actual será INSERVIBLE.</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => executeRegeneration(confirmRegenerateId)}
                  disabled={regeneratingTokenId === confirmRegenerateId}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {regeneratingTokenId === confirmRegenerateId ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                  Entiendo, Regenerar Ahora
                </button>
                <button
                  onClick={() => setConfirmRegenerateId(null)}
                  disabled={regeneratingTokenId === confirmRegenerateId}
                  className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
