import { Copropiedad, Unidad, Pregunta, Asambleista } from './types.ts';

/**
 * SISTEMA DE VERSIONAMIENTO GESTORPH
 * Secuencia: Major.Minor.Patch
 * Actualizar este valor cada vez que se realice un despliegue o ajuste.
 */
export const APP_VERSION = '2.0.0';

/**
 * DOMINIO OFICIAL DE PRODUCCIÓN
 * Se utiliza para generar los códigos QR impresos de manera profesional,
 * evitando que salgan con la URL temporal de Cloud Run.
 */
export const PRODUCTION_DOMAIN = 'https://votaciones.gestorph.com';

// Fix: Added missing 'status' property to MOCK_COPROPIEDAD
export const MOCK_COPROPIEDAD: Copropiedad = {
  id: 'cp1',
  nombre: 'Conjunto Residencial Los Álamos',
  nit: '900.123.456-7',
  direccion: 'Calle 100 # 15-20',
  adminId: 'adm-1',
  adminIds: ['adm-1'],
  fechaRegistro: '2024-01-01T00:00:00.000Z',
  pagoConfirmado: true,
  comprobanteEnviado: true,
  status: 'PROGRAMADA'
};

// Fix: Added missing 'status' property to MOCK_COPROPIEDAD_2
export const MOCK_COPROPIEDAD_2: Copropiedad = {
  id: 'cp2',
  nombre: 'Edificio Horizonte Azul',
  nit: '800.987.654-3',
  direccion: 'Av. Siempre Viva 123',
  adminId: 'adm-1',
  adminIds: ['adm-1'],
  fechaRegistro: '2024-02-15T00:00:00.000Z',
  pagoConfirmado: false,
  comprobanteEnviado: false,
  status: 'PROGRAMADA'
};

export interface TemplatePregunta {
  titulo: string;
  texto: string;
  opcionesSugeridas: string;
  color: string;
  tiempoSugerido: number;
}

export const PREDEFINED_QUESTIONS: TemplatePregunta[] = [
  {
    titulo: 'Orden del Día',
    texto: '¿Aprueba la Asamblea el orden del día propuesto en la convocatoria?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-blue-500',
    tiempoSugerido: 60
  },
  {
    titulo: 'Acta Anterior',
    texto: '¿Aprueba la Asamblea el acta de la asamblea anterior, en los términos presentados (con o sin ajustes)?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-indigo-500',
    tiempoSugerido: 120
  },
  {
    titulo: 'Finanzas y Gestión',
    texto: '¿Aprueba la Asamblea los estados financieros del periodo [año/fecha de corte] y el informe de gestión presentado por la Administración?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-emerald-500',
    tiempoSugerido: 180
  },
  {
    titulo: 'Presupuesto Anual',
    texto: '¿Aprueba la Asamblea el presupuesto de ingresos y gastos para la vigencia [año] y, en consecuencia, la cuota de administración ordinaria resultante?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-cyan-500',
    tiempoSugerido: 180
  },
  {
    titulo: 'Cuota Extraordinaria',
    texto: '¿Aprueba la Asamblea la fijación de una cuota extraordinaria para [obra/actividad], por valor de $____, pagadera en ____ cuotas / con fecha límite ____, según la propuesta presentada?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-amber-500',
    tiempoSugerido: 300
  },
  {
    titulo: 'Obras y Proyectos',
    texto: '¿Aprueba la Asamblea la ejecución de la obra/proyecto [nombre], por valor de $____, y autoriza a la Administración a contratar su ejecución bajo las condiciones presentadas (alcance, plazo y proveedor)?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-orange-500',
    tiempoSugerido: 300
  },
  {
    titulo: 'Reforma Reglamento',
    texto: '¿Aprueba la Asamblea modificar el Reglamento de Propiedad Horizontal en el/los artículo(s) ____ para [motivo], y autoriza al representante legal para adelantar los trámites de protocolización y registro?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-purple-500',
    tiempoSugerido: 600
  },
  {
    titulo: 'Uso de Zonas Comunes',
    texto: '¿Aprueba la Asamblea el cambio de destinación/uso de [zona común/área], pasando de ____ a ____, y autoriza la implementación conforme a la propuesta técnica y jurídica presentada?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-pink-500',
    tiempoSugerido: 300
  },
  {
    titulo: 'Proveedores',
    texto: '¿Aprueba la Asamblea la contratación/renovación del servicio de [vigilancia/aseo/mantenimiento/administración], con el proveedor [nombre], por un valor de $____ y por un término de ____ meses?',
    opcionesSugeridas: 'SÍ, NO, ABSTENCIÓN',
    color: 'bg-slate-600',
    tiempoSugerido: 180
  },
  {
    titulo: 'Elección de Consejo',
    texto: '¿Elige la Asamblea a los miembros del Consejo de Administración (principales y suplentes) para el periodo [fecha inicio–fecha fin], según la postulación presentada?',
    opcionesSugeridas: '',
    color: 'bg-rose-600',
    tiempoSugerido: 600
  }
];

