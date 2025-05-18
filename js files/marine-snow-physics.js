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
                particleCount: Math.floor(options.particleCount * (1 + depth*0.3)),
                minSize: options.minSize * (1 - depth * 0.25),
                maxSize: options.maxSize * (1 - depth * 0.25),
                terminalVelocity: options.terminalVelocity * (1 - depth * 0.6),
                mouseInfluenceRadius: options.mouseInfluenceRadius * (1 - depth * 0.7),
                mouseForce: options.mouseForce * (1 - depth * 0.65)
            };
      
            createMarineSnowLayer(this.mainContainer, layerConfig);
        };

        function getFlowVector(x, y, time) {
            const spatialScale = 0.0010;   // spatial scale 
            const currentStrength = 0.05;
            const flowX = Math.sin(x * spatialScale + time * 0.0005);
            const flowY = Math.cos(y * spatialScale + time * 0.0005 + 100); // offset for variation
        
            return {
                x: flowX * currentStrength,
                y: flowY * currentStrength
            };
        }
        
  
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
            let prevMouse = { x: null, y: null };
            let mouseVelocity = { x: 0, y: 0 };
            let lastTimestamp = performance.now();
        
            const resize = () => {
                const rect = container.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
            
                canvas.width = width;
                canvas.height = height;
            };
            
        
            window.addEventListener('resize', resize);
            resize();
        
            const spawnParticle = (fullySeeded = false) => {
                return {
                x: Math.random() * width,
                y: fullySeeded
                    ? Math.random() * height  * 1.2       // little above view height (overlap)
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
                const rect = container.getBoundingClientRect();
                const normX = (e.clientX - rect.left) / rect.width;
                const normY = (e.clientY - rect.top) / rect.height;
            
                mouse.x = normX * width;
                mouse.y = normY * height;
            });
            
        
            const animate = () => {
                ctx.clearRect(0, 0, width, height);
                const now = performance.now();
                const deltaTime = (now - lastTimestamp) / 1000 || 0.016; // default ~60fps
                lastTimestamp = now;

                if (mouse.x !== null && mouse.y !== null && prevMouse.x !== null && prevMouse.y !== null) {
                    mouseVelocity.x = (mouse.x - prevMouse.x) / deltaTime;
                    mouseVelocity.y = (mouse.y - prevMouse.y) / deltaTime;
                } else {
                    mouseVelocity.x = 0;
                    mouseVelocity.y = 0;
                }

                prevMouse.x = mouse.x;
                prevMouse.y = mouse.y;
                
                

            
                for (let p of particles) {
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const distSq = dx * dx + dy * dy;
                    const effectiveRadius = config.mouseInfluenceRadius * 2; //2x radius cutoff
                    const maxDistSq = effectiveRadius * effectiveRadius;
                    
                    if (distSq < maxDistSq) {
                        const dist = Math.sqrt(distSq); //reduced compute
                        if (dist < config.mouseInfluenceRadius) {
                            const influence = Math.max(0, 1 - Math.log(dist + 1) / Math.log(config.mouseInfluenceRadius + 1));
                            p.vx += mouseVelocity.x * influence * config.mouseForce;
                            p.vy += mouseVelocity.y * influence * config.mouseForce;
                        }
                    }

                    const flow = getFlowVector(p.x, p.y, now);
                    p.vx += flow.x * deltaTime;
                    p.vy += flow.y * deltaTime;                    
                }
        
                // Apply drag
                p.vx *= 0.991;
                p.vy *= 0.991;
        
                // Limit vertical speed (simulate terminal velocity)
                if (p.vy < config.terminalVelocity) {
                    p.vy += config.speedFactor;
                } else {
                    p.vy = config.terminalVelocity;
                }
        
                // Move
                p.x += p.vx;
                p.y += p.vy;
        
                // Respawn if off-screen
                if ((p.y > (height*1.1)) || (p.x > (width * 1.1))) {
                    Object.assign(p, spawnParticle());
                }
        
                // Wrap X
                // if (p.x > width) p.x = 0;
                // if (p.x < 0) p.x = width;
        
                // Draw
                ctx.beginPath();
                ctx.fillStyle = config.color;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();

                // const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                // grad.addColorStop(0, config.color);       // bright center
                // grad.addColorStop(1, 'transparent');      // fades out
                // ctx.fillStyle = grad;
                // ctx.fill();
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
            layers: 4,
            particleCount: 300,
            speedFactor: 0.0015,
            minSize: 2,
            maxSize: 4,
            blurAmount: '0px',
            opacity: 0.5,
            color: 'rgba(255, 255, 255, 0.45)',
            terminalVelocity: 0.3,
            horizontalDrift: 0.15,
            mouseInfluenceRadius: 90,
            mouseForce: 0.0008
        });
    };
  };
  
  addAdvancedMarineSnowEffect();
  