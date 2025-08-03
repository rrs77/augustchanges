import React from 'react';

export function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Contact Us Section */}
          <div>
            <h6 className="text-xl font-semibold mb-4 text-white">
              Contact Us
            </h6>
            <div className="space-y-2">
              <div>
                <a 
                  href="tel:01245633231" 
                  className="text-gray-300 hover:text-blue-300 transition-colors duration-200"
                >
                  01245 633 231
                </a>
              </div>
              <div>
                <a 
                  href="mailto:info@rhythmstix.co.uk" 
                  className="text-gray-300 hover:text-blue-300 transition-colors duration-200"
                >
                  info@rhythmstix.co.uk
                </a>
              </div>
              
              {/* SEO Text - Hidden */}
              <p className="text-transparent text-[7px] leading-none">
                Rhythmstix: Songs and Teaching Resources
                Buy Interactive Lesson Guides, Musicals, Nativities, MusicTech Resources and Curriculum Resources for EYFS, KS1, KS2 AND KS3.
              </p>
              
              <div className="text-gray-300 text-sm mt-3">
                Rhythmstix Ltd, 33 Vicarage Road, Chelmsford, Essex CM2 9BP
              </div>
              
              {/* SEO Text - Hidden */}
              <p className="text-transparent text-[7px] leading-none">
                Rhythmstix: Songs and Teaching Resources
                Buy Interactive Lesson Guides, Musicals, Nativities, MusicTech Resources and Curriculum Resources for EYFS, KS1, KS2 AND KS3.
              </p>
            </div>
          </div>

          {/* Follow Us Section */}
          <div>
            <h6 className="text-xl font-semibold mb-4 text-white">
              Follow Us
            </h6>
            <div className="flex justify-center space-x-6 py-4 border-l-2 border-r-2 border-white/20">
              <a 
                href="https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw"
                className="text-gray-300 hover:text-red-400 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <i className="fab fa-youtube text-4xl"></i>
              </a>
              <a 
                href="https://www.linkedin.com/in/robert-reich-storer-974449144"
                className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin text-4xl"></i>
              </a>
              <a 
                href="https://www.facebook.com/Rhythmstix-Music-108327688309431"
                className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook text-4xl"></i>
              </a>
            </div>
          </div>

          {/* Useful Links Section */}
          <div>
            <h6 className="text-xl font-semibold mb-4 text-white">
              Useful Links
            </h6>
            <div className="space-y-2">
              <a 
                href="https://www.rhythmstix.co.uk/policy"
                className="block text-gray-300 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                App Privacy Notice
              </a>
              <a 
                href="https://www.rhythmstix.co.uk/cookies/"
                className="block text-gray-300 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cookies
              </a>
              <a 
                href="https://www.rhythmstix.co.uk/app/#content"
                className="block text-gray-300 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Software Downloads
              </a>
              <a 
                href="https://www.rhythmstix.co.uk/about/#content"
                className="block text-gray-300 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                About Us
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="border-t border-white/20 mt-8 pt-4 text-center">
          <p className="text-gray-300">
            &copy; Rhythmstix 2025
          </p>
        </div>
      </div>
    </footer>
  );
}