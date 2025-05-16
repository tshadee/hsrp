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
  
  defaultBackground: 'linear-gradient(to top, #030303 0%, #171935 100%)',
  currentBackground: 'linear-gradient(to top, #030303 0%, #171935 100%)',
  transitionDuration: 450,  // in ms
  
  // Initialize the content loader
  init: function() {
    // Store the original home content
    this.contentCache['home'] = document.querySelector('.main__container').innerHTML;
    
    // Get the default background from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    this.defaultBackground = rootStyles.getPropertyValue('--content-background').trim() || this.defaultBackground;
    this.currentBackground = this.defaultBackground;
    
    this.setupMainContainer();     // Modify main container to separate content from background
    this.createBackgroundElements(0);
    this.setupNavigation();
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
  
  setupMainContainer: function() {
    const mainContainer = document.querySelector('.main__container');
    
    // Make the main container position relative to contain absolute elements
    mainContainer.style.position = 'relative';
    
    // Create a wrapper for the content
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'main__content-wrapper';
    
    // Move existing content to the wrapper
    const content = mainContainer.innerHTML;
    contentWrapper.innerHTML = content;
    
    // Clear and update the main container
    mainContainer.innerHTML = '';
    mainContainer.appendChild(contentWrapper);
    
    // Apply some basic styling to maintain layout
    contentWrapper.style.position = 'relative';
    contentWrapper.style.width = '100%';
    contentWrapper.style.height = '100%';
    contentWrapper.style.display = 'flex';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.zIndex = '1'; // Above background
    
    // Store references
    this.mainContainer = mainContainer;
    this.contentWrapper = contentWrapper;
  },

  createBackgroundElements: function(new_bg) 
  {
    // Create a background container if it doesn't exist
    if (!this.backgroundContainer) {
      const backgroundContainer = document.createElement('div');
      backgroundContainer.className = 'background-container';
      backgroundContainer.style.position = 'absolute';
      backgroundContainer.style.top = '0';
      backgroundContainer.style.left = '0';
      backgroundContainer.style.width = '100%';
      backgroundContainer.style.height = '100%';
      backgroundContainer.style.zIndex = '0';
      
      this.mainContainer.appendChild(backgroundContainer);
      this.backgroundContainer = backgroundContainer;
    }
    
    // Initialize the background elements object if needed
    if (!this.backgroundElements) {
      this.backgroundElements = {};
    }
    
    // If creating initial backgrounds
    if (!new_bg) 
    {
      // Get all potential content IDs from your navigation
      const contentIds = ['home'];
      document.querySelectorAll('[data-dialog]').forEach(link => {
        contentIds.push(link.getAttribute('data-dialog'));
      });
      
      // Add home background first (will be visible by default)
      const homeBackground = document.createElement('div');
      homeBackground.className = 'background background--home background--active';
      homeBackground.style.position = 'absolute';
      homeBackground.style.top = '0';
      homeBackground.style.left = '0';
      homeBackground.style.width = '100%';
      homeBackground.style.height = '100%';
      homeBackground.style.background = this.defaultBackground;
      homeBackground.style.opacity = '1';
      homeBackground.style.transition = 'opacity 0.5s ease';
      
      this.backgroundContainer.appendChild(homeBackground);
      this.backgroundElements['home'] = homeBackground;
      
      // Add other backgrounds (initially invisible)
      for (const id of contentIds) {
        if (id === 'home') continue; // Skip home as we already added it
        
        const background = document.createElement('div');
        background.className = `background background--${id}`;
        background.style.position = 'absolute';
        background.style.top = '0';
        background.style.left = '0';
        background.style.width = '100%';
        background.style.height = '100%';
        background.style.opacity = '0';
        background.style.transition = 'opacity 0.5s ease';
        
        this.backgroundContainer.appendChild(background);
        this.backgroundElements[id] = background;
      }
    }
  },

  // Method to show the background for a specific content ID
  showBackground: function(contentId) {
    // Hide all backgrounds
    for (const id in this.backgroundElements) {
      const background = this.backgroundElements[id];
      background.style.opacity = '0';
      background.classList.remove('background--active');
    }
    
    // Show the requested background
    const background = this.backgroundElements[contentId];
    if (background) {
      background.style.opacity = '1';
      background.classList.add('background--active');
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

      /* Content Animations */
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
        margin-bottom: 1rem;
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

      .content-animated p:nth-of-type(6) {
        animation-delay: calc(var(--anim-offset) * 4.5);
      }

      .content-animated p:nth-of-type(7) {
        animation-delay: calc(var(--anim-offset) * 5);
      }

      .content-animated p:nth-of-type(8) {
        animation-delay: calc(var(--anim-offset) * 5.5);
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

      /* Background transition */
      .main__background {
        transition: background 0.5s ease-in-out;
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
    const hiddenLinks = this.contentWrapper.querySelectorAll('.hidden-link');
    hiddenLinks.forEach(link => {
      // Remove any existing click handlers to prevent duplicates
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
      
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        // Get the text content of the link to use as the content ID
        // const contentId = clone.getAttribute('data-dialog');
        const contentId = clone.textContent.trim().toLowerCase();
        this.loadContent(contentId, true);
      });
    });
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
    } 
    else 
    {
      // Otherwise, fetch from server
      this.fetchContent(contentId)
        .then(content => {
          this.contentCache[contentId] = content;
          this.transitionContent(content, contentId, updateHistory);
        })
        .catch(error => {
          console.error('Error loading content:', error);
          // Optional: Show error message in main container
          this.contentWrapper.innerHTML = `<div class="main__content"><h1>content missing</h1><p>if you know how to contact me - do so. this is unacceptable !</p><p>once you've done that, go look somewhere else</div>`;
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
  
  loadContentCSS: function(contentId) {
    // For home content, just show the home background
    if (contentId === 'home') {
      this.showBackground('home');
      return Promise.resolve();
    }
    
    // Ensure we have a background element for this content
    this.ensureBackgroundElement(contentId);
    
    // Check if we have CSS for this content
    if (this.cssCache[contentId]) {
      // Extract background gradient if defined
      const backgroundGradient = this.extractBackgroundGradient(this.cssCache[contentId]);
      if (backgroundGradient) {
        // Apply the background gradient to the corresponding element
        this.backgroundElements[contentId].style.background = backgroundGradient;
      } else {
        // If no background defined, use default
        this.backgroundElements[contentId].style.background = this.defaultBackground;
      }
      
      // Show this background
      this.showBackground(contentId);
      this.applyContentCSS(contentId, this.cssCache[contentId]);
      return Promise.resolve();
    }
    
    // Try to fetch CSS
    return fetch(`content/${contentId}.css`)
      .then(response => {
        if (!response.ok) return null;
        return response.text();
      })
      .then(cssText => {
        if (cssText) {
          // Cache the CSS
          this.cssCache[contentId] = cssText;
          
          // Extract and apply background gradient
          const backgroundGradient = this.extractBackgroundGradient(cssText);
          if (backgroundGradient) {
            this.backgroundElements[contentId].style.background = backgroundGradient;
          } else {
            this.backgroundElements[contentId].style.background = this.defaultBackground;
          }
          
          // Apply the CSS and show background
          this.applyContentCSS(contentId, cssText);
          this.showBackground(contentId);
        } else {
          // If no CSS, just use default background
          this.backgroundElements[contentId].style.background = this.defaultBackground;
          this.showBackground(contentId);
        }
      })
      .catch(() => {
        // On error, use default background
        this.backgroundElements[contentId].style.background = this.defaultBackground;
        this.showBackground(contentId);
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
  
  ensureBackgroundElement: function(contentId) {
    if (!this.backgroundElements[contentId]) {
      const background = document.createElement('div');
      background.className = `background background--${contentId}`;
      background.style.position = 'absolute';
      background.style.top = '0';
      background.style.left = '0';
      background.style.width = '100%';
      background.style.height = '100%';
      background.style.opacity = '0';
      background.style.transition = 'opacity 0.6s ease';
      
      this.backgroundContainer.appendChild(background);
      this.backgroundElements[contentId] = background;
    }
  },

  transitionContent: function(newContent, contentId, updateHistory) {
    // Add class for fade out animation to content wrapper
    this.contentWrapper.classList.add('content-fade-out');
    
    // Begin background transition right away
    if (contentId === 'home') {
      this.showBackground('home');
    } else if (this.cssCache[contentId]) {
      // Background properties should already be set on the element
      this.showBackground(contentId);
    } else {
      // Try to load CSS to set up background
      this.loadContentCSS(contentId);
    }
    
    // After fade out completes, update content and fade back in
    setTimeout(() => {
      // Rest of your content transition code...
      
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