
import React from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';
import { FileText, Printer, CheckCircle2 } from 'lucide-react';

export const MinutesPreview: React.FC = () => {
  const { 
    asambleas, copropiedades, selectedAsambleaId, selectedCopropiedadId,
    preguntas, votos, asambleistas, unidades, calculateResults, getVoterCoefficient
  } = useAssembly();

  const activeAsamblea = asambleas.find(as => as.id === selectedAsambleaId);
  const activeCopropiedad = copropiedades.find(cp => cp.id === selectedCopropiedadId);
  const asambleaPreguntas = preguntas.filter(p => p.asambleaId === selectedAsambleaId);
  
  const currentAsmUsers = asambleistas.filter(a => a.asambleaId === selectedAsambleaId);
  const attendingUsers = currentAsmUsers.filter(a => a.asistenciaConfirmada);
  const totalPresent = attendingUsers.length;
  const totalCoefAttendance = attendingUsers.reduce((acc, a) => acc + getVoterCoefficient(a), 0);

  if (!activeAsamblea || !activeCopropiedad) return null;

  return (
    <div className="bg-white p-[1.5cm] sm:p-[2cm] shadow-2xl mx-auto w-full max-w-[21cm] text-slate-900 font-serif leading-relaxed print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0">
      
      {/* Encabezado del Acta */}
      <div className="text-center border-b-2 border-slate-900 pb-8 mb-10">
        <h1 className="text-2xl font-bold uppercase mb-1">Acta de Asamblea de Copropietarios</h1>
        <h2 className="text-xl font-bold uppercase text-indigo-700 print:text-black">{activeAsamblea.nombre}</h2>
        <p className="text-sm font-bold uppercase mt-4">{activeCopropiedad.nombre}</p>
        <p className="text-xs uppercase">NIT: {activeCopropiedad.nit}</p>
        <p className="text-xs mt-1">{activeCopropiedad.direccion}</p>
      </div>

      <div className="space-y-8 text-justify text-sm">
        {/* 1. Información General */}
        <section className="break-inside-avoid">
          <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3">1. Información de la Sesión</p>
          <div className="grid grid-cols-2 gap-y-2">
            <p><strong>Fecha:</strong> {activeAsamblea.fecha}</p>
            <p><strong>Tipo:</strong> {activeAsamblea.tipo}</p>
            <p><strong>Hora de Inicio:</strong> {activeAsamblea.horaInicioReal ? new Date(activeAsamblea.horaInicioReal).toLocaleTimeString() : 'N/A'}</p>
            <p><strong>Estado:</strong> {activeAsamblea.status}</p>
          </div>
        </section>

        {/* 2. Verificación del Quórum */}
        <section className="break-inside-avoid">
          <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3">2. Verificación del Quórum</p>
          <p>
            Se deja constancia de que, de acuerdo con el sistema de registro digital, se encuentran presentes en la sesión un total de <strong>{totalPresent}</strong> asambleístas, 
            que representan un coeficiente de copropiedad del <strong>{totalCoefAttendance.toFixed(3)}%</strong>. 
            Con base en lo anterior, se declara que {totalCoefAttendance > 50 ? 'EXISTE' : 'NO EXISTE'} quórum deliberatorio y decisorio según los términos de la Ley 675 de 2001.
          </p>
        </section>

        {/* 3. Desarrollo de Votaciones */}
        <section>
          <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3">3. Desarrollo del Orden del Día y Votaciones</p>
          <p className="mb-4">A continuación se detallan las proposiciones sometidas a votación y sus respectivos resultados:</p>
          
          <div className="space-y-8">
            {asambleaPreguntas.map((p, idx) => {
              const results = calculateResults(p.id, 'coeficiente');
              const totalVotos = votos.filter(v => v.preguntaId === p.id).length;
              
              return (
                <div key={p.id} className="pl-4 border-l-2 border-slate-100 break-inside-avoid py-2">
                  <p className="font-bold text-slate-800 mb-2">Punto {idx + 1}: {p.texto}</p>
                  <p className="text-[10px] uppercase text-slate-500 mb-3 italic">Participación: {totalVotos} asambleístas</p>
                  
                  <table className="w-full border-collapse border border-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 p-2 text-left">Opción / Proposición</th>
                        <th className="border border-slate-200 p-2 text-right">Coeficiente (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res, ridx) => (
                        <tr key={ridx}>
                          <td className="border border-slate-200 p-2 uppercase">{res.label}</td>
                          <td className="border border-slate-200 p-2 text-right font-bold">{res.value.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Listado de Unidades Asistentes */}
        <section className="print:break-before-page">
          <p className="font-bold uppercase border-b border-slate-200 pb-1 mb-3">4. Listado de Unidades Asistentes</p>
          <p className="mb-4 text-xs">Las siguientes unidades confirmaron su asistencia y conformaron el quórum de la asamblea:</p>
          
          <table className="w-full border-collapse border border-slate-200 text-[10px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left w-20">Unidad</th>
                <th className="border border-slate-200 p-2 text-left">Asambleísta / Representante</th>
                <th className="border border-slate-200 p-2 text-center w-16">Tipo</th>
                <th className="border border-slate-200 p-2 text-right w-20">Coef.</th>
              </tr>
            </thead>
            <tbody>
              {attendingUsers.map((user) => {
                const userUnits = unidades.filter(u => user.unidadesIds.includes(u.id));
                return userUnits.map((u) => (
                  <tr key={u.id}>
                    <td className="border border-slate-200 p-2 font-bold">{u.nombre}</td>
                    <td className="border border-slate-200 p-2">{user.nombre}</td>
                    <td className="border border-slate-200 p-2 text-center uppercase text-[8px]">{user.esApoderado ? 'Poder' : 'Prop.'}</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">{(u.coeficiente || 0).toFixed(3)}%</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </section>
      </div>

      {/* Firmas */}
      <div className="mt-20 pt-4 break-inside-avoid">
        <div className="grid grid-cols-2 gap-12 mb-12 text-xs">
            <div>
                <div className="border-t border-slate-900 w-full mb-2"></div>
                <p className="font-bold uppercase">Presidente de Asamblea</p>
                <p className="text-[10px] text-slate-500">C.C.</p>
            </div>
            <div>
                <div className="border-t border-slate-900 w-full mb-2"></div>
                <p className="font-bold uppercase">Secretario de Asamblea</p>
                <p className="text-[10px] text-slate-500">C.C.</p>
            </div>
        </div>
        <div className="flex justify-center mb-12 text-xs">
            <div className="w-1/2 text-center">
                <div className="border-t border-slate-900 w-full mb-2 mx-auto"></div>
                <p className="font-bold uppercase">Administrador</p>
                <p className="text-[10px] text-slate-500">C.C.</p>
            </div>
        </div>

        {/* Comité Verificador */}
        <div className="mt-8 text-xs">
            <p className="font-bold uppercase text-center mb-8 text-slate-400 text-[10px] tracking-widest">Comité de Verificación del Acta</p>
            <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                    <div className="border-t border-slate-900 w-full mb-2"></div>
                    <p className="font-bold uppercase">Verificador 1</p>
                    <p className="text-[10px] text-slate-500">Nombre / C.C.</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-slate-900 w-full mb-2"></div>
                    <p className="font-bold uppercase">Verificador 2</p>
                    <p className="text-[10px] text-slate-500">Nombre / C.C.</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-slate-900 w-full mb-2"></div>
                    <p className="font-bold uppercase">Verificador 3</p>
                    <p className="text-[10px] text-slate-500">Nombre / C.C.</p>
                </div>
            </div>
        </div>
      </div>
      
      <div className="text-center mt-12 text-[10px] text-slate-400 uppercase">
         Generado automáticamente por GestorPH • {new Date().toLocaleString()}
      </div>
    </div>
  );
};
