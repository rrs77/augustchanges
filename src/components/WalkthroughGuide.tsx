import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle, Info, BookOpen, Calendar, Edit3, FolderOpen, Tag, Search, Filter, Download, Plus, Save } from 'lucide-react';

interface WalkthroughStep {
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
}

interface WalkthroughGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalkthroughGuide({ isOpen, onClose }: WalkthroughGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipArrowPosition, setTooltipArrowPosition] = useState('top');

  // Define the walkthrough steps
  const steps: WalkthroughStep[] = [
    {
      title: 'Welcome to Curriculum Designer',
      description: 'This guide will walk you through the key features of the application. Let\'s get started!',
      target: 'body',
      position: 'top',
      icon: <Info className="h-8 w-8 text-blue-500" />
    },
    {
      title: 'Activity Library',
      description: 'Browse through all available activities. Use the search and filters to find specific activities by name, category, or level.',
      target: '[data-tab="activity-library"]',
      position: 'bottom',
      icon: <Tag className="h-8 w-8 text-pink-500" />
    },
    {
      title: 'Category Filters',
      description: 'Filter activities by category to quickly find what you need. Each category is color-coded for easy identification.',
      target: '.bg-white.bg-opacity-20.border.border-white.border-opacity-30.rounded-lg:first-of-type',
      position: 'bottom',
      icon: <Filter className="h-8 w-8 text-indigo-500" />
    },
    {
      title: 'Search Activities',
      description: 'Search for specific activities by name, description, or content. This helps you quickly find what you need.',
      target: '.pl-10.pr-4.py-2.bg-white.bg-opacity-20',
      position: 'bottom',
      icon: <Search className="h-8 w-8 text-blue-500" />
    },
    {
      title: 'Lesson Builder',
      description: 'Create and edit lesson plans by adding activities. Drag activities from the library into your lesson plan.',
      target: '[data-tab="lesson-builder"]',
      position: 'bottom',
      icon: <Edit3 className="h-8 w-8 text-green-500" />
    },
    {
      title: 'Unit Builder',
      description: 'Group lessons into units for better organization. Drag lessons to create comprehensive teaching units.',
      target: '[data-tab="unit-builder"]',
      position: 'bottom',
      icon: <FolderOpen className="h-8 w-8 text-indigo-500" />
    },
    {
      title: 'Calendar View',
      description: 'Plan your lessons across the academic year. Add units or individual lessons to specific dates.',
      target: '[data-tab="calendar"]',
      position: 'bottom',
      icon: <Calendar className="h-8 w-8 text-purple-500" />
    },
    {
      title: 'Export Options',
      description: 'Export your lesson plans as PDF or Excel documents to share with colleagues or for offline use.',
      target: '.bg-gradient-to-br.from-green-500.to-teal-600',
      position: 'bottom',
      icon: <Download className="h-8 w-8 text-green-500" />
    },
    {
      title: 'Create New Content',
      description: 'Add new activities, lessons, or units using the create buttons throughout the application.',
      target: '.bg-purple-600.hover\\:bg-purple-700',
      position: 'left',
      icon: <Plus className="h-8 w-8 text-purple-500" />
    },
    {
      title: 'Save Your Work',
      description: 'Remember to save your work regularly. Look for save buttons like this throughout the application.',
      target: '.bg-green-600.hover\\:bg-green-700',
      position: 'left',
      icon: <Save className="h-8 w-8 text-green-500" />
    },
    {
      title: 'Help Button',
      description: 'Click this button anytime to restart this walkthrough guide.',
      target: '[data-help-button]',
      position: 'left',
      icon: <HelpCircle className="h-8 w-8 text-blue-500" />
    }
  ];

  // Find and position the tooltip relative to the target element
  useEffect(() => {
    if (!isOpen) return;

    const findTargetElement = () => {
      const selector = steps[currentStep].target;
      if (selector === 'body') {
        // Center in the viewport for the welcome step
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        setTooltipPosition({
          left: viewportWidth / 2 - 200,
          top: viewportHeight / 2 - 150
        });
        setTooltipArrowPosition('none');
        setTargetElement(document.body);
        return;
      }
      
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        console.warn(`Target element not found: ${selector}`);
        return;
      }

      setTargetElement(element);
      
      // Calculate position
      const rect = element.getBoundingClientRect();
      const position = steps[currentStep].position;
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = rect.top - 220;
          left = rect.left + rect.width / 2 - 200;
          setTooltipArrowPosition('bottom');
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - 200;
          setTooltipArrowPosition('top');
          break;
        case 'left':
          top = rect.top + rect.height / 2 - 110;
          left = rect.left - 420;
          setTooltipArrowPosition('right');
          break;
        case 'right':
          top = rect.top + rect.height / 2 - 110;
          left = rect.right + 20;
          setTooltipArrowPosition('left');
          break;
      }
      
      // Ensure tooltip stays within viewport
      if (top < 10) top = 10;
      if (left < 10) left = 10;
      if (left + 400 > window.innerWidth) left = window.innerWidth - 410;
      
      setTooltipPosition({ top, left });
    };

    // Find target element on step change
    findTargetElement();
    
    // Add resize listener
    window.addEventListener('resize', findTargetElement);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', findTargetElement);
    };
  }, [isOpen, currentStep, steps]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Render the tooltip
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Tooltip */}
      <div 
        className="absolute bg-white rounded-xl shadow-xl w-[400px] p-6 pointer-events-auto transition-all duration-300 animate-bounce-in"
        style={{ 
          top: tooltipPosition.top, 
          left: tooltipPosition.left,
        }}
      >
        {/* Step indicator */}
        <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
          Step {currentStep + 1} of {steps.length}
        </div>
        
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Tooltip content */}
        <div className="mt-6 mb-6 flex items-start space-x-4">
          <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
            {steps[currentStep].icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">{steps[currentStep].title}</h3>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          {currentStep > 0 ? (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous</span>
            </button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>{currentStep < steps.length - 1 ? 'Next' : 'Finish'}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tooltip arrow */}
        {tooltipArrowPosition !== 'none' && (
          <div 
            className={`absolute w-6 h-6 bg-white transform rotate-45 ${
              tooltipArrowPosition === 'top' ? 'top-[-12px]' : 
              tooltipArrowPosition === 'bottom' ? 'bottom-[-12px]' : 
              tooltipArrowPosition === 'left' ? 'left-[-12px]' : 
              'right-[-12px]'
            }`}
            style={{
              left: tooltipArrowPosition === 'top' || tooltipArrowPosition === 'bottom' ? 'calc(50% - 12px)' : undefined,
              top: tooltipArrowPosition === 'left' || tooltipArrowPosition === 'right' ? 'calc(50% - 12px)' : undefined
            }}
          />
        )}
      </div>
    </div>
  );
}