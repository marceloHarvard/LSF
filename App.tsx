
import React, { useState, useMemo } from 'react';
import { Task, User, ExecutionStatus, ConstructionSystem, UserRole, ProjectStage } from './types';
import { INITIAL_TASKS, MOCK_USERS } from './constants';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { DashboardStats } from './components/DashboardStats';
import { Logo } from './components/Logo';
import { Filter, BarChart2, KanbanSquare } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default to GP
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'KANBAN' | 'DASHBOARD'>('DASHBOARD');
  
  // Filters
  const [filterSystem, setFilterSystem] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterSystem !== 'ALL' && task.system !== filterSystem) return false;
      if (filterStage !== 'ALL' && task.stage !== filterStage) return false;
      return true;
    });
  }, [tasks, filterSystem, filterStage]);

  // Kanban Columns
  const columns = [
    { id: 'todo', title: 'A Fazer', statuses: [ExecutionStatus.AGUARDANDO_START] },
    { id: 'wip', title: 'Execução', statuses: [ExecutionStatus.INICIADO, ExecutionStatus.EM_ANDAMENTO, ExecutionStatus.PARALISADO] },
    { id: 'done', title: 'Executado / Gate', statuses: [ExecutionStatus.EXECUTADO] },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      
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

          {/* User Switcher (For Demo) */}
          <div className="flex items-center gap-2">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Logado como</span>
                <span className="text-xs font-bold">{currentUser.name.split(' ')[0]}</span>
             </div>
             <button 
               onClick={() => {
                 const nextIndex = (MOCK_USERS.findIndex(u => u.id === currentUser.id) + 1) % MOCK_USERS.length;
                 setCurrentUser(MOCK_USERS[nextIndex]);
               }}
               className="relative"
               title="Clique para alternar usuário"
             >
               <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full border-2 border-lsf-light hover:scale-105 transition-transform" />
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-lsf-light rounded-full border-2 border-lsf-dark flex items-center justify-center text-[8px] font-bold text-lsf-dark">
                  {currentUser.role.charAt(0)}
               </div>
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
      <main className="flex-1 overflow-hidden flex flex-col">
        
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
                 <DashboardStats tasks={filteredTasks} />
              </div>
           ) : (
             <div className="h-full overflow-x-auto overflow-y-hidden p-4">
                <div className="max-w-7xl mx-auto h-full flex gap-4 min-w-[800px] lg:min-w-0">
                  {columns.map(col => (
                    <div key={col.id} className="flex-1 flex flex-col bg-slate-100 rounded-xl border border-slate-200 max-w-md min-w-[280px] shadow-inner">
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
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                onClick={() => handleTaskClick(task)} 
                              />
                            ))
                          }
                          
                          {filteredTasks.filter(t => col.statuses.includes(t.status)).length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                              <KanbanSquare size={48} strokeWidth={1} />
                              <span className="text-xs italic mt-2">Sem tarefas nesta etapa</span>
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
