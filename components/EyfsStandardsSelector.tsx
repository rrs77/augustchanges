import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Search, Tag, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface EyfsStandardsSelectorProps {
  lessonNumber: string;
  className?: string;
}

export function EyfsStandardsSelector({ lessonNumber, className = '' }: EyfsStandardsSelectorProps) {
  const { allEyfsStatements, eyfsStatements, addEyfsToLesson, removeEyfsFromLesson } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const lessonEyfsStatements = eyfsStatements[lessonNumber] || [];

  const filteredStatements = allEyfsStatements.filter(statement => 
    statement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group statements by area for better organization
  const groupedStatements: Record<string, string[]> = {};
  
  filteredStatements.forEach(statement => {
    // Split by colon, but also handle emoji if present
    const colonIndex = statement.indexOf(':');
    if (colonIndex > 0) {
      const area = statement.substring(0, colonIndex).trim();
      
      if (!groupedStatements[area]) {
        groupedStatements[area] = [];
      }
      
      groupedStatements[area].push(statement);
    } else {
      // If no colon, use the whole statement
      const area = "General";
      if (!groupedStatements[area]) {
        groupedStatements[area] = [];
      }
      groupedStatements[area].push(statement);
    }
  });

  const handleToggleStatement = (statement: string) => {
    if (lessonEyfsStatements.includes(statement)) {
      removeEyfsFromLesson(lessonNumber, statement);
    } else {
      addEyfsToLesson(lessonNumber, statement);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            EYFS Standards {lessonEyfsStatements.length > 0 && `(${lessonEyfsStatements.length})`}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-2 w-full bg-white rounded-lg shadow-xl border border-blue-200 overflow-hidden">
          <div className="p-3 border-b border-blue-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search EYFS standards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                dir="ltr"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            {Object.keys(groupedStatements).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No EYFS standards match your search
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedStatements).map(([area, statements]) => (
                  <div key={area} className="bg-gray-50 rounded-lg p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-1 px-2">{area}</h4>
                    <div className="space-y-1">
                      {statements.map((statement) => {
                        // Extract the part after the colon for display
                        const displayText = statement.includes(':') 
                          ? statement.split(':')[1].trim() 
                          : statement;
                          
                        return (
                          <div
                            key={statement}
                            className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
                            onClick={() => handleToggleStatement(statement)}
                          >
                            <div className={`w-5 h-5 flex-shrink-0 rounded border ${
                              lessonEyfsStatements.includes(statement)
                                ? 'bg-blue-600 border-blue-600 flex items-center justify-center'
                                : 'border-gray-300'
                            }`}>
                              {lessonEyfsStatements.includes(statement) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm text-gray-700" dir="ltr">{displayText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-blue-100 bg-blue-50">
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-700">
                {lessonEyfsStatements.length} standards selected
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Standards Preview */}
      {lessonEyfsStatements.length > 0 && !isOpen && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex flex-wrap gap-1">
            {lessonEyfsStatements.map((statement) => {
              // Extract the part after the colon for display
              const displayText = statement.includes(':') 
                ? statement.split(':')[1].trim() 
                : statement;
                
              return (
                <div
                  key={statement}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  <span className="truncate max-w-[200px]" dir="ltr">{displayText}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEyfsFromLesson(lessonNumber, statement);
                    }}
                    className="hover:text-blue-900 p-0.5 hover:bg-blue-200 rounded-full transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}