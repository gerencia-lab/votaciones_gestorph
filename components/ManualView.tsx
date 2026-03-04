
import React, { useState, useEffect } from 'react';
import { Layout } from './Layout.tsx';
import {
   BookOpen, Users, UserCog, Building2, QrCode, Smartphone,
   CheckCircle2, FileSpreadsheet, Printer, Scan, Play,
   BarChart3, ShieldCheck, HelpCircle, ArrowRight, UserPlus, Calendar, Power, FileText, Vote,
   Presentation, Clock, Maximize2, History
} from 'lucide-react';

interface ManualViewProps {
   setView: (view: 'home' | 'manual') => void;
}

export const ManualView: React.FC<ManualViewProps> = ({ setView }) => {
   const [activeTab, setActiveTab] = useState<'ADMIN' | 'VOTER' | 'PROXY'>('ADMIN');

   // Scroll to top on mount
   useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }, []);

   return (
      <Layout title="Centro de Ayuda y Documentación" onBackToHome={() => setView('home')}>
         <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Hero */}
            <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                     <BookOpen size={14} /> Manual Interactivo v4.6
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-4">
                     ¿Cómo funciona <span className="text-indigo-400">GestorPH?</span>
                  </h1>
                  <p className="text-slate-400 font-medium text-sm max-w-2xl leading-relaxed">
                     Nuestra filosofía es <strong>"Cero Fricción"</strong>. Eliminamos las barreras tecnológicas mediante el uso de códigos QR físicos y una interfaz web que no requiere instalar aplicaciones. A continuación, seleccione su rol para ver el paso a paso.
                  </p>
               </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white p-2 rounded-[24px] shadow-sm border border-slate-100">
               <button
                  onClick={() => setActiveTab('ADMIN')}
                  className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeTab === 'ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}
               >
                  <UserCog size={24} />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Administrador</span>
               </button>
               <button
                  onClick={() => setActiveTab('VOTER')}
                  className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeTab === 'VOTER' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}
               >
                  <Smartphone size={24} />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Asambleísta</span>
               </button>
               <button
                  onClick={() => setActiveTab('PROXY')}
                  className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeTab === 'PROXY' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}
               >
                  <Users size={24} />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Apoderado</span>
               </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">

               {/* ---------------- ADMINISTRADOR ---------------- */}
               {activeTab === 'ADMIN' && (
                  <div className="p-8 space-y-12">
                     <div className="border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                           <UserCog className="text-indigo-600" /> Flujo de Gestión Completo
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">Siga estos pasos cronológicos para el éxito de su asamblea.</p>
                     </div>

                     {/* FASE 1: CONFIGURACIÓN */}
                     <div className="space-y-6">
                        <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                           Fase 1: Configuración Inicial
                        </div>

                        {/* Paso 1 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black group-hover:bg-indigo-600 transition-colors">1</div>
                              <div className="w-0.5 h-full bg-slate-200"></div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <UserPlus size={16} className="text-indigo-500" /> Registro de Cuenta
                              </h3>
                              <p className="text-xs text-slate-600">
                                 En la pantalla de inicio, haga clic en <strong>"Soy Administrador"</strong> y luego en "Crear Mi Cuenta". Complete sus datos profesionales.
                              </p>
                           </div>
                        </div>

                        {/* Paso 2 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black group-hover:bg-indigo-600 transition-colors">2</div>
                              <div className="w-0.5 h-full bg-slate-200"></div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <Building2 size={16} className="text-indigo-500" /> Crear Copropiedad
                              </h3>
                              <p className="text-xs text-slate-600">
                                 Dentro del panel, vaya a la pestaña "Edificios" y pulse <strong>"Nuevo Edificio"</strong>. Ingrese el Nombre, NIT, Dirección y Total de Unidades.
                              </p>
                           </div>
                        </div>

                        {/* Paso 3 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black group-hover:bg-indigo-600 transition-colors">3</div>
                              <div className="w-0.5 h-full bg-slate-200"></div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <Calendar size={16} className="text-indigo-500" /> Crear Asamblea
                              </h3>
                              <p className="text-xs text-slate-600">
                                 En la pestaña "Eventos", pulse <strong>"Crear Evento"</strong>. Seleccione el edificio que acaba de crear, asigne una fecha y el tipo (Ordinaria/Extraordinaria).
                              </p>
                           </div>
                        </div>

                        {/* Paso 4 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black group-hover:bg-indigo-600 transition-colors">4</div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <FileSpreadsheet size={16} className="text-indigo-500" /> Carga Masiva de Unidades (Enrolamiento)
                              </h3>
                              <p className="text-xs text-slate-600">
                                 Ingrese a la gestión de la asamblea. Vaya a la pestaña <strong>"Unidades"</strong> &rarr; "Importar Masivamente". Copie y pegue desde Excel las columnas: <i>Nombre Unidad, Coeficiente, Propietario</i>.
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="h-px bg-slate-100 my-4"></div>

                     {/* FASE 2: LOGÍSTICA */}
                     <div className="space-y-6">
                        <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                           Fase 2: Preparación Logística
                        </div>

                        {/* Paso 5 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-600 text-indigo-600 flex items-center justify-center font-black">5</div>
                              <div className="w-0.5 h-full bg-slate-200"></div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <Printer size={16} className="text-emerald-500" /> Generación de Fichas QR
                              </h3>
                              <p className="text-xs text-slate-600">
                                 Vaya a la pestaña <strong>"Asistencia"</strong>. Haga clic en el botón negro <strong>"Generar Fichas"</strong>. El sistema creará los tokens de seguridad. Imprima el PDF, recorte las fichas y entréguelas al ingreso.
                              </p>
                           </div>
                        </div>

                        {/* Paso 6 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-600 text-indigo-600 flex items-center justify-center font-black">6</div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <Users size={16} className="text-emerald-500" /> Registro de Apoderados
                              </h3>
                              <p className="text-xs text-slate-600">
                                 Si llega una persona con poderes, en la pestaña "Asistencia" use el botón azul <strong>"Apoderado"</strong>. Ingrese el nombre del representante y seleccione todas las unidades que representa. El sistema le asignará una única ficha que suma todos los coeficientes.
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="h-px bg-slate-100 my-4"></div>

                     {/* FASE 3: EJECUCIÓN */}
                     <div className="space-y-6">
                        <div className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                           Fase 3: Durante la Asamblea
                        </div>

                        {/* Paso 7 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-200">7</div>
                              <div className="w-0.5 h-full bg-slate-200"></div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <Play size={16} className="text-emerald-600" /> Inicio y Quórum
                              </h3>
                              <p className="text-xs text-slate-600">
                                 Cuando esté listo, pulse el botón verde <strong>"Abrir Asamblea"</strong> en el panel superior. Luego, en la pestaña "Votaciones", cree una pregunta tipo "Verificación de Quórum" y ábrala. Los asistentes confirmarán en sus celulares.
                              </p>
                           </div>
                        </div>

                        {/* Paso 8 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-200">8</div>
                              <div className="w-0.5 h-full bg-slate-200"></div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <Vote size={16} className="text-emerald-600" /> Gestión de Votaciones
                              </h3>
                              <p className="text-xs text-slate-600">
                                 En la pestaña "Votaciones", use <strong>"Crear Votación"</strong> para cada punto del orden del día.
                                 <br />• Pulse <Play size={10} className="inline mx-1" /> para activar la pregunta en los celulares.
                                 <br />• Pulse <span className="inline-block w-2 h-2 bg-red-500 rounded-sm mx-1"></span> para cerrar la votación y bloquear respuestas.
                              </p>
                           </div>
                        </div>

                        {/* Bloque de Proyección */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 ml-4 mb-4">
                           <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2 mb-4">
                              <Presentation size={18} className="text-indigo-600" /> La Vista de Proyección (Video Beam)
                           </h3>
                           <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                              Para garantizar la transparencia, conecte un segundo monitor o proyector y haga clic en el botón negro <strong>"Proyectar"</strong> del panel. Esta pantalla está diseñada para que la vean los asambleístas.
                           </p>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                                 <div className="flex items-center gap-2 mb-2 text-indigo-600 font-black text-[10px] uppercase">
                                    <BarChart3 size={14} /> Gráficos en Vivo
                                 </div>
                                 <p className="text-[10px] text-slate-500 leading-snug">
                                    Los resultados (Barras o Torta) se animan en tiempo real a medida que la gente vota. No requiere recargar la página.
                                 </p>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
                                 <div className="flex items-center gap-2 mb-2 text-emerald-600 font-black text-[10px] uppercase">
                                    <Clock size={14} /> Cronómetro y Quórum
                                 </div>
                                 <p className="text-[10px] text-slate-500 leading-snug">
                                    Muestra el tiempo restante para votar y una barra de quórum permanente en la parte superior derecha.
                                 </p>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-amber-200 transition-colors">
                                 <div className="flex items-center gap-2 mb-2 text-amber-600 font-black text-[10px] uppercase">
                                    <Maximize2 size={14} /> Modo Enfoque
                                 </div>
                                 <p className="text-[10px] text-slate-500 leading-snug">
                                    Use el botón "Modo Proyector" dentro de la vista para ocultar menús y botones, dejando solo la pregunta y los resultados en pantalla completa.
                                 </p>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors">
                                 <div className="flex items-center gap-2 mb-2 text-slate-600 font-black text-[10px] uppercase">
                                    <History size={14} /> Historial Inmediato
                                 </div>
                                 <p className="text-[10px] text-slate-500 leading-snug">
                                    Si necesita repasar una votación anterior, puede seleccionarla desde el menú desplegable sin salir de la vista de proyección.
                                 </p>
                              </div>
                           </div>
                        </div>

                     </div>

                     <div className="h-px bg-slate-100 my-4"></div>

                     {/* FASE 4: CIERRE */}
                     <div className="space-y-6">
                        <div className="inline-block bg-red-50 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                           Fase 4: Finalización
                        </div>

                        {/* Paso 9 */}
                        <div className="flex gap-4 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-red-500 text-red-500 flex items-center justify-center font-black">9</div>
                           </div>
                           <div className="space-y-2 pb-6">
                              <h3 className="font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                                 <FileText size={16} className="text-red-500" /> Finalizar y Generar Reporte
                              </h3>
                              <p className="text-xs text-slate-600">
                                 Al terminar el orden del día, pulse el botón rojo <strong>"Finalizar"</strong> en el panel superior. Esto bloquea el sistema por seguridad. Finalmente, pulse <strong>"Reporte Votaciones"</strong> para descargar el PDF con todos los resultados y la lista de asistencia.
                              </p>
                           </div>
                        </div>
                     </div>

                  </div>
               )}

               {/* ---------------- VOTANTE ---------------- */}
               {activeTab === 'VOTER' && (
                  <div className="p-8 space-y-10">
                     <div className="border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                           <Smartphone className="text-indigo-600" /> Guía para el Propietario
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">Experiencia "Sin App": fácil, rápida y segura.</p>
                     </div>

                     <div className="grid gap-8">
                        <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                           <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                              <QrCode size={64} className="text-slate-900" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="font-black text-lg text-slate-900 uppercase">1. Reciba su Ficha</h3>
                              <p className="text-sm text-slate-600">
                                 Al llegar a la asamblea, el administrador le entregará una ficha impresa personal e intransferible. Cuídela, es su llave de voto.
                              </p>
                           </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                           <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                              <Scan size={64} className="text-indigo-600" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="font-black text-lg text-slate-900 uppercase">2. Escanee y Entre</h3>
                              <p className="text-sm text-slate-600">
                                 Abra la cámara de su celular y escanee el código QR de la ficha. <strong>No necesita descargar ninguna aplicación</strong> ni crear contraseñas. El sistema lo identificará automáticamente.
                              </p>
                           </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                           <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                              <Play size={64} className="text-emerald-500" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="font-black text-lg text-slate-900 uppercase">3. Vote en Vivo</h3>
                              <p className="text-sm text-slate-600">
                                 Cuando el administrador anuncie una votación, la pregunta aparecerá automáticamente en su pantalla. Seleccione su opción y presione "Enviar".
                              </p>
                              <p className="text-xs text-slate-400 italic bg-white p-2 rounded-lg border border-slate-200 mt-2">
                                 * Si representa varias unidades (propias o poderes), su voto valdrá por la suma de todos los coeficientes que representa.
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* ---------------- APODERADO ---------------- */}
               {activeTab === 'PROXY' && (
                  <div className="p-8 space-y-10">
                     <div className="border-b border-slate-100 pb-6">
                        <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                           <Users className="text-indigo-600" /> Guía para Apoderados
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">Cómo funciona la representación de múltiples unidades.</p>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl">
                           <h3 className="font-black text-amber-800 uppercase text-sm mb-2">Importante</h3>
                           <p className="text-xs text-amber-900 leading-relaxed">
                              Un apoderado <strong>NO</strong> escanea los QRs de las personas que representa. El sistema centraliza todo el poder de voto en una sola sesión (la del apoderado).
                           </p>
                        </div>

                        <div className="space-y-8">
                           {/* Paso 1 */}
                           <div>
                              <h3 className="font-black text-base text-slate-900 uppercase mb-2 flex items-center gap-2">
                                 <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</div>
                                 Registro en Mesa
                              </h3>
                              <p className="text-sm text-slate-600 pl-8">
                                 Acérquese a la mesa de registro y entregue los poderes físicos firmados. El administrador ingresará al sistema y buscará las unidades (Ej: Apto 205, Apto 401).
                              </p>
                           </div>

                           {/* Paso 2 */}
                           <div>
                              <h3 className="font-black text-base text-slate-900 uppercase mb-2 flex items-center gap-2">
                                 <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</div>
                                 Vinculación en Sistema
                              </h3>
                              <p className="text-sm text-slate-600 pl-8">
                                 El administrador usará la opción <strong>"Nuevo Apoderado"</strong>. Allí ingresará su nombre y seleccionará todas las unidades que usted va a representar.
                              </p>
                           </div>

                           {/* Paso 3 */}
                           <div>
                              <h3 className="font-black text-base text-slate-900 uppercase mb-2 flex items-center gap-2">
                                 <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</div>
                                 Una sola Ficha
                              </h3>
                              <p className="text-sm text-slate-600 pl-8">
                                 Se le entregará <strong>UNA SOLA ficha QR</strong> a su nombre. Al escanearla, verá en su perfil que representa múltiples unidades.
                              </p>
                              <div className="ml-8 mt-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                 <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 size={16} className="text-indigo-600" />
                                    <span className="font-bold text-xs text-indigo-900 uppercase">Cálculo Automático</span>
                                 </div>
                                 <p className="text-xs text-slate-600">
                                    Al votar, el sistema sumará automáticamente el coeficiente de su propiedad (si tiene) más el de todos sus poderdantes. No tiene que votar 5 veces; <strong>un clic envía todos los votos</strong>.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

            </div>
         </div>
      </Layout>
   );
};
