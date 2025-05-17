function addAdvancedMarineSnowEffect() {
    // Add this function to ContentLoader object
    ContentLoader.createMarineSnowEffect = function(options = {}) {
      // Default configuration that can be overridden
      const config = {
        particleCount: options.particleCount,
        speedFactor: options.speedFactor,
        minSize: options.minSize,
        maxSize: options.maxSize,
        blurAmount: options.blurAmount,
        opacity: options.opacity || 0.6,
        color: options.color || 'rgba(255, 255, 255, 0.5)'
      };
      
      // Create a container for our marine snow particles
      const snowContainer = document.createElement('div');
      snowContainer.className = 'marine-snow-container';
      snowContainer.style.position = 'absolute';
      snowContainer.style.top = '0';
      snowContainer.style.left = '0';
      snowContainer.style.width = '100%';
      snowContainer.style.height = '100%';
      snowContainer.style.pointerEvents = 'none';
      snowContainer.style.zIndex = '1';
      snowContainer.style.overflow = 'hidden';
      snowContainer.style.userSelect = 'none';
      snowContainer.style.filter = `blur(${config.blurAmount})`;
      snowContainer.style.opacity = config.opacity.toString();
      
      // Add some CSS for the marine snow effect
      const snowStylesId = 'marine-snow-styles';
      if (!document.getElementById(snowStylesId)) {
        const snowStyles = document.createElement('style');
        snowStyles.id = snowStylesId;
        snowStyles.textContent = `
        .snow-particle 
        {
            position: absolute;
            background-color: ${config.color};
            border-radius: 50%;
            pointer-events: none;
            user-select: none;
            animation-name: snowfall;
            animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
            animation-iteration-count: infinite;
            opacity: 0;
            transition: opacity 0.8s ease-in-out;
        }
          
        @keyframes snowfall 
        {
            0% {
                transform: translateY(-10px) translateX(0);
            }
            100% {
                transform: translateY(var(--drift-y)) translateX(var(--drift-x));
            }
        }

          
        @keyframes sway 
        {
            0%, 100% 
            {
                transform: translateX(0px);
            }
            50% 
            {
                transform: translateX(var(--sway-amount));
            }
        }
        `;
        document.head.appendChild(snowStyles);
      }
      
      // Add the container to the main container, but below the content wrapper
      this.mainContainer.insertBefore(snowContainer, this.mainContainer.firstChild);
      
      // Store a reference to the snow container and config
      this.snowContainer = snowContainer;
      this.snowConfig = config;
      this.snowParticles = [];
      
      // Generate the initial set of particles
      setInterval(() => {
        this.generateSnowParticles();
      }, 2000);

      setInterval(() => {
        this.snowParticles = this.snowParticles.filter(p => {
          const rect = p.getBoundingClientRect();
          if (rect.top > container.offsetHeight || rect.top > window.innerHeight) {
            if (p.remove) p.remove();
            return false;
          }
          return true;
        });
      }, 300);
    };
    
    // Function to generate snow particles
    ContentLoader.generateSnowParticles = function(snowParticles) {
      const container = this.snowContainer;
      const config = this.snowConfig;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      // Clear any existing particles
      //   container.innerHTML = '';
      
      // Create particles
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'snow-particle';
        
        // Random particle properties
        const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
        const posX = Math.random() * containerWidth;
        const posY = Math.random() * containerHeight;
        const duration = (Math.random() * 15 + 10) / config.speedFactor;
        const baseOpacity = Math.random() * 0.5 + 0.3; // Opacity between 0.3-0.8
        const driftX = Math.random() * 100 - 50; // Horizontal drift, between -50px and 50px
        const driftY = containerHeight - posY;
        const swayAmount = Math.random() * 10 - 5; // How much the particle sways

        const yTimeOffsetPercent = posY/containerHeight;
        const adjustedDriftX = driftX * (1-yTimeOffsetPercent);
        const adjustedDuration = duration * (1-yTimeOffsetPercent);
        
        // Apply styles
        particle.style.zIndex = '4';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.setProperty('--base-opacity', `${baseOpacity}`);
        particle.style.setProperty('--drift-x', `${adjustedDriftX}px`);
        particle.style.setProperty('--sway-amount', `${swayAmount}px`);
        particle.style.setProperty('--drift-y', `${driftY}px`);
        particle.style.animationName = 'snowfall, sway';
        particle.style.animationDuration = `${adjustedDuration}s, ${adjustedDuration}s`;
        particle.style.animationTimingFunction = 'linear, ease-in-out';
        particle.style.animationDelay = `0.05s, 0.05s`;
        particle.style.animationIterationCount = '1, 1';
        particle.style.animationComposition = 'add, add'; 
        particle.style.animationFillMode = 'forwards';

        
        // Add additional sway animation
        particle.style.animation = `
          snowfall ${adjustedDuration}s linear 1,
          sway ${adjustedDuration}s ease-in-out 1
        `;

        // Add to container
        particle.style.opacity = "0";
        container.appendChild(particle);
        this.snowParticles.push(particle);
        setTimeout(() => {
            particle.style.opacity = baseOpacity;
        }, 300);

        // FIFO limit enforcement
        if (this.snowParticles.length > config.particleCount) 
        {
            const oldest = this.snowParticles.shift();
            if (oldest && oldest.remove) oldest.remove();
        };

        particle.addEventListener('animationend', () => {
            particle.style.opacity = "0";
            setTimeout(() => {
                particle.remove();
                const index = this.snowParticles.indexOf(particle);
                if (index > -1) {
                this.snowParticles.splice(index, 1);
                }
            }, 800);
        });
      };
    };
    
    // Hook into the ContentLoader.init function to add the marine snow effect
    const originalInit = ContentLoader.init;
    ContentLoader.init = function() {
      // Call the original init function
      originalInit.call(this);
      
      // Add our marine snow effect with optional configuration
      this.createMarineSnowEffect({
        particleCount: 300,          // Number of particles
        speedFactor: 0.2,           // Speed of falling (lower is slower)
        minSize: 3,                 // Minimum particle size in pixels
        maxSize: 8,                 // Maximum particle size in pixels
        blurAmount: '2px',        // Blur filter amount
        opacity: 0.4,               // Overall opacity of the effect
        color: 'rgba(255, 255, 255, 0.43)'  // Particle color
      });
      
      // Re-generate particles on window resize
      window.addEventListener('resize', () => {
        this.generateSnowParticles();
      });
    };
  }
  
  // Call our function to extend ContentLoader
  addAdvancedMarineSnowEffect();