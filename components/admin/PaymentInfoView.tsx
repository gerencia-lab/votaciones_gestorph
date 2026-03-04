
import React, { useState, useEffect } from 'react';
import { Layout } from '../Layout.tsx';
import {
  ArrowLeft, Copy, Check, Smartphone, Mail,
  MessageCircle, CreditCard, Wallet, Banknote, ListOrdered, FileText, X, Gift, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';

interface PaymentInfoViewProps {
  setView: (view: 'admin' | 'home') => void;
}

export const PaymentInfoView: React.FC<PaymentInfoViewProps> = ({ setView }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'FREE' | 'LEGAL'>('FREE');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const paymentMethods = [
    {
      id: 'nu',
      name: 'Breve Nu',
      handle: '@CTS760',
      color: 'bg-[#9333ea]', // Morado Nu
      textColor: 'text-white',
      icon: <CreditCard size={24} />
    },
    {
      id: 'daviplata',
      name: 'Daviplata',
      handle: '3502809714',
      color: 'bg-[#ff0000]', // Rojo Daviplata
      textColor: 'text-white',
      icon: <Smartphone size={24} />
    },
    {
      id: 'nequi',
      name: 'Nequi',
      handle: '3502809714',
      color: 'bg-[#da0081]', // Rosado/Morado Nequi
      textColor: 'text-white',
      icon: <Wallet size={24} />
    }
  ];

  return (
    <Layout title="Guía de Activación de Asamblea" onBackToHome={() => setView('home')}>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} /> Volver al Inicio
          </button>
          <div className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100">
            <Banknote size={12} /> Pago Único por Asamblea
          </div>
        </div>

        <div className="text-center space-y-6">
          <h2 className="text-3xl font-black text-slate-900 uppercase leading-none">Activar Servicio</h2>

          {/* Instrucciones Claras */}
          <div className="bg-white border-2 border-indigo-50 rounded-[32px] p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>

            <div className="relative z-10">
              <h3 className="text-indigo-900 font-black uppercase text-sm mb-6 flex items-center gap-2">
                <ListOrdered size={20} className="text-indigo-600" /> Pasos para iniciar su asamblea:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative pl-4 border-l-2 border-indigo-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm"></div>
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-1">1. Realice el Pago</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Use cualquiera de los métodos abajo. El pago es <span className="font-bold text-indigo-600">por cada asamblea</span> a realizar.
                  </p>
                </div>
                <div className="relative pl-4 border-l-2 border-indigo-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-400 border-2 border-white shadow-sm"></div>
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-1">2. Reporte el Pago</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Envíe el comprobante por WhatsApp o Email indicando el nombre del edificio.
                  </p>
                </div>
                <div className="relative pl-4 border-l-2 border-emerald-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-1">3. Activación</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Un asesor habilitará el botón "Abrir Asamblea" en su panel inmediatamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-2 pt-2">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Tarifas Vigentes 2025 (Pago por Evento)
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase border border-indigo-100 shadow-sm">
                Autogestionado: $500.000
              </span>
              <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase border border-slate-800 shadow-lg">
                Con Acompañamiento: $750.000
              </span>
            </div>
          </div>
        </div>

        {/* Payment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`relative overflow-hidden rounded-[32px] p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between h-48 ${method.color} ${method.textColor}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 blur-xl"></div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  {method.icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Método de Pago</div>
              </div>

              <div className="relative z-10 space-y-1">
                <h3 className="font-black text-lg uppercase tracking-tight">{method.name}</h3>
                <div className="flex items-center justify-between bg-black/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                  <span className="font-mono text-base font-black tracking-widest">{method.handle}</span>
                  <button
                    onClick={() => handleCopy(method.handle, method.id)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    {copied === method.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl p-8 sm:p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><ShieldCheck size={20} /></div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Reportar Pago</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Una vez realizado el pago a nombre de <strong className="text-slate-900">Camilo Andrés Triana y S</strong>, envíe el comprobante para habilitar su asamblea de inmediato.
              </p>
              <div className="pt-4 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/573502809714?text=Hola,%20adjunto%20comprobante%20de%20pago%20para%20activar%20mi%20asamblea"
                  target="_blank"
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all"
                >
                  <MessageCircle size={16} /> Enviar por WhatsApp
                </a>
                <a
                  href="mailto:gsoporte@grupoiart.com?subject=Soporte de Pago Asamblea&body=Hola, adjunto el comprobante de pago realizado para activar la asamblea..."
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all"
                >
                  <Mail size={16} /> Enviar por Correo
                </a>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-3 mb-3">Información de Soporte</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 group">
                  <Smartphone size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Contacto</p>
                    <p className="text-[11px] font-bold text-slate-700">+57 3502809714</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 group">
                  <Mail size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Email</p>
                    <p className="text-[11px] font-bold text-slate-700">gsoporte@grupoiart.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 group">
                  <ShieldCheck size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Titular</p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">Camilo A. Triana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pb-10">
          <button
            onClick={() => setIsTermsOpen(true)}
            className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors border-b border-transparent hover:border-indigo-200 flex items-center gap-2 mx-auto"
          >
            <FileText size={10} /> Términos y Condiciones
          </button>
        </div>

        {/* MODAL TÉRMINOS Y CONDICIONES (DUPLICADO PARA ACCESO LOCAL RÁPIDO) */}
        {isTermsOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">

              <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h3 className="font-black text-lg text-slate-900 uppercase">Marco Legal y Beneficios</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">GestorPH • Grupo Iart SAS</p>
                </div>
                <button onClick={() => setIsTermsOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
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
                      <h4 className="font-black text-emerald-800 uppercase text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> ¿Cómo aplicar al Beneficio?</h4>
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
                          <AlertCircle size={16} className="text-amber-500 shrink-0" />
                          <span><strong>Un solo uso por NIT:</strong> El beneficio es válido exclusivamente para la primera asamblea realizada por la copropiedad en nuestra plataforma.</span>
                        </li>
                        <li className="flex gap-3 text-xs text-slate-600">
                          <AlertCircle size={16} className="text-amber-500 shrink-0" />
                          <span><strong>Límite de Unidades:</strong> Aplica para copropiedades de hasta <strong>50 unidades inmobiliarias</strong>. Para copropiedades de más de 50, se ofrece un 30% de descuento en el primer evento.</span>
                        </li>
                        <li className="flex gap-3 text-xs text-slate-600">
                          <AlertCircle size={16} className="text-amber-500 shrink-0" />
                          <span><strong>Modalidad Autogestionada:</strong> El beneficio otorga acceso completo al software, pero no incluye moderador remoto, ni personal de soporte presencial. El administrador opera la herramienta.</span>
                        </li>
                        <li className="flex gap-3 text-xs text-slate-600">
                          <AlertCircle size={16} className="text-amber-500 shrink-0" />
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
      </div>
    </Layout>
  );
};
