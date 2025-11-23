import React, { useState, useEffect } from 'react';
import { Task, User, UserRole, ExecutionStatus, QualityGateStatus, TaskPhoto } from '../types';
import { Badge } from './Badge';
import { X, Camera, AlertTriangle, CheckCircle, Calendar, User as UserIcon, ShieldCheck } from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateTask: (updatedTask: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, user, onUpdateTask }) => {
  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState(''); // Simulation input

  useEffect(() => {
    if (task) {
      setLocalTask({ ...task });
      setBlockReason(task.stopReason || '');
    }
  }, [task]);

  if (!isOpen || !localTask) return null;

  const canEditStatus = user.role === UserRole.EXECUTOR || user.role === UserRole.GP;
  const canGate = user.role === UserRole.GP;

  const handleStatusChange = (status: ExecutionStatus) => {
    // Rule: Paralisado requires reason
    if (status === ExecutionStatus.PARALISADO && !blockReason) {
      alert("Por favor, preencha o motivo da paralisação abaixo antes de mudar o status.");
      return;
    }
    
    // Rule: LSF/Installation executed requires photos
    const needsPhotos = (localTask.system === 'LSF' || localTask.system === 'Instalação') && status === ExecutionStatus.EXECUTADO;
    if (needsPhotos && localTask.photos.length === 0) {
       alert("Obrigatório anexar fotos da infraestrutura antes de marcar como Executado.");
       return;
    }

    const updated = { ...localTask, status };
    if (status === ExecutionStatus.PARALISADO) {
      updated.stopReason = blockReason;
    } else {
      updated.stopReason = undefined;
    }
    
    // Reset Gate if moved back from Executed
    if (status !== ExecutionStatus.EXECUTADO) {
        updated.gate = { status: QualityGateStatus.PENDENTE, notes: '' };
    }

    setLocalTask(updated);
    onUpdateTask(updated);
  };

  const handleGateDecision = (decision: QualityGateStatus) => {
    const updated = {
      ...localTask,
      gate: {
        ...localTask.gate,
        status: decision,
        checkedBy: user.name,
        date: new Date().toISOString()
      }
    };
    setLocalTask(updated);
    onUpdateTask(updated);
  };

  const handleAddPhoto = () => {
    // Simulation of file upload
    const mockUrl = `https://picsum.photos/seed/${Date.now()}/400/300`;
    const newPhoto: TaskPhoto = {
      id: Date.now().toString(),
      url: mockUrl,
      timestamp: Date.now(),
      description: 'Nova foto de acompanhamento'
    };
    const updated = { ...localTask, photos: [newPhoto, ...localTask.photos] };
    setLocalTask(updated);
    onUpdateTask(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">{localTask.stage}</span>
              {localTask.isTransitionPoint && <Badge type="TRANSITION" value={localTask.transitionTag || '#Transição'} />}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{localTask.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Sistema</p>
              <Badge type="SYSTEM" value={localTask.system} />
            </div>
            <div>
              <p className="text-slate-500 mb-1">Executor</p>
              <div className="flex items-center gap-2 font-medium">
                 <UserIcon size={16} /> {localTask.executor}
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Datas Previstas</p>
              <div className="flex items-center gap-2 font-medium">
                <Calendar size={16} /> 
                {new Date(localTask.dateStartExpected).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} - 
                {new Date(localTask.dateEndExpected).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
              </div>
            </div>
             <div>
              <p className="text-slate-500 mb-1">Especialista</p>
              <span className="font-medium">{localTask.specialist}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-700">{localTask.description}</p>
          </div>

          {/* Execution Status Section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Status de Execução</h3>
            
            {canEditStatus ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(ExecutionStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`
                      text-xs p-2 rounded-md border font-medium transition-colors text-left flex items-center gap-2
                      ${localTask.status === status 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                    `}
                  >
                     <div className={`w-2 h-2 rounded-full ${localTask.status === status ? 'bg-lsf-light' : 'bg-slate-300'}`}></div>
                     {status}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <Badge type="STATUS" value={localTask.status} />
                 {localTask.status === ExecutionStatus.PARALISADO && (
                   <span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">
                     {localTask.stopReason}
                   </span>
                 )}
              </div>
            )}

            {/* Paralisado Input */}
            {canEditStatus && (
              <div className={`mt-4 transition-all ${localTask.status === ExecutionStatus.PARALISADO || blockReason ? 'block' : 'hidden'}`}>
                <label className="block text-xs font-bold text-red-700 mb-1">Motivo da Paralisação (Obrigatório)</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Descreva o que está impedindo o avanço (ex: Falta material X)"
                  className="w-full p-3 border border-red-300 rounded-lg bg-red-50 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Photos Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registro Fotográfico</h3>
               {canEditStatus && (
                 <button 
                   onClick={handleAddPhoto}
                   className="flex items-center gap-2 text-xs bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                 >
                   <Camera size={14} />
                   Adicionar Foto
                 </button>
               )}
            </div>

            {localTask.photos.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 border border-dashed rounded-lg text-slate-400 text-sm">
                Nenhuma foto registrada.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {localTask.photos.map(photo => (
                  <div key={photo.id} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img src={photo.url} alt="Obra" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-[10px] text-white truncate">
                      {new Date(photo.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gate Section (Only visible if Executed) */}
          {localTask.status === ExecutionStatus.EXECUTADO && (
            <div className="border-t pt-6 bg-green-50 -mx-6 px-6 pb-6">
              <div className="flex items-center gap-2 mb-4 pt-4 text-green-800">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">GATE: Liberação de Qualidade</h3>
              </div>
              
              {canGate ? (
                 <div className="space-y-3">
                    <div className="flex gap-2">
                       <button onClick={() => handleGateDecision(QualityGateStatus.APROVADO)} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700">Aprovar</button>
                       <button onClick={() => handleGateDecision(QualityGateStatus.RESSALVAS)} className="flex-1 bg-yellow-500 text-white py-2 rounded text-sm font-medium hover:bg-yellow-600">C/ Ressalvas</button>
                       <button onClick={() => handleGateDecision(QualityGateStatus.REPROVADO)} className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-medium hover:bg-red-700">Reprovar</button>
                    </div>
                    <textarea 
                      placeholder="Observações técnicas para o GATE..."
                      className="w-full p-2 text-sm border rounded bg-white"
                      rows={2}
                      defaultValue={localTask.gate.notes}
                      onBlur={(e) => {
                        const updated = { ...localTask, gate: { ...localTask.gate, notes: e.target.value } };
                        setLocalTask(updated);
                        onUpdateTask(updated);
                      }}
                    />
                 </div>
              ) : (
                 <div className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                    <span className="text-sm font-medium text-slate-700">Status: <Badge type="GATE" value={localTask.gate.status} /></span>
                    {localTask.gate.checkedBy && (
                      <span className="text-xs text-slate-500">Por: {localTask.gate.checkedBy}</span>
                    )}
                 </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};