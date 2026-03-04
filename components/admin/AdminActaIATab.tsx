
import React, { useState, useRef } from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import { 
  Sparkles, Mic, FileAudio, UploadCloud, Loader2, Save, FileText, Lock, 
  CheckCircle2, AlertTriangle, Printer, X, FileCheck, Trash2, Download, AlertCircle, XCircle, Copy, ExternalLink, ShoppingBag
} from 'lucide-react';

export const AdminActaIATab: React.FC = () => {
  const { 
    selectedAsambleaId, 
    selectedCopropiedadId,
    asambleas, 
    copropiedades,
    asambleistas,
    preguntas,
    votos,
    unidades, // Added to get unit details
    generateAssemblySummary, 
    saveManualSummary,
    getVoterCoefficient,
    calculateResults,
    aiStatus 
  } = useAssembly();

  const activeAsamblea = asambleas.find(a => a.id === selectedAsambleaId);
  const activeCopropiedad = copropiedades.find(c => c.id === selectedCopropiedadId);
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableSummary, setEditableSummary] = useState(activeAsamblea?.resumenIA || '');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if feature is enabled
  const isEnabled = activeAsamblea?.actaInteligenteEnabled;
  
  // Conteo de Generaciones (Límite 2)
  const currentGenCount = activeAsamblea?.aiGenerationCount || 0;
  const maxGenerations = 2;
  const attemptsLeft = Math.max(0, maxGenerations - currentGenCount);
  const isLimitReached = currentGenCount >= maxGenerations;

  // --- CALCULOS PARA EL ACTA ---
  const currentAsmUsers = asambleistas.filter(a => a.asambleaId === selectedAsambleaId);
  const attendingUsers = currentAsmUsers.filter(a => a.asistenciaConfirmada);
  const totalPresent = attendingUsers.length;
  const totalCoefAttendance = attendingUsers.reduce((acc, a) => acc + getVoterCoefficient(a), 0);
  const asambleaPreguntas = preguntas.filter(p => p.asambleaId === selectedAsambleaId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleProcessAudio = async () => {
    if (!file) return;
    setErrorMsg(null);

    // Validar límite antes de procesar
    if (isLimitReached) {
        setErrorMsg(`Límite alcanzado. Ya ha utilizado los ${maxGenerations} procesamientos incluidos.`);
        return;
    }

    // Sin límite de tamaño: La lógica de fragmentación (Chunking) en el Context se encarga.
    setIsProcessing(true);
    try {
      await generateAssemblySummary(file);
      setFile(null);
    } catch (error: any) {
      console.error(error);
      let msg = error.message || "Error procesando el audio. Verifique que el archivo no esté corrupto.";
      if (msg.includes('size')) msg = "Error de lectura del archivo. Intente con otro navegador.";
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveManual = async () => {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
          await saveManualSummary(editableSummary);
          setSuccessMsg("Acta guardada correctamente.");
          setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
          setErrorMsg("Error guardando: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };

  const executeReset = async () => {
      setShowResetConfirm(false);
      setEditableSummary('');
      setFile(null);
      setErrorMsg(null);
      await saveManualSummary(''); 
  };

  const formatTextForPreview = (text: string) => {
    if (!text) return <p>No hay resumen narrativo disponible.</p>;

    // Split paragraphs
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      let trimmed = line.trim();
      
      // Helper to parse Bold: **text**
      const parseBold = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
      };

      if (!trimmed) {
        // Empty line, flush list if any
        if (listItems.length > 0) {
            nodes.push(<ul key={`ul-${idx}`} style={{paddingLeft: '20px', listStyleType: 'disc', marginBottom: '10px'}}>{listItems}</ul>);
            listItems = [];
        }
        return;
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
         // It's a list item
         // remove marker (first 2 chars '* ' or '- ')
         const content = trimmed.substring(1).trim(); 
         listItems.push(<li key={`li-${idx}`} style={{marginBottom: '4px'}}>{parseBold(content)}</li>);
      } else {
         // Flush list if any
         if (listItems.length > 0) {
            nodes.push(<ul key={`ul-${idx}`} style={{paddingLeft: '20px', listStyleType: 'disc', marginBottom: '10px'}}>{listItems}</ul>);
            listItems = [];
         }
         // Normal paragraph
         nodes.push(<p key={`p-${idx}`} style={{marginBottom: '10px', textAlign: 'justify'}}>{parseBold(trimmed)}</p>);
      }
    });

    if (listItems.length > 0) {
        nodes.push(<ul key={`ul-end`} style={{paddingLeft: '20px', listStyleType: 'disc', marginBottom: '10px'}}>{listItems}</ul>);
    }

    return <div>{nodes}</div>;
  };

  const exportToWord = () => {
      const element = document.getElementById('ai-minutes-content');
      if (!element) return;

      const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
              <meta charset="utf-8">
              <title>Acta de Asamblea</title>
              <style>
                  body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000; }
                  h1 { font-size: 16pt; text-transform: uppercase; font-weight: bold; text-align: center; margin-bottom: 12px; }
                  h2 { font-size: 14pt; text-transform: uppercase; font-weight: bold; text-align: center; margin-bottom: 8px; }
                  p { margin-bottom: 12px; text-align: justify; }
                  strong, b { font-weight: bold; }
                  ul { list-style-type: disc; margin-left: 20px; margin-bottom: 12px; }
                  li { margin-bottom: 4px; }
                  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                  th, td { border: 1px solid #000; padding: 5px; font-size: 10pt; }
                  .text-center { text-align: center; }
                  .text-right { text-align: right; }
                  .text-justify { text-align: justify; }
                  .font-bold { font-weight: bold; }
                  .uppercase { text-transform: uppercase; }
              </style>
          </head>
          <body>
              ${element.innerHTML}
          </body>
          </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
          type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Acta_${activeAsamblea?.nombre || 'IA'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Sync state if external update happens
  React.useEffect(() => {
      if (activeAsamblea?.resumenIA) {
          setEditableSummary(activeAsamblea.resumenIA);
      }
  }, [activeAsamblea?.resumenIA]);

  if (!isEnabled) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl mb-6">
                  <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase mb-2">Módulo Premium: Acta Inteligente</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium text-sm leading-relaxed">
                  Esta funcionalidad utiliza Inteligencia Artificial avanzada para escuchar la grabación de su asamblea y redactar automáticamente el acta formal, ahorrándole horas de trabajo.
              </p>
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm max-w-sm w-full mb-8">
                  <h3 className="font-bold text-indigo-900 uppercase text-xs mb-4">Incluye:</h3>
                  <ul className="text-left space-y-3 text-xs text-slate-600">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Transcripción y Resumen IA</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Identificación de decisiones</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500"/> Formato legal sugerido</li>
                  </ul>
              </div>
              <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-not-allowed opacity-80">
                  <a 
                      href="https://wa.me/573502809714?text=Hola,%20adjunto%20comprobante%20de%20pago%20para%20activar%20mi%20asamblea" 
                      target="_blank" 
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all"
                    >  Contactar para Activar  </a>
              </button>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
        {/* SUCCESS TOAST */}
        {successMsg && (
            <div className="absolute top-0 right-0 left-0 z-50 flex justify-center pointer-events-none">
                <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
                    <CheckCircle2 size={18} />
                    <span className="font-black uppercase text-xs">{successMsg}</span>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 no-print">
            <div>
                <h2 className="text-xl font-black text-indigo-900 uppercase flex items-center gap-2">
                    <Sparkles size={24} className="text-indigo-600"/> Generador de Actas IA
                </h2>
                <p className="text-xs text-indigo-700 font-medium mt-1">Sube el audio de la asamblea y deja que la IA redacte por ti.</p>
            </div>
            <div className="flex gap-2">
                {editableSummary && (
                    <>
                        <button 
                            onClick={() => setShowResetConfirm(true)}
                            className="bg-white border border-red-200 text-red-500 p-3 rounded-xl hover:bg-red-50 transition-all shadow-sm"
                            title="Descartar y Nuevo Audio"
                        >
                            <Trash2 size={16}/>
                        </button>
                        <button 
                            onClick={() => setShowPdfPreview(true)}
                            className="bg-white border border-indigo-200 text-indigo-700 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
                            title="Ver Documento para Imprimir"
                        >
                            <FileCheck size={16}/> Vista Previa
                        </button>
                        <button 
                            onClick={handleSaveManual}
                            disabled={isSaving}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Guardar Cambios
                        </button>
                    </>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
            {/* Upload Area - Hidden if summary exists */}
            {!editableSummary && (
                <div className="lg:col-span-1 space-y-6 animate-in slide-in-from-left duration-300">
                    
                    {/* ALERTA DE LÍMITE DE PROCESAMIENTO */}
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isLimitReached ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                        <AlertCircle size={20} className={isLimitReached ? 'text-amber-500' : 'text-blue-500'} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">
                                {isLimitReached ? 'Límite de Procesamiento Alcanzado' : 'Intentos Disponibles'}
                            </p>
                            <p className="text-xs font-bold mt-1">
                                Ha utilizado {currentGenCount} de {maxGenerations} generaciones permitidas.
                            </p>
                        </div>
                    </div>

                    <div className={`border-2 border-dashed rounded-[32px] p-8 text-center transition-all ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-white'}`}>
                        <input 
                            type="file" 
                            accept="audio/*" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden" 
                            disabled={isLimitReached}
                        />
                        
                        {!file ? (
                            <div onClick={() => !isLimitReached && fileInputRef.current?.click()} className={`space-y-4 ${isLimitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-400">
                                    <UploadCloud size={32}/>
                                </div>
                                <div>
                                    <p className="font-black text-slate-700 uppercase text-sm">Subir Audio</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">MP3, M4A, WAV (Sin límite de tamaño)</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500">
                                    <FileAudio size={32}/>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-black text-emerald-800 uppercase text-xs truncate px-4">{file.name}</p>
                                    {/* Fix: Guard file.size access */}
                                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB</p>
                                </div>
                                <div className="flex gap-2 justify-center pt-2">
                                    <button onClick={() => setFile(null)} className="text-[10px] font-black text-red-500 uppercase hover:underline bg-white px-3 py-1 rounded-lg">Cambiar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <div className="flex items-start gap-3">
                                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-black text-[10px] uppercase text-red-700">Error</h4>
                                    <p className="text-[10px] text-red-600 font-medium leading-relaxed">{errorMsg}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLimitReached ? (
                        <a 
                            href="https://wa.me/573502809714?text=Hola,%20necesito%20adquirir%20procesamientos%20extra%20de%20Acta%20IA"
                            target="_blank"
                            className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all bg-amber-500 text-white hover:bg-amber-600"
                        >
                            <ShoppingBag size={16} /> Adquirir Procesamientos Extra
                        </a>
                    ) : (
                        <button 
                            onClick={handleProcessAudio}
                            disabled={!file || isProcessing}
                            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all ${!file || isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                        >
                            {isProcessing ? (
                                <><Loader2 size={16} className="animate-spin"/> {aiStatus || 'Procesando...'}</>
                            ) : (
                                <><Mic size={16}/> Generar Acta ({attemptsLeft} restantes)</>
                            )}
                        </button>
                    )}

                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3">
                        <AlertTriangle size={20} className="text-indigo-500 shrink-0"/>
                        <div className="space-y-2">
                            <p className="text-[10px] text-indigo-800 font-medium leading-relaxed">
                                <strong>Tecnología Smart-Chunking:</strong> El sistema dividirá automáticamente archivos grandes en fragmentos seguros de 10MB para analizarlos secuencialmente sin errores.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div className={`${editableSummary ? 'lg:col-span-3' : 'lg:col-span-2'} h-full min-h-[500px] transition-all duration-500`}>
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400"/>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Borrador del Acta (Contenido de Audio)</span>
                    </div>
                    <textarea 
                        value={editableSummary}
                        onChange={(e) => setEditableSummary(e.target.value)}
                        placeholder="El resumen generado por la IA aparecerá aquí. Podrá editarlo antes de exportar. Utilice **negrita** para títulos o * para listas."
                        className="flex-1 w-full p-6 resize-none focus:outline-none text-sm leading-relaxed text-slate-700 font-medium font-serif"
                    />
                </div>
            </div>
        </div>

        {/* CUSTOM CONFIRM MODAL (RESET) */}
        {showResetConfirm && (
            <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase text-center mb-2">¿Descartar Acta?</h3>
                    <p className="text-xs text-slate-500 text-center font-medium mb-6">
                        Esta acción borrará el borrador actual y le permitirá subir un nuevo audio. No se puede deshacer.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 font-black uppercase text-xs hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={executeReset}
                            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black uppercase text-xs hover:bg-red-700 transition-colors shadow-lg"
                        >
                            Sí, Descartar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL VISTA PREVIA PDF/WORD */}
        {showPdfPreview && (
            <div className="fixed inset-0 z-[300] bg-slate-900/50 flex justify-center items-start overflow-y-auto pt-4 sm:pt-10 print:pt-0 print:block print:inset-0 print:bg-white print:static">
                <div className="bg-white w-full max-w-[21.6cm] min-h-[27.9cm] shadow-2xl rounded-t-[32px] print:rounded-none print:shadow-none print:w-full print:max-w-none flex flex-col">
                    
                    {/* Toolbar No Imprimible */}
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 p-4 flex justify-between items-center rounded-t-[32px] no-print">
                        <h3 className="font-black text-slate-900 uppercase flex items-center gap-2">
                            <FileText className="text-indigo-600"/> Vista Previa
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => window.print()}
                                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <Printer size={16}/> Imprimir
                            </button>
                            <button 
                                onClick={exportToWord}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-indigo-700 shadow-lg"
                            >
                                <FileText size={16}/> Guardar Word
                            </button>
                            <button 
                                onClick={() => setShowPdfPreview(false)}
                                className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    </div>

                    {/* Contenido Imprimible (Formato Hoja) */}
                    <div id="ai-minutes-content" className="p-[2.5cm] text-justify font-serif leading-relaxed text-slate-900 print:p-0 print:m-0">
                        {/* Encabezado Simple */}
                        <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                            <h1 className="text-xl font-bold uppercase mb-1">Acta de Asamblea de Copropietarios</h1>
                            <h2 className="text-lg font-bold uppercase text-slate-700">{activeAsamblea?.nombre}</h2>
                            <p className="text-sm font-bold uppercase mt-4">{activeCopropiedad?.nombre}</p>
                            <p className="text-xs uppercase">NIT: {activeCopropiedad?.nit}</p>
                            <p className="text-xs mt-1">{activeCopropiedad?.direccion}</p>
                        </div>

                        {/* 1. Información General */}
                        <section className="mb-6 break-inside-avoid">
                            <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3 text-sm">1. Información de la Sesión</p>
                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                                <p><strong>Fecha:</strong> {activeAsamblea?.fecha}</p>
                                <p><strong>Tipo:</strong> {activeAsamblea?.tipo}</p>
                                <p><strong>Hora de Inicio:</strong> {activeAsamblea?.horaInicioReal ? new Date(activeAsamblea.horaInicioReal).toLocaleTimeString() : 'N/A'}</p>
                                <p><strong>Estado:</strong> {activeAsamblea?.status}</p>
                            </div>
                        </section>

                        {/* 2. Verificación del Quórum */}
                        <section className="mb-6 break-inside-avoid">
                            <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3 text-sm">2. Verificación del Quórum</p>
                            <p className="text-xs text-justify">
                                Se deja constancia de que, de acuerdo con el sistema de registro digital, se encuentran presentes en la sesión un total de <strong>{totalPresent}</strong> asambleístas, 
                                que representan un coeficiente de copropiedad del <strong>{totalCoefAttendance.toFixed(3)}%</strong>. 
                                Con base en lo anterior, se declara que {totalCoefAttendance > 50 ? 'EXISTE' : 'NO EXISTE'} quórum deliberatorio y decisorio según los términos de la Ley 675 de 2001.
                            </p>
                        </section>

                        {/* 3. Narrativa IA */}
                        <section className="mb-6">
                            <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3 text-sm">3. Desarrollo del Orden del Día (Narrativa)</p>
                            <div className="text-xs text-justify leading-loose">
                                {formatTextForPreview(editableSummary)}
                            </div>
                        </section>

                        {/* 4. Resultados de Votaciones (Anexo Automático) */}
                        <section className="print:break-before-page">
                            <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-4 text-sm">4. Anexo: Resultados de Votaciones Digitales</p>
                            <p className="mb-4 text-xs italic text-slate-500">A continuación se detallan los resultados registrados electrónicamente en la plataforma:</p>
                            
                            <div className="space-y-6">
                                {asambleaPreguntas.map((p, idx) => {
                                    const results = calculateResults(p.id, 'coeficiente');
                                    const totalVotos = votos.filter(v => v.preguntaId === p.id).length;
                                    
                                    return (
                                        <div key={p.id} className="pl-4 border-l-2 border-slate-100 break-inside-avoid py-2">
                                            <p className="font-bold text-slate-800 mb-1 text-xs">Punto {idx + 1}: {p.texto}</p>
                                            <p className="text-[10px] uppercase text-slate-400 mb-2 italic">Participación: {totalVotos} votos</p>
                                            
                                            <table className="w-full border-collapse border border-slate-200 text-[10px]">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th className="border border-slate-200 p-1 text-left">Opción</th>
                                                        <th className="border border-slate-200 p-1 text-right">Coeficiente (%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.map((res, ridx) => (
                                                        <tr key={ridx}>
                                                            <td className="border border-slate-200 p-1 uppercase">{res.label}</td>
                                                            <td className="border border-slate-200 p-1 text-right font-bold">{res.value.toFixed(2)}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 5. Listado de Asistentes (Nuevo Anexo) */}
                        <section className="mt-8 break-inside-avoid">
                            <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-4 text-sm">5. Anexo: Registro de Asistencia</p>
                            <p className="mb-4 text-xs italic text-slate-500">Relación de unidades que conformaron el quórum:</p>
                            
                            <table className="w-full border-collapse border border-slate-200 text-[10px]">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="border border-slate-200 p-1 text-left w-20">Unidad</th>
                                        <th className="border border-slate-200 p-1 text-left">Asambleísta</th>
                                        <th className="border border-slate-200 p-1 text-center w-16">Tipo</th>
                                        <th className="border border-slate-200 p-1 text-right w-20">Coef.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendingUsers.map((user) => {
                                        const userUnits = unidades.filter(u => user.unidadesIds.includes(u.id));
                                        return userUnits.map((u) => (
                                            <tr key={u.id}>
                                                <td className="border border-slate-200 p-1 font-bold">{u.nombre}</td>
                                                <td className="border border-slate-200 p-1 truncate max-w-[150px]">{user.nombre}</td>
                                                <td className="border border-slate-200 p-1 text-center uppercase text-[8px]">{user.esApoderado ? 'Poder' : 'Prop.'}</td>
                                                <td className="border border-slate-200 p-1 text-right font-mono">{(u.coeficiente || 0).toFixed(3)}%</td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </section>

                        {/* Firmas */}
                        <div className="mt-20 pt-4 break-inside-avoid">
                            <div className="grid grid-cols-2 gap-12 mb-12">
                                <div>
                                    <div className="border-t border-slate-800 w-full mb-2"></div>
                                    <p className="font-bold uppercase text-xs">Presidente de Asamblea</p>
                                    <p className="text-[10px] text-slate-500">C.C.</p>
                                </div>
                                <div>
                                    <div className="border-t border-slate-800 w-full mb-2"></div>
                                    <p className="font-bold uppercase text-xs">Secretario de Asamblea</p>
                                    <p className="text-[10px] text-slate-500">C.C.</p>
                                </div>
                            </div>
                            <div className="flex justify-center mb-12">
                                <div className="w-1/2 text-center">
                                    <div className="border-t border-slate-800 w-full mb-2 mx-auto"></div>
                                    <p className="font-bold uppercase text-xs">Administrador</p>
                                    <p className="text-[10px] text-slate-500">C.C.</p>
                                </div>
                            </div>

                            {/* Comité Verificador */}
                            <div className="mt-8 text-xs">
                                <p className="font-bold uppercase text-center mb-8 text-slate-400 text-[10px] tracking-widest">Comité de Verificación del Acta</p>
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="text-center">
                                        <div className="border-t border-slate-800 w-full mb-2"></div>
                                        <p className="font-bold uppercase">Verificador 1</p>
                                        <p className="text-[10px] text-slate-500">Nombre / C.C.</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t border-slate-800 w-full mb-2"></div>
                                        <p className="font-bold uppercase">Verificador 2</p>
                                        <p className="text-[10px] text-slate-500">Nombre / C.C.</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t border-slate-800 w-full mb-2"></div>
                                        <p className="font-bold uppercase">Verificador 3</p>
                                        <p className="text-[10px] text-slate-500">Nombre / C.C.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pie de página */}
                        <div className="mt-12 pt-8 border-t border-slate-300 text-center text-[10px] text-slate-400 italic break-inside-avoid">
                            Documento generado automáticamente por el módulo de Inteligencia Artificial de GestorPH.
                            <br/>Requiere revisión y firma del Presidente y Secretario de la asamblea.
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
