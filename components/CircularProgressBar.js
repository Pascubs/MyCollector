import React from 'react';

const CircularProgressBar = ({ percentage, size = 160, strokeWidth = 16, progressColorClass = 'text-blue-800 dark:text-blue-500' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const textSizeClass = size >= 150 ? 'text-3xl' : size >= 120 ? 'text-2xl' : 'text-xl';

  return React.createElement('div', {
    className: 'relative inline-flex items-center justify-center',
    style: { width: size, height: size }
  },
    React.createElement('svg', { width: size, height: size, className: 'transform -rotate-90' },
      React.createElement('circle', {
        className: 'text-slate-200 dark:text-slate-700',
        stroke: 'currentColor',
        strokeWidth: strokeWidth,
        fill: 'transparent',
        r: radius,
        cx: size / 2,
        cy: size / 2
      }),
      React.createElement('circle', {
        className: `${progressColorClass} transition-all duration-500 ease-out`,
        stroke: 'currentColor',
        strokeWidth: strokeWidth,
        strokeDasharray: circumference,
        strokeDashoffset: offset,
        strokeLinecap: 'round',
        fill: 'transparent',
        r: radius,
        cx: size / 2,
        cy: size / 2,
        role: 'progressbar',
        'aria-valuenow': percentage,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': `Collection completion: ${percentage.toFixed(0)}%`
      })
    ),
    React.createElement('span', {
      className: `absolute flex items-center justify-center font-cuphead-title ${textSizeClass} text-slate-700 dark:text-slate-200`
    },
      `${percentage.toFixed(0)}%`
    )
  );
};

export default CircularProgressBar;
