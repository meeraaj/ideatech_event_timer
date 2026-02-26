import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, MapPin, Users, AlertTriangle, ExternalLink } from 'lucide-react';

const schedule = [
  { id: 'ppt', title: 'PPT Making', start: '09:30', end: '10:00' },
  { id: 'judging', title: 'Judging', start: '10:00', end: '11:10' },
  { id: 'debugging', title: 'Debugging', start: '11:15', end: '11:45' }
];

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [demoOffset, setDemoOffset] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted) return;

    // Initial sync
    setCurrentTime(new Date(Date.now() + demoOffset));

    const timer = setInterval(() => {
      setCurrentTime(new Date(Date.now() + demoOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [demoOffset, isStarted]);

  const addDemoTime = () => setDemoOffset(prev => prev + 30 * 60 * 1000);

  const resetDemoTime = () => {
    const startTime = parseTime(schedule[0].start, new Date()).getTime();
    const nowReal = Date.now();
    setDemoOffset(startTime - nowReal);
  };

  const parseTime = (timeStr, baseDate) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const now = currentTime.getTime();

  let activeIndex = -1;
  let nextIndex = 0;
  let status = 'upcoming'; // upcoming, active, break, ended
  let targetTime = null;
  let remainingMs = 0;
  let blockStart = null;
  let blockEnd = null;

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
      blockStart = i === 0 ? null : parseTime(schedule[i - 1].end, currentTime).getTime();
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

  const getTimeComponents = (ms) => {
    if (ms <= 0) return { h: '00', m: '00', s: '00' };
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  const isLowTimeAlert = remainingMs > 0 && remainingMs <= 5 * 60 * 1000 && status === 'active';

  const getTimerSublabel = () => {
    if (!isStarted) return "EVENT STARTS IN";
    if (status === 'upcoming') return "EVENT STARTS IN";
    if (status === 'active') return "SESSION ENDS IN";
    if (status === 'break') return "NEXT SESSION IN";
    if (status === 'ended') return "EVENT CONCLUDED";
    return "";
  };

  const getActiveTitle = () => {
    if (!isStarted) return "START LINE";
    if (status === 'upcoming') return schedule[0].title;
    if (status === 'active') return schedule[activeIndex].title;
    if (status === 'break') return `BREAK: ${schedule[nextIndex].title} NEXT`;
    if (status === 'ended') return "FINISH LINE";
    return "";
  };

  const skipToLowTime = () => {
    const sessionEnd = parseTime(schedule[0].end, new Date()).getTime();
    const nowReal = Date.now();
    // Set offset so there's only 1 minute remaining in the first session
    setDemoOffset(sessionEnd - nowReal - (60 * 1000));
    setIsStarted(true);
  };

  const calculateOverallProgress = () => {
    if (!isStarted) return 0;
    if (status === 'upcoming') return 0;
    if (status === 'ended') return 100;

    const t0 = parseTime(schedule[0].start, currentTime).getTime();
    const t1 = parseTime(schedule[1].start, currentTime).getTime();
    const t2 = parseTime(schedule[2].start, currentTime).getTime();
    const tEnd = parseTime(schedule[2].end, currentTime).getTime();

    // Map time into 2 segments
    if (now < t1) {
      const segmentTime = t1 - t0;
      const elapsed = Math.max(0, now - t0);
      return (elapsed / segmentTime) * 50;
    } else {
      const segmentTime = tEnd - t1;
      const elapsed = Math.max(0, now - t1);
      return 50 + (elapsed / segmentTime) * 50;
    }
  };

  const progress = calculateOverallProgress();
  const time = getTimeComponents(remainingMs);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none"></div>

      <div className="w-full max-w-5xl flex flex-col items-center z-10">

        {/* Horizontal Timeline Bar */}
        <div className="w-full max-w-5xl relative mb-36 px-12">
          {/* Track (Strictly Transparent Background) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-12 right-12 h-1 bg-transparent rounded-full overflow-visible">
            <motion.div
              className="h-full bg-[#5EEAD4] shadow-[0_0_15px_rgba(94,234,212,1)] rounded-full relative"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.5 }}
            >
              {/* Tip Glow */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#5EEAD4] rounded-full blur-md opacity-50" />
            </motion.div>
          </div>

          {/* Nodes & Labels */}
          <div className="flex justify-between relative w-full">
            {schedule.map((item, i) => {
              const isCompleted = isStarted && (status === 'ended' || (status === 'active' ? i < activeIndex : i <= activeIndex));
              const isActive = isStarted && ((i === activeIndex && status === 'active') || (status === 'break' && i === nextIndex));

              return (
                <div key={item.id} className="flex flex-col items-center">
                  {/* Node Circle */}
                  <div className="relative mb-6">
                    <motion.div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-full border z-20 flex items-center justify-center transition-all duration-500 relative
                        ${isCompleted ? 'bg-[#5EEAD4] border-[#5EEAD4] text-[#0b0f10] shadow-[0_0_20px_rgba(94,234,212,0.6)]' :
                          isActive ? 'active-round bg-[#0b0f10] text-[#5EEAD4]' :
                            'bg-[#0b0f10] border-white/10 text-white/10'}`}
                    >
                      {isCompleted ? <Check size={28} strokeWidth={4} /> : <span className="text-sm font-black">{i + 1}</span>}
                    </motion.div>
                  </div>

                  {/* Labels (Now in flow, not absolute) */}
                  <div className="flex flex-col items-center text-center">
                    <span className={`text-[10px] md:text-xs font-black tracking-[0.2em] uppercase mb-1.5
                      ${isCompleted ? 'text-[#5EEAD4]' : isActive ? 'text-[#5EEAD4]' : 'text-white/20'}`}>
                      {item.title}
                    </span>
                    <span className="text-[9px] md:text-[10px] text-white/10 tracking-widest font-bold">
                      {item.start} - {item.end}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Header */}
        <motion.div
          key={getTimerSublabel()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-[#5EEAD4] text-xs md:text-sm tracking-[0.4em] font-bold uppercase drop-shadow-[0_0_10px_rgba(94,234,212,0.3)]">
            {getTimerSublabel()}
          </h2>
        </motion.div>

        {/* Main Countdown Display */}
        <div className="flex items-center gap-6 md:gap-12 mb-20 justify-center w-full">
          {/* Hours Tile */}
          <div className="flex flex-col items-center">
            <motion.div
              layout
              className={`timer-card ${isLowTimeAlert ? '!border-red-500/50 !shadow-[0_0_25px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <span className={`timer-number ${isLowTimeAlert ? '!text-red-500 !shadow-[0_0_15px_rgba(239,68,68,0.4)]' : ''}`}>
                {time.h}
              </span>
              {isLowTimeAlert && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 bg-red-500/20"
                />
              )}
            </motion.div>
            <span className="timer-label">HOURS</span>
          </div>

          <div className="text-2xl md:text-5xl text-[#6EC1C3]/30 font-bold mb-10">:</div>

          {/* Minutes Tile */}
          <div className="flex flex-col items-center">
            <motion.div
              layout
              className={`timer-card ${isLowTimeAlert ? '!border-red-500/50 !shadow-[0_0_25px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <span className={`timer-number ${isLowTimeAlert ? '!text-red-500 !shadow-[0_0_15px_rgba(239,68,68,0.4)]' : ''}`}>
                {time.m}
              </span>
              {isLowTimeAlert && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 bg-red-500/20"
                />
              )}
            </motion.div>
            <span className="timer-label">MINUTES</span>
          </div>

          <div className="text-2xl md:text-5xl text-[#6EC1C3]/30 font-bold mb-10">:</div>

          {/* Seconds Tile */}
          <div className="flex flex-col items-center">
            <motion.div
              layout
              className={`timer-card ${isLowTimeAlert ? '!border-red-500/50 !shadow-[0_0_25px_rgba(239,68,68,0.3)]' : ''}`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={time.s}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`timer-number ${isLowTimeAlert ? '!text-red-500 !shadow-[0_0_15px_rgba(239,68,68,0.4)]' : ''}`}
                >
                  {time.s}
                </motion.span>
              </AnimatePresence>
              {isLowTimeAlert && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 bg-red-500/20"
                />
              )}
            </motion.div>
            <span className="timer-label">SECONDS</span>
          </div>
        </div>

        {/* Alerts / Info Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {isLowTimeAlert && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold tracking-widest uppercase"
            >
              <AlertTriangle size={12} className="animate-pulse" />
              CRITICAL: SESSION ENDING
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[12px] font-bold tracking-[0.15em] text-white/70">
            <Clock size={14} className="text-[#5EEAD4]" />
            {getActiveTitle()}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* START / PAUSE Button */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: isStarted ? '#f87171' : '#78fbda' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!isStarted && status === 'ended') {
                resetDemoTime();
              }
              setIsStarted(!isStarted);
            }}
            className={`px-16 py-4 font-black text-sm md:text-base tracking-[0.4em] rounded-full flex items-center justify-center uppercase transition-colors duration-300 shadow-[0_10px_40px_rgba(94,234,212,0.4)]
              ${isStarted ? 'bg-white/10 text-white/40 border border-white/5 shadow-none' : 'bg-[#5EEAD4] text-black'}`}
          >
            {isStarted ? 'PAUSE' : 'START'}
          </motion.button>

          {/* Verification Button (DEBUG) */}
          {!isStarted && (
            <button
              onClick={skipToLowTime}
              className="text-[10px] text-white/10 hover:text-[#5EEAD4]/40 transition-colors uppercase tracking-[0.3em] font-bold"
            >
              Verify Alert Mode
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
