
import React from 'react';
import { useAssembly } from '../../store/AssemblyContext.tsx';

const CHART_COLORS = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const SIN_VOTAR_COLOR = '#94a3b8';

export const MinutesPreview: React.FC = () => {
  const {
    asambleas, copropiedades, selectedAsambleaId, selectedCopropiedadId,
    preguntas, votos, asambleistas, unidades, calculateResults,
    getVoterCoefficient, getTotalBuildingCoefficient
  } = useAssembly();

  const activeAsamblea = asambleas.find(as => as.id === selectedAsambleaId);
  const activeCopropiedad = copropiedades.find(cp => cp.id === selectedCopropiedadId);
  const asambleaPreguntas = preguntas
    .filter(p => p.asambleaId === selectedAsambleaId)
    .sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));

  const currentAsmUsers = asambleistas.filter(a => a.asambleaId === selectedAsambleaId);
  const attendingUsers = currentAsmUsers.filter(a => a.asistenciaConfirmada);
  const totalPresent = attendingUsers.length;
  const totalCoefAttendance = attendingUsers.reduce((acc, a) => acc + getVoterCoefficient(a), 0);

  // Mismas bases que ProjectionView para auditoría
  const totalBuildingCoef = getTotalBuildingCoefficient(selectedCopropiedadId || '') || 100;
  const totalUnitsInBuilding = unidades.filter(u => u.copropiedadId === selectedCopropiedadId).length || 1;

  if (!activeAsamblea || !activeCopropiedad) return null;

  return (
    <div style={{ backgroundColor: '#fff', padding: '40px', fontFamily: 'Georgia, serif', color: '#0f172a', lineHeight: 1.6, maxWidth: '21cm', margin: '0 auto' }}>

      {/* Encabezado del Acta */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '24px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Acta de Asamblea de Copropietarios</h1>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4f46e5', margin: '0' }}>{activeAsamblea.nombre}</h2>
        <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '12px', marginBottom: '0' }}>{activeCopropiedad.nombre}</p>
        <p style={{ fontSize: '10px', textTransform: 'uppercase', margin: '2px 0 0 0' }}>NIT: {activeCopropiedad.nit}</p>
        <p style={{ fontSize: '10px', margin: '4px 0 0 0' }}>{activeCopropiedad.direccion}</p>
      </div>

      {/* 1. Información General */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontSize: '13px' }}>1. Información de la Sesión</p>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>Fecha:</strong> {activeAsamblea.fecha}</td>
              <td style={{ padding: '2px 0' }}><strong>Tipo:</strong> {activeAsamblea.tipo}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 0' }}><strong>Hora de Inicio:</strong> {activeAsamblea.horaInicioReal ? new Date(activeAsamblea.horaInicioReal).toLocaleTimeString() : 'N/A'}</td>
              <td style={{ padding: '2px 0' }}><strong>Estado:</strong> {activeAsamblea.status}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. Verificación del Quórum */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontSize: '13px' }}>2. Verificación del Quórum</p>
        <p style={{ fontSize: '12px', textAlign: 'justify' }}>
          Se deja constancia de que, de acuerdo con el sistema de registro digital, se encuentran presentes en la sesión un total de <strong>{totalPresent}</strong> asambleístas,
          que representan un coeficiente de copropiedad del <strong>{totalCoefAttendance.toFixed(3)}%</strong>.
          Con base en lo anterior, se declara que {totalCoefAttendance > 50 ? 'EXISTE' : 'NO EXISTE'} quórum deliberatorio y decisorio según los términos de la Ley 675 de 2001.
        </p>
      </div>

      {/* 3. Desarrollo de Votaciones */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontSize: '13px' }}>3. Desarrollo del Orden del Día y Votaciones</p>
        <p style={{ fontSize: '12px', marginBottom: '16px' }}>A continuación se detallan las proposiciones sometidas a votación y sus respectivos resultados:</p>

        {asambleaPreguntas.map((p, idx) => {
          const coefResults = calculateResults(p.id, 'coeficiente');
          const totalVotos = votos.filter(v => v.preguntaId === p.id).length;

          // ── Cálculo de KPIs IDÉNTICO a ProjectionView ──
          const qVotos = votos.filter(v => v.preguntaId === p.id);
          const participatedIds = new Set(qVotos.map(v => v.asambleistaId));

          // Coeficiente: sumar coef. real de los votantes
          const participatedCoef = currentAsmUsers
            .filter(u => participatedIds.has(u.id))
            .reduce((acc, u) => acc + getVoterCoefficient(u), 0);
          const unvotedCoef = Math.max(0, totalBuildingCoef - participatedCoef);

          // Unidades: contar unidades representadas por quienes votaron
          const participatedUnitsCount = currentAsmUsers
            .filter(u => participatedIds.has(u.id))
            .reduce((acc, u) => acc + u.unidadesIds.length, 0);
          const unvotedUnitsCount = Math.max(0, totalUnitsInBuilding - participatedUnitsCount);

          return (
            <div key={p.id} style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: '12px', marginBottom: '28px', pageBreakInside: 'avoid' }}>
              <p style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px', fontSize: '13px' }}>Punto {idx + 1}: {p.texto}</p>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', fontStyle: 'italic' }}>Participación: {totalVotos} asambleístas</p>

              {/* KPI Cards — mismos valores que ProjectionView */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '25%', padding: '6px', textAlign: 'center', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                      <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Coef. Votado</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#4338ca', margin: 0 }}>{participatedCoef.toFixed(3)}%</p>
                    </td>
                    <td style={{ width: '25%', padding: '6px', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Coef. Sin Votar</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', margin: 0 }}>{unvotedCoef.toFixed(3)}%</p>
                    </td>
                    <td style={{ width: '25%', padding: '6px', textAlign: 'center', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                      <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#34d399', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Unid. Votaron</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857', margin: 0 }}>{participatedUnitsCount}</p>
                    </td>
                    <td style={{ width: '25%', padding: '6px', textAlign: 'center', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Unid. No Votaron</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#b45309', margin: 0 }}>{unvotedUnitsCount}</p>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tabla de Resultados por Coeficiente */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left', backgroundColor: '#f1f5f9' }}>Opción / Proposición</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', backgroundColor: '#f1f5f9' }}>Coeficiente (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {coefResults.map((res, ridx) => (
                    <tr key={ridx}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textTransform: 'uppercase' }}>{res.label}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{res.value.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Gráfico de Barras — tabla pura para Word */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <tbody>
                  {coefResults.map((res, i) => {
                    const barColor = res.label === 'SIN VOTAR' ? SIN_VOTAR_COLOR : CHART_COLORS[i % CHART_COLORS.length];
                    const pct = Math.max(Math.round(res.value), 1);
                    return (
                      <tr key={i}>
                        <td style={{ width: '100px', padding: '4px 8px 4px 0', textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', fontSize: '9px', verticalAlign: 'middle' }}>
                          {res.label}
                        </td>
                        <td style={{ padding: '3px 0', verticalAlign: 'middle' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <tbody>
                              <tr>
                                <td style={{ width: `${pct}%`, backgroundColor: barColor, height: '18px', fontSize: '1px' }}>&nbsp;</td>
                                <td style={{ width: `${100 - pct}%`, backgroundColor: '#f1f5f9', height: '18px', fontSize: '1px' }}>&nbsp;</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td style={{ width: '55px', padding: '4px 0 4px 8px', fontWeight: 'bold', color: '#1e293b', fontSize: '10px', verticalAlign: 'middle' }}>
                          {res.value.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* 4. Listado de Unidades Asistentes */}
      <div style={{ marginBottom: '24px', pageBreakBefore: 'always' }}>
        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px', fontSize: '13px' }}>4. Listado de Unidades Asistentes</p>
        <p style={{ fontSize: '11px', marginBottom: '12px' }}>Las siguientes unidades confirmaron su asistencia y conformaron el quórum de la asamblea:</p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left', backgroundColor: '#f1f5f9', width: '80px' }}>Unidad</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left', backgroundColor: '#f1f5f9' }}>Asambleísta / Representante</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', backgroundColor: '#f1f5f9', width: '60px' }}>Tipo</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', backgroundColor: '#f1f5f9', width: '80px' }}>Coef.</th>
            </tr>
          </thead>
          <tbody>
            {attendingUsers.map((user) => {
              const userUnits = unidades.filter(u => user.unidadesIds.includes(u.id));
              return userUnits.map((u) => (
                <tr key={u.id}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 'bold' }}>{u.nombre}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>{user.nombre}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', textTransform: 'uppercase', fontSize: '8px' }}>{user.esApoderado ? 'Poder' : 'Prop.'}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', fontFamily: 'Courier New, monospace' }}>{(u.coeficiente || 0).toFixed(3)}%</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Firmas */}
      <div style={{ marginTop: '60px', pageBreakInside: 'avoid' }}>
        <table style={{ width: '100%', fontSize: '11px', marginBottom: '32px' }}>
          <tbody>
            <tr>
              <td style={{ width: '45%', paddingTop: '40px', borderTop: '1px solid #0f172a' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Presidente de Asamblea</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>C.C.</p>
              </td>
              <td style={{ width: '10%' }}></td>
              <td style={{ width: '45%', paddingTop: '40px', borderTop: '1px solid #0f172a' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Secretario de Asamblea</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>C.C.</p>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', fontSize: '11px', marginBottom: '32px' }}>
          <tbody>
            <tr>
              <td style={{ width: '27.5%' }}></td>
              <td style={{ width: '45%', paddingTop: '40px', borderTop: '1px solid #0f172a', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Administrador</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>C.C.</p>
              </td>
              <td style={{ width: '27.5%' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Comité Verificador */}
        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', color: '#94a3b8', fontSize: '9px', letterSpacing: '2px', marginBottom: '24px' }}>Comité de Verificación del Acta</p>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', paddingTop: '40px', borderTop: '1px solid #0f172a', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Verificador 1</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>Nombre / C.C.</p>
              </td>
              <td style={{ width: '5%' }}></td>
              <td style={{ width: '30%', paddingTop: '40px', borderTop: '1px solid #0f172a', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Verificador 2</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>Nombre / C.C.</p>
              </td>
              <td style={{ width: '5%' }}></td>
              <td style={{ width: '30%', paddingTop: '40px', borderTop: '1px solid #0f172a', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Verificador 3</p>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0' }}>Nombre / C.C.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>
        Generado automáticamente por GestorPH • {new Date().toLocaleString()}
      </p>
    </div>
  );
};
