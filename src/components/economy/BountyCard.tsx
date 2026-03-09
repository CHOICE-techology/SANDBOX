import React from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BountyCardProps {
  task: string;
  amount: number;
  isCompleted?: boolean;
  onClick?: () => void;
}

export const BountyCard: React.FC<BountyCardProps> = ({ task, amount, isCompleted, onClick }) => {
  return (
    <div className={cn(
      "relative group bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
      isCompleted && "opacity-60 border-emerald-500/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Target size={20} className="text-cyan-400" />
          </div>
          <div>
            <h4 className="text-white font-bold text-base leading-tight">{task}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-cyan-400 font-black text-sm">◈ {amount} CHOICE</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClick}
          className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all border border-transparent hover:border-cyan-400/20"
        >
          <ArrowRight size={20} />
        </button>
      </div>
      
      {/* Dynamic Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
    </div>
  );
};
