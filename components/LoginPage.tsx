
import React from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { Logo } from './Logo';
import { User as UserIcon, ShieldCheck, HardHat, Briefcase } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.GP: return <ShieldCheck className="w-5 h-5 text-lsf-light" />;
      case UserRole.EXECUTOR: return <HardHat className="w-5 h-5 text-orange-500" />;
      case UserRole.CLIENT: return <Briefcase className="w-5 h-5 text-blue-400" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case UserRole.GP: return 'Gestão total, aprovação de Gates e planejamento.';
      case UserRole.EXECUTOR: return 'Execução de tarefas, checklist e fotos de campo.';
      case UserRole.CLIENT: return 'Visualização do progresso e relatórios.';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-lsf-light rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-lsf-accent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur shadow-2xl rounded-2xl overflow-hidden border border-slate-700/50">
        
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
          <div className="flex justify-center mb-4">
             <Logo className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Bem-vindo</h1>
          <p className="text-slate-500 text-sm mt-2">Selecione um perfil para acessar a demonstração do sistema de Gestão Híbrida.</p>
        </div>

        <div className="p-6 space-y-3">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-lsf-accent hover:bg-slate-50 hover:shadow-md transition-all group text-left bg-white"
            >
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border-2 border-slate-100 group-hover:border-lsf-light transition-colors object-cover" 
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                   {getRoleIcon(user.role)}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 group-hover:text-lsf-dark transition-colors">{user.name}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-lsf-dark group-hover:text-white transition-colors">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {getRoleDescription(user.role)}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            Ambiente de Demonstração Seguro • v1.0.2
          </p>
        </div>
      </div>
    </div>
  );
};
