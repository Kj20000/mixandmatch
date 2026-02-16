import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllPairs, getSettings, type WordImagePair, type AppSettings } from "@/lib/db";
import { speakWord, playCorrectSound, playWrongSound } from "@/lib/speech";
import confetti from "canvas-confetti";

interface MatchLine {
  x1: number; y1: number; x2: number; y2: number;
  color: string; opacity: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PASTEL_COLORS = [
  "bg-pastel-lavender", "bg-pastel-mint", "bg-pastel-peach",
  "bg-pastel-sky", "bg-pastel-yellow", "bg-pastel-pink",
];

const Game = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [pairs, setPairs] = useState<WordImagePair[]>([]);
  const [shuffledImages, setShuffledImages] = useState<WordImagePair[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ pairsCount: 3, soundEnabled: true });
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<{ pairId: string; x1: number; y1: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [completedLines, setCompletedLines] = useState<MatchLine[]>([]);
  const [flashLine, setFlashLine] = useState<MatchLine | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRound = useCallback(async () => {
    const allPairs = await getAllPairs();
    const s = await getSettings();
    setSettings(s);
    const count = Math.min(s.pairsCount, allPairs.length);
    const selected = shuffle(allPairs).slice(0, count);
    setPairs(selected);
    setShuffledImages(shuffle(selected));
    setMatched(new Set());
    setCompletedLines([]);
    setAllDone(false);
    setLoading(false);
  }, []);

  useEffect(() => { loadRound(); }, [loadRound]);

  const getCenter = (el: HTMLElement) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const cr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { x: er.left + er.width / 2 - cr.left, y: er.top + er.height / 2 - cr.top };
  };

  const getPointerPos = (e: React.TouchEvent | React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const cr = container.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] || (e as any).changedTouches[0] : e;
    return { x: (touch as any).clientX - cr.left, y: (touch as any).clientY - cr.top };
  };

  const handleWordStart = (pair: WordImagePair, e: React.TouchEvent | React.MouseEvent) => {
    if (matched.has(pair.id)) return;
    e.preventDefault();
    const el = (e.target as HTMLElement).closest('[data-word-id]') as HTMLElement;
    if (!el) return;
    const center = getCenter(el);
    setDragging({ pairId: pair.id, x1: center.x, y1: center.y });
    setCursorPos(center);
    if (settings.soundEnabled) speakWord(pair.wordEn, pair.audioUrl);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragging) return;
    e.preventDefault();
    setCursorPos(getPointerPos(e));
  };

  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragging) return;
    e.preventDefault();

    // Find which image element we ended on
    const pos = getPointerPos(e);
    const imageEls = containerRef.current?.querySelectorAll('[data-image-id]');
    let targetId: string | null = null;
    let targetCenter = { x: 0, y: 0 };

    imageEls?.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const cr = containerRef.current!.getBoundingClientRect();
      const elX = rect.left - cr.left;
      const elY = rect.top - cr.top;
      if (pos.x >= elX && pos.x <= elX + rect.width && pos.y >= elY && pos.y <= elY + rect.height) {
        targetId = el.getAttribute('data-image-id');
        targetCenter = { x: elX + rect.width / 2, y: elY + rect.height / 2 };
      }
    });

    if (targetId && targetId === dragging.pairId) {
      // Correct match!
      const line: MatchLine = {
        x1: dragging.x1, y1: dragging.y1,
        x2: targetCenter.x, y2: targetCenter.y,
        color: 'hsl(145, 60%, 50%)', opacity: 1,
      };
      setCompletedLines(prev => [...prev, line]);
      setMatched(prev => {
        const next = new Set(prev);
        next.add(dragging!.pairId);
        if (next.size === pairs.length) {
          setTimeout(() => setAllDone(true), 600);
        }
        return next;
      });
      if (settings.soundEnabled) {
        playCorrectSound();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } else if (targetId) {
      // Wrong match
      const line: MatchLine = {
        x1: dragging.x1, y1: dragging.y1,
        x2: targetCenter.x, y2: targetCenter.y,
        color: 'hsl(0, 70%, 65%)', opacity: 1,
      };
      setFlashLine(line);
      if (settings.soundEnabled) playWrongSound();
      setTimeout(() => setFlashLine(null), 500);
    }

    setDragging(null);
    setCursorPos(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="text-2xl text-muted-foreground animate-pulse-soft font-display">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100dvh] bg-background overflow-hidden select-none"
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-card shadow-sm">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h2 className="text-xl font-display font-bold text-foreground">Match the Words!</h2>
        <div className="w-10" />
      </div>

      {/* SVG overlay for lines */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      >
        {/* Completed correct lines */}
        {completedLines.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={line.color} strokeWidth="4" strokeLinecap="round" opacity={line.opacity} />
        ))}
        {/* Flash wrong line */}
        {flashLine && (
          <line x1={flashLine.x1} y1={flashLine.y1} x2={flashLine.x2} y2={flashLine.y2}
            stroke={flashLine.color} strokeWidth="4" strokeLinecap="round" strokeDasharray="8 4" />
        )}
        {/* Active dragging line */}
        {dragging && cursorPos && (
          <line x1={dragging.x1} y1={dragging.y1} x2={cursorPos.x} y2={cursorPos.y}
            stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        )}
      </svg>

      {/* Game area - each row is a word + image pair */}
      <div
        className="grid px-4 pb-4"
        style={{
          height: 'calc(100dvh - 72px)',
          gridTemplateRows: `repeat(${pairs.length}, 1fr)`,
          gap: '0.5rem',
        }}
      >
        {pairs.map((pair, i) => {
          const imagePair = shuffledImages[i];
          return (
            <div key={pair.id} className="grid grid-cols-2 gap-3 items-center min-h-0">
              {/* Word */}
              <div
                data-word-id={pair.id}
                onMouseDown={(e) => handleWordStart(pair, e)}
                onTouchStart={(e) => handleWordStart(pair, e)}
                className={`
                  relative rounded-2xl shadow-md cursor-grab active:cursor-grabbing
                  transition-all duration-200 text-center flex flex-col items-center justify-center p-4
                  ${PASTEL_COLORS[i % PASTEL_COLORS.length]}
                  ${matched.has(pair.id) ? 'opacity-50 scale-95' : 'hover:shadow-lg hover:scale-[1.02]'}
                `}
              >
                <span className="text-xl sm:text-2xl font-extrabold text-foreground font-display block uppercase tracking-wide">{pair.wordEn}</span>
                {pair.wordHi && (
                  <span className="text-xs sm:text-sm text-muted-foreground block mt-0.5">{pair.wordHi}</span>
                )}
              </div>
              {/* Image */}
              <div
                data-image-id={imagePair.id}
                className={`
                  relative rounded-2xl shadow-md overflow-hidden bg-card
                  transition-all duration-200 flex items-center justify-center p-1 h-full
                  ${matched.has(imagePair.id) ? 'opacity-50 scale-95 ring-4 ring-success' : ''}
                `}
              >
                <img
                  src={imagePair.imageUrl}
                  alt={imagePair.wordEn}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* All done overlay */}
      {allDone && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-bounce-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-6">Great Job!</h2>
          <Button
            onClick={loadRound}
            size="lg"
            className="text-xl px-10 py-6 rounded-3xl font-display"
          >
            Next Round →
          </Button>
        </div>
      )}
    </div>
  );
};

export default Game;