// Added missing 'coefficient' property to all Unidad entries to fix TypeScript validation errors
export const MOCK_UNIDADES: Unidad[] = [
  { id: 'u1', nombre: 'Apto 101', coefficient: 0.520, coeficiente: 0.520, propietario: 'Juan Perez', copropiedadId: 'cp1' },
  { id: 'u2', nombre: 'Apto 102', coefficient: 0.520, coeficiente: 0.520, propietario: 'Maria Garcia', copropiedadId: 'cp1' },
  { id: 'u3', nombre: 'Apto 103', coefficient: 0.520, coeficiente: 0.520, propietario: 'Carlos Ruiz', copropiedadId: 'cp1' },
  { id: 'u4', nombre: 'Apto 201', coefficient: 0.550, coeficiente: 0.550, propietario: 'Ana Lopez', copropiedadId: 'cp1' },
  { id: 'u6', nombre: 'Depósito 10', coefficient: 0.050, coeficiente: 0.050, propietario: 'Juan Perez', copropiedadId: 'cp1' },
  { id: 'u_cp2_1', nombre: 'Oficina 101', coefficient: 10.0, coeficiente: 10.0, propietario: 'Inversiones Blue', copropiedadId: 'cp2' },
  { id: 'u_cp2_2', nombre: 'Oficina 102', coefficient: 15.0, coeficiente: 15.0, propietario: 'Tech Solutions', copropiedadId: 'cp2' },
];

export const MOCK_PREGUNTAS: Pregunta[] = [
  {
    id: 'p1',
    texto: 'REGISTRO DE QUÓRUM: Por favor confirme su presencia en la asamblea.',
    status: 'ABIERTA',
    opciones: [
      { id: 'o-default-1', texto: 'CONFIRMAR ASISTENCIA' }
    ],
    tiempoRestante: 300,
    totalVotos: 0,
    copropiedadId: 'cp1',
    // Added missing asambleaId
    asambleaId: 'as1'
  }
];

export const MOCK_ASAMBLEISTAS: Asambleista[] = [
  {
    id: 'asm1',
    nombre: 'Juan Perez',
    email: 'juan@example.com',
    token: 'TOKEN123',
    esApoderado: true,
    unidadesIds: ['u1', 'u6'],
    asistenciaConfirmada: true,
    copropiedadId: 'cp1',
    // Added missing asambleaId
    asambleaId: 'as1'
  },
  {
    id: 'asm2',
    nombre: 'Ana Lopez',
    email: 'ana@example.com',
    token: 'TOKEN456',
    esApoderado: false,
    unidadesIds: ['u4'],
    asistenciaConfirmada: false,
    copropiedadId: 'cp1',
    // Added missing asambleaId
    asambleaId: 'as1'
  }
];