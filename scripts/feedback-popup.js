// Feedback Popup System
class FeedbackPopup {
    constructor() {
        this.isVisible = false;
        this.hasShown = false;
        this.timeOnSite = 0;
        this.minTimeOnSite = 30000; // 30 seconds
        this.checkInterval = 5000; // Check every 5 seconds
        this.cooldownPeriod = 0; // No cooldown - show once per visit only
        
        this.init();
    }

    init() {
        console.log('FeedbackPopup: Initializing...');
        
        // Check if feedback has been shown in this session
        const sessionFeedbackShown = sessionStorage.getItem('cnc_feedback_session_shown');
        console.log('FeedbackPopup: Session feedback shown:', sessionFeedbackShown);
        
        // Allow bypassing with URL parameter ?showFeedback=true for testing
        const urlParams = new URLSearchParams(window.location.search);
        const forceShow = urlParams.get('showFeedback') === 'true';
        
        if (forceShow) {
            console.log('FeedbackPopup: Force show enabled via URL parameter');
            sessionStorage.removeItem('cnc_feedback_session_shown');
        }
        
        if (sessionFeedbackShown === 'true' && !forceShow) {
            console.log('FeedbackPopup: Already shown in this session, skipping...');
            return; // Don't show if already shown in this session
        }

        console.log('FeedbackPopup: Starting time tracking...');
        // Start tracking time on site
        this.startTimeTracking();
        
        // Create popup HTML
        this.createPopupHTML();
        console.log('FeedbackPopup: Popup HTML created');
    }

    startTimeTracking() {
        // Track time when user starts interacting
        let startTime = Date.now();
        let isActive = true;

        // Track when user becomes inactive
        const handleInactivity = () => {
            isActive = false;
        };

        // Track when user becomes active again
        const handleActivity = () => {
            if (!isActive) {
                startTime = Date.now();
                isActive = true;
            }
        };

        // Add event listeners for user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Check periodically if enough time has passed
        const checkTime = () => {
            if (isActive && !this.hasShown) {
                this.timeOnSite = Date.now() - startTime;
                console.log('FeedbackPopup: Time on site:', Math.floor(this.timeOnSite / 1000), 'seconds');
                
                if (this.timeOnSite >= this.minTimeOnSite) {
                    console.log('FeedbackPopup: Time requirement met, showing popup...');
                    this.showPopup();
                    this.hasShown = true;
                }
            }
        };

        setInterval(checkTime, this.checkInterval);
    }

