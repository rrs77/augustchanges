import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, File, Printer, X, Check, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface LessonExporterProps {
  lessonNumber: string;
  onClose: () => void;
}

export function LessonExporter({ lessonNumber, onClose }: LessonExporterProps) {
  const { allLessonsData, currentSheetInfo, eyfsStatements } = useData();
  const { getCategoryColor } = useSettings();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'preview'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showEyfs, setShowEyfs] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const lessonData = allLessonsData[lessonNumber];
  const lessonEyfs = eyfsStatements[lessonNumber] || [];

  if (!lessonData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">Lesson data not found for lesson {lessonNumber}.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total duration
  const totalDuration = lessonData.totalTime;

  // Group EYFS statements by area
  const groupedEyfs: Record<string, string[]> = {};
  lessonEyfs.forEach(statement => {
    const parts = statement.split(':');
    const area = parts[0].trim();
    const detail = parts.length > 1 ? parts[1].trim() : statement;
    
    if (!groupedEyfs[area]) {
      groupedEyfs[area] = [];
    }
    
    groupedEyfs[area].push(detail);
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'pdf') {
        // Export to PDF using html2canvas to capture the styled preview
        if (previewRef.current) {
          const canvas = await html2canvas(previewRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Create PDF with proper A4 dimensions
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          // A4 dimensions: 210mm x 297mm
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // If the content is longer than one page, create additional pages
          if (imgHeight > 297) {
            let remainingHeight = imgHeight;
            let currentPosition = 0;
            
            while (remainingHeight > 0) {
              currentPosition += 297;
              remainingHeight -= 297;
              
              if (remainingHeight > 0) {
                pdf.addPage();
                pdf.addImage(
                  imgData, 
                  'PNG', 
                  0, 
                  -currentPosition, 
                  imgWidth, 
                  imgHeight
                );
              }
            }
          }
          
          // Save the PDF
          const title = lessonData.title || `Lesson ${lessonNumber}`;
          pdf.save(`${currentSheetInfo.sheet}_${title.replace(/\s+/g, '_')}.pdf`);
        }
      }
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Lesson Plan</h2>
            <p className="text-sm text-gray-600">
              {lessonData.title || `Lesson ${lessonNumber}`} - {currentSheetInfo.display}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setExportFormat('preview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  exportFormat === 'preview' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  exportFormat === 'pdf' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showEyfs}
                  onChange={() => setShowEyfs(!showEyfs)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Include EYFS Standards</span>
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:bg-blue-400"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Exporting...</span>
                  </>
                ) : exportSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Exported!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export {exportFormat.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="bg-white mx-auto shadow-md max-w-[210mm] print:shadow-none print:max-w-none"
            style={{ minHeight: '297mm' }}
          >
            {/* Lesson Plan Preview */}
            <div className="p-8 print:p-4">
              {/* Header */}
              <div className="text-center border-b-4 border-blue-500 pb-6 mb-6 relative print:pb-4 print:mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg shadow-lg mb-4">
                  <h1 className="text-3xl font-bold mb-2 print:text-2xl">
                    {currentSheetInfo.display} Lesson Plan
                  </h1>
                  <h2 className="text-2xl font-semibold mb-2 print:text-xl">
                    {lessonData.title || `Lesson ${lessonNumber}`}
                  </h2>
                  <div className="text-blue-100 font-medium text-lg">
                    Total Time: {totalDuration} minutes
                  </div>
                </div>
                
                {/* Page number - only visible when printing */}
                <div className="hidden print:block absolute top-0 right-0 text-xs text-gray-500">
                  Page <span className="pageNumber"></span>
                </div>
              </div>
              
              {/* EYFS Goals */}
              {showEyfs && lessonEyfs.length > 0 && (
                <div className="mb-8 print:mb-6 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center space-x-3 print:text-xl print:mb-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Tag className="h-6 w-6 text-white print:h-5 print:w-5" />
                    </div>
                    <span>Learning Goals</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
                    {Object.entries(groupedEyfs).map(([area, statements]) => (
                      <div key={area} className="bg-white rounded-xl p-4 border-2 border-green-100 shadow-sm print:p-3">
                        <h4 className="font-bold text-green-800 text-lg mb-3 print:text-base print:mb-2 border-b border-green-200 pb-2">{area}</h4>
                        <ul className="space-y-2">
                          {statements.map((statement, index) => (
                            <li key={index} className="flex items-start space-x-3 text-base text-gray-700 print:text-sm">
                              <span className="text-green-600 font-bold text-lg">✓</span>
                              <span className="leading-relaxed">{statement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Activities by Category */}
              {lessonData.categoryOrder.map((category) => {
                const activities = lessonData.grouped[category] || [];
                if (activities.length === 0) return null;
                
                const categoryColor = getCategoryColor(category);
                
                return (
                  <div key={category} className="mb-10 print:mb-8">
                    {/* Enhanced Category Header */}
                    <div 
                      className="text-white p-4 rounded-xl mb-6 shadow-lg print:mb-4 print:p-3"
                      style={{ 
                        background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                        borderLeft: `6px solid ${categoryColor}`
                      }}
                    >
                      <h2 className="text-2xl font-bold print:text-xl flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3 border-2 border-white"
                          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                        ></div>
                        {category}
                        <span className="ml-auto bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                        </span>
                      </h2>
                    </div>
                    
                    <div className="space-y-6 print:space-y-4">
                      {activities.map((activity, index) => (
                        <div 
                          key={`${category}-${index}`} 
                          className="bg-white rounded-xl border-2 shadow-lg overflow-hidden print:border print:rounded-lg print:mb-4"
                          style={{ 
                            borderLeftWidth: '6px',
                            borderLeftColor: categoryColor,
                            borderColor: `${categoryColor}40`
                          }}
                        >
                          {/* Activity Header */}
                          <div 
                            className="p-4 border-b-2 flex justify-between items-center print:p-3"
                            style={{ 
                              backgroundColor: `${categoryColor}10`,
                              borderBottomColor: `${categoryColor}30`
                            }}
                          >
                            <h3 className="font-bold text-gray-900 text-lg print:text-base">
                              {activity.activity}
                            </h3>
                            {activity.time > 0 && (
                              <div 
                                className="text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm print:text-xs"
                                style={{ backgroundColor: categoryColor }}
                              >
                                {activity.time} min
                              </div>
                            )}
                          </div>
                          
                          {/* Activity Content */}
                          <div className="p-4 print:p-3">
                            {/* Activity Text (if available) */}
                            {activity.activityText && (
                              <div 
                                className="mb-4 text-base text-gray-800 print:text-sm bg-blue-50 p-3 rounded-lg border border-blue-200"
                                dangerouslySetInnerHTML={{ __html: activity.activityText }}
                              />
                            )}
                            
                            {/* Description */}
                            <div 
                              className="text-base text-gray-700 leading-relaxed print:text-sm"
                              dangerouslySetInnerHTML={{ 
                                __html: activity.description.includes('<') ? 
                                  activity.description : 
                                  activity.description.replace(/\n/g, '<br>') 
                              }}
                            />
                            
                            {/* Resources */}
                            {(activity.videoLink || activity.musicLink || activity.backingLink || 
                              activity.resourceLink || activity.link || activity.vocalsLink || 
                              activity.imageLink) && (
                              <div className="mt-4 pt-4 border-t-2 border-gray-100 print:mt-3 print:pt-3">
                                <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Resources:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {activity.videoLink && (
                                    <a 
                                      href={activity.videoLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-red-600 transition-colors"
                                    >
                                      🎥 Video
                                    </a>
                                  )}
                                  {activity.musicLink && (
                                    <a 
                                      href={activity.musicLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-green-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-green-600 transition-colors"
                                    >
                                      🎵 Music
                                    </a>
                                  )}
                                  {activity.backingLink && (
                                    <a 
                                      href={activity.backingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-blue-600 transition-colors"
                                    >
                                      🎼 Backing
                                    </a>
                                  )}
                                  {activity.resourceLink && (
                                    <a 
                                      href={activity.resourceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-purple-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-purple-600 transition-colors"
                                    >
                                      📁 Resource
                                    </a>
                                  )}
                                  {activity.link && (
                                    <a 
                                      href={activity.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-gray-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-gray-600 transition-colors"
                                    >
                                      🔗 Link
                                    </a>
                                  )}
                                  {activity.vocalsLink && (
                                    <a 
                                      href={activity.vocalsLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-orange-600 transition-colors"
                                    >
                                      🎤 Vocals
                                    </a>
                                  )}
                                  {activity.imageLink && (
                                    <a 
                                      href={activity.imageLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 bg-pink-500 text-white text-sm font-bold rounded-lg shadow-md print:text-xs print:py-1 print:px-2 hover:bg-pink-600 transition-colors"
                                    >
                                      🖼️ Image
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Notes Section */}
              {lessonData.notes && (
                <div className="mt-10 pt-8 border-t-4 border-blue-500 print:mt-6 print:pt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm">
                  <h3 className="text-2xl font-bold text-blue-800 mb-4 print:text-xl print:mb-3 flex items-center">
                    <div className="bg-blue-600 p-2 rounded-lg mr-3">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    Lesson Notes
                  </h3>
                  <div 
                    className="bg-white rounded-xl p-4 text-gray-700 border-2 border-blue-200 shadow-sm print:p-3 print:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: lessonData.notes }}
                  />
                </div>
              )}
              
              {/* Enhanced Footer */}
              <div className="mt-12 pt-8 border-t-4 border-gradient-to-r from-blue-500 to-indigo-500 print:mt-8 print:pt-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg text-center">
                  <div className="flex items-center justify-center space-x-4 mb-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold">EYFS Lesson Builder</h4>
                  </div>
                  <p className="text-blue-100 text-lg font-medium mb-2">{currentSheetInfo.display}</p>
                  <p className="text-blue-200 text-sm">
                    Generated on {new Date().toLocaleDateString('en-GB', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <div className="mt-4 pt-4 border-t border-blue-400 text-xs text-blue-200">
                    All resource links are clickable in this document
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}