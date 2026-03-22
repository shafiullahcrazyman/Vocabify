import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Home, RotateCcw, Flame, BookOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  wordsCompleted: number;
  totalXP: number;
  onPlayAgain: () => void;
}

const M3_EASE = [0.2, 0, 0, 1] as const;
const CARD_SPRING = { type: 'spring', damping: 22, stiffness: 280 } as const;

// M3 standard easing function (cubic-bezier 0.2, 0, 0, 1) as a JS function
// Used to drive the count-up with the same feel as the card entrance.
function m3Ease(t: number): number {
  // Approximate cubic-bezier(0.2, 0, 0, 1) via simple exponential decay curve
  return 1 - Math.pow(1 - t, 3.2);
}

interface CountUpProps {
  target: number;
  prefix?: string;
  /** Delay in ms before counting starts — should match card entrance delay */
  delay?: number;
  /** Total duration of the count animation in ms */
  duration?: number;
  className?: string;
}

const CountUp: React.FC<CountUpProps> = ({
  target,
  prefix = '',
  delay = 0,
  duration = 900,
  className,
}) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplay(0);
    const startTimeout = setTimeout(() => {
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = m3Ease(progress);
        setDisplay(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(target); // snap to exact final value
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, delay, duration]);

  return (
    <span className={className}>
      {prefix}{display}
    </span>
  );
};

export const SessionComplete: React.FC<Props> = ({ wordsCompleted, totalXP, onPlayAgain }) => {
  const navigate = useNavigate();
  const { settings, streak } = useAppContext();
  const sessionXP = wordsCompleted * 10;

  // Entrance delay per card (matches transition delay below) in ms
  // card i has delay: (0.18 + i * 0.09)s — count starts after spring settles (~+400ms)
  const COUNT_SETTLE = 400;

  const cards = [
    {
      bg: 'bg-primary',
      Icon: BookOpen,
      iconCls: 'text-on-primary',
      valueCls: 'text-on-primary',
      labelCls: 'text-on-primary/80',
      target: wordsCompleted,
      prefix: '',
      label: 'Words\nLearned',
    },
    {
      bg: 'bg-primary',
      Icon: Zap,
      iconCls: 'text-on-primary',
      valueCls: 'text-on-primary',
      labelCls: 'text-on-primary/80',
      target: sessionXP,
      prefix: '+',
      label: 'XP Earned',
    },
    {
      bg: 'bg-primary',
      Icon: Flame,
      iconCls: 'text-on-primary',
      valueCls: 'text-on-primary',
      labelCls: 'text-on-primary/80',
      target: streak.current,
      prefix: '',
      label: 'Day Streak',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Scrollable upper content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6 gap-8">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: M3_EASE }}
          className="text-center"
        >
          <h1 className="m3-headline-large text-on-surface mb-1">Session Complete!</h1>
          <p className="m3-body-large text-on-surface-variant">Keep it up, great work!</p>
        </motion.div>

        {/* Stat cards */}
        <div className="w-full max-w-sm flex gap-3">
          {cards.map((card, i) => {
            const cardDelay = 0.18 + i * 0.09;
            const countDelay = Math.round(cardDelay * 1000) + COUNT_SETTLE;

            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.72, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...CARD_SPRING, delay: cardDelay }}
                className={`flex-1 ${card.bg} rounded-[24px] flex flex-col items-center gap-3 py-7 px-3`}
              >
                <card.Icon
                  className={`w-10 h-10 ${card.iconCls}`}
                  strokeWidth={2.2}
                />

                <div className="text-center">
                  {/* Count-up number */}
                  <p className={`text-[34px] leading-none font-bold tracking-tight ${card.valueCls}`}>
                    <CountUp
                      target={card.target}
                      prefix={card.prefix}
                      delay={countDelay}
                      duration={850}
                    />
                  </p>
                  {/* Label — newlines rendered as <br> */}
                  <p className={`m3-label-small mt-2 uppercase tracking-wide leading-snug ${card.labelCls}`}>
                    {card.label.split('\n').map((line, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Sticky bottom buttons ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: M3_EASE, delay: 0.45 }}
        className="w-full px-6 pb-10 pt-4 flex flex-col gap-3 bg-background"
      >
        <motion.button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'success');
            onPlayAgain();
          }}
          aria-label="Start a new learning session"
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12, ease: M3_EASE }}
          className="w-full py-5 rounded-full bg-primary text-on-primary flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <RotateCcw className="w-6 h-6" />
          Keep Learning
        </motion.button>

        <motion.button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'tap');
            navigate('/home');
          }}
          aria-label="Go to home screen"
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12, ease: M3_EASE }}
          className="w-full py-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <Home className="w-6 h-6" />
          Go Home
        </motion.button>
      </motion.div>
    </div>
  );
};
