import React, { useState, useEffect } from 'react';

const schedule = [
  { id: 'ppt', title: 'PPT Making', start: '09:30', end: '10:00' },
  { id: 'judging', title: 'Judging', start: '10:00', end: '11:10' },
  { id: 'debugging', title: 'Debugging', start: '11:15', end: '11:45' }
];

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Demo offset allows testing the UI if viewed outside the schedule times
  const [demoOffset, setDemoOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Add the demoOffset to the current time so we can click to forward time
      setCurrentTime(new Date(Date.now() + demoOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [demoOffset]);

  // Fast forward by 30 minutes for demo purposes
  const addDemoTime = () => setDemoOffset(prev => prev + 30 * 60 * 1000);
  const resetDemoTime = () => setDemoOffset(0);

  const parseTime = (timeStr, baseDate) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  let activeIndex = -1;
  let nextIndex = 0;
  let status = 'upcoming'; // upcoming, active, break, ended
  let targetTime = null;
  let remainingMs = 0;
  let blockStart = null;
  let blockEnd = null;

  const now = currentTime.getTime();

  for (let i = 0; i < schedule.length; i++) {
    const start = parseTime(schedule[i].start, currentTime).getTime();
    const end = parseTime(schedule[i].end, currentTime).getTime();

    if (now >= start && now < end) {
      activeIndex = i;
      targetTime = end;
      remainingMs = end - now;
      status = 'active';
      blockStart = start;
      blockEnd = end;
      break;
    } else if (now < start) {
      nextIndex = i;
      targetTime = start;
      remainingMs = start - now;
      status = i === 0 ? 'upcoming' : 'break';
      activeIndex = i - 1;
      blockStart = now;
      blockEnd = start;
      break;
    }
  }

  const lastEnd = parseTime(schedule[schedule.length - 1].end, currentTime).getTime();
  if (now >= lastEnd) {
    status = 'ended';
    activeIndex = schedule.length;
    remainingMs = 0;
  }

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTimeAlert = remainingMs > 0 && remainingMs <= 2 * 60 * 1000 && status === 'active';

  const getTimerLabel = () => {
    if (status === 'upcoming') return `STARTING SOON: ${schedule[0].title.toUpperCase()}`;
    if (status === 'active') return `${schedule[activeIndex].title.toUpperCase()} IN PROGRESS`;
    if (status === 'break') return `INTERMISSION: UP NEXT ${schedule[nextIndex].title.toUpperCase()}`;
    if (status === 'ended') return 'EVENT CONCLUDED';
    return '';
  };

  const calculateOverallProgress = () => {
    if (status === 'upcoming') return 0;
    if (status === 'ended') return 100;

    const maxMilestones = schedule.length - 1;
    const baseProgress = Math.max(0, activeIndex) * (100 / maxMilestones);

    if (status === 'active' && blockStart && blockEnd) {
      const segmentProgress = ((now - blockStart) / (blockEnd - blockStart)) * (100 / maxMilestones);
      return Math.min(100, baseProgress + segmentProgress);
    }
    return Math.min(100, baseProgress);
  };

  const overallProgressWidth = calculateOverallProgress();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative z-0 bg-black font-mono">
      <div className="bg-mesh"></div>

      {/* Demo Controls (Invisible until hover or small dev tools) */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-10 hover:opacity-100 transition-opacity z-50">
        <button onClick={resetDemoTime} className="bg-white/10 text-xs px-3 py-1 text-white border border-white/20 rounded hover:bg-white/20">Reset Time</button>
        <button onClick={addDemoTime} className="bg-white/10 text-xs px-3 py-1 text-white border border-white/20 rounded hover:bg-white/20">+30m</button>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-16 items-center">

        {/* Milestone Bar */}
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] relative pt-12 mt-10">

          <div className="absolute top-6 left-16 right-16 h-1 z-0 -translate-y-[2px]">
            <div className="w-full h-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                style={{ width: `${overallProgressWidth}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between relative z-10 w-full -mt-6">
            {schedule.map((milestone, i) => {
              const baseCompleted = status === 'ended' || (status === 'active' ? i < activeIndex : i <= activeIndex);
              const isCurrent = i === activeIndex && status === 'active';

              return (
                <div key={milestone.id} className="relative flex flex-col items-center gap-4 w-32 border-none">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative bg-black
                    ${baseCompleted ? 'border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' :
                      isCurrent ? 'border-purple-500 text-purple-400' :
                        'border-white/20 text-white/50'}`
                  }>
                    {baseCompleted ? (
                      <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <span className="font-bold text-lg">{i + 1}</span>
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.8)] animate-pulse" />
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className={`text-sm font-bold tracking-wider transition-colors duration-300 ${baseCompleted ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' :
                        isCurrent ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' :
                          'text-white/40'
                      }`}>
                      {milestone.title}
                    </div>
                    <div className={`text-xs mt-1 tracking-wider ${isCurrent ? 'text-white/60' : 'text-white/30'}`}>
                      {milestone.start} - {milestone.end}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* The Main Timer Card */}
        <div className="relative group w-full sm:w-auto">
          <div className={`absolute -inset-1 rounded-3xl blur-2xl opacity-40 transition-all duration-1000 z-0
            ${isLowTimeAlert ? 'bg-red-600 animate-pulse' :
              status === 'active' ? 'bg-gradient-to-r from-blue-600 to-purple-600 group-hover:opacity-70 group-hover:duration-200' :
                'bg-white/10'}`}
          ></div>

          <div className="relative z-10 bg-black/50 backdrop-blur-2xl border border-white/10 p-10 sm:p-20 rounded-3xl flex flex-col items-center justify-center gap-8 shadow-2xl">
            <h2 className={`uppercase tracking-[0.2em] text-sm sm:text-xl font-medium transition-colors duration-500 text-center
              ${isLowTimeAlert ? 'text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]'}`}>
              {getTimerLabel()}
            </h2>

            <div className={`text-6xl sm:text-8xl md:text-[9rem] font-bold tracking-tight transition-all duration-1000 select-none tabular-nums
              ${isLowTimeAlert ? 'text-red-500 text-glow-red scale-[1.02]' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]'}`}>
              {status === 'ended' ? '00:00' : formatTime(remainingMs)}
            </div>

            {status !== 'ended' && status !== 'upcoming' && blockStart && blockEnd && (
              <div className="w-full max-w-xs flex flex-col items-center mt-2 gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ease-linear ${isLowTimeAlert ? 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'}`}
                    style={{ width: `${((now - blockStart) / (blockEnd - blockStart)) * 100}%` }}
                  />
                </div>
                {status === 'active' && (
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Section Progress</div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
