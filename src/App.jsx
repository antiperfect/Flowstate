import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  BarChart2, 
  X, 
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  CloudSun, 
  Sunset as SunsetIcon,
  Waves,
  Github,
  Instagram
} from 'lucide-react';

// --- Constants & Styles ---

const PRIORITIES = {
  HIGH: { 
    id: 'high', 
    label: 'High', 
    color: 'from-pink-600 to-rose-500', 
    shadow: 'shadow-rose-500/20',
    text: 'text-rose-200',
    dot: 'bg-rose-500',
    glow: 'shadow-[0_0_10px_rgba(244,63,94,0.6)]',
    blobColors: ['bg-rose-600', 'bg-pink-600', 'bg-red-500']
  },
  MEDIUM: { 
    id: 'medium', 
    label: 'Medium', 
    color: 'from-amber-500 to-orange-500', 
    shadow: 'shadow-orange-500/20',
    text: 'text-amber-200',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.6)]',
    blobColors: ['bg-amber-500', 'bg-orange-600', 'bg-yellow-500']
  },
  LOW: { 
    id: 'low', 
    label: 'Low', 
    color: 'from-emerald-500 to-teal-500', 
    shadow: 'shadow-emerald-500/20',
    text: 'text-emerald-200',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.6)]',
    blobColors: ['bg-emerald-600', 'bg-teal-500', 'bg-green-500']
  },
};

const DEFAULT_TIME = 25 * 60;

// Animation Styles
const styles = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.2); }
    66% { transform: translate(-20px, 20px) scale(0.8); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob { animation: blob 8s infinite ease-in-out; }
  .animation-delay-2000 { animation-delay: 2s; }
  .animation-delay-4000 { animation-delay: 4s; }
  
  @keyframes slideIn {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100%); opacity: 0; }
  }
  .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-slideOut { animation: slideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  @keyframes flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-flow {
    background-size: 200% auto;
    animation: flow 4s linear infinite;
  }

  /* Hide scrollbar for cleaner look */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  /* Hide native time picker indicator */
  input[type="time"]::-webkit-calendar-picker-indicator {
    display: none;
  }
  
  /* Custom Range Slider Styling */
  input[type=range] {
    -webkit-appearance: none; 
    background: transparent; 
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 32px;
    width: 32px;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    margin-top: -14px; 
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    border-radius: 999px;
  }
`;

// --- Helpers ---

// Robust way to get local YYYY-MM-DD to avoid UTC timezone issues
const getLocalISODate = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLast7Days = () => {
  return [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return getLocalISODate(d);
  });
};

const getDayName = (dateStr) => {
  // Extract just the date part in case it has time
  const cleanDate = dateStr.split('T')[0];
  const date = new Date(`${cleanDate}T00:00:00`); 
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// --- Sound Hook (Web Audio API) ---
const useSound = () => {
  const audioContext = useRef(null);

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    return audioContext.current;
  };

  const playOscillator = (freq, type, duration, vol = 0.1, delay = 0) => {
    const ctx = initAudio();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  };

  return {
    playClick: () => playOscillator(800, 'sine', 0.05, 0.05),
    playAdd: () => playOscillator(600, 'sine', 0.1, 0.05),
    playSuccess: () => {
      // Major triad chime
      playOscillator(523.25, 'sine', 0.3, 0.05, 0);    // C5
      playOscillator(659.25, 'sine', 0.3, 0.05, 0.1);  // E5
      playOscillator(783.99, 'sine', 0.6, 0.05, 0.2);  // G5
    },
    playDelete: () => {
      playOscillator(150, 'sawtooth', 0.1, 0.05);
      playOscillator(100, 'sawtooth', 0.15, 0.05, 0.1);
    },
    playStart: () => {
      playOscillator(440, 'triangle', 0.1, 0.05);
      playOscillator(880, 'triangle', 0.2, 0.05, 0.1);
    },
    playPause: () => {
      playOscillator(880, 'triangle', 0.1, 0.05);
      playOscillator(440, 'triangle', 0.2, 0.05, 0.1);
    },
    playTick: () => {
      // Subtle woodblock-like tick
      playOscillator(1000, 'sine', 0.03, 0.02);
    },
    playAlarm: () => {
      // Triple beep
      [0, 0.4, 0.8].forEach(t => {
        playOscillator(880, 'square', 0.15, 0.03, t);
        playOscillator(1100, 'square', 0.15, 0.03, t);
      });
    }
  };
};

// --- Sub-Components ---

const ScrollDigit = ({ digit }) => {
  const [prev, setPrev] = useState(digit);
  const [curr, setCurr] = useState(digit);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (digit !== curr) {
      setPrev(curr);
      setCurr(digit);
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 400); 
      return () => clearTimeout(t);
    }
  }, [digit, curr]);

  return (
    <div className="relative inline-block overflow-hidden h-[1em] w-[1ch] align-top">
      <span className="invisible">{curr}</span>
      {animate && (
        <div key={`${prev}-out`} className="absolute inset-0 animate-slideOut flex justify-center text-center">
          {prev}
        </div>
      )}
      <div 
        key={`${curr}-in`} 
        className={`absolute inset-0 flex justify-center text-center ${animate ? 'animate-slideIn' : ''}`}
      >
        {curr}
      </div>
    </div>
  );
};

const ScrollCounter = ({ value }) => {
  const digits = value.toString().padStart(2, '0').split('');
  return (
    <div className="flex">
      {digits.map((d, i) => (
        <ScrollDigit key={i} digit={d} />
      ))}
    </div>
  );
};

// 1. The Background with moving liquid blobs
const LiquidBackground = () => (
  <div className="fixed inset-0 overflow-hidden bg-slate-900 -z-10">
    <div className="absolute top-0 left-0 w-full h-full bg-[#0f0518] opacity-90"></div>
    {/* Animated Blobs */}
    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
    <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>
  </div>
);

// 2. Custom Bar Chart
const StatsChart = ({ history }) => {
  const historyMap = useMemo(() => {
    const map = {};
    history.forEach(h => map[h.date] = h.count);
    return map;
  }, [history]);

  const days = getLast7Days();
  const rawMax = Math.max(...days.map(d => historyMap[d] || 0), 5); 
  // Round up to nearest 5 for the scale
  const maxScale = Math.ceil(rawMax / 5) * 5;
  
  // Generate ticks [0, 5, 10... maxScale]
  const ticks = [];
  for (let i = 0; i <= maxScale; i += 5) {
    ticks.push(i);
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 w-full text-white shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
          <BarChart2 size={20} />
        </div>
        <h3 className="font-bold text-lg tracking-wide text-slate-200">Activity</h3>
      </div>
      
      <div className="relative h-48 w-full">
        {/* Grid Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 pl-8">
           {ticks.slice().reverse().map((tick) => (
             <div key={tick} className="flex items-center w-full relative">
                <span className="absolute -left-8 text-[10px] text-slate-500 font-medium w-6 text-right transform -translate-y-1/2">
                  {tick}
                </span>
                <div className="w-full h-[1px] bg-white/5"></div>
             </div>
           ))}
        </div>

        {/* Data Points */}
        <div className="relative h-full flex items-end pl-8 pb-6">
          {days.map((day, idx) => {
            const count = historyMap[day] || 0;
            const heightPercent = (count / maxScale) * 100;
            const isToday = day === getLocalISODate();
            
            return (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                {/* Tooltip */}
                <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap z-30 shadow-xl pointer-events-none -translate-y-full">
                  {count} Tasks
                </div>

                {/* The Dot Area - Absolute positioning within the column */}
                <div className="w-full h-full relative">
                    {/* Faint connecting line for better readability (Optional) */}
                    <div 
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 transition-all duration-500`} 
                        style={{ height: `${heightPercent}%` }}
                    ></div>

                    {/* The Dot */}
                    <div 
                      className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#1a1025] transition-all duration-500 z-10
                        ${isToday 
                          ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-125' 
                          : 'bg-slate-500 group-hover:bg-slate-300'
                        }`}
                      style={{ bottom: `calc(${heightPercent}% - 6px)` }}
                    ></div>
                </div>

                {/* Date Label */}
                <div className="absolute -bottom-6 w-full text-center">
                    <span className={`text-[10px] font-medium tracking-wider uppercase ${isToday ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {getDayName(day)}
                    </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. Custom Date Picker Component with Circular Time Slider
const CustomDatePicker = ({ selectedDate, onChange, onClose }) => {
  // Parse incoming date string (which might contain time)
  const [initialDate, initialTime] = (selectedDate || '').split('T');
  
  // State for Date view (Year/Month navigation)
  const [viewDate, setViewDate] = useState(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });

  // State for selected time (default to 09:00 if not set)
  const [time, setTime] = useState(initialTime || '09:00');
  
  // Dragging state for the circle
  const [isDragging, setIsDragging] = useState(false);
  const circleRef = useRef(null);

  // Refs for stale closure prevention during event listeners
  const timeRef = useRef(time);
  const dateRef = useRef(initialDate || getLocalISODate());

  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => { dateRef.current = initialDate || getLocalISODate(); }, [initialDate]);

  // Helper: Get minutes from time string "14:30" -> 870
  const getMinutesFromTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper: Get time string from minutes 870 -> "14:30"
  const getTimeFromMinutes = (mins) => {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    // Normalize to 0-23 hours
    h = h % 24;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Helper: Get 12-hour format parts
  const get12HourParts = (t) => {
    const [hStr, mStr] = t.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const amPm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 should be 12
    return { h, m, amPm };
  };

  // Helper: Get theme data for icon styling based on minutes
  const getTimeTheme = (mins) => {
    // Night (0-5am)
    if (mins < 300) return { 
      Icon: Moon,
      iconColor: 'text-indigo-300', 
      glow: 'drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]',
      scale: 'scale-90'
    };
    // Sunrise (5-8am)
    if (mins < 480) return { 
      Icon: CloudSun, // Use CloudSun for Sunrise visual
      iconColor: 'text-orange-300', 
      glow: 'drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]',
      scale: 'scale-100'
    };
    // Morning (8-11am) - Normal Sun
    if (mins < 660) return { 
      Icon: Sun,
      iconColor: 'text-yellow-200', 
      glow: 'drop-shadow-[0_0_15px_rgba(253,224,71,0.7)]',
      scale: 'scale-95'
    };
    // Noon (11am-3pm) - Full Sun
    if (mins < 900) return { 
      Icon: Sun,
      iconColor: 'text-amber-100', 
      glow: 'drop-shadow-[0_0_25px_rgba(253,186,116,1)]',
      scale: 'scale-125'
    };
    // Afternoon (3-6pm) - Normal Sun
    if (mins < 1080) return { 
      Icon: Sun,
      iconColor: 'text-orange-200', 
      glow: 'drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]',
      scale: 'scale-100'
    };
    // Sunset (6-8pm)
    if (mins < 1200) return { 
      Icon: SunsetIcon, 
      iconColor: 'text-pink-300', 
      glow: 'drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]',
      scale: 'scale-100'
    };
    // Night (8pm-12am)
    return { 
      Icon: Moon,
      iconColor: 'text-indigo-300', 
      glow: 'drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]',
      scale: 'scale-90'
    };
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = getLocalISODate();

  const updateDate = (datePart, timePart) => {
    if (!datePart) return;
    const combined = `${datePart}T${timePart}`;
    onChange(combined);
  };

  const handleDayClick = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const isoDate = `${year}-${m}-${d}`;
    updateDate(isoDate, time);
  };

  const handleQuickOption = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const isoDate = getLocalISODate(d);
    setViewDate(new Date(isoDate));
    updateDate(isoDate, time);
  };

  // Circular Slider Interaction
  const handleCircleInteraction = (e) => {
    if (!circleRef.current) return;
    const rect = circleRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - cx;
    const deltaY = clientY - cy;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const mins = Math.round((angle / 360) * 1440) % 1440;
    const newTime = getTimeFromMinutes(mins);
    
    // Use the ref for date to ensure we have the latest without re-binding listeners
    const combined = `${dateRef.current}T${newTime}`;
    
    setTime(newTime);
    onChange(combined);
  };

  // Global mouse up listeners to stop dragging outside component
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    const handleMove = (e) => {
      if (isDragging) {
        e.preventDefault(); // Prevent scrolling on touch
        handleCircleInteraction(e);
      }
    };

    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [isDragging]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calculate stats for render
  const totalMins = getMinutesFromTime(time);
  const theme = getTimeTheme(totalMins);
  const IconComponent = theme.Icon;
  const { h: displayHours, m: displayMinutes, amPm } = get12HourParts(time);
  
  // Calculate angle for visual (0-360 where 0 is top)
  const visualAngle = (totalMins / 1440) * 360;

  return (
    <div className="absolute top-full right-0 mt-4 bg-[#1a1025] border border-white/10 rounded-3xl shadow-2xl p-8 z-50 w-96 animate-slideIn backdrop-blur-3xl">
      
      {/* Quick Options */}
      <div className="flex gap-2 mb-6">
        <button 
          type="button" 
          onClick={() => handleQuickOption(0)}
          className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-xl text-xs font-bold text-slate-300 transition-colors border border-white/5 uppercase tracking-wider"
        >
          Today
        </button>
        <button 
          type="button" 
          onClick={() => handleQuickOption(1)}
          className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-xl text-xs font-bold text-slate-300 transition-colors border border-white/5 uppercase tracking-wider"
        >
          Tomorrow
        </button>
      </div>

      {/* Date Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-bold text-slate-200">
          {monthNames[month]} {year}
        </div>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const m = String(month + 1).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          const dateStr = `${year}-${m}-${d}`;
          const isSelected = initialDate === dateStr;
          const isToday = today === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`
                h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-200
                ${isSelected 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                  : 'text-slate-300 hover:bg-white/10'
                }
                ${!isSelected && isToday ? 'border border-purple-500/50 text-purple-200' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Circular Time Slider */}
      <div className="relative w-56 h-56 mx-auto mb-6 mt-10 select-none" ref={circleRef}
           onMouseDown={(e) => { setIsDragging(true); handleCircleInteraction(e); }}
           onTouchStart={(e) => { setIsDragging(true); handleCircleInteraction(e); }}
      >
        {/* Track Background - Original Halo Style */}
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,theme(colors.indigo.900),theme(colors.orange.400),theme(colors.sky.400),theme(colors.pink.500),theme(colors.indigo.900))] opacity-30 blur-md pointer-events-none"></div>
        <div className="absolute inset-0 rounded-full border-4 border-white/5 pointer-events-none"></div>
        
        {/* Center Content: Digital Time Input with Waterfall Animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
           <div className="flex items-baseline justify-center gap-0.5 text-5xl font-mono font-bold text-white tracking-tighter filter drop-shadow-lg">
              <ScrollCounter value={displayHours} />
              <span className="text-white/50 text-3xl mx-0.5 relative -top-1">:</span>
              <ScrollCounter value={displayMinutes} />
           </div>
           <span className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mt-3">
              {amPm}
           </span>
        </div>

        {/* Thumb Icon Container (Rotates) */}
        <div 
           className="absolute top-0 left-0 w-full h-full pointer-events-none"
           style={{ transform: `rotate(${visualAngle}deg)` }}
        >
           {/* The Icon itself (Counter-rotated to stay upright) */}
           <div 
             className="absolute top-0 left-1/2 -translate-x-1/2 -mt-5 w-10 h-10 flex items-center justify-center z-10"
           >
              <div 
                className={`transition-all duration-500 ${theme.iconColor} ${theme.glow} ${theme.scale}`}
                style={{ transform: `rotate(-${visualAngle}deg)` }}
              >
                 <IconComponent size={32} fill="currentColor" />
              </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-center">
        <button 
          type="button" 
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Seamless Priority Slider (Dots <-> Slider)
const PrioritySelector = ({ value, onChange, onInteract }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const keys = Object.keys(PRIORITIES);
  const currentIndex = keys.indexOf(value);

  const activeGradient = PRIORITIES[value].color;

  const handleInteraction = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    
    // Calculate index based on 3 sections
    const sectionWidth = width / 3;
    let newIndex = Math.floor(x / sectionWidth);
    
    // Clamp to valid range
    newIndex = Math.max(0, Math.min(newIndex, 2));
    
    const newKey = keys[newIndex];
    if (newKey !== value) {
      onChange(newKey);
      onInteract();
    }
  };

  const handlePointerDown = (e) => {
    if (!isHovered && !isDragging) {
        // If clicked while collapsed, just expand first
        setIsHovered(true);
        return;
    }
    
    setIsDragging(true);
    e.preventDefault(); // Prevent text selection/scroll
    handleInteraction(e.clientX || (e.touches && e.touches[0].clientX));
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleInteraction(e.clientX || (e.touches && e.touches[0].clientX));
      }
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, value]); 

  const expanded = isHovered || isDragging;

  return (
    <div
      ref={containerRef}
      className={`
        relative flex items-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] p-1 h-9 select-none touch-none
        ${expanded
          ? 'bg-white/5 rounded-full border border-white/10 w-64 cursor-grab active:cursor-grabbing' 
          : 'w-24 justify-center bg-transparent border-transparent gap-3 cursor-pointer'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
    >
      {/* Sliding "Liquid" Background */}
      {expanded && (
        <div
          className={`absolute top-1 bottom-1 rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-gradient-to-r ${activeGradient}`}
          style={{
            // Adjusted calculation for perfect centering
            width: 'calc(33.33% - 6px)', 
            left: `calc(3px + ${currentIndex * 33.33}%)`,
            // Removed manual translate adjustment that was causing the offset
          }}
        >
            <div className="absolute inset-0 bg-white/20 rounded-full opacity-50 mix-blend-overlay"></div>
        </div>
      )}

      {/* Labels / Dots */}
      {keys.map((key) => {
        const p = PRIORITIES[key];
        const isSelected = value === key;

        if (!expanded) {
           return (
            <div
              key={key}
              className={`
                rounded-full transition-all duration-500
                ${isSelected
                  ? `w-3 h-3 ${p.dot} ${p.glow} scale-110` 
                  : 'w-2 h-2 bg-white/20'
                }
              `}
            />
          );
        }

        return (
          <div
            key={key}
            className={`
              flex-1 relative z-10 text-[10px] font-bold uppercase tracking-wider py-1.5 text-center transition-colors duration-300 pointer-events-none
              ${isSelected ? 'text-white' : 'text-slate-400'}
            `}
          >
            {p.label}
          </div>
        );
      })}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  // --- Sound Init ---
  const { playClick, playAdd, playSuccess, playDelete, playStart, playPause, playAlarm, playTick } = useSound();

  // --- State ---
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('todo_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('todo_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState(''); 
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [targetDuration, setTargetDuration] = useState(DEFAULT_TIME);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Custom Timer State
  const [showCustomDurationInput, setShowCustomDurationInput] = useState(false);
  const [customDuration, setCustomDuration] = useState('');

  const timerRef = useRef(null);

  // --- Effects ---
  useEffect(() => { localStorage.setItem('todo_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('todo_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
        playTick();
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      clearInterval(timerRef.current);
      playAlarm(); // Play alarm when timer hits 0
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timerSeconds]);

  // Reset custom input view when timer starts
  useEffect(() => {
    if (isTimerRunning) {
      setShowCustomDurationInput(false);
    }
  }, [isTimerRunning]);

  // --- Helpers ---
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const [datePart, timePart] = dateStr.split('T');
    
    // Check if today
    const today = getLocalISODate();
    const label = datePart === today ? 'Today' : new Date(datePart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    // Append time if exists
    if (timePart) {
      return `${label} • ${timePart}`;
    }
    return label;
  };

  // Compare just the date part for overdue status
  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const datePart = dateStr.split('T')[0];
    return datePart < getLocalISODate();
  };

  // --- Actions ---
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    playAdd(); // Sound effect
    
    const task = {
      id: Date.now().toString(),
      text: newTask,
      priority: newPriority,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: newDueDate || null,
    };
    setTasks([task, ...tasks]);
    setNewTask('');
    setNewDueDate('');
    setShowDatePicker(false);
  };

  const toggleComplete = (id) => {
    // 1. Determine if we are completing or un-completing
    // We check the *current* state of the task
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;
    
    const isCompleting = !taskToToggle.completed;
    
    if (isCompleting) playSuccess();
    else playClick();

    // 2. Update Tasks State
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));

    // 3. Update History State RELIABLY using functional updates
    setHistory(prevHistory => {
      const today = getLocalISODate();
      const existingIndex = prevHistory.findIndex(h => h.date === today);
      let newHistory = [...prevHistory];

      if (isCompleting) {
        if (existingIndex >= 0) {
          // Increment existing day
          newHistory[existingIndex] = { 
            ...newHistory[existingIndex], 
            count: newHistory[existingIndex].count + 1 
          };
        } else {
          // New day entry
          newHistory.push({ date: today, count: 1 });
          // Limit history size
          if (newHistory.length > 30) newHistory.shift();
        }
      } else {
        // Decrementing (Un-complete)
        if (existingIndex >= 0) {
          const newCount = Math.max(0, newHistory[existingIndex].count - 1);
          newHistory[existingIndex] = {
             ...newHistory[existingIndex],
             count: newCount
          };
        }
      }
      return newHistory;
    });

    // 4. Timer Logic
    // If we just completed the active task, stop the timer
    if (isCompleting && activeTaskId === id) {
      setIsTimerRunning(false);
      setActiveTaskId(null);
      setTimerSeconds(targetDuration);
    }
  };

  const deleteTask = (id) => {
    playDelete(); // Sound effect
    setTasks(tasks.filter(t => t.id !== id));
    if (activeTaskId === id) {
      setIsTimerRunning(false);
      setActiveTaskId(null);
      setTimerSeconds(targetDuration);
    }
  };

  const openTimer = (task) => {
    if (activeTaskId === task.id) return;
    playClick(); // Sound effect
    setActiveTaskId(task.id);
    setTimerSeconds(targetDuration);
    setIsTimerRunning(false);
  };

  const setDuration = (minutes) => {
    const seconds = minutes * 60;
    setTargetDuration(seconds);
    setTimerSeconds(seconds);
    setIsTimerRunning(false);
    playClick();
  };

  const handleCustomDurationSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customDuration, 10);
    if (!isNaN(mins) && mins > 0) {
      setDuration(mins);
      setShowCustomDurationInput(false);
      setCustomDuration('');
    }
  };

  const processedTasks = useMemo(() => {
    let filtered = tasks;
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    const priorityScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pA = (a.priority || 'MEDIUM').toUpperCase();
      const pB = (b.priority || 'MEDIUM').toUpperCase();
      if (priorityScore[pA] !== priorityScore[pB]) return priorityScore[pB] - priorityScore[pA];
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [tasks, searchQuery]);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans text-slate-200">
      <style>{styles}</style>
      
      {/* BACKGROUND */}
      <LiquidBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl h-screen flex flex-col md:flex-row gap-8">
        
        {/* LEFT COLUMN: Tasks */}
        <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                 <Waves className="text-cyan-400" /> 
                 <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-flow bg-300%">
                   flowstate
                 </h1>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-slate-400 text-sm">to-do list webapp by shashank for shashank</p>
                <div className="flex gap-2">
                   <div className="relative group">
                      <a 
                        href="https://github.com/antiperfect" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-500 hover:text-white transition-colors block"
                      >
                         <Github size={16} />
                      </a>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-white/10 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                         GitHub
                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                   </div>

                   <div className="relative group">
                      <a 
                        href="https://www.instagram.com/_antiperfect" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-500 hover:text-white transition-colors block"
                      >
                         <Instagram size={16} />
                      </a>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-white/10 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                         Instagram
                         <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          {/* Add Task Input */}
          <form onSubmit={addTask} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-xl relative z-20">
            <div className="flex items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-1 bg-transparent text-xl font-medium placeholder:text-slate-600 outline-none text-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newTask.trim()}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-white/5">
              <PrioritySelector value={newPriority} onChange={setNewPriority} onInteract={playClick} />
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowDatePicker(!showDatePicker); playClick(); }}
                  className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border
                    ${newDueDate ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}
                  `}
                >
                  <Calendar size={14} />
                  {newDueDate ? formatDateLabel(newDueDate) : 'No Date'}
                  {newDueDate && <X size={12} className="ml-1 hover:text-white" onClick={(e) => { e.stopPropagation(); setNewDueDate(''); }} />}
                </button>
                {showDatePicker && (
                  <CustomDatePicker 
                    selectedDate={newDueDate}
                    onChange={(date) => { setNewDueDate(date); playClick(); }}
                    onClose={() => { setShowDatePicker(false); playClick(); }}
                  />
                )}
              </div>
            </div>
          </form>

          {/* Task List (Liquid Cards) */}
          <div className="flex-1 overflow-y-auto px-2 space-y-3 no-scrollbar pb-20 md:pb-0">
            {processedTasks.map((task) => {
              const pKey = (task.priority || 'MEDIUM').toUpperCase();
              const style = PRIORITIES[pKey] || PRIORITIES.MEDIUM;
              const isActive = activeTaskId === task.id;
              const overdue = !task.completed && isOverdue(task.dueDate);

              return (
                <div key={task.id} className="group relative w-full perspective-1000">
                  <div className={`
                    relative w-full rounded-[1.5rem] overflow-hidden transition-all duration-300 
                    border
                    ${isActive 
                      ? 'border-white/20'  // Clean border for active task, let the lava handle background
                      : 'border-white/5 hover:border-white/20 hover:scale-[1.01] hover:shadow-xl'
                    }
                    ${task.completed ? 'opacity-50 grayscale' : ''}
                  `}>
                    
                    {/* Active "Lava Lamp" Background */}
                    {isActive ? (
                      <div className="absolute inset-0 z-0">
                         {/* Base Background Color (slightly transparent to let page bg show through) */}
                         <div className="absolute inset-0 bg-black/40"></div>
                         
                         {/* Lava Blobs Container */}
                         <div className="absolute inset-0 overflow-hidden opacity-60 mix-blend-screen">
                            {/* Blob 1 */}
                            <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[120%] rounded-full filter blur-[50px] animate-blob ${style.blobColors[0]} opacity-80`}></div>
                            {/* Blob 2 */}
                            <div className={`absolute top-[20%] right-[-10%] w-[70%] h-[90%] rounded-full filter blur-[60px] animate-blob animation-delay-2000 ${style.blobColors[1]} opacity-80`}></div>
                            {/* Blob 3 */}
                            <div className={`absolute bottom-[-30%] left-[20%] w-[90%] h-[80%] rounded-full filter blur-[70px] animate-blob animation-delay-4000 ${style.blobColors[2]} opacity-70`}></div>
                         </div>
                      </div>
                    ) : (
                      /* Inactive Gradient Background */
                      <div className={`absolute inset-0 bg-gradient-to-r ${style.color} opacity-[0.05]`}></div>
                    )}

                    <div className="relative z-10 p-5 flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                          ${task.completed ? `bg-gradient-to-r ${style.color} border-transparent scale-110` : 'border-white/20 hover:border-white/50'}
                        `}
                      >
                        {task.completed && <CheckCircle size={14} className="text-white" />}
                      </button>

                      <div className="flex-1 min-w-0 z-10">
                        <h4 className={`text-base font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.text}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          
                          {/* Priority Badge */}
                          <div className={`relative overflow-hidden rounded-full px-2 py-0.5 ${isActive ? 'bg-white/10' : ''}`}>
                            <span className={`relative z-10 text-[10px] font-bold uppercase tracking-widest ${style.text}`}>
                              {style.label}
                            </span>
                          </div>

                          {task.dueDate && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                              <div className={`w-1 h-1 rounded-full ${overdue ? 'bg-red-400' : 'bg-slate-500'}`}></div>
                              {formatDateLabel(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!task.completed && (
                          <button
                            onClick={() => openTimer(task)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Clock size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {processedTasks.length === 0 && (
              <div className="text-center py-12 text-slate-600">
                <p>No tasks found. Float on.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Timer */}
        <div className="hidden md:flex flex-col w-96 gap-6 h-full">
          
          {/* 3. Stats Chart */}
          <StatsChart history={history} />

          {/* Active Timer Card */}
          <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
             
             {/* Background Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500 rounded-full blur-[80px] opacity-10"></div>

             <div className="relative z-10 text-center w-full">
               <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-12">Focus Timer</h2>
               
               {activeTask ? (
                 (() => {
                   const pKey = (activeTask.priority || 'MEDIUM').toUpperCase();
                   const style = PRIORITIES[pKey] || PRIORITIES.MEDIUM;
                   return (
                     <>
                       <div className="mb-8">
                         <p className="text-xl font-medium text-white line-clamp-2 h-14 flex items-center justify-center px-4">
                           {activeTask.text}
                         </p>
                         <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 ${style.text}`}>
                           {style.label} Priority
                         </span>
                       </div>
                       
                       <div className="text-7xl font-mono font-bold text-white mb-6 tracking-tighter flex items-center justify-center gap-1">
                         <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}
                         </span>
                         <span className="text-slate-600 text-5xl pb-2">:</span>
                         <div className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <ScrollCounter value={timerSeconds % 60} />
                         </div>
                       </div>

                       {/* Quick Duration Options (Only visible when paused) */}
                       {!isTimerRunning && (
                         <div className="flex justify-center gap-2 mb-8 flex-wrap px-4 min-h-[32px]">
                           {!showCustomDurationInput ? (
                             <>
                               {[1, 5, 15, 25, 45, 60].map((mins) => {
                                 const isSelected = targetDuration === mins * 60;
                                 return (
                                   <button
                                     key={mins}
                                     onClick={() => setDuration(mins)}
                                     className={`
                                       px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border
                                       ${isSelected 
                                         ? 'bg-white/20 border-white/30 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                                         : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/10'
                                       }
                                     `}
                                   >
                                     {mins}m
                                   </button>
                                 );
                               })}
                               <button
                                 onClick={() => { setShowCustomDurationInput(true); playClick(); }}
                                 className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border bg-white/5 border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/10"
                               >
                                 Custom
                               </button>
                             </>
                           ) : (
                             <form onSubmit={handleCustomDurationSubmit} className="flex items-center gap-2 animate-slideIn">
                               <input
                                 type="number"
                                 min="1"
                                 max="999"
                                 value={customDuration}
                                 onChange={(e) => setCustomDuration(e.target.value)}
                                 placeholder="Mins"
                                 className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500 transition-all text-center font-bold"
                                 autoFocus
                               />
                               <button
                                 type="submit"
                                 className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border bg-purple-500/20 border-purple-500/50 text-purple-200 hover:bg-purple-500/30"
                               >
                                 Set
                               </button>
                               <button
                                 type="button"
                                 onClick={() => { setShowCustomDurationInput(false); playClick(); }}
                                 className="p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
                               >
                                 <X size={14} />
                               </button>
                             </form>
                           )}
                         </div>
                       )}

                       <div className="flex items-center justify-center gap-6">
                         <button
                           onClick={() => {
                             if (!isTimerRunning) playStart();
                             else playPause();
                             setIsTimerRunning(!isTimerRunning);
                           }}
                           className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border border-white/10
                             ${isTimerRunning 
                               ? 'bg-gradient-to-br from-slate-700 to-slate-800' 
                               : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                             }`}
                         >
                           {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                         </button>
                         
                         <button
                           onClick={() => { 
                             playClick();
                             setIsTimerRunning(false); 
                             setTimerSeconds(targetDuration); 
                           }}
                           className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-white/5"
                         >
                           <RotateCcw size={20} />
                         </button>
                       </div>
                     </>
                   );
                 })()
               ) : (
                 <div className="text-center text-slate-600">
                   <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-4">
                      <Clock size={32} />
                   </div>
                   <p className="text-sm">Select a task to begin flow</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}