// CNC Foundation - Main JavaScript
class CNCFoundationApp {
    constructor() {
        this.menuManager = null;
        this.currentPath = window.location.pathname;
        this.init();
    }

    async init() {
        await this.waitForMenuManager();
        this.initializeNavigation();
        this.initializeSearch();
        this.initializeLanguageSwitcher();
        this.updateLastUpdated();
        console.log('CNC Foundation App initialized');
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
                    <a href="/left-pane/${item.slug}.html" class="nav-link" data-section="${item.slug}">
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
        
        const html = topNavItems.map(item => {
            if (item.children && item.children.length > 0) {
                return this.createDropdownNavItem(item);
            } else {
                console.log('Creating simple nav for:', item.title);
                return this.createSimpleNavItem(item);
            }
        }).join('');
        
        console.log('Generated HTML:', html);
        topNavLinks.innerHTML = html;
        
        // Initialize dropdowns after DOM is ready
        setTimeout(() => {
            const dropdowns = document.querySelectorAll('.nav-dropdown');
            this.applyDropdownConfig();
        }, 100);
    }

    createDropdownNavItem(item) {
        const icon = this.getIconForSlug(item.slug);
        const children = item.children.map(child => `
            <a href="/offerings/${item.slug}/${child.slug}.html" class="nav-dropdown-item">
                ${child.title}
            </a>
        `).join('');

        return `
            <div class="nav-dropdown" data-dropdown="${item.slug}">
                <button class="nav-item dropdown-toggle" type="button" aria-expanded="false">
                    <i class="${icon}" aria-hidden="true"></i>
                    <span>${item.title}</span>
                    <i class="fas fa-chevron-down dropdown-arrow" aria-hidden="true"></i>
                </button>
                <div class="nav-dropdown-menu" role="menu">
                    ${children}
                </div>
            </div>
        `;
    }

    createSimpleNavItem(item) {
        const icon = this.getIconForSlug(item.slug);
        const href = item.slug === 'home' ? '/' : `/offerings/${item.slug}/`;
        return `
            <a href="${href}" class="nav-item" data-section="${item.slug}">
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
        if (!quickLinksGrid || !this.menuManager) return;

        const leftPaneItems = this.menuManager.getLeftPane().slice(0, 6);
        
        quickLinksGrid.innerHTML = leftPaneItems.map(item => {
            const icon = this.getIconForSlug(item.slug);
            return `
                <a href="#${item.slug}" class="quick-link-card" data-section="${item.slug}">
                    <i class="${icon}" aria-hidden="true"></i>
                    <span>${item.title}</span>
                </a>
            `;
        }).join('');
    }

    populateAnnouncements() {
        const announcementsGrid = document.getElementById('announcements-grid');
        if (!announcementsGrid) return;

        const announcements = [
            {
                day: '15', month: 'Dec',
                title: 'New Manufacturing Facility Inauguration',
                content: 'CNC Foundation opens new state-of-the-art manufacturing facility in Guwahati'
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
            
            return `
                <div class="service-card">
                    <div class="service-icon">
                        <i class="${icon}" aria-hidden="true"></i>
                    </div>
                    <h3>${item.title}</h3>
                    <p>${description}</p>
                    <a href="${item.route}" class="service-link">Learn More</a>
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
            'manufacturing-of-products': 'Quality products including sweets, nimkin, puffed rice, and flattened rice',
            'supply-of-products': 'Reliable supply of products, machineries, and office stationeries',
            'services': 'Vehicle services, manpower, event organizing, and digital solutions',
            'e-bussiness': 'Digital solutions, web development, and online marketing services'
        };
        
        return descriptions[slug] || 'Comprehensive solutions for all your needs';
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
                const section = navItem.getAttribute('data-section');
                
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
            
            if (dropdownToggle) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown(dropdown);
            } else if (!dropdown) {
                this.closeAllDropdowns();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        // Reposition dropdowns on window resize
        window.addEventListener('resize', () => {
            this.repositionOpenDropdowns();
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
        section.innerHTML = `
            <div class="content-header">
                <h1>${item.title}</h1>
                <p class="content-summary">Information about ${item.title.toLowerCase()}</p>
            </div>
            <div class="content-body">
                <p>This section contains detailed information about ${item.title.toLowerCase()}. Content will be added here based on your requirements.</p>
                <div class="contact-card">
                    <h3>Need Help?</h3>
                    <p>Contact us for more information about ${item.title.toLowerCase()}.</p>
                    <p>Email: cncfoundation2021@gmail.com</p>
                    <p>Phone: 9387102011</p>
                </div>
            </div>
        `;

        contentSections.appendChild(section);
        return section;
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
            }
        }
    }

    closeAllDropdowns() {
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

    initializeLanguageSwitcher() {
        const languageSelect = document.getElementById('language-select');
        
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                console.log('Language changed to:', e.target.value);
            });
        }
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
