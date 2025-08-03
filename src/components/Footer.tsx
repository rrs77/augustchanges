import React from 'react';

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-3 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          
          {/* Left side - Contact */}
          <div className="flex items-center space-x-4 text-sm">
            <a 
              href="tel:01245633231" 
              className="text-gray-300 hover:text-blue-300 transition-colors duration-200"
            >
              01245 633 231
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="mailto:info@rhythmstix.co.uk" 
              className="text-gray-300 hover:text-blue-300 transition-colors duration-200"
            >
              info@rhythmstix.co.uk
            </a>
          </div>

          {/* Center - Social Media */}
          <div className="flex items-center space-x-4">
            <a 
              href="https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw"
              className="text-gray-300 hover:text-red-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <i className="fab fa-youtube text-xl"></i>
            </a>
            <a 
              href="https://www.linkedin.com/in/robert-reich-storer-974449144"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <i className="fab fa-linkedin text-xl"></i>
            </a>
            <a 
              href="https://www.facebook.com/Rhythmstix-Music-108327688309431"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook text-xl"></i>
            </a>
          </div>

          {/* Right side - Copyright and Links */}
          <div className="flex items-center space-x-4 text-sm">
            <a 
              href="https://www.rhythmstix.co.uk/policy"
              className="text-gray-300 hover:text-blue-300 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">© 2025 Rhythmstix</span>
          </div>
          
        </div>
      </div>
    </footer>
  );
}