import React from 'react';
import { ConstructionSystem, ExecutionStatus, QualityGateStatus } from '../types';

interface BadgeProps {
  type: 'SYSTEM' | 'STATUS' | 'GATE' | 'TRANSITION';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  if (type === 'SYSTEM') {
    switch (value) {
      case ConstructionSystem.LSF: colorClass = 'bg-green-100 text-green-800 border border-green-200'; break;
      case ConstructionSystem.ALVENARIA: colorClass = 'bg-orange-100 text-orange-800 border border-orange-200'; break;
      case ConstructionSystem.HIBRIDO: colorClass = 'bg-purple-100 text-purple-800 border border-purple-200'; break;
      case ConstructionSystem.INSTALACAO: colorClass = 'bg-blue-100 text-blue-800 border border-blue-200'; break;
    }
  } else if (type === 'STATUS') {
    switch (value) {
      case ExecutionStatus.AGUARDANDO_START: colorClass = 'bg-slate-100 text-slate-600'; break;
      case ExecutionStatus.INICIADO: colorClass = 'bg-blue-50 text-blue-600'; break;
      case ExecutionStatus.EM_ANDAMENTO: colorClass = 'bg-blue-500 text-white'; break;
      case ExecutionStatus.PARALISADO: colorClass = 'bg-red-500 text-white animate-pulse'; break;
      case ExecutionStatus.EXECUTADO: colorClass = 'bg-lsf-light text-slate-900 font-bold'; break;
    }
  } else if (type === 'GATE') {
    switch (value) {
      case QualityGateStatus.APROVADO: colorClass = 'bg-green-600 text-white'; break;
      case QualityGateStatus.RESSALVAS: colorClass = 'bg-yellow-500 text-white'; break;
      case QualityGateStatus.REPROVADO: colorClass = 'bg-red-600 text-white'; break;
      case QualityGateStatus.PENDENTE: colorClass = 'bg-gray-200 text-gray-500'; break;
    }
  } else if (type === 'TRANSITION') {
    colorClass = 'bg-indigo-600 text-white text-[10px] uppercase tracking-wider';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${colorClass} ${className}`}>
      {value}
    </span>
  );
};