import { ConstructionSystem, ExecutionStatus, ProjectStage, QualityGateStatus, Task, User, UserRole } from "./types";

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Eng. Carlos (GP)', role: UserRole.GP, avatar: 'https://picsum.photos/id/1005/50/50' },
  { id: 'u2', name: 'Mestre João (Executor)', role: UserRole.EXECUTOR, avatar: 'https://picsum.photos/id/1027/50/50' },
  { id: 'u3', name: 'Cliente Ana', role: UserRole.CLIENT, avatar: 'https://picsum.photos/id/1011/50/50' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Avaliação Estrutural Térreo',
    description: 'Verificar capacidade de carga das vigas de alvenaria para receber o LSF.',
    stage: ProjectStage.PRELIMINAR,
    system: ConstructionSystem.ALVENARIA,
    specialist: 'Eng. Estrutural',
    executor: 'Equipe Civil',
    dateStartExpected: '2023-10-01',
    dateEndExpected: '2023-10-03',
    status: ExecutionStatus.EXECUTADO,
    gate: { status: QualityGateStatus.APROVADO, notes: 'Liberado para carga.', checkedBy: 'u1', date: '2023-10-04' },
    isTransitionPoint: true,
    transitionTag: '#VigaTransição',
    photos: [],
    subtasks: [
      { id: 'st1', title: 'Verificar trincas na viga V1', completed: true },
      { id: 'st2', title: 'Medir nivelamento', completed: true }
    ]
  },
  {
    id: 't2',
    title: 'Montagem Sole Plate (Guia Inferior)',
    description: 'Fixação das guias inferiores com chumbadores químicos sobre a cinta de concreto.',
    stage: ProjectStage.ESTRUTURAL,
    system: ConstructionSystem.HIBRIDO,
    specialist: 'Proj. LSF',
    executor: 'Montadores LSF',
    dateStartExpected: '2023-10-05',
    dateEndExpected: '2023-10-07',
    status: ExecutionStatus.EXECUTADO,
    gate: { status: QualityGateStatus.PENDENTE, notes: '' },
    isTransitionPoint: true,
    transitionTag: '#Ancoragem',
    photos: [
      { id: 'p1', url: 'https://picsum.photos/id/201/400/300', timestamp: 1696500000, description: 'Detalhe chumbador' }
    ],
    subtasks: []
  },
  {
    id: 't3',
    title: 'Painéis de Parede 2º Pav.',
    description: 'Montagem dos painéis estruturais conforme caderno de montagem.',
    stage: ProjectStage.ESTRUTURAL,
    system: ConstructionSystem.LSF,
    specialist: 'Proj. LSF',
    executor: 'Montadores LSF',
    dateStartExpected: '2023-10-08',
    dateEndExpected: '2023-10-15',
    status: ExecutionStatus.EM_ANDAMENTO,
    gate: { status: QualityGateStatus.PENDENTE, notes: '' },
    isTransitionPoint: false,
    photos: [],
    subtasks: []
  },
  {
    id: 't4',
    title: 'Passagem Elétrica Paredes',
    description: 'Infraestrutura elétrica interna antes do fechamento.',
    stage: ProjectStage.VEDACAO_INFRA,
    system: ConstructionSystem.INSTALACAO,
    specialist: 'Eng. Elétrica',
    executor: 'Eletricista',
    dateStartExpected: '2023-10-16',
    dateEndExpected: '2023-10-18',
    status: ExecutionStatus.PARALISADO,
    stopReason: 'Falta de eletrodutos corrugados 3/4"',
    gate: { status: QualityGateStatus.PENDENTE, notes: '' },
    isTransitionPoint: false,
    photos: [],
    subtasks: []
  },
  {
    id: 't5',
    title: 'Conexão Hidráulica Prumada',
    description: 'Interligação da prumada existente (Alv) com nova rede (PEX).',
    stage: ProjectStage.VEDACAO_INFRA,
    system: ConstructionSystem.HIBRIDO,
    specialist: 'Eng. Hidráulica',
    executor: 'Encanador',
    dateStartExpected: '2023-10-18',
    dateEndExpected: '2023-10-19',
    status: ExecutionStatus.AGUARDANDO_START,
    gate: { status: QualityGateStatus.PENDENTE, notes: '' },
    isTransitionPoint: true,
    transitionTag: '#ConexãoHidráulica',
    photos: [],
    subtasks: []
  }
];