function addAdvancedMarineSnowEffect() {
    ContentLoader.createMarineSnowEffect = function (options = {}) {
        const totalLayers = options.layers || 3;

        for (let i = 0; i < totalLayers; i++) 
        {
            const depth = i / (totalLayers - 1); // 0 front → 1 back
            const layerConfig = 
            {
                ...options,
                layerId: `marineSnowCanvasLayer${i}`,
                zIndex: 1 + i,
                opacity: options.opacity * (1 - depth * 0.7), 
                blurAmount: `calc(${options.blurAmount} * ${0.5 + depth * 1.5})`,
                particleCount: Math.floor(options.particleCount * (1 + depth)),
                minSize: options.minSize * (1 - depth * 0.3),
                maxSize: options.maxSize * (1 - depth * 0.3),
                terminalVelocity: options.terminalVelocity * (1 - depth * 0.4),
                mouseInfluenceRadius: options.mouseInfluenceRadius * (1 - depth * 0.6),
                mouseForce: options.mouseForce * (1 - depth * 0.6)
            };
      
            createMarineSnowLayer(this.mainContainer, layerConfig);
        };
  
        function createMarineSnowLayer(container,config)
        {
            const canvas = document.createElement('canvas');
            canvas.id = 'marineSnowCanvas';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '1';
            canvas.style.userSelect = 'none';
            canvas.style.filter = `blur(${config.blurAmount})`;
            canvas.style.opacity = config.opacity.toString();
        
            container.insertBefore(canvas, container.firstChild);
        
            const ctx = canvas.getContext('2d');
        
            let width, height;
            const particles = [];
            let mouse = { x: null, y: null };
        
            const resize = () => {
                width = canvas.width = canvas.offsetWidth = window.innerWidth;
                height = canvas.height = canvas.offsetHeight = window.innerHeight;
            };
        
            window.addEventListener('resize', resize);
            resize();
        
            const spawnParticle = (fullySeeded = false) => {
                return {
                x: Math.random() * width,
                y: fullySeeded
                    ? Math.random() * height  * 1.1       // little above view height (overlap)
                    : Math.random() * - height * 0.4,      // above view during normal respawn
                r: Math.random() * (config.maxSize - config.minSize) + config.minSize,
                vx: (Math.random() - 0.5) * config.horizontalDrift,
                vy: config.terminalVelocity
                };
            };
            
        
            for (let i = 0; i < config.particleCount; i++) {
                particles.push(spawnParticle(true)); // fully seed viewport
            }
            
        
            document.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
        
            const animate = () => {
                ctx.clearRect(0, 0, width, height);
        
                for (let p of particles) {
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < config.mouseInfluenceRadius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (1 - dist / config.mouseInfluenceRadius) * config.mouseForce;
                    p.vx += Math.cos(angle) * force;
                    p.vy += Math.sin(angle) * force;
                    }
                }
        
                // Apply drag
                p.vx *= 0.99;
                p.vy *= 0.99;
        
                // Limit vertical speed (simulate terminal velocity)
                if (p.vy < config.terminalVelocity) {
                    p.vy += 0.001;
                } else {
                    p.vy = config.terminalVelocity;
                }
        
                // Move
                p.x += p.vx;
                p.y += p.vy;
        
                // Respawn if off-screen
                if (p.y > height) {
                    Object.assign(p, spawnParticle());
                }
        
                // Wrap X
                if (p.x > width) p.x = 0;
                if (p.x < 0) p.x = width;
        
                // Draw
                ctx.beginPath();
                ctx.fillStyle = config.color;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                }
        
                requestAnimationFrame(animate);
            };
        
            animate();
        };
    };
  
    // Extend ContentLoader.init
    const originalInit = ContentLoader.init;
    ContentLoader.init = function () 
    {
        originalInit.call(this);

        this.createMarineSnowEffect({
            layers: 10,
            particleCount: 500,
            speedFactor: 0.15,
            minSize: 2,
            maxSize: 4,
            blurAmount: '1.5px',
            opacity: 0.6,
            color: 'rgba(255, 255, 255, 0.45)',
            terminalVelocity: 0.4,
            horizontalDrift: 0.15,
            mouseInfluenceRadius: 80,
            mouseForce: 0.06
        });
    };
  };
  
  addAdvancedMarineSnowEffect();
  