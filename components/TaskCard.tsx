import React from 'react';
import { Task, ExecutionStatus, QualityGateStatus } from '../types';
import { Badge } from './Badge';
import { AlertTriangle, Camera, CheckCircle2, Clock, CalendarClock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const isGatePending = task.status === ExecutionStatus.EXECUTADO && task.gate.status === QualityGateStatus.PENDENTE;
  const isBlocked = task.status === ExecutionStatus.PARALISADO;
  
  // Check for Overdue
  const getIsOverdue = () => {
    if (task.status === ExecutionStatus.EXECUTADO) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = task.dateEndExpected.split('-').map(Number);
    const end = new Date(year, month - 1, day);
    return end < today;
  };
  const isOverdue = getIsOverdue();

  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white p-4 rounded-lg shadow-sm border-l-4 cursor-pointer 
        mb-3 transform transition-all duration-200 ease-in-out
        hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]
        ${isBlocked ? 'border-l-red-500 ring-2 ring-red-100' : 
          isOverdue ? 'border-l-amber-500 ring-2 ring-amber-50' :
          isGatePending ? 'border-l-lsf-light ring-2 ring-green-100' : 
          'border-l-slate-300'}
      `}
    >
      {/* Transition Tag Banner */}
      {task.isTransitionPoint && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
           <Badge type="TRANSITION" value={task.transitionTag || '#Transição'} />
        </div>
      )}

      <div className="mb-2 mt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.stage}</span>
        <h3 className="text-sm font-bold text-slate-800 leading-tight mt-1 pr-16">{task.title}</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge type="SYSTEM" value={task.system} />
        <Badge type="STATUS" value={task.status} />
      </div>

      {/* Info Row */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-amber-600 font-bold' : ''}`}>
          {isOverdue ? <CalendarClock size={12} /> : <Clock size={12} />}
          <span>{new Date(task.dateEndExpected).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
          {isOverdue && <span className="text-[10px] uppercase ml-1">(Atrasado)</span>}
        </div>
        <div className="flex items-center gap-3">
          {task.photos.length > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Camera size={12} />
              <span>{task.photos.length}</span>
            </div>
          )}
          <span className="font-medium truncate max-w-[80px] text-right">{task.executor}</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {isBlocked && (
        <div className="mt-3 bg-red-50 p-2 rounded text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span className="font-medium line-clamp-2">{task.stopReason}</span>
        </div>
      )}

      {isGatePending && (
        <div className="mt-3 bg-green-50 p-2 rounded text-xs text-green-800 flex items-center gap-2 border border-green-200">
          <CheckCircle2 size={14} />
          <span className="font-bold">Aguardando GATE do GP</span>
        </div>
      )}
      
       {task.gate.status === QualityGateStatus.APROVADO && (
         <div className="mt-2 flex items-center justify-end gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 size={12} />
            <span>Aprovado</span>
         </div>
       )}
    </div>
  );
};