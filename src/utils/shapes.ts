import { Shape, Point } from '../types';

export const COLS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#27ae60', // Green
  '#9b59b6', // Purple
  '#e67e22', // Orange
  '#f39c12', // Yellow
  '#e91e63'  // Pink
];

// Helper to generate regular polygons
function reg(n: number, s: number, off: number): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: s / 2 + s * 0.42 * Math.cos((Math.PI * 2 * i) / n + off),
    y: s / 2 + s * 0.42 * Math.sin((Math.PI * 2 * i) / n + off),
  }));
}

// Helper to generate star points
function starP(s: number): Point[] {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const r = i % 2 ? s * 0.18 : s * 0.43;
    return {
      x: s / 2 + r * Math.cos(a),
      y: s / 2 + r * Math.sin(a),
    };
  });
}

// Helper to generate circle points
function circ(s: number, rx: number, ry: number): Point[] {
  return Array.from({ length: 64 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 64;
    return {
      x: s / 2 + s * rx * Math.cos(a),
      y: s / 2 + s * ry * Math.sin(a),
    };
  });
}

// Helper to generate linear segments between points
function seg(pts: Point[], n = 20): Point[] {
  const r: Point[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    for (let t = 0; t < n; t++) {
      const f = t / n;
      r.push({
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
      });
    }
  }
  return r;
}

export const SHAPES: Shape[] = [
  {
    id: 'circle',
    name: '원',
    d2: (c, s) => {
      c.arc(s / 2, s / 2, s * 0.38, 0, Math.PI * 2);
    },
    pts: (s) => circ(s, 0.38, 0.38),
  },
  {
    id: 'triangle',
    name: '삼각형',
    d2: (c, s) => {
      c.moveTo(s / 2, s * 0.1);
      c.lineTo(s * 0.9, s * 0.9);
      c.lineTo(s * 0.1, s * 0.9);
      c.closePath();
    },
    pts: (s) =>
      seg([
        { x: s / 2, y: s * 0.1 },
        { x: s * 0.9, y: s * 0.9 },
        { x: s * 0.1, y: s * 0.9 },
        { x: s / 2, y: s * 0.1 },
      ]),
  },
  {
    id: 'square',
    name: '사각형',
    d2: (c, s) => {
      c.rect(s * 0.14, s * 0.14, s * 0.72, s * 0.72);
    },
    pts: (s) =>
      seg([
        { x: s * 0.14, y: s * 0.14 },
        { x: s * 0.86, y: s * 0.14 },
        { x: s * 0.86, y: s * 0.86 },
        { x: s * 0.14, y: s * 0.86 },
        { x: s * 0.14, y: s * 0.14 },
      ]),
  },
  {
    id: 'oval',
    name: '타원',
    d2: (c, s) => {
      c.ellipse(s / 2, s / 2, s * 0.42, s * 0.27, 0, 0, Math.PI * 2);
    },
    pts: (s) => circ(s, 0.42, 0.27),
  },
  {
    id: 'semicircle',
    name: '반원',
    d2: (c, s) => {
      c.arc(s / 2, s * 0.62, s * 0.4, Math.PI, 0);
      c.closePath();
    },
    pts: (s) =>
      Array.from({ length: 32 }, (_, i) => {
        const a = Math.PI + (Math.PI * i) / 31;
        const r = s * 0.4;
        return {
          x: s / 2 + r * Math.cos(a),
          y: s * 0.62 + r * Math.sin(a),
        };
      }),
  },
  {
    id: 'diamond',
    name: '마름모',
    d2: (c, s) => {
      c.moveTo(s / 2, s * 0.1);
      c.lineTo(s * 0.9, s / 2);
      c.lineTo(s / 2, s * 0.9);
      c.lineTo(s * 0.1, s / 2);
      c.closePath();
    },
    pts: (s) =>
      seg([
        { x: s / 2, y: s * 0.1 },
        { x: s * 0.9, y: s / 2 },
        { x: s / 2, y: s * 0.9 },
        { x: s * 0.1, y: s / 2 },
        { x: s / 2, y: s * 0.1 },
      ]),
  },
  {
    id: 'trapezoid',
    name: '사다리꼴',
    d2: (c, s) => {
      c.moveTo(s * 0.25, s * 0.2);
      c.lineTo(s * 0.75, s * 0.2);
      c.lineTo(s * 0.9, s * 0.8);
      c.lineTo(s * 0.1, s * 0.8);
      c.closePath();
    },
    pts: (s) =>
      seg([
        { x: s * 0.25, y: s * 0.2 },
        { x: s * 0.75, y: s * 0.2 },
        { x: s * 0.9, y: s * 0.8 },
        { x: s * 0.1, y: s * 0.8 },
        { x: s * 0.25, y: s * 0.2 },
      ]),
  },
  {
    id: 'pentagon',
    name: '오각형',
    d2: (c, s) => {
      const p = reg(5, s, -Math.PI / 2);
      c.moveTo(p[0].x, p[0].y);
      p.slice(1).forEach((v) => c.lineTo(v.x, v.y));
      c.closePath();
    },
    pts: (s) => {
      const p = reg(5, s, -Math.PI / 2);
      return seg([...p, p[0]]);
    },
  },
  {
    id: 'hexagon',
    name: '육각형',
    d2: (c, s) => {
      const p = reg(6, s, -Math.PI / 6);
      c.moveTo(p[0].x, p[0].y);
      p.slice(1).forEach((v) => c.lineTo(v.x, v.y));
      c.closePath();
    },
    pts: (s) => {
      const p = reg(6, s, -Math.PI / 6);
      return seg([...p, p[0]]);
    },
  },
  {
    id: 'star',
    name: '별',
    d2: (c, s) => {
      const p = starP(s);
      c.moveTo(p[0].x, p[0].y);
      p.slice(1).forEach((v) => c.lineTo(v.x, v.y));
      c.closePath();
    },
    pts: (s) => seg([...starP(s), starP(s)[0]]),
  },
];

