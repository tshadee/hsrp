// ContentLoader - A simple content management framework
const ContentLoader = {
  // Cache for loaded content
  contentCache: {},
  
  // Cache for loaded CSS
  cssCache: {},
  
  // Track currently loaded CSS files
  loadedStylesheets: new Set(),
  
  // Current active content
  currentContent: '',
  
  defaultBackground: '#171935',
  currentBackground: '#171935',
  transitionDuration: 450,  // in ms
  
  // Initialize the content loader
  init: function() {
    
    this.setupMainContainer();    // create main container (with wrapper)
    this.createBaseBackground();
    this.createFlatBackground();  // create the bottom gradiented background
    this.setupNavigation();
    this.setupHiddenLinks();
    this.setupSearchBar();

    // Add a history state handler
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.content) {
        this.loadContent(event.state.content, false);
      } else {
        this.loadContent('home', false);
      }
    });
    
    this.loadContent('home', false);
    // Push initial state
    history.replaceState({ content: 'home' }, 'Home', window.location.pathname);
    
    // Add the standardized animation CSS to the document
    this.addStandardAnimations();
  },

  createBaseBackground: function () {
    const baseBg = document.createElement('div');
    baseBg.className = 'base-background';
    baseBg.style.position = 'absolute';
    baseBg.style.top = '0';
    baseBg.style.left = '0';
    baseBg.style.width = '100%';
    baseBg.style.height = '100%';
    baseBg.style.zIndex = '0';
    baseBg.style.backgroundColor = this.defaultBackground;
    baseBg.style.transition = 'background-color 0.4s ease';
    
    this.mainContainer.appendChild(baseBg);
    this.baseBackgroundElement = baseBg; // store reference
  },

  createFlatBackground:function(){
    const flat_bg = document.createElement('flat-bg');
    flat_bg.style.position = 'absolute';
    flat_bg.style.width = '100%';
    flat_bg.style.top = '0px';
    flat_bg.style.left = '0px';
    flat_bg.style.height = '84vh';
    flat_bg.style.backgroundImage = 'linear-gradient(to top,rgba(3, 3, 3, 0.99) 0%, rgba(3, 3, 3, 0) 100% ), repeating-linear-gradient(45deg,rgba(255, 255, 255, 0.01) 0px, rgba(255, 255, 255, 0.01) 1px, transparent 1px, transparent 2px)';
    flat_bg.style.zIndex = '2';
    this.mainContainer.appendChild(flat_bg);
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
    contentWrapper.style.zIndex = '3'; // Above background
    
    // Store references
    this.mainContainer = mainContainer;
    this.contentWrapper = contentWrapper;
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
        animation: contentFadeOutDown 0.25s ease-in-out forwards;
      }
      
      .content-fade-in {
        animation: contentFadeInUp 0.25s ease-in-out forwards;
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

      .content-animated div:nth-of-type(4) {
        animation-delay: calc(var(--anim-offset) * 6);
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
        const contentId = clone.textContent.trim().toLowerCase();
        if(!contentId)
        {
          contentId = clone.getAttribute('data-dialog');
        }
        this.loadContent(contentId, true);
      });
    });
    const hiddenLinksRed = this.contentWrapper.querySelectorAll('.hidden-link-red');
    hiddenLinksRed.forEach(link => {
      // Remove any existing click handlers to prevent duplicates
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
      
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        // Get the text content of the link to use as the content ID
        contentId = clone.getAttribute('data-dialog');
        this.loadContent(contentId, true);
      });
    });

  },

  setupSearchBar: function() {
    const searchInput = document.querySelector('.search-input');
    if(!searchInput) return;

    searchInput.addEventListener('keydown', (event)=>{
      if(event.key == 'Enter')
      {
        event.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if(!query) return;
        const testQuery = `content/${query}.html`;
        fetch(testQuery)
        .then(response => {
          if(response.ok) {
            this.loadContent(query,true);
            searchInput.value = '';
          } else {
            this.showSearchError(searchInput);
          }
        })
        .catch(() => {
          this.showSearchError(searchInput)
        })
      }
    });
  },

  showSearchError: function(inputElem){
    inputElem.classList.add('search-input--error');
    setTimeout(() => {
      inputElem.classList.remove('search-input--error');
    }, 500);
  },
  
  // Load content by ID
  loadContent: function(contentId, updateHistory = true) {
    // Don't reload the same content
    if (contentId === this.currentContent) return;
    
    // If content is in cache, load it immediately
    if (this.contentCache[contentId]) {
      this.loadContentCSS(contentId).then(() => {
        this.transitionContent(this.contentCache[contentId], contentId, updateHistory);
      });
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
    // Check if we have CSS for this content
    if (this.cssCache[contentId]) {
      this.applyContentCSS(contentId, this.cssCache[contentId]);
      return Promise.resolve();
    }
    
    // Try to fetch CSS
    const cssUrl = `content/${contentId}.css?rnd=${Date.now()}`;
    return fetch(cssUrl)
      .then(response => {
        if (!response.ok) return null;
        return response.text();
      })
      .then(cssText => {
        if (cssText) {
          // Cache the CSS
          this.cssCache[contentId] = cssText;
          // Apply the CSS 
          this.applyContentCSS(contentId, cssText);
        };
      })
      .catch(() => {
        //old background code
      });
  },
  
  // Apply content-specific CSS to the page
  applyContentCSS: function(contentId, cssText) {
    const styleId = `content-style-${contentId}`;

    // Remove existing if any (defensive)
    if(this.loadedStylesheets.has(styleId)) {
      const existing = document.getElementById(styleId);
      if (existing){
        return;
      } else {
        this.loadedStylesheets.delete(styleId);
      }
    }

    // Add fresh style
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = cssText;

    document.head.appendChild(styleElement);
    this.loadedStylesheets.add(styleId);
  },
  
  // Remove content-specific CSS when not needed
  removeContentCSS: function(contentId) {
    const styleId = `content-style-${contentId}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
    this.loadedStylesheets.delete(styleId);
  },

  transitionContent: function(newContent, contentId, updateHistory) {
    // Add class for fade out animation to content wrapper
    this.contentWrapper.classList.add('content-fade-out');
    
    // Begin background transition right away
    this.loadContentCSS(contentId);
    const rootStyles = getComputedStyle(document.documentElement);
    const newBgColor = rootStyles.getPropertyValue('--base-bg-color').trim() || this.defaultBackground;
    if (newBgColor) {
      this.baseBackgroundElement.style.backgroundColor = newBgColor;
    }

    // After fade out completes, update content and fade back in
    setTimeout(() => {
      
      // If we're changing content, handle CSS management
      if (this.currentContent !== contentId) {
        this.removeContentCSS(this.currentContent);
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