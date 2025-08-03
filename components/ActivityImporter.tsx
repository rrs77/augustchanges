import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { activitiesApi } from '../config/api';
import type { Activity } from '../contexts/DataContext';

interface ActivityImporterProps {
  onImport: (activities: Activity[]) => void;
  onClose: () => void;
}

export function ActivityImporter({ onImport, onClose }: ActivityImporterProps) {
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [importedData, setImportedData] = useState<Activity[]>([]);
  const [previewData, setPreviewData] = useState<Activity[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('processing');
      setStatusMessage('Processing file...');

      // Check file type
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(fileType || '')) {
        throw new Error('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.');
      }

      // Read the file
      const data = await readExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in the file.');
      }

      console.log("Raw imported data:", data);

      // Validate and transform the data
      const activities = transformData(data);
      
      if (activities.length === 0) {
        throw new Error('No valid activities found in the file. Please check the format.');
      }

      console.log("Transformed activities:", activities);

      setImportedData(activities);
      setPreviewData(activities.slice(0, 5)); // Show first 5 for preview
      setImportStatus('success');
      setStatusMessage(`Successfully imported ${activities.length} activities.`);
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to import file.');
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file.'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          resolve(jsonData as any[]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file.'));
      };

      reader.readAsBinaryString(file);
    });
  };

  const transformData = (data: any[]): Activity[] => {
    if (data.length < 2) {
      throw new Error('File must contain at least a header row and one data row.');
    }

    // Extract headers (first row)
    const headers = data[0].map((header: any) => String(header).trim());
    console.log("Headers found:", headers);
    
    // Expected headers
    const expectedHeaders = [
      'Lesson Number', 'Category', 'Activity Name', 'Description', 
      'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'
    ];
    
    // Check if required headers exist
    const requiredHeaders = ['Category', 'Activity Name'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Find column indices
    const getColumnIndex = (name: string) => {
      const index = headers.findIndex(h => 
        String(h).toLowerCase() === name.toLowerCase() || 
        String(h).toLowerCase().includes(name.toLowerCase())
      );
      return index;
    };

    const lessonNumberIdx = getColumnIndex('Lesson Number');
    const categoryIdx = getColumnIndex('Category');
    const activityNameIdx = getColumnIndex('Activity Name');
    const descriptionIdx = getColumnIndex('Description');
    const levelIdx = getColumnIndex('Level');
    const timeIdx = getColumnIndex('Time');
    const videoIdx = getColumnIndex('Video');
    const musicIdx = getColumnIndex('Music');
    const backingIdx = getColumnIndex('Backing');
    const resourceIdx = getColumnIndex('Resource');
    const unitNameIdx = getColumnIndex('Unit Name');

    console.log("Column indices:", {
      lessonNumber: lessonNumberIdx,
      category: categoryIdx,
      activityName: activityNameIdx,
      description: descriptionIdx,
      level: levelIdx,
      time: timeIdx,
      video: videoIdx,
      music: musicIdx,
      backing: backingIdx,
      resource: resourceIdx,
      unitName: unitNameIdx
    });

    // Transform data rows
    const activities: Activity[] = [];
    let currentLessonNumber = '';

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // Skip rows without category or activity name
      if (!row[categoryIdx] || !row[activityNameIdx]) continue;

      // Handle lesson number logic - if empty, use the last seen lesson number
      if (row[lessonNumberIdx]) {
        currentLessonNumber = String(row[lessonNumberIdx]).trim();
      }

      // Parse time safely
      let time = 0;
      if (row[timeIdx]) {
        const timeStr = String(row[timeIdx]).trim();
        const parsedTime = parseInt(timeStr);
        if (!isNaN(parsedTime) && parsedTime >= 0) {
          time = parsedTime;
        }
      }

      // Format description with proper line breaks
      let description = String(row[descriptionIdx] || '').trim();
      
      // If description doesn't already contain HTML, convert newlines to <br> tags
      if (description && !description.includes('<')) {
        description = description.replace(/\n/g, '<br>');
      }

      const activity: Activity = {
        id: `imported-${Date.now()}-${i}`,
        activity: String(row[activityNameIdx] || '').trim(),
        description: description,
        time,
        videoLink: String(row[videoIdx] || '').trim(),
        musicLink: String(row[musicIdx] || '').trim(),
        backingLink: String(row[backingIdx] || '').trim(),
        resourceLink: String(row[resourceIdx] || '').trim(),
        link: '',
        vocalsLink: '',
        imageLink: '',
        teachingUnit: String(row[categoryIdx] || '').trim(),
        category: String(row[categoryIdx] || '').trim(),
        level: String(row[levelIdx] || '').trim(),
        unitName: String(row[unitNameIdx] || '').trim(),
        lessonNumber: currentLessonNumber || '1'
      };

      activities.push(activity);
    }

    return activities;
  };

  const handleImport = () => {
    onImport(importedData);
    onClose();
  };

  const handleDownloadTemplate = () => {
    // Create a template workbook
    const wb = XLSX.utils.book_new();
    
    // Define the headers
    const headers = [
      'Category', 'Activity Name', 'Description', 
      'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'
    ];
    
    // Add some sample data
    const data = [
      headers,
      ['Welcome', 'Hello Song', 'A welcoming song to start the lesson\nWith multiple lines\nAnd more details', 'All', '3', 'https://example.com/video', 'https://example.com/music', '', '', ''],
      ['Rhythm', 'Clapping Game', 'Students clap along to the beat\n• First clap slowly\n• Then speed up\n• Finally, add a pattern', 'EYFS', '5', '', 'https://example.com/music2', '', '', 'Rhythm Unit'],
      ['Singing', 'Echo Song', 'Teacher sings a line, students repeat\n1. Start with simple phrases\n2. Increase complexity\n3. Add movements', 'All', '4', '', '', '', '', '']
    ];
    
    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Activities');
    
    // Generate the Excel file
    XLSX.writeFile(wb, 'activity_template.xlsx');
  };

  const handleExportActivities = async () => {
    try {
      setImportStatus('processing');
      setStatusMessage('Exporting activities...');
      
      // Get all activities from the server
      const activities = await activitiesApi.getAll();
      
      // Create a workbook
      const wb = XLSX.utils.book_new();
      
      // Define the headers
      const headers = [
        'Lesson Number', 'Category', 'Activity Name', 'Description', 
        'Level', 'Time (Mins)', 'Video', 'Music', 'Backing', 'Resource', 'Unit Name'
      ];
      
      // Transform activities to rows
      const rows = [headers];
      activities.forEach(activity => {
        rows.push([
          activity.lessonNumber || '',
          activity.category || '',
          activity.activity || '',
          activity.description.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '') || '',
          activity.level || '',
          activity.time.toString() || '0',
          activity.videoLink || '',
          activity.musicLink || '',
          activity.backingLink || '',
          activity.resourceLink || '',
          activity.unitName || ''
        ]);
      });
      
      // Create a worksheet
      const ws = XLSX.utils.aoa_to_sheet(rows);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Activities');
      
      // Generate the Excel file
      XLSX.writeFile(wb, 'activities_export.xlsx');
      
      setImportStatus('success');
      setStatusMessage('Activities exported successfully.');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus('error');
      setStatusMessage('Failed to export activities.');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <Upload className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Import/Export Activities</h2>
              <p className="text-purple-100 text-sm">Upload an Excel file with your activity data or export existing activities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-100 hover:text-white hover:bg-purple-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Section */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Export Activities</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export all activities to an Excel file for backup or sharing.
            </p>
            <button
              onClick={handleExportActivities}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              disabled={importStatus === 'processing'}
            >
              {importStatus === 'processing' && statusMessage.includes('Exporting') ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Exporting Activities...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Export All Activities</span>
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Import Activities</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>Prepare an Excel file (.xlsx, .xls) or CSV file with your activity data</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Ensure your file has the required columns: <span className="font-medium">Category</span> and <span className="font-medium">Activity Name</span></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>For descriptions, use line breaks to format text. You can also use bullet points and numbered lists.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <span>Click the "Choose File" button below and select your file</span>
              </li>
            </ol>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download Template</span>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
            </div>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={importStatus === 'processing'}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors duration-200"
                dir="ltr"
              />
              
              {importStatus === 'processing' && !statusMessage.includes('Exporting') && (
                <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">{statusMessage}</span>
                </div>
              )}
              
              {importStatus === 'success' && !statusMessage.includes('exported') && (
                <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{statusMessage}</span>
                </div>
              )}
              
              {importStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{statusMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview (First 5 Activities)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((activity, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">{activity.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">{activity.activity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">{activity.level}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.time} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                {importedData.length > 5 && `...and ${importedData.length - 5} more activities`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importStatus !== 'success' || importedData.length === 0}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Import {importedData.length} Activities</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}