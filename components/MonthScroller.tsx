"use client";

import React, { useEffect, useRef } from 'react';

interface MonthScrollerProps {
  year: number;
  value: string; // format: "YYYY-MM"
  onChange: (value: string) => void;
}

export default function MonthScroller({ year, value, onChange }: MonthScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Extract month from value, default to 1 if parsing fails
  const parts = value.split('-');
  const selectedMonthNum = parts.length === 2 ? parseInt(parts[1], 10) : 1;
  
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    // Automatically scroll the selected month into the center
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(`[data-month="${selectedMonthNum}"]`) as HTMLElement;
      if (selectedEl) {
        // A small delay ensures the layout is rendered before scrolling
        setTimeout(() => {
          selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 50);
      }
    }
  }, [selectedMonthNum]);

  // Function to determine the dynamic styles based on distance from selected month
  const getStyles = (dist: number) => {
    if (dist === 0) return "bg-green-500 border-green-500 text-white shadow-lg shadow-green-600/40 font-bold scale-110 z-20";
    if (dist === 1) return "bg-green-300 border-green-300 text-white shadow-md shadow-green-500/20 scale-100 z-10";
    if (dist === 2) return "bg-green-200 border-green-200 text-green-950 scale-90 z-0";
    if (dist === 3) return "bg-green-100 border-green-100 text-green-900 scale-80 opacity-90";
    if (dist === 4) return "bg-green-50 border-green-100 text-green-800 scale-70 opacity-80";
    return "bg-white border-gray-100 text-gray-400 scale-60 opacity-60 hover:opacity-100 hover:bg-gray-50";
  };

  return (
    <div className="relative w-full py-0 overflow-hidden">
      {/* Edge Gradients for smooth fade-out */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-30 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-30 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 snap-x snap-mandatory items-center py-6 px-[calc(50%-50px)]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .flex::-webkit-scrollbar { display: none; }
        `}} />
        
        {months.map(month => {
          const dist = Math.abs(month - selectedMonthNum);
          const monthStr = month.toString().padStart(2, '0');
          const monthValue = `${year}-${monthStr}`;
          
          // formatting month name e.g., "Jan", "Feb"
          const date = new Date(year, month - 1, 1);
          const monthName = date.toLocaleString('default', { month: 'short' });

          return (
            <button
              key={month}
              data-month={month}
              onClick={() => onChange(monthValue)}
              className={`snap-center shrink-0 transition-all duration-500 ease-out border rounded-2xl px-6 py-2 w-[100px] flex flex-col items-center justify-center cursor-pointer ${getStyles(dist)}`}
            >
              <span className="text-base uppercase tracking-wider">{monthName}</span>
              <span className="text-xs mt-1 opacity-80">{year}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
