import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Lock,
  Unlock,
  BookOpen,
  Tag,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const COLOR_OPTIONS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#06b6d4' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' }
];

export default function SubjectManagement() {
  const {
    subjects,
    subjectCategories,
    currentSubject,
    setCurrentSubject,
    loadSubjects,
    loadSubjectCategories,
    createSubject,
    updateSubject,
    deleteSubject,
    createSubjectCategory,
    updateSubjectCategory,
    deleteSubjectCategory,
    reorderSubjectCategories,
    toggleCategoryLock,
    toggleCategoryVisibility,
    loading
  } = useData();

  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    description: '',
    color: '#8b5cf6'
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#8b5cf6',
    is_locked: false
  });

  // Load data on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load categories when current subject changes
  useEffect(() => {
    if (currentSubject) {
      loadSubjectCategories(currentSubject.id);
    }
  }, [currentSubject]);

  // Subject management
  const handleSaveSubject = async () => {
    if (!subjectForm.name.trim()) return;
    
    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: subjectForm.name,
          description: subjectForm.description,
          color: subjectForm.color
        });
      } else {
        await createSubject({
          name: subjectForm.name,
          description: subjectForm.description,
          color: subjectForm.color,
          is_active: true
        });
      }
      
      await loadSubjects();
      setShowSubjectModal(false);
      resetSubjectForm();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      alert('Error saving subject: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (subject: any) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"? This will also delete all associated categories.`)) {
      return;
    }
    
    try {
      await deleteSubject(subject.id);
      await loadSubjects();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      alert('Error deleting subject: ' + error.message);
    }
  };

  // Category management
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim() || !currentSubject) return;
    
    setSaving(true);
    try {
      if (editingCategory) {
        await updateSubjectCategory(editingCategory.id, {
          name: categoryForm.name,
          description: categoryForm.description,
          color: categoryForm.color,
          is_locked: categoryForm.is_locked
        });
      } else {
        const maxOrder = Math.max(...subjectCategories.map(c => c.sort_order), 0);
        
        await createSubjectCategory({
          subject_id: currentSubject.id,
          name: categoryForm.name,
          description: categoryForm.description,
          color: categoryForm.color,
          is_locked: categoryForm.is_locked,
          is_active: true,
          sort_order: maxOrder + 1
        });
      }
      
      await loadSubjectCategories(currentSubject.id);
      setShowCategoryModal(false);
      resetCategoryForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: any) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }
    
    try {
      await deleteSubjectCategory(category.id);
      if (currentSubject) {
        await loadSubjectCategories(currentSubject.id);
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert('Error deleting category: ' + error.message);
    }
  };

  const handleReorderCategory = async (fromIndex: number, toIndex: number) => {
    if (!currentSubject) return;

    const reorderedCategories = [...subjectCategories];
    const [movedCategory] = reorderedCategories.splice(fromIndex, 1);
    reorderedCategories.splice(toIndex, 0, movedCategory);
    
    const categoryIds = reorderedCategories.map(category => category.id);
    
    try {
      await reorderSubjectCategories(currentSubject.id, categoryIds);
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  // Form helpers
  const resetSubjectForm = () => {
    setSubjectForm({ name: '', description: '', color: '#8b5cf6' });
    setEditingSubject(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', color: '#8b5cf6', is_locked: false });
    setEditingCategory(null);
  };

  const openEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      description: subject.description || '',
      color: subject.color
    });
    setShowSubjectModal(true);
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      is_locked: category.is_locked
    });
    setShowCategoryModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading subjects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Subjects & Categories</h2>
                <p className="text-blue-100 text-sm">Manage subjects and their categories</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetSubjectForm();
                setShowSubjectModal(true);
              }}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Subject</span>
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Subjects Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Subjects ({subjects.length})</h3>
            </div>
            <div className="overflow-y-auto h-full">
              {subjects.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No subjects yet</p>
                  <p className="text-xs text-gray-400">Create your first subject</p>
                </div>
              ) : (
                subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                      currentSubject?.id === subject.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                    onClick={() => setCurrentSubject(subject)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{subject.name}</h4>
                          {subject.description && (
                            <p className="text-sm text-gray-600">{subject.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditSubject(subject);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(subject);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categories Panel */}
          <div className="flex-1">
            {currentSubject ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: currentSubject.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {currentSubject.name} Categories
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subjectCategories.length} categories
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        resetCategoryForm();
                        setShowCategoryModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Category</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-y-auto h-full">
                  <div className="space-y-3">
                    {subjectCategories.map((category, index) => (
                      <div
                        key={category.id}
                        className={`p-4 rounded-lg border transition-all ${
                          category.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{category.name}</h4>
                                {category.is_locked && (
                                  <Lock className="h-4 w-4 text-amber-600" title="Locked category" />
                                )}
                              </div>
                              {category.description && (
                                <p className="text-sm text-gray-600">{category.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Move Up */}
                            {index > 0 && (
                              <button
                                onClick={() => handleReorderCategory(index, index - 1)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Move Down */}
                            {index < subjectCategories.length - 1 && (
                              <button
                                onClick={() => handleReorderCategory(index, index + 1)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Toggle Visibility */}
                            <button
                              onClick={() => toggleCategoryVisibility(category.id)}
                              className={`p-1 rounded ${
                                category.is_active 
                                  ? 'text-gray-400 hover:text-orange-600' 
                                  : 'text-orange-600 hover:text-gray-400'
                              }`}
                              title={category.is_active ? 'Hide category' : 'Show category'}
                            >
                              {category.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            
                            {/* Toggle Lock */}
                            <button
                              onClick={() => toggleCategoryLock(category.id)}
                              className={`p-1 rounded ${
                                category.is_locked 
                                  ? 'text-amber-600 hover:text-gray-400' 
                                  : 'text-gray-400 hover:text-amber-600'
                              }`}
                              title={category.is_locked ? 'Unlock category' : 'Lock category'}
                            >
                              {category.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </button>
                            
                            {/* Edit */}
                            <button
                              onClick={() => openEditCategory(category)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="Edit category"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {subjectCategories.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">No categories yet</p>
                        <p className="text-sm">Add categories to organize activities for {currentSubject.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">Select a subject to manage categories</p>
                  <p className="text-sm">Create your first subject to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject Modal */}
        {showSubjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Music, Drama, EYFS"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of this subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSubjectForm({ ...subjectForm, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          subjectForm.color === color.value 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSubjectModal(false);
                    resetSubjectForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubject}
                  disabled={!subjectForm.name.trim() || saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center space-x-2"
                >
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <Save className="h-4 w-4" />
                  <span>{editingSubject ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                {currentSubject && (
                  <p className="text-sm text-gray-600 mt-1">for {currentSubject.name}</p>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Warm Up, Games, Cool Down"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="What types of activities go in this category..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setCategoryForm({ ...categoryForm, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          categoryForm.color === color.value 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="locked"
                    checked={categoryForm.is_locked}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_locked: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="locked" className="text-sm font-medium text-gray-700">
                    Lock this category (prevent users from modifying)
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!categoryForm.name.trim() || saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center space-x-2"
                >
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <Save className="h-4 w-4" />
                  <span>{editingCategory ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}