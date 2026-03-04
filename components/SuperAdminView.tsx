
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Layout } from './Layout.tsx';
import {
  Plus, X, ShieldCheck, DollarSign, LogOut, Database, Loader2, ArrowUpDown, ChevronUp, ChevronDown,
  Building2, Users, Search, Trash2, Mail, Phone, Clock, AlertCircle, FileCheck, Edit3, Calendar,
  CheckCircle2, Lock, MapPin, Hash, Home, Sparkles, Award, Check, XCircle,
  LayoutDashboard, BarChart3, PieChart as PieIcon, Activity, TrendingUp, History, LayoutGrid, List, UserCheck, Vote, Globe, UserCog, Hourglass, RotateCcw, Settings, Briefcase
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// Componente para animar números (CountUp)
const AnimatedNumber = ({ value, className }: { value: number, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);

      const current = Math.floor(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
    prevValueRef.current = value;
  }, [value]);

  return <span className={className}>{displayValue}</span>;
};

export const SuperAdminView: React.FC<{ setView?: (v: any) => void }> = ({ setView }) => {
  const {
    copropiedades, phAdmins, asambleas, unidades, superAdmins, loyaltyTransactions, asambleistas, votos, loyaltyRules,
    addCopropiedad, updateCopropiedad, deleteCopropiedad,
    createAsamblea, updateAsamblea, deleteAsamblea,
    registerAdmin, updateAdmin, deleteAdmin,
    registerSuperAdmin, updateSuperAdmin, deleteSuperAdmin, logoutSuperAdmin, addManualPoints,
    approveLoyaltyTransaction, rejectLoyaltyTransaction, updateLoyaltyRules,
    confirmPayment, initializeDatabase, currentSuperAdmin
  } = useAssembly();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'edificios' | 'asambleas' | 'admins' | 'recaudos' | 'seguridad' | 'loyalty'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteTimer, setDeleteTimer] = useState<number>(0);

  const [modalType, setModalType] = useState<'BUILDING' | 'ASSEMBLY' | 'ADMIN' | 'SUPER_ADMIN' | 'MANUAL_POINTS' | 'LOYALTY_RULES' | 'NONE'>('NONE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario para Reglas de Puntos
  const [formRules, setFormRules] = useState(loyaltyRules);

  useEffect(() => {
    if (loyaltyRules) setFormRules(loyaltyRules);
  }, [loyaltyRules]);

  // Helper para filtrar y ordenar listas
  const filterList = (list: any[]) => {
    let filtered = list;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = list.filter(item =>
        (item.nombre || item.name || '').toLowerCase().includes(term) ||
        (item.email || '').toLowerCase().includes(term) ||
        (item.nit || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (item.id || '').toLowerCase().includes(term)
      );
    }

    if (sortConfig.direction && sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Especiales
        if (sortConfig.key === 'copropiedad') {
          valA = copropiedades.find(c => c.id === a.copropiedadId)?.nombre || '';
          valB = copropiedades.find(c => c.id === b.copropiedadId)?.nombre || '';
        }

        if (sortConfig.key === 'adminId') {
          valA = phAdmins.find(admin => admin.id === a.adminId)?.nombre || '';
          valB = phAdmins.find(admin => admin.id === b.adminId)?.nombre || '';
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    if (sortConfig.direction === 'asc') return <ChevronUp size={12} className="ml-1 text-indigo-400" />;
    if (sortConfig.direction === 'desc') return <ChevronDown size={12} className="ml-1 text-indigo-400" />;
    return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
  };

  // Helper para calcular días restantes
  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // --- FORM STATES ---
  const [formBuilding, setFormBuilding] = useState({ nombre: '', nit: '', direccion: '', ciudad: '', email: '', adminIds: [] as string[], representacionLegal: '', cantidadUnidades: '' });
  const [formAssembly, setFormAssembly] = useState({ nombre: '', tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA', fecha: '', copropiedadId: '', serviceType: 'BASICO' as 'BASICO' | 'PREMIUM', actaInteligenteEnabled: false });
  const [formAdmin, setFormAdmin] = useState({ nombre: '', email: '', telefono: '', password: '', cedula: '', direccion: '' });
  const [formSuperAdmin, setFormSuperAdmin] = useState({ nombre: '', email: '', password: '', telefono: '' });
  const [formManualPoints, setFormManualPoints] = useState({ adminId: '', amount: '', description: '' });

  // --- DASHBOARD CALCULATIONS ---
  const stats = useMemo(() => {
    const activeAsm = asambleas.filter(a => a.status === 'EN_CURSO');
    const activeAsmIds = new Set(activeAsm.map(a => a.id));

    const finishedAsm = asambleas.filter(a => a.status === 'FINALIZADA');
    const pendingAsm = asambleas.filter(a => a.status === 'PROGRAMADA');

    // CORRECCIÓN: Solo contar usuarios "En Sala" si pertenecen a una asamblea ACTIVA (EN_CURSO)
    // Se usa Set para búsqueda O(1)
    const connectedInSala = asambleistas.filter(a =>
      a.asistenciaConfirmada && activeAsmIds.has(a.asambleaId)
    );

    return {
      totalAdmins: phAdmins.length,
      totalBuildings: copropiedades.length,
      totalAssemblies: asambleas.length,
      activeAssemblies: activeAsm.length,
      finishedAssemblies: finishedAsm.length,
      pendingAssemblies: pendingAsm.length,
      totalUnits: unidades.length,
      totalAuthenticatedUsers: asambleistas.length, // Registrados en la app (Total Histórico)
      totalInSala: connectedInSala.length, // Conectados/Presentes AHORA (En asambleas activas)
      totalVotes: votos.length // Votos totales registrados
    };
  }, [phAdmins, copropiedades, asambleas, unidades, asambleistas, votos]);

  const chartData = useMemo(() => [
    { name: 'Programadas', value: stats.pendingAssemblies, color: '#f59e0b' },
    { name: 'En Curso', value: stats.activeAssemblies, color: '#10b981' },
    { name: 'Finalizadas', value: stats.finishedAssemblies, color: '#6366f1' },
  ], [stats]);

  const buildingsData = useMemo(() => {
    return copropiedades.slice(-5).map(cp => ({
      name: cp.nombre.length > 10 ? cp.nombre.substring(0, 8) + '...' : cp.nombre,
      unidades: unidades.filter(u => u.copropiedadId === cp.id).length
    }));
  }, [copropiedades, unidades]);

  useEffect(() => {
    if (!currentSuperAdmin && setView) setView('home');
  }, [currentSuperAdmin, setView]);

  useEffect(() => {
    let interval: any;
    if (confirmDeleteId) {
      setDeleteTimer(5);
      interval = setInterval(() => {
        setDeleteTimer(prev => {
          if (prev <= 1) {
            setConfirmDeleteId(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [confirmDeleteId]);

  const resetForms = () => {
    setEditingId(null);
    setFormBuilding({ nombre: '', nit: '', direccion: '', ciudad: '', email: '', adminIds: [], representacionLegal: '', cantidadUnidades: '' });
    setFormAssembly({ nombre: '', tipo: 'ORDINARIA', fecha: '', copropiedadId: '', serviceType: 'BASICO', actaInteligenteEnabled: false });
    setFormAdmin({ nombre: '', email: '', telefono: '', password: '', cedula: '', direccion: '' });
    setFormSuperAdmin({ nombre: '', email: '', password: '', telefono: '' });
    setFormManualPoints({ adminId: '', amount: '', description: '' });
    setFormRules(loyaltyRules);
    setModalType('NONE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing('form');
    try {
      if (modalType === 'BUILDING') {
        const payload = { ...formBuilding, cantidadUnidades: parseInt(formBuilding.cantidadUnidades) || 0 };
        if (editingId) await updateCopropiedad(editingId, payload);
        else await addCopropiedad(payload);
      } else if (modalType === 'ASSEMBLY') {
        if (editingId) await updateAsamblea(editingId, formAssembly);
        else await createAsamblea(formAssembly);
      } else if (modalType === 'ADMIN') {
        if (editingId) await updateAdmin(editingId, formAdmin);
        else await registerAdmin(formAdmin);
      } else if (modalType === 'SUPER_ADMIN') {
        if (editingId) await updateSuperAdmin(editingId, formSuperAdmin);
        else await registerSuperAdmin(formSuperAdmin);
      } else if (modalType === 'MANUAL_POINTS') {
        await addManualPoints(formManualPoints.adminId, parseInt(formManualPoints.amount), formManualPoints.description);
        alert("Puntos registrados.");
      } else if (modalType === 'LOYALTY_RULES') {
        await updateLoyaltyRules(formRules);
        alert("Reglas de puntos actualizadas.");
      }
      resetForms();
    } catch (err) { alert("Error al procesar."); } finally { setIsProcessing(null); }
  };

  const openEdit = (type: any, item: any) => {
    setEditingId(item.id);
    if (type === 'BUILDING') {
      setFormBuilding({ nombre: item.nombre, nit: item.nit, direccion: item.direccion, ciudad: item.ciudad || '', email: item.email || '', adminIds: item.adminIds || [], representacionLegal: item.representacionLegal || '', cantidadUnidades: String(item.cantidadUnidades || '') });
    } else if (type === 'ASSEMBLY') {
      setFormAssembly({ nombre: item.nombre, tipo: item.tipo, fecha: item.fecha, copropiedadId: item.copropiedadId, serviceType: item.serviceType || 'BASICO', actaInteligenteEnabled: item.actaInteligenteEnabled || false });
    } else if (type === 'ADMIN') {
      setFormAdmin({ nombre: item.nombre, email: item.email, telefono: item.telefono, password: '', cedula: item.cedula || '', direccion: item.direccion || '' });
    } else if (type === 'SUPER_ADMIN') {
      setFormSuperAdmin({ nombre: item.nombre, email: item.email, telefono: item.telefono || '', password: '' });
    }
    setModalType(type);
  };

  const handleDeleteTrigger = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) executeDelete(id);
    else setConfirmDeleteId(id);
  };

  const handleReopenAssembly = async (id: string) => {
    if (!window.confirm("¿Seguro que desea reabrir esta asamblea? Pasará a estado 'EN CURSO' y permitirá nuevas votaciones.")) return;
    setIsProcessing(id);
    try {
      await updateAsamblea(id, { status: 'EN_CURSO' });
    } catch (e) {
      alert("Error al reabrir asamblea");
    } finally {
      setIsProcessing(null);
    }
  };

  const executeDelete = async (id: string) => {
    setIsProcessing(id);
    try {
      if (activeTab === 'edificios') await deleteCopropiedad(id);
      else if (activeTab === 'asambleas') await deleteAsamblea(id);
      else if (activeTab === 'admins') await deleteAdmin(id);
      else if (activeTab === 'seguridad') await deleteSuperAdmin(id);
    } finally { setIsProcessing(null); setConfirmDeleteId(null); }
  };

  const renderToolbar = (title: string, addAction?: () => void, addLabel?: string, icon?: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-4 rounded-3xl border border-slate-700 mb-6 shadow-lg">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <h3 className="text-lg font-black uppercase text-white">{title}</h3>
        <div className="flex bg-slate-900 p-1 rounded-xl">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><List size={16} /></button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none" />
        </div>
        {addAction && (
          <button onClick={addAction} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all">
            {icon || <Plus size={16} />} {addLabel || 'Agregar'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Layout title={`Panel Maestro`} onBackToHome={() => setView && setView('home')}>
      <div className="bg-slate-950 text-white min-h-screen fixed inset-0 z-50 overflow-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6">

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border-b border-slate-800 pb-8">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl border border-indigo-400/20"><ShieldCheck size={32} /></div>
              <div><h1 className="text-3xl font-black uppercase tracking-tight text-white">Super Panel</h1><p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-0.5">Gestión Centralizada v5.4</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView && setView('home')} className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all text-slate-300 border border-slate-700"><Home size={14} /> Inicio</button>
              <button onClick={() => logoutSuperAdmin()} className="bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all"><LogOut size={14} /> Salir</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-2 rounded-[28px] border border-slate-800">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'asambleas', icon: Calendar, label: 'Eventos' },
              { id: 'edificios', icon: Building2, label: 'Edificios' },
              { id: 'admins', icon: Users, label: 'Admins PH' },
              { id: 'recaudos', icon: DollarSign, label: 'Pagos' },
              { id: 'loyalty', icon: Award, label: 'Loyalty' },
              { id: 'seguridad', icon: Lock, label: 'Seguridad' }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }} className={`flex-1 min-w-[100px] p-3 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl ring-1 ring-indigo-400/50' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
                <tab.icon size={20} />
                <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6 pb-20">
            {/* --- DASHBOARD --- */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* KPI: Admins */}
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><Users size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Administradores</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.totalAdmins} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Registrados</p></div>
                  </div>
                  {/* KPI: En Sala (Conectados) */}
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                      {stats.totalInSala > 0 ? (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                      ) : (
                        <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-4"><div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400"><Globe size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">En Sesión</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.totalInSala} /></h4><p className="text-[10px] font-bold text-emerald-500 uppercase">Asistencia Reg.</p></div>
                  </div>
                  {/* KPI: Asambleístas (App) */}
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><UserCheck size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Personas</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.totalAuthenticatedUsers} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Autenticadas</p></div>
                  </div>
                  {/* KPI: Votos */}
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-purple-500/10 p-2 rounded-xl text-purple-400"><Vote size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-purple-300">Votaciones</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.totalVotes} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Registradas</p></div>
                  </div>
                  {/* Fila 2 de KPIs */}
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-amber-500/10 p-2 rounded-xl text-amber-400"><Activity size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-amber-300">En Vivo</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.activeAssemblies} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Asambleas</p></div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><TrendingUp size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Alcance</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.totalUnits} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Unidades</p></div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-slate-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-slate-700/20 p-2 rounded-xl text-slate-400"><History size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Histórico</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.finishedAssemblies} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Cerradas</p></div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-xl group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4"><div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><Building2 size={20} /></div><span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Edificios</span></div>
                    <div className="flex items-end justify-between"><h4 className="text-4xl font-black text-white"><AnimatedNumber value={stats.totalBuildings} /></h4><p className="text-[10px] font-bold text-slate-500 uppercase">Copropiedades</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl flex flex-col min-h-[450px]">
                    <div className="flex items-center gap-3 mb-8"><div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><PieIcon size={20} /></div><h4 className="text-xs font-black uppercase tracking-widest text-white">Estados del Ecosistema</h4></div>
                    <div className="flex-1 w-full" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value">
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '10px' }} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl flex flex-col min-h-[450px]">
                    <div className="flex items-center gap-3 mb-8"><div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400"><BarChart3 size={20} /></div><h4 className="text-xs font-black uppercase tracking-widest text-white">Copropiedades más grandes</h4></div>
                    <div className="flex-1 w-full" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={buildingsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#475569" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} />
                          <YAxis stroke="#475569" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '10px' }} />
                          <Bar dataKey="unidades" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- EVENTOS --- */}
            {activeTab === 'asambleas' && (
              <div className="animate-in fade-in duration-500">
                {renderToolbar("Historial de Eventos", () => { resetForms(); setModalType('ASSEMBLY'); }, "Crear Asamblea")}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "overflow-x-auto bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl"}>
                  {/* (Contenido de eventos existente se mantiene igual) */}
                  {viewMode === 'table' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nombre')}>
                            <div className="flex items-center">Nombre <SortIndicator column="nombre" /></div>
                          </th>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('copropiedad')}>
                            <div className="flex items-center">Copropiedad <SortIndicator column="copropiedad" /></div>
                          </th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('fecha')}>
                            <div className="flex items-center justify-center">Fecha <SortIndicator column="fecha" /></div>
                          </th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                            <div className="flex items-center justify-center">Estado <SortIndicator column="status" /></div>
                          </th>
                          <th className="p-5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filterList(asambleas).map(as => {
                          const days = getDaysDiff(as.fecha);
                          return (
                            <tr key={as.id} className="hover:bg-slate-800/40">
                              <td className="p-5"><div><p className="font-black text-white text-sm uppercase">{as.nombre}</p><p className="text-[9px] text-slate-500">{as.fecha}</p></div></td>
                              <td className="p-5 text-indigo-400 font-bold uppercase text-[10px]">{copropiedades.find(c => c.id === as.copropiedadId)?.nombre || '---'}</td>
                              <td className="p-5 text-center font-bold text-slate-400">{days === 0 ? 'HOY' : (days > 0 ? `+${days}` : days)} d</td>
                              <td className="p-5 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${as.status === 'EN_CURSO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-600'}`}>{as.status}</span></td>
                              <td className="p-5 text-right"><div className="flex justify-end gap-2">
                                {as.status === 'FINALIZADA' && (
                                  <button onClick={() => handleReopenAssembly(as.id)} className="p-2 bg-slate-800 rounded-lg text-emerald-500 hover:text-emerald-400" title="Reabrir Asamblea">
                                    <RotateCcw size={14} />
                                  </button>
                                )}
                                <button onClick={() => openEdit('ASSEMBLY', as)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400"><Edit3 size={14} /></button>
                                <button onClick={(e) => handleDeleteTrigger(e, as.id)} className={`p-2 rounded-lg ${confirmDeleteId === as.id ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-500'}`}><Trash2 size={14} /></button>
                              </div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {viewMode === 'grid' && filterList(asambleas).map(as => {
                    const cp = copropiedades.find(c => c.id === as.copropiedadId);
                    const days = getDaysDiff(as.fecha);
                    return (
                      <div key={as.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 relative group overflow-hidden hover:border-indigo-500/50 shadow-xl transition-all">
                        {/* Contenido Card Asamblea igual al anterior */}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${as.status === 'EN_CURSO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>{as.status}</span>
                          <div className="flex gap-2">
                            {as.status === 'FINALIZADA' && (
                              <button onClick={() => handleReopenAssembly(as.id)} className="text-slate-500 hover:text-emerald-400 transition-colors" title="Reabrir"><RotateCcw size={14} /></button>
                            )}
                            <button onClick={() => openEdit('ASSEMBLY', as)} className="text-slate-500 hover:text-indigo-400"><Edit3 size={14} /></button>
                            <button onClick={(e) => handleDeleteTrigger(e, as.id)} className={`flex items-center gap-1 transition-all px-2 py-1 rounded-lg ${confirmDeleteId === as.id ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-500'}`}>{confirmDeleteId === as.id ? <span className="text-[8px] font-black uppercase">CONFIRMAR {deleteTimer}s</span> : <Trash2 size={14} />}</button>
                          </div>
                        </div>
                        <h4 className="font-black text-white uppercase text-base mb-1 truncate">{as.nombre}</h4><p className="text-[10px] text-indigo-400 font-bold uppercase mb-6 flex items-center gap-1"><Building2 size={12} /> {cp?.nombre || '---'}</p>

                        <div className="mb-4">
                          {days > 0 ? (
                            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                              <Hourglass size={12} className="text-indigo-400" />
                              <span className="text-[9px] font-black uppercase text-indigo-300">Faltan {days} días</span>
                            </div>
                          ) : days === 0 ? (
                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-pulse">
                              <Activity size={12} className="text-emerald-400" />
                              <span className="text-[9px] font-black uppercase text-emerald-300">¡Es Hoy!</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-xl opacity-60">
                              <History size={12} className="text-slate-500" />
                              <span className="text-[9px] font-black uppercase text-slate-500">Hace {Math.abs(days)} días</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold"><Calendar size={12} /> {as.fecha}</div>
                          <div className="flex gap-2"><Sparkles size={14} className={as.actaInteligenteEnabled ? "text-purple-400" : "text-slate-700"} /><DollarSign size={14} className={as.pagoConfirmado ? "text-emerald-400" : "text-slate-700"} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- EDIFICIOS (Ya estaba bien) --- */}
            {activeTab === 'edificios' && (
              <div className="animate-in fade-in duration-500">
                {renderToolbar("Directorio de Copropiedades", () => { resetForms(); setModalType('BUILDING'); }, "Nuevo Edificio")}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "overflow-x-auto bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl"}>
                  {/* ... (Contenido edificios existente se mantiene igual) ... */}
                  {viewMode === 'table' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nombre')}>
                            <div className="flex items-center">Copropiedad <SortIndicator column="nombre" /></div>
                          </th>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nit')}>
                            <div className="flex items-center">NIT / Ciudad <SortIndicator column="nit" /></div>
                          </th>
                          <th className="p-5">Admin Responsable</th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('cantidadUnidades')}>
                            <div className="flex items-center justify-center">Unidades <SortIndicator column="cantidadUnidades" /></div>
                          </th>
                          <th className="p-5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filterList(copropiedades).map(cp => {
                          const assignedAdmins = phAdmins.filter(a => cp.adminIds?.includes(a.id));
                          return (
                            <tr key={cp.id} className="hover:bg-slate-800/40">
                              <td className="p-5 font-black text-white text-sm uppercase">{cp.nombre}</td>
                              <td className="p-5"><div><p className="text-slate-400 font-mono text-[10px]">{cp.nit}</p><p className="text-[9px] text-slate-600 uppercase">{cp.ciudad || 'N/A'}</p></div></td>
                              <td className="p-5">
                                <div className="flex flex-wrap gap-1">
                                  {assignedAdmins.length > 0 ? (
                                    assignedAdmins.map(a => <span key={a.id} className="text-indigo-400 font-bold uppercase text-[9px]">{a.nombre}</span>)
                                  ) : <span className="text-amber-500 font-bold text-[9px] uppercase italic">Sin Asignar</span>}
                                </div>
                              </td>
                              <td className="p-5 text-center font-black text-indigo-400 text-sm">{cp.cantidadUnidades || '?'}</td>
                              <td className="p-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => openEdit('BUILDING', cp)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400"><Edit3 size={14} /></button><button onClick={(e) => handleDeleteTrigger(e, cp.id)} className={`p-2 rounded-lg ${confirmDeleteId === cp.id ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-500'}`}><Trash2 size={14} /></button></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {viewMode === 'grid' && filterList(copropiedades).map(cp => {
                    const assignedAdmins = phAdmins.filter(a => cp.adminIds?.includes(a.id));
                    return (
                      <div key={cp.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 hover:border-indigo-500/50 group shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-5">
                          <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Building2 size={24} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit('BUILDING', cp)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={(e) => handleDeleteTrigger(e, cp.id)} className={`p-1 transition-all rounded-lg ${confirmDeleteId === cp.id ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-500'}`}>
                              {confirmDeleteId === cp.id ? <span className="text-[8px] font-black uppercase">KILL {deleteTimer}s</span> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                        <h4 className="font-black text-white uppercase text-base mb-2 truncate leading-tight">{cp.nombre}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Hash size={10} /> NIT: {cp.nit}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 truncate mb-3">
                          <MapPin size={10} /> {cp.direccion}
                        </p>

                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 mb-4">
                          <div className="flex items-center gap-2 mb-1.5 opacity-60">
                            <UserCog size={12} className="text-indigo-400" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Admins Responsables</span>
                          </div>
                          <div className="space-y-1">
                            {assignedAdmins.length > 0 ? (
                              assignedAdmins.map(a => (
                                <p key={a.id} className="text-[10px] font-bold text-slate-300 uppercase truncate">• {a.nombre}</p>
                              ))
                            ) : (
                              <p className="text-[10px] font-black text-amber-500/70 uppercase italic">Pendiente Asignación</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-800"><span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1"><Users size={12} /> {cp.cantidadUnidades || '?'} Unidades</span>{cp.representacionLegal && <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-lg"><FileCheck size={12} /></div>}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- ADMINS (Ya estaba bien) --- */}
            {activeTab === 'admins' && (
              <div className="animate-in fade-in duration-500">
                {renderToolbar("Directorio de Administradores", () => { resetForms(); setModalType('ADMIN'); }, "Nuevo Admin")}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "overflow-x-auto bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl"}>
                  {/* ... (Contenido admins existente se mantiene igual) ... */}
                  {viewMode === 'table' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nombre')}>
                            <div className="flex items-center">Administrador <SortIndicator column="nombre" /></div>
                          </th>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('email')}>
                            <div className="flex items-center">Contacto <SortIndicator column="email" /></div>
                          </th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('loyaltyPoints')}>
                            <div className="flex items-center justify-center">Puntos <SortIndicator column="loyaltyPoints" /></div>
                          </th>
                          <th className="p-5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filterList(phAdmins).map(admin => (
                          <tr key={admin.id} className="hover:bg-slate-800/40">
                            <td className="p-5"><div><p className="font-black text-white text-sm uppercase leading-tight">{admin.nombre}</p><p className="text-[9px] text-slate-500 font-mono">{admin.cedula || '---'}</p></div></td>
                            <td className="p-5"><div><p className="text-slate-400">{admin.email}</p><p className="text-[10px] text-slate-600">{admin.telefono}</p></div></td>
                            <td className="p-5 text-center"><div><span className="font-black text-amber-500 text-base">{admin.loyaltyPoints || 0}</span><button onClick={() => { setFormManualPoints({ adminId: admin.id, amount: '', description: '' }); setModalType('MANUAL_POINTS'); }} className="ml-2 p-1 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500"><Plus size={10} /></button></div></td>
                            <td className="p-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => openEdit('ADMIN', admin)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400"><Edit3 size={14} /></button><button onClick={(e) => handleDeleteTrigger(e, admin.id)} className={`p-2 rounded-lg ${confirmDeleteId === admin.id ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-500'}`}><Trash2 size={14} /></button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {viewMode === 'grid' && filterList(phAdmins).map(admin => (
                    <div key={admin.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 flex flex-col gap-4 relative group shadow-xl transition-all">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                          <Users size={24} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit('ADMIN', admin)} className="p-1 text-slate-500 hover:text-white">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={(e) => handleDeleteTrigger(e, admin.id)} className={`p-1 transition-all rounded-lg ${confirmDeleteId === admin.id ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-500'}`}>
                            {confirmDeleteId === admin.id ? <span className="text-[8px] font-black uppercase">DEAD {deleteTimer}s</span> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-white text-base uppercase truncate leading-tight">{admin.nombre}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{admin.email}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl flex items-center justify-between border border-slate-800">
                        <div>
                          <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest block mb-1">Saldo Loyal</span>
                          <span className="text-xl font-black text-white">{admin.loyaltyPoints || 0}</span>
                        </div>
                        <button onClick={() => { setFormManualPoints({ adminId: admin.id, amount: '', description: '' }); setModalType('MANUAL_POINTS'); }} className="bg-indigo-600 p-2 rounded-xl text-white hover:bg-indigo-500 shadow-lg">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- RECAUDOS --- */}
            {activeTab === 'recaudos' && (
              <div className="animate-in fade-in duration-500">
                {renderToolbar("Control de Recaudos")}

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "overflow-x-auto bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl"}>
                  {viewMode === 'table' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('nombre')}>
                            <div className="flex items-center">Evento <SortIndicator column="nombre" /></div>
                          </th>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('copropiedad')}>
                            <div className="flex items-center">Copropiedad <SortIndicator column="copropiedad" /></div>
                          </th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('serviceType')}>
                            <div className="flex items-center justify-center">Servicios <SortIndicator column="serviceType" /></div>
                          </th>
                          <th className="p-5 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pagoConfirmado')}>
                            <div className="flex items-center justify-end">Acción <SortIndicator column="pagoConfirmado" /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filterList(asambleas).map(as => {
                          const cp = copropiedades.find(c => c.id === as.copropiedadId);
                          return (
                            <tr key={as.id} className="hover:bg-slate-800/40">
                              <td className="p-5"><div><p className="font-black text-white text-sm uppercase mb-1">{as.nombre}</p><p className="text-[9px] text-slate-500">{as.fecha}</p></div></td>
                              <td className="p-5 text-slate-400 font-bold uppercase text-[10px]">{cp?.nombre || '---'}</td>
                              <td className="p-5 text-center"><div className="flex flex-col items-center gap-1.5"><span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${as.serviceType === 'PREMIUM' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-slate-800 text-slate-400'}`}>{as.serviceType || 'BASICO'}</span>{as.actaInteligenteEnabled && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-lg text-[8px] font-black uppercase">MÓDULO IA</span>}</div></td>
                              <td className="p-5 text-right"><div className="flex justify-end gap-3"><button onClick={() => confirmPayment(as.id)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 ${as.pagoConfirmado ? 'bg-slate-800 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}><DollarSign size={16} /><span>{as.pagoConfirmado ? 'PAGO OK' : 'APROBAR'}</span></button></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {viewMode === 'grid' && filterList(asambleas).map(as => {
                    const cp = copropiedades.find(c => c.id === as.copropiedadId);
                    return (
                      <div key={as.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-xl flex flex-col gap-4 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="bg-slate-800 p-3 rounded-2xl text-emerald-400">
                            <DollarSign size={24} />
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${as.serviceType === 'PREMIUM' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                              {as.serviceType || 'BASICO'}
                            </span>
                            {as.actaInteligenteEnabled && (
                              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-lg text-[8px] font-black uppercase">
                                MÓDULO IA
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-white text-base uppercase leading-tight mb-1 line-clamp-2">{as.nombre}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{as.fecha}</p>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Copropiedad</p>
                          <p className="text-xs font-bold text-slate-300 uppercase truncate">{cp?.nombre || '---'}</p>
                        </div>

                        <button
                          onClick={() => confirmPayment(as.id)}
                          className={`w-full py-4 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center justify-center gap-2 mt-auto transition-all ${as.pagoConfirmado
                            ? 'bg-slate-800 text-emerald-500 border border-emerald-500/20 cursor-default'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.02]'
                            }`}
                        >
                          {as.pagoConfirmado ? <CheckCircle2 size={16} /> : <DollarSign size={16} />}
                          <span>{as.pagoConfirmado ? 'PAGO CONFIRMADO' : 'APROBAR PAGO'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- SEGURIDAD --- */}
            {activeTab === 'seguridad' && (
              <div className="animate-in fade-in duration-500 space-y-6">
                <div className="flex justify-between items-center bg-slate-800 p-6 rounded-[32px] border border-slate-700 shadow-xl">
                  <h3 className="text-xl font-black uppercase text-white tracking-widest border-b-2 border-indigo-600 pb-1">Accesos Maestros</h3>
                  <div className="flex gap-2">
                    <button onClick={() => initializeDatabase()} className="bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-slate-700 text-slate-400"><Database size={16} /> Inicializar</button>
                    <button onClick={() => { resetForms(); setModalType('SUPER_ADMIN'); }} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl border border-indigo-400/20"><ShieldCheck size={16} /> Nuevo Maestro</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {superAdmins.map(sa => (
                    <div key={sa.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 flex justify-between items-center shadow-xl group hover:border-indigo-500/50 transition-all">
                      <div>
                        <p className="font-black text-white text-base uppercase leading-tight">{sa.nombre}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{sa.email}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button onClick={() => openEdit('SUPER_ADMIN', sa)} className="p-2 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                          <Edit3 size={14} />
                        </button>
                        {sa.email !== 'gerencia@grupoiart.com' && (
                          <button onClick={(e) => handleDeleteTrigger(e, sa.id)} className={`p-2 rounded-xl transition-all ${confirmDeleteId === sa.id ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-red-500'}`}>
                            {confirmDeleteId === sa.id ? <span className="text-[9px] font-black">X {deleteTimer}s</span> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- LOYALTY --- */}
            {activeTab === 'loyalty' && (
              <div className="animate-in fade-in duration-500">
                {renderToolbar("Auditoría de Puntos Loyalty", () => {
                  setFormRules(loyaltyRules);
                  setModalType('LOYALTY_RULES');
                }, "Configurar Reglas", <Settings size={16} />)}

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "overflow-x-auto rounded-[32px] border border-slate-800 bg-slate-900 shadow-2xl"}>
                  {viewMode === 'table' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                        <tr>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('adminId')}>
                            <div className="flex items-center">Admin <SortIndicator column="adminId" /></div>
                          </th>
                          <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('description')}>
                            <div className="flex items-center">Concepto <SortIndicator column="description" /></div>
                          </th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('amount')}>
                            <div className="flex items-center justify-center">Pts <SortIndicator column="amount" /></div>
                          </th>
                          <th className="p-5 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                            <div className="flex items-center justify-center">Estado <SortIndicator column="status" /></div>
                          </th>
                          <th className="p-5 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('timestamp')}>
                            <div className="flex items-center justify-end">Fecha <SortIndicator column="timestamp" /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filterList(loyaltyTransactions).map(trans => {
                          const admin = phAdmins.find(a => a.id === trans.adminId);
                          const isPending = trans.status === 'PENDIENTE';
                          return (
                            <tr key={trans.id} className="hover:bg-slate-800/30">
                              <td className="p-5"><div><p className="font-black text-white text-sm uppercase">{admin?.nombre || 'Desc.'}</p><p className="text-[9px] text-slate-500">{admin?.email}</p></div></td>
                              <td className="p-5 text-indigo-400 font-black uppercase text-[10px]">{trans.description}</td>
                              <td className="p-5 text-center font-black text-base text-emerald-400">{trans.amount}</td>
                              <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${trans.status === 'APROBADO' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : trans.status === 'RECHAZADO' ? 'bg-red-900/30 text-red-400 border-red-500/50' : 'bg-amber-900/30 text-amber-400 border-amber-500/50'}`}>{trans.status}</span></td>
                              <td className="p-5 text-right">
                                {isPending ? (
                                  <div className="flex justify-end gap-2">
                                    {rejectingId === trans.id ? (
                                      <div className="flex items-center gap-2">
                                        <input autoFocus placeholder="Motivo?" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-slate-950 border border-red-500/50 text-[9px] px-2 py-1 rounded text-white" />
                                        <button onClick={() => { rejectLoyaltyTransaction(trans.id, rejectionReason); setRejectingId(null); setRejectionReason(''); }} className="bg-red-600 p-1.5 rounded-lg"><Check size={14} /></button>
                                      </div>
                                    ) : (
                                      <>
                                        <button onClick={() => approveLoyaltyTransaction(trans.id)} className="p-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={14} /></button>
                                        <button onClick={() => setRejectingId(trans.id)} className="p-2 bg-red-600/10 text-red-500 border border-red-100/20 rounded-xl hover:bg-red-600 hover:text-white transition-all"><XCircle size={14} /></button>
                                      </>
                                    )}
                                  </div>
                                ) : <div className="text-slate-600 font-black text-[9px] uppercase">✓ OK</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {viewMode === 'grid' && filterList(loyaltyTransactions).map(trans => {
                    const admin = phAdmins.find(a => a.id === trans.adminId);
                    const isPending = trans.status === 'PENDIENTE';
                    return (
                      <div key={trans.id} className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="bg-slate-800 p-2 rounded-xl text-indigo-400">
                            <Award size={18} />
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${trans.status === 'APROBADO' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : trans.status === 'RECHAZADO' ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-amber-900/30 text-amber-400 border-amber-500/30'}`}>
                            {trans.status}
                          </span>
                        </div>
                        <div className="mb-4">
                          <h4 className="text-sm font-black text-white uppercase line-clamp-2 leading-tight mb-1">{trans.description}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(trans.timestamp).toLocaleDateString()} • {new Date(trans.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[100px]">{admin?.nombre || 'Admin'}</p>
                            <p className={`text-sm font-black ${trans.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {trans.amount > 0 ? '+' : ''}{trans.amount} Pts
                            </p>
                          </div>
                          {isPending && (
                            <div className="flex gap-1">
                              <button onClick={() => approveLoyaltyTransaction(trans.id)} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"><Check size={12} /></button>
                              <button onClick={() => setRejectingId(trans.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500"><XCircle size={12} /></button>
                            </div>
                          )}
                        </div>
                        {rejectingId === trans.id && (
                          <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-2">
                            <input autoFocus placeholder="Motivo?" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full bg-slate-950 border border-red-500/50 text-[9px] px-2 py-1.5 rounded-lg text-white" />
                            <button onClick={() => { rejectLoyaltyTransaction(trans.id, rejectionReason); setRejectingId(null); setRejectionReason(''); }} className="bg-red-600 p-1.5 rounded-lg text-white"><Check size={12} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODALES COMPLETOS */}
        {modalType !== 'NONE' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-slate-900 rounded-[40px] w-full max-w-lg p-8 shadow-2xl border border-slate-800 animate-in zoom-in max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <h3 className="font-black text-xl text-white uppercase tracking-tight">
                  {modalType === 'LOYALTY_RULES' ? 'Reglas de Fidelización' : editingId ? 'Editar Registro' : 'Nuevo Registro'}
                </h3>
                <button onClick={resetForms} className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ... (Existing modal content) ... */}
                {modalType === 'BUILDING' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nombre Edificio</label><input required value={formBuilding.nombre} onChange={e => setFormBuilding({ ...formBuilding, nombre: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">NIT</label><input required value={formBuilding.nit} onChange={e => setFormBuilding({ ...formBuilding, nit: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Unidades</label><input required type="number" value={formBuilding.cantidadUnidades} onChange={e => setFormBuilding({ ...formBuilding, cantidadUnidades: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    </div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Dirección</label><input required value={formBuilding.direccion} onChange={e => setFormBuilding({ ...formBuilding, direccion: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Admins Asignados</label><div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2">{phAdmins.map(admin => <div key={admin.id} onClick={() => setFormBuilding(prev => ({ ...prev, adminIds: prev.adminIds.includes(admin.id) ? prev.adminIds.filter(id => id !== admin.id) : [...prev.adminIds, admin.id] }))} className={`p-3 rounded-xl cursor-pointer text-xs font-bold border transition-all ${formBuilding.adminIds.includes(admin.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>{admin.nombre}</div>)}</div></div>
                  </>
                )}
                {modalType === 'ASSEMBLY' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nombre Evento</label><input required value={formAssembly.nombre} onChange={e => setFormAssembly({ ...formAssembly, nombre: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Fecha</label><input required type="date" value={formAssembly.fecha} onChange={e => setFormAssembly({ ...formAssembly, fecha: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Tipo</label><select value={formAssembly.tipo} onChange={e => setFormAssembly({ ...formAssembly, tipo: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold"><option value="ORDINARIA">Ordinaria</option><option value="EXTRAORDINARIA">Extraordinaria</option></select></div>
                    </div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Edificio</label><select required value={formAssembly.copropiedadId} onChange={e => setFormAssembly({ ...formAssembly, copropiedadId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold"><option value="">-- Seleccionar --</option>{copropiedades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Plan</label><select value={formAssembly.serviceType} onChange={e => setFormAssembly({ ...formAssembly, serviceType: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold"><option value="BASICO">Básico</option><option value="PREMIUM">Premium</option></select></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Modulo IA</label><button type="button" onClick={() => setFormAssembly({ ...formAssembly, actaInteligenteEnabled: !formAssembly.actaInteligenteEnabled })} className={`w-full h-[54px] rounded-2xl border font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 ${formAssembly.actaInteligenteEnabled ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}><Sparkles size={14} /> {formAssembly.actaInteligenteEnabled ? 'IA ON' : 'IA OFF'}</button></div>
                    </div>
                  </>
                )}
                {modalType === 'ADMIN' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nombre Completo</label><input required value={formAdmin.nombre} onChange={e => setFormAdmin({ ...formAdmin, nombre: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Correo Electrónico</label><input required type="email" value={formAdmin.email} onChange={e => setFormAdmin({ ...formAdmin, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Cédula</label><input value={formAdmin.cedula} onChange={e => setFormAdmin({ ...formAdmin, cedula: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Teléfono</label><input value={formAdmin.telefono} onChange={e => setFormAdmin({ ...formAdmin, telefono: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    </div>
                    <div className="space-y-1 relative"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nueva Contraseña</label><input type="password" placeholder={editingId ? "Vacío para mantener" : "Clave temporal"} value={formAdmin.password} onChange={e => setFormAdmin({ ...formAdmin, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                  </>
                )}
                {modalType === 'SUPER_ADMIN' && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nombre Maestro</label><input required value={formSuperAdmin.nombre} onChange={e => setFormSuperAdmin({ ...formSuperAdmin, nombre: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Email Acceso</label><input required type="email" value={formSuperAdmin.email} onChange={e => setFormSuperAdmin({ ...formSuperAdmin, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Clave</label><input required={!editingId} type="password" value={formSuperAdmin.password} onChange={e => setFormSuperAdmin({ ...formSuperAdmin, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                  </>
                )}
                {modalType === 'MANUAL_POINTS' && (
                  <>
                    <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20 text-center"><p className="text-[9px] text-indigo-400 font-black uppercase mb-1">Abonar Puntos Discrecionales a:</p><p className="text-white font-black text-sm uppercase">{phAdmins.find(a => a.id === formManualPoints.adminId)?.nombre}</p></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Monto</label><input required type="number" value={formManualPoints.amount} onChange={e => setFormManualPoints({ ...formManualPoints, amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Justificación</label><input required placeholder="Ej: Bonificación referidos" value={formManualPoints.description} onChange={e => setFormManualPoints({ ...formManualPoints, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white text-xs font-bold" /></div>
                  </>
                )}
                {modalType === 'LOYALTY_RULES' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Registro Admin</label><input required type="number" value={formRules.pointsRegister} onChange={e => setFormRules({ ...formRules, pointsRegister: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Crear Edificio</label><input required type="number" value={formRules.pointsCreateBuilding} onChange={e => setFormRules({ ...formRules, pointsCreateBuilding: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Crear Asamblea</label><input required type="number" value={formRules.pointsCreateAssembly} onChange={e => setFormRules({ ...formRules, pointsCreateAssembly: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Subir Legal</label><input required type="number" value={formRules.pointsUploadLegal} onChange={e => setFormRules({ ...formRules, pointsUploadLegal: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Servicio Básico</label><input required type="number" value={formRules.pointsServiceBasic} onChange={e => setFormRules({ ...formRules, pointsServiceBasic: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Servicio Premium</label><input required type="number" value={formRules.pointsServicePremium} onChange={e => setFormRules({ ...formRules, pointsServicePremium: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-500 ml-1">Acta IA</label><input required type="number" value={formRules.pointsServiceAI} onChange={e => setFormRules({ ...formRules, pointsServiceAI: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold" /></div>
                  </div>
                )}
                <button type="submit" disabled={!!isProcessing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl flex justify-center items-center gap-3 mt-6">{isProcessing === 'form' ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />} {editingId || modalType === 'LOYALTY_RULES' ? 'Guardar Cambios' : 'Confirmar Registro'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
