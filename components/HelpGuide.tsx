import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle, Info, BookOpen, Calendar, Edit3, FolderOpen, Tag, Search, Filter, Download, Plus, Save, Check, Clock, Users } from 'lucide-react';

interface GuideStep {
  title: string;
  content: React.ReactNode;
  image?: string;
  highlightSelector?: string;
}

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: 'activity' | 'lesson' | 'unit' | 'assign';
}

export function HelpGuide({ isOpen, onClose, initialSection }: HelpGuideProps) {
  const [activeSection, setActiveSection] = useState<'activity' | 'lesson' | 'unit' | 'assign'>(initialSection || 'activity');
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipArrowPosition, setTooltipArrowPosition] = useState('top');
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Define guide steps for each section
  const activitySteps: GuideStep[] = [
    {
      title: "Creating a New Activity",
      content: (
        <div className="space-y-2">
          <p>Start by navigating to the <strong>Activity Library</strong> tab in the main navigation.</p>
          <p>Click the <strong>Create Activity</strong> button at the top of the page.</p>
        </div>
      ),
      highlightSelector: '[data-tab="activity-library"]'
    },
    {
      title: "Fill in Activity Details",
      content: (
        <div className="space-y-2">
          <p>Enter a descriptive <strong>Activity Name</strong>.</p>
          <p>Select the appropriate <strong>Category</strong> from the dropdown menu.</p>
          <p>Choose the <strong>Level</strong> (year group or All).</p>
          <p>Set the <strong>Duration</strong> in minutes.</p>
        </div>
      )
    },
    {
      title: "Add Activity Content",
      content: (
        <div className="space-y-2">
          <p>Use the rich text editor to add detailed <strong>Activity</strong> instructions.</p>
          <p>Format text using the toolbar (bold, italic, lists, etc.).</p>
          <p>Add a more detailed <strong>Description</strong> if needed.</p>
        </div>
      )
    },
    {
      title: "Add Resources",
      content: (
        <div className="space-y-2">
          <p>Add links to external resources:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Video links</li>
            <li>Music files</li>
            <li>Backing tracks</li>
            <li>Teaching resources</li>
            <li>Images</li>
          </ul>
          <p>These will be available when viewing the activity.</p>
        </div>
      )
    },
    {
      title: "Save Your Activity",
      content: (
        <div className="space-y-2">
          <p>Review all information for accuracy.</p>
          <p>Click the <strong>Create Activity</strong> button at the bottom of the form.</p>
          <p>Your new activity will now appear in the Activity Library and can be used in lesson plans.</p>
        </div>
      )
    }
  ];

  const lessonSteps: GuideStep[] = [
    {
      title: "Creating a New Lesson",
      content: (
        <div className="space-y-2">
          <p>Navigate to the <strong>Lesson Builder</strong> tab in the main navigation.</p>
          <p>You'll see a blank lesson template ready to be filled.</p>
        </div>
      ),
      highlightSelector: '[data-tab="lesson-builder"]'
    },
    {
      title: "Set Lesson Details",
      content: (
        <div className="space-y-2">
          <p>Enter a descriptive <strong>Lesson Title</strong> at the top.</p>
          <p>Set the <strong>Week Number</strong> for curriculum planning.</p>
          <p>Select the appropriate <strong>Term</strong> (Autumn, Spring, Summer).</p>
        </div>
      )
    },
    {
      title: "Add Activities to Your Lesson",
      content: (
        <div className="space-y-2">
          <p>Browse the <strong>Activity Library</strong> panel on the right.</p>
          <p>You can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Drag activities directly into your lesson plan</li>
            <li>Select multiple activities and click "Add Selected"</li>
            <li>Filter activities by category or search for specific ones</li>
          </ul>
        </div>
      )
    },
    {
      title: "Organize Your Lesson",
      content: (
        <div className="space-y-2">
          <p>Activities are automatically grouped by category.</p>
          <p>Drag activities to reorder them within your lesson.</p>
          <p>Remove activities by clicking the trash icon that appears on hover.</p>
          <p>The total lesson duration updates automatically based on activities.</p>
        </div>
      )
    },
    {
      title: "Add Lesson Notes",
      content: (
        <div className="space-y-2">
          <p>Use the <strong>Lesson Notes</strong> section at the bottom to add:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Teaching tips</li>
            <li>Required materials</li>
            <li>Learning objectives</li>
            <li>Assessment notes</li>
          </ul>
          <p>You can use the rich text editor for formatting.</p>
        </div>
      )
    },
    {
      title: "Save Your Lesson",
      content: (
        <div className="space-y-2">
          <p>Click the <strong>Save Plan</strong> button to store your lesson.</p>
          <p>Or use <strong>Save & New</strong> to create another lesson immediately.</p>
          <p>Your lesson is now ready to be used or added to a unit.</p>
        </div>
      )
    }
  ];

  const unitSteps: GuideStep[] = [
    {
      title: "Creating a New Unit",
      content: (
        <div className="space-y-2">
          <p>Navigate to the <strong>Unit Builder</strong> tab in the main navigation.</p>
          <p>Click the <strong>Create New</strong> button to start a fresh unit.</p>
        </div>
      ),
      highlightSelector: '[data-tab="unit-builder"]'
    },
    {
      title: "Set Unit Details",
      content: (
        <div className="space-y-2">
          <p>Enter a descriptive <strong>Unit Name</strong> at the top.</p>
          <p>Select the appropriate <strong>Term</strong> (Autumn 1/2, Spring 1/2, Summer 1/2).</p>
          <p>Add a detailed <strong>Unit Description</strong> in the text area below.</p>
        </div>
      )
    },
    {
      title: "Select Lessons for Your Unit",
      content: (
        <div className="space-y-2">
          <p>Browse the <strong>Available Lessons</strong> panel in the middle.</p>
          <p>You can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Click individual lessons to select them</li>
            <li>Use the search box to find specific lessons</li>
            <li>Filter by term to narrow down options</li>
            <li>Click "Select All" to choose all filtered lessons</li>
          </ul>
          <p>Click <strong>Add Selected Lessons</strong> to include them in your unit.</p>
        </div>
      )
    },
    {
      title: "Organize Your Unit",
      content: (
        <div className="space-y-2">
          <p>In the <strong>Unit Contents</strong> panel, you can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reorder lessons using the up/down arrows</li>
            <li>Remove lessons by clicking the trash icon</li>
            <li>See a summary of each lesson's content</li>
          </ul>
          <p>The order of lessons determines how they'll be scheduled.</p>
        </div>
      )
    },
    {
      title: "Save Your Unit",
      content: (
        <div className="space-y-2">
          <p>Click the <strong>Save Unit</strong> button to store your unit.</p>
          <p>Your unit will appear in the <strong>Your Units</strong> panel on the right.</p>
          <p>You can now assign this unit to specific dates in the calendar.</p>
        </div>
      )
    }
  ];

  const assignSteps: GuideStep[] = [
    {
      title: "Assigning Units to Half-Terms",
      content: (
        <div className="space-y-2">
          <p>Navigate to the <strong>Calendar</strong> tab in the main navigation.</p>
          <p>This view shows your academic year divided into weeks.</p>
        </div>
      ),
      highlightSelector: '[data-tab="calendar"]'
    },
    {
      title: "Select a Unit to Assign",
      content: (
        <div className="space-y-2">
          <p>In the <strong>Your Units</strong> panel, find the unit you want to schedule.</p>
          <p>Click the <strong>Calendar</strong> icon next to the unit.</p>
          <p>This will open the "Add Unit to Calendar" dialog.</p>
        </div>
      )
    },
    {
      title: "Choose a Start Date",
      content: (
        <div className="space-y-2">
          <p>In the dialog, select a <strong>Start Date</strong> for your unit.</p>
          <p>This is the date when the first lesson in the unit will be scheduled.</p>
          <p>Subsequent lessons will be scheduled on following days.</p>
        </div>
      )
    },
    {
      title: "Confirm Half-Term Assignment",
      content: (
        <div className="space-y-2">
          <p>The system will automatically identify which half-term your dates fall into:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>A1</strong>: Autumn 1 (Sep-Oct)</li>
            <li><strong>A2</strong>: Autumn 2 (Nov-Dec)</li>
            <li><strong>SP1</strong>: Spring 1 (Jan-Feb)</li>
            <li><strong>SP2</strong>: Spring 2 (Mar-Apr)</li>
            <li><strong>SM1</strong>: Summer 1 (Apr-May)</li>
            <li><strong>SM2</strong>: Summer 2 (Jun-Jul)</li>
          </ul>
        </div>
      )
    },
    {
      title: "Add to Calendar",
      content: (
        <div className="space-y-2">
          <p>Click the <strong>Add to Calendar</strong> button to confirm.</p>
          <p>The system will create lesson plans for each lesson in your unit, starting from the selected date.</p>
          <p>These will appear on your calendar view, color-coded by unit.</p>
        </div>
      )
    },
    {
      title: "Managing Scheduled Units",
      content: (
        <div className="space-y-2">
          <p>Once scheduled, you can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Click on any date to view or edit scheduled lessons</li>
            <li>Filter the calendar by unit using the dropdown at the top</li>
            <li>Edit individual lesson details by clicking on them</li>
            <li>Reschedule lessons by editing their date</li>
          </ul>
        </div>
      )
    }
  ];

  // Get the current steps based on active section
  const getCurrentSteps = () => {
    switch (activeSection) {
      case 'activity':
        return activitySteps;
      case 'lesson':
        return lessonSteps;
      case 'unit':
        return unitSteps;
      case 'assign':
        return assignSteps;
      default:
        return activitySteps;
    }
  };

  const currentSteps = getCurrentSteps();

  // Handle highlighting elements
  useEffect(() => {
    if (!isOpen) return;

    const steps = getCurrentSteps();
    const currentStepData = steps[currentStep];
    
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('highlight-pulse');
      highlightedElement.classList.remove('ring-4');
      highlightedElement.classList.remove('ring-blue-500');
      highlightedElement.classList.remove('ring-opacity-70');
      highlightedElement.classList.remove('z-40');
    }
    
    // Add highlight to new element
    if (currentStepData.highlightSelector) {
      const element = document.querySelector(currentStepData.highlightSelector) as HTMLElement;
      if (element) {
        element.classList.add('highlight-pulse');
        element.classList.add('ring-4');
        element.classList.add('ring-blue-500');
        element.classList.add('ring-opacity-70');
        element.classList.add('z-40');
        setHighlightedElement(element);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return () => {
      // Clean up on unmount
      if (highlightedElement) {
        highlightedElement.classList.remove('highlight-pulse');
        highlightedElement.classList.remove('ring-4');
        highlightedElement.classList.remove('ring-blue-500');
        highlightedElement.classList.remove('ring-opacity-70');
        highlightedElement.classList.remove('z-40');
      }
    };
  }, [isOpen, activeSection, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // If we're at the last step, move to the next section or close
      if (activeSection === 'activity') {
        setActiveSection('lesson');
        setCurrentStep(0);
      } else if (activeSection === 'lesson') {
        setActiveSection('unit');
        setCurrentStep(0);
      } else if (activeSection === 'unit') {
        setActiveSection('assign');
        setCurrentStep(0);
      } else {
        // We're at the end of the last section
        onClose();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // If we're at the first step, move to the previous section
      if (activeSection === 'lesson') {
        setActiveSection('activity');
        setCurrentStep(activitySteps.length - 1);
      } else if (activeSection === 'unit') {
        setActiveSection('lesson');
        setCurrentStep(lessonSteps.length - 1);
      } else if (activeSection === 'assign') {
        setActiveSection('unit');
        setCurrentStep(unitSteps.length - 1);
      }
    }
  };

  const getSectionIcon = (section: 'activity' | 'lesson' | 'unit' | 'assign') => {
    switch (section) {
      case 'activity':
        return <Tag className="h-5 w-5" />;
      case 'lesson':
        return <Edit3 className="h-5 w-5" />;
      case 'unit':
        return <FolderOpen className="h-5 w-5" />;
      case 'assign':
        return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <style jsx>{`
        .modal-bounce {
          animation: modalBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes modalBounce {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${
        isAnimating ? 'modal-bounce' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Curriculum Designer Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => { setActiveSection('activity'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'activity' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>1. Create Activity</span>
          </button>
          <button
            onClick={() => { setActiveSection('lesson'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'lesson' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>2. Create Lesson</span>
          </button>
          <button
            onClick={() => { setActiveSection('unit'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'unit' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>3. Create Unit</span>
          </button>
          <button
            onClick={() => { setActiveSection('assign'); setCurrentStep(0); }}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors duration-200 ${
              activeSection === 'assign' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>4. Assign to Half-Term</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Section Title */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                {getSectionIcon(activeSection)}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {activeSection === 'activity' && 'Creating Activities'}
                {activeSection === 'lesson' && 'Building Lessons'}
                {activeSection === 'unit' && 'Managing Units'}
                {activeSection === 'assign' && 'Assigning to Half-Terms'}
              </h3>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {currentSteps[currentStep].title}
              </h4>
              <div className="prose max-w-none">
                {currentSteps[currentStep].content}
              </div>
              
              {/* Step Image (if available) */}
              {currentSteps[currentStep].image && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={currentSteps[currentStep].image} 
                    alt={currentSteps[currentStep].title}
                    className="w-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {currentSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
              (currentStep > 0 || activeSection !== 'activity')
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={currentStep === 0 && activeSection === 'activity'}
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {currentSteps.length}
          </div>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>{currentStep < currentSteps.length - 1 || activeSection !== 'assign' ? 'Next' : 'Finish'}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}