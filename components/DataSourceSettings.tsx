import React, { useState, useEffect } from 'react';
import { Settings, Upload, RefreshCw, CheckCircle, AlertCircle, X, Database, Server, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { dataApi } from '../config/api';
import { isSupabaseConfigured } from '../config/supabase';

interface DataSourceSettingsProps {
  embedded?: boolean;
}

export function DataSourceSettings({ embedded = false }: DataSourceSettingsProps) {
  const { user } = useAuth();
  const { refreshData, uploadExcelFile, loading } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [statusMessage, setStatusMessage] = useState('');

  // Check if user is admin - specifically Rob's email
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || 
                  user?.role === 'administrator';

  // Move all function declarations to the top before any conditional returns
  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      
      // Check if Supabase is configured
      if (isSupabaseConfigured()) {
        try {
          // Try to fetch from Supabase
          await dataApi.exportAll();
          setServerStatus('online');
        } catch (error) {
          console.warn('Supabase connection failed:', error);
          setServerStatus('offline');
        }
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus('offline');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('uploading');
      await uploadExcelFile(file);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleRefreshData = async () => {
    try {
      setUploadStatus('uploading');
      await refreshData();
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleMigrateToServer = async () => {
    try {
      setUploadStatus('uploading');
      
      // Get all data from localStorage
      const data = {
        activities: [],
        lessons: {},
        lessonPlans: [],
        eyfs: {}
      };
      
      // Extract activities from localStorage
      const libraryActivities = localStorage.getItem('library-activities');
      if (libraryActivities) {
        data.activities = JSON.parse(libraryActivities);
      }
      
      // Extract lessons from localStorage
      ['LKG', 'UKG', 'Reception'].forEach(sheet => {
        const lessonData = localStorage.getItem(`lesson-data-${sheet}`);
        if (lessonData) {
          data.lessons[sheet] = JSON.parse(lessonData);
        }
      });
      
      // Extract lesson plans from localStorage
      const lessonPlans = localStorage.getItem('lesson-plans');
      if (lessonPlans) {
        data.lessonPlans = JSON.parse(lessonPlans);
      }
      
      // Extract EYFS standards from localStorage
      ['LKG', 'UKG', 'Reception'].forEach(sheet => {
        const eyfsData = localStorage.getItem(`eyfs-standards-${sheet}`);
        if (eyfsData) {
          data.eyfs[sheet] = JSON.parse(eyfsData);
        }
      });
      
      // Send all data to server
      await dataApi.importAll(data);
      
      setUploadStatus('success');
      setStatusMessage('Data successfully migrated to Supabase.');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('Migration failed:', error);
      setUploadStatus('error');
      setStatusMessage('Failed to migrate data to Supabase.');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleClearAllLocalData = () => {
    if (confirm('Are you sure you want to clear ALL local data? This will remove all lessons, activities, units, and settings. This action cannot be undone.')) {
      // Clear all localStorage items
      localStorage.removeItem('lesson-data-LKG');
      localStorage.removeItem('lesson-data-UKG');
      localStorage.removeItem('lesson-data-Reception');
      localStorage.removeItem('lesson-plans');
      localStorage.removeItem('library-activities');
      localStorage.removeItem('units');
      localStorage.removeItem('eyfs-standards-LKG');
      localStorage.removeItem('eyfs-standards-UKG');
      localStorage.removeItem('eyfs-standards-Reception');
      localStorage.removeItem('eyfs-statements-flat-LKG');
      localStorage.removeItem('eyfs-statements-flat-UKG');
      localStorage.removeItem('eyfs-statements-flat-Reception');
      localStorage.removeItem('lesson-viewer-settings');
      localStorage.removeItem('lesson-viewer-categories');
      localStorage.removeItem('user-created-lesson-plans');
      localStorage.removeItem('admin-editable-content');
      localStorage.removeItem('admin-google-sheets-config');
      localStorage.removeItem('has-visited-before');
      
      // Keep the auth token so the user stays logged in
      // localStorage.removeItem('rhythmstix_auth_token');
      
      // Show success message
      setUploadStatus('success');
      setStatusMessage('All local data has been cleared. The page will reload.');
      
      // Reload the page after a short delay with a parameter to indicate data was cleared
      setTimeout(() => {
        window.location.href = window.location.pathname + '?cleared=true' + window.location.hash;
      }, 1500);
    }
  };

  // Check server status when opening the panel
  useEffect(() => {
    if (isOpen) {
      checkServerStatus();
    }
  }, [isOpen]);

  // Don't render the settings button if user is not admin
  if (!isAdmin) {
    return null;
  }

  // If embedded in another component, don't show the floating button
  if (embedded && !isOpen) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Welcome, {user?.name}!</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            You have full administrative access to manage the EYFS Lesson Builder system. 
            Use the options below to configure data sources and manage content.
          </p>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Admin Email:</span>
                <span className="font-semibold text-blue-600">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Access Level:</span>
                <span className="font-semibold text-green-600">Full Administrator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Excel File Upload */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Excel File Upload</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Upload an Excel file (.xlsx, .xls, .csv) to update your lesson data.
          </p>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={uploadStatus === 'uploading'}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-200"
            />
            
            {uploadStatus === 'uploading' && (
              <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">
                  {statusMessage || "Uploading and processing..."}
                </span>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {statusMessage || "Data updated successfully!"}
                </span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {statusMessage || "Update failed. Please try again."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clear All Data */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clear All Local Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Clear all locally stored data including lessons, activities, units, and settings. This action cannot be undone.
          </p>
          
          <button
            onClick={handleClearAllLocalData}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Trash2 className="h-5 w-5" />
            <span>Clear All Local Data</span>
          </button>
          <p className="text-xs text-red-600 mt-2 text-center">
            Warning: This will remove all your lessons, activities, units, and settings.
          </p>
        </div>
      </div>
    );
  }

  if (!isOpen && !embedded) {
    return null;
  }

  if (embedded) {
    return (
      <div className="space-y-6">
        {/* Excel File Upload */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Excel File Upload</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Upload an Excel file (.xlsx, .xls, .csv) to update your lesson data.
          </p>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={uploadStatus === 'uploading'}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-200"
            />
            
            {uploadStatus === 'uploading' && (
              <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">
                  {statusMessage || "Uploading and processing..."}
                </span>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {statusMessage || "Data updated successfully!"}
                </span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {statusMessage || "Update failed. Please try again."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clear All Data */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clear All Local Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Clear all locally stored data including lessons, activities, units, and settings. This action cannot be undone.
          </p>
          
          <button
            onClick={handleClearAllLocalData}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Trash2 className="h-5 w-5" />
            <span>Clear All Local Data</span>
          </button>
          <p className="text-xs text-red-600 mt-2 text-center">
            Warning: This will remove all your lessons, activities, units, and settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Admin Settings</h2>
              <p className="text-blue-100 text-sm">Data Source Management - {user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Admin Welcome */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Welcome, {user?.name}!</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You have full administrative access to manage the EYFS Lesson Builder system. 
              Use the options below to configure data sources and manage content.
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Admin Email:</span>
                  <span className="font-semibold text-blue-600">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Access Level:</span>
                  <span className="font-semibold text-green-600">Full Administrator</span>
                </div>
              </div>
            </div>
          </div>

          {/* Server Status */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Server className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Supabase Status</h3>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Supabase Connection:</span>
                {serverStatus === 'checking' ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-blue-600 font-medium">Checking...</span>
                  </div>
                ) : serverStatus === 'online' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">Disconnected</span>
                  </div>
                )}
              </div>
            </div>
            
            {serverStatus === 'offline' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-700 font-medium mb-1">Supabase is disconnected</p>
                    <p className="text-sm text-yellow-600">
                      The application is currently using local storage for data. Connect to Supabase to enable cloud storage and synchronization.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {serverStatus === 'online' && (
              <button
                onClick={handleMigrateToServer}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Database className="h-5 w-5" />
                <span>Migrate Local Data to Supabase</span>
              </button>
            )}
          </div>

          {/* Excel File Upload Alternative */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Excel File Upload</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file (.xlsx, .xls, .csv) to update your lesson data.
            </p>
            
            <div className="space-y-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={uploadStatus === 'uploading'}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-200"
              />
              
              {uploadStatus === 'uploading' && (
                <div className="flex items-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">
                    {statusMessage || "Uploading and processing..."}
                  </span>
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {statusMessage || "Data updated successfully!"}
                  </span>
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {statusMessage || "Update failed. Please try again."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Clear All Data */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clear All Local Data</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Clear all locally stored data including lessons, activities, units, and settings. This action cannot be undone.
            </p>
            
            <button
              onClick={handleClearAllLocalData}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Clear All Local Data</span>
            </button>
            <p className="text-xs text-red-600 mt-2 text-center">
              Warning: This will remove all your lessons, activities, units, and settings.
            </p>
          </div>

          {/* Current Configuration */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium">Primary Data Source:</span>
                <span className="font-semibold text-green-600">
                  {serverStatus === 'online' ? 'Supabase' : 'Local Storage (Fallback)'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium">Authentication:</span>
                <span className="font-semibold text-blue-600">EYFS Admin</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 md:col-span-2">
                <span className="text-gray-600 font-medium">Last Updated:</span>
                <span className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}