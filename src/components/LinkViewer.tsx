import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, Volume2, Play } from 'lucide-react';

interface LinkViewerProps {
  url: string;
  title: string;
  type?: 'video' | 'music' | 'backing' | 'resource' | 'link' | 'vocals' | 'image';
  onClose: () => void;
}

export function LinkViewer({ url, title, type = 'link', onClose }: LinkViewerProps) {
  // Auto-open ALL links in new tab fullscreen
  useEffect(() => {
    console.log('LinkViewer opened with URL:', url);
    
    // Open in fullscreen new tab
    const openFullscreen = () => {
      try {
        // Try to open in fullscreen
        const newWindow = window.open(
          url, 
          '_blank',
          `fullscreen=yes,width=${screen.width},height=${screen.height},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`
        );
        
        // Fallback if fullscreen doesn't work
        if (newWindow) {
          // Try to make it fullscreen programmatically
          try {
            newWindow.moveTo(0, 0);
            newWindow.resizeTo(screen.width, screen.height);
          } catch (e) {
            console.log('Could not resize window programmatically');
          }
        }
      } catch (error) {
        // Fallback to regular new tab if fullscreen fails
        console.log('Fullscreen failed, opening regular new tab');
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    openFullscreen();
    onClose();
  }, [url, onClose]);

  // Show a brief loading message while opening
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Opening Link</h3>
          <p className="text-gray-600">{title}</p>
          <p className="text-sm text-gray-500 mt-2">Opening in fullscreen...</p>
        </div>
      </div>
    </div>
  );
}