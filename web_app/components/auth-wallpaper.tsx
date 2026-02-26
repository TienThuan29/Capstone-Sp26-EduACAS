"use client";

import React from "react";
import Image from "next/image";

export default function AuthWallpaper() {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-[#1F4E79] via-[#2a5a8a] to-[#C9A24D] overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1F4E79]/90 via-[#2a5a8a]/80 to-[#C9A24D]/90 animate-pulse" style={{ animationDuration: '4s' }} />
      
      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#C9A24D]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      
      {/* Floating code symbols */}
      <div className="absolute top-1/4 left-1/4 text-6xl text-white/20 font-mono animate-bounce" style={{ animationDuration: '3s' }}>
        {"{ }"}
      </div>
      <div className="absolute top-1/3 right-1/4 text-5xl text-white/20 font-mono animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
        {"</>"}
      </div>
      <div className="absolute bottom-1/3 left-1/3 text-4xl text-white/20 font-mono animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
        {"[ ]"}
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-12 max-w-2xl">
        <div className="mb-8">
          <div className="inline-block p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/30 mb-6">
            <Image 
              src="/images/Edu-ACAS logo.png" 
              alt="Edu-ACAS Logo" 
              width={240}
              height={96}
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-white mb-6">
          <span className="inline-block hover:scale-110 transition-transform">Edu</span>
          <span className="inline-block hover:scale-110 transition-transform text-[#C9A24D]">-ACAS</span>
        </h1>
        
        <p className="text-xl text-white/90 mb-4 leading-relaxed">
          Professional Programming Learning Platform
        </p>
        
        <p className="text-lg text-white/70 leading-relaxed">
          Connect teachers and students in teaching, learning and practicing programming languages
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-12">
          {[
            { number: "4+", label: "Programming Languages" },
            { number: "∞", label: "Exercises" },
            { number: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold font-mono text-[#C9A24D] mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-white/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
