import React from 'react';

interface NomadicLexIconProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const NomadicLexIcon: React.FC<NomadicLexIconProps> = ({ 
  size = 64, 
  className = '',
  showText = true 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Navy Squircle Background Gradient */}
        <linearGradient id="nlNavyBg" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#14243F" />
          <stop offset="40%" stopColor="#0F1C32" />
          <stop offset="100%" stopColor="#08101E" />
        </linearGradient>

        {/* Squircle Hairline Border Gradient */}
        <linearGradient id="nlBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
          <stop offset="50%" stopColor="rgba(212, 175, 55, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
        </linearGradient>

        {/* Polished Gold Highlight (Light Face of Needle & Rings) */}
        <linearGradient id="nlGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="45%" stopColor="#F5D061" />
          <stop offset="100%" stopColor="#D4A72C" />
        </linearGradient>

        {/* Deep Bronze Gold (Dark Face of Needle & Shading) */}
        <linearGradient id="nlGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A72C" />
          <stop offset="50%" stopColor="#A87B15" />
          <stop offset="100%" stopColor="#755005" />
        </linearGradient>

        {/* Outer Ring Gold Gradient */}
        <linearGradient id="nlRingGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFECA0" />
          <stop offset="50%" stopColor="#E2B743" />
          <stop offset="100%" stopColor="#AD8018" />
        </linearGradient>

        {/* Subtle Glow Filter */}
        <filter id="nlGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.6)" />
        </filter>
      </defs>

      <g filter="url(#nlGoldGlow)">
        {/* Cardinal Arrow Points (North, South, East, West) */}
        <polygon points="120,33 114,48 126,48" fill="url(#nlGoldLight)" />
        <polygon points="120,175 114,161 126,161" fill="url(#nlGoldDark)" />
        <polygon points="191,105 177,99 177,111" fill="url(#nlGoldLight)" />
        <polygon points="49,105 63,99 63,111" fill="url(#nlGoldDark)" />

        {/* Outer Circular Ring */}
        <circle
          cx="120"
          cy="105"
          r="63"
          stroke="url(#nlRingGrad)"
          strokeWidth="3.2"
          fill="none"
        />

        {/* Inner Circular Ring */}
        <circle
          cx="120"
          cy="105"
          r="54"
          stroke="url(#nlRingGrad)"
          strokeWidth="1.8"
          fill="none"
          strokeDasharray="4 3"
        />

        {/* Degree Ticks around the Compass Ring */}
        {[0, 30, 60, 120, 150, 180, 210, 240, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 120 + 55 * Math.cos(rad);
          const y1 = 105 + 55 * Math.sin(rad);
          const x2 = 120 + 62 * Math.cos(rad);
          const y2 = 105 + 62 * Math.sin(rad);
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#nlGoldLight)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* North 'N' Symbol at 12 o'clock */}
        <text
          x="120"
          y="62"
          fill="url(#nlGoldLight)"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          dominantBaseline="central"
        >
          N
        </text>

        {/* Laurel Leaves along the branch */}
        <path
          d="M 112 165 C 72 155 58 115 72 70"
          stroke="url(#nlGoldLight)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M 69 74 Q 63 68 62 62 Q 68 67 71 72 Z" fill="url(#nlGoldLight)" />
        <path d="M 72 75 Q 76 68 81 65 Q 78 72 74 76 Z" fill="url(#nlGoldDark)" />
        <path d="M 64 88 Q 56 84 53 78 Q 60 81 65 86 Z" fill="url(#nlGoldLight)" />
        <path d="M 66 89 Q 71 83 77 81 Q 72 87 68 91 Z" fill="url(#nlGoldDark)" />
        <path d="M 61 104 Q 52 101 48 95 Q 56 97 62 102 Z" fill="url(#nlGoldLight)" />
        <path d="M 64 105 Q 69 100 76 99 Q 70 104 65 107 Z" fill="url(#nlGoldDark)" />
        <path d="M 64 120 Q 55 119 50 114 Q 58 115 64 118 Z" fill="url(#nlGoldLight)" />
        <path d="M 66 121 Q 72 118 78 119 Q 72 122 67 124 Z" fill="url(#nlGoldDark)" />
        <path d="M 71 136 Q 63 138 58 135 Q 65 133 72 134 Z" fill="url(#nlGoldLight)" />
        <path d="M 73 137 Q 80 137 86 140 Q 79 141 74 140 Z" fill="url(#nlGoldDark)" />
        <path d="M 83 150 Q 75 154 70 152 Q 78 149 84 148 Z" fill="url(#nlGoldLight)" />
        <path d="M 98 160 Q 91 166 85 165 Q 93 160 99 158 Z" fill="url(#nlGoldLight)" />

        {/* Open Law Book */}
        <path
          d="M 120 132 C 108 128 92 126 79 130 L 79 90 C 94 86 109 88 120 94 Z"
          fill="rgba(9, 19, 36, 0.85)"
          stroke="url(#nlGoldLight)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M 83 93 C 96 90 108 92 118 97 L 118 128 C 108 124 96 123 83 126 Z"
          fill="none"
          stroke="url(#nlGoldLight)"
          strokeWidth="1.2"
          opacity="0.8"
        />

        <path
          d="M 120 132 C 132 128 148 126 161 130 L 161 90 C 146 86 131 88 120 94 Z"
          fill="rgba(9, 19, 36, 0.85)"
          stroke="url(#nlGoldLight)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M 157 93 C 144 90 132 92 122 97 L 122 128 C 132 124 144 123 157 126 Z"
          fill="none"
          stroke="url(#nlGoldLight)"
          strokeWidth="1.2"
          opacity="0.8"
        />

        <line
          x1="120"
          y1="94"
          x2="120"
          y2="135"
          stroke="url(#nlGoldLight)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 120 135 L 117 144 L 120 142 L 123 144 Z"
          fill="url(#nlGoldLight)"
        />

        {/* Needle Top Right Head */}
        <polygon
          points="120,105 186,40 148,60"
          fill="url(#nlGoldLight)"
        />
        <polygon
          points="120,105 186,40 167,79"
          fill="url(#nlGoldDark)"
        />
        <polygon
          points="186,40 156,53 162,71"
          fill="url(#nlGoldLight)"
          opacity="0.3"
        />

        {/* Needle Bottom Left Point */}
        <polygon
          points="120,105 72,153 92,132"
          fill="url(#nlGoldLight)"
        />
        <polygon
          points="120,105 72,153 75,142"
          fill="url(#nlGoldDark)"
        />

        {/* Center Needle Pivot Jewel */}
        <circle cx="120" cy="105" r="5" fill="#0C1B33" stroke="url(#nlGoldLight)" strokeWidth="2" />
        <circle cx="120" cy="105" r="2.2" fill="url(#nlGoldLight)" />
      </g>

      {/* Wordmark at the bottom */}
      {showText && (
        <text
          x="120"
          y="204"
          fill="#FFFFFF"
          fontFamily="'Cinzel', 'Plus Jakarta Sans', -apple-system, serif"
          fontSize="17.5"
          fontWeight="700"
          letterSpacing="3.5"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ textTransform: 'uppercase' }}
        >
          NOMADIC LEX
        </text>
      )}
    </svg>
  );
};
