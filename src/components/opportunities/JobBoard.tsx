import React from 'react';
import { BountyCard } from '../economy/BountyCard';

interface JobBoardProps {
  jobs: any[];
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobs }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          SOVEREIGN MATCHES
        </h3>
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
          AI Verified
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <BountyCard 
              key={job.id} 
              task={`${job.title} @ ${job.company}`} 
              amount={job.rewardAmount || 100} 
            />
          ))
        ) : (
          <div className="col-span-full py-12 border border-dashed border-white/10 rounded-3xl text-center">
            <p className="text-white/40 text-sm font-medium">Scanning local vault for sovereign opportunities...</p>
          </div>
        )}
      </div>
    </div>
  );
};
