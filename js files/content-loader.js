// Global variable exposure registry
if (!window.ExposedVars) {
  window.ExposedVars = new Map();
}

// Expose variables from any script
window.exposeVar = function (key, getter, setter, options = {}) {
  window.ExposedVars.set(key, {
    get: getter,
    set: setter,
    type: options.type || "auto", // 'number', 'string', 'boolean', 'color', 'auto'
    min: options.min,
    max: options.max,
    step: options.step || 1,
  });
  console.log(`Exposed variable: ${key}`);
};

// content management framework
const ContentLoader = {
  contentCache: {}, //cache for loaded content    (implement FIFO soon)
  breadcrumbStack: [], //breadcrumb stack
  cssCache: {}, //cache for loaded css        (implement FIFO soon)
  jsCache: {}, //cache for loaded JS scripts (implement FIFO soon)
  loadedStylesheets: new Set(), //track loaded CSS files
  loadedJSScripts: new Set(), //track loaded JS scripts
  activeJSModules: new Map(), //track active JS scripts
  currentContent: "", // current active content
  defaultBackground: "#171935",
  transitionDuration: 450, // in ms

  // Initialize the content loader
  init: function () {
    this.setupMainContainer(); // create main container (with wrapper)
    this.createBaseBackground();
    this.createFlatBackground(); // create the bottom gradiented background
    this.setupNavigation();
    this.setupHiddenLinks();
    this.setupSearchBar();
    this.exposeVariables();

    // Add a history state handler
    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.content) {
        this.loadContent(event.state.content, false);
      } else {
        this.loadContent("home", false);
      }
    });

    this.loadContent("home", false);
    // Push initial state
    history.replaceState({ content: "home" }, "Home", window.location.pathname);

    // Add the standardized animation CSS to the document
    this.addStandardAnimations();
  },

  //use this to expose configurable values
  exposeVariables: function () {
    // Expose transition duration
    window.exposeVar(
      "transition-duration",
      () => this.transitionDuration,
      (value) => {
        this.transitionDuration = Math.max(100, Math.min(2000, Number(value)));
      },
      { type: "number", min: 100, max: 2000, step: 50 }
    );

    // Expose default background
    window.exposeVar(
      "default-background",
      () => this.defaultBackground,
      (value) => {
        this.defaultBackground = value;
        if (this.baseBackgroundElement) {
          this.baseBackgroundElement.style.backgroundColor = value;
        }
      },
      { type: "color" }
    );

    // Expose current content (read-only)
    window.exposeVar(
      "current-content",
      () => this.currentContent,
      () => {}, // No setter - read only
      { type: "string" }
    );

    // Expose breadcrumb stack size
    window.exposeVar(
      "breadcrumb-count",
      () => this.breadcrumbStack.length,
      () => {}, // Read only
      { type: "number" }
    );
  },

  loadContentJS: function (contentId) {
    if (!this.cssCache[contentId]) return Promise.resolve();

    const jsPaths = this.extractJSPaths(this.cssCache[contentId]);

    if (jsPaths.length == 0) return Promise.resolve();

    const loadPromises = jsPaths.map((jsPath) =>
      this.loadJSFile(contentId, jsPath)
    );

    return Promise.all(loadPromises);
  },

  cleanupContentJS: function (contentId) {
    // Find all scripts for this content and clean them up
    for (const [scriptId, cleanupFn] of this.activeJSModules.entries()) {
      if (scriptId.includes(`content-js-${contentId}-`)) {
        try {
          if (typeof cleanupFn === "function") {
            cleanupFn();
          }
          this.activeJSModules.delete(scriptId);
          this.loadedJSScripts.delete(scriptId);

          // Clean up global cleanup object
          const cleanupObjName = `ContentLoaderJSCleanup_${scriptId}`;
          if (window[cleanupObjName]) {
            delete window[cleanupObjName];
          }
        } catch (error) {
          console.error(`Error during JS cleanup for ${scriptId}:`, error);
        }
      }
    }
  },

  executeJS: function (contentId, scriptId, jsCode) {
    try {
      if (!jsCode || typeof jsCode !== "string" || jsCode.trim().length === 0) {
        console.warn(`Empty or invalid JS code for ${scriptId}`);
        return;
      }

      // Create a wrapper that provides access to contentId and cleanup
      const wrappedCode = `
      //NOTE THAT THIS IS AN IIFE, DO NOT WRAP WITH FUNC(), USE EVAL()
        (function(contentId, cleanup) {
          "use strict";
          
          // Module cleanup function that gets called when content changes
          let moduleCleanup = null;
          
          // Register cleanup function
          function onCleanup(cleanupFn) {
            moduleCleanup = cleanupFn;
          }
          
          // Store cleanup function for later use
          cleanup.register = function() {
            return moduleCleanup;
          };
          
          try {

          //INJECTED CODE

          ${jsCode}

          //END OF INJECTION

          } catch (moduleError) {
            console.error('Error in module code for ${scriptId}:', moduleError);
            throw moduleError;
          }
          
        })('${contentId}', window["ContentLoaderJSCleanup_${scriptId}"]);
        //# sourceURL=${scriptId}.js
      `;

      // Create cleanup object
      window[`ContentLoaderJSCleanup_${scriptId}`] = {
        register: function () {
          return null;
        },
      };

      // Execute the wrapped code with better error handling
      try {
        eval(wrappedCode);
      } catch (evalError) {
        console.error(`Syntax error in JS code for ${scriptId}:`, evalError);
        console.error("Problematic code:", jsCode.substring(0, 300) + "...");
        throw evalError;
      }

      // Store the cleanup function
      const cleanupFn = window[`ContentLoaderJSCleanup_${scriptId}`].register();
      if (cleanupFn) {
        this.activeJSModules.set(scriptId, cleanupFn);
      }

      this.loadedJSScripts.add(scriptId);
      console.log(`Executed JS for content: ${contentId}, script: ${scriptId}`);
    } catch (error) {
      console.error(`Error executing JS for ${scriptId}:`, error);
      console.error("Full error details:", {
        contentId,
        scriptId,
        jsCodePreview: jsCode ? jsCode.substring(0, 100) + "..." : "null",
        error: error.message,
        stack: error.stack,
      });
    }
  },

  loadJSFile: function (contentId, jsPath) {
    const fullPath = jsPath.startsWith("http")
      ? jsPath
      : `content/js/${jsPath}`;
    const scriptId = `content-js-${contentId}-${jsPath.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}`;

    console.log(`Loading JS file for ${contentId}: ${fullPath}`);

    if (this.loadedJSScripts.has(scriptId)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      //if in cache, execute
      if (this.jsCache[fullPath]) {
        console.log(`Using cached JS for ${fullPath}`);
        this.executeJS(contentId, scriptId, this.jsCache[fullPath]);
        resolve();
        return;
      }

      //if not, fetch and execute (holy von neumann ahh)
      console.log(`Fetching JS file: ${fullPath}`);
      fetch(`${fullPath}?rnd=${Date.now()}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${fullPath}`);
          }
          return response.text();
        })
        .then((jsCode) => {
          console.log(
            `Fetched JS code for ${fullPath}, length: ${jsCode.length}`
          );
          console.log(`JS code preview:`, jsCode.substring(0, 200) + "...");

          this.jsCache[fullPath] = jsCode; //cache the code
          this.executeJS(contentId, scriptId, jsCode);
          resolve();
        })
        .catch((error) => {
          console.error(`Error fetch execute "${fullPath}":`, error);
          reject(error);
        });
    });
  },

  // extract JS paths from CSS custom properties
  extractJSPaths: function (cssText) {
    const jsPaths = [];
    const jsPathRegex = /--js-path(?:-\d+)?\s*:\s*['"]([^'"]+)['"]/g; //EEE!!!  EWWW!! REGEX!!!
    let match;

    while ((match = jsPathRegex.exec(cssText)) !== null) {
      jsPaths.push(match[1]);
    }

    return jsPaths;
  },

  preloadContent: function (contentId) {
    if (!this.contentCache[contentId]) {
      //check html cache
      fetch(`content/html/${contentId}.html?rnd=${Date.now()}`)
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error(`Failed to preload HTML for ${contentId}.html`);
        })
        .then((html) => {
          this.contentCache[contentId] = html;
          console.log(`Preloaded HTML ${contentId}.html`);
        })
        .catch((error) =>
          console.error(`Preload HTML error for ${contentId}.html:`, error)
        );
    }

    if (!this.cssCache[contentId]) {
      //check css cache
      fetch(`content/css/${contentId}.css?rnd=${Date.now()}`) //aggressively clear browser cache
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error(`Failed to preload CSS for ${contentId}.css`);
        })
        .then((cssText) => {
          this.cssCache[contentId] = cssText; //need to parse css for js file path
          console.log(`Preloaded CSS ${contentId}.css`);
        })
        .catch((error) =>
          console.error(`Preload CSS error for ${contentId}.css:`, error)
        );
    }
  },

  updateBreadcrumbs: function (contentId) {
    const existingIndex = this.breadcrumbStack.indexOf(contentId);
    if (existingIndex !== -1) {
      this.breadcrumbStack = this.breadcrumbStack.slice(0, existingIndex + 1); //get sliced !!
    } else {
      this.breadcrumbStack.push(contentId); // push new item
    }
  },

  renderBreadcrumbs: function () {
    const container = document.querySelector(".breadcrumb-container");
    if (!container) return;

    //scroll fix (vertical to horizontal scroll)
    container.addEventListener("wheel", function (e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.scrollLeft += e.deltaY;
      }
    });

    //breadcrumby logic (logic is crumbling as well! ! !)
    const existingCrumbs = Array.from(container.querySelectorAll("i")).map(
      (el) => el.textContent
    );
    const newCrumbs = this.breadcrumbStack.slice();

    let crumbDivIndex = 0; //where the new and old clash - the crumbs diverge!
    while (
      crumbDivIndex < existingCrumbs.length &&
      crumbDivIndex < newCrumbs.length &&
      existingCrumbs[crumbDivIndex] === newCrumbs[crumbDivIndex]
    ) {
      crumbDivIndex++;
    }

    //crumb removal
    for (let i = crumbDivIndex; i < existingCrumbs.length; i++) {
      const childElemIndex = i * 2;
      const crumbElem = container.children[childElemIndex];
      const arrowElem = container.children[childElemIndex - 1];

      if (crumbElem) {
        crumbElem.classList.add("breadcrumb-animate-out");
        crumbElem.classList.remove("breadcrumb-animate-in");
      }

      if (arrowElem) {
        arrowElem.classList.add("breadcrumb-animate-out");
        arrowElem.classList.remove("breadcrumb-animate-in");
      }

      //remove crumbs after anim done
      setTimeout(() => {
        while (
          container.children.length >
          this.breadcrumbStack.length * 2 - 1
        ) {
          container.lastChild.remove();
        }
      }, 400);
    }

    const baseDelay = 50; //crumb should load in faster than main page (?) check later anim
    let delay = 0;

    for (let i = crumbDivIndex; i < newCrumbs.length; i++) {
      if (container.children.length > 0) {
        const arrow = document.createElement("span");
        arrow.textContent = " → ";
        arrow.style.padding = "0px 5px";
        arrow.style.opacity = "0";
        arrow.classList.add("breadcrumb-animate-in");
        arrow.style.animationDelay = `${delay}ms`;
        arrow.style.zIndex = "1";
        container.appendChild(arrow);
      }

      const id = newCrumbs[i];
      const crumb = document.createElement("i");
      crumb.textContent = id;
      crumb.classList.add("normal-link-hyper", "breadcrumb-animate-in");
      crumb.style.opacity = "0";
      crumb.style.animationDelay = `${delay}ms`;
      crumb.style.zIndex = "1";

      crumb.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadContent(id, true);
      });

      container.appendChild(crumb);

      delay += baseDelay;
    }

    //auto scroll to latest addition
    requestAnimationFrame(() => {
      container.scrollTo({
        left: container.scrollWidth,
        behavior: "smooth",
      });
    });
  },

  createBaseBackground: function () {
    const baseBg = document.createElement("div");
    baseBg.className = "base-background";
    baseBg.style.position = "absolute";
    baseBg.style.top = "0";
    baseBg.style.left = "0";
    baseBg.style.width = "100%";
    baseBg.style.height = "100%";
    baseBg.style.zIndex = "0";
    baseBg.style.backgroundColor = this.defaultBackground;
    baseBg.style.transition = "background-color 0.4s ease";

    this.mainContainer.appendChild(baseBg);
    this.baseBackgroundElement = baseBg; // store reference
  },

  createFlatBackground: function () {
    const flat_bg = document.createElement("flat-bg");
    flat_bg.style.position = "absolute";
    flat_bg.style.width = "100%";
    flat_bg.style.top = "0px";
    flat_bg.style.left = "0px";
    flat_bg.style.height = "84vh";
    flat_bg.style.backgroundImage =
      "linear-gradient(to top,rgba(3, 3, 3, 0.99) 0%, rgba(3, 3, 3, 0) 100% ), repeating-linear-gradient(45deg,rgba(255, 255, 255, 0.01) 0px, rgba(255, 255, 255, 0.01) 1px, transparent 1px, transparent 2px)";
    flat_bg.style.zIndex = "2";
    this.mainContainer.appendChild(flat_bg);
  },

  setupMainContainer: function () {
    const mainContainer = document.querySelector(".main__container");

    // Make the main container position relative to contain absolute elements
    mainContainer.style.position = "relative";

    // Create a wrapper for the content
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "main__content-wrapper";

    // Move existing content to the wrapper
    const content = mainContainer.innerHTML;
    contentWrapper.innerHTML = content;

    // Clear and update the main container
    mainContainer.innerHTML = "";
    mainContainer.appendChild(contentWrapper);

    // Apply some basic styling to maintain layout
    contentWrapper.style.position = "relative";
    contentWrapper.style.width = "100%";
    contentWrapper.style.height = "100%";
    contentWrapper.style.display = "flex";
    contentWrapper.style.alignItems = "center";
    contentWrapper.style.zIndex = "3"; // Above background

    // Store references
    this.mainContainer = mainContainer;
    this.contentWrapper = contentWrapper;
  },

  // Add standardized animations that will apply to all content
  addStandardAnimations: function () {
    const standardAnimationsId = "content-standard-animations";

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
        pointer-events: none; /* allow clicks to pass through */
      }
      
      .main__content-wrapper * {
        pointer-events: auto; /* re-enable clicks for children */
      }
      
      .content-fade-out {
        animation: contentFadeOutDown 0.25s ease-in-out forwards;
      }
      
      .content-fade-in {
        animation: contentFadeInUp 0.25s ease-in-out forwards;
      }
    `;

    // Create a new style element
    const styleElement = document.createElement("style");
    styleElement.id = standardAnimationsId;
    styleElement.textContent = standardCSS;

    // Add it to the document head
    document.head.appendChild(styleElement);
  },

  // Set up navigation click handlers
  setupNavigation: function () {
    const navLinks = document.querySelectorAll("[data-dialog]");
    navLinks.forEach((link) => {
      const contentId = link.getAttribute("data-dialog");
      this.preloadContent(contentId);
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadContent(contentId, true);
      });
    });

    // Home link
    const homeLink = document.querySelector("#navbar__logo");
    if (homeLink) {
      this.preloadContent("home");
      homeLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.loadContent("home", true);
      });
    }
  },

  // Setup hidden links click handlers
  setupHiddenLinks: function () {
    const hiddenLinks = this.contentWrapper.querySelectorAll(".hidden-link");
    hiddenLinks.forEach((link) => {
      // Remove any existing click handlers to prevent duplicates
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);

      const contentId =
        clone.textContent.trim().toLowerCase() ||
        clone.getAttribute("data-dialog");
      if (contentId) {
        this.preloadContent(contentId);
        clone.addEventListener("click", (e) => {
          e.preventDefault();
          this.loadContent(contentId, true);
        });
      }
    });

    const hiddenLinksRed =
      this.contentWrapper.querySelectorAll(".hidden-link-red");
    hiddenLinksRed.forEach((link) => {
      // Remove any existing click handlers to prevent duplicates
      const clone = link.cloneNode(true);
      link.parentNode.replaceChild(clone, link);
      const contentId = clone.getAttribute("data-dialog");
      if (contentId) {
        this.preloadContent(contentId);
        clone.addEventListener("click", (e) => {
          e.preventDefault();
          this.loadContent(contentId, true);
        });
      }
    });
  },

  setupSearchBar: function () {
    const searchInput = document.querySelector(".search-input");
    if (!searchInput) return;

    searchInput.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        event.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;
        const testQuery = `content/html/${query}.html`;
        fetch(testQuery)
          .then((response) => {
            if (response.ok) {
              this.loadContent(query, true);
              searchInput.value = "";
            } else {
              this.showSearchError(searchInput);
            }
          })
          .catch(() => {
            this.showSearchError(searchInput);
          });
      }
    });
  },

  showSearchError: function (inputElem) {
    inputElem.classList.add("search-input--error");
    setTimeout(() => {
      inputElem.classList.remove("search-input--error");
    }, 500);
  },

  // Load content by ID
  loadContent: function (contentId, updateHistory = true) {
    // Don't reload the same content
    if (contentId === this.currentContent) return;

    // If content is in cache, load it immediately
    if (this.contentCache[contentId]) {
      this.loadContentCSS(contentId).then(() => {
        this.transitionContent(
          this.contentCache[contentId],
          contentId,
          updateHistory
        );
      });
    } else {
      // Otherwise, fetch from server
      this.fetchContent(contentId)
        .then((content) => {
          this.contentCache[contentId] = content;
          this.transitionContent(content, contentId, updateHistory);
        })
        .catch((error) => {
          console.error("Error loading content:", error);
        });
    }
  },

  // Fetch content from server
  fetchContent: function (contentId) {
    return fetch(`content/html/${contentId}.html?rnd=${Date.now()}`)
      .then((response) => {
        if (!response.ok) {
          let currentBg = this.baseBackgroundElement.style.backgroundColor;
          this.baseBackgroundElement.style.backgroundColor = "#550000";
          setTimeout(() => {
            this.baseBackgroundElement.style.backgroundColor = currentBg;
          }, 600);
          throw new Error("Content not found");
        }
        return response.text();
      })
      .then((content) => {
        // Also try to load matching CSS file
        return this.loadContentCSS(contentId).then(() => content);
      });
  },

  loadContentCSS: function (contentId) {
    // Check if we have CSS for this content
    if (this.cssCache[contentId]) {
      this.applyContentCSS(contentId, this.cssCache[contentId]);
      return this.loadContentJS(contentId);
    }

    // Try to fetch CSS
    const cssUrl = `content/css/${contentId}.css?rnd=${Date.now()}`;
    return fetch(cssUrl)
      .then((response) => {
        if (!response.ok) return null;
        return response.text();
      })
      .then((cssText) => {
        if (cssText) {
          // Cache the CSS
          this.cssCache[contentId] = cssText;
          // Apply the CSS
          this.applyContentCSS(contentId, cssText);
          // Load associated JS files
          return this.loadContentJS(contentId);
        }
      })
      .catch((error) => {
        console.error(`Failed to load content (LCCSS) of ${contentId}:`, error);
      });
  },

  // Apply content-specific CSS to the page
  applyContentCSS: function (contentId, cssText) {
    const styleId = `content-style-${contentId}`;

    // Remove existing if any (defensive)
    if (this.loadedStylesheets.has(styleId)) {
      const existing = document.getElementById(styleId);
      if (existing) {
        return;
      } else {
        this.loadedStylesheets.delete(styleId);
      }
    }

    // Add fresh style
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = cssText;

    document.head.appendChild(styleElement);
    this.loadedStylesheets.add(styleId);
  },

  // Remove content-specific CSS when not needed
  removeContentCSS: function (contentId) {
    const styleId = `content-style-${contentId}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
    this.loadedStylesheets.delete(styleId);
  },

  transitionContent: function (newContent, contentId, updateHistory) {
    // Add class for fade out animation to content wrapper
    this.contentWrapper.classList.add("content-fade-out");
    this.updateBreadcrumbs(contentId);
    this.renderBreadcrumbs();

    // Begin background transition right away
    this.loadContentCSS(contentId);
    const rootStyles = getComputedStyle(document.documentElement);
    const newBgColor =
      rootStyles.getPropertyValue("--base-bg-color").trim() ||
      this.defaultBackground;
    if (newBgColor) {
      this.baseBackgroundElement.style.backgroundColor = newBgColor;
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    // After fade out completes, update content and fade back in
    setTimeout(() => {
      // if changing content, handle content management
      if (this.currentContent !== contentId) {
        this.removeContentCSS(this.currentContent); //clean up css
        this.cleanupContentJS(this.currentContent); //clean up JS
      }

      // Update the content
      this.contentWrapper.innerHTML = newContent;

      // Get the main content div
      const mainContent = this.contentWrapper.querySelector(".main__content");

      // procedural animation
      if (mainContent) {
        const animatableSelectors = ["h1", "h2", "p", "ul", "ol", "li", "img"];
        const elements = mainContent.querySelectorAll(
          animatableSelectors.join(", ")
        );

        const maxDelay = 300; //ms
        let delayFromLength = clamp(40, maxDelay / elements.length, 100);

        const baseDelay = 85; // ms
        const animationDuration = 350; // ms
        let delay = 0;

        elements.forEach((el) => {
          el.style.opacity = "0";
          el.style.animation = `fadeSlideIn ${animationDuration}ms ease-in-out forwards`;
          el.style.animationDelay = `${delay}ms`;
          delay += delayFromLength;
        });
      }

      // Remove the fade out class and add fade in
      this.contentWrapper.classList.remove("content-fade-out");
      this.contentWrapper.classList.add("content-fade-in");

      // Set up any new hidden links in the content
      this.setupHiddenLinks();

      // Remove the fade in class after animation completes
      setTimeout(() => {
        this.contentWrapper.classList.remove("content-fade-in");
      }, this.transitionDuration);

      // Update current content reference
      this.currentContent = contentId;

      // Update browser history if needed
      if (updateHistory) {
        history.pushState(
          { content: contentId },
          contentId,
          window.location.pathname
        );
      }
    }, 300); // Match this to the contentFadeOutDown animation duration
  },
};

// Initialize the content loader when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  ContentLoader.init();
});
