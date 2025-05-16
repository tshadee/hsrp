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
  
  // Default background gradient (from styles.css)
  defaultBackground: 'linear-gradient(to top, #030303 0%, #171935 100%)',
  
  // Current background gradient
  currentBackground: 'linear-gradient(to top, #030303 0%, #171935 100%)',
  
  // Transition duration in milliseconds (matching your CSS animation duration)
  transitionDuration: 450,
  
  // Initialize the content loader
  init: function() {
    // Store the original home content
    this.contentCache['home'] = document.querySelector('.main__container').innerHTML;
    
    // Get the default background from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    this.defaultBackground = rootStyles.getPropertyValue('--content-background').trim() || this.defaultBackground;
    this.currentBackground = this.defaultBackground;
    
    // Modify main container to separate content from background
    this.setupMainContainer();
    
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
  
  // Setup the main container to handle background transitions
  setupMainContainer: function() {
    const mainContainer = document.querySelector('.main__container');
    
    // Create a background element that will handle transitions
    const backgroundElement = document.createElement('div');
    backgroundElement.className = 'main__background';
    backgroundElement.style.position = 'absolute';
    backgroundElement.style.top = '0';
    backgroundElement.style.left = '0';
    backgroundElement.style.width = '100%';
    backgroundElement.style.height = '100%';
    backgroundElement.style.zIndex = '0'; // Behind content
    backgroundElement.style.background = this.currentBackground;
    
    // Create a wrapper for the content
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'main__content-wrapper';
    
    // Move existing content to the wrapper
    const content = mainContainer.innerHTML;
    contentWrapper.innerHTML = content;
    
    // Make the main container position relative to contain absolute elements
    mainContainer.style.position = 'relative';
    
    // Clear and update the main container
    mainContainer.innerHTML = '';
    mainContainer.appendChild(backgroundElement);
    mainContainer.appendChild(contentWrapper);
    
    // Apply some basic styling to maintain layout
    contentWrapper.style.position = 'relative';
    contentWrapper.style.width = '100%';
    contentWrapper.style.height = '100%';
    contentWrapper.style.display = 'flex';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.zIndex = '1'; // Above background, but keeps hidden links accessible
    
    // Store references
    this.mainContainer = mainContainer;
    this.contentWrapper = contentWrapper;
    this.backgroundElement = backgroundElement;
  },
  
  // Method to change the background gradient
  changeBackground: function(newBackground) {
    if (!newBackground) {
      newBackground = this.defaultBackground;
    }
    
    if (newBackground !== this.currentBackground || this.backgroundElement.style.background !== newBackground) {
      // Apply the new background to the dedicated background element
      this.backgroundElement.style.background = newBackground;
      
      // Update the current background
      this.currentBackground = newBackground;
    }
  },
  
  // Add standardized animations that will apply to all content
  addStandardAnimations: function() {
    const standardAnimationsId = 'content-standard-animations';
    
    // Don't add it twice
    if (document.getElementById(standardAnimationsId)) {
      return;
    }
    
    const standardCSS = `
      /* Content transition animations */
      @keyframes contentFadeOutDown {
        0% {
          opacity: 1;
          transform: translateY(0px);
        }
        100% {
          opacity: 0;
          transform: translateY(8px);
        }
      }
      
      @keyframes contentFadeInUp {
        0% {
          opacity: 0;
          transform: translateY(-8px);
        }
        100% {
          opacity: 1;
          transform: translateY(0px);
        }
      }
      
      /* Content wrapper styles */
      .main__content-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        pointer-events: none; /* Allow clicks to pass through */
      }
      
      .main__content-wrapper * {
        pointer-events: auto; /* Re-enable clicks for children */
      }
      
      .content-fade-out {
        animation: contentFadeOutDown 0.3s ease-in-out forwards;
      }
      
      .content-fade-in {
        animation: contentFadeInUp 0.3s ease-in-out forwards;
      }
      
      /* Background transition */
      .main__background {
        transition: background 0.6s ease-in-out;
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
    if (homeLink) {
      homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadContent('home', true);
      });
    }
  },
  
  // Setup hidden links click handlers
  setupHiddenLinks: function() {
    setTimeout(() => {
      const hiddenLinks = document.querySelectorAll('.hidden-link');
      hiddenLinks.forEach(link => {
        // Remove any existing click handlers to prevent duplicates
        const clone = link.cloneNode(true);
        link.parentNode.replaceChild(clone, link);
        
        clone.addEventListener('click', (e) => {
          e.preventDefault();
          // Get the text content of the link to use as the content ID
          const contentId = clone.textContent.trim().toLowerCase();
          this.loadContent(contentId, true);
        });
      });
    }, 50); // Small delay to ensure DOM is ready
  },
  
  // Extract background from CSS content
  extractBackgroundGradient: function(cssText) {
    // Look for background gradient definitions
    const gradientRegex = /\s*--content-background\s*:\s*([^;]+);/;
    const match = cssText.match(gradientRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
  },
  
  // Load content by ID
  loadContent: function(contentId, updateHistory = true) {
    // Don't reload the same content
    if (contentId === this.currentContent) return;
    
    // If content is in cache, load it immediately
    if (this.contentCache[contentId]) {
      this.transitionContent(this.contentCache[contentId], contentId, updateHistory);
    } else {
      // Otherwise, fetch from server
      this.fetchContent(contentId)
        .then(content => {
          this.contentCache[contentId] = content;
          this.transitionContent(content, contentId, updateHistory);
        })
        .catch(error => {
          console.error('Error loading content:', error);
          // Optional: Show error message in main container
          this.contentWrapper.innerHTML = `<div class="main__content"><h1>Content Missing</h1><p>If you know how to contact me - do so. This is unacceptable !!!</p><p>Reload the page as well...every link is now broken... (click hsrp.cc at the bottom for a hard reload)</div>`;
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
        return this.loadContentCSS(contentId).then(() => content);
      });
  },
  
  // Load content-specific CSS file
  loadContentCSS: function(contentId) {
    // Special handling for home content
    if (contentId === 'home') {
      // Reset to default background with transition
      this.changeBackground(this.defaultBackground);
      return Promise.resolve();
    }
    
    // Check if we already have this CSS in cache
    if (this.cssCache[contentId]) {
      // Extract and apply the background gradient if defined
      const backgroundGradient = this.extractBackgroundGradient(this.cssCache[contentId]);
      if (backgroundGradient) {
        // Apply the background gradient
        this.changeBackground(backgroundGradient);
      }
      
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
          // Extract background gradient if defined
          const backgroundGradient = this.extractBackgroundGradient(cssText);
          if (backgroundGradient) {
            // Apply the background gradient
            this.changeBackground(backgroundGradient);
          }
          
          // Cache the CSS
          this.cssCache[contentId] = cssText;
          // Apply the CSS
          this.applyContentCSS(contentId, cssText);
        } else if (contentId !== 'home') {
          // If there's no CSS and not home, reset to default background
          this.changeBackground(this.defaultBackground);
        }
      })
      .catch(error => {
        console.log('No CSS file for this content (this is okay):', error);
        // If CSS fails to load and not home, reset to default background
        if (contentId !== 'home') {
          this.changeBackground(this.defaultBackground);
        }
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
  transitionContent: function(newContent, contentId, updateHistory) {
    // Add class for fade out animation to content wrapper only (not the background)
    this.contentWrapper.classList.add('content-fade-out');
    
    // Handle background transition first - to ensure it transitions smoothly
    if (contentId === 'home') {
      // Always reset to default background when going home
      this.changeBackground(this.defaultBackground);
    } else if (this.cssCache[contentId]) {
      // Extract background gradient if defined
      const backgroundGradient = this.extractBackgroundGradient(this.cssCache[contentId]);
      if (backgroundGradient) {
        // Apply the background gradient
        this.changeBackground(backgroundGradient);
      } else {
        // If no background defined in CSS, use default
        this.changeBackground(this.defaultBackground);
      }
    } else {
      // Try to load CSS for background info
      this.loadContentCSS(contentId);
    }
    
    // After fade out completes, update content and fade back in
    setTimeout(() => {
      // If we're changing content, handle CSS management
      if (this.currentContent !== contentId) {
        // Remove the old content's CSS if it exists and isn't home
        if (this.currentContent !== 'home') {
          this.removeContentCSS(this.currentContent);
        }
      }
      
      // Update the content
      this.contentWrapper.innerHTML = newContent;
      
      // Get the main content div
      const mainContent = this.contentWrapper.querySelector('.main__content');
      
      // Add class for standardized animations
      if (mainContent) {
        mainContent.classList.add('content-animated');
      }
      
      // Remove the fade out class and add fade in
      this.contentWrapper.classList.remove('content-fade-out');
      this.contentWrapper.classList.add('content-fade-in');
      
      // Set up any new hidden links in the content
      this.setupHiddenLinks();
      
      // Remove the fade in class after animation completes
      setTimeout(() => {
        this.contentWrapper.classList.remove('content-fade-in');
      }, this.transitionDuration);
      
      // Update current content reference
      this.currentContent = contentId;
      
      // Update browser history if needed
      if (updateHistory) {
        history.pushState({ content: contentId }, contentId, window.location.pathname);
      }
    }, 300); // Match this to the contentFadeOutDown animation duration
  }
};

// Initialize the content loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ContentLoader.init();
});