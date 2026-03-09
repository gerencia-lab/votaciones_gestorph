
import React, { useState, useEffect, useMemo } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Layout } from './Layout.tsx';
import {
   Users, Vote, Building2, FileText, Presentation,
   ArrowLeft, Play, Power, LogOut, Calendar,
   AlertTriangle, X, Printer, Plus, Edit3, UserCog, Save,
   Loader2, Mail, MapPin, Lock, ShieldCheck, FileCheck, UploadCloud, Eye, CreditCard, CheckCircle2, Hash, Sparkles, Award, ChevronRight, History, Trash2, LayoutGrid, List, ArrowRight
} from 'lucide-react';
import { AdminAsistenciaTab } from './admin/AdminAsistenciaTab.tsx';
import { AdminVotacionesTab } from './admin/AdminVotacionesTab.tsx';
import { AdminUnidadesTab } from './admin/AdminUnidadesTab.tsx';
import { AdminActaIATab } from './admin/AdminActaIATab.tsx';
import { MinutesPreview } from './admin/MinutesPreview.tsx';

interface AdminViewProps {
   setView: (view: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin' | 'payments' | 'manual' | 'loyalty') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ setView }) => {
   const {
      currentAdmin,
      selectedCopropiedadId,
      selectedAsambleaId,
      copropiedades,
      asambleas,
      asambleistas,
      unidades,
      loyaltyTransactions,
      selectCopropiedad,
      selectAsamblea,
      logoutAdmin,
      startAssembly,
      endAssembly,
      addCopropiedad,
      updateCopropiedad,
      createAsamblea,
      updateAdmin
   } = useAssembly();

   const [activeTab, setActiveTab] = useState<'votaciones' | 'asistencia' | 'unidades' | 'acta_ia'>('asistencia');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalType, setModalType] = useState<'MINUTES' | 'CONFIRM_END' | 'BUILDING' | 'PROFILE' | 'ASSEMBLY' | null>(null);
   const [buildingViewMode, setBuildingViewMode] = useState<'grid' | 'list'>('grid');

   const [showDataPolicy, setShowDataPolicy] = useState(false);