    createPopupHTML() {
        // Create popup container
        const popup = document.createElement('div');
        popup.id = 'feedback-popup';
        popup.className = 'feedback-popup';
        popup.innerHTML = `
            <div class="feedback-overlay"></div>
            <div class="feedback-content">
                <div class="feedback-header">
                    <h3><i class="fas fa-heart"></i> How's your experience?</h3>
                    <button class="feedback-close" aria-label="Close feedback popup">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="feedback-body">
                    <p>We'd love to hear your thoughts about our website. Your feedback helps us improve!</p>
                    
                    <div class="feedback-rating">
                        <span>How would you rate your experience?</span>
                        <div class="rating-stars">
                            <button class="star" data-rating="1" aria-label="1 star">
                                <i class="far fa-star"></i>
                            </button>
                            <button class="star" data-rating="2" aria-label="2 stars">
                                <i class="far fa-star"></i>
                            </button>
                            <button class="star" data-rating="3" aria-label="3 stars">
                                <i class="far fa-star"></i>
                            </button>
                            <button class="star" data-rating="4" aria-label="4 stars">
                                <i class="far fa-star"></i>
                            </button>
                            <button class="star" data-rating="5" aria-label="5 stars">
                                <i class="far fa-star"></i>
                            </button>
                        </div>
                    </div>

                    <div class="feedback-form">
                        <textarea 
                            id="feedback-text" 
                            placeholder="Share your feedback, suggestions, or any issues you encountered..."
                            rows="4"
                            maxlength="500"
                        ></textarea>
                        <div class="feedback-actions">
                            <button class="btn-feedback btn-primary" id="submit-feedback">
                                <i class="fas fa-paper-plane"></i> Send Feedback
                            </button>
                            <button class="btn-feedback btn-secondary" id="skip-feedback">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        this.bindEvents();
    }

    bindEvents() {
        const popup = document.getElementById('feedback-popup');
        const closeBtn = popup.querySelector('.feedback-close');
        const overlay = popup.querySelector('.feedback-overlay');
        const stars = popup.querySelectorAll('.star');
        const submitBtn = popup.querySelector('#submit-feedback');
        const skipBtn = popup.querySelector('#skip-feedback');

        // Close popup events
        closeBtn.addEventListener('click', () => this.hidePopup());
        overlay.addEventListener('click', () => this.hidePopup());

        // Star rating events
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.currentTarget.dataset.rating);
                this.setRating(rating);
            });

            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.currentTarget.dataset.rating);
                this.highlightStars(rating);
            });
        });

        // Reset stars on mouse leave
        popup.querySelector('.rating-stars').addEventListener('mouseleave', () => {
            this.highlightStars(this.currentRating || 0);
        });

        // Submit feedback
        submitBtn.addEventListener('click', () => this.submitFeedback());

        // Skip feedback
        skipBtn.addEventListener('click', () => this.skipFeedback());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hidePopup();
            }
        });
    }

    showPopup() {
        if (this.isVisible) {
            console.log('FeedbackPopup: Already visible, skipping...');
            return;
        }
        
        const popup = document.getElementById('feedback-popup');
        if (!popup) {
            console.error('FeedbackPopup: Popup element not found! Creating it now...');
            this.createPopupHTML();
            return;
        }
        
        console.log('FeedbackPopup: Showing popup element');
        popup.style.display = 'flex';
        
        // Animate in
        setTimeout(() => {
            popup.classList.add('show');
            console.log('FeedbackPopup: Animation applied');
        }, 10);
        
        this.isVisible = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        console.log('FeedbackPopup: Popup is now visible');
    }

    hidePopup() {
        if (!this.isVisible) return;
        
        // Mark as shown in this session when popup is closed
        sessionStorage.setItem('cnc_feedback_session_shown', 'true');
        
        const popup = document.getElementById('feedback-popup');
        popup.classList.remove('show');
        
        setTimeout(() => {
            popup.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
        
        this.isVisible = false;
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.star i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star';
            } else {
                star.className = 'far fa-star';
            }
        });
    }

    async submitFeedback() {
        const feedbackText = document.getElementById('feedback-text').value.trim();
        const rating = this.currentRating || 0;

        // Get page title or pathname
        const pageTitle = document.title || 'Unknown Page';
        const pagePath = window.location.pathname === '/' ? 'Home' : window.location.pathname;
        const pageName = pageTitle.includes('CnC') ? pageTitle.replace('CnC - ', '').replace(' - Care & Cure Foundation Assam', '') : pagePath;

        // Prepare feedback data
        const feedbackData = {
            rating: rating,
            feedback: feedbackText,
            timestamp: new Date().toISOString(),
            page: pageName,
            userAgent: navigator.userAgent
        };

        try {
                // Send to Supabase API
                const response = await fetch('/api/feedback-supabase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Feedback stored in database:', result);

                // Send comprehensive analytics to Vercel
                if (window.va) {
                    // Track feedback submission event
                    window.va('track', 'feedback_submitted', {
                        rating: rating,
                        hasFeedback: feedbackText.length > 0,
                        page: window.location.pathname,
                        feedbackLength: feedbackText.length,
                        timestamp: new Date().toISOString(),
                        feedbackId: result.id
                    });

                    // Track user engagement metrics
                    window.va('track', 'user_engagement', {
                        action: 'feedback_provided',
                        rating: rating,
                        page: window.location.pathname,
                        timeOnSite: this.timeOnSite
                    });

                    // Track page-specific feedback
                    window.va('track', 'page_feedback', {
                        page: window.location.pathname,
                        rating: rating,
                        hasTextFeedback: feedbackText.length > 0
                    });
                }

                // Store locally as backup
                const existingFeedback = JSON.parse(localStorage.getItem('cnc_feedback') || '[]');
                existingFeedback.push({...feedbackData, databaseId: result.id});
                localStorage.setItem('cnc_feedback', JSON.stringify(existingFeedback));

            } else {
                console.error('Failed to store feedback in database:', response.statusText);
                
                // Fallback to localStorage
                const existingFeedback = JSON.parse(localStorage.getItem('cnc_feedback') || '[]');
                existingFeedback.push(feedbackData);
                localStorage.setItem('cnc_feedback', JSON.stringify(existingFeedback));

                // Track database failure
                if (window.va) {
                    window.va('track', 'database_storage', {
                        success: false,
                        error: response.statusText
                    });
                }
            }

        } catch (error) {
            console.error('Error storing feedback:', error);
            
            // Fallback to localStorage
            const existingFeedback = JSON.parse(localStorage.getItem('cnc_feedback') || '[]');
            existingFeedback.push(feedbackData);
            localStorage.setItem('cnc_feedback', JSON.stringify(existingFeedback));

            // Track error
            if (window.va) {
                window.va('track', 'database_storage', {
                    success: false,
                    error: error.message
                });
            }
        }

        // Mark as shown in this session
        sessionStorage.setItem('cnc_feedback_session_shown', 'true');

        // Show thank you message
        this.showThankYou();
    }

    skipFeedback() {
        // Mark as shown in this session
        sessionStorage.setItem('cnc_feedback_session_shown', 'true');
        this.hidePopup();
    }

    showThankYou() {
        const popup = document.getElementById('feedback-popup');
        popup.innerHTML = `
            <div class="feedback-overlay"></div>
            <div class="feedback-content">
                <div class="feedback-header">
                    <h3><i class="fas fa-heart"></i> Thank You!</h3>
                </div>
                <div class="feedback-body">
                    <div class="thank-you-message" style="text-align: center; padding: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 64px; color: #28a745; margin-bottom: 20px;"></i>
                        <p style="font-size: 16px; margin-bottom: 30px;">Thank you for your feedback! We appreciate you taking the time to help us improve.</p>
                        <button class="btn-feedback btn-primary" id="closeThankYou" style="margin: 0 auto; display: block;">
                            <i class="fas fa-thumbs-up"></i> You're Welcome!
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener to the close button
        setTimeout(() => {
            const closeBtn = document.getElementById('closeThankYou');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    popup.style.display = 'none';
                    popup.classList.remove('show');
                    document.body.style.overflow = '';
                    this.isVisible = false;
                });
            }
        }, 100);
    }
}

// Initialize feedback popup when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
        new FeedbackPopup();
    }, 1000);
});

