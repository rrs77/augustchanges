import React, { useState, useRef } from 'react';
import { Download, X, Check, Tag, ChevronDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';

interface LessonPrintModalProps {
  lessonNumber?: string;
  onClose: () => void;
  halfTermId?: string;
  halfTermName?: string;
  unitId?: string;
  unitName?: string;
  lessonNumbers?: string[];
  isUnitPrint?: boolean;
}

export function LessonPrintModal({
                                   lessonNumber,
                                   onClose,
                                   halfTermId,
                                   halfTermName,
                                   unitId,
                                   unitName,
                                   lessonNumbers,
                                   isUnitPrint = false
                                 }: LessonPrintModalProps) {
  const { allLessonsData, currentSheetInfo, eyfsStatements, halfTerms } = useData();
  const { getCategoryColor } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showEyfs, setShowEyfs] = useState(true);
  const [exportMode, setExportMode] = useState<'single' | 'unit'>(
      isUnitPrint || unitId || halfTermId ? 'unit' : 'single'
  );
  const previewRef = useRef<HTMLDivElement>(null);

  // PDFBolt API configuration
const PDFBOLT_API_KEY = '146bdd01-146f-43f8-92aa-26201c38aa11'
  const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

  // Temporary debugging - remove this later
  console.log('Environment check:', {
    apiKey: PDFBOLT_API_KEY,
    allEnvVars: import.meta.env
  });

  // Determine which lessons to print - FIXED ORDER
  const lessonsToRender = React.useMemo(() => {
    let lessons: string[] = [];

    if (exportMode === 'single' && lessonNumber) {
      lessons = [lessonNumber];
    } else if (lessonNumbers && lessonNumbers.length > 0) {
      lessons = [...lessonNumbers];
    } else if (unitId) {
      // Find the unit and get its lessons
      const units = JSON.parse(localStorage.getItem(`units-${currentSheetInfo.sheet}`) || '[]');
      const unit = units.find((u: any) => u.id === unitId);
      lessons = unit?.lessonNumbers || [];
    } else if (halfTermId) {
      // Get lessons for half-term
      const halfTerm = halfTerms.find(term => term.id === halfTermId);
      lessons = halfTerm?.lessons || [];
    } else if (lessonNumber) {
      lessons = [lessonNumber];
    }

    // Sort lessons numerically
    return lessons.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    });
  }, [exportMode, lessonNumber, lessonNumbers, unitId, halfTermId, halfTerms, currentSheetInfo.sheet]);

  // Get the title for the print
  const printTitle = React.useMemo(() => {
    if (exportMode === 'single' && lessonNumber) {
      const lessonData = allLessonsData[lessonNumber];
      return lessonData?.title || `Lesson ${lessonNumber}`;
    } else if (unitName) {
      return `Unit: ${unitName}`;
    } else if (halfTermName) {
      return `Half-Term: ${halfTermName}`;
    }
    return 'Lesson Plan';
  }, [exportMode, lessonNumber, unitName, halfTermName, allLessonsData]);

  // Generate HTML content for PDFBolt with Tailwind CSS
  const generateHTMLContent = () => {
    let footerContent

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${printTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>  
          @media print {
            .page-header {
              display: none;
            }
            .lesson-page:not(:last-child) {
              page-break-after: always;
            }
          }
          .lesson-page:not(:last-child) {
            page-break-after: always;
          }
         
          /* Enhanced print styles for better visibility */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
           
            .print-border {
              border: 2px solid #000000 !important;
            }
           
            .print-text-dark {
              color: #000000 !important;
            }
           
            .print-bg-light {
              background-color: #f8f9fa !important;
            }
           
            .print-border-dark {
              border-color: #333333 !important;
            }
          }
        </style>
      </head>
      <body>
        <div>
          <div>
    `;

    lessonsToRender.forEach((lessonNum, lessonIndex) => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return;

      // Adjust styles for footer if needed
      footerContent = `<div
           style="width: 100%; text-align: center; font-size: 11px; color: #000000; font-weight: bold;">
        <p>${['Curriculum Designer', `Lesson ${lessonIndex + 1}`, currentSheetInfo.display, halfTermName || unitName, '© Rhythmstix 2025']
          .filter(Boolean)
          .join(' • ')}
        </p>
      </div>`

      const lessonEyfs = eyfsStatements[lessonNum] || eyfsStatements[lessonIndex + 1] || eyfsStatements[(lessonIndex + 1).toString()] || [];

      // Debug EYFS data - try multiple key formats
      console.log(`Looking for EYFS data:`, {
        lessonNum,
        lessonIndex: lessonIndex + 1,
        foundData: lessonEyfs,
        availableKeys: Object.keys(eyfsStatements)
      });

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

      htmlContent += `
        <div class="lesson-page bg-white">
          <div class="page-header bg-blue-50 px-6 py-3 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-blue-800">
                Lesson ${lessonIndex + 1} Preview
              </span>
              <span class="text-xs text-blue-600">
                Page ${lessonIndex + 1} of ${lessonsToRender.length}
              </span>
            </div>
          </div>

          <!-- Lesson Content -->
          <div class="px-6 pt-3 pb-6">
            <!-- Lesson Title -->
            <div class="mb-3 border-b border-black pb-2">
              <h3 class="text-xl font-bold text-black">
                Lesson ${lessonIndex + 1}, ${halfTermName || unitName || 'Autumn 1'} - ${currentSheetInfo.display}, Music
              </h3>
            </div>
      `;

      // Add EYFS section if enabled
      if (showEyfs && lessonEyfs.length > 0) {
        htmlContent += `
          <div class="mb-4">
            <h3 class="text-base font-bold text-black mb-2 flex items-center space-x-2">
              <svg class="h-4 w-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <span>Learning Goals</span>
            </h3>
            <div class="grid grid-cols-2 gap-2">
        `;

        Object.entries(groupedEyfs).forEach(([area, statements]) => {
          htmlContent += `
            <div class="rounded-lg p-2 border border-gray-800" style="background-color: #fffbeb;">
              <h4 class="font-bold text-black text-xs mb-1">${area}</h4>
              <ul class="space-y-0.5">
          `;
          statements.forEach(statement => {
            htmlContent += `
              <li class="flex items-start space-x-2 text-xs text-black">
                <span class="text-green-600 font-bold">✓</span>
                <span>${statement}</span>
              </li>
            `;
          });
          htmlContent += `</ul></div>`;
        });

        htmlContent += `</div></div>`;
      }

      // Add activities by category
      lessonData.categoryOrder.forEach(category => {
        const activities = lessonData.grouped[category] || [];
        if (activities.length === 0) return;

        const categoryColor = getCategoryColor(category);
        const categoryLightBorder = category === 'Welcome' ? '#FDE68A' :
            category === 'Kodaly Songs' ? '#DDD6FE' :
                category === 'Goodbye' ? '#A7F3D0' :
                    `${categoryColor}60`;

        const categoryColorStyle = category === 'Welcome' ? 'color: #F59E0B;' :
            category === 'Kodaly Songs' ? 'color: #8B5CF6;' :
                category === 'Goodbye' ? 'color: #10B981;' :
                    `color: ${categoryColor};`;

        const borderColorStyle = category === 'Welcome' ? 'border-left-color: #F59E0B;' :
            category === 'Kodaly Songs' ? 'border-left-color: #8B5CF6;' :
                category === 'Goodbye' ? 'border-left-color: #10B981;' :
                    `border-left-color: ${categoryColor};`;

        const categoryBgStyle = category === 'Welcome' ? 'background-color: #FEF3C7; border-bottom-color: #F59E0B;' :
            category === 'Kodaly Songs' ? 'background-color: #EDE9FE; border-bottom-color: #8B5CF6;' :
                category === 'Goodbye' ? 'background-color: #D1FAE5; border-bottom-color: #10B981;' :
                    `background-color: ${categoryColor}20; border-bottom-color: ${categoryColor};`;

        htmlContent += `
          <div class="mb-4">
            <h2 class="text-sm font-bold mb-1 text-black border-b border-black pb-0.5" style="${categoryColorStyle} page-break-after: avoid;">
              ${category}
            </h2>
           
            <div class="space-y-2">
        `;

        activities.forEach(activity => {
          htmlContent += `
            <div class="bg-white rounded-lg border overflow-hidden" style="page-break-inside: avoid; border-left-width: 4px; ${borderColorStyle} border-color: ${categoryLightBorder};">
              <!-- Activity Header -->
              <div class="px-2 py-0.5 border-b flex justify-between items-center" style="${categoryBgStyle}">
                <h3 class="font-bold text-black text-xs">
                  ${activity.activity}
                </h3>
                ${activity.time > 0 ? `
                  <div class="px-1 py-0.5 rounded-full text-xs font-bold" style="background-color: rgba(0,0,0,0.15); color: #374151;">
                    ${activity.time}m
                  </div>
                ` : ''}
              </div>
             
              <div class="p-1.5">
                ${activity.activityText ? `
                  <div class="mb-1 text-xs text-black font-medium">
                    ${activity.activityText}
                  </div>
                ` : ''}
                
                <div class="text-sm text-gray-700">
                    ${activity.description.includes('<')
                      ? activity.description
                       : activity.description.replace(/\n/g, '<br>')
                    }
                </div>
          `;

          const resources = [];
          if (activity.videoLink) resources.push({
            label: 'Video',
            url: activity.videoLink,
            classes: 'bg-red-100 text-red-800 border-red-300'
          });
          if (activity.musicLink) resources.push({
            label: 'Music',
            url: activity.musicLink,
            classes: 'bg-green-100 text-green-800 border-green-300'
          });
          if (activity.backingLink) resources.push({
            label: 'Backing',
            url: activity.backingLink,
            classes: 'bg-blue-100 text-blue-800 border-blue-300'
          });
          if (activity.resourceLink) resources.push({
            label: 'Resource',
            url: activity.resourceLink,
            classes: 'bg-purple-100 text-purple-800 border-purple-300'
          });
          if (activity.link) resources.push({
            label: 'Link',
            url: activity.link,
            classes: 'bg-gray-100 text-gray-800 border-gray-300'
          });
          if (activity.vocalsLink) resources.push({
            label: 'Vocals',
            url: activity.vocalsLink,
            classes: 'bg-orange-100 text-orange-800 border-orange-300'
          });
          if (activity.imageLink) resources.push({
            label: 'Image',
            url: activity.imageLink,
            classes: 'bg-pink-100 text-pink-800 border-pink-300'
          });

          if (resources.length > 0) {
            htmlContent += `
              <div class="mt-1 pt-1 border-t border-gray-600">
                <p class="text-xs font-bold text-black mb-0.5">Resources:</p>
                <div class="flex flex-wrap gap-0.5">
            `;
            resources.forEach(resource => {
              htmlContent += `
                <a href="${resource.url}"
                   class="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full border font-bold ${resource.classes}"
                   target="_blank"
                   rel="noopener noreferrer">
                  ${resource.label}
                </a>
              `;
            });
            htmlContent += `</div></div>`;
          }

          htmlContent += `</div></div>`;
        });

        htmlContent += `</div></div>`;
      });

      // Add notes if available
      if (lessonData.notes) {
        htmlContent += `
          <div class="mt-6 pt-4 border-t border-black">
            <h3 class="text-lg font-bold text-black mb-2">Lesson Notes</h3>
            <div class="bg-gray-200 rounded-lg p-3 text-black border border-gray-600">
              ${lessonData.notes}
            </div>
          </div>
        `;
      }

      htmlContent += `
          </div>
        </div>
      `;
    });

    htmlContent += `
        </div>
        </div>
      </body>
      </html>
    `;

    return [htmlContent, footerContent];
  };

  if (lessonsToRender.length === 0) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">No lessons found to print.</p>
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

  // PDFBolt API requires HTML content to be base64 encoded
  const encodeUnicodeBase64 = function (str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    let binaryString = '';
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]);
    }
    return btoa(binaryString);
  };

  const handleExport = async () => {
    if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
      alert('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)');
      return;
    }

    setIsExporting(true);
    try {
      const htmlContent = encodeUnicodeBase64(generateHTMLContent()[0]);
      const footerContent = encodeUnicodeBase64(generateHTMLContent()[1]);

      console.log('Sending request to PDFBolt API...');
      console.log('API Key:', PDFBOLT_API_KEY ? 'Set' : 'Not set');
      console.log('HTML content length:', htmlContent.length);

      // PDFBolt API request - try with different format
      const response = await fetch(PDFBOLT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': PDFBOLT_API_KEY
        },
        body: JSON.stringify({
          html: htmlContent,
          printBackground: true,
          waitUntil: "networkidle",
          format: "A4",
          margin: {
            "top": "15px",
            "right": "20px",
            "left": "20px",
            "bottom": "55px"
          },
          displayHeaderFooter: true,
          footerTemplate: footerContent,
          headerTemplate: encodeUnicodeBase64(`<div></div>`)
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        // Try to get more details about the error
        const errorText = await response.text();
        console.error('PDFBolt API Error Details:', errorText);
        throw new Error(`PDFBolt API Error: ${response.status} - ${errorText}`);
      }

      // Get the PDF as a blob
      const pdfBlob = await response.blob();
      console.log('PDF blob received, size:', pdfBlob.size);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename
      const fileName = exportMode === 'single'
          ? `${currentSheetInfo.sheet}_Lesson_${lessonNumber}.pdf`
          : `${currentSheetInfo.sheet}_${(unitName || halfTermName || 'Unit').replace(/\s+/g, '_')}.pdf`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isUnitPrint ? "Export Half-Term Plans" : "Export Lesson Plan"}
              </h2>
              <p className="text-sm text-gray-600">
                {printTitle} - {currentSheetInfo.display} ({lessonsToRender.length} lesson{lessonsToRender.length !== 1 ? 's' : ''})
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* REMOVED: No toggle buttons when printing from Unit Viewer (isUnitPrint = true) */}
              {!isUnitPrint && (halfTermId || (lessonNumbers && lessonNumbers.length > 1)) && (
                  <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setExportMode('single')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                            exportMode === 'single'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Single Lesson
                    </button>
                    <button
                        onClick={() => setExportMode('unit')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                            exportMode === 'unit'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {halfTermName ? 'Entire Half-Term' : 'All Lessons'}
                    </button>
                  </div>
              )}

              {/* Show unit info when printing from Unit Viewer */}
              {unitId && unitName && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <span className="font-medium text-blue-800">Unit Print:</span> {unitName}
                  </div>
              )}

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
                <div className="text-sm text-gray-600">
                  Lessons: {lessonsToRender.map((_, index) => index + 1).join(', ')}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:bg-blue-400"
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
                        <span>Export PDF</span>
                      </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview - Each lesson as a separate "page" */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100 print:bg-white print:p-0">
            <div className="space-y-6">
              {/* Render each lesson as a separate page-like container */}
              {lessonsToRender.map((lessonNum, lessonIndex) => {
                const lessonData = allLessonsData[lessonNum];
                if (!lessonData) return null;

                // Debug lesson data
                console.log(`Lesson ${lessonNum} data:`, {
                  title: lessonData.title,
                  lessonNum,
                  lessonIndex,
                  categoryOrder: lessonData.categoryOrder,
                  grouped: Object.keys(lessonData.grouped || {})
                });

                const lessonEyfs = eyfsStatements[lessonNum] || eyfsStatements[lessonIndex + 1] || eyfsStatements[(lessonIndex + 1).toString()] || [];

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

                return (
                    <div
                        key={lessonNum}
                        className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden relative"
                        style={{
                          minHeight: '297mm',
                          width: '210mm',
                          marginLeft: 'auto',
                          marginRight: 'auto'
                        }}
                    >
                      {/* Page Header */}
                      <div className="bg-blue-50 px-6 py-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800">
                        Lesson {lessonIndex + 1}, {halfTermName || unitName || 'Autumn 1'} - Lesson Preview
                      </span>
                          <span className="text-xs text-blue-600">
                        Page {lessonIndex + 1} of {lessonsToRender.length}
                      </span>
                        </div>
                      </div>

                      {/* Lesson Content */}
                      <div className="px-6 pt-3 pb-16">
                        {/* Lesson Title */}
                        <div className="mb-3 border-b border-black pb-2">
                          <h3 className="text-xl font-bold text-black">
                            Lesson {lessonIndex + 1}, {halfTermName || unitName || 'Autumn 1'} - {currentSheetInfo.display}, Music
                          </h3>
                        </div>

                        {/* EYFS Goals */}
                        {showEyfs && lessonEyfs.length > 0 && (
                            <div className="mb-4">
                              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                                <Tag className="h-4 w-4 text-blue-600" />
                                <span>Learning Goals</span>
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(groupedEyfs).map(([area, statements]) => (
                                    <div key={area} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                      <h4 className="font-medium text-gray-800 text-xs mb-1">{area}</h4>
                                      <ul className="space-y-0.5">
                                        {statements.map((statement, index) => (
                                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                                              <span className="text-green-500 font-bold">✓</span>
                                              <span>{statement}</span>
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

                          // Get category background color for activity headers (SAME AS PDF)
                          const getCategoryBgColor = (cat: string) => {
                            switch(cat) {
                              case 'Welcome': return '#FEF3C7'; // Light amber
                              case 'Kodaly Songs': return '#EDE9FE'; // Light purple
                              case 'Goodbye': return '#D1FAE5'; // Light emerald
                              default: return `${categoryColor}20`; // 20% opacity of category color
                            }
                          };

                          // Get category light border color (SAME AS PDF)
                          const getCategoryLightBorder = (cat: string) => {
                            switch(cat) {
                              case 'Welcome': return '#FDE68A'; // Lighter amber
                              case 'Kodaly Songs': return '#DDD6FE'; // Lighter purple
                              case 'Goodbye': return '#A7F3D0'; // Lighter emerald
                              default: return `${categoryColor}60`; // 60% opacity of category color
                            }
                          };

                          return (
                              <div key={category} className="mb-4">
                                <h2
                                    className="text-sm font-bold mb-1 text-black border-b border-black pb-0.5"
                                    style={{
                                      color: category === 'Welcome' ? '#F59E0B' :
                                          category === 'Kodaly Songs' ? '#8B5CF6' :
                                              category === 'Goodbye' ? '#10B981' : categoryColor
                                    }}
                                >
                                  {category}
                                </h2>

                                <div className="space-y-2">
                                  {activities.map((activity, index) => (
                                      <div
                                          key={`${category}-${index}`}
                                          className="bg-white rounded-lg border overflow-hidden"
                                          style={{
                                            borderLeftWidth: '4px',
                                            borderLeftColor: categoryColor,
                                            borderColor: getCategoryLightBorder(category)
                                          }}
                                      >
                                        {/* Activity Header */}
                                        <div
                                            className="px-2 py-0.5 border-b flex justify-between items-center"
                                            style={{
                                              backgroundColor: getCategoryBgColor(category),
                                              borderBottomColor: categoryColor
                                            }}
                                        >
                                          <h3 className="text-xs font-bold text-black">
                                            {activity.activity}
                                          </h3>
                                          {activity.time > 0 && (
                                              <div
                                                  className="px-1 py-0.5 rounded-full text-xs font-bold"
                                                  style={{
                                                    backgroundColor: 'rgba(0,0,0,0.15)',
                                                    color: '#374151'
                                                  }}
                                              >
                                                {activity.time}m
                                              </div>
                                          )}
                                        </div>

                                        {/* Activity Content */}
                                        <div className="p-1.5">
                                          {/* Activity Text (if available) */}
                                          {activity.activityText && (
                                              <div
                                                  className="mb-1 text-xs text-black font-medium"
                                                  dangerouslySetInnerHTML={{ __html: activity.activityText }}
                                              />
                                          )}

                                          {/* Description */}
                                          <div
                                              className="text-xs text-black"
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
                                              <div className="mt-1 pt-1 border-t border-gray-600">
                                                <p className="text-xs font-bold text-black mb-0.5">Resources:</p>
                                                <div className="flex flex-wrap gap-0.5">
                                                  {activity.videoLink && (
                                                      <a
                                                          href={activity.videoLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
                                                      >
                                                        Video
                                                      </a>
                                                  )}
                                                  {activity.musicLink && (
                                                      <a
                                                          href={activity.musicLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors"
                                                      >
                                                        Music
                                                      </a>
                                                  )}
                                                  {activity.backingLink && (
                                                      <a
                                                          href={activity.backingLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                                                      >
                                                        Backing
                                                      </a>
                                                  )}
                                                  {activity.resourceLink && (
                                                      <a
                                                          href={activity.resourceLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200 transition-colors"
                                                      >
                                                        Resource
                                                      </a>
                                                  )}
                                                  {activity.link && (
                                                      <a
                                                          href={activity.link}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200 transition-colors"
                                                      >
                                                        Link
                                                      </a>
                                                  )}
                                                  {activity.vocalsLink && (
                                                      <a
                                                          href={activity.vocalsLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors"
                                                      >
                                                        Vocals
                                                      </a>
                                                  )}
                                                  {activity.imageLink && (
                                                      <a
                                                          href={activity.imageLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full hover:bg-pink-200 transition-colors"
                                                      >
                                                        Image
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
                            <div className="mt-6 pt-4 border-t border-black">
                              <h3 className="text-lg font-bold text-black mb-2">Lesson Notes</h3>
                              <div
                                  className="bg-gray-200 rounded-lg p-3 text-black border border-gray-600"
                                  dangerouslySetInnerHTML={{ __html: lessonData.notes }}
                              />
                            </div>
                        )}
                      </div>

                      {/* Page Footer - Fixed at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 rounded-b-lg">
                        <p><strong>Curriculum Designer • {currentSheetInfo.display} • {halfTermName || unitName || ''} • © Rhythmstix 2025</strong></p>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}