import React from 'react';
import { motion } from 'framer-motion';

const GridSquare = ({ index }) => {
  const delay = (index % 20) * 0.05; // Stagger animation

  return (
    <motion.div
      className="grid-square"
      initial={{ opacity: 0.1 }}
      animate={{ opacity: 0.1 }}
      whileHover={{ 
        backgroundColor: '#3b82f6',
        opacity: 0.3,
        scale: 1.1,
        transition: { duration: 0.2 } 
      }}
      transition={{
        delay,
        duration: 0.5
      }}
    />
  );
};

const InteractiveBackground = () => {
  return (
    <div className="interactive-bg">
      <div className="grid-container">
        {[...Array(300)].map((_, index) => (
          <GridSquare key={index} index={index} />
        ))}
      </div>
      
      {/* Floating particles */}
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            animate={{
              y: [-20, -100, -20],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 20,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveBackground;
