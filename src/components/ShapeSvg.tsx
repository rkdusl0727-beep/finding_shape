import React from 'react';

interface ShapeSvgProps {
  shapeId: string;
  size?: number;
  color?: string;
  isGhost?: boolean;
  className?: string;
}

export const ShapeSvg: React.FC<ShapeSvgProps> = ({
  shapeId,
  size = 48,
  color = '#e74c3c',
  isGhost = false,
  className = '',
}) => {
  // Common SVG styling for children's cartoon vector style with thin sharp matching stroke
  const getStrokeColor = (fillColor: string) => {
    switch (fillColor.toLowerCase()) {
      case '#e74c3c': return '#c0392b'; // Darker red
      case '#3498db': return '#2980b9'; // Darker blue
      case '#27ae60': return '#1e8449'; // Darker green
      case '#9b59b6': return '#7d3c98'; // Darker purple
      case '#e67e22': return '#b9770e'; // Darker orange
      case '#1abc9c': return '#117a65'; // Darker teal
      case '#f39c12': return '#b9770e'; // Darker yellow/orange
      case '#e91e63': return '#ad1457'; // Darker pink
      default: return 'rgba(0,0,0,0.25)';
    }
  };

  const strokeColor = isGhost ? '#e2d3bb' : 'none';
  const strokeWidth = isGhost ? 6 : 0; // No border/stroke for filled vector shapes


  const renderPath = () => {
    switch (shapeId) {
      case 'circle':
        return (
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
          />
        );
      case 'triangle':
        return (
          <polygon
            points="50,14 86,84 14,84"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'square':
        return (
          <rect
            x="16"
            y="16"
            width="68"
            height="68"
            rx="8"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'oval':
        return (
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="28"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'semicircle':
        // Half circle facing upwards/dome-shaped
        return (
          <path
            d="M 14,64 A 36,36 0 0,1 86,64 Z"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'diamond':
        return (
          <polygon
            points="50,14 86,50 50,86 14,50"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'trapezoid':
        return (
          <polygon
            points="28,22 72,22 86,78 14,78"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'pentagon':
        return (
          <polygon
            points="50,14 84,39 71,81 29,81 16,39"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'hexagon':
        return (
          <polygon
            points="50,14 82,32 82,68 50,86 18,68 18,32"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'star':
        return (
          <polygon
            points="50,12 61,37 88,37 66,54 74,80 50,64 26,80 34,54 12,37 39,37"
            fill={isGhost ? 'none' : color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isGhost ? '5 5' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      default:
        return (
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={color}
            stroke={isGhost ? '#e2d3bb' : strokeColor}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{ overflow: 'visible' }}
      shapeRendering="geometricPrecision"
    >
      {renderPath()}
    </svg>
  );
};
