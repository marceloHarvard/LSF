
import React, { useMemo, useState } from 'react';
import { Task, ExecutionStatus, ConstructionSystem, QualityGateStatus } from '../types';
import { PieChart, BarChart3, CheckCircle2, AlertTriangle, Activity, TrendingUp, CalendarClock, AlertCircle, Users } from 'lucide-react';
import { TaskCard } from './TaskCard';

interface DashboardStatsProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: ExecutionStatus) => void;
}

// Internal Component for the Progress Chart
const ProgressChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; date: string; executors: string[]; pct: number } | null>(null);

  const chartData = useMemo(() => {
    if (tasks.length === 0) return null;

    // 1. Determine Date Range
    const dates = tasks.flatMap(t => [new Date(t.dateStartExpected), new Date(t.dateEndExpected)]);
    // Add executed dates if available
    tasks.forEach(t => {
      if (t.gate.date) dates.push(new Date(t.gate.date));
    });

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Buffer dates (start 1 day before, end 1 day after)
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    const totalTime = maxDate.getTime() - minDate.getTime();
    if (totalTime <= 0) return null;

    // 2. Generate Data Points (Daily steps)
    const points: { date: Date; plannedPct: number; actualPct: number; executors: string[] }[] = [];
    let currentDate = new Date(minDate);
    const totalTasks = tasks.length;

    while (currentDate <= maxDate) {
      const time = currentDate.getTime();

      // Planned: Count tasks where dateEndExpected <= currentDate
      const plannedCount = tasks.filter(t => new Date(t.dateEndExpected).getTime() <= time).length;

      // Actual: Count tasks where status is EXECUTED AND (gate date or end date) <= currentDate
      const completedTasksUntilNow = tasks.filter(t => {
        if (t.status !== ExecutionStatus.EXECUTADO) return false;
        const doneDate = t.gate.date ? new Date(t.gate.date).getTime() : new Date(t.dateEndExpected).getTime();
        return doneDate <= time;
      });

      // Find executors specifically for THIS day (for the tooltip)
      const tasksCompletedOnThisDay = tasks.filter(t => {
        if (t.status !== ExecutionStatus.EXECUTADO) return false;
        const doneDate = t.gate.date ? new Date(t.gate.date) : new Date(t.dateEndExpected);
        return doneDate.toDateString() === currentDate.toDateString();
      });

      const uniqueExecutors: string[] = Array.from(new Set(tasksCompletedOnThisDay.map(t => t.executor)));

      points.push({
        date: new Date(currentDate),
        plannedPct: (plannedCount / totalTasks) * 100,
        actualPct: (completedTasksUntilNow.length / totalTasks) * 100,
        executors: uniqueExecutors
      });

      // Advance 1 day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return points;
  }, [tasks]);

  if (!chartData || chartData.length < 2) return null;

  // SVG Dimensions
  const width = 600;
  const height = 200;
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Helper to map data to coordinates
  const getX = (index: number) => padding + (index / (chartData.length - 1)) * graphWidth;
  const getY = (pct: number) => height - padding - (pct / 100) * graphHeight;

  // Generate Paths
  const plannedPath = chartData.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.plannedPct)}`).join(' ');
  const actualPath = chartData.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.actualPct)}`).join(' ');

  // Generate Area for Actual (Gradient fill effect)
  const actualArea = `${actualPath} L ${getX(chartData.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto relative group">
      <div className="min-w-[600px] relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-sans text-[10px] overflow-visible">
          {/* Grid Lines (25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map(pct => (
            <g key={pct}>
              <line 
                x1={padding} y1={getY(pct)} 
                x2={width - padding} y2={getY(pct)} 
                stroke="#e2e8f0" strokeWidth="1" 
              />
              <text x={0} y={getY(pct) + 3} fill="#94a3b8" className="text-[8px]">{pct}%</text>
            </g>
          ))}

          {/* Planned Line (Navy Dashed) */}
          <path d={plannedPath} fill="none" stroke="#1a2b4c" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />

          {/* Actual Area (Green Gradient) */}
          <defs>
            <linearGradient id="gradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#4ade80', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={actualArea} fill="url(#gradGreen)" />
          <path d={actualPath} fill="none" stroke="#16a34a" strokeWidth="3" />

          {/* Interactive Points on Green Line */}
          {chartData.map((pt, i) => (
            <g key={i}>
              {/* Invisible Hit Area (Larger) */}
              <circle
                cx={getX(i)}
                cy={getY(pt.actualPct)}
                r={6}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverData({
                  x: getX(i),
                  y: getY(pt.actualPct),
                  date: pt.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                  executors: pt.executors,
                  pct: Math.round(pt.actualPct)
                })}
                onMouseLeave={() => setHoverData(null)}
              />
              {/* Visible Dot on Hover or if Executor present */}
              <circle 
                cx={getX(i)}
                cy={getY(pt.actualPct)}
                r={hoverData?.x === getX(i) ? 4 : (pt.executors.length > 0 ? 3 : 0)}
                fill={hoverData?.x === getX(i) ? "#fff" : "#16a34a"}
                stroke="#16a34a"
                strokeWidth={2}
                className={`transition-all duration-200 pointer-events-none ${hoverData?.x === getX(i) ? 'opacity-100 scale-125' : (pt.executors.length > 0 ? 'opacity-100' : 'opacity-0')}`}
              />
            </g>
          ))}

          {/* X-Axis Labels (First, Middle, Last) */}
          <text x={getX(0)} y={height} fill="#64748b" textAnchor="start">{chartData[0].date.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</text>
          <text x={getX(Math.floor(chartData.length / 2))} y={height} fill="#64748b" textAnchor="middle">{chartData[Math.floor(chartData.length / 2)].date.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</text>
          <text x={getX(chartData.length - 1)} y={height} fill="#64748b" textAnchor="end">{chartData[chartData.length - 1].date.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</text>

          {/* Legend */}
          <g transform={`translate(${width - 150}, 0)`}>
             <rect width="10" height="2" x="0" y="5" fill="#1a2b4c" opacity="0.6" />
             <text x="15" y="10" fill="#1a2b4c" fontSize="10">Planejado</text>
             
             <rect width="10" height="2" x="70" y="5" fill="#16a34a" />
             <text x="85" y="10" fill="#16a34a" fontSize="10" fontWeight="bold">Realizado</text>
          </g>
        </svg>

        {/* Tooltip DOM Overlay */}
        {hoverData && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-800 text-white text-xs rounded-lg shadow-xl p-3 transform -translate-x-1/2 -translate-y-[120%] w-48"
            style={{ left: `${(hoverData.x / width) * 100}%`, top: `${(hoverData.y / height) * 100}%` }}
          >
            <div className="flex justify-between items-center border-b border-slate-600 pb-1 mb-1">
               <span className="font-bold">{hoverData.date}</span>
               <span className="text-green-400 font-bold">{hoverData.pct}%</span>
            </div>
            
            {hoverData.executors.length > 0 ? (
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Executores:</span>
                <ul className="space-y-1">
                  {hoverData.executors.map((exec, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                       <Users size={10} className="text-lsf-light" />
                       <span className="truncate">{exec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[10px]">Sem conclusões nesta data</span>
            )}
            
            {/* Triangle Pointer */}
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-slate-800 transform -translate-x-1/2 rotate-45"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks, onTaskClick, onStatusChange }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const executed = tasks.filter(t => t.status === ExecutionStatus.EXECUTADO).length;
    const progress = total === 0 ? 0 : Math.round((executed / total) * 100);
    
    const pendingGates = tasks.filter(t => 
      t.status === ExecutionStatus.EXECUTADO && 
      t.gate.status === QualityGateStatus.PENDENTE
    ).length;

    const blocked = tasks.filter(t => t.status === ExecutionStatus.PARALISADO).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Detailed list of overdue tasks for the new section
    const overdueTasksList = tasks.filter(t => {
      if (t.status === ExecutionStatus.EXECUTADO) return false;
      const [year, month, day] = t.dateEndExpected.split('-').map(Number);
      const end = new Date(year, month - 1, day);
      return end < today;
    });

    const overdueCount = overdueTasksList.length;

    // System Distribution
    const bySystem = {
      [ConstructionSystem.LSF]: tasks.filter(t => t.system === ConstructionSystem.LSF).length,
      [ConstructionSystem.ALVENARIA]: tasks.filter(t => t.system === ConstructionSystem.ALVENARIA).length,
      [ConstructionSystem.HIBRIDO]: tasks.filter(t => t.system === ConstructionSystem.HIBRIDO).length,
      [ConstructionSystem.INSTALACAO]: tasks.filter(t => t.system === ConstructionSystem.INSTALACAO).length,
    };

    // Status Distribution (Simplified for Chart)
    const byStatus = {
      wait: tasks.filter(t => t.status === ExecutionStatus.AGUARDANDO_START).length,
      active: tasks.filter(t => [ExecutionStatus.INICIADO, ExecutionStatus.EM_ANDAMENTO].includes(t.status)).length,
      blocked: blocked,
      done: executed
    };

    return { total, executed, progress, pendingGates, blocked, overdue: overdueCount, overdueList: overdueTasksList, bySystem, byStatus };
  }, [tasks]);

  // Helpers for safe chart rendering
  const getPercent = (val: number) => stats.total > 0 ? (val / stats.total) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Activity className="w-5 h-5 text-lsf-accent" />
            <span className="text-xs font-bold uppercase tracking-wider">Progresso Geral</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-800">{stats.progress}%</span>
            <span className="text-xs text-slate-400 mb-1">{stats.executed}/{stats.total} tarefas</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-lsf-accent h-full rounded-full transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <CheckCircle2 className="w-5 h-5 text-lsf-light" />
            <span className="text-xs font-bold uppercase tracking-wider">GATES Pendentes</span>
          </div>
          <span className="text-3xl font-black text-slate-800">{stats.pendingGates}</span>
          <p className="text-xs text-slate-400 mt-1">Aguardando liberação do GP</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Paralisados</span>
          </div>
          <span className="text-3xl font-black text-slate-800">{stats.blocked}</span>
          <p className="text-xs text-slate-400 mt-1">Impedimentos ativos</p>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${stats.overdue > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'} flex flex-col justify-center`}>
           <div className="flex items-center gap-3 text-slate-500 mb-2">
             <CalendarClock className={`w-5 h-5 ${stats.overdue > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
             <span className={`text-xs font-bold uppercase tracking-wider ${stats.overdue > 0 ? 'text-orange-600' : ''}`}>Em Atraso</span>
           </div>
           <span className={`text-3xl font-black ${stats.overdue > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
             {stats.overdue}
           </span>
           <p className="text-xs text-slate-400 mt-1">Tarefas fora do prazo</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evolution Chart (New - Spans 2 columns on Large screens) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Evolução Física: Planejado vs Realizado
            </h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Acumulado</span>
          </div>
          <div className="py-2">
            <ProgressChart tasks={tasks} />
          </div>
        </div>

        {/* Status Breakdown (Vertical Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Status Atual
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Executado</span>
                <span>{stats.byStatus.done}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${getPercent(stats.byStatus.done)}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Em Andamento</span>
                <span>{stats.byStatus.active}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getPercent(stats.byStatus.active)}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Aguardando</span>
                <span>{stats.byStatus.wait}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full" style={{ width: `${getPercent(stats.byStatus.wait)}%` }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Paralisado</span>
                <span>{stats.byStatus.blocked}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${getPercent(stats.byStatus.blocked)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Distribution */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              Distribuição por Sistema
            </h3>
          </div>
          
          <div className="flex items-center justify-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
               {stats.total > 0 ? (
                 <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                   <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                   <path className="text-green-500" strokeDasharray={`${getPercent(stats.bySystem['LSF'])}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                   <path className="text-indigo-500" strokeDasharray={`${getPercent(stats.bySystem['Híbrido'])}, 100`} strokeDashoffset={`-${getPercent(stats.bySystem['LSF'])}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                   <path className="text-blue-400" strokeDasharray={`${getPercent(stats.bySystem['Instalação'])}, 100`} strokeDashoffset={`-${getPercent(stats.bySystem['LSF']) + getPercent(stats.bySystem['Híbrido'])}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                   <path className="text-orange-400" strokeDasharray={`${getPercent(stats.bySystem['Alvenaria'])}, 100`} strokeDashoffset={`-${getPercent(stats.bySystem['LSF']) + getPercent(stats.bySystem['Híbrido']) + getPercent(stats.bySystem['Instalação'])}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                 </svg>
               ) : (
                 <div className="w-full h-full rounded-full border-4 border-slate-100"></div>
               )}
               <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Total</span>
               </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-600">LSF ({stats.bySystem['LSF']})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <span className="text-slate-600">Alvenaria ({stats.bySystem['Alvenaria']})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-600">Híbrido ({stats.bySystem['Híbrido']})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-slate-600">Instalações ({stats.bySystem['Instalação']})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future Widget */}
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-slate-400">
            <Activity size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-medium text-center">Métricas de produtividade<br/>em breve</span>
        </div>
      </div>

      {/* OVERDUE ALERTS SECTION */}
      {stats.overdueList.length > 0 && (
        <div className="animate-in slide-in-from-bottom-5 duration-500 mt-8 border-t pt-8">
           <h3 className="text-orange-700 font-bold flex items-center gap-2 mb-4 text-lg">
               <AlertCircle /> Atenção: Tarefas Críticas em Atraso
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.overdueList.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => onTaskClick(task)} 
                  onStatusChange={onStatusChange}
                />
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
