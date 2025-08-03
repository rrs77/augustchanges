import React from 'react';
import { Calendar, BookOpen, ChevronRight, CheckCircle } from 'lucide-react';

interface HalfTermCardProps {
  id: string;
  name: string;
  months: string;
  color: string;
  lessonCount: number;
  onClick: () => void;
  isComplete: boolean;
}

export function HalfTermCard({
  id,
  name,
  months,
  color,
  lessonCount,
  onClick,
  isComplete
}: HalfTermCardProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer ${
        isComplete ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {/* Colorful Header */}
      <div 
        className="p-6 text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` 
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold">
              {name}
            </h3>
            <ChevronRight className="h-6 w-6 transition-transform duration-300" />
          </div>
          
          <p className="text-white text-opacity-90 text-sm font-medium">
            {months}
          </p>

          <div className="flex items-center space-x-6 text-white text-opacity-90 mt-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">
                {lessonCount > 0 ? `${lessonCount} lessons` : 'No lessons assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview of Lessons */}
      {isComplete && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600 flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Half-term complete</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}