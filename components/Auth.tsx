
import React, { useState } from 'react';
import { useAssembly } from '../store/AssemblyContext.tsx';
import { Layout } from './Layout.tsx';
import { isFirebaseConfigured } from '../firebaseConfig.ts';
import { 
  User, Mail, Lock, Phone, ArrowRight, Database, Cloud, 
  Check, X, Search, MapPin, CreditCard, Key, Smartphone,
  CheckCircle2, AlertCircle, ShieldCheck, Gift, Loader2
} from 'lucide-react';

interface AuthProps {
  initialView: 'login' | 'register' | 'super';
  onBack: () => void;
  setView: (view: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin' | 'payments' | 'manual') => void;
}

export const Auth: React.FC<AuthProps> = ({ initialView, onBack, setView }) => {
  const { loginAdmin, loginSuperAdmin, registerAdmin, isDbReady, recoverEmailByPhone } = useAssembly();
  
  // Estado local para manejar el modo actual
  const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'super'>(initialView);
  
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '', cedula: '', direccion: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Recovery Modal
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<'password' | 'email'>('password');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Terms Modal State
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'FREE' | 'LEGAL'>('FREE');

  const configOk = isFirebaseConfigured();

  const validateRegistration = () => {
      const errors: Record<string, string> = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const numberRegex = /^\d+$/;

      if (adminForm.name.trim().length < 3) errors.name = "Nombre muy corto";
      
      if (!adminForm.cedula.trim()) errors.cedula = "La cédula es obligatoria";
      else if (!numberRegex.test(adminForm.cedula)) errors.cedula = "Solo números permitidos";
      else if (adminForm.cedula.length < 6 || adminForm.cedula.length > 12) errors.cedula = "Longitud inválida (6-12 dígitos)";

      if (!adminForm.email.trim()) errors.email = "Correo obligatorio";
      else if (!emailRegex.test(adminForm.email)) errors.email = "Formato de correo inválido";

      if (!adminForm.phone.trim()) errors.phone = "Celular obligatorio";
      else if (!numberRegex.test(adminForm.phone)) errors.phone = "Solo números permitidos";
      else if (adminForm.phone.length !== 10) errors.phone = "Debe tener 10 dígitos (Celular Colombia)";

      if (!adminForm.direccion.trim()) errors.direccion = "Dirección obligatoria";

      if (!adminForm.password) errors.password = "Contraseña obligatoria";
      else if (adminForm.password.length < 6) errors.password = "Mínimo 6 caracteres";

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configOk) {
      setError('Configuración de base de datos pendiente.');
      return;
    }
    
    if (currentMode === 'register') {
        if (!acceptedTerms) {
            setError('Debe aceptar la política de datos y responsabilidad legal.');
            return;
        }
        if (!validateRegistration()) {
            setError('Por favor corrija los errores en el formulario.');
            return;
        }
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (currentMode === 'register') {
        const res = await registerAdmin({ 
            nombre: adminForm.name, 
            email: adminForm.email, 
            telefono: adminForm.phone, 
            password: adminForm.password,
            cedula: adminForm.cedula,
            direccion: adminForm.direccion,
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString()
        });
        if (res.success) setView('admin');
        else setError(res.message || 'Error en el registro');
      } else if (currentMode === 'login') {
        const res = await loginAdmin(adminForm.email, adminForm.password);
        if (res.success) setView('admin');
        else setError(res.message || 'Error en el acceso');
      } else if (currentMode === 'super') {
        const res = await loginSuperAdmin(adminForm.email, adminForm.password);
        if (res.success) setView('superadmin');
        else setError(res.message || 'Acceso Denegado');
      }
    } catch (err) {
      setError('Ocurrió un error técnico. Intente de nuevo.');
      console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
      e.preventDefault();
      setRecoveryLoading(true);
      setRecoveredEmail(null);
      try {
          const email = await recoverEmailByPhone(recoveryPhone);
          if (email) {
              setRecoveredEmail(email);
          } else {
              setRecoveredEmail('NOT_FOUND');
          }
      } catch (err) {
          console.error(err);
      } finally {
          setRecoveryLoading(false);
      }
  };

  return (
    <Layout title={currentMode === 'super' ? "Acceso Seguridad" : "Panel de Gestión"} onBackToHome={onBack}>
      <div className="max-w-md mx-auto py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
         <button onClick={onBack} className="text-slate-400 font-bold text-xs uppercase hover:text-indigo-600 transition-colors">← Volver al Portal</button>
         
         <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 space-y-6">
           {!configOk ? (
             <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
               <Database size={18} className="shrink-0" />
               Falta configurar las credenciales en firebaseConfig.ts
             </div>
           ) : !isDbReady && (
             <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3 text-indigo-700 text-[10px] font-black uppercase tracking-widest animate-pulse">
               <Cloud size={18} className="shrink-0" />
               Sincronizando Base de Datos...
             </div>
           )}

           <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase">
                {currentMode === 'login' ? 'Iniciar Sesión' : currentMode === 'register' ? 'Nuevo Administrador' : 'Super Panel'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">GestorPH Profesional</p>
           </div>

           <form onSubmit={handleAdminAuth} className="space-y-4" autoComplete="off">
              {currentMode === 'register' && (
                <>
                  <div className="space-y-1">
                      <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            required 
                            type="text" 
                            placeholder="Nombre Completo" 
                            value={adminForm.name} 
                            onChange={e => { setAdminForm({...adminForm, name: e.target.value}); if(fieldErrors.name) setFieldErrors({...fieldErrors, name: ''}); }} 
                            className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-indigo-600 font-bold text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                            autoComplete="off" 
                          />
                      </div>
                      {fieldErrors.name && <p className="text-[9px] text-red-500 font-bold pl-4">{fieldErrors.name}</p>}
                  </div>

                  <div className="space-y-1">
                      <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            required 
                            type="number" 
                            placeholder="Cédula de Ciudadanía" 
                            value={adminForm.cedula} 
                            onChange={e => { setAdminForm({...adminForm, cedula: e.target.value}); if(fieldErrors.cedula) setFieldErrors({...fieldErrors, cedula: ''}); }} 
                            className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-indigo-600 font-bold text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors.cedula ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                            autoComplete="off" 
                          />
                      </div>
                      {fieldErrors.cedula && <p className="text-[9px] text-red-500 font-bold pl-4">{fieldErrors.cedula}</p>}
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        required 
                        type="email" 
                        placeholder={currentMode === 'super' ? "Email Maestro" : "Email Profesional"} 
                        value={adminForm.email} 
                        onChange={e => { setAdminForm({...adminForm, email: e.target.value}); if(fieldErrors.email) setFieldErrors({...fieldErrors, email: ''}); }} 
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-indigo-600 font-bold text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                        autoComplete="new-password" 
                    />
                </div>
                {fieldErrors.email && <p className="text-[9px] text-red-500 font-bold pl-4">{fieldErrors.email}</p>}
              </div>

              {currentMode === 'register' && (
                  <>
                      <div className="space-y-1">
                          <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                required 
                                type="tel" 
                                placeholder="Celular (10 dígitos)" 
                                value={adminForm.phone} 
                                onChange={e => { setAdminForm({...adminForm, phone: e.target.value}); if(fieldErrors.phone) setFieldErrors({...fieldErrors, phone: ''}); }} 
                                className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-indigo-600 font-bold text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                                autoComplete="off" 
                              />
                          </div>
                          {fieldErrors.phone && <p className="text-[9px] text-red-500 font-bold pl-4">{fieldErrors.phone}</p>}
                      </div>

                      <div className="space-y-1">
                          <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                required 
                                type="text" 
                                placeholder="Dirección Correspondencia" 
                                value={adminForm.direccion} 
                                onChange={e => { setAdminForm({...adminForm, direccion: e.target.value}); if(fieldErrors.direccion) setFieldErrors({...fieldErrors, direccion: ''}); }} 
                                className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-indigo-600 font-bold text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors.direccion ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                                autoComplete="off" 
                              />
                          </div>
                          {fieldErrors.direccion && <p className="text-[9px] text-red-500 font-bold pl-4">{fieldErrors.direccion}</p>}
                      </div>
                  </>
              )}
              
              <div className="space-y-1">
                  <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        required 
                        type="password" 
                        placeholder="Contraseña" 
                        value={adminForm.password} 
                        onChange={e => { setAdminForm({...adminForm, password: e.target.value}); if(fieldErrors.password) setFieldErrors({...fieldErrors, password: ''}); }} 
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-indigo-600 font-bold text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-100'}`} 
                        autoComplete="new-password" 
                      />
                  </div>
                  {fieldErrors.password && <p className="text-[9px] text-red-500 font-bold pl-4">{fieldErrors.password}</p>}
              </div>

              {currentMode === 'register' && (
                  <div 
                      className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => setAcceptedTerms(!acceptedTerms)}
                  >
                      <div className="relative flex items-center pt-0.5">
                          <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${acceptedTerms ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                              <Check size={10} className={`text-white transition-opacity ${acceptedTerms ? 'opacity-100' : 'opacity-0'}`} />
                          </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          <span>Acepto la </span>
                          <button 
                              type="button" 
                              onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  setTermsTab('LEGAL'); 
                                  setIsTermsOpen(true);
                              }} 
                              className="text-indigo-600 font-black hover:underline relative z-10"
                          >
                              política de tratamiento de datos
                          </button>
                          <span> y asumo la responsabilidad como Representante Legal en el manejo de la información.</span>
                      </div>
                  </div>
              )}

              {error && <p className="text-red-600 text-[10px] mt-3 font-black uppercase text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

              <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 ${currentMode === 'super' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : (currentMode === 'login' ? 'Entrar al Panel' : currentMode === 'register' ? 'Crear Mi Cuenta' : 'Acceder')} {!isSubmitting && <ArrowRight size={18} />}
              </button>
           </form>

           <div className="flex flex-col items-center gap-2">
               <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                  {currentMode === 'login' && <button onClick={() => { setCurrentMode('register'); setError(''); setFieldErrors({}); }} className="hover:text-indigo-600 underline">¿No tienes cuenta? Regístrate</button>}
                  {currentMode === 'register' && <button onClick={() => { setCurrentMode('login'); setError(''); setFieldErrors({}); }} className="hover:text-indigo-600 underline">¿Ya eres miembro? Ingresa</button>}
               </div>
               {currentMode !== 'super' && (
                   <button onClick={() => setIsRecoveryOpen(true)} className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700 underline mt-2">
                      ¿Olvidaste tus datos?
                   </button>
               )}
           </div>
         </div>
      </div>

      {/* RECOVERY MODAL */}
      {isRecoveryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-lg uppercase">Recuperación</h3>
                      <button onClick={() => setIsRecoveryOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                      <button onClick={() => {setRecoveryTab('password'); setRecoveredEmail(null);}} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${recoveryTab === 'password' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Clave</button>
                      <button onClick={() => {setRecoveryTab('email'); setRecoveredEmail(null);}} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${recoveryTab === 'email' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Correo</button>
                  </div>

                  {recoveryTab === 'password' ? (
                      <div className="text-center space-y-4">
                          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                              <Key className="mx-auto text-indigo-500 mb-2" size={24} />
                              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                  Por seguridad, la recuperación de contraseña se gestiona a través de nuestro equipo de soporte verificado.
                              </p>
                          </div>
                          <a 
                              href="https://wa.me/573502809714?text=Hola,%20olvidé%20mi%20contraseña%20de%20GestorPH" 
                              target="_blank"
                              rel="noreferrer"
                              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700"
                          >
                              <Smartphone size={16} /> Contactar Soporte
                          </a>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <p className="text-xs text-slate-500 font-medium text-center">
                              Ingrese su número de celular para consultar el correo asociado.
                          </p>
                          <form onSubmit={handleRecovery} className="space-y-3">
                              <div className="relative">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                  <input 
                                      required 
                                      type="tel" 
                                      placeholder="Número de Celular" 
                                      value={recoveryPhone} 
                                      onChange={e => setRecoveryPhone(e.target.value)} 
                                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                                      autoComplete="off"
                                  />
                              </div>
                              <button type="submit" disabled={recoveryLoading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">
                                  {recoveryLoading ? 'Buscando...' : 'Consultar'} <Search size={14} />
                              </button>
                          </form>

                          {recoveredEmail && (
                              <div className={`p-4 rounded-xl border text-center ${recoveredEmail === 'NOT_FOUND' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                  {recoveredEmail === 'NOT_FOUND' ? (
                                      <p className="text-[10px] font-black uppercase">No se encontró cuenta asociada</p>
                                  ) : (
                                      <div>
                                          <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Correo Registrado:</p>
                                          <p className="font-bold text-sm break-all">{recoveredEmail}</p>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* MODAL TÉRMINOS Y CONDICIONES (Para Registro) */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
              
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                 <div>
                    <h3 className="font-black text-lg text-slate-900 uppercase">Marco Legal y Beneficios</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">GestorPH • Grupo Iart SAS</p>
                 </div>
                 <button onClick={() => setIsTermsOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
              </div>

              <div className="flex p-2 bg-slate-100 shrink-0 gap-2 mx-6 mt-4 rounded-xl">
                 <button 
                   onClick={() => setTermsTab('FREE')}
                   className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${termsTab === 'FREE' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <Gift size={14} /> Beneficio Gratis
                 </button>
                 <button 
                   onClick={() => setTermsTab('LEGAL')}
                   className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${termsTab === 'LEGAL' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <ShieldCheck size={14} /> Términos del Servicio
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                 {termsTab === 'FREE' ? (
                    <div className="space-y-6">
                       <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl">
                          <h4 className="font-black text-emerald-800 uppercase text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> ¿Cómo aplicar al Beneficio?</h4>
                          <ol className="list-decimal list-inside text-xs font-medium text-emerald-900 space-y-2">
                             <li>Regístrese como Administrador en la plataforma.</li>
                             <li>Cree su Copropiedad (Edificio/Conjunto) y configure las unidades.</li>
                             <li>Envíe el RUT de la copropiedad a nuestro WhatsApp <strong>+57 3502809714</strong>.</li>
                             <li>Una vez validado que el NIT es nuevo en nuestra red, activaremos el plan sin costo.</li>
                          </ol>
                       </div>

                       <div className="space-y-4">
                          <h4 className="font-black text-slate-900 uppercase text-sm border-b pb-2">Condiciones y Restricciones</h4>
                          <ul className="space-y-3">
                             <li className="flex gap-3 text-xs text-slate-600">
                                <AlertCircle size={16} className="text-amber-500 shrink-0"/>
                                <span><strong>Un solo uso por NIT:</strong> El beneficio es válido exclusivamente para la primera asamblea realizada por la copropiedad en nuestra plataforma.</span>
                             </li>
                             <li className="flex gap-3 text-xs text-slate-600">
                                <AlertCircle size={16} className="text-amber-500 shrink-0"/>
                                <span><strong>Límite de Unidades:</strong> Aplica para copropiedades de hasta <strong>50 unidades inmobiliarias</strong>. Para copropiedades de más de 50, se ofrece un 30% de descuento en el primer evento.</span>
                             </li>
                             <li className="flex gap-3 text-xs text-slate-600">
                                <AlertCircle size={16} className="text-amber-500 shrink-0"/>
                                <span><strong>Modalidad Autogestionada:</strong> El beneficio otorga acceso completo al software, pero no incluye moderador remoto, ni personal de soporte presencial. El administrador opera la herramienta.</span>
                             </li>
                             <li className="flex gap-3 text-xs text-slate-600">
                                <AlertCircle size={16} className="text-amber-500 shrink-0"/>
                                <span><strong>Vigencia:</strong> El beneficio debe ser redimido dentro de los 30 días calendario posteriores al registro de la copropiedad.</span>
                             </li>
                          </ul>
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-6 text-xs text-slate-600 text-justify leading-relaxed">
                       <p><strong>1. OBJETO DEL SERVICIO:</strong> Grupo Iart SAS provee a "EL CLIENTE" (Copropiedad/Administrador) el acceso a la plataforma GestorPH bajo la modalidad SaaS (Software as a Service) para la gestión de votaciones en asambleas de propiedad horizontal.</p>
                       
                       <p><strong>2. ALCANCE Y LIMITACIONES:</strong> La licencia de uso se otorga por evento (Asamblea), con una duración máxima de 24 horas continuas de operación. La plataforma garantiza la integridad del cálculo de coeficientes y quórum basado en la información suministrada por EL CLIENTE.</p>
                       
                       <p><strong>3. HABEAS DATA Y PRIVACIDAD:</strong> En cumplimiento de la Ley 1581 de 2012, Grupo Iart SAS actúa como ENCARGADO del tratamiento de datos. EL CLIENTE garantiza que cuenta con la autorización de los titulares (propietarios) para cargar sus datos básicos (Nombre, Unidad, Email, Coeficiente) en la plataforma con fines exclusivamente logísticos para la asamblea.</p>
                       
                       <p><strong>4. POLÍTICA DE REEMBOLSOS:</strong> Debido a la naturaleza digital del servicio y los costos de reserva de infraestructura en la nube, no se realizarán devoluciones de dinero una vez activada la asamblea o iniciado el evento, salvo fallas técnicas mayores imputables exclusivamente a la plataforma que impidan el desarrollo de la votación.</p>
                       
                       <p><strong>5. SOPORTE TÉCNICO:</strong> El soporte se presta en horario hábil (Lunes a Viernes 8am - 6pm y Sábados 8am - 12pm). Para asambleas fuera de este horario, se requiere la contratación del plan "Asistido Premium".</p>
                    </div>
                 )}
              </div>

              <div className="p-6 border-t bg-slate-50 text-center">
                 <button onClick={() => setIsTermsOpen(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all">Entendido</button>
              </div>
           </div>
        </div>
      )}

    </Layout>
  );
};
