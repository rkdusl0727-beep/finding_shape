import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Shape, Point } from '../types';
import { SHAPES, BASIC_IDS, ADV_IDS, scoreD, shuffle, cImg } from '../utils/shapes';
import { Header } from './Header';
import { ShapeSvg } from './ShapeSvg';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, CheckCircle, ChevronRight, HelpCircle } from 'lucide-react';

interface ExactGameProps {
  onHome: () => void;
}

interface ExactPlayerProps {
  playerNum: number;
  shape: Shape;
  onFinish: (pts: Point[], score: number) => void;
  accentColor: string;
  borderColor: string;
  capBg: string;
  capText: string;
}

const ExactPlayer: React.FC<ExactPlayerProps> = ({
  playerNum,
  shape,
  onFinish,
  accentColor,
  borderColor,
  capBg,
  capText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [drawingStarted, setDrawingStarted] = useState(false);

  useEffect(() => {
    // Reset when shape changes
    handleClear();
  }, [shape]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pointsRef.current = [];
    setScore(null);
    setDrawingStarted(false);
  };

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
    if (score !== null) return;
    drawingRef.current = true;
    setDrawingStarted(true);
    const pt = getPos(e);
    pointsRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#6b4f3a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || score !== null) return;
    if (e.cancelable) e.preventDefault();

    const pt = getPos(e);
    pointsRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handleEnd = () => {
    drawingRef.current = false;
  };

  const handleComplete = () => {
    if (score !== null) return;
    const pts = pointsRef.current;
    const finalScore = scoreD(pts, shape);
    setScore(finalScore);
    onFinish(pts, finalScore);
  };

  const getScoreColor = () => {
    if (score === null) return 'text-stone-400';
    if (score >= 80) return 'text-blue-500';
    if (score >= 55) return 'text-orange-500';
    return 'text-rose-500';
  };

  return (
    <div className={`flex-1 flex flex-col bg-white border-2 ${borderColor} rounded-2xl overflow-hidden shadow-sm`}>
      <div className={`px-4 py-2 text-xs font-black ${capBg} ${capText} flex items-center justify-between`}>
        <span>{playerNum}P 영역</span>
        {score !== null && (
          <span className="bg-white/80 px-2 py-0.5 rounded-full font-bold">완료됨</span>
        )}
      </div>

      <div className="relative flex-1 bg-stone-50/50 min-h-[180px]">
        <canvas
          ref={canvasRef}
          width={280}
          height={190}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full h-full block cursor-crosshair touch-none bg-stone-50/20"
        />

        <AnimatePresence>
          {score !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center p-3 select-none"
            >
              <div className="text-[10px] sm:text-xs font-extrabold text-stone-400 tracking-wider uppercase mb-1">
                정확도 점수
              </div>
              <div className={`text-4xl sm:text-5xl font-black ${getScoreColor()}`}>
                {score}%
              </div>
              <div className="text-[11px] text-stone-500 font-bold mt-2">
                {score >= 80 ? '🤩 와! 완벽해요!' : score >= 55 ? '🙂 대단해요!' : '🥹 조금만 더 화이팅!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!drawingStarted && score === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none p-4 opacity-50">
            <HelpCircle className="w-8 h-8 text-stone-400 mb-1" />
            <p className="text-[11px] text-stone-500 font-bold text-center leading-normal">
              여기에 손가락이나 마우스로<br />모양을 똑같이 그려보세요!
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 p-2 border-t border-stone-100 bg-white">
        <button
          onClick={handleClear}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] sm:text-xs font-bold border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-stone-400" />
          <span>지우기</span>
        </button>

        <button
          onClick={handleComplete}
          disabled={!drawingStarted || score !== null}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] sm:text-xs font-extrabold text-white rounded-xl cursor-pointer transition-all ${
            !drawingStarted || score !== null
              ? 'bg-stone-300 cursor-not-allowed opacity-60'
              : `${accentColor} shadow-md shadow-amber-600/10`
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>완성하기</span>
        </button>
      </div>
    </div>
  );
};

export const ExactGame: React.FC<ExactGameProps> = ({ onHome }) => {
  const [category, setCategory] = useState<'basic' | 'advanced' | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [p1Score, setP1Score] = useState<number | null>(null);
  const [p2Score, setP2Score] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    const ids = category === 'basic' ? BASIC_IDS : ADV_IDS;
    const list = ids.map((id) => SHAPES.find((s) => s.id === id)).filter(Boolean) as Shape[];
    setShapes(shuffle(list));
    setCurrentIdx(0);
    resetRound();
  }, [category]);

  const resetRound = () => {
    setP1Score(null);
    setP2Score(null);
    setRoundWinner(null);
  };

  const handleFinish = (player: number, score: number) => {
    if (player === 1) {
      setP1Score(score);
    } else {
      setP2Score(score);
    }
  };

  // Evaluate winner when both scores are evaluated
  useEffect(() => {
    if (p1Score !== null && p2Score !== null) {
      if (p1Score > p2Score) {
        setRoundWinner('1P 승리! 👑');
      } else if (p2Score > p1Score) {
        setRoundWinner('2P 승리! 👑');
      } else {
        setRoundWinner('무승부! 🤝');
      }
    }
  }, [p1Score, p2Score]);

  const handleNext = () => {
    setCurrentIdx((prev) => prev + 1);
    resetRound();
  };

  const getStars = () => {
    if (p1Score === null || p2Score === null) return 0;
    const avg = (p1Score + p2Score) / 2;
    if (avg >= 80) return 5;
    if (avg >= 60) return 4;
    if (avg >= 40) return 3;
    if (avg >= 25) return 2;
    return 1;
  };

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Header title="모양을 정확하게 그려요!" onHome={onHome} stars={0} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center mt-6 select-none bg-white p-8 rounded-3xl border border-stone-200 max-w-lg w-full shadow-sm"
        >
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 mb-2">
            어떤 모양을 그려볼까요?
          </h2>
          <p className="text-xs text-stone-400 mb-8 font-medium">
            가이드선이 보이지 않는 하얀 캔버스 위에 모양을 완벽하게 재현해보세요!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCategory('basic')}
              className="flex-1 p-6 bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-orange-100 hover:border-orange-200 rounded-2xl cursor-pointer shadow-sm text-center flex flex-col items-center justify-center"
            >
              <div className="flex gap-1.5 mb-3">
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
              <div className="flex gap-1.5 mb-3">
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

  const activeShape = shapes[currentIdx % shapes.length];

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header
        title="모양을 정확하게 그려요!"
        onHome={onHome}
        onSelectCategory={() => setCategory(null)}
        stars={getStars()}
      />

      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {/* P1 Section */}
        <ExactPlayer
          playerNum={1}
          shape={activeShape}
          onFinish={(pts, score) => handleFinish(1, score)}
          accentColor="bg-blue-600 hover:bg-blue-700"
          borderColor="border-blue-100 focus-within:border-blue-300"
          capBg="bg-blue-50"
          capText="text-blue-900"
        />

        {/* Center Target Box */}
        <div className="flex flex-row md:flex-col justify-center items-center gap-4 bg-amber-50/30 p-4 border border-stone-200 rounded-2xl md:max-w-[140px] w-full text-center select-none shadow-xs">
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[10px] font-extrabold text-stone-400 tracking-wider uppercase mb-1">
              목표 도형
            </div>
            {activeShape && (
              <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center">
                <ShapeSvg shapeId={activeShape.id} size={72} color="#e74c3c" />
                <span className="text-xs font-black text-stone-800 mt-2 block">
                  {activeShape.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatePresence>
              {roundWinner ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-[11px] font-extrabold text-stone-700 mb-1">
                    라운드 결과
                  </div>
                  <div className="font-black text-xs sm:text-sm text-teal-600 px-3 py-1 bg-teal-50 rounded-lg border border-teal-100 shadow-2xs whitespace-nowrap">
                    {roundWinner}
                  </div>
                  <button
                    onClick={handleNext}
                    className="mt-3 flex items-center justify-center gap-1 px-3 py-2 text-xs font-black text-white bg-stone-700 hover:bg-stone-800 active:scale-95 rounded-xl cursor-pointer transition-all shadow-sm shadow-stone-700/10"
                  >
                    <span>다음 도전</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-stone-400 leading-normal">
                    두 플레이어 모두 그리기 후 완료버튼을 눌러주세요!
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* P2 Section */}
        <ExactPlayer
          playerNum={2}
          shape={activeShape}
          onFinish={(pts, score) => handleFinish(2, score)}
          accentColor="bg-rose-600 hover:bg-rose-700"
          borderColor="border-rose-100 focus-within:border-rose-300"
          capBg="bg-rose-50"
          capText="text-rose-900"
        />
      </div>
    </div>
  );
};
