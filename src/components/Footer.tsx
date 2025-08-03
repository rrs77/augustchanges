import React from 'react';
import { Music, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-3 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-1 md:space-y-0">
          {/* Left side - Curriculum Designer branding */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img
                src="/RLOGO copy copy.png"
                alt="Curriculum Designer"
                className="h-6 w-6 object-cover rounded"
                onError={(e) => {
                  // Fallback to Music icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1 rounded hidden">
                <Music className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold">Curriculum Designer</h3>
              <p className="text-xs text-gray-300">For Education</p>
            </div>
          </div>

          {/* Center - Links section */}
          <div className="flex items-center space-x-4 text-xs">
            <a 
              href="https://www.gov.uk/early-years-foundation-stage" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-gray-300 hover:text-blue-300 transition-colors duration-200"
            >
              <Globe className="h-3 w-3" />
              <span>Curriculum Framework</span>
            </a>
            
            <span className="text-gray-500">•</span>
            
            <a 
              href="mailto:contact@curriculumdesigner.com"
              className="text-gray-300 hover:text-blue-300 transition-colors duration-200"
            >
              Contact
            </a>
            
            <span className="text-gray-500">•</span>
            
            <span className="text-gray-300">© 2025 Curriculum Designer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}