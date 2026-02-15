'use client';

import { useState, useEffect, useRef } from 'react';
import { events } from '~/constants/timeline';

const DAY_COLORS = {
  1: {
    node: 'bg-gradient-to-br from-orange-400 to-orange-600',
    path: 'bg-gradient-to-r from-pink-400 to-pink-500',
    glow: 'shadow-orange-500',
  },
  2: {
    node: 'bg-gradient-to-br from-blue-400 to-blue-600',
    path: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    glow: 'shadow-blue-500',
  },
  3: {
    node: 'bg-gradient-to-br from-green-400 to-green-600',
    path: 'bg-gradient-to-r from-green-300 to-green-400',
    glow: 'shadow-green-500',
  },
};

const PATH_STROKES = {
  1: '#ff5fa2',
  2: '#f6c445',
  3: '#7bd973',
};

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildWavePath(from: NodePosition, to: NodePosition, seed: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / distance;
  const ny = dx / distance;

  const maxOffset = 80;
  const offsetA = (seededRandom(seed) - 0.5) * 2 * maxOffset;
  const offsetB = (seededRandom(seed + 17) - 0.5) * 2 * maxOffset;

  const c1x = from.x + dx * 0.33 + nx * offsetA;
  const c1y = from.y + dy * 0.33 + ny * offsetA;
  const c2x = from.x + dx * 0.66 + nx * offsetB;
  const c2y = from.y + dy * 0.66 + ny * offsetB;

  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
}

interface NodePosition {
  x: number;
  y: number;
  event: typeof events[0];
  index: number;
}

export default function Timeline2D() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);

  useEffect(() => {
    const positions: NodePosition[] = [];
    const padding = 100;
    const baseSpacing = 160;
    const centerX = 500;
    let y = padding;
    let x = centerX;

    events.forEach((event, i) => {
      const drift = (seededRandom(i * 13 + 5) - 0.5) * 300;
      const wobble = Math.sin(i * 0.9) * 90;
      x = clamp(x + drift + wobble, 120, 880);

      if (seededRandom(i * 7 + 3) > 0.75) {
        const jump = (seededRandom(i * 17 + 1) - 0.5) * 420;
        x = clamp(x + jump, 120, 880);
      }

      const spacingJitter = (seededRandom(i * 9 + 11) - 0.5) * 110;
      y += baseSpacing + spacingJitter;

      positions.push({
        x,
        y,
        event,
        index: i,
      });
    });

    setNodePositions(positions);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const element = containerRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
      setScrollProgress(progress);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const getPlayerPosition = () => {
    const currentIndex = Math.floor(scrollProgress * (events.length - 1));
    const nextIndex = Math.min(currentIndex + 1, events.length - 1);
    const localProgress = (scrollProgress * (events.length - 1)) - currentIndex;

    if (nodePositions.length === 0) return { x: 0, y: 0 };

    const current = nodePositions[currentIndex];
    const next = nodePositions[nextIndex];

    return {
      x: current.x + (next.x - current.x) * localProgress,
      y: current.y + (next.y - current.y) * localProgress,
    };
  };

  const playerPos = getPlayerPosition();

  const lastY = nodePositions.length > 0 ? nodePositions[nodePositions.length - 1].y : 0;
  const containerHeight = Math.max(2000, lastY + 500);
  const containerWidth = 1000;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll bg-linear-to-b from-green-200 via-green-100 to-yellow-100"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)',
      }}
    >
      <div className="relative" style={{ height: `${containerHeight}px`, width: `${containerWidth}px`, margin: '0 auto' }}>
        <svg
          className="absolute left-0 top-0"
          width={containerWidth}
          height={containerHeight}
        >
          <title>Wavy dotted route</title>
          {nodePositions.map((node, i) => {
            if (i >= nodePositions.length - 1) return null;
            const next = nodePositions[i + 1];
            const stroke = PATH_STROKES[node.event.day as keyof typeof PATH_STROKES] || PATH_STROKES[1];
            const d = buildWavePath(node, next, i * 31 + node.event.day * 7);
            return (
              <path
                key={`path-${node.index}`}
                d={d}
                stroke={stroke}
                strokeWidth={10}
                strokeDasharray="2 18"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </svg>

        <div
          className="absolute w-12 h-12 bg-black rounded-md transition-all duration-300 shadow-2xl"
          style={{
            left: `${playerPos.x - 24}px`,
            top: `${playerPos.y - 24}px`,
            zIndex: 50,
            border: '4px solid white',
          }}
        />

        {nodePositions.map((node) => {
          const colors = DAY_COLORS[node.event.day as keyof typeof DAY_COLORS] || DAY_COLORS[1];
          const isPassed = scrollProgress * (events.length - 1) >= node.index;
          
          return (
            <div
              key={node.index}
              className="absolute"
              style={{
                left: `${node.x - 40}px`,
                top: `${node.y - 40}px`,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(node.event)}
                className={`
                  relative w-20 h-20 rounded-full ${colors.node}
                  flex items-center justify-center
                  font-bold text-2xl text-white
                  transition-all duration-300
                  border-4 border-white
                  ${isPassed ? 'scale-110 shadow-2xl' : 'opacity-70'}
                  hover:scale-125 hover:shadow-2xl
                  cursor-pointer
                `}
                style={{
                  boxShadow: isPassed ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <span className="relative z-10">{node.index + 1}</span>
                
                {node.event.day === 1 && node.index === 0 && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    ★
                  </div>
                )}
                
                {node.event.day !== events[Math.max(0, node.index - 1)]?.day && node.index > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold border-2 border-white shadow-lg">
                    Day {node.event.day}
                  </div>
                )}
              </button>

              <div 
                className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-3 py-2 shadow-lg text-center min-w-max"
                style={{ maxWidth: '150px' }}
              >
                <div className="text-sm font-bold text-gray-800 whitespace-pre-line">
                  {node.event.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {node.event.time}
                </div>
              </div>
            </div>
          );
        })}

        <div className="absolute left-0 top-0 w-32 h-32 pointer-events-none">
          <div className="relative w-full h-full">
            <div className="absolute top-8 left-8 text-6xl">🎮</div>
            <div className="absolute top-4 left-20 bg-pink-300 text-pink-800 px-3 py-1 rounded-full text-sm font-bold border-2 border-white shadow-lg">
              Start!
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <button 
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md shadow-2xl transform scale-100 animate-in"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSelectedEvent(null);
            }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-4 py-1 rounded-full text-white font-bold ${DAY_COLORS[selectedEvent.day as keyof typeof DAY_COLORS]?.node}`}>
                Day {selectedEvent.day}
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 whitespace-pre-line">
              {selectedEvent.title}
            </h2>
            <p className="text-xl text-gray-600">
              {selectedEvent.time}
            </p>
          </div>
        </button>
      )}

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg border-2 border-gray-300 z-50">
        <div className="text-sm font-bold text-gray-700">
          Progress: {Math.round(scrollProgress * 100)}%
        </div>
      </div>
    </div>
  );
}
