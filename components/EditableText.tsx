import React from 'react';
import { useEditableContent } from '../hooks/useEditableContent';

interface EditableTextProps {
  id: string;
  fallback: string;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  html?: boolean;
}

export function EditableText({ 
  id, 
  fallback, 
  className = '', 
  as: Component = 'span',
  html = false 
}: EditableTextProps) {
  const { getContent, getHtmlContent } = useEditableContent();
  
  const content = html ? getHtmlContent(id, fallback) : getContent(id, fallback);

  if (html) {
    return (
      <Component 
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <Component className={className}>
      {content}
    </Component>
  );
}