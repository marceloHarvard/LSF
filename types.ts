export enum UserRole {
  CLIENT = 'CLIENT', // Contratante
  EXECUTOR = 'EXECUTOR', // Executor de Campo
  GP = 'GP' // Gerente de Projetos / Agente Especialista
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export enum ConstructionSystem {
  ALVENARIA = 'Alvenaria',
  LSF = 'LSF',
  HIBRIDO = 'Híbrido',
  INSTALACAO = 'Instalação'
}

export enum ProjectStage {
  PRELIMINAR = '1. Preliminar',
  ESTRUTURAL = '2. Estrutural',
  VEDACAO_INFRA = '3. Vedação/Infra',
  COBERTURA_ACABAMENTO = '4. Cobertura/Acabamento'
}

export enum ExecutionStatus {
  AGUARDANDO_START = 'Aguardando Start',
  INICIADO = 'Iniciado',
  EM_ANDAMENTO = 'Em Andamento',
  PARALISADO = 'Paralisado',
  EXECUTADO = 'Executado' // Ready for Gate
}

export enum QualityGateStatus {
  PENDENTE = 'Pendente',
  APROVADO = 'Aprovado',
  RESSALVAS = 'Aprovado com Ressalvas',
  REPROVADO = 'Reprovado'
}

export interface GateCheck {
  status: QualityGateStatus;
  date?: string;
  notes: string;
  checkedBy?: string;
}

export interface TaskPhoto {
  id: string;
  url: string;
  timestamp: number;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stage: ProjectStage;
  system: ConstructionSystem;
  specialist: string; // Who planned it
  executor: string; // Team responsible
  dateStartExpected: string;
  dateEndExpected: string;
  
  status: ExecutionStatus;
  stopReason?: string; // If Paralisado
  
  gate: GateCheck;
  
  isTransitionPoint: boolean; // #Transição
  transitionTag?: string; // e.g., #ConexãoHidráulica
  
  photos: TaskPhoto[];
}