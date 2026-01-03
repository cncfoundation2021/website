// CnC - Main JavaScript
class CNCFoundationApp {
    constructor() {
        this.menuManager = null;
        this.currentPath = window.location.pathname;
        this.init();
    }

    async init() {
        await this.waitForMenuManager();
        this.ensureVisualBackground();
        if (window.BackgroundManager) {
            try {
                this.backgroundManager = new window.BackgroundManager();
            } catch (e) {
                console.warn('BackgroundManager unavailable:', e);
            }
        } else {
            await this.loadBackgroundManager();
        }
        this.setInitialBackground();
        this.initializeNavigation();
        this.initializeSearch();
        this.updateLastUpdated();
        // Ensure home content is visible on page load (only on homepage)
        const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/index.html');
        if (isHomePage) {
            this.showHomeContent();
        } else {
            // On offering/sub pages, ensure any existing content-section with 'active' class stays active
            // Don't interfere with pages that already have their content sections set up
            const existingActiveSection = document.querySelector('.content-section.active');
            if (existingActiveSection && !isHomePage) {
                // Keep it active - don't touch it
                console.log('Offering page detected - preserving active content section');
            }
        }
        console.log('CnC App initialized');
    }

    async waitForMenuManager() {
        return new Promise((resolve) => {
            const checkMenuManager = () => {
                if (window.menuManager && window.menuManager.sitemap) {
                    this.menuManager = window.menuManager;
                    resolve();
                } else {
                    setTimeout(checkMenuManager, 100);
                }
            };
            checkMenuManager();
        });
    }

    initializeNavigation() {
        this.populateLeftPaneNavigation();
        this.populateTopNavigation();
        this.populateBreadcrumbs();
        this.populateQuickLinks();
        this.populateAnnouncements();
        this.populateServices();
        this.populateOfferings();
        this.setupNavigationEventListeners();
        this.highlightActiveLeftPaneItem();
    }

    populateLeftPaneNavigation() {
        const leftPaneNav = document.getElementById('left-pane-nav');
        if (!leftPaneNav || !this.menuManager) return;

        const leftPaneItems = this.menuManager.getLeftPane();
        
        leftPaneNav.innerHTML = leftPaneItems.map(item => {
            const icon = this.getIconForSlug(item.slug);
            return `
                <li>
                    <a href="/info/${item.slug}.html" class="nav-link" data-section="${item.slug}">
                        <i class="${icon}" aria-hidden="true"></i>
                        <span>${item.title}</span>
                    </a>
                </li>
            `;
        }).join('');
    }

    populateTopNavigation() {
        const topNavLinks = document.getElementById('top-nav-links');
        if (!topNavLinks || !this.menuManager) return;

        const topNavItems = this.menuManager.getTopTabs();
        console.log('Top nav items:', topNavItems);
        
        // Separate fixed items (HOME and CnC BAZAR) from scrollable items
        const fixedItems = [];
        const scrollableItems = [];
        
        topNavItems.forEach(item => {
            const isFixed = item.slug === 'home' || 
                          item.title === 'CnC BAZAR' || 
                          item.slug.includes('cncbazar') || 
                          item.slug.includes('cnc-bazar');
            
            if (isFixed) {
                fixedItems.push(item);
            } else {
                scrollableItems.push(item);
            }
        });
        
        // Create fixed items HTML
        const fixedHtml = fixedItems.map(item => {
            if (item.children && item.children.length > 0) {
                return this.createDropdownNavItem(item);
            } else {
                return this.createSimpleNavItem(item);
            }
        }).join('');
        
        // Create scrollable items HTML
        const scrollableHtml = scrollableItems.map(item => {
            if (item.children && item.children.length > 0) {
                return this.createDropdownNavItem(item);
            } else {
                return this.createSimpleNavItem(item);
            }
        }).join('');
        
        // Combine with fixed section and scrollable section
        const html = `
            <div class="nav-fixed-items">${fixedHtml}</div>
            <div class="nav-scrollable-items">${scrollableHtml}</div>
        `;
        
        console.log('Generated HTML:', html);
        topNavLinks.innerHTML = html;

        // Ensure scroll zones and custom scrollbar exist on every page
        const navContainer = topNavLinks.closest('.nav-container');
        const topNav = topNavLinks.closest('.top-navigation');
        const scrollableItemsEl = topNavLinks.querySelector('.nav-scrollable-items');
        
        if (navContainer) {
            // Remove any existing zones to avoid duplicates
            navContainer.querySelectorAll('.nav-scroll-zone').forEach(zone => zone.remove());

            // Always append scroll zones to navContainer (not inside scrollableItems) for stable positioning
            const leftZone = document.createElement('div');
            leftZone.className = 'nav-scroll-zone nav-scroll-left';
            navContainer.appendChild(leftZone);
            
            const rightZone = document.createElement('div');
            rightZone.className = 'nav-scroll-zone nav-scroll-right';
            navContainer.appendChild(rightZone);
        }
        if (topNav && !topNav.querySelector('#nav-scrollbar-thumb')) {
            const bar = document.createElement('div');
            bar.className = 'nav-scrollbar';
            const thumb = document.createElement('div');
            thumb.className = 'nav-scrollbar-thumb';
            thumb.id = 'nav-scrollbar-thumb';
            bar.appendChild(thumb);
            topNav.appendChild(bar);
        }
        
        // Initialize dropdowns and scroll buttons after DOM is ready
        setTimeout(() => {
            const dropdowns = document.querySelectorAll('.nav-dropdown');
            this.applyDropdownConfig();
            // Delay scroll initialization to ensure zones are positioned
            setTimeout(() => {
                this.initializeNavScrollButtons();
            }, 200);
        }, 100);
    }

    createDropdownNavItem(item) {
        const icon = this.getIconForSlug(item.slug);
        const children = item.children.map(child => {
            const isExternal = child.external === true || (item.slug === 'e-bussiness' && child.slug === 'govt-e-marketplace');
            const href = isExternal ? child.route : `/offerings/${item.slug}/${child.slug}.html`;
            const target = isExternal ? ' target="_blank" rel="noopener"' : '';
            return `
            <a href="${href}" class="nav-dropdown-item"${target}>
                ${child.title}
            </a>`;
        }).join('');

        // Check if this is a featured item (HOME or CnC BAZAR) - though they shouldn't have dropdowns
        const isFeatured = item.slug === 'home' || 
                          item.title === 'CnC BAZAR' || 
                          item.slug.includes('cncbazar') || 
                          item.slug.includes('cnc-bazar');
        const featuredClass = isFeatured ? ' nav-item-featured' : '';

        const parentRoute = `/offerings/${item.slug}/index.html`;
        return `
            <div class="nav-dropdown" data-dropdown="${item.slug}">
                <a href="${parentRoute}" class="nav-item dropdown-toggle${featuredClass}" aria-expanded="false">
                    <i class="${icon}" aria-hidden="true"></i>
                    <span>${item.title}</span>
                    <i class="fas fa-chevron-down dropdown-arrow" aria-hidden="true"></i>
                </a>
                <div class="nav-dropdown-menu" role="menu">
                    ${children}
                </div>
            </div>
        `;
    }

    createSimpleNavItem(item) {
        const icon = this.getIconForSlug(item.slug);
        const href = item.external ? item.route : (item.slug === 'home' ? '/' : item.route);
        const target = item.external ? ' target="_blank" rel="noopener"' : '';
        
        // Check if this is a featured item (HOME or CnC BAZAR)
        const isFeatured = item.slug === 'home' || 
                          item.title === 'CnC BAZAR' || 
                          item.title === 'HOME' ||
                          item.slug.includes('cncbazar') || 
                          item.slug.includes('cnc-bazar');
        const featuredClass = isFeatured ? ' nav-item-featured' : '';
        
        // Debug logging
        if (isFeatured) {
            console.log('Featured item detected:', item.title, item.slug, 'Class:', featuredClass);
        }
        
        // Special handling for CNC Bazar - use logo image instead of icon
        if (item.title === 'CnC BAZAR' || item.slug.includes('cncbazar') || item.slug.includes('cnc-bazar')) {
            // Determine correct path to logo based on current page depth
            const currentPath = window.location.pathname;
            let logoPath = 'Assets/CNC Bazar Logo.png';
            
            // Calculate relative path depth - count path segments (excluding empty first segment)
            const cleanPath = currentPath.replace(/^\/|\/index\.html$|\.html$/g, '').replace(/\/$/, '');
            const pathSegments = cleanPath.split('/').filter(seg => seg.length > 0);
            
            // For each path segment, we need to go up one level
            if (pathSegments.length > 0) {
                logoPath = '../'.repeat(pathSegments.length) + 'Assets/CNC Bazar Logo.png';
            }
            
            return `
                <a href="${href}" class="nav-item${featuredClass}" data-section="${item.slug}"${target}>
                    <img src="${logoPath}" alt="CnC Bazar Logo" class="cnc-bazar-nav-logo" style="width: 16px; height: 16px; object-fit: contain; margin-right: 0.5rem;">
                    <span>${item.title}</span>
                </a>
            `;
        }
        
        return `
            <a href="${href}" class="nav-item${featuredClass}" data-section="${item.slug}"${target}>
                <i class="${icon}" aria-hidden="true"></i>
                <span>${item.title}</span>
            </a>
        `;
    }

    populateBreadcrumbs() {
        const breadcrumbList = document.getElementById('breadcrumb-list');
        if (!breadcrumbList || !this.menuManager) return;

        const breadcrumbs = this.menuManager.getBreadcrumbs(this.currentPath);
        
        // Add Home breadcrumb if not present
        if (breadcrumbs.length === 0 || breadcrumbs[0].title !== 'Home') {
            breadcrumbs.unshift({ title: 'Home', route: '../' });
        }
        
        breadcrumbList.innerHTML = breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast) {
                return `<li><span>${crumb.title}</span></li>`;
            } else {
                return `<li><a href="${crumb.route}">${crumb.title}</a></li>`;
            }
        }).join('');
    }

    populateQuickLinks() {
        const quickLinksGrid = document.getElementById('quick-links-grid');
        if (!quickLinksGrid) return;

        const latestUpdates = [
            {
                icon: 'fas fa-industry',
                title: 'New Manufacturing Facility',
                description: 'State-of-the-art facility now operational in Guwahati'
            },
            {
                icon: 'fas fa-handshake',
                title: 'Brand Partnerships',
                description: 'New partnerships with LG, Blue Star, and major brands'
            },
            {
                icon: 'fas fa-heart',
                title: 'CSR Initiatives',
                description: 'Community development programs launched'
            },
            {
                icon: 'fas fa-shopping-cart',
                title: 'CnC Bazar Expansion',
                description: 'Now offering hardware fittings and clothing items'
            }
        ];
        
        quickLinksGrid.innerHTML = latestUpdates.map(update => `
            <div class="quick-link-card">
                <i class="${update.icon}" aria-hidden="true"></i>
                <div class="update-content">
                    <h4>${update.title}</h4>
                    <p>${update.description}</p>
                </div>
            </div>
        `).join('');
    }

    populateAnnouncements() {
        const announcementsGrid = document.getElementById('announcements-grid');
        if (!announcementsGrid) return;

        const announcements = [
            {
                day: '15', month: 'Dec',
                title: 'New Manufacturing Facility Inauguration',
                content: 'CnC opens new state-of-the-art manufacturing facility in Guwahati'
            },
            {
                day: '10', month: 'Dec',
                title: 'Partnership with Leading Brands',
                content: 'New partnerships with LG, Blue Star, and other major brands announced'
            },
            {
                day: '05', month: 'Dec',
                title: 'CSR Initiative Launch',
                content: 'New Corporate Social Responsibility programs for community development'
            }
        ];

        announcementsGrid.innerHTML = announcements.map(announcement => `
            <div class="announcement-card">
                <div class="announcement-date">
                    <span class="day">${announcement.day}</span>
                    <span class="month">${announcement.month}</span>
                </div>
                <div class="announcement-content">
                    <h3>${announcement.title}</h3>
                    <p>${announcement.content}</p>
                </div>
            </div>
        `).join('');
    }

    populateServices() {
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid || !this.menuManager) return;

        const topNavItems = this.menuManager.getTopTabs().slice(0, 4);
        
        servicesGrid.innerHTML = topNavItems.map(item => {
            const icon = this.getIconForSlug(item.slug);
            const description = this.getServiceDescription(item.slug);
            const learnMoreHref = item.slug === 'home' ? '/offerings/services/home-maintenance.html' : item.route;
            
            return `
                <div class="service-card">
                    <div class="service-icon">
                        <i class="${icon}" aria-hidden="true"></i>
                    </div>
                    <h3>${item.title}</h3>
                    <p>${description}</p>
                    <a href="${learnMoreHref}" class="service-link">Learn More</a>
                </div>
            `;
        }).join('');
    }

    populateOfferings() {
        const offeringsGrid = document.getElementById('offerings-grid');
        if (!offeringsGrid || !this.menuManager) return;

        const topNavItems = this.menuManager.getTopTabs().filter(item => item.slug !== 'home');
        
        offeringsGrid.innerHTML = topNavItems.map(item => {
            const icon = this.getIconForSlug(item.slug);
            const description = this.getServiceDescription(item.slug);
            
            // Create links for children if they exist
            const childrenLinks = item.children && item.children.length > 0 
                ? item.children.slice(0, 3).map(child => `
                    <a href="/offerings/${item.slug}/${child.slug}.html" class="offering-link">
                        <i class="fas fa-arrow-right"></i>
                        ${child.title}
                    </a>
                `).join('')
                : `<a href="/offerings/${item.slug}/" class="offering-link">
                    <i class="fas fa-arrow-right"></i>
                    View All
                </a>`;
            
            return `
                <div class="offering-card">
                    <div class="offering-icon">
                        <i class="${icon}" aria-hidden="true"></i>
                    </div>
                    <h3>${item.title}</h3>
                    <p>${description}</p>
                    <div class="offering-links">
                        ${childrenLinks}
                    </div>
                </div>
            `;
        }).join('');
    }

    getIconForSlug(slug) {
        const iconMap = {
            'home': 'fas fa-home',
            'about-us': 'fas fa-info-circle',
            'key-contacts': 'fas fa-address-book',
            'organisational-chart': 'fas fa-sitemap',
            'mission-vission': 'fas fa-bullseye',
            'online-marketing': 'fas fa-globe',
            'marketing-research': 'fas fa-chart-line',
            'social-media': 'fab fa-facebook',
            'employee-management': 'fas fa-users',
            'business-tie-ups': 'fas fa-handshake',
            'grievances': 'fas fa-exclamation-triangle',
            'gallery-publications': 'fas fa-images',
            'announcements': 'fas fa-bullhorn',
            'search': 'fas fa-search',
            'contact-us': 'fas fa-phone',
            'manufacturing-of-products': 'fas fa-industry',
            'supply-of-products': 'fas fa-truck',
            'services': 'fas fa-cogs',
            'cnc-bazar': 'fas fa-shopping-cart',
            'e-bussiness': 'fas fa-laptop',
            'distributors': 'fas fa-warehouse',
            'dealers': 'fas fa-store',
            'service-centre': 'fas fa-tools',
            'authorized-reseller': 'fas fa-handshake',
            'product-marketing': 'fas fa-chart-line',
            'construction-repairing': 'fas fa-hammer',
            'donation': 'fas fa-heart'
        };
        
        return iconMap[slug] || 'fas fa-circle';
    }

    getServiceDescription(slug) {
        const descriptions = {
            'home': 'Home maintenance services: plumbing, construction, lawn care, electrical and more',
            'manufacturing-of-products': 'Quality products including sweets, namkeen, puffed rice, and flattened rice',
            'supply-of-products': 'Reliable supply of products, machineries, and office stationeries',
            'services': 'Vehicle services, manpower, event organizing, and digital solutions',
            'e-bussiness': 'Digital solutions, web development, and online marketing services'
        };
        
        return descriptions[slug] || 'Comprehensive solutions for all your needs';
    }

    setInitialBackground() {
        try {
            if (!this.backgroundManager) return;
            const path = window.location.pathname;
            // Home
            if (path === '/' || path.endsWith('/index.html')) {
                this.backgroundManager.setBackground('home');
                return;
            }
            // Offerings pages: /offerings/<slug>/ or /offerings/<slug>.html
            if (path.includes('/offerings/')) {
                const after = path.split('/offerings/')[1] || '';
                const parts = after.split('/');
                const first = (parts[0] || '').replace('.html', '');
                if (first) {
                    this.backgroundManager.setBackground(first);
                    return;
                }
            }
            // Default
            this.backgroundManager.setBackground('home');
        } catch (e) {
            console.warn('Background init skipped:', e);
        }
    }

    ensureVisualBackground() {
        // Creates the liquid gradient + parallax image container (once per page)
        if (document.querySelector('.visual-background')) return;

        const root = document.createElement('div');
        root.className = 'visual-background';

        // Parallax layers (image + subtle overlays) sit at the back
        const parallax1 = document.createElement('div');
        parallax1.className = 'parallax-layer parallax-layer-1';
        const parallax2 = document.createElement('div');
        parallax2.className = 'parallax-layer parallax-layer-2';
        const parallax3 = document.createElement('div');
        parallax3.className = 'parallax-layer parallax-layer-3';

        // Animated liquid gradient overlay
        const gradient = document.createElement('div');
        gradient.className = 'animated-gradient-bg';
        gradient.style.position = 'absolute';
        gradient.style.inset = '0';
        gradient.style.opacity = '0.35';

        root.appendChild(parallax1);
        root.appendChild(parallax2);
        root.appendChild(parallax3);
        root.appendChild(gradient);

        document.body.prepend(root);
    }

    loadBackgroundManager() {
        return new Promise((resolve) => {
            const currentPath = window.location.pathname;
            let prefix = '';
            if (currentPath.includes('/offerings/')) {
                const depth = currentPath.split('/').length - 2;
                prefix = '../'.repeat(depth);
            }
            const script = document.createElement('script');
            script.src = `${prefix}scripts/background-manager.js`;
            script.async = true;
            script.onload = () => {
                if (window.BackgroundManager) {
                    try { this.backgroundManager = new window.BackgroundManager(); } catch {}
                }
                resolve();
            };
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
    }

    setupNavigationEventListeners() {
        // Left pane navigation - handle based on current page
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link[data-section]')) {
                // Check if we're on the homepage
                const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
                
                if (isHomePage) {
                    // On homepage: switch content instead of navigating
                    e.preventDefault();
                    this.handleLeftPaneNavigation(e.target.closest('.nav-link'));
                }
                // On other pages: allow normal navigation (no preventDefault)
            }
            
            if (e.target.closest('.quick-link-card[data-section]')) {
                e.preventDefault();
                this.handleLeftPaneNavigation(e.target.closest('.quick-link-card'));
            }
        });

        // Top navigation - simple items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item[data-section]') && !e.target.closest('.dropdown-toggle')) {
                const navItem = e.target.closest('.nav-item');
                
                // Skip external links - let them open naturally in new tab
                if (navItem.hasAttribute('target') && navItem.getAttribute('target') === '_blank') {
                    return; // Let browser handle external link
                }
                
                const section = navItem.getAttribute('data-section');
                if (this.backgroundManager) {
                    this.backgroundManager.setBackground(section);
                }
                
                if (section === 'home') {
                    // Allow normal navigation to home
                    window.location.href = '/';
                } else {
                    // Allow normal navigation to offerings
                    const href = navItem.getAttribute('href');
                    if (href) {
                        window.location.href = href;
                    }
                }
            }
        });

        // Dropdown functionality - completely rewritten
        document.addEventListener('click', (e) => {
            const dropdownToggle = e.target.closest('.dropdown-toggle');
            const dropdown = e.target.closest('.nav-dropdown');
            const dropdownMenu = e.target.closest('.nav-dropdown-menu');
            
            if (dropdownToggle) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown(dropdown);
            } else if (!dropdown && !dropdownMenu) {
                // Close dropdowns when clicking outside
                this.closeAllDropdowns();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        // Reposition dropdowns on window resize and scroll
        window.addEventListener('resize', () => {
            this.repositionOpenDropdowns();
        });

        // Handle scroll behavior for dropdowns
        window.addEventListener('scroll', (e) => {
            // Only close dropdowns if scroll is not from within a dropdown
            const activeDropdown = document.querySelector('.nav-dropdown.open');
            if (activeDropdown) {
                const dropdownMenu = activeDropdown.querySelector('.nav-dropdown-menu');
                if (dropdownMenu && !dropdownMenu.contains(e.target)) {
                    this.closeAllDropdowns();
                }
            } else {
                this.closeAllDropdowns();
            }
        });
    }

    handleLeftPaneNavigation(link) {
        const section = link.getAttribute('data-section');
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Check if we're on homepage - if so, switch content
        const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
        
        if (isHomePage) {
            // On homepage: switch content instead of navigating
            this.showContentSection(section);
        } else {
            // On other pages: navigate to the left pane page
            window.location.href = `/left-pane/${section}.html`;
        }
    }

    showContentSection(sectionSlug) {
        // Hide home content
        const homeContent = document.getElementById('home-content');
        if (homeContent) {
            homeContent.classList.remove('active');
        }

        // Hide all other content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show or create the requested content section
        let contentSection = document.getElementById(`content-${sectionSlug}`);
        if (!contentSection) {
            contentSection = this.createContentSection(sectionSlug);
        }

        if (contentSection) {
            contentSection.classList.add('active');
            // Scroll to top of main content area instead of the section
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
            if (this.backgroundManager) {
                this.backgroundManager.setBackground(sectionSlug);
            }
        }
    }

    createContentSection(sectionSlug) {
        const contentSections = document.getElementById('content-sections');
        if (!contentSections) return null;

        const item = this.menuManager.findBySlug(sectionSlug, 'leftPane');
        if (!item) return null;

        const section = document.createElement('div');
        section.id = `content-${sectionSlug}`;
        section.className = 'content-section';
        
        // Special handling for specific sections
        let contentBody = '';
        if (sectionSlug === 'about-us') {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Learn about CnC Foundation Assam and our commitment to excellence</p>
            </div>
            <div class="content-body">
                <div class="about-section active" style="margin-top: 2rem; display: block !important; visibility: visible !important; opacity: 1 !important;">
                    <div style="padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem;">
                        <p style="margin-bottom: 1.5rem;">
                            Care & Cure Foundation (CnC Foundation) was established on March 24, 2021, and is headquartered in Hailakandi, Assam, India. This MSME organization was founded with the objective of engaging in diverse business and social initiatives, including E-commerce, product marketing, event management, car rental services, government contracting, supply and construction, manufacturing, and research and development.
                        </p>
                        
                        <p style="margin-bottom: 1.5rem;">
                            With a forward-looking approach, CnC Foundation envisions establishing and operating educational institutions, professional training and career development centres, as well as technical and non-technical institutes, fostering skill enhancement and innovation.
                        </p>
                        
                        <p style="margin-bottom: 0;">
                            Beyond its business operations, CnC Foundation remains committed to its social responsibility initiatives, extending voluntary support and assistance to underprivileged communities as part of its broader mission to drive inclusive growth and sustainable development.
                        </p>
                    </div>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'organisational-chart') {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">View our organizational structure and leadership hierarchy</p>
            </div>
            <div class="content-body">
                <div class="org-chart-container" style="margin-top: 2rem; padding: 4rem 2rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(30, 41, 59, 0.98)); border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 16px; overflow: visible; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4); min-height: 800px; display: block !important; visibility: visible !important; position: relative;">
                    <style>
                        .org-chart-wrapper {
                            position: relative;
                            width: 100%;
                            min-height: 700px;
                            display: flex;
                            justify-content: center;
                            padding: 2rem 0;
                        }
                        .org-chart {
                            position: relative;
                            width: 100%;
                            max-width: 1400px;
                            margin: 0 auto;
                        }
                        .org-level {
                            display: flex !important;
                            justify-content: center;
                            align-items: flex-start;
                            position: relative;
                            margin: 2rem 0;
                            min-height: 120px;
                            visibility: visible !important;
                            opacity: 1 !important;
                        }
                        .org-box {
                            background: linear-gradient(145deg, #0ea5e9, #0284c7) !important;
                            border: 2.5px solid rgba(255, 255, 255, 0.4);
                            border-radius: 10px;
                            padding: 1.5rem 2rem;
                            color: #ffffff !important;
                            font-size: 1rem;
                            font-weight: 600;
                            text-align: center;
                            min-width: 220px;
                            max-width: 240px;
                            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                            position: relative;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            line-height: 1.5;
                            z-index: 10;
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        }
                        .org-box:hover {
                            transform: translateY(-6px) scale(1.05);
                            box-shadow: 0 12px 32px rgba(14, 165, 233, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                            border-color: rgba(255, 255, 255, 0.6);
                            z-index: 20;
                        }
                        .org-box.ceo {
                            background: linear-gradient(145deg, #0ea5e9, #0369a1);
                            font-size: 1.4rem;
                            font-weight: 700;
                            padding: 2rem 2.5rem;
                            min-width: 260px;
                            border-width: 3px;
                            box-shadow: 0 8px 28px rgba(14, 165, 233, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.3);
                        }
                        .org-box.rect {
                            border-radius: 10px;
                        }
                        .org-box.oval {
                            border-radius: 50px;
                            padding: 1.4rem 2rem;
                        }
                        .org-svg-lines {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            pointer-events: none;
                            z-index: 15;
                            overflow: visible;
                            background: transparent;
                        }
                        .org-svg-lines line {
                            stroke: #0ea5e9;
                            stroke-width: 6;
                            stroke-linecap: round;
                            stroke-linejoin: round;
                            filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.5));
                        }
                        .org-svg-lines path {
                            stroke: rgba(255, 255, 255, 0.7);
                            stroke-width: 2.5;
                            fill: none;
                            stroke-linecap: round;
                            stroke-linejoin: round;
                        }
                        .level-1 {
                            margin-top: 0;
                        }
                        .level-2 {
                            margin-top: 80px;
                        }
                        .level-3 {
                            margin-top: 80px;
                        }
                        .level-4 {
                            margin-top: 80px;
                        }
                        .level-5 {
                            margin-top: 80px;
                        }
                        .org-branch-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            position: relative;
                            min-height: 100px;
                        }
                        .org-horizontal-group {
                            display: flex;
                            gap: 2rem;
                            justify-content: center;
                            align-items: center;
                            flex-wrap: wrap;
                        }
                        @media (max-width: 1200px) {
                            .org-box {
                                min-width: 180px;
                                padding: 1.2rem 1.5rem;
                                font-size: 0.9rem;
                            }
                            .org-box.ceo {
                                min-width: 220px;
                                padding: 1.8rem 2rem;
                                font-size: 1.2rem;
                            }
                        }
                        @media (max-width: 768px) {
                            .org-box {
                                min-width: 160px;
                                padding: 1rem 1.25rem;
                                font-size: 0.85rem;
                            }
                            .org-box.ceo {
                                min-width: 200px;
                                padding: 1.5rem 1.75rem;
                                font-size: 1.1rem;
                            }
                            .org-horizontal-group {
                                gap: 1rem;
                            }
                        }
                    </style>
                    <div class="org-chart-wrapper" style="display: block !important; visibility: visible !important; width: 100%; min-height: 700px;">
                        <div class="org-chart" id="org-chart-main" style="display: block !important; visibility: visible !important; position: relative;">
                            <!-- SVG for connecting lines - will be drawn dynamically -->
                            <svg class="org-svg-lines" id="org-svg-lines"></svg>
                            
                            <!-- Level 1: CEO -->
                            <div class="org-level level-1">
                                <div class="org-box ceo" data-id="ceo">CEO</div>
                            </div>
                            
                            <!-- Level 2: Managing Directors -->
                            <div class="org-level level-2">
                                <div class="org-horizontal-group">
                                    <div class="org-box rect" data-id="md-admin" data-parent="ceo">Managing Director<br>(Admin)</div>
                                    <div class="org-box oval" data-id="md-sales" data-parent="ceo">Managing Director<br>(Sales)</div>
                                </div>
                            </div>
                            
                            <!-- Level 3: General Managers -->
                            <div class="org-level level-3">
                                <div class="org-horizontal-group" style="width: 100%; justify-content: space-around;">
                                    <div class="org-branch-container">
                                        <div class="org-box rect" data-id="gm-admin" data-parent="md-admin">General Manager<br>(Administration)</div>
                                    </div>
                                    <div class="org-branch-container">
                                        <div class="org-box rect" data-id="gm-sales" data-parent="md-sales">General Manager<br>(Sales & Marketing)</div>
                                    </div>
                                    <div class="org-branch-container">
                                        <div class="org-box oval" data-id="gm-finance" data-parent="md-sales">General Manager<br>(Finance & Accounts)</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Level 4: Assistant Managers -->
                            <div class="org-level level-4">
                                <div class="org-horizontal-group" style="width: 100%; justify-content: space-around;">
                                    <div class="org-branch-container">
                                        <div class="org-box rect" data-id="am-admin" data-parent="gm-admin">Assistant Manager<br>(Administration)</div>
                                    </div>
                                    <div class="org-horizontal-group">
                                        <div class="org-box rect" data-id="am-finance" data-parent="gm-sales">Assistant Manager<br>(Finance)</div>
                                        <div class="org-box rect" data-id="am-sales" data-parent="gm-sales">Assistant Manager<br>(Sales & Marketing)</div>
                                    </div>
                                    <div class="org-branch-container">
                                        <div class="org-box oval" data-id="am-hr" data-parent="gm-finance">Assistant Manager<br>(HR)</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Level 5: Sales Managers -->
                            <div class="org-level level-5">
                                <div class="org-horizontal-group" style="width: 100%; justify-content: space-around;">
                                    <div class="org-branch-container">
                                        <div class="org-box rect" data-id="sm-east" data-parent="am-admin">Sales Manager<br>(East Zone)</div>
                                    </div>
                                    <div class="org-horizontal-group">
                                        <div class="org-box rect" data-id="sm-west" data-parent="am-finance">Sales Manager<br>(West Zone)</div>
                                        <div class="org-box rect" data-id="sm-north" data-parent="am-sales">Sales Manager<br>(North Zone)</div>
                                    </div>
                                    <div class="org-branch-container">
                                        <div class="org-box oval" data-id="sm-south" data-parent="am-hr">Sales Manager<br>(South Zone)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Script is executed via executeOrgChartScript() method -->
                </div>
            </div>
            `;
        } else if (sectionSlug === 'mission-vission') {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Our commitment to excellence and our vision for North East India</p>
            </div>
            <div class="content-body">
                <div class="default-section" style="margin-top: 2rem;">
                    <div class="vision-section" style="margin-top: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);">
                        <h3 style="color: var(--primary, #0ea5e9); margin-bottom: 1.5rem; font-size: 1.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Vision:</h3>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin: 0;">
                            To be a leading and trusted organization across North East India, providing comprehensive, high-quality products and services that support institutional development and end users, while ensuring transparency, efficiency, and meaningful value addition in every partnership. We aspire to contribute to regional growth by creating sustainable employment opportunities and empowering local communities.
                        </p>
                    </div>
                    
                    <div class="mission-section" style="margin-top: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);">
                        <h3 style="color: var(--primary, #0ea5e9); margin-bottom: 1.5rem; font-size: 1.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Mission :</h3>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin: 0;">
                            To manufacture, resell and provide comprehensive services with reliability and commitment to the government organization and end users across North East India effectively and efficiently in a time-bound manner while upholding the highest standards of integrity and professionalism as per our tagline- <strong style="color: var(--primary, #0ea5e9); font-weight: 600;">"Once and Always!"</strong>
                        </p>
                    </div>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'announcements') {
            const announcements = [
                {
                    day: '15', month: 'Dec',
                    title: 'New Manufacturing Facility Inauguration',
                    content: 'CnC opens new state-of-the-art manufacturing facility in Guwahati'
                },
                {
                    day: '10', month: 'Dec',
                    title: 'Partnership with Leading Brands',
                    content: 'New partnerships with LG, Blue Star, and other major brands announced'
                },
                {
                    day: '05', month: 'Dec',
                    title: 'CSR Initiative Launch',
                    content: 'New Corporate Social Responsibility programs for community development'
                }
            ];

            const announcementsHTML = announcements.map(announcement => `
                <div class="announcement-card">
                    <div class="announcement-date">
                        <span class="day">${announcement.day}</span>
                        <span class="month">${announcement.month}</span>
                    </div>
                    <div class="announcement-content">
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                    </div>
                </div>
            `).join('');

            contentBody = `
            <div class="content-body">
                <div class="default-section" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                    <h2>Announcements</h2>
                    <p class="content-summary">Stay updated with our latest news, updates, and important announcements.</p>
                    
                    <section class="announcements-section" aria-labelledby="announcements-title" style="margin-top: 2rem; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: var(--space-6); border-radius: 12px; border: 1px solid var(--border-light);">
                        <div class="announcements-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4);">
                            ${announcementsHTML}
                        </div>
                    </section>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'key-contacts') {
            contentBody = `
            <div class="content-body">
                <div class="default-section" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                    <h2>Key Contacts</h2>
                    <p class="content-summary">Information about key contacts</p>
                    
                    <div class="contact-card" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                        <img src="../Assets/WhatsApp Image 2025-12-23 at 11.26.29.jpeg" alt="Amir Sohail Choudhury" style="width: 120px; height: 120px; object-fit: cover; object-position: center top; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 12px;">
                        <h3>Amir Sohail Choudhury</h3>
                        <p><strong>B. Sc, M.A, B. Ed* — General Manager</strong></p>
                        <div class="contact-info">
                            <p>
                                <i class="fas fa-phone" aria-hidden="true"></i>
                                <strong>Contact:</strong> <a href="tel:+919101759991">+919101759991</a>
                            </p>
                            <p>
                                <i class="fas fa-envelope" aria-hidden="true"></i>
                                <strong>Email:</strong> <a href="mailto:amirsohail.biz@gmail.com">amirsohail.biz@gmail.com</a>
                            </p>
                        </div>
                    </div>
                    
                    <div class="contact-card" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                        <img src="../Assets/WhatsApp Image 2025-12-23 at 11.26.28.jpeg" alt="Yamin Mustafa Barbhuiya" style="width: 120px; height: 120px; object-fit: cover; object-position: center top; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 12px;">
                        <h3>Yamin Mustafa Barbhuiya</h3>
                        <p><strong>B. Com — General Accounts Manager</strong></p>
                        <div class="contact-info">
                            <p>
                                <i class="fas fa-phone" aria-hidden="true"></i>
                                <strong>Contact:</strong> <a href="tel:+916002610858">+916002610858</a>
                            </p>
                            <p>
                                <i class="fas fa-envelope" aria-hidden="true"></i>
                                <strong>Email:</strong> <a href="mailto:yaminbarbhuiya123@gmail.com">yaminbarbhuiya123@gmail.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'marketing-research') {
            contentBody = `
            <div class="content-body">
                <div class="default-section" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                    <h2>Marketing Research</h2>
                    <p class="content-summary" style="color: #eaf2ff !important; font-size: 1.125rem;">Understanding market dynamics and consumer needs to deliver value-driven solutions</p>
                    
                    <div class="research-section" style="margin-top: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); margin-bottom: 2rem;">
                        <h3 style="color: var(--primary, #0ea5e9); margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700;">Consumer Needs & Affordability Research</h3>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin-bottom: 1.5rem;">
                            At CnC Foundation, we conduct comprehensive research to understand consumer needs, their budget constraints, and affordability levels across Northeast India. Our dedicated research team analyzes market segments, purchasing patterns, and economic factors to identify what products and services are most needed and accessible to our target audience.
                        </p>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin: 0;">
                            We carefully evaluate consumer spending capacity and design our product and service offerings to align with their financial capabilities. This ensures that we provide value-driven solutions that are not only high-quality but also affordable and accessible to a wide range of customers, from individual consumers to institutional clients.
                        </p>
                    </div>
                    
                    <div class="research-section" style="margin-top: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); margin-bottom: 2rem;">
                        <h3 style="color: var(--primary, #0ea5e9); margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700;">Competitive Market Price Monitoring</h3>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin-bottom: 1.5rem;">
                            We continuously monitor market prices across various product categories and service sectors to ensure we remain competitive while maintaining our commitment to quality. Our pricing strategy is informed by real-time market analysis, allowing us to offer competitive rates without compromising on the excellence of our products and services.
                        </p>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin: 0;">
                            Through systematic price tracking and competitive intelligence, we adjust our offerings to provide the best value proposition to our customers. This approach enables us to stay ahead in the market while ensuring that quality, reliability, and customer satisfaction remain our top priorities.
                        </p>
                    </div>
                    
                    <div class="research-section" style="margin-top: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); margin-bottom: 2rem;">
                        <h3 style="color: var(--primary, #0ea5e9); margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700;">Brand & Supplier Evaluation</h3>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin-bottom: 1.5rem;">
                            We maintain a rigorous evaluation process for brands and suppliers, consistently assessing their quality standards, supply chain reliability, and commitment to excellence. Only those brands and suppliers that meet our stringent quality benchmarks and demonstrate consistent supply capabilities are onboarded into our network.
                        </p>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin: 0;">
                            Our evaluation criteria include product quality, manufacturing standards, delivery timelines, after-sales support, and long-term reliability. This meticulous selection process ensures that our customers receive only the best products and services, backed by dependable supply chains and trusted partnerships.
                        </p>
                    </div>
                    
                    <div class="research-section" style="margin-top: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid var(--border, rgba(255, 255, 255, 0.16)); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);">
                        <h3 style="color: var(--primary, #0ea5e9); margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700;">Customer Feedback & Repeat Purchase Analysis</h3>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin-bottom: 1.5rem;">
                            Customer feedback and repeat buying trends are continuously monitored and analyzed to drive improvements in our service delivery and enhance customer satisfaction. We track customer purchase patterns, satisfaction scores, and feedback across all touchpoints to identify areas for enhancement.
                        </p>
                        <p style="line-height: 1.9; color: var(--text, #eaf2ff); font-size: 1.125rem; margin: 0;">
                            This data-driven approach allows us to refine our product offerings, improve service quality, and strengthen customer relationships. By understanding what drives repeat purchases and customer loyalty, we can better serve our clients and build long-term partnerships based on trust and satisfaction.
                        </p>
                    </div>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'social-media') {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Connect with us on social platforms. Links will be added soon.</p>
            </div>
            <div class="content-body">
                <div class="social-grid" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="contact-card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 0.9rem;">
                        <i class="fab fa-facebook" aria-hidden="true" style="font-size: 28px; color: #1877f2;"></i>
                        <div>
                            <p style="margin: 0; font-weight: 700;">Facebook</p>
                        </div>
                    </div>
                    <div class="contact-card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 0.9rem;">
                        <i class="fab fa-instagram" aria-hidden="true" style="font-size: 28px; color: #e4405f;"></i>
                        <div>
                            <p style="margin: 0; font-weight: 700;">Instagram</p>
                        </div>
                    </div>
                    <div class="contact-card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 0.9rem;">
                        <i class="fab fa-twitter" aria-hidden="true" style="font-size: 28px; color: #1da1f2;"></i>
                        <div>
                            <p style="margin: 0; font-weight: 700;">Twitter</p>
                        </div>
                    </div>
                    <div class="contact-card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 0.9rem;">
                        <i class="fab fa-whatsapp" aria-hidden="true" style="font-size: 28px; color: #25d366;"></i>
                        <div>
                            <p style="margin: 0; font-weight: 700;">WhatsApp</p>
                        </div>
                    </div>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'contact-us') {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">We are here to help—reach us any time during working hours</p>
            </div>
            <div class="content-body">
                <div class="contact-cards" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
                    <div class="contact-card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.5rem;">
                        <div class="contact-item" style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
                            <i class="fab fa-whatsapp" aria-hidden="true" style="color: #25D366; font-size: 1.2rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 700;">Talk to us (WhatsApp)</p>
                                <a href="https://wa.me/9387102011" style="color: inherit; text-decoration: none;">9387102011</a>
                            </div>
                        </div>
                        <div class="contact-item" style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
                            <i class="fas fa-phone" aria-hidden="true" style="color: #0ea5e9; font-size: 1.1rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 700;">Contact number</p>
                                <p style="margin: 0;">9101759991 / 6002610858</p>
                            </div>
                        </div>
                        <div class="contact-item" style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.5rem;">
                            <i class="fas fa-envelope" aria-hidden="true" style="color: #f59e0b; font-size: 1.1rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 700;">Email</p>
                                <a href="mailto:cncfoundation2021@gmail.com" style="color: inherit; text-decoration: none;">cncfoundation2021@gmail.com</a>
                            </div>
                        </div>
                    </div>
                    <div class="contact-card" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.5rem;">
                        <div class="contact-item" style="display: flex; gap: 0.75rem; align-items: center;">
                            <i class="fas fa-clock" aria-hidden="true" style="color: #10b981; font-size: 1.1rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 700;">Working Hours</p>
                                <p style="margin: 0;">Mon-Sat: 10 am - 6 pm</p>
                                <p style="margin: 0;">Sunday: Closed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'grievances') {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Information about grievances</p>
            </div>
            <div class="content-body">
                <div class="default-section" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
                    <p style="color: #ffffff !important; font-size: 1.125rem !important; line-height: 1.7 !important; margin-bottom: 1.5rem !important;">If you have any concerns, complaints, or grievances regarding our services, please feel free to reach out. Our team will review and address your issue at the earliest.</p>
                    <p style="color: var(--text, #eaf2ff) !important; font-size: 1.125rem !important; line-height: 1.7 !important; margin-bottom: 0 !important;"><strong>Grievance Email:</strong> <a href="mailto:ccare4001@gmail.com" style="color: var(--primary, #0ea5e9) !important; text-decoration: none;">ccare4001@gmail.com</a></p>
                </div>
            </div>
            `;
        } else if (sectionSlug === 'employee-management') {
            // Simple redirect to admin panel
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Access the comprehensive admin dashboard to manage employees, requests, feedback, and system operations</p>
            </div>
            <div class="content-body">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 16px; padding: 50px 30px; max-width: 600px; margin: 0 auto;">
                        <div style="font-size: 64px; color: #667eea; margin-bottom: 20px;">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h2 style="font-size: 28px; color: var(--text, #eaf2ff); margin-bottom: 15px;">Admin Dashboard</h2>
                        <p style="font-size: 16px; color: var(--text-muted, #b8c5d6); margin-bottom: 30px; line-height: 1.6;">
                            Click the button below to access the admin dashboard where you can manage employees, service requests, feedback, and system operations.
                        </p>
                        <a href="/admin/pages/login.html" target="_blank" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                            <i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i>
                            Go to Admin Panel
                        </a>
                        <p style="font-size: 14px; color: var(--text-muted, #8a9ba8); margin-top: 20px; opacity: 0.8;">
                            Opens in a new tab
                        </p>
                    </div>
                </div>
            </div>
            `;
        } else {
            contentBody = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Information about ${item.title.toLowerCase()}</p>
            </div>
            <div class="content-body">
                <p>Stay tuned for more details about this section. We're working to bring you comprehensive information.</p>
                <div class="contact-card">
                    <h3>Need Help?</h3>
                    <p>We're here to assist you with any questions or inquiries.</p>
                    <p>Email: cncfoundation2021@gmail.com</p>
                    <p>Phone: +916002610858</p>
                </div>
            </div>
            `;
        }
        
        section.innerHTML = contentBody;

        contentSections.appendChild(section);
        
        // Execute any scripts in the content if it's the org chart
        if (sectionSlug === 'organisational-chart') {
            this.executeOrgChartScript(section);
        }
        
        return section;
    }
    
    executeOrgChartScript(contentSection) {
        // Extracted from the embedded script tag
        setTimeout(() => {
            const drawOrgChartLines = () => {
                const svg = document.getElementById('org-svg-lines');
                const chart = document.getElementById('org-chart-main');
                if (!svg || !chart) {
                    return;
                }
                
                // Get chart dimensions - SVG is positioned absolutely within chart
                const chartRect = chart.getBoundingClientRect();
                const width = chartRect.width || 1400;
                const height = chartRect.height || 1000;
                
                // Set SVG dimensions to match chart
                svg.setAttribute('width', width);
                svg.setAttribute('height', height);
                svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
                
                // Clear existing content
                svg.innerHTML = '';
                
                // Create arrow marker definition
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', 'arrowhead');
                marker.setAttribute('markerWidth', '6');
                marker.setAttribute('markerHeight', '6');
                marker.setAttribute('refX', '5');
                marker.setAttribute('refY', '1.5');
                marker.setAttribute('orient', 'auto');
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '0 0, 6 1.5, 0 3');
                polygon.setAttribute('fill', 'rgba(255, 255, 255, 0.7)');
                polygon.setAttribute('stroke', 'none');
                marker.appendChild(polygon);
                defs.appendChild(marker);
                svg.appendChild(defs);
                
                // Define connections: [childId, parentId]
                const connections = [
                    ['md-admin', 'ceo'],
                    ['md-sales', 'ceo'],
                    ['gm-admin', 'md-admin'],
                    ['gm-sales', 'md-sales'],
                    ['gm-finance', 'md-sales'],
                    ['am-admin', 'gm-admin'],
                    ['am-finance', 'gm-sales'],
                    ['am-sales', 'gm-sales'],
                    ['am-hr', 'gm-finance'],
                    ['sm-east', 'am-admin'],
                    ['sm-west', 'am-finance'],
                    ['sm-north', 'am-sales'],
                    ['sm-south', 'am-hr']
                ];
                
                // Draw block lines connecting roles according to hierarchy
                connections.forEach(([childId, parentId]) => {
                    const childBox = chart.querySelector('[data-id="' + childId + '"]');
                    const parentBox = chart.querySelector('[data-id="' + parentId + '"]');
                    
                    if (!childBox || !parentBox) {
                        return;
                    }
                    
                    // Get positions relative to chart element (since SVG is positioned within chart)
                    const childRect = childBox.getBoundingClientRect();
                    const parentRect = parentBox.getBoundingClientRect();
                    
                    // Calculate positions relative to chart element
                    const parentX = parentRect.left - chartRect.left + parentRect.width / 2;
                    const parentY = parentRect.top - chartRect.top + parentRect.height;
                    const childX = childRect.left - chartRect.left + childRect.width / 2;
                    const childY = childRect.top - chartRect.top;
                     
                    // Only draw if coordinates are valid and positive
                    if (isNaN(parentX) || isNaN(parentY) || isNaN(childX) || isNaN(childY) ||
                        parentX < 0 || parentY < 0 || childX < 0 || childY < 0) {
                        return;
                    }
                    
                    // Create path element
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    // Determine path type based on horizontal alignment
                    if (Math.abs(parentX - childX) < 10) {
                        // Straight vertical line
                        path.setAttribute('d', 'M ' + parentX + ' ' + parentY + ' L ' + childX + ' ' + childY);
                    } else {
                        // L-shaped connection: vertical down, horizontal across, vertical to child
                        const midY = parentY + (childY - parentY) / 2;
                        path.setAttribute('d', 'M ' + parentX + ' ' + parentY + ' L ' + parentX + ' ' + midY + ' L ' + childX + ' ' + midY + ' L ' + childX + ' ' + childY);
                    }
                    
                    path.setAttribute('stroke', 'rgba(255, 255, 255, 0.7)');
                    path.setAttribute('stroke-width', '2.5');
                    path.setAttribute('stroke-linecap', 'round');
                    path.setAttribute('stroke-linejoin', 'round');
                    path.setAttribute('fill', 'none');
                    path.setAttribute('marker-end', 'url(#arrowhead)');
                    
                    svg.appendChild(path);
                });
            };
            
            // Force a layout calculation
            void contentSection.offsetHeight;
            
            // Wait for layout to stabilize
            setTimeout(() => {
                drawOrgChartLines();
                setTimeout(drawOrgChartLines, 300);
                setTimeout(drawOrgChartLines, 600);
            }, 200);
        }, 100);
    }

    toggleDropdown(dropdown) {
        const isOpen = dropdown.classList.contains('open');
        
        // Close all dropdowns first
        this.closeAllDropdowns();
        
        // If this dropdown wasn't open, open it
        if (!isOpen) {
            dropdown.classList.add('open');
            
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const arrow = dropdown.querySelector('.dropdown-arrow');
            const menu = dropdown.querySelector('.nav-dropdown-menu');
            
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'true');
            }
            if (arrow) {
                arrow.style.transform = 'rotate(180deg)';
            }
            
            // Position the fixed dropdown menu using sitemap config
            if (menu) {
                const config = this.menuManager.getConfig();
                const dropdownConfig = config?.dropdowns || {};
                const toggleRect = toggle.getBoundingClientRect();
                
                menu.style.position = dropdownConfig.positioning || 'fixed';
                menu.style.top = (toggleRect.bottom + (dropdownConfig.offset?.top || 5)) + 'px';
                menu.style.left = (toggleRect.left + (dropdownConfig.offset?.left || 0)) + 'px';
                menu.style.zIndex = dropdownConfig.zIndex || '999999';
                
                // Add scroll prevention when mouse is inside dropdown
                this.addDropdownScrollPrevention(menu);
            }
        }
    }

    closeAllDropdowns() {
        // Restore body overflow in case it was hidden
        document.body.style.overflow = '';
        
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.classList.remove('open');
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const arrow = dropdown.querySelector('.dropdown-arrow');
            
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    }

    addDropdownScrollPrevention(menu) {
        // Prevent page scroll when mouse wheel is used inside dropdown
        const preventPageScroll = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Allow dropdown internal scrolling
            const scrollAmount = e.deltaY;
            menu.scrollTop += scrollAmount;
        };

        // Add mouse enter/leave events to control scroll prevention
        const handleMouseEnter = () => {
            menu.addEventListener('wheel', preventPageScroll, { passive: false });
            document.body.style.overflow = 'hidden';
        };

        const handleMouseLeave = () => {
            menu.removeEventListener('wheel', preventPageScroll);
            document.body.style.overflow = '';
        };

        // Add event listeners
        menu.addEventListener('mouseenter', handleMouseEnter);
        menu.addEventListener('mouseleave', handleMouseLeave);

        // Clean up when dropdown closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (!target.classList.contains('open')) {
                        // Dropdown closed, clean up
                        menu.removeEventListener('wheel', preventPageScroll);
                        menu.removeEventListener('mouseenter', handleMouseEnter);
                        menu.removeEventListener('mouseleave', handleMouseLeave);
                        document.body.style.overflow = '';
                        observer.disconnect();
                    }
                }
            });
        });

        // Observe the parent dropdown for class changes
        const dropdown = menu.closest('.nav-dropdown');
        if (dropdown) {
            observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });
        }
    }

    repositionOpenDropdowns() {
        const config = this.menuManager.getConfig();
        const dropdownConfig = config?.dropdowns || {};
        
        document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.nav-dropdown-menu');
            
            if (toggle && menu) {
                const toggleRect = toggle.getBoundingClientRect();
                menu.style.position = dropdownConfig.positioning || 'fixed';
                menu.style.top = (toggleRect.bottom + (dropdownConfig.offset?.top || 5)) + 'px';
                menu.style.left = (toggleRect.left + (dropdownConfig.offset?.left || 0)) + 'px';
                menu.style.zIndex = dropdownConfig.zIndex || '999999';
            }
        });
    }

    applyDropdownConfig() {
        const config = this.menuManager.getConfig();
        if (!config?.dropdowns) return;

        const dropdownConfig = config.dropdowns;
        const navConfig = config.navigation;

        // Apply CSS custom properties for dropdown styling
        const root = document.documentElement;
        
        if (dropdownConfig.styling) {
            root.style.setProperty('--dropdown-bg', dropdownConfig.styling.background);
            root.style.setProperty('--dropdown-border', dropdownConfig.styling.border);
            root.style.setProperty('--dropdown-border-radius', dropdownConfig.styling.borderRadius);
            root.style.setProperty('--dropdown-box-shadow', dropdownConfig.styling.boxShadow);
            root.style.setProperty('--dropdown-min-width', dropdownConfig.styling.minWidth);
            root.style.setProperty('--dropdown-padding', dropdownConfig.styling.padding);
        }

        if (navConfig) {
            root.style.setProperty('--top-nav-z-index', navConfig.topNavZIndex);
            root.style.setProperty('--dropdown-container-z-index', navConfig.dropdownContainerZIndex);
            root.style.setProperty('--dropdown-menu-z-index', navConfig.dropdownMenuZIndex);
        }
    }

    initializeNavScrollButtons() {
        const scrollableItems = document.querySelector('.nav-scrollable-items');
        const scrollLeftZone = document.querySelector('.nav-scroll-left');
        const scrollRightZone = document.querySelector('.nav-scroll-right');
        const scrollbarThumb = document.getElementById('nav-scrollbar-thumb');
        
        if (!scrollableItems || !scrollLeftZone || !scrollRightZone || !scrollbarThumb) return;

        let scrollInterval = null;
        let autoScrollInterval = null;
        let autoScrollDirection = 1; // 1 for right, -1 for left
        const scrollSpeed = 2; // pixels per frame
        const autoScrollSpeed = 1; // slower speed for automatic scrolling
        let isHovering = false;

        // Update scrollbar thumb position and size
        const updateScrollbar = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollableItems;
            
            // If content fits, set safe defaults and hide
            if (scrollWidth <= clientWidth || scrollWidth === 0) {
                scrollbarThumb.style.width = '100%';
                scrollbarThumb.style.left = '0%';
                const scrollbar = scrollbarThumb.parentElement;
                if (scrollbar) scrollbar.style.opacity = '0';
                return;
            }
            
            // Calculate thumb width as percentage of visible area
            const thumbWidthPercent = (clientWidth / scrollWidth) * 100;
            
            // Calculate thumb position
            const scrollPercent = (scrollLeft / (scrollWidth - clientWidth)) * 100;
            const maxThumbPosition = 100 - thumbWidthPercent;
            const thumbPosition = (scrollPercent / 100) * maxThumbPosition;
            
            // Apply styles
            scrollbarThumb.style.width = `${thumbWidthPercent}%`;
            scrollbarThumb.style.left = `${thumbPosition}%`;
            
            // Show scrollbar when overflow exists
            const scrollbar = scrollbarThumb.parentElement;
            if (scrollbar) scrollbar.style.opacity = '1';
        };

        // Update zone visibility based on scroll position
        const updateZoneVisibility = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollableItems;
            
            // Hide left zone if at start
            if (scrollLeft <= 0) {
                scrollLeftZone.classList.add('hidden');
            } else {
                scrollLeftZone.classList.remove('hidden');
            }
            
            // Hide right zone if at end
            if (scrollLeft + clientWidth >= scrollWidth - 1) {
                scrollRightZone.classList.add('hidden');
            } else {
                scrollRightZone.classList.remove('hidden');
            }
        };

        // Combined update function
        const updateAll = () => {
            updateScrollbar();
            updateZoneVisibility();
        };

        // Auto-scroll function that changes direction at boundaries
        const autoScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollableItems;
            
            // Check if we've reached the right end
            if (scrollLeft + clientWidth >= scrollWidth - 1) {
                autoScrollDirection = -1; // Start scrolling left
            }
            // Check if we've reached the left end
            else if (scrollLeft <= 0) {
                autoScrollDirection = 1; // Start scrolling right
            }
            
            // Perform the scroll
            scrollableItems.scrollBy({
                left: autoScrollDirection * autoScrollSpeed,
                behavior: 'auto'
            });
        };

        // Start auto-scrolling
        const startAutoScroll = () => {
            if (autoScrollInterval || isHovering) return;
            
            autoScrollInterval = setInterval(autoScroll, 10);
        };

        // Stop auto-scrolling
        const stopAutoScroll = () => {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        };

        // Start manual scrolling on hover
        const startScrolling = (direction) => {
            if (scrollInterval) return;
            
            isHovering = true;
            stopAutoScroll(); // Stop auto-scroll when user hovers
            
            scrollInterval = setInterval(() => {
                scrollableItems.scrollBy({
                    left: direction * scrollSpeed,
                    behavior: 'auto'
                });
            }, 10);
        };

        // Stop manual scrolling
        const stopScrolling = () => {
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
            isHovering = false;
            
            // Resume auto-scrolling after a short delay
            setTimeout(() => {
                if (!isHovering) {
                    startAutoScroll();
                }
            }, 1000);
        };

        // Left zone hover
        scrollLeftZone.addEventListener('mouseenter', () => startScrolling(-1));
        scrollLeftZone.addEventListener('mouseleave', stopScrolling);

        // Right zone hover
        scrollRightZone.addEventListener('mouseenter', () => startScrolling(1));
        scrollRightZone.addEventListener('mouseleave', stopScrolling);

        // Pause auto-scroll when user interacts with the navigation
        scrollableItems.addEventListener('mouseenter', () => {
            isHovering = true;
            stopAutoScroll();
        });

        scrollableItems.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    startAutoScroll();
                }
            }, 1000);
        });

        // Update on scroll
        scrollableItems.addEventListener('scroll', updateAll);
        
        // Update on resize
        window.addEventListener('resize', updateAll);

        // Initial update
        setTimeout(updateAll, 100);
        
        // Start auto-scrolling after initial delay
        setTimeout(() => {
            startAutoScroll();
        }, 2000);
    }

    highlightActiveLeftPaneItem() {
        // Get current page path
        const currentPath = window.location.pathname;
        
        // Extract the page name from the path
        let activeSection = '';
        if (currentPath.includes('/left-pane/')) {
            const pathParts = currentPath.split('/');
            const pageName = pathParts[pathParts.length - 1].replace('.html', '');
            activeSection = pageName;
        }
        
        // Highlight the active item in left pane
        if (activeSection) {
            document.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-section') === activeSection) {
                    link.classList.add('active');
                }
            });
        }
    }

    handleHomeNavigation() {
        console.log('Home navigation clicked');
        // Show home content
        this.showHomeContent();
        
        // Update active states
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('.nav-item[data-section="home"]')?.classList.add('active');
    }

    showHomeContent() {
        // Hide all other content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show home content
        const homeContent = document.getElementById('home-content');
        if (homeContent) {
            homeContent.classList.add('active');
        }
    }

    initializeSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.querySelector('.search-btn');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) return;
        console.log('Searching for:', query);
    }


    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = now.toLocaleDateString();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CNCFoundationApp();
});

