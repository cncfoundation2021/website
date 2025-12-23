// Visual Effects and Scroll Animations - CnC
// Rich visual enhancements with scroll-based interactions

class VisualEffectsManager {
    constructor() {
        this.init();
    }

    init() {
        this.createVisualBackground();
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.createFloatingParticles();
        this.createGeometricShapes();
        this.setupIntersectionObserver();
        console.log('Visual effects initialized');
    }

    createVisualBackground() {
        // Create main visual background container
        const background = document.createElement('div');
        background.className = 'visual-background animated-gradient-bg';
        document.body.appendChild(background);

        // Add parallax layers
        this.createParallaxLayers(background);
    }

    createParallaxLayers(container) {
        const layers = [
            { className: 'parallax-layer parallax-layer-1', zIndex: 1 },
            { className: 'parallax-layer parallax-layer-2', zIndex: 2 },
            { className: 'parallax-layer parallax-layer-3', zIndex: 3 }
        ];

        layers.forEach(layer => {
            const layerElement = document.createElement('div');
            layerElement.className = layer.className;
            layerElement.style.zIndex = layer.zIndex;
            container.appendChild(layerElement);
        });
    }

    createFloatingParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'floating-particles';
        document.querySelector('.visual-background').appendChild(particlesContainer);

        // Create 10 floating particles
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particlesContainer.appendChild(particle);
        }
    }

    createGeometricShapes() {
        const shapesContainer = document.createElement('div');
        shapesContainer.className = 'geometric-shapes';
        document.querySelector('.visual-background').appendChild(shapesContainer);

        // Create 5 geometric shapes
        for (let i = 0; i < 5; i++) {
            const shape = document.createElement('div');
            shape.className = 'shape';
            shapesContainer.appendChild(shape);
        }
    }

    setupScrollAnimations() {
        // Add scroll reveal classes to elements
        this.addScrollRevealClasses();
    }

    addScrollRevealClasses() {
        // Add scroll reveal classes to various elements
        const selectors = [
            '.hero-banner',
            '.feature-card',
            '.product-item',
            '.contact-cta',
            '.service-overview h2',
            '.product-showcase h3',
            '.offering-card'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                // Add different animation types based on element type
                if (element.classList.contains('feature-card') || element.classList.contains('product-item')) {
                    element.classList.add('scroll-reveal-scale');
                } else if (index % 2 === 0) {
                    element.classList.add('scroll-reveal-left');
                } else {
                    element.classList.add('scroll-reveal-right');
                }
            });
        });
    }

    setupParallaxEffects() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxLayers = document.querySelectorAll('.parallax-layer');
            
            parallaxLayers.forEach((layer, index) => {
                const speed = (index + 1) * 0.5;
                const yPos = -(scrolled * speed);
                layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        });
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        // Observe all scroll reveal elements
        const scrollElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
        scrollElements.forEach(el => observer.observe(el));
    }

    // Enhanced hover effects for interactive elements
    setupEnhancedHoverEffects() {
        const interactiveElements = document.querySelectorAll('.feature-card, .product-item, .offering-card, .btn');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-4px) scale(1.02)';
                element.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // Add subtle animations to text elements
    setupTextAnimations() {
        const textElements = document.querySelectorAll('h1, h2, h3, p');
        
        textElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transition = 'all 0.3s ease';
                element.style.transform = 'translateX(5px)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateX(0)';
            });
        });
    }

    // Create dynamic background patterns
    createDynamicPatterns() {
        const patternContainer = document.createElement('div');
        patternContainer.className = 'dynamic-patterns';
        patternContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
            opacity: 0.03;
        `;

        // Create animated SVG pattern
        const svgPattern = `
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="animatedPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <circle cx="50" cy="50" r="2" fill="#0a5ad4">
                            <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="25" cy="25" r="1" fill="#1a8f5b">
                            <animate attributeName="r" values="1;3;1" dur="4s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="75" cy="75" r="1.5" fill="#0a5ad4">
                            <animate attributeName="r" values="1.5;3.5;1.5" dur="5s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="5s" repeatCount="indefinite"/>
                        </circle>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#animatedPattern)"/>
            </svg>
        `;

        patternContainer.innerHTML = svgPattern;
        document.body.appendChild(patternContainer);
    }

    // Performance optimization
    optimizePerformance() {
        // Throttle scroll events
        let ticking = false;
        
        const updateScrollEffects = () => {
            this.setupParallaxEffects();
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        });

        // Reduce animations on low-end devices
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-normal', '0s');
        }
    }

    // Initialize all effects
    initializeAllEffects() {
        this.setupEnhancedHoverEffects();
        this.setupTextAnimations();
        this.createDynamicPatterns();
        this.optimizePerformance();
    }
}

// Initialize visual effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        const visualEffects = new VisualEffectsManager();
        visualEffects.initializeAllEffects();
    }
});

// Handle page navigation for SPA-like behavior
window.addEventListener('popstate', () => {
    // Reinitialize effects when navigating back/forward
    setTimeout(() => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const visualEffects = new VisualEffectsManager();
            visualEffects.initializeAllEffects();
        }
    }, 100);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualEffectsManager;
}

