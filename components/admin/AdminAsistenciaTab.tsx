
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import { Search, QrCode, X, Printer, Loader2, UserPlus, Ticket, CheckSquare, Square, LogOut, CheckCircle2, Mail, Key, Lock, AlertTriangle, Calculator, Scissors, UserCog, Trash2, Eraser, ChevronUp, ChevronDown, ArrowUpDown, Camera } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { Asambleista, Unidad } from '../../types.ts';
import { PRODUCTION_DOMAIN } from '../../constants.tsx';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

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
  const [isProxyReportOpen, setIsProxyReportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creatingTokenId, setCreatingTokenId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

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

  // Manejo de lectura de escáner
  const lastScannedRef = useRef<{ token: string, time: number }>({ token: '', time: 0 });

  const handleScanToken = useCallback(async (scannedText: string) => {
    if (isFinished || loadingId) return;

    let token = scannedText.trim();

    // Throttling: Evitar procesar el mismo código muy seguido (3 segundos)
    const now = Date.now();
    if (token === lastScannedRef.current.token && (now - lastScannedRef.current.time) < 3000) {
      return;
    }
    lastScannedRef.current = { token, time: now };

    // Si lo escaneado es una URL completa (ej: de la credencial impresa), extraer el token
    try {
      if (token.includes('?token=')) {
        const url = new URL(token.startsWith('http') ? token : `https://${token}`);
        const tokenParam = url.searchParams.get('token');
        if (tokenParam) token = tokenParam;
      }
    } catch (e) {
      // Si falla el parseo de URL, usamos el texto original
      console.warn("No se pudo parsear como URL, usando texto crudo");
    }

    const asm = currentAsambleistas.find(a => a.token === token);
    if (asm) {
      if (!asm.asistenciaConfirmada) {
        setLoadingId(asm.id);
        try {
          await toggleAttendance(asm.id);
          setScanFeedback({ message: `¡Ingreso registrado: ${asm.nombre}!`, type: 'success' });
        } catch (e) {
          setScanFeedback({ message: `Error al registrar asistencia.`, type: 'error' });
        } finally {
          setLoadingId(null);
        }
      } else {
        setScanFeedback({ message: `${asm.nombre} ya se encuentra en SALA.`, type: 'info' });
      }
    } else {
      const unit = currentUnidades.find(u => u.token === token);
      if (unit) {
        setScanFeedback({ message: `La unidad ${unit.nombre} no ha sido activada.`, type: 'error' });
      } else {
        setScanFeedback({ message: `Código QR no reconocido.`, type: 'error' });
      }
    }

    setTimeout(() => setScanFeedback(null), 4000);
  }, [isFinished, loadingId, currentAsambleistas, currentUnidades, toggleAttendance]);

  // Efecto para Escáner Físico (Teclado Rápido)
  useEffect(() => {
    let scannedChars = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en el buscador o modal
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (isVoterModalOpen || isMassPrintOpen || isScannerOpen) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) {
        scannedChars = ''; // Reset si el tiempo entre teclas es muy grande para ser un escáner
      }

      if (e.key === 'Enter') {
        if (scannedChars.trim().length > 5) {
          handleScanToken(scannedChars.trim());
        }
        scannedChars = '';
      } else if (e.key.length === 1) {
        scannedChars += e.key;
      }
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentAsambleistas, currentUnidades, isFinished, isVoterModalOpen, isScannerOpen, isMassPrintOpen, loadingId]);

  // Ref para el handler de escaneo para evitar reinicios de cámara por cambios de estado
  const scanHandlerRef = useRef(handleScanToken);
  useEffect(() => {
    scanHandlerRef.current = handleScanToken;
  }, [handleScanToken]);

  // Manejo de Cámara Web con Html5Qrcode (Directo para mejor control de errores)
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      if (!isScannerOpen) return;

      setCameraError(null);

      // 1. Verificación de Contexto Seguro
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setCameraError("La cámara requiere una conexión segura (HTTPS) o localhost para funcionar.");
        return;
      }

      // Pequeño retraso para asegurar que el DOM (#qr-reader) esté montado
      await new Promise(resolve => setTimeout(resolve, 250));

      const element = document.getElementById("qr-reader");
      if (!element) {
        console.error("qr-reader element not found in DOM");
        return;
      }

      try {
        // 2. Obtener Cámaras
        const devices = await Html5Qrcode.getCameras();
        setAvailableCameras(devices);

        if (!devices || devices.length === 0) {
          setCameraError("No se detectaron cámaras en este dispositivo.");
          return;
        }

        const cameraId = activeCameraId || { facingMode: "environment" };
        html5QrCode = new Html5Qrcode("qr-reader");

        await html5QrCode.start(
          cameraId,
          {
            fps: 20, // Aumentar FPS para detección más fluida
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 // Forzar formato cuadrado para evitar distorsiones lentas
          },
          (decodedText) => {
            // Ya no cerramos la cámara ni el modal automáticamente
            scanHandlerRef.current(decodedText);
          },
          undefined
        );
      } catch (err: any) {
        console.error("Error starting camera:", err);
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          setCameraError("Permiso denegado. Por favor habilita el acceso a la cámara en tu navegador.");
        } else if (err.name === 'NotFoundError' || err.message?.includes('Requested device not found')) {
          setCameraError("No se encontró la cámara solicitada o está ocupada por otra aplicación.");
        } else {
          setCameraError("Error al iniciar la cámara: " + (err.message || "Error desconocido"));
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error("Error stopping scanner", e));
      }
    };
  }, [isScannerOpen, activeCameraId]);

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

  const availableUnitsForProxy = useMemo(() => {
    return currentUnidades
      .filter(u =>
        !excludedUnitIds.has(u.id) &&
        ((u.nombre || '').toLowerCase().includes(unitSearch.toLowerCase()) ||
          (u.propietario || '').toLowerCase().includes(unitSearch.toLowerCase()))
      )
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [currentUnidades, excludedUnitIds, unitSearch]);

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

  const handleOpenNewProxy = (unit?: Unidad) => {
    setEditingProxy(null);
    setProxyForm({ nombre: '', documento: '' });
    if (unit) {
      setSelectedUnitIds([unit.id]);
      setUnitSearch('');
    } else {
      setSelectedUnitIds([]);
    }
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

  // NUEVA FUNCIÓN: Solo Generar/Regenerar Códigos (DB) y Activar Masivamente
  const handleGenerateCodes = async () => {
    if (isFinished) return;
    if (!confirm("Esto creará un código de acceso único y habilitará la entrada para todas las unidades al mismo tiempo.\n\n¿Desea activar masivamente a todos los asistentes?")) return;
    setIsGenerating(true);
    try {
      const result = await generateMassCredentials();
      alert(`Proceso completado.\n\nAccesos Creados: ${result.created}\nAccesos Actualizados: ${result.updated}\n\nAhora puede proceder a imprimir las fichas o asignar poderes.`);
    } catch (error) {
      alert("Error activando asistentes.");
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

        <div className="flex flex-col gap-6 mb-8">
          {/* Floating Feedback Alert */}
          {scanFeedback && (
            <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-xl shadow-2xl font-black text-sm uppercase flex items-center gap-3 animate-in slide-in-from-top-10
              ${scanFeedback.type === 'success' ? 'bg-emerald-600 text-white' : scanFeedback.type === 'error' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}
            `}>
              {scanFeedback.type === 'success' ? <CheckCircle2 size={24} /> : scanFeedback.type === 'error' ? <AlertTriangle size={24} /> : <AlertTriangle size={24} />}
              {scanFeedback.message}
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
            <div className="shrink-0 mb-1 lg:mb-0">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registro & Ingreso</h2>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 w-full lg:w-auto">
              {/* 1. Buscador */}
              <div className="relative flex-1 min-w-[180px] lg:w-60" data-tooltip="Buscar unidad por número o nombre">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar unidad..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-600 transition-colors"
                />
              </div>

              {/* 2. Escáner */}
              <button
                onClick={() => setIsScannerOpen(true)}
                disabled={isFinished}
                className={`flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-black uppercase text-xs shrink-0 ${isFinished ? 'opacity-50' : 'active:scale-95'}`}
                data-tooltip="Abrir escáner de cámara web"
              >
                <Camera size={16} /> <span className="hidden xl:inline">Escanear</span><span className="xl:hidden">Scan</span>
              </button>

              {/* 3. Activar (Generar Tokens) */}
              <button
                onClick={handleGenerateCodes}
                disabled={isGenerating || isFinished}
                className={`flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:bg-emerald-700 active:scale-95'}`}
                data-tooltip="Generar credenciales y activar todas las unidades"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                <span>Activar</span>
              </button>

              {/* 4. Imprimir */}
              <button
                onClick={handlePrintCredentials}
                disabled={isFinished}
                className={`flex-1 sm:flex-none bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:bg-slate-800 active:scale-95'}`}
                data-tooltip="Imprimir fichas de QR para asistentes"
              >
                <QrCode size={16} />
                <span>Imprimir</span>
              </button>

              {/* 5. Borrar */}
              <button
                onClick={handleClearCodes}
                disabled={isClearing || isFinished}
                className={`flex-1 sm:flex-none bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${isFinished ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 active:scale-95'}`}
                data-tooltip="Eliminar todos los tokens generados"
              >
                {isClearing ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                <span>Borrar</span>
              </button>

              {/* 6. Reporte Poderes */}
              <button
                onClick={() => setIsProxyReportOpen(true)}
                disabled={isFinished}
                className={`flex-1 sm:flex-none bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-sm transition-all border border-indigo-100 ${isFinished ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'hover:bg-indigo-100 active:scale-95'}`}
                data-tooltip="Ver reporte detallado de poderes y delegaciones"
              >
                <UserCog size={16} /> <span>Poderes</span>
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
                        {!asm?.esApoderado && !isPresent && (
                          <button
                            onClick={() => handleOpenNewProxy(u)}
                            disabled={isFinished}
                            className={`px-2 py-1.5 mr-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all flex items-center gap-1 w-[65px] justify-center ${isFinished ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-100'}`}
                            title="Asignar Poder"
                          >
                            <UserPlus size={10} className="hidden lg:block shrink-0" />
                            Poder
                          </button>
                        )}
                        {asm && (
                          <button
                            onClick={() => handleToggle(asm.id)}
                            disabled={isLoading || isFinished}
                            className={`min-w-[65px] sm:min-w-[75px] px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all flex items-center justify-center ${isFinished ? 'opacity-50 cursor-not-allowed' : ''} ${isPresent ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                          >
                            {isLoading ? <Loader2 size={10} className="animate-spin" /> : (isPresent ? 'OUT' : 'INGRESO')}
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
      {
        isMassPrintOpen && createPortal(
          <div className="fixed inset-0 z-[99999] bg-white flex flex-col print-modal-wrapper">
            <style>{`
              @media print {
                @page { size: letter; margin: 0.5cm; }
                
                html, body { 
                  height: auto !important; 
                  overflow: visible !important; 
                  background: white !important;
                  color: #000 !important;
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
                  border: 1px dashed #000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  margin: 0 !important;
                  padding: 12px !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: space-between !important;
                  color: #000 !important;
                }
                
                .print-card * {
                  color: #000 !important;
                  border-color: #000 !important;
                }
                
                .print-card .bg-slate-900, 
                .print-card .bg-black {
                  background-color: #000 !important;
                  color: #fff !important;
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
                    <div key={asm.id} className="print-card bg-white border border-dashed border-black p-4 flex items-center justify-between h-[6.8cm] relative overflow-hidden rounded-xl shadow-sm sm:shadow-none sm:rounded-none">

                      <div className="w-[55%] pr-4 overflow-hidden flex flex-col justify-center">
                        <h2 className="text-[10px] font-black uppercase text-black leading-none mb-1">{activeCopropiedad?.nombre}</h2>
                        <p className="text-[8px] font-bold uppercase text-black tracking-widest mb-3">{activeAsamblea?.nombre}</p>

                        <div className="inline-block bg-black text-white px-2 py-0.5 rounded text-[8px] font-black uppercase mb-1 w-fit">
                          {asm.esApoderado ? 'APODERADO' : 'PROPIETARIO'}
                        </div>
                        <h3 className="text-base font-black uppercase leading-tight text-black">{asm.nombre}</h3>
                        <p className="text-[12px] font-black text-black mt-2 leading-tight">UNIDAD: {myUnits.map(u => u.nombre).join(', ')}</p>
                        <p className="text-[11px] font-black mt-1 text-black uppercase">Coeficiente: {totalCoef.toFixed(3)}%</p>

                        <div className="flex items-center gap-1 mt-4 text-[7px] text-black">
                          <Scissors size={8} /> Recortar por la línea punteada
                        </div>
                      </div>

                      <div className="w-[45%] flex flex-col items-center justify-center pl-4 border-l border-black shrink-0 h-full">
                        <div className="w-full flex justify-center">
                          <QRCodeCanvas value={`${getQrBaseUrl()}/?token=${asm.token}`} size={165} level="M" includeMargin={true} />
                        </div>
                        <p className="text-2xl font-black font-mono mt-2 tracking-[0.2em] text-black leading-none">{asm.token}</p>
                        <p className="text-[8px] font-black uppercase text-black mt-1">Código de Acceso</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* QR Modal Individual */}
      {
        selectedForQR && (
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
        )
      }

      {/* Registrar Apoderado Modal */}
      {
        isVoterModalOpen && (
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

                    <div className="border border-slate-100 rounded-2xl max-h-[250px] overflow-y-auto bg-slate-50 flex flex-col divide-y divide-slate-100">
                      {availableUnitsForProxy.map(u => (
                        <div
                          key={u.id}
                          onClick={() => toggleUnitSelection(u.id)}
                          className={`p-3 cursor-pointer flex items-center justify-between transition-all ${selectedUnitIds.includes(u.id) ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-white hover:bg-slate-50'}`}
                        >
                          <div className="flex flex-col">
                            <p className={`font-black uppercase text-sm ${selectedUnitIds.includes(u.id) ? 'text-indigo-700' : 'text-slate-800'}`}>{u.nombre}</p>
                            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">{u.propietario || 'Sin Propietario'}</p>
                          </div>
                          <div>
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedUnitIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                              {selectedUnitIds.includes(u.id) && <CheckSquare size={14} />}
                            </div>
                          </div>
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
        )
      }

      {/* MODAL REPORTE DE PODERES */}
      {
        isProxyReportOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 no-print">
            <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reporte de Poderes</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">{activeCopropiedad?.nombre} - {activeAsamblea?.nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                    const printContent = document.getElementById('proxy-report-print-content');
                    if (printContent) {
                      const originalBody = document.body.innerHTML;
                      document.body.innerHTML = printContent.innerHTML;
                      window.print();
                      document.body.innerHTML = originalBody;
                      window.location.reload();
                    } else {
                      window.print();
                    }
                  }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-indigo-700 transition" title="Muestra solo este documento al imprimir" >
                    <Printer size={16} /> Imprimir
                  </button>
                  <button onClick={() => setIsProxyReportOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 flex-1 relative" id="proxy-report-print-content">
                {/* Estilos para que el reporte se imprima limpio si usamos el truco de reemplazar el body */}
                <style>{`
                         @media print {
                             @page { margin: 1.5cm; }
                             body { background: white !important; font-family: sans-serif; }
                             .no-print { display: none !important; }
                             .print-only { display: block !important; }
                         }
                    `}</style>
                <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4 print-only">
                  <h1 className="text-2xl font-black uppercase text-center">{activeCopropiedad?.nombre}</h1>
                  <h2 className="text-lg font-bold uppercase text-center text-slate-600 mt-2">Reporte de Poderes / Representación</h2>
                  <p className="text-sm font-medium text-center text-slate-500 mt-1">{activeAsamblea?.nombre}</p>
                </div>

                {currentAsambleistas.filter(a => a.esApoderado).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase text-sm">
                    No hay apoderados registrados en esta asamblea.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {currentAsambleistas.filter(a => a.esApoderado).map(asm => {
                      const myUnits = unidades.filter(u => asm.unidadesIds.includes(u.id));
                      const totalCoef = myUnits.reduce((acc, u) => acc + (u.coeficiente || u.coefficient || 0), 0);
                      return (
                        <div key={asm.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center break-inside-avoid shadow-none print:border-black print:rounded-none">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded uppercase font-black print:border print:border-black">Apoderado</span>
                              <h4 className="font-black text-slate-900 uppercase text-sm sm:text-base">{asm.nombre}</h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Documento: <span className="font-bold">{asm.documento || 'No registrado'}</span></p>
                          </div>
                          <div className="flex-1 w-full sm:w-auto mt-2 sm:mt-0">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Unidades Representadas ({myUnits.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {myUnits.map(u => (
                                <span key={u.id} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 print:border-black">
                                  {u.nombre}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="w-full sm:w-32 text-left sm:text-right mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400">Poder Total</p>
                            <span className="text-lg font-black text-indigo-600 font-mono leading-none">{totalCoef.toFixed(3)}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* MODAL ESCANER CAMARA WEB */}
      {
        isScannerOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Camera className="text-indigo-600" size={20} />
                  <h3 className="text-base font-black text-slate-900 uppercase">Escanear Credencial</h3>
                </div>
                <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
              </div>
              <div className="p-4 bg-slate-100 flex flex-col items-center min-h-[300px] justify-center">
                {/* Contenedor de cámara SIEMPRE presente en el DOM para evitar re-inicializaciones fallidas */}
                <div
                  id="qr-reader"
                  className={`w-full max-w-[350px] mx-auto rounded-xl overflow-hidden bg-white shadow-inner border-4 border-white shadow-xl ${cameraError ? 'hidden' : 'block'}`}
                ></div>

                {cameraError ? (
                  <div className="w-full bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center text-center animate-in zoom-in">
                    <AlertTriangle className="text-red-600 mb-3" size={40} />
                    <h4 className="font-black text-red-900 uppercase text-xs mb-2">Error de Cámara</h4>
                    <p className="text-[11px] font-bold text-red-700 leading-relaxed max-w-[280px]">{cameraError}</p>

                    <div className="mt-6 flex flex-col gap-2 w-full">
                      <button
                        onClick={() => { setCameraError(null); setActiveCameraId(null); }}
                        className="bg-red-600 text-white py-2 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition"
                      >
                        Reintentar
                      </button>
                      <p className="text-[9px] text-slate-400 font-medium">Tip: Asegúrate de que ninguna otra app use la cámara y de haber aceptado los permisos.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {availableCameras.length > 1 && (
                      <div className="mt-4 w-full px-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block ml-1">Cambiar Cámara</label>
                        <select
                          value={activeCameraId || ''}
                          onChange={(e) => setActiveCameraId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold uppercase shadow-sm outline-none focus:border-indigo-600"
                        >
                          {availableCameras.map(cam => (
                            <option key={cam.id} value={cam.id}>{cam.label || `Cámara ${availableCameras.indexOf(cam) + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <p className="mt-4 text-xs font-bold text-slate-500 uppercase text-center">Apunte el código QR hacia la cámara para registrar el ingreso automáticamente.</p>

                    <button
                      onClick={() => setIsScannerOpen(false)}
                      className="mt-6 w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Finalizar Escaneo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