export const BASIC_IDS = ['circle', 'triangle', 'square', 'oval', 'semicircle', 'diamond'];
export const ADV_IDS = ['trapezoid', 'pentagon', 'hexagon', 'star', 'diamond', 'oval'];

export function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

export function rnd(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}

export function rpos(n: number, W: number, H: number, pad: number): Point[] {
  const p: Point[] = [];
  for (let i = 0; i < n; i++) {
    let q: Point;
    let t = 0;
    do {
      q = {
        x: Math.floor(rnd(4, W - pad - 4)),
        y: Math.floor(rnd(4, H - pad - 4)),
      };
      t++;
    } while (
      t < 120 &&
      p.some((r) => Math.abs(r.x - q.x) < pad + 8 && Math.abs(r.y - q.y) < pad + 8)
    );
    p.push(q);
  }
  return p;
}

// Draw shape on a canvas and return data URL
export function cImg(shape: Shape, size: number, style: string): string {
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const c = cv.getContext('2d');
  if (!c) return '';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (style === 'ghost') {
    c.strokeStyle = '#c8b89a';
    c.lineWidth = size * 0.076;
    c.beginPath();
    shape.d2(c, size);
    c.stroke();
  } else {
    c.fillStyle = style;
    c.beginPath();
    shape.d2(c, size);
    c.fill();
  }
  return cv.toDataURL();
}

// Calculate the score of drawing compared to ideal shape path
export function scoreD(pts: Point[], shape: Shape): number {
  if (pts.length < 10) return 0;
  
  // 1. Find bounding box of user points and normalize
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  pts.forEach((p) => {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  });
  const dw = x1 - x0 || 1;
  const dh = y1 - y0 || 1;
  const nd = pts.map((p) => ({ x: (p.x - x0) / dw, y: (p.y - y0) / dh }));

  // 2. Find bounding box of reference points and normalize
  const rp = shape.pts(100);
  let rx0 = 1e9, ry0 = 1e9, rx1 = -1e9, ry1 = -1e9;
  rp.forEach((p) => {
    rx0 = Math.min(rx0, p.x);
    ry0 = Math.min(ry0, p.y);
    rx1 = Math.max(rx1, p.x);
    ry1 = Math.max(ry1, p.y);
  });
  const rw = rx1 - rx0 || 1;
  const rh = ry1 - ry0 || 1;
  const nr = rp.map((p) => ({ x: (p.x - rx0) / rw, y: (p.y - ry0) / rh }));

  // Helper to calculate squared distance between two points
  const distSq = (p1: Point, p2: Point) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;

  // 3. For each user point, find the distance to the closest reference point (Precision)
  let sumMinDistNdToNr = 0;
  nd.forEach((p) => {
    let minDist = 1e9;
    nr.forEach((r) => {
      const d = distSq(p, r);
      if (d < minDist) minDist = d;
    });
    sumMinDistNdToNr += Math.sqrt(minDist);
  });
  const avgDistNdToNr = sumMinDistNdToNr / nd.length;

  // 4. For each reference point, find the distance to the closest user point (Coverage)
  // To avoid performance issues, we sample nr to 50 points
  const sampleNrSize = Math.min(nr.length, 50);
  let sumMinDistNrToNd = 0;
  for (let i = 0; i < sampleNrSize; i++) {
    const idx = Math.floor((i * (nr.length - 1)) / (sampleNrSize - 1));
    const r = nr[idx];
    let minDist = 1e9;
    nd.forEach((p) => {
      const d = distSq(r, p);
      if (d < minDist) minDist = d;
    });
    sumMinDistNrToNd += Math.sqrt(minDist);
  }
  const avgDistNrToNd = sumMinDistNrToNd / sampleNrSize;

  // 5. Calculate scores with a very child-friendly threshold
  const precisionScore = Math.max(0, 100 - avgDistNdToNr * 350);
  const coverageScore = Math.max(0, 100 - avgDistNrToNd * 300);

  // Combine them
  let score = Math.floor(precisionScore * 0.5 + coverageScore * 0.5);

  // If they made an honest attempt (average distance is reasonably low),
  // boost the score so it's rewarding and extremely easy for children to pass!
  if (avgDistNdToNr < 0.22 && avgDistNrToNd < 0.28) {
    score = Math.max(score, 75); // Safe boost to 75%+ which is a guaranteed pass
  }
  
  // Guard against completely unrelated drawings (e.g. huge deviation)
  if (avgDistNdToNr > 0.35) {
    score = Math.min(score, 15);
  }

  return Math.min(100, Math.max(0, score));
}
