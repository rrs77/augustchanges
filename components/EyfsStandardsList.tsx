import React, { useState } from 'react';
import { Tag, Check, Hand, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface EyfsStandardsListProps {
  lessonNumber: string;
  className?: string;
}

export function EyfsStandardsList({ lessonNumber, className = '' }: EyfsStandardsListProps) {
  const { eyfsStatements, allLessonsData } = useData();
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  
  const lessonEyfsStatements = eyfsStatements[lessonNumber] || 
                              allLessonsData[lessonNumber]?.eyfsStatements || 
                              [];

  if (lessonEyfsStatements.length === 0) {
    return null; // Don't show anything if there are no standards
  }

  // Group statements by area
  const groupedStatements: Record<string, string[]> = {};
  
  lessonEyfsStatements.forEach(statement => {
    // Split by colon, but also handle emoji if present
    const colonIndex = statement.indexOf(':');
    if (colonIndex > 0) {
      const area = statement.substring(0, colonIndex).trim();
      const detail = statement.substring(colonIndex + 1).trim();
      
      if (!groupedStatements[area]) {
        groupedStatements[area] = [];
      }
      
      groupedStatements[area].push(detail);
    } else {
      // If no colon, use the whole statement
      const area = "General";
      if (!groupedStatements[area]) {
        groupedStatements[area] = [];
      }
      groupedStatements[area].push(statement);
    }
  });

  // Toggle area expansion
  const toggleArea = (area: string) => {
    setExpandedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <div className={`bg-blue-50 rounded-lg p-4 border border-blue-200 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Tag className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-900">EYFS Standards</h3>
      </div>
      
      <div className="space-y-3">
        {Object.entries(groupedStatements).map(([area, details]) => (
          <div key={area} className="bg-white rounded-lg p-3 border border-blue-100">
            <button 
              className="w-full flex items-center justify-between text-left font-medium text-blue-800 text-sm mb-2"
              onClick={() => toggleArea(area)}
            >
              <div className="flex items-center space-x-2">
                <Hand className="h-4 w-4 text-blue-600" />
                <span>{area}</span>
              </div>
              {expandedAreas.includes(area) ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </button>
            
            {expandedAreas.includes(area) && (
              <ul className="space-y-1 mt-2 pl-6">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}