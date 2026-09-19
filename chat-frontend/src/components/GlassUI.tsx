import React from 'react';

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`glass-panel p-6 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }> = ({ children, className = '', variant = 'primary', ...props }) => {
  const base = "px-4 py-2 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-chat-primary hover:bg-chat-secondary text-white shadow-lg shadow-chat-primary/20",
    ghost: "bg-white/5 hover:bg-white/10 text-white border border-white/10"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-chat-primary/50 focus:ring-1 focus:ring-chat-primary/50 transition-all ${className}`}
    {...props}
  />
);

export const Avatar: React.FC<{ src?: string; fallback: string; className?: string; online?: boolean }> = ({ src, fallback, className = '', online }) => (
  <div className={`relative rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-sm font-medium border border-white/10 shrink-0 ${className}`}>
    {src ? (
      <img src={src} alt={fallback} className="w-full h-full object-cover" />
    ) : (
      <span>{fallback}</span>
    )}
    {online !== undefined && (
      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0f] ${online ? 'bg-green-500' : 'bg-gray-500'}`} />
    )}
  </div>
);

export const Spinner = () => (
  <div className="w-6 h-6 border-2 border-white/20 border-t-chat-primary rounded-full animate-spin" />
);
