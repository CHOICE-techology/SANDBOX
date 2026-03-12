import React, { useState, useEffect, useMemo } from 'react';
import { Job, JobMatchResult, GeneratedCV } from '@/types';
import { calculateJobMatch } from '@/services/jobMatchingService';
import { mockGenerateCV } from '@/services/cryptoService';
import { ChoiceButton } from '@/components/ChoiceButton';

import { DollarSign, Zap, Star, MapPin, Search, CheckCircle, AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp, Lock, Send, FileText, X, Sparkles, Eye, PenTool, ArrowRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useChoiceStore } from '@/store/useChoiceStore';
import { ALL_JOBS } from '@/data/jobsData';
import { calculateIdentityScore } from '@/services/scoreEngine';
import { getChoiceBalance } from '@/services/rewardService';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 15;
const APPLIED_JOBS_KEY = 'choice_job_applications_v1';

type JobWithMatch = Job & { matchResult?: JobMatchResult };

const getAppliedJobs = (): Set<string> => {
  try {
    const raw = localStorage.getItem(APPLIED_JOBS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveAppliedJobs = (ids: Set<string>) => {
  localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify([...ids]));
};

type ApplyStep = 'description' | 'optimize' | 'coverLetter' | 'cvPreview' | 'sent';

const JobsPage: React.FC = () => {
  const { userIdentity: identity, isConnected, updateIdentity } = useWallet();
  const { setWalletModalOpen } = useChoiceStore();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [choiceBalance, setChoiceBalance] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(getAppliedJobs);

  // Multi-step apply flow
  const [applyStep, setApplyStep] = useState<ApplyStep>('description');
  const [cv, setCv] = useState<GeneratedCV | null>(null);
  const [optimizedCV, setOptimizedCV] = useState<GeneratedCV | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isSendingApp, setIsSendingApp] = useState(false);

  const score = identity ? calculateIdentityScore(identity.credentials) : 0;

  useEffect(() => {
    if (identity?.address) {
      getChoiceBalance(identity.address).then(b => setChoiceBalance(b));
    }
  }, [identity?.address]);

  useEffect(() => {
    setIsMatching(true);
    const t = setTimeout(() => setIsMatching(false), 800);
    return () => clearTimeout(t);
  }, [identity, filterType]);

  const jobs = useMemo((): JobWithMatch[] => {
    let filtered = ALL_JOBS.filter(job => filterType === 'All' || job.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
    }
    return filtered.map(job => {
      const matchResult = identity ? calculateJobMatch(job, identity) : undefined;
      return { ...job, matchScore: matchResult?.score || 0, matchReason: matchResult?.reason || '', matchResult };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [identity, filterType, searchQuery]);

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [filterType, searchQuery]);

  const handleApply = (job: JobWithMatch) => {
    if (!isConnected) { setWalletModalOpen(true); return; }
    if (!identity) return;
    if (appliedJobs.has(job.id)) return; // Already applied
    const matchResult = job.matchResult || { score: job.matchScore || 0, reason: job.matchReason || '', matchingSkills: [], missingSkills: [], recommendations: [] };
    setSelectedJob({ ...job, matchResult });
    setJobDialogOpen(true);
    setApplyStep('description');
    setCv(null);
    setOptimizedCV(null);
    setCoverLetter(null);
  };

  const handleGenerateCV = async () => {
    if (!identity) return;
    setIsGeneratingCV(true);
    try {
      const generated = await mockGenerateCV(identity);
      setCv(generated);
      setApplyStep('optimize');
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCV(false); }
  };

  const handleOptimize = async () => {
    if (!cv || !selectedJob) return;
    setIsOptimizing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const jd = `${selectedJob.title} at ${selectedJob.company}. ${selectedJob.description}. Skills: ${selectedJob.requiredSkills.join(', ')}`;
      const jdLower = jd.toLowerCase();
      const prioritizedSkills = [...cv.skills].sort((a, b) => {
        const aMatch = jdLower.includes(a.toLowerCase()) ? -1 : 1;
        const bMatch = jdLower.includes(b.toLowerCase()) ? -1 : 1;
        return aMatch - bMatch;
      });
      setOptimizedCV({
        ...cv,
        summary: `Tailored professional with verified credentials for ${selectedJob.title} at ${selectedJob.company}. ${cv.summary}`,
        skills: prioritizedSkills,
      });
      setApplyStep('coverLetter');
    } catch (e) { console.error(e); }
    finally { setIsOptimizing(false); }
  };

  const handleGenerateCoverLetter = async () => {
    if (!cv || !selectedJob) return;
    setIsGeneratingCover(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const topSkills = cv.skills.slice(0, 4).join(', ');
      const letter = `Dear Hiring Manager at ${selectedJob.company},

I am writing to express my strong interest in the ${selectedJob.title} position. As a verified Web3 professional with a CHOICE Trust Score of ${score}/100, I bring a unique combination of on-chain credentials and real-world expertise.

My verified profile demonstrates proficiency in ${topSkills}, backed by cryptographic proofs anchored on-chain.${cv.experience.length > 0 ? ` With experience as ${cv.experience[0].role} at ${cv.experience[0].company}, I have a proven track record.` : ''}

${cv.education.length > 0 ? `My education includes ${cv.education[0].degree} from ${cv.education[0].institution}.` : ''}

I am excited about the opportunity to contribute to ${selectedJob.company}'s mission.

Best regards,
${identity?.displayName || 'CHOICE ID Holder'}
DID: ${identity?.did}`;
      setCoverLetter(letter);
      setApplyStep('cvPreview');
    } catch (e) { console.error(e); }
    finally { setIsGeneratingCover(false); }
  };

  const handleSendApplication = async () => {
    if (!selectedJob || !identity) return;
    setIsSendingApp(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const newApplied = new Set(appliedJobs);
      newApplied.add(selectedJob.id);
      setAppliedJobs(newApplied);
      saveAppliedJobs(newApplied);
      setApplyStep('sent');
      toast({
        title: 'Application Sent!',
        description: `Your CHOICE ID profile was sent to ${selectedJob.company} for the ${selectedJob.title} role.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to send application.', variant: 'destructive' });
    } finally {
      setIsSendingApp(false);
    }
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_JOBS.length };
    ALL_JOBS.forEach(j => { counts[j.type] = (counts[j.type] || 0) + 1; });
    return counts;
  }, []);

  const getMatchColor = (score: number) => {
    if (score >= 85) return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 70) return { border: 'border-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' };
    if (score >= 50) return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { border: 'border-border', text: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const displayCV = optimizedCV || cv;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Jobs, Gigs & Collabs</h1>
          <p className="text-muted-foreground text-lg">AI-matched opportunities based on your Verified CHOICE ID. <strong className="text-foreground">{ALL_JOBS.length} roles</strong> available.</p>
        </div>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search jobs by title, company, or description..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass border-white/10 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', 'Full-time', 'Contract', 'DAO', 'Collaboration', 'Gig'].map(type => (
          <button key={type} onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === type ? 'bg-primary text-primary-foreground shadow-glow-primary' : 'glass border-white/10 text-muted-foreground hover:bg-white/5'}`}>
            {type} <span className="text-xs opacity-70 ml-1">({typeCounts[type] || 0})</span>
          </button>
        ))}
      </div>

      {!isConnected && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3 text-foreground">
          <Zap size={20} className="text-primary" />
          <span className="text-sm font-medium">Connect your CHOICE ID to see your AI Match Score and apply to roles.</span>
          <button onClick={() => setWalletModalOpen(true)} className="ml-auto bg-primary text-primary-foreground font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition-all shrink-0">
            Connect
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isMatching ? (
          <div className="text-center py-20">
            <div className="animate-spin bg-primary/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 border-t-4 border-primary"></div>
            <p className="text-muted-foreground font-medium animate-pulse">AI Engine Analyzing Credential Fit...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No jobs match your search.</p>
          </div>
        ) : (
          <>
            {jobs.slice(0, visibleCount).map((job, idx) => {
              const mc = getMatchColor(job.matchScore || 0);
              const isExpanded = expandedJob === job.id;
              const mr = job.matchResult;
              const requiredScore = job.minScore;
              const requiredBalance = job.minScore >= 70 ? 50 : 0;
              const isJobLocked = identity && (score < requiredScore || (requiredBalance > 0 && choiceBalance < requiredBalance));
              const isApplied = appliedJobs.has(job.id);

              return (
                <div key={job.id} className={cn(
                  'glass rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group',
                  isApplied ? 'border-emerald-500/40 bg-emerald-500/5' :
                  isJobLocked ? 'border-white/5 opacity-50' :
                  idx === 0 && identity ? 'border-emerald-500/50 shadow-glow-primary/20 bg-white/5' : 'border-white/10',
                  'hover:bg-white/5'
                )}>
                  {/* Applied badge */}
                  {isApplied && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1 z-10">
                      <CheckCircle size={10} /> Applied
                    </div>
                  )}
                  {idx === 0 && identity && !isJobLocked && !isApplied && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-glow-primary">Top AI Pick</div>
                  )}
                  {isJobLocked && !isApplied && (
                    <div className="absolute top-0 right-0 bg-muted text-muted-foreground text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10">
                      <Lock size={10} /> Locked
                    </div>
                  )}
                  <div className={`p-5 flex flex-col md:flex-row gap-4 items-start md:items-center ${isJobLocked && !isApplied ? 'blur-[1px]' : ''}`}>
                    {identity && (
                      <div className="flex flex-col items-center justify-center min-w-[64px]">
                        <div className={`relative w-14 h-14 flex items-center justify-center rounded-full border-[3px] shadow-inner ${isApplied ? 'border-emerald-500 text-emerald-600' : `${mc.border} ${mc.text}`}`}>
                          <span className="font-black text-base">{job.matchScore}%</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Match</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-lg font-bold", isApplied ? "text-emerald-700" : "text-foreground")}>{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mt-1 mb-2">
                        <span className="font-semibold text-primary">{job.company}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${job.type === 'Collaboration' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : job.type === 'Gig' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : job.type === 'DAO' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>{job.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1.5"><MapPin size={14} className="text-muted-foreground/60" /> Remote</div>
                        <div className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> <span className="font-semibold text-foreground">Min Score: {job.minScore}</span></div>
                        {requiredBalance > 0 && (
                          <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                            <span className="font-black">◈</span> <span className="font-black">{requiredBalance}+ CHOICE</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
                      {isApplied ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-2">
                          <CheckCircle size={14} /> Applied
                        </div>
                      ) : isJobLocked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                              <Lock size={14} /> Locked
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Unlock at score {requiredScore}+{requiredBalance > 0 ? ` and ◈ ${requiredBalance} CHOICE` : ''}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <ChoiceButton className="w-full md:w-auto" onClick={() => handleApply(job)}>
                          {!isConnected ? 'Connect to Apply' : 'Apply Now'}
                        </ChoiceButton>
                      )}
                      {identity && mr && !isApplied && (
                        <button onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide' : 'View'} Match Details
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded match details */}
                  {identity && mr && isExpanded && !isApplied && (
                    <div className="border-t border-white/10 px-5 py-6 bg-white/5 backdrop-blur-sm space-y-4">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Zap size={12} className="text-amber-500 mt-0.5 shrink-0" />
                        <span><strong className="text-foreground">AI Insight:</strong> {mr.reason}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {mr.matchingSkills.length > 0 && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2">
                              <CheckCircle size={12} /> Skills That Match
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mr.matchingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {mr.missingSkills.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
                              <AlertTriangle size={12} /> Skill Gaps
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mr.missingSkills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {mr.recommendations.length > 0 && (
                          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 mb-2">
                              <ArrowUpRight size={12} /> How to Improve
                            </div>
                            <ul className="space-y-1">
                              {mr.recommendations.map((r, i) => (
                                <li key={i} className="text-[11px] text-sky-700 flex items-start gap-1">
                                  <span className="mt-1 shrink-0">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Required:</span>
                          {job.requiredSkills.map((s, i) => {
                            const matched = mr.matchingSkills.includes(s);
                            return (
                              <span key={i} className={`px-2 py-0.5 rounded text-[11px] font-medium ${matched ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{s}</span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {visibleCount < jobs.length && (
              <div className="text-center pt-4">
                <ChoiceButton variant="outline" onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}>
                  Load More ({jobs.length - visibleCount} remaining)
                </ChoiceButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* Multi-Step Application Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {applyStep === 'sent' ? '✅ Application Sent!' : `Apply: ${selectedJob?.title}`}
            </DialogTitle>
            <DialogDescription>
              {applyStep === 'sent'
                ? `Your verified CHOICE ID profile has been sent to ${selectedJob?.company}.`
                : `${selectedJob?.company} · ${selectedJob?.type}`}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && applyStep === 'description' && (
            <div className="space-y-4 pt-2">
              {/* Job Description */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <h4 className="font-bold text-foreground text-sm mb-2">Job Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Match Score</span>
                  <p className="text-lg font-black text-foreground">{selectedJob.matchScore}%</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Your Trust Score</span>
                  <p className="text-lg font-black text-foreground">{score}/100</p>
                </div>
              </div>

              {selectedJob.requiredSkills.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Required Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedJob.requiredSkills.map((s, i) => {
                      const matched = selectedJob.matchResult?.matchingSkills?.includes(s);
                      return (
                        <span key={i} className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-medium',
                          matched ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                        )}>{s}</span>
                      );
                    })}
                  </div>
                </div>
              )}

              <ChoiceButton onClick={handleGenerateCV} isLoading={isGeneratingCV} className="w-full">
                <Sparkles size={14} className="mr-2" /> Generate CV & Continue
              </ChoiceButton>
            </div>
          )}

          {selectedJob && applyStep === 'optimize' && cv && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <h4 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Your CV Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{cv.summary}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {cv.skills.slice(0, 8).map((s, i) => (
                    <span key={i} className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">{s}</span>
                  ))}
                </div>
              </div>

              <ChoiceButton onClick={handleOptimize} isLoading={isOptimizing} className="w-full">
                <PenTool size={14} className="mr-2" /> Optimize for {selectedJob.title}
              </ChoiceButton>
            </div>
          )}

          {selectedJob && applyStep === 'coverLetter' && (
            <div className="space-y-4 pt-2">
              {optimizedCV && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="font-bold text-emerald-800 text-sm mb-1 flex items-center gap-2">
                    <CheckCircle size={14} /> CV Optimized
                  </h4>
                  <p className="text-xs text-emerald-700 line-clamp-2">{optimizedCV.summary}</p>
                </div>
              )}

              <ChoiceButton onClick={handleGenerateCoverLetter} isLoading={isGeneratingCover} className="w-full">
                <PenTool size={14} className="mr-2" /> Generate Cover Letter
              </ChoiceButton>
            </div>
          )}

          {selectedJob && applyStep === 'cvPreview' && (
            <div className="space-y-4 pt-2">
              {/* Cover Letter */}
              {coverLetter && (
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <h4 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                    <PenTool size={14} className="text-primary" /> Cover Letter
                  </h4>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{coverLetter}</pre>
                </div>
              )}

              {/* Full CV Preview */}
              {displayCV && (
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                    <Eye size={14} className="text-primary" /> Full CV Preview
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Summary</span>
                      <p className="text-xs text-foreground">{displayCV.summary}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {displayCV.skills.map((s, i) => (
                          <span key={i} className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">{s}</span>
                        ))}
                      </div>
                    </div>
                    {displayCV.experience.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Experience</span>
                        {displayCV.experience.map((exp, i) => (
                          <div key={i} className="mt-1">
                            <p className="text-xs font-bold text-foreground">{exp.role} at {exp.company}</p>
                            <p className="text-[10px] text-muted-foreground">{exp.duration}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {displayCV.education.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Education</span>
                        {displayCV.education.map((edu, i) => (
                          <div key={i} className="mt-1">
                            <p className="text-xs font-bold text-foreground">{edu.degree}</p>
                            <p className="text-[10px] text-muted-foreground">{edu.institution}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <ChoiceButton onClick={handleSendApplication} isLoading={isSendingApp} className="w-full">
                <Send size={14} className="mr-2" /> Send Application via CHOICE ID
              </ChoiceButton>
            </div>
          )}

          {applyStep === 'sent' && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle size={56} className="text-emerald-500 mx-auto" />
              <div>
                <p className="text-foreground font-bold text-lg">Application Successfully Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your verified credentials and cover letter have been shared with {selectedJob?.company}. You'll hear back if there's a match.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
                This job is now marked as applied in your dashboard.
              </div>
              <ChoiceButton variant="outline" onClick={() => setJobDialogOpen(false)} className="w-full">
                Close
              </ChoiceButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsPage;
