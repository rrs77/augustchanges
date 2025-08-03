import React from 'react';

export function Footer() {
  return (
    <footer className="w-full bg-[#6a6f64] text-white/70 py-4 mt-16" style={{ fontFamily: 'OpenSansLight, sans-serif', fontSize: '14px' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Us Section */}
          <div>
            <h6 className="text-xl mb-5 text-white font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
              Contact Us
            </h6>
            <div>
              <a 
                href="tel:01245633231" 
                className="text-white/70 no-underline hover:text-white transition-colors"
              >
                01245 633 231
              </a>
              <br />
              <a 
                href="mailto:info@rhythmstix.co.uk" 
                className="text-white/70 no-underline hover:text-white transition-colors"
              >
                info@rhythmstix.co.uk
              </a>
              
              {/* SEO Text - Hidden */}
              <p className="text-transparent text-xs my-1">
                Rhythmstix: Songs and Teaching Resources
                Buy Interactive Lesson Guides, Musicals, Nativities, MusicTech Resources and Curriculum Resources for EYFS, KS1, KS2 AND KS3.
              </p>
              
              <div className="mt-2">
                Rhythmstix Ltd, 33 Vicarage Road, Chelmsford, Essex CM2 9BP
              </div>
              
              {/* SEO Text - Hidden */}
              <p className="text-transparent text-xs my-1">
                Rhythmstix: Songs and Teaching Resources
                Buy Interactive Lesson Guides, Musicals, Nativities, MusicTech Resources and Curriculum Resources for EYFS, KS1, KS2 AND KS3.
              </p>
            </div>
          </div>

          {/* Follow Us Section */}
          <div>
            <h6 className="text-xl mb-5 text-white font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
              Follow Us
            </h6>
            <div className="relative flex items-center justify-around min-h-[110px] w-[114%] -left-[7%] border-l-4 border-r-4 border-white md:border-l-4 md:border-r-4 md:w-[114%] md:-left-[7%] max-md:border-l-0 max-md:border-r-0 max-md:w-full max-md:left-0">
              <a 
                href="https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw"
                className="text-white/70 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-youtube text-5xl"></i>
              </a>
              <a 
                href="https://www.linkedin.com/in/robert-reich-storer-974449144"
                className="text-white/70 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-linkedin text-5xl"></i>
              </a>
              <a 
                href="https://www.facebook.com/Rhythmstix-Music-108327688309431"
                className="text-white/70 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook text-5xl"></i>
              </a>
            </div>
          </div>

          {/* Useful Links Section */}
          <div>
            <h6 className="text-xl mb-5 text-white font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
              Useful Links
            </h6>
            <div className="w-full flex items-center">
              <div className="w-1/2">
                <a 
                  href="https://www.rhythmstix.co.uk/policy"
                  className="block text-white/70 no-underline hover:text-white transition-colors mb-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  App Privacy Notice
                </a>
                <a 
                  href="https://www.rhythmstix.co.uk/cookies/"
                  className="block text-white/70 no-underline hover:text-white transition-colors mb-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cookies
                </a>
                <a 
                  href="https://www.rhythmstix.co.uk/app/#content"
                  className="block text-white/70 no-underline hover:text-white transition-colors mb-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Software Downloads
                </a>
                <a 
                  href="https://www.rhythmstix.co.uk/about/#content"
                  className="block text-white/70 no-underline hover:text-white transition-colors mb-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright Section */}
      <div className="text-center mt-4 pt-4 border-t border-white/10">
        &copy; Rhythmstix 2025
      </div>
    </footer>
  );
}