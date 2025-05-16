// ContentLoader - A simple content management framework
const ContentLoader = {
    // Cache for loaded content
    contentCache: {},
    
    // Cache for loaded CSS
    cssCache: {},
    
    // Track currently loaded CSS files
    loadedStylesheets: new Set(),
    
    // Current active content
    currentContent: 'home',
    
    // Transition duration in milliseconds (matching your CSS animation duration)
    transitionDuration: 600,
    
    // Initialize the content loader
    init: function() {
      // Store the original home content
      this.contentCache['home'] = document.querySelector('.main__container').innerHTML;
      
      // Set up click handlers for navigation items
      this.setupNavigation();
      
      // Set up click handlers for hidden links
      this.setupHiddenLinks();
      
      // Add a history state handler
      window.addEventListener('popstate', (event) => {
        if (event.state && event.state.content) {
          this.loadContent(event.state.content, false);
        } else {
          this.loadContent('home', false);
        }
      });
      
      // Push initial state
      history.replaceState({ content: 'home' }, 'Home', window.location.pathname);
      
      // Add the standardized animation CSS to the document
      this.addStandardAnimations();
    },
    
    // Add standardized animations that will apply to all content
    addStandardAnimations: function() {
      const standardAnimationsId = 'content-standard-animations';
      
      // Don't add it twice
      if (document.getElementById(standardAnimationsId)) {
        return;
      }
      
      const standardCSS = `
        /* Standard content animations */
        .content-animated h1 {
          opacity: 0;
          animation: fadeSlideIn var(--a-duration) ease-in-out forwards;
          animation-delay: var(--anim-offset);
        }
        
        .content-animated p {
          opacity: 0;
          animation: fadeSlideIn var(--a-duration) ease-in-out forwards;
        }
        
        .content-animated p:nth-of-type(1) {
          animation-delay: calc(var(--anim-offset) * 2);
        }
        
        .content-animated p:nth-of-type(2) {
          animation-delay: calc(var(--anim-offset) * 2.5);
        }
        
        .content-animated p:nth-of-type(3) {
          animation-delay: calc(var(--anim-offset) * 3);
        }
        
        .content-animated p:nth-of-type(4) {
          animation-delay: calc(var(--anim-offset) * 3.5);
        }
        
        .content-animated p:nth-of-type(5) {
          animation-delay: calc(var(--anim-offset) * 4);
        }
        
        .content-animated div:not(.main__content) {
          opacity: 0;
          animation: fadeSlideIn var(--a-duration) ease-in-out forwards;
        }
        
        .content-animated div:nth-of-type(1) {
          animation-delay: calc(var(--anim-offset) * 4.5);
        }
        
        .content-animated div:nth-of-type(2) {
          animation-delay: calc(var(--anim-offset) * 5);
        }
        
        .content-animated div:nth-of-type(3) {
          animation-delay: calc(var(--anim-offset) * 5.5);
        }
        
        /* Content transition animations */
        @keyframes contentFadeOutDown {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(30px);
          }
        }
        
        @keyframes contentFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .content-fade-out {
          animation: contentFadeOutDown 0.4s ease-in-out forwards;
        }
        
        .content-fade-in {
          animation: contentFadeInUp 0.4s ease-in-out forwards;
        }
      `;
      
      // Create a new style element
      const styleElement = document.createElement('style');
      styleElement.id = standardAnimationsId;
      styleElement.textContent = standardCSS;
      
      // Add it to the document head
      document.head.appendChild(styleElement);
    },
    
    // Set up navigation click handlers
    setupNavigation: function() {
      const navLinks = document.querySelectorAll('[data-dialog]');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const contentId = link.getAttribute('data-dialog');
          this.loadContent(contentId, true);
        });
      });
      
      // Home link
      const homeLink = document.querySelector('#navbar__logo');
      homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadContent('home', true);
      });
    },
    
    // Set up hidden links click handlers
    setupHiddenLinks: function() {
      const hiddenLinks = document.querySelectorAll('.hidden-link');
      hiddenLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          // Get the text content of the link to use as the content ID
          const contentId = link.textContent.trim().toLowerCase();
          this.loadContent(contentId, true);
        });
      });
    },
    
    // Load content by ID
    loadContent: function(contentId, updateHistory = true) {
      // Don't reload the same content
      if (contentId === this.currentContent) return;
      
      const mainContainer = document.querySelector('.main__container');
      
      // If content is in cache, load it immediately
      if (this.contentCache[contentId]) {
        this.transitionContent(mainContainer, this.contentCache[contentId], contentId, updateHistory);
      } else {
        // Otherwise, fetch from server
        this.fetchContent(contentId)
          .then(content => {
            this.contentCache[contentId] = content;
            this.transitionContent(mainContainer, content, contentId, updateHistory);
          })
          .catch(error => {
            console.error('Error loading content:', error);
            // Optional: Show error message in main container
            mainContainer.innerHTML = `<div class="main__content"><h1>Content Missing</h1><p>If you know how to contact me - do so. This is unacceptable !!!</p><p>Reload the page as well...every link is now broken... (click hsrp.cc at the bottom for a hard reload)</div>`;
          });
      }
    },
    
    // Fetch content from server
    fetchContent: function(contentId) {
      return fetch(`content/${contentId}.html`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Content not found');
          }
          return response.text();
        })
        .then(content => {
          // Also try to load matching CSS file
          this.loadContentCSS(contentId);
          return content;
        });
    },
    
    // Load content-specific CSS file
    loadContentCSS: function(contentId) {
      // Check if we already have this CSS in cache
      if (this.cssCache[contentId]) {
        this.applyContentCSS(contentId, this.cssCache[contentId]);
        return Promise.resolve();
      }
      
      // Try to fetch the CSS file
      return fetch(`content/${contentId}.css`)
        .then(response => {
          if (!response.ok) {
            // If CSS doesn't exist, just ignore - it's optional
            return null;
          }
          return response.text();
        })
        .then(cssText => {
          if (cssText) {
            // Cache the CSS
            this.cssCache[contentId] = cssText;
            // Apply the CSS
            this.applyContentCSS(contentId, cssText);
          }
        })
        .catch(error => {
          console.log('No CSS file for this content (this is okay):', error);
        });
    },
    
    // Apply content-specific CSS to the page
    applyContentCSS: function(contentId, cssText) {
      // Create a unique ID for this stylesheet
      const styleId = `content-style-${contentId}`;
      
      // If we already have this style loaded, don't add it again
      if (this.loadedStylesheets.has(styleId)) {
        return;
      }
      
      // Create a new style element
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = cssText;
      
      // Add it to the document head
      document.head.appendChild(styleElement);
      
      // Track that we've added this stylesheet
      this.loadedStylesheets.add(styleId);
    },
    
    // Remove content-specific CSS when not needed
    removeContentCSS: function(contentId) {
      const styleId = `content-style-${contentId}`;
      
      // If this stylesheet is loaded, remove it
      if (this.loadedStylesheets.has(styleId)) {
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
          this.loadedStylesheets.delete(styleId);
        }
      }
    },
    
    // Handle the content transition with animation
    transitionContent: function(container, newContent, contentId, updateHistory) {
      // Add class for fade out animation (slide down while fading out)
      container.classList.add('content-fade-out');
      
      // After fade out completes, update content and fade back in
      setTimeout(() => {
        // If we're changing content, handle CSS management
        if (this.currentContent !== contentId) {
          // Remove the old content's CSS if it exists
          if (this.currentContent !== 'home') {
            this.removeContentCSS(this.currentContent);
          }
        }
        
        // Update the content
        container.innerHTML = newContent;
        
        // Get the main content div
        const mainContent = container.querySelector('.main__content');
        
        // Add class for standardized animations
        if (mainContent) {
          mainContent.classList.add('content-animated');
        }
        
        // Remove the fade out class and add fade in
        container.classList.remove('content-fade-out');
        container.classList.add('content-fade-in');
        
        // Remove the fade in class after animation completes
        setTimeout(() => {
          container.classList.remove('content-fade-in');
        }, this.transitionDuration);
        
        this.currentContent = contentId;
        
        // Update browser history if needed
        if (updateHistory) {
          history.pushState({ content: contentId }, contentId, window.location.pathname);
        }
        
        // Reinitialize any event listeners on the new content
        this.setupHiddenLinks();
      }, 400); // Match this to the contentFadeOutDown animation duration
    }
  };
  
  // Initialize the content loader when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ContentLoader.init();
  });