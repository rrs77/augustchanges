import { useState, useEffect } from 'react';

interface EditableContent {
  id: string;
  label: string;
  content: string;
  type: 'text' | 'html' | 'title' | 'description';
  category: string;
}

export function useEditableContent() {
  const [editableContents, setEditableContents] = useState<EditableContent[]>([]);

  useEffect(() => {
    const savedContent = localStorage.getItem('admin-editable-content');
    if (savedContent) {
      setEditableContents(JSON.parse(savedContent));
    }
  }, []);

  const getContent = (id: string, fallback: string = ''): string => {
    const content = editableContents.find(c => c.id === id);
    return content ? content.content : fallback;
  };

  const getHtmlContent = (id: string, fallback: string = ''): string => {
    const content = editableContents.find(c => c.id === id);
    return content && content.type === 'html' ? content.content : fallback;
  };

  return {
    getContent,
    getHtmlContent,
    editableContents
  };
}