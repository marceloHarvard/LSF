
import React, { useState, useMemo, useEffect } from 'react';
import { Task, User, ExecutionStatus, ConstructionSystem, UserRole, ProjectStage, QualityGateStatus, TaskHistoryLog } from './types';
import { INITIAL_TASKS, MOCK_USERS } from './constants';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { DashboardStats } from './components/DashboardStats';
import { LoginPage } from './components/LoginPage';
import { Logo } from './components/Logo';
import { Filter, BarChart2, KanbanSquare, Plus, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Data State - Load from LocalStorage or use Initial Mocks
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('app_tasks');
      return savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS;
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
      return INITIAL_TASKS;
    }
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'KANBAN' | 'DASHBOARD'>('DASHBOARD');
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null);
  
  // Filters
  const [filterSystem, setFilterSystem] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterExecutor, setFilterExecutor] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('app_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD'); // Reset view on logout
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => {
      const oldTask = prev.find(t => t.id === updatedTask.id);
      
      // Histórico Logic: Se houve mudança de status, grava no localStorage
      if (oldTask && oldTask.status !== updatedTask.status && currentUser) {
        const historyItem: TaskHistoryLog = {
          id: Date.now().toString(),
          taskId: updatedTask.id,
          previousStatus: oldTask.status,
          newStatus: updatedTask.status,
          timestamp: Date.now(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role
        };

        const storageKey = `history_${updatedTask.id}`;
        const existingHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(storageKey, JSON.stringify([historyItem, ...existingHistory]));
      }

      const exists = prev.some(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      }
      return [...prev, updatedTask];
    });
    
    // Keep selected task in sync if it's the one currently open
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleAddNewTask = () => {
    if (!currentUser) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'Nova Tarefa',
      description: '',
      stage: ProjectStage.PRELIMINAR,
      system: ConstructionSystem.LSF,
      specialist: currentUser.role === UserRole.GP ? currentUser.name : 'GP',
      executor: 'Equipe de Campo',
      dateStartExpected: new Date().toISOString().split('T')[0],
      dateEndExpected: new Date().toISOString().split('T')[0],
      status: ExecutionStatus.AGUARDANDO_START,
      gate: { status: QualityGateStatus.PENDENTE, notes: '' },
      isTransitionPoint: false,
      photos: [],
      subtasks: []
    };
    setSelectedTask(newTask);
    setIsModalOpen(true);
  };

  // Helper for Swipe and other quick status changes
  const handleSwipeStatusChange = (taskId: string, newStatus: ExecutionStatus) => {
     const task = tasks.find(t => t.id === taskId);
     if (!task) return;

     const updated = { ...task, status: newStatus };
     
     if (newStatus === ExecutionStatus.PARALISADO) {
         updated.stopReason = 'Paralisado via Swipe (Motivo pendente)';
     } else {
         updated.stopReason = undefined;
     }

     if (newStatus === ExecutionStatus.EXECUTADO && task.status !== ExecutionStatus.EXECUTADO) {
        // Reset Gate when newly executed
        updated.gate = { status: QualityGateStatus.PENDENTE, notes: '' };
     }

     handleTaskUpdate(updated);
  };

  const uniqueExecutors = useMemo(() => {
    const execs = tasks.map(t => t.executor);
    return Array.from(new Set(execs)).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterSystem !== 'ALL' && task.system !== filterSystem) return false;
      if (filterStage !== 'ALL' && task.stage !== filterStage) return false;
      if (filterExecutor !== 'ALL' && task.executor !== filterExecutor) return false;
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterSystem, filterStage, filterExecutor, filterStatus]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, colId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (activeDropColumn !== colId) {
      setActiveDropColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Check if we are really leaving the container and not just entering a child
    const related = e.relatedTarget as HTMLElement;
    if (related && e.currentTarget.contains(related)) return;
    setActiveDropColumn(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    let newStatus: ExecutionStatus;

    // Determine target status based on column
    switch (targetColumnId) {
      case 'todo':
        newStatus = ExecutionStatus.AGUARDANDO_START;
        break;
      case 'wip':
        // If already in WIP status, keep it as is
        if ([ExecutionStatus.INICIADO, ExecutionStatus.EM_ANDAMENTO, ExecutionStatus.PARALISADO].includes(task.status)) {
           return; 
        }
        newStatus = ExecutionStatus.EM_ANDAMENTO;
        break;
      case 'done':
        newStatus = ExecutionStatus.EXECUTADO;
        break;
      default:
        return;
    }

    if (task.status === newStatus) return;

    const updatedTask = { ...task, status: newStatus };

    // Clean up Block Reason if moving out of blocked state implicitly
    updatedTask.stopReason = undefined;

    // Reset Gate if moving out of Done
    if (task.status === ExecutionStatus.EXECUTADO && newStatus !== ExecutionStatus.EXECUTADO) {
       updatedTask.gate = { ...updatedTask.gate, status: QualityGateStatus.PENDENTE, notes: '' };
    }

    handleTaskUpdate(updatedTask);
  };

  // Kanban Columns
  const columns = [
    { id: 'todo', title: 'A Fazer', statuses: [ExecutionStatus.AGUARDANDO_START] },
    { id: 'wip', title: 'Execução', statuses: [ExecutionStatus.INICIADO, ExecutionStatus.EM_ANDAMENTO, ExecutionStatus.PARALISADO] },
    { id: 'done', title: 'Executado / Gate', statuses: [ExecutionStatus.EXECUTADO] },
  ];

  // --- RENDER LOGIN PAGE IF NOT AUTHENTICATED ---
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isClient = currentUser.role === UserRole.CLIENT;

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      
      {/* Navigation Bar */}
      <header className="bg-lsf-dark text-white shadow-md z-20 flex-none transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo with auto width to prevent distortion */}
            <Logo className="h-12 w-auto" />
            <div className="hidden sm:block border-l border-slate-600 pl-4">
               <h1 className="font-bold text-lg leading-none tracking-tight">Gestão Híbrida</h1>
               <p className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">Alvenaria + LSF</p>
            </div>
          </div>
          
          {/* View Toggle (Desktop) */}
          <div className="hidden md:flex bg-slate-800/50 p-1 rounded-lg">
             <button 
               onClick={() => setCurrentView('DASHBOARD')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${currentView === 'DASHBOARD' ? 'bg-lsf-light text-lsf-dark shadow-sm' : 'text-slate-300 hover:bg-slate-700'}`}
             >
               <BarChart2 size={14} /> Dashboard
             </button>
             <button 
               onClick={() => setCurrentView('KANBAN')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${currentView === 'KANBAN' ? 'bg-lsf-light text-lsf-dark shadow-sm' : 'text-slate-300 hover:bg-slate-700'}`}
             >
               <KanbanSquare size={14} /> Kanban
             </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 border-l border-slate-700 pl-4 ml-2">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold leading-none">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[9px] text-lsf-light uppercase tracking-wider font-bold">{currentUser.role}</span>
             </div>
             
             <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full border-2 border-lsf-light" />
             
             <button 
               onClick={handleLogout}
               className="p-2 bg-slate-800 rounded-full hover:bg-red-500 hover:text-white text-slate-400 transition-colors"
               title="Sair do Sistema"
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </header>

      {/* Mobile View Switcher */}
      <div className="md:hidden bg-lsf-dark border-t border-slate-700 px-4 py-2 flex gap-2">
        <button 
           onClick={() => setCurrentView('DASHBOARD')}
           className={`flex-1 flex justify-center items-center gap-2 py-2 rounded text-xs font-bold transition-all ${currentView === 'DASHBOARD' ? 'bg-lsf-light text-lsf-dark' : 'bg-slate-800 text-slate-300'}`}
         >
           <BarChart2 size={14} /> Dashboard
         </button>
         <button 
           onClick={() => setCurrentView('KANBAN')}
           className={`flex-1 flex justify-center items-center gap-2 py-2 rounded text-xs font-bold transition-all ${currentView === 'KANBAN' ? 'bg-lsf-light text-lsf-dark' : 'bg-slate-800 text-slate-300'}`}
         >
           <KanbanSquare size={14} /> Kanban
         </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Common Filter Bar */}
        <div className="bg-white border-b px-4 py-3 flex-none z-10">
           <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-3 text-sm w-full sm:w-auto">
                 <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={16} className="text-lsf-accent" />
                    <span className="font-medium text-slate-700 hidden sm:inline">Filtros:</span>
                 </div>
                 
                 <select 
                  className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-lsf-accent outline-none cursor-pointer flex-1 sm:flex-none"
                  value={filterSystem}
                  onChange={(e) => setFilterSystem(e.target.value)}
                >
                   <option value="ALL">Todos Sistemas</option>
                   <option value={ConstructionSystem.ALVENARIA}>Alvenaria</option>
                   <option value={ConstructionSystem.LSF}>LSF</option>
                   <option value={ConstructionSystem.HIBRIDO}>Híbrido</option>
                   <option value={ConstructionSystem.INSTALACAO}>Instalação</option>
                </select>

                <select 
                  className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-lsf-accent outline-none cursor-pointer flex-1 sm:flex-none"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                >
                   <option value="ALL">Todas Etapas</option>
                   <option value={ProjectStage.PRELIMINAR}>1. Preliminar</option>
                   <option value={ProjectStage.ESTRUTURAL}>2. Estrutural</option>
                   <option value={ProjectStage.VEDACAO_INFRA}>3. Vedação/Infra</option>
                   <option value={ProjectStage.COBERTURA_ACABAMENTO}>4. Cobertura</option>
                </select>

                <select 
                  className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-lsf-accent outline-none cursor-pointer flex-1 sm:flex-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                   <option value="ALL">Todos Status</option>
                   <option value={ExecutionStatus.AGUARDANDO_START}>Aguardando Start</option>
                   <option value={ExecutionStatus.INICIADO}>Iniciado</option>
                   <option value={ExecutionStatus.EM_ANDAMENTO}>Em Andamento</option>
                   <option value={ExecutionStatus.PARALISADO}>Paralisado</option>
                   <option value={ExecutionStatus.EXECUTADO}>Executado</option>
                </select>

                <select 
                  className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-lsf-accent outline-none cursor-pointer flex-1 sm:flex-none"
                  value={filterExecutor}
                  onChange={(e) => setFilterExecutor(e.target.value)}
                >
                   <option value="ALL">Todos Executores</option>
                   {uniqueExecutors.map(exec => (
                     <option key={exec} value={exec}>{exec}</option>
                   ))}
                </select>
              </div>
              
              <div className="text-xs text-slate-400 font-medium whitespace-nowrap ml-auto sm:ml-0">
                 {filteredTasks.length} tarefa{filteredTasks.length !== 1 && 's'}
              </div>
           </div>
        </div>

        {/* Views */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
           {currentView === 'DASHBOARD' ? (
              <div className="max-w-7xl mx-auto p-4 md:p-6">
                 <DashboardStats 
                    tasks={filteredTasks} 
                    onTaskClick={handleTaskClick} 
                    onStatusChange={isClient ? undefined : handleSwipeStatusChange}
                 />
              </div>
           ) : (
             <div className="h-full overflow-x-auto overflow-y-hidden p-4">
                <div className="max-w-7xl mx-auto h-full flex gap-4 min-w-[800px] lg:min-w-0">
                  {columns.map(col => (
                    <div 
                      key={col.id} 
                      className={`
                        flex-1 flex flex-col rounded-xl border max-w-md min-w-[280px] shadow-inner transition-colors duration-200
                        ${activeDropColumn === col.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-slate-100 border-slate-200'}
                      `}
                      onDragOver={(e) => !isClient && handleDragOver(e, col.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !isClient && handleDrop(e, col.id)}
                    >
                       <div className="p-3 border-b border-slate-200 bg-slate-200/50 flex items-center justify-between rounded-t-xl">
                         <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-2">
                           {col.id === 'done' ? <div className="w-2 h-2 rounded-full bg-lsf-light" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                           {col.title}
                         </h3>
                         <span className="bg-white text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border border-slate-100">
                           {filteredTasks.filter(t => col.statuses.includes(t.status)).length}
                         </span>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                          {filteredTasks
                            .filter(t => col.statuses.includes(t.status))
                            .map(task => (
                              <div 
                                key={task.id}
                                draggable={!isClient}
                                onDragStart={(e) => !isClient && handleDragStart(e, task.id)}
                                className={`${!isClient ? 'cursor-move active:cursor-grabbing' : ''} transform transition-transform hover:scale-[1.01]`}
                              >
                                <TaskCard 
                                  task={task} 
                                  onClick={() => handleTaskClick(task)} 
                                  onStatusChange={isClient ? undefined : handleSwipeStatusChange}
                                />
                              </div>
                            ))
                          }
                          
                          {filteredTasks.filter(t => col.statuses.includes(t.status)).length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 pointer-events-none">
                              <KanbanSquare size={48} strokeWidth={1} />
                              <span className="text-xs italic mt-2">Arraste tarefas para cá</span>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </main>
      
      {/* Floating Action Button (New Task) */}
      {!isClient && (
         <button
            onClick={handleAddNewTask}
            className="fixed bottom-6 right-6 bg-lsf-dark text-white p-4 rounded-full shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 z-40 flex items-center justify-center border-2 border-lsf-light group"
            title="Nova Tarefa"
         >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
         </button>
      )}

      <TaskModal 
        task={selectedTask} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={currentUser}
        onUpdateTask={handleTaskUpdate}
      />
    </div>
  );
};

export default App;
