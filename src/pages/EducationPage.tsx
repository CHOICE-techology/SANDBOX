import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Award, CheckCircle, Lock, PlayCircle, Star } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { COURSES } from '@/data/coursesData';

const EducationPage: React.FC = () => {
  const { userIdentity: identity } = useWallet();
  const navigate = useNavigate();

  const hasBadge = (courseTitle: string) => {
    return identity?.credentials.some(vc => vc.type.includes('EducationCredential') && vc.credentialSubject.courseName === courseTitle);
  };

  const totalPoints = COURSES.reduce((sum, c) => sum + c.points, 0);
  const earnedPoints = COURSES.filter(c => hasBadge(c.title)).reduce((sum, c) => sum + c.points, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">Education Center</h1>
          <p className="text-muted-foreground text-base md:text-lg">Earn badges and boost your Trust Score by mastering Web3 skills.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-5 py-3 text-center">
          <span className="block text-2xl font-extrabold text-primary">{earnedPoints}/{totalPoints}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Points Earned</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES.map((course) => {
          const isCompleted = hasBadge(course.title);
          return (
            <div key={course.id} className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-full h-2 ${course.color}`}></div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-muted text-muted-foreground">{course.level}</span>
                {isCompleted ? (
                  <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full"><CheckCircle size={20} /></div>
                ) : (
                  <div className="bg-muted text-muted-foreground/30 p-1.5 rounded-full"><Lock size={20} /></div>
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{course.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-medium">
                <PlayCircle size={14} /> {course.duration}
                <span className="mx-1">•</span>
                <Star size={14} className="text-amber-400 fill-amber-400" /> +{course.points} Points
              </div>
              <div className="text-xs text-muted-foreground mb-6">
                {course.lessons.length} lesson{course.lessons.length > 1 ? 's' : ''} with quizzes
              </div>
              <ChoiceButton
                onClick={() => navigate(`/education/${course.id}`)}
                disabled={!identity}
                variant={isCompleted ? "outline" : "primary"}
                className="w-full"
              >
                {isCompleted ? "Review Course" : "Start Lesson"}
              </ChoiceButton>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-6 md:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Award size={32} className="text-amber-300" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Gamified Reputation</h2>
          </div>
          <p className="text-white/90 text-lg leading-relaxed mb-6">
            Every badge you earn is a Verifiable Credential stored in your wallet. Complete all {COURSES.length} courses to maximize your Trust Score.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
              <span className="block text-2xl font-bold text-white">30%</span>
              <span className="text-xs uppercase tracking-wider text-white/80">Score Weight</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
              <span className="block text-2xl font-bold text-white">{COURSES.length}</span>
              <span className="text-xs uppercase tracking-wider text-white/80">Courses</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
              <span className="block text-2xl font-bold text-white">{totalPoints}</span>
              <span className="text-xs uppercase tracking-wider text-white/80">Total Points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationPage;
