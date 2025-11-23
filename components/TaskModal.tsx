
import React, { useState, useEffect, useRef } from 'react';
import { Task, User, UserRole, ExecutionStatus, QualityGateStatus, TaskPhoto, Subtask, ConstructionSystem, ProjectStage, TaskHistoryLog } from '../types';
import { Badge } from './Badge';
import { X, Camera, AlertTriangle, CheckCircle, Calendar, User as UserIcon, ShieldCheck, ImagePlus, Aperture, ListTodo, Plus, Trash2, Edit2, History, ArrowRight, Bell, Send } from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateTask: (updatedTask: Task) => void;
}

type TabType = 'DETAILS' | 'HISTORY';

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, user, onUpdateTask }) => {
  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockError, setShowBlockError] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [historyLogs, setHistoryLogs] = useState<TaskHistoryLog[]>([]);
  const [showNotify, setShowNotify] = useState(false);
  
  // Camera & Gallery States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setLocalTask({ ...task });
      setBlockReason(task.stopReason || '');
      setShowBlockError(false);
      setActiveTab('DETAILS');
      setShowNotify(false);
      
      // Load History
      const storageKey = `history_${task.id}`;
      const savedHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setHistoryLogs(savedHistory);
    }
    // Cleanup camera on modal close/task switch if active
    return () => {
      stopCamera();
    };
  }, [task, isOpen]);

  // Refresh history whenever task status changes externally or locally if strictly needed
  useEffect(() => {
    if (localTask && activeTab === 'HISTORY') {
      const storageKey = `history_${localTask.id}`;
      const savedHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setHistoryLogs(savedHistory);
    }
  }, [localTask?.status, activeTab]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer rear camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const newPhoto: TaskPhoto = {
        id: Date.now().toString(),
        url: base64Image,
        timestamp: Date.now(),
        description: 'Foto capturada em campo'
      };

      if (localTask) {
        const updated = { ...localTask, photos: [newPhoto, ...localTask.photos] };
        setLocalTask(updated);
        onUpdateTask(updated);
      }
      stopCamera();
    }
  };

  // Gallery Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const base64 = loadEvent.target?.result as string;
          if (base64) {
            const newPhoto: TaskPhoto = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              url: base64,
              timestamp: Date.now(),
              description: file.name // Use filename as default description
            };
            
            setLocalTask(prev => {
              if (!prev) return null;
              const updated = { ...prev, photos: [newPhoto, ...prev.photos] };
              onUpdateTask(updated); // Sync immediately
              return updated;
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim() || !localTask) return;
    
    const newSub: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskText,
      completed: false
    };

    const updated = {
      ...localTask,
      subtasks: [...(localTask.subtasks || []), newSub]
    };
    
    setLocalTask(updated);
    onUpdateTask(updated);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!localTask) return;
    
    const updatedSubtasks = (localTask.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const updated = { ...localTask, subtasks: updatedSubtasks };
    setLocalTask(updated);
    onUpdateTask(updated);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!localTask) return;
    
    // Confirmação antes de excluir
    if (window.confirm("Tem certeza que deseja remover esta subtarefa?")) {
      const updatedSubtasks = (localTask.subtasks || []).filter(st => st.id !== subtaskId);
      const updated = { ...localTask, subtasks: updatedSubtasks };
      
      setLocalTask(updated);
      onUpdateTask(updated);
    }
  };

  const updateField = (field: keyof Task, value: any) => {
     if (!localTask) return;
     const updated = { ...localTask, [field]: value };
     setLocalTask(updated);
     onUpdateTask(updated);
  };

  const triggerNotification = () => {
    setShowNotify(true);
    setTimeout(() => setShowNotify(false), 4000);
  };

  if (!isOpen || !localTask) return null;

  const canEditStatus = user.role === UserRole.EXECUTOR || user.role === UserRole.GP;
  const canGate = user.role === UserRole.GP;

  const handleStatusChange = (status: ExecutionStatus) => {
    // Validação específica para Paralisado
    if (status === ExecutionStatus.PARALISADO) {
       if (!blockReason.trim()) {
         // Atualiza apenas localmente para mostrar o campo e o erro, mas NÃO salva no pai
         setLocalTask({ ...localTask, status: ExecutionStatus.PARALISADO });
         setShowBlockError(true);
         return;
       }
       // Se já tem motivo e está mudando para paralisado
       triggerNotification();
    } else {
       setShowBlockError(false);
    }
    
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
    
    if (status !== ExecutionStatus.EXECUTADO) {
        updated.gate = { status: QualityGateStatus.PENDENTE, notes: '' };
    }

    setLocalTask(updated);
    onUpdateTask(updated);
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBlockReason(val);

    if (localTask?.status === ExecutionStatus.PARALISADO) {
      if (!val.trim()) {
        setShowBlockError(true);
        // Não salva no pai se estiver vazio e status for Paralisado
      } else {
        setShowBlockError(false);
        const updated = { ...localTask, stopReason: val };
        setLocalTask(updated);
        onUpdateTask(updated);
        // Opcional: Notificar assim que terminar de digitar poderia ser feito com debounce, 
        // mas aqui vamos manter simples e confiar na ação explícita ou retorno visual.
      }
    }
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

  const subtasks = localTask.subtasks || [];
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { onClose(); stopCamera(); }}></div>
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
        
        {/* Toast de Notificação */}
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showNotify ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
          <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-600">
             <div className="bg-red-500 p-1.5 rounded-full animate-pulse">
               <Bell size={16} fill="white" />
             </div>
             <div>
               <p className="text-sm font-bold">Notificação Enviada</p>
               <p className="text-xs text-slate-300">O GP foi alertado sobre a paralisação.</p>
             </div>
          </div>
        </div>

        {/* Camera Overlay */}
        {isCameraOpen && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 flex items-center gap-8">
              <button 
                onClick={stopCamera}
                className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30"
              >
                Cancelar
              </button>
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-900"></div>
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input for Gallery */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleFileSelect} 
        />

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex flex-col gap-2 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-2">
                {canEditStatus ? (
                  <select 
                    value={localTask.stage}
                    onChange={(e) => updateField('stage', e.target.value)}
                    className="text-xs font-bold text-slate-500 uppercase bg-slate-100 border-none rounded p-1 focus:ring-2 focus:ring-lsf-accent outline-none"
                  >
                      {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-400 uppercase">{localTask.stage}</span>
                )}
                {localTask.isTransitionPoint && <Badge type="TRANSITION" value={localTask.transitionTag || '#Transição'} />}
              </div>
              {canEditStatus ? (
                <input 
                  type="text"
                  value={localTask.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="text-xl font-bold text-slate-900 leading-snug w-full border-b border-transparent focus:border-lsf-accent hover:border-slate-200 outline-none bg-transparent transition-colors"
                  placeholder="Título da Tarefa"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 leading-snug">{localTask.title}</h2>
              )}
            </div>
            <button onClick={() => { onClose(); stopCamera(); }} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setActiveTab('DETAILS')}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'DETAILS' ? 'text-lsf-dark border-lsf-dark' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            >
              Detalhes
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'text-lsf-dark border-lsf-dark' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
            >
              Histórico
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {activeTab === 'DETAILS' ? (
            <>
              {/* Details Grid Form */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Sistema</span>
                  {canEditStatus ? (
                    <select 
                      value={localTask.system}
                      onChange={(e) => updateField('system', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-lsf-accent outline-none"
                    >
                      {Object.values(ConstructionSystem).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <Badge type="SYSTEM" value={localTask.system} />
                  )}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Executor</span>
                  {canEditStatus ? (
                    <input 
                      type="text"
                      value={localTask.executor}
                      onChange={(e) => updateField('executor', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-lsf-accent outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2 font-medium">
                      <UserIcon size={16} /> {localTask.executor}
                    </div>
                  )}
                </div>
                
                <div className="col-span-2 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <span className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Início Previsto</span>
                    {canEditStatus ? (
                        <input 
                          type="date"
                          value={localTask.dateStartExpected}
                          onChange={(e) => updateField('dateStartExpected', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-lsf-accent outline-none"
                        />
                    ) : (
                        <span className="font-medium flex items-center gap-2"><Calendar size={14}/> {new Date(localTask.dateStartExpected).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-slate-500 mb-1 text-xs uppercase font-bold tracking-wider">Fim Previsto</span>
                    {canEditStatus ? (
                        <input 
                          type="date"
                          value={localTask.dateEndExpected}
                          onChange={(e) => updateField('dateEndExpected', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-lsf-accent outline-none"
                        />
                    ) : (
                        <span className="font-medium flex items-center gap-2"><Calendar size={14}/> {new Date(localTask.dateEndExpected).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Form */}
              <div className="bg-slate-50 p-4 rounded-lg">
                {canEditStatus ? (
                  <textarea
                    value={localTask.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-slate-700 resize-none focus:ring-0"
                    placeholder="Adicione uma descrição detalhada da tarefa..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-700">{localTask.description || <span className="text-slate-400 italic">Sem descrição.</span>}</p>
                )}
              </div>

              {/* Subtasks Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ListTodo size={16} /> Checklist de Execução
                  </h3>
                  {subtasks.length > 0 && (
                    <span className="text-xs font-medium text-slate-500">
                        {completedSubtasks}/{subtasks.length}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {subtasks.length > 0 && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                    <div 
                      className="h-full bg-lsf-light transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                    {subtasks.map(st => (
                      <div key={st.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded group">
                          <button 
                            onClick={() => canEditStatus && handleToggleSubtask(st.id)}
                            disabled={!canEditStatus}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0
                              ${st.completed ? 'bg-lsf-accent border-lsf-accent text-white' : 'border-slate-300 bg-white'}
                            `}
                          >
                            {st.completed && <CheckCircle size={12} />}
                          </button>
                          <span className={`text-sm flex-1 ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {st.title}
                          </span>
                          {canEditStatus && (
                            <button 
                              onClick={() => handleDeleteSubtask(st.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"
                              title="Excluir subtarefa"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                      </div>
                    ))}

                    {canEditStatus && (
                      <div className="flex items-center gap-2 mt-2 pt-2">
                        <input
                          type="text"
                          value={newSubtaskText}
                          onChange={(e) => setNewSubtaskText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                          placeholder="Adicionar nova subtarefa..."
                          className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-lsf-accent"
                        />
                        <button 
                          onClick={handleAddSubtask}
                          disabled={!newSubtaskText.trim()}
                          className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                </div>
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

                {canEditStatus && (
                  <div className={`mt-4 transition-all duration-300 overflow-hidden ${localTask.status === ExecutionStatus.PARALISADO ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 relative">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-red-700">
                                Motivo da Paralisação <span className="text-red-600">*</span>
                            </label>
                            <div className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                <Bell size={10} /> Notificação ao GP
                            </div>
                        </div>
                        
                        <textarea
                            value={blockReason}
                            onChange={handleReasonChange}
                            onBlur={() => { if(blockReason.trim()) triggerNotification() }}
                            placeholder="Descreva o que está impedindo o avanço (ex: Falta material X)"
                            className={`w-full p-3 border rounded-lg bg-white text-sm outline-none transition-colors
                                ${showBlockError ? 'border-red-500 ring-2 ring-red-200' : 'border-red-300 focus:ring-2 focus:ring-red-500'}
                            `}
                            rows={2}
                        />
                        
                        {showBlockError ? (
                            <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1 animate-pulse">
                                <AlertTriangle size={12} />
                                O motivo é obrigatório para registrar a paralisação.
                            </p>
                        ) : (
                            <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                                <Send size={10} />
                                O Gerente de Projetos será notificado automaticamente ao salvar.
                            </p>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Photos Section */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Registro Fotográfico</h3>
                  {canEditStatus && (
                    <div className="flex gap-2">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 text-xs border border-slate-300 text-slate-700 px-3 py-2 rounded-md hover:bg-slate-50"
                        >
                          <ImagePlus size={14} />
                          Galeria
                        </button>
                        <button 
                          onClick={startCamera}
                          className="flex-1 flex items-center justify-center gap-2 text-xs bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                        >
                          <Camera size={14} />
                          Tirar Foto
                        </button>
                    </div>
                  )}
                </div>

                {localTask.photos.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-dashed rounded-lg text-slate-400 text-sm">
                    Nenhuma foto registrada.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {localTask.photos.map(photo => (
                      <div key={photo.id} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-slate-200">
                        <img src={photo.url} alt="Obra" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5 text-[10px] text-white truncate flex items-center justify-between">
                          <span>{new Date(photo.timestamp).toLocaleDateString()}</span>
                          <Aperture size={10} className="opacity-70" />
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History size={16} /> Linha do Tempo
                </h3>
                <span className="text-xs text-slate-400">{historyLogs.length} eventos</span>
              </div>
              
              {historyLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma alteração registrada neste dispositivo.</p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-6">
                  {/* Vertical Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                  {historyLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-lsf-light border-2 border-white shadow-sm z-10"></div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {new Date(log.timestamp).toLocaleDateString()} às {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-medium flex items-center gap-1">
                            <UserIcon size={10} /> {log.userName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                           <Badge type="STATUS" value={log.previousStatus} className="scale-90 origin-left opacity-75" />
                           <ArrowRight size={14} className="text-slate-400" />
                           <Badge type="STATUS" value={log.newStatus} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
