// ContentLoader - A simple content management framework
const ContentLoader = {
    // Cache for loaded content
    contentCache: {},
    
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
            mainContainer.innerHTML = `<div class="main__content"><h1>Content Not Found</h1><p>Sorry, the requested content could not be loaded.</p></div>`;
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
        });
    },
    
    // Handle the content transition with animation
    transitionContent: function(container, newContent, contentId, updateHistory) {
      // Fade out current content
      container.style.opacity = '0';
      
      // After fade out, update content and fade back in
      setTimeout(() => {
        container.innerHTML = newContent;
        this.currentContent = contentId;
        
        // Update browser history if needed
        if (updateHistory) {
          history.pushState({ content: contentId }, contentId, window.location.pathname);
        }
        
        // Reinitialize any event listeners on the new content
        this.setupHiddenLinks();
        
        // Fade in new content
        container.style.opacity = '1';
      }, this.transitionDuration / 2);
    }
  };
  
  // Initialize the content loader when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ContentLoader.init();
  });