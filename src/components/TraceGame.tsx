import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Shape, Point } from '../types';
import { SHAPES, BASIC_IDS, ADV_IDS, scoreD } from '../utils/shapes';
import { Header } from './Header';
import { ShapeSvg } from './ShapeSvg';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, RotateCcw, Home, Sparkles, CheckCircle, Trash2 } from 'lucide-react';

interface TraceGameProps {
  onHome: () => void;
}

interface TraceCardProps {
  shape: Shape;
  isCompleted: boolean;
  onComplete: (score: number, drawnLines: Point[][]) => void;
  onReset: () => void;
  savedLines?: Point[][];
  savedScore?: number;
}

const TraceCard: React.FC<TraceCardProps> = ({
  shape,
  isCompleted,
  onComplete,
  onReset,
  savedLines = [],
  savedScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const currentLineRef = useRef<Point[]>([]);
  
  // Track all lines drawn by the user for persistent display
  const [lines, setLines] = useState<Point[][]>(savedLines || []);
  const [activeLine, setActiveLine] = useState<Point[]>([]);
  const [showError, setShowError] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(savedScore || null);

  // Redraw canvas whenever lines, activeLine, shape, or isCompleted status changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset and clear canvas
    ctx.clearRect(0, 0, width, height);

    const size = Math.min(width, height) * 0.8;
    const ox = (width - size) / 2;
    const oy = (height - size) / 2;

    // 1. Draw ghost template outline guide
    ctx.save();
    ctx.translate(ox, oy);
    
    if (isCompleted) {
      // Completed shapes look super pretty, filled with soft color, no border
      ctx.fillStyle = '#fce7f3'; // Soft rose
      ctx.beginPath();
      shape.d2(ctx, size);
      ctx.fill();
    } else {
      // Uncompleted shapes have a guide dashed trace line
      ctx.strokeStyle = '#cbd5e1'; // Slate 300
      ctx.lineWidth = size * 0.08;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      shape.d2(ctx, size);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw all persistent user lines on top
    const drawLine = (pts: Point[], color: string, width: number) => {
      if (pts.length < 1) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Draw previous lines
    lines.forEach((ln) => {
      drawLine(ln, isCompleted ? '#ec4899' : '#6366f1', 6);
    });

    // Draw currently active line
    if (activeLine.length > 0) {
      drawLine(activeLine, '#6366f1', 6);
    }
  }, [shape, isCompleted, lines, activeLine]);

  // Helper to translate touch/mouse events to canvas coordinates
  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isCompleted) return;
    drawingRef.current = true;
    const pt = getPos(e);
    currentLineRef.current = [pt];
    setActiveLine([pt]);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || isCompleted) return;
    if (e.cancelable) e.preventDefault();

    const pt = getPos(e);
    currentLineRef.current.push(pt);
    setActiveLine([...currentLineRef.current]);
  };

  const handleEnd = () => {
    if (!drawingRef.current || isCompleted) return;
    drawingRef.current = false;

    const finishedLine = [...currentLineRef.current];
    if (finishedLine.length > 2) {
      setLines((prev) => [...prev, finishedLine]);
    }
    setActiveLine([]);
    currentLineRef.current = [];
  };

  // Check accuracy of the combined lines drawn by the user
  const handleVerify = () => {
    const allPoints = lines.flat();
    if (allPoints.length < 10) return;

    const score = scoreD(allPoints, shape);
    
    // We allow success at a highly child-friendly threshold (20%+)
    if (score >= 20) {
      setFeedbackScore(score);
      setShowError(false);
      onComplete(score, lines);
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
    }
  };

  const handleClear = () => {
    setLines([]);
    setActiveLine([]);
    setFeedbackScore(null);
    setShowError(false);
    if (isCompleted) {
      onReset();
    }
  };

  const totalPoints = lines.flat().length;
  const isDrawingStarted = totalPoints > 6;

  return (
    <div className="relative bg-white border border-stone-200/80 hover:border-amber-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col items-center p-3 select-none">
      {/* Title */}
      <div className="w-full flex justify-between items-center px-1 mb-2">
        <span className="font-extrabold text-sm text-stone-700">{shape.name}</span>
        {isCompleted && feedbackScore !== null && (
          <span className="bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-full text-[10px] font-black">
            정확도: {feedbackScore}%
          </span>
        )}
      </div>

      {/* Canvas Frame */}
      <div className="relative w-full aspect-video rounded-xl border border-stone-100 overflow-hidden bg-slate-50">
        <canvas
          ref={canvasRef}
          width={280}
          height={180}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className={`w-full h-full block ${
            isCompleted ? 'cursor-default' : 'cursor-crosshair touch-none'
          }`}
        />

        {/* Clear Brush Overlay Button */}
        {!isCompleted && isDrawingStarted && (
          <button
            onClick={handleClear}
            className="absolute bottom-2 right-2 bg-stone-800/80 hover:bg-stone-900 text-white p-1.5 rounded-lg shadow transition-colors cursor-pointer flex items-center justify-center"
            title="다시 그리기"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Error Feedback Overlay */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-2 bottom-2 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] sm:text-xs font-bold py-1.5 px-2 rounded-lg text-center shadow-sm"
            >
              조금만 더 가이드를 따라 그려볼까요? 화이팅!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Controls below canvas */}
      <div className="w-full mt-3 flex gap-2">
        {!isCompleted ? (
          <>
            <button
              onClick={handleClear}
              disabled={!isDrawingStarted}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                isDrawingStarted
                  ? 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                  : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-400" />
              <span>지우기</span>
            </button>
            <button
              onClick={handleVerify}
              disabled={!isDrawingStarted}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                isDrawingStarted
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/15'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>완성하기</span>
            </button>
          </>
        ) : (
          <div className="w-full flex gap-1.5">
            <div className="flex-1 py-2 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-xs font-black flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>참 잘 그렸어요!</span>
            </div>
            <button
              onClick={handleClear}
              className="py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="지우고 다시 그리기"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>다시하기</span>
            </button>
          </div>
        )}
      </div>

      {/* Completed Stamp Icon */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="absolute top-10 right-4 bg-teal-500 text-white rounded-full p-1.5 shadow-md flex items-center justify-center"
          >
            <Check className="w-5 h-5" strokeWidth={4} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TraceGame: React.FC<TraceGameProps> = ({ onHome }) => {
  const [category, setCategory] = useState<'basic' | 'advanced' | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [resetCount, setResetCount] = useState(0);
  
  // Track drawn lines and scores for each card
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [cardLines, setCardLines] = useState<Record<number, Point[][]>>({});
  const [cardScores, setCardScores] = useState<Record<number, number>>({});
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!category) return;
    const ids = category === 'basic' ? BASIC_IDS : ADV_IDS;
    const filtered = ids.map((id) => SHAPES.find((s) => s.id === id)).filter(Boolean) as Shape[];
    setShapes(filtered);
    setCompleted({});
    setCardLines({});
    setCardScores({});
    setShowPopup(false);
    setResetCount((c) => c + 1);
  }, [category]);

  const handleShapeComplete = (idx: number, score: number, lines: Point[][]) => {
    setCardLines((prev) => ({ ...prev, [idx]: lines }));
    setCardScores((prev) => ({ ...prev, [idx]: score }));
    setCompleted((prev) => {
      const next = { ...prev, [idx]: true };
      const keys = Object.keys(next);
      if (keys.length === shapes.length) {
        setTimeout(() => setShowPopup(true), 500);
      }
      return next;
    });
  };

  const handleReset = () => {
    setCompleted({});
    setCardLines({});
    setCardScores({});
    setShowPopup(false);
    setResetCount((c) => c + 1);
  };

  const getStars = () => {
    const doneCount = Object.keys(completed).length;
    if (shapes.length === 0) return 0;
    return Math.min(Math.ceil((doneCount / shapes.length) * 5), 5);
  };

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Header title="모양을 따라 그려요!" onHome={onHome} stars={0} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center mt-6 select-none bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 max-w-lg w-full shadow-sm"
        >
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 mb-2">
            어떤 모양을 그려볼까요?
          </h2>
          <p className="text-xs text-stone-400 mb-8 font-medium">
            원하는 카테고리를 선택해 재미있게 모양 가이드를 따라 그려보세요.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCategory('basic')}
              className="flex-1 p-6 bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-orange-100 hover:border-orange-200 rounded-2xl cursor-pointer shadow-sm text-center flex flex-col items-center justify-center"
            >
              <div className="flex gap-1 mb-3">
                <ShapeSvg shapeId="circle" size={36} color="#e74c3c" />
                <ShapeSvg shapeId="square" size={36} color="#3498db" />
              </div>
              <div className="font-extrabold text-stone-800 text-sm sm:text-base">기본 모양</div>
              <div className="text-[11px] text-stone-400 font-medium mt-1">원, 삼각형, 사각형 등</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCategory('advanced')}
              className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-100 hover:border-indigo-200 rounded-2xl cursor-pointer shadow-sm text-center flex flex-col items-center justify-center"
            >
              <div className="flex gap-1 mb-3">
                <ShapeSvg shapeId="star" size={36} color="#f39c12" />
                <ShapeSvg shapeId="hexagon" size={36} color="#9b59b6" />
              </div>
              <div className="font-extrabold text-stone-800 text-sm sm:text-base">여러 가지 모양</div>
              <div className="text-[11px] text-stone-400 font-medium mt-1">별, 육각형, 사다리꼴 등</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header
        title="모양을 따라 그려요!"
        onHome={onHome}
        onSelectCategory={() => setCategory(null)}
        stars={getStars()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shapes.map((shape, i) => (
          <TraceCard
            key={`${shape.id}-${i}-${resetCount}`}
            shape={shape}
            isCompleted={!!completed[i]}
            savedLines={cardLines[i]}
            savedScore={cardScores[i]}
            onComplete={(score, lines) => handleShapeComplete(i, score, lines)}
            onReset={() => {
              setCompleted((prev) => {
                const next = { ...prev };
                delete next[i];
                return next;
              });
              setCardLines((prev) => {
                const next = { ...prev };
                delete next[i];
                return next;
              });
              setCardScores((prev) => {
                const next = { ...prev };
                delete next[i];
                return next;
              });
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-2 border-amber-200 rounded-3xl p-8 max-w-xs w-full text-center shadow-xl"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-black text-stone-800 mb-2">참 잘했어요!</h3>
              <p className="text-xs text-stone-500 font-medium mb-6">
                모든 모양을 완벽하게 다 따라 그렸습니다! 최고예요!
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 그려볼까요</span>
                </button>
                <button
                  onClick={onHome}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm shadow-amber-600/20"
                >
                  <Home className="w-4 h-4" />
                  <span>메인화면으로 가기</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
