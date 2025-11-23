
import React, { useState, useRef, useEffect } from 'react';
import { Task, ExecutionStatus, QualityGateStatus } from '../types';
import { Badge } from './Badge';
import { AlertTriangle, Camera, CheckCircle2, Clock, CalendarClock, Share2, AlertCircle, Ban, CheckCheck, Save, Sparkles } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onStatusChange?: (taskId: string, newStatus: ExecutionStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange }) => {
  const isGatePending = task.status === ExecutionStatus.EXECUTADO && task.gate.status === QualityGateStatus.PENDENTE;
  const isBlocked = task.status === ExecutionStatus.PARALISADO;
  
  // Swipe State
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 100; // Pixels to trigger action

  // Celebration Animation State
  const [justCompleted, setJustCompleted] = useState(false);
  const prevStatus = useRef(task.status);

  useEffect(() => {
    // Dispara apenas na transição de NÃO EXECUTADO para EXECUTADO
    if (prevStatus.current !== ExecutionStatus.EXECUTADO && task.status === ExecutionStatus.EXECUTADO) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000); // Duração aumentada para 2s
      return () => clearTimeout(timer);
    }
    prevStatus.current = task.status;
  }, [task.status]);

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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const taskData = `RESUMO DA TAREFA\n` +
      `--------------------------------\n` +
      `Título: ${task.title}\n` +
      `ID: ${task.id}\n` +
      `Status: ${task.status}\n` +
      `Sistema: ${task.system}\n` +
      `Executor: ${task.executor}\n` +
      `Prazo: ${new Date(task.dateEndExpected).toLocaleDateString('pt-BR')}\n` +
      `--------------------------------\n` +
      `DESCRIÇÃO:\n${task.description}\n` +
      `--------------------------------\n` +
      `CHECKLIST:\n${task.subtasks.length > 0 ? task.subtasks.map(s => `- [${s.completed ? 'X' : ' '}] ${s.title}`).join('\n') : 'Nenhuma subtarefa.'}\n`;

    const blob = new Blob([taskData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tarefa-${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/task/${task.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Link copiado para a área de transferência:\n${shareUrl}`);
      }).catch(() => {
        alert(`ID da Tarefa: ${task.id}`);
      });
    } else {
      alert(`Compartilhar Tarefa\nID: ${task.id}\nLink: ${shareUrl}`);
    }
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onStatusChange) return;
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || !onStatusChange) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // Limit visually to prevent excessive scrolling
    if (diff > 150) setOffset(150);
    else if (diff < -150) setOffset(-150);
    else setOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!onStatusChange) return;
    setIsSwiping(false);
    
    if (offset > THRESHOLD) {
      // Right Swipe -> Blocked (Paralisar)
      // Visual feedback implies content moving RIGHT, revealing LEFT background
      if (task.status !== ExecutionStatus.PARALISADO) {
         onStatusChange(task.id, ExecutionStatus.PARALISADO);
      }
    } else if (offset < -THRESHOLD) {
      // Left Swipe -> Executed (Concluir)
      // Visual feedback implies content moving LEFT, revealing RIGHT background
      if (task.status !== ExecutionStatus.EXECUTADO) {
        onStatusChange(task.id, ExecutionStatus.EXECUTADO);
      }
    }
    setOffset(0);
  };

  // Background color based on swipe direction
  const getSwipeBackground = () => {
    if (offset > 0) return 'bg-red-500'; // Right swipe (Paralisar)
    if (offset < 0) return 'bg-emerald-500'; // Left swipe (Executar)
    return 'bg-white';
  };

  return (
    <div className="relative mb-3 overflow-hidden rounded-lg select-none">
      
      {/* Swipe Background Actions Layer */}
      <div className={`absolute inset-0 flex items-center justify-between px-6 text-white font-bold transition-colors ${getSwipeBackground()}`}>
         <div className={`flex items-center gap-2 ${offset > 20 ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
            <Ban size={24} />
            <span>PARALISAR</span>
         </div>
         <div className={`flex items-center gap-2 ${offset < -20 ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
            <span>CONCLUIR</span>
            <CheckCheck size={24} />
         </div>
      </div>

      {/* Main Card Content */}
      <div 
        ref={cardRef}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offset}px) ${justCompleted ? 'scale(1.04)' : 'scale(1)'}` }}
        className={`
          relative bg-white p-4 rounded-lg shadow-sm border-l-4 cursor-pointer 
          transform transition-all duration-300 ease-out
          ${!isSwiping ? 'transition-all' : ''}
          ${justCompleted ? 'ring-4 ring-green-200 border-l-green-500 bg-green-50 shadow-md z-10' : 
            isBlocked ? 'border-l-red-500 ring-2 ring-red-100' : 
            isOverdue ? 'border-l-orange-500 ring-2 ring-orange-50 bg-orange-50/20' :
            isGatePending ? 'border-l-lsf-light ring-2 ring-green-100' : 
            'border-l-slate-300'}
        `}
      >
        {/* Celebration Icon */}
        {justCompleted && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg animate-bounce z-20">
             <Sparkles size={16} fill="white" />
          </div>
        )}

        {/* Transition Tag Banner */}
        {task.isTransitionPoint && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
             <Badge type="TRANSITION" value={task.transitionTag || '#Transição'} />
          </div>
        )}

        <div className="mb-2 mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.stage}</span>
          <div className="flex items-start justify-between gap-2 mt-1">
             <h3 className="text-sm font-bold text-slate-800 leading-tight pr-4">{task.title}</h3>
             {isOverdue && !isBlocked && !justCompleted && (
               <AlertCircle size={16} className="text-orange-500 flex-shrink-0 animate-pulse" />
             )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge type="SYSTEM" value={task.system} />
          <Badge type="STATUS" value={task.status} />
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className={`flex items-center gap-1 ${isOverdue && !justCompleted ? 'text-orange-600 font-bold' : ''}`}>
            {isOverdue && !justCompleted ? <CalendarClock size={12} /> : <Clock size={12} />}
            <span>{new Date(task.dateEndExpected).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
            {isOverdue && !justCompleted && <span className="text-[10px] uppercase ml-1 font-extrabold">! Atrasado</span>}
          </div>
          <div className="flex items-center gap-2">
            {task.photos.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600 mr-1">
                <Camera size={12} />
                <span>{task.photos.length}</span>
              </div>
            )}
            <span className="font-medium truncate max-w-[80px] text-right">{task.executor}</span>
            
            <button 
              onClick={handleSave}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-lsf-accent transition-colors ml-1"
              title="Salvar/Baixar Tarefa"
            >
              <Save size={14} />
            </button>

            <button 
              onClick={handleShare}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-lsf-accent transition-colors ml-1"
              title="Compartilhar Tarefa"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Critical Alerts */}
        {isBlocked && !justCompleted && (
          <div className="mt-3 bg-red-50 p-2 rounded text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span className="font-medium line-clamp-2">{task.stopReason}</span>
          </div>
        )}

        {isGatePending && (
          <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 border ${justCompleted ? 'bg-green-100 border-green-300 text-green-900' : 'bg-green-50 border-green-200 text-green-800'}`}>
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
    </div>
  );
};
