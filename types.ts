
export type QuestionStatus = 'PENDIENTE' | 'ABIERTA' | 'CERRADA';
export type AssemblyStatus = 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA';
export type LoyaltyStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface ResultEntry {
  label: string;
  value: number;
  absoluteValue: number;
  [key: string]: any;
}

export interface PlantillaPregunta {
  id: string;
  titulo: string;
  texto: string;
  opcionesSugeridas: string;
  color: string;
  tiempoSugerido: number;
}

export interface LoyaltyRules {
  pointsRegister: number;
  pointsCreateBuilding: number;
  pointsCreateAssembly: number;
  pointsUploadLegal: number;
  pointsServiceBasic: number;
  pointsServicePremium: number;
  pointsServiceAI: number;
}

export interface LoyaltyTransaction {
  id: string;
  adminId: string;
  amount: number;
  reason: string;
  description?: string;
  timestamp: string;
  status: LoyaltyStatus;
  rejectionReason?: string; // Nuevo campo para detallar el porqué del rechazo
}

export interface PHAdmin {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  cedula?: string;
  direccion?: string;
  password?: string;
  loyaltyPoints?: number;
}

export interface SuperAdmin {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface Copropiedad {
  id: string;
  nombre: string;
  nit: string;
  direccion: string;
  ciudad?: string;
  email?: string;
  adminIds: string[];
  adminId?: string;
  fechaRegistro: string;
  pagoConfirmado: boolean;
  comprobanteEnviado: boolean;
  status: AssemblyStatus;
  representacionLegal?: string;
  cantidadUnidades?: number;
}

export interface Asamblea {
  id: string;
  copropiedadId: string;
  nombre: string;
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA';
  fecha: string;
  status: AssemblyStatus;
  pagoConfirmado: boolean;
  comprobanteEnviado: boolean;
  comprobanteData?: string;
  serviceType?: 'BASICO' | 'PREMIUM';
  horaInicioReal?: string;
  horaFinReal?: string;
  actaInteligenteEnabled?: boolean;
  resumenIA?: string;
  aiGenerationCount?: number;
  audioUrl?: string;
  actaPdfUrl?: string;
  bulkEmailCount?: number; // Nuevo: Contador de envíos masivos
}

export interface Unidad {
  id: string;
  nombre: string;
  coefficient: number;
  coeficiente: number;
  propietario: string;
  email?: string;
  token?: string;
  copropiedadId: string;
  emailSentCount?: number; // Nuevo: Contador de envíos individuales
}

export interface Asambleista {
  id: string;
  nombre: string;
  documento?: string;
  email: string;
  token: string;
  esApoderado: boolean;
  unidadesIds: string[];
  asistenciaConfirmada: boolean;
  copropiedadId: string;
  asambleaId: string;
}

export interface Opcion {
  id: string;
  texto: string;
}

export interface Pregunta {
  id: string;
  texto: string;
  status: QuestionStatus;
  opciones: Opcion[];
  tiempoRestante: number;
  startedAt?: string;
  totalVotos: number;
  asambleaId: string;
  copropiedadId: string;
  esVerificacionQuorum?: boolean;
  esMultiple?: boolean;
  createdAt?: string; // Nuevo campo para ordenamiento
  orden?: number;     // Índice de posición para el orden del día (drag & drop)
}

export interface Voto {
  id: string;
  preguntaId: string;
  asambleistaId: string;
  opcionId?: string;
  respuestas?: string[];
  coeficiente: number;
  timestamp: string;
  asambleaId: string;
}
