import React from 'react';

const Fireworks = ({ count = 50, colorClass = 'bg-amber-400' }) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(
      React.createElement('div', {
        key: i,
        className: `firework-particle ${colorClass}`,
        style: {
          '--i': i,
          transform: `rotate(${Math.random() * 360}deg) translateY(${Math.random() * -15}px)`,
          animationDelay: `${Math.random() * 0.2}s`,
        }
      })
    );
  }

  return React.createElement('div', {
    className: 'absolute inset-0 flex items-center justify-center pointer-events-none z-10'
  }, ...particles);
};

export default Fireworks;
