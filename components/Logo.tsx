import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10 w-auto" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="LSF BR" 
      className={`object-contain ${className}`}
      onError={(e) => {
        // Fallback visual discreto caso a imagem não seja encontrada imediatamente
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
            const text = document.createElement('span');
            text.textContent = 'LSF BR';
            text.className = 'font-black text-slate-800 tracking-tighter uppercase';
            text.style.fontSize = 'inherit';
            parent.appendChild(text);
        }
      }}
    />
  );
};