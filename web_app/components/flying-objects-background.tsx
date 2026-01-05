"use client";

import React from "react";

export default function FlyingObjectsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(20px) rotate(-5deg);
          }
        }
        
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100vw);
          }
        }
      `}</style>
      
      {/* Floating circles */}
      <div 
        className="absolute top-20 left-10 w-16 h-16 rounded-full bg-[#1F4E79]/10 dark:bg-[#C9A24D]/10"
        style={{ animation: 'float 6s ease-in-out infinite' }}
      />
      <div 
        className="absolute top-40 right-20 w-12 h-12 rounded-full bg-[#C9A24D]/10 dark:bg-[#1F4E79]/10"
        style={{ animation: 'floatReverse 5s ease-in-out infinite', animationDelay: '1s' }}
      />
      <div 
        className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full bg-[#1F4E79]/5 dark:bg-[#C9A24D]/5"
        style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '2s' }}
      />
      <div 
        className="absolute bottom-20 right-1/3 w-14 h-14 rounded-full bg-[#C9A24D]/10 dark:bg-[#1F4E79]/10"
        style={{ animation: 'floatReverse 6s ease-in-out infinite', animationDelay: '0.5s' }}
      />
      
      {/* Floating code symbols */}
      <div 
        className="absolute top-1/4 left-1/4 text-4xl opacity-5 font-mono text-[#1F4E79] dark:text-[#C9A24D]"
        style={{ animation: 'float 8s ease-in-out infinite' }}
      >
        {"{ }"}
      </div>
      <div 
        className="absolute top-1/3 right-1/4 text-3xl opacity-5 font-mono text-[#C9A24D] dark:text-[#1F4E79]"
        style={{ animation: 'floatReverse 7s ease-in-out infinite', animationDelay: '1.5s' }}
      >
        {"</>"}
      </div>
      <div 
        className="absolute bottom-1/3 left-1/3 text-3xl opacity-5 font-mono text-[#1F4E79] dark:text-[#C9A24D]"
        style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '3s' }}
      >
        {"[ ]"}
      </div>
      <div 
        className="absolute bottom-1/4 right-1/3 text-4xl opacity-5 font-mono text-[#C9A24D] dark:text-[#1F4E79]"
        style={{ animation: 'floatReverse 9s ease-in-out infinite', animationDelay: '2s' }}
      >
        {"()"}
      </div>
      
      {/* Gradient orbs */}
      <div 
        className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-10 blur-2xl"
        style={{ 
          background: 'radial-gradient(circle, #C9A24D 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute bottom-10 left-10 w-40 h-40 rounded-full opacity-10 blur-2xl"
        style={{ 
          background: 'radial-gradient(circle, #1F4E79 0%, transparent 70%)',
          animation: 'floatReverse 12s ease-in-out infinite',
          animationDelay: '2s'
        }}
      />
    </div>
  );
}