   const [buildingForm, setBuildingForm] = useState({ id: '', nombre: '', nit: '', direccion: '', ciudad: '', email: '', representacionLegal: '', cantidadUnidades: '' });
   const [assemblyForm, setAssemblyForm] = useState({ nombre: '', tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA', fecha: '' });
   const [profileForm, setProfileForm] = useState({ nombre: '', email: '', telefono: '', password: '', cedula: '', direccion: '' });
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [isTogglingSession, setIsTogglingSession] = useState(false);

   const activeCopropiedad = copropiedades.find(c => c.id === selectedCopropiedadId);
   const activeAsamblea = asambleas.find(a => a.id === selectedAsambleaId);

   // CÁLCULO DINÁMICO DE PUNTOS PARA EL BADGE SUPERIOR
   const validatedBalance = useMemo(() => {
      if (!currentAdmin) return 0;
      return loyaltyTransactions
         .filter(t => t.adminId === currentAdmin.id && t.status === 'APROBADO')
         .reduce((acc, t) => acc + t.amount, 0);
   }, [loyaltyTransactions, currentAdmin?.id]);

   // CÁLCULO DE QUÓRUM EN SALA (HEADER)
   const currentUnidades = useMemo(() => unidades.filter(u => u.copropiedadId === selectedCopropiedadId), [unidades, selectedCopropiedadId]);

   const quorumData = useMemo(() => {
      let totalCoef = 0;
      let count = 0;
      currentUnidades.forEach(u => {
         // Check if ANY asambleista representing this unit is present
         const isRepresented = asambleistas.some(a =>
            a.asambleaId === selectedAsambleaId &&
            a.unidadesIds?.includes(u.id) &&
            a.asistenciaConfirmada
         );

         if (isRepresented) {
            totalCoef += Number(u.coeficiente || u.coefficient || 0);
            count++;
         }
      });
      return { totalCoef, count };
   }, [currentUnidades, asambleistas, selectedAsambleaId]);

   useEffect(() => {
      const savedTab = sessionStorage.getItem('adminActiveTab');
      if (savedTab && (savedTab === 'votaciones' || savedTab === 'asistencia' || savedTab === 'unidades' || savedTab === 'acta_ia')) {
         setActiveTab(savedTab as any);
         sessionStorage.removeItem('adminActiveTab');
      }
   }, []);

   useEffect(() => {
      if (!currentAdmin) setView('home');
      else {
         setProfileForm({
            nombre: currentAdmin.nombre || '',
            email: currentAdmin.email || '',
            telefono: currentAdmin.telefono || '',
            password: '',
            cedula: currentAdmin.cedula || '',
            direccion: currentAdmin.direccion || ''
         });
      }
   }, [currentAdmin, setView]);

   if (!currentAdmin) return null;

   // Helper para formato de miles
   const formatPoints = (points: number) => points.toLocaleString('es-CO');

   // --- HANDLERS ---
   const validateBuilding = () => {
      const newErrors: Record<string, string> = {};
      if (!buildingForm.nombre.trim()) newErrors.nombre = 'Obligatorio';
      if (!buildingForm.nit.trim()) newErrors.nit = 'Obligatorio';
      if (!buildingForm.direccion.trim()) newErrors.direccion = 'Obligatorio';
      if (!buildingForm.cantidadUnidades) newErrors.cantidadUnidades = 'Obligatorio';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   const handleSaveBuilding = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateBuilding()) return;
      setIsTogglingSession(true);
      try {
         const payload = {
            nombre: buildingForm.nombre,
            nit: buildingForm.nit,
            direccion: buildingForm.direccion,
            ciudad: buildingForm.ciudad,
            email: buildingForm.email,
            representacionLegal: buildingForm.representacionLegal,
            cantidadUnidades: parseInt(buildingForm.cantidadUnidades) || 0
         };

         if (buildingForm.id) {
            await updateCopropiedad(buildingForm.id, payload);
         } else {
            await addCopropiedad({ ...payload, adminIds: [currentAdmin.id] });
         }
         setIsModalOpen(false);
      } catch (err) {
         alert("Error al guardar copropiedad");
      } finally {
         setIsTogglingSession(false);
      }
   };

   const handleSaveAssembly = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assemblyForm.nombre.trim() || !assemblyForm.fecha) return alert("Nombre y Fecha son obligatorios");
      setIsTogglingSession(true);
      try {
         await createAsamblea({
            ...assemblyForm,
            copropiedadId: selectedCopropiedadId,
            pagoConfirmado: false
         });
         setIsModalOpen(false);
         setAssemblyForm({ nombre: '', tipo: 'ORDINARIA', fecha: '' });
      } catch (err) {
         console.error(err);
         alert("Error al crear la asamblea.");
      } finally {
         setIsTogglingSession(false);
      }
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         if (file.size > 2 * 1024 * 1024) {
            alert("El archivo es demasiado grande. Máximo 2MB.");
            return;
         }
         const reader = new FileReader();
         reader.onloadend = () => {
            setBuildingForm(prev => ({ ...prev, representacionLegal: reader.result as string }));
         };
         reader.readAsDataURL(file);
      }
   };

   const removeLegalDoc = (e: React.MouseEvent) => {
      e.preventDefault();
      if (confirm("¿Seguro que desea eliminar el documento actual? Podrá subir uno nuevo inmediatamente.")) {
         setBuildingForm(prev => ({ ...prev, representacionLegal: '' }));
      }
   };

   const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profileForm.nombre.trim() || !profileForm.email.trim()) return alert("Nombre y Email son obligatorios");
      setIsTogglingSession(true);
      try {
         await updateAdmin(currentAdmin.id, profileForm);
         alert("Perfil actualizado.");
         setIsModalOpen(false);
      } catch (err) {
         alert("Error actualizando perfil.");
      } finally {
         setIsTogglingSession(false);
      }
   };

   const openBuildingModal = (building?: any) => {
      setErrors({});
      if (building) {
         setBuildingForm({
            id: building.id,
            nombre: building.nombre,
            nit: building.nit,
            direccion: building.direccion,
            ciudad: building.ciudad || '',
            email: building.email || '',
            representacionLegal: building.representacionLegal || '',
            cantidadUnidades: building.cantidadUnidades ? String(building.cantidadUnidades) : ''
         });
      } else {
         setBuildingForm({ id: '', nombre: '', nit: '', direccion: '', ciudad: '', email: '', representacionLegal: '', cantidadUnidades: '' });
      }
      setModalType('BUILDING');
      setIsModalOpen(true);
   };

   const exportToWord = () => {
      const element = document.getElementById('manual-minutes-content');
      if (!element) return;
      const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset="utf-8"><title>Acta</title></head><body>${element.innerHTML}</body></html>
      `;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_${activeAsamblea?.nombre || 'Votaciones'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleStart = async () => { if (selectedAsambleaId) await startAssembly(selectedAsambleaId); }
   const handleEnd = async () => { if (selectedAsambleaId) { await endAssembly(selectedAsambleaId); setIsModalOpen(false); } }

   // --- VISTA 1: SELECCIÓN DE COPROPIEDAD ---
   if (!selectedCopropiedadId) {
      const myCopropiedades = copropiedades.filter(c => {
         const ids = c.adminIds || (c.adminId ? [c.adminId] : []);
         return ids.includes(currentAdmin.id);
      });

      return (
         <Layout
            title={`Panel de ${currentAdmin.nombre}`}
            onBackToHome={() => setView('home')}
            rightContent={
               <button
                  onClick={() => setView('loyalty')}
                  className="bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm animate-in slide-in-from-right-4 hover:bg-amber-50 transition-colors cursor-pointer"
                  title="Ver Historial de Puntos"
               >
                  <Award size={14} className="text-amber-500" />
                  <span>{formatPoints(validatedBalance)} Puntos</span>
               </button>
            }
         >
            <div className="space-y-6 animate-in fade-in duration-300">
               {/* Header con Acciones */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm gap-4">
                  <div>
                     <h2 className="text-xl font-black text-slate-900 uppercase">Mis Copropiedades</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Seleccione un edificio para gestionar</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                     {/* VIEW TOGGLES */}
                     <div className="flex bg-slate-100 p-1 rounded-xl mr-2 shrink-0">
                        <button
                           onClick={() => setBuildingViewMode('grid')}
                           className={`p-2 rounded-lg transition-all ${buildingViewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <LayoutGrid size={16} />
                        </button>
                        <button
                           onClick={() => setBuildingViewMode('list')}
                           className={`p-2 rounded-lg transition-all ${buildingViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <List size={16} />
                        </button>
                     </div>

                     <button onClick={() => { setModalType('PROFILE'); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm transition-all">
                        <UserCog size={16} /> Mi Cuenta
                     </button>
                     <button onClick={() => openBuildingModal()} className="flex-1 sm:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                        <Plus size={16} /> Agregar Edificio
                     </button>
                     <button onClick={logoutAdmin} className="flex-1 sm:flex-none bg-slate-100 text-slate-500 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <LogOut size={16} /> Salir
                     </button>
                  </div>
               </div>

               {buildingViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {myCopropiedades.map(cp => {
                        const unitCount = unidades.filter(u => u.copropiedadId === cp.id).length;
                        return (
                           <div key={cp.id} className="bg-white p-6 rounded-[32px] border-2 border-slate-100 hover:border-indigo-600 hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer" onClick={() => selectCopropiedad(cp.id)}>
                              <div className="flex justify-between items-start mb-4 relative z-10">
                                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Building2 size={24} />
                                 </div>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); openBuildingModal(cp); }}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors z-20"
                                    title="Editar Información"
                                 >
                                    <Edit3 size={16} />
                                 </button>
                              </div>

                              <div className="space-y-1 relative z-10">
                                 <h3 className="text-lg font-black text-slate-900 uppercase leading-tight">{cp.nombre}</h3>
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase flex-wrap">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">NIT: {cp.nit}</span>
                                    {cp.ciudad && <span className="flex items-center gap-1"><MapPin size={10} /> {cp.ciudad}</span>}
                                 </div>
                                 <p className="text-[10px] text-slate-400 truncate pt-1">{cp.direccion}</p>
                              </div>

                              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                                 <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                                    <Users size={12} /> {unitCount} / {cp.cantidadUnidades || '?'} Unidades
                                 </span>
                                 <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest group-hover:underline">
                                    Gestionar &rarr;
                                 </span>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  <div className="overflow-x-auto bg-white rounded-[32px] border border-slate-200 shadow-sm animate-in fade-in duration-300">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="p-5 pl-8">Copropiedad / NIT</th>
                              <th className="p-5">Ubicación</th>
                              <th className="p-5 text-center">Unidades</th>
                              <th className="p-5 text-right pr-8">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs">
                           {myCopropiedades.map(cp => {
                              const unitCount = unidades.filter(u => u.copropiedadId === cp.id).length;
                              return (
                                 <tr key={cp.id} onClick={() => selectCopropiedad(cp.id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <td className="p-5 pl-8">
                                       <div className="flex items-center gap-4">
                                          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 shrink-0"><Building2 size={20} /></div>
                                          <div>
                                             <p className="font-black text-slate-900 uppercase text-sm group-hover:text-indigo-600 transition-colors">{cp.nombre}</p>
                                             <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cp.nit}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="p-5">
                                       <div className="flex flex-col">
                                          <span className="font-bold text-slate-600 uppercase text-[11px]">{cp.ciudad || '---'}</span>
                                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{cp.direccion}</span>
                                       </div>
                                    </td>
                                    <td className="p-5 text-center">
                                       <div className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-slate-600 text-[10px] font-black">
                                          <Users size={12} /> {unitCount} / {cp.cantidadUnidades || '?'}
                                       </div>
                                    </td>
                                    <td className="p-5 text-right pr-8">
                                       <div className="flex items-center justify-end gap-3">
                                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                             Gestionar
                                          </span>
                                          <button
                                             onClick={(e) => { e.stopPropagation(); openBuildingModal(cp); }}
                                             className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                                             title="Editar Información"
                                          >
                                             <Edit3 size={14} />
                                          </button>
                                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                             <ArrowRight size={14} />
                                          </div>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               )}

               {myCopropiedades.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                     <p className="text-slate-400 font-bold uppercase text-xs">No tiene edificios asignados</p>
                     <button onClick={() => openBuildingModal()} className="mt-2 text-indigo-600 font-black text-xs uppercase hover:underline">Crear el primero</button>
                  </div>
               )}

               {/* MODAL EDIFICIO */}
               {isModalOpen && modalType === 'BUILDING' && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                     <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-black text-lg uppercase">{buildingForm.id ? 'Editar Copropiedad' : 'Nueva Copropiedad'}</h3>
                           <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveBuilding} className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                              <input value={buildingForm.nombre} onChange={e => setBuildingForm({ ...buildingForm, nombre: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">NIT</label>
                                 <input value={buildingForm.nit} onChange={e => setBuildingForm({ ...buildingForm, nit: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ciudad</label>
                                 <input value={buildingForm.ciudad} onChange={e => setBuildingForm({ ...buildingForm, ciudad: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Total Unidades</label>
                                 <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input required type="number" min="1" value={buildingForm.cantidadUnidades} onChange={e => setBuildingForm({ ...buildingForm, cantidadUnidades: e.target.value })} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold" />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Email Contacto</label>
                                 <input type="email" value={buildingForm.email} onChange={e => setBuildingForm({ ...buildingForm, email: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dirección</label>
                              <input value={buildingForm.direccion} onChange={e => setBuildingForm({ ...buildingForm, direccion: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                           </div>
                           <div className="space-y-1 border-t border-slate-100 pt-3 mt-3">
                              <label className="text-[9px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1"><FileCheck size={10} /> Representación Legal</label>
                              <p className="text-[8px] text-slate-400 mb-2">Adjunte el documento expedido por la alcaldía (Máx 2MB).</p>
                              {buildingForm.representacionLegal ? (
                                 <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 size={12} /> Documento Cargado</span>
                                    <div className="flex items-center gap-2">
                                       <a href={buildingForm.representacionLegal} download="Representacion_Legal" className="p-1.5 bg-white border border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-1"><Eye size={12} /></a>
                                       <button onClick={removeLegalDoc} className="p-1.5 bg-white border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-all"><Trash2 size={12} /></button>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="relative">
                                    <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:bg-slate-50 hover:border-indigo-300 transition-colors">
                                       <div className="flex flex-col items-center justify-center text-slate-400">
                                          <UploadCloud size={24} />
                                          <span className="text-[10px] font-black uppercase mt-1">Clic para adjuntar</span>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                           <div className="pt-4 flex gap-3">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-xs text-slate-500">Cancelar</button>
                              <button type="submit" disabled={isTogglingSession} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-lg">
                                 {isTogglingSession ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Guardar'}
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               )}

               {isModalOpen && modalType === 'PROFILE' && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                     <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex items-center gap-2">
                              <UserCog size={24} className="text-indigo-600" />
                              <h3 className="font-black text-lg uppercase">Mi Perfil</h3>
                           </div>
                           <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6">
                           <div className="text-center">
                              <p className="text-[10px] font-black uppercase text-amber-700 mb-1 flex justify-center items-center gap-1"><Award size={12} /> Puntos de Fidelización</p>
                              <p className="text-3xl font-black text-slate-900">{formatPoints(validatedBalance)}</p>
                           </div>
                           <button
                              onClick={() => { setIsModalOpen(false); setView('loyalty'); }}
                              className="w-full mt-3 flex items-center justify-center gap-1 text-[9px] font-bold text-amber-600 hover:text-amber-800 transition-colors uppercase bg-white py-2 rounded-xl border border-amber-100 shadow-sm"
                           >
                              Ver Detalle <ChevronRight size={12} />
                           </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                              <input required value={profileForm.nombre} onChange={e => setProfileForm({ ...profileForm, nombre: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Email</label>
                              <input required type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cédula</label>
                                 <input value={profileForm.cedula} onChange={e => setProfileForm({ ...profileForm, cedula: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Teléfono</label>
                                 <input value={profileForm.telefono} onChange={e => setProfileForm({ ...profileForm, telefono: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dirección Física</label>
                              <input value={profileForm.direccion} onChange={e => setProfileForm({ ...profileForm, direccion: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                           </div>
                           <div className="space-y-1 relative">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Lock size={10} /> Nueva Contraseña</label>
                              <input type="text" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" placeholder="Dejar vacío para mantener" />
                           </div>
                           <div className="pt-2">
                              <button type="button" onClick={() => setShowDataPolicy(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"><ShieldCheck size={12} /> Ver Política de Tratamiento de Datos</button>
                           </div>
                           <div className="pt-4">
                              <button type="submit" disabled={isTogglingSession} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg flex justify-center items-center gap-2 hover:bg-indigo-600 transition-colors">
                                 {isTogglingSession ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Guardar Cambios</>}
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               )}

               {showDataPolicy && (
                  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
                     <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                           <div className="flex items-center gap-2">
                              <FileCheck size={20} className="text-indigo-600" />
                              <h3 className="font-black text-lg text-slate-900 uppercase">Política de Datos y Responsabilidad</h3>
                           </div>
                           <button onClick={() => setShowDataPolicy(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                           <div className="space-y-6 text-xs text-slate-600 text-justify leading-relaxed">
                              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6">
                                 <p className="font-bold text-indigo-900 text-center uppercase text-[10px] tracking-widest mb-1">Declaración del Administrador</p>
                                 <p className="text-center font-medium">Al hacer uso de esta plataforma, usted actúa en calidad de <strong>RESPONSABLE</strong> del tratamiento de los datos personales de la copropiedad.</p>
                              </div>
                              <section><h4 className="font-black text-slate-900 uppercase mb-2 border-b border-slate-200 pb-1">1. Marco Legal (Habeas Data)</h4><p>En cumplimiento de la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013, se establecen las responsabilidades respecto a la recolección, almacenamiento y uso de datos personales (Nombres, Correos, Coeficientes, Unidades Privadas).</p></section>
                              <section><h4 className="font-black text-slate-900 uppercase mb-2 border-b border-slate-200 pb-1">2. Roles y Responsabilidades</h4><ul className="list-disc pl-4 space-y-2"><li><strong>EL RESPONSABLE (Usted / La Copropiedad):</strong> Es quien decide sobre la base de datos y el tratamiento de los mismos. Usted garantiza que cuenta con la autorización de los titulares (propietarios) para cargar su información en este sistema con fines exclusivamente logísticos para la asamblea.</li><li><strong>EL ENCARGADO (Grupo Iart SAS):</strong> Proveedor de la plataforma tecnológica. Se limita a procesar la información suministrada por EL RESPONSABLE bajo sus instrucciones, garantizando la seguridad y confidencialidad técnica, sin utilizar los datos para fines propios ni comerciales externos.</li></ul></section>
                              <section><h4 className="font-black text-slate-900 uppercase mb-2 border-b border-slate-200 pb-1">3. Finalidad del Tratamiento</h4><p>Los datos cargados en la plataforma tienen como única finalidad:</p><ul className="list-disc pl-4 mt-1"><li>Gestionar el registro y quórum de la asamblea.</li><li>Calcular los resultados de las votaciones según coeficientes.</li><li>Generar las actas e informes estadísticos del evento.</li></ul></section>
                              <section><h4 className="font-black text-slate-900 uppercase mb-2 border-b border-slate-200 pb-1">4. Seguridad de la Información</h4><p>La plataforma utiliza protocolos de encriptación y seguridad estándar de la industria para proteger la integridad de los datos durante la transmisión y almacenamiento. Sin embargo, EL RESPONSABLE debe custodiar sus credenciales de acceso (Usuario y Contraseña) con la debida diligencia.</p></section>
                              <div className="pt-4"><p className="font-black text-slate-900 text-center">ACEPTACIÓN TÁCITA</p><p className="text-center mt-1">La continuidad en el uso del servicio constituye una ratificación de estos términos y de su rol como Representante Legal en el manejo de la información.</p></div>
                           </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 text-center">
                           <button onClick={() => setShowDataPolicy(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all">Comprendido</button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </Layout>
      );
   }

   // --- VISTA 2: SELECCIÓN DE ASAMBLEA ---
   if (!selectedAsambleaId) {
      const activeCopropiedad = copropiedades.find(c => c.id === selectedCopropiedadId);
      const myAsambleas = asambleas.filter(a => a.copropiedadId === selectedCopropiedadId);

      return (
         <Layout title={activeCopropiedad?.nombre} onBackToHome={() => setView('home')}>
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                  <button onClick={() => selectCopropiedad(null)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
                     <ArrowLeft size={16} />
                     <div className="text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-widest">Volver a Edificios</h2>
                        <p className="text-sm font-black text-slate-900 uppercase leading-none">Seleccionar Asamblea</p>
                     </div>
                  </button>

                  <button
                     onClick={() => { setModalType('ASSEMBLY'); setIsModalOpen(true); }}
                     className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
                  >
                     <Plus size={16} /> Nueva Asamblea
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {myAsambleas.map(as => (
                     <button
                        key={as.id}
                        onClick={() => {
                           if (!as.pagoConfirmado) {
                              alert("Esta asamblea requiere activación de pago para ingresar.");
                              setView('payments');
                              return;
                           }
                           selectAsamblea(as.id);
                        }}
                        className={`p-6 rounded-[32px] border-2 transition-all text-left flex items-center justify-between group ${as.pagoConfirmado
                           ? 'bg-white border-slate-100 hover:border-indigo-600 hover:shadow-xl'
                           : 'bg-amber-50/50 border-amber-200 cursor-not-allowed'
                           }`}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${as.status === 'EN_CURSO' ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                              {as.status === 'EN_CURSO' ? <Play size={24} /> : <Calendar size={24} />}
                           </div>
                           <div>
                              <h3 className="text-lg font-black text-slate-900 uppercase leading-tight">{as.nombre}</h3>
                              <div className="flex gap-2 mt-1">
                                 <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{as.fecha}</span>
                                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${as.status === 'EN_CURSO' ? 'bg-emerald-100 text-emerald-700' : as.status === 'FINALIZADA' ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                                    {as.status}
                                 </span>
                              </div>
                              {!as.pagoConfirmado && (
                                 <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">
                                    <AlertTriangle size={10} /> Pago Pendiente
                                 </div>
                              )}
                           </div>
                        </div>
                        <div className={`${as.pagoConfirmado ? 'text-slate-300 group-hover:text-indigo-600' : 'text-amber-300'} transition-colors`}>
                           {as.pagoConfirmado ? <Play size={24} /> : <Lock size={24} />}
                        </div>
                     </button>
                  ))}
                  {myAsambleas.length === 0 && (
                     <div className="py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold uppercase text-xs">No hay asambleas registradas</p>
                        <button
                           onClick={() => { setModalType('ASSEMBLY'); setIsModalOpen(true); }}
                           className="mt-2 text-indigo-600 font-black text-xs uppercase hover:underline"
                        >
                           Crear la primera asamblea
                        </button>
                     </div>
                  )}
               </div>

               {/* MODAL NUEVA ASAMBLEA */}
               {isModalOpen && modalType === 'ASSEMBLY' && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                     <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-black text-lg uppercase">Nueva Asamblea</h3>
                           <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveAssembly} className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombre del Evento</label>
                              <input
                                 required
                                 placeholder="Ej: Asamblea Ordinaria 2025"
                                 value={assemblyForm.nombre}
                                 onChange={e => setAssemblyForm({ ...assemblyForm, nombre: e.target.value })}
                                 className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Fecha</label>
                                 <input
                                    required
                                    type="date"
                                    value={assemblyForm.fecha}
                                    onChange={e => setAssemblyForm({ ...assemblyForm, fecha: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tipo</label>
                                 <select
                                    value={assemblyForm.tipo}
                                    onChange={e => setAssemblyForm({ ...assemblyForm, tipo: e.target.value as any })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                                 >
                                    <option value="ORDINARIA">Ordinaria</option>
                                    <option value="EXTRAORDINARIA">Extraordinaria</option>
                                 </select>
                              </div>
                           </div>

                           <div className="pt-4 flex gap-3">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-xs text-slate-500">Cancelar</button>
                              <button type="submit" disabled={isTogglingSession} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-lg">
                                 {isTogglingSession ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Crear Evento'}
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               )}
            </div>
         </Layout>
      );
   }

   // --- VISTA 3: DASHBOARD GESTIÓN ---
   const status = activeAsamblea?.status || 'PROGRAMADA';

   return (
      <Layout title={`${activeCopropiedad?.nombre} > ${activeAsamblea?.nombre}`} onBackToHome={() => setView('home')}>
         <div className="space-y-6 animate-in fade-in duration-300">


            {/* HEADER DE CONTROL ... */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm no-print gap-4">
               <div className="flex items-center gap-4">
                  <button onClick={() => selectAsamblea(null)} className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-1 hover:text-indigo-600 transition-colors pl-2">
                     <ArrowLeft size={14} /> Volver
                  </button>

                  {/* QUORUM WIDGET */}
                  <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                           <Users size={14} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black uppercase text-slate-400 leading-none">Quórum en Sala</span>
                           <span className="text-sm font-black text-slate-900 leading-none mt-0.5">{quorumData.totalCoef.toFixed(3)}%</span>
                        </div>
                     </div>
                     <div className="h-6 w-px bg-slate-200 mx-1"></div>
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{quorumData.count} Unidades</span>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button onClick={() => window.open(window.location.origin + '?view=projection', '_blank')} className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                     <Presentation size={14} /> Resultados
                  </button>

                  <button onClick={() => { setModalType('MINUTES'); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-indigo-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                     <FileText size={14} /> Reporte Votaciones
                  </button>

                  {status === 'PROGRAMADA' && (
                     <button onClick={handleStart} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                        <Play size={14} /> Abrir Asamblea
                     </button>
                  )}
                  {status === 'EN_CURSO' && (
                     <button onClick={() => { setModalType('CONFIRM_END'); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                        <Power size={14} /> Finalizar
                     </button>
                  )}
               </div>
            </div>

            {/* TABS DE NAVEGACIÓN ... */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 no-print bg-slate-100 p-1.5 rounded-2xl">
               <button
                  onClick={() => setActiveTab('asistencia')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'asistencia' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <Users size={16} /> <span className="hidden sm:inline">Asistencia</span>
               </button>
               <button
                  onClick={() => setActiveTab('votaciones')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'votaciones' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <Vote size={16} /> <span className="hidden sm:inline">Votaciones</span>
               </button>
               <button
                  onClick={() => setActiveTab('unidades')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'unidades' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <Building2 size={16} /> <span className="hidden sm:inline">Unidades</span>
               </button>
               <button
                  onClick={() => setActiveTab('acta_ia')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'acta_ia' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <Sparkles size={16} /> <span className="hidden sm:inline">Acta IA</span>
               </button>
            </div>

            {/* CONTENIDO TABS ... */}
            <div className={`min-h-[500px] ${modalType === 'MINUTES' ? 'print:hidden' : ''}`}>
               {activeTab === 'asistencia' && <AdminAsistenciaTab />}
               {activeTab === 'votaciones' && <AdminVotacionesTab setView={setView} />}
               {activeTab === 'unidades' && <AdminUnidadesTab />}
               {activeTab === 'acta_ia' && <AdminActaIATab />}
            </div>
         </div>

         {/* MODALES GLOBALES ... */}
         {isModalOpen && (
            <div className={`
            fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm
            ${modalType === 'MINUTES'
                  ? 'print:static print:inset-auto print:p-0 print:bg-white print:block'
                  : 'print:hidden'
               }
        `}>
               {modalType === 'MINUTES' && (
                  <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in print:rounded-none print:shadow-none print:w-full print:h-auto print:max-h-none print:overflow-visible">
                     <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0 no-print">
                        <h3 className="font-black text-lg uppercase">Vista Previa de Acta</h3>
                        <div className="flex gap-2">
                           <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                              <Printer size={14} /> Imprimir
                           </button>
                           <button onClick={exportToWord} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 shadow-lg">
                              <FileText size={14} /> Guardar Word
                           </button>
                           <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2"><X size={20} /></button>
                        </div>
                     </div>
                     <div id="manual-minutes-content" className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 p-8 print:p-0 print:overflow-visible print:bg-white print:block">
                        <MinutesPreview />
                     </div>
                  </div>
               )}

               {modalType === 'CONFIRM_END' && (
                  <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 animate-in zoom-in text-center no-print">
                     <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-6">
                        <AlertTriangle size={40} />
                     </div>
                     <h3 className="font-black text-2xl text-slate-900 uppercase mb-2">¿Finalizar Asamblea?</h3>
                     <p className="text-sm font-medium text-slate-500 mb-8">
                        Al finalizar, no podrá reabrir votaciones ni registrar asistencia. Esta acción es irreversible.
                     </p>
                     <div className="flex gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-xs text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
                        <button onClick={handleEnd} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-red-200 hover:bg-red-700 transition-colors">Sí, Finalizar</button>
                     </div>
                  </div>
               )}
            </div>
         )}
      </Layout>
   );
};
