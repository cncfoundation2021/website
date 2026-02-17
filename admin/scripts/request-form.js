/**
 * CNC Request Form Component
 * Handles dynamic form generation, validation, and submission
 */

class RequestForm {
    constructor() {
        this.formConfig = null;
        this.sitemap = null;
        this.currentOffering = null;
        this.modal = null;
        this.init();
    }

    getSitemapPath() {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);
        if (pathParts[0] === 'offerings' && pathParts.length >= 2) {
            const depth = pathParts.length - 1;
            return '../'.repeat(Math.min(depth, 3)) + 'config/sitemap.json';
        }
        if (pathParts.length >= 1) {
            return '../config/sitemap.json';
        }
        return 'config/sitemap.json';
    }

    async init() {
        try {
            // Load form configuration
            const response = await fetch('/admin/config/offering-forms.json');
            this.formConfig = await response.json();
            
            // Load sitemap for Service/Product dropdown (from left pane / Our Offerings)
            try {
                const sitemapPath = this.getSitemapPath();
                const sitemapRes = await fetch(sitemapPath);
                if (sitemapRes.ok) {
                    const sitemapData = await sitemapRes.json();
                    this.sitemap = sitemapData.sitemap?.topNav || [];
                }
            } catch (e) {
                console.warn('Could not load sitemap for Service/Product dropdown:', e);
            }
            
            // Detect current offering from URL
            this.detectOffering();
            
            // Create modal structure
            this.createModal();
            
            // Create request button
            this.createRequestButton();
            
            // Attach event listeners
            this.attachEventListeners();
            
            console.log('Request Form initialized for:', this.currentOffering);
        } catch (error) {
            console.error('Failed to initialize Request Form:', error);
        }
    }

    detectOffering() {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);
        
        // Info pages with request form (e.g. Business Tie-ups)
        if (pathParts[0] === 'info' && pathParts[1] === 'business-tie-ups') {
            this.currentOffering = {
                category: 'business-tie-ups',
                name: 'business-tie-ups',
                fullPath: path
            };
            return;
        }
        
        // Extract offering category and name from offerings path
        if (pathParts.length >= 2 && pathParts[0] === 'offerings') {
            let name = pathParts[2] || pathParts[1];
            // Normalize: index.html or index -> treat as category-level (user will select from dropdown)
            if (name && (name === 'index' || name === 'index.html')) {
                name = '';
            }
            this.currentOffering = {
                category: pathParts[1],
                name: name,
                fullPath: path
            };
        }
    }

    getCategoryChildren(categorySlug) {
        if (!this.sitemap || !Array.isArray(this.sitemap)) return [];
        const category = this.sitemap.find(item => item.slug === categorySlug);
        return category?.children || [];
    }

    /**
     * Get display name for offering - uses sitemap title when available for consistency
     * with left pane / Our Offerings. Same display format used for both Services index
     * and dedicated service pages.
     */
    getOfferingDisplayName(slug, categorySlug) {
        if (slug && categorySlug && this.sitemap) {
            const children = this.getCategoryChildren(categorySlug);
            const child = children.find(c => c.slug === slug);
            if (child) return child.title;
        }
        return this.formatOfferingName(slug || '');
    }

    createModal() {
        // Check if modal already exists to prevent duplicates
        if (document.getElementById('requestFormModal')) {
            console.log('Request form modal already exists, skipping creation');
            this.modal = document.getElementById('requestFormModal');
            return;
        }
        
        // Create modal overlay
        const modalHTML = `
            <div id="requestFormModal" class="request-form-modal" style="display: none;">
                <div class="request-form-overlay"></div>
                <div class="request-form-container">
                    <div class="request-form-header">
                        <h2>Raise Service Request</h2>
                        <button type="button" class="request-form-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="request-form-body">
                        <form id="serviceRequestForm" novalidate>
                            <!-- Form will be dynamically generated here -->
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('requestFormModal');
        console.log('Request form modal created successfully');
    }

    createRequestButton() {
        // Clean up any existing duplicate buttons first
        this.cleanupDuplicateButtons();
        
        // Check if button already exists to prevent duplicates
        if (document.querySelector('.raise-request-btn')) {
            console.log('Request button already exists, skipping creation');
            return;
        }
        
        // Find the hero banner or content area to add the button
        const heroBanner = document.querySelector('.hero-banner');
        const contentBody = document.querySelector('.content-body');
        const serviceOverview = document.querySelector('.service-overview');
        const defaultSection = document.querySelector('.default-section');
        const contentSection = document.querySelector('.content-section');
        
        let targetElement = heroBanner || contentBody || serviceOverview || defaultSection || contentSection;
        
        if (!targetElement) {
            console.warn('Could not find suitable location for request button');
            return;
        }
        
        // Create the request button
        const buttonHTML = `
            <div class="request-button-container" style="text-align: center; margin: 2rem 0;">
                <button type="button" class="raise-request-btn" onclick="requestForm.openModal()">
                    <i class="fas fa-paper-plane"></i>
                    Raise Request
                </button>
            </div>
        `;
        
        // Add button to the target element
        if (targetElement.classList.contains('hero-banner')) {
            // Add to hero content
            const heroContent = targetElement.querySelector('.hero-content');
            if (heroContent) {
                heroContent.insertAdjacentHTML('beforeend', buttonHTML);
            } else {
                targetElement.insertAdjacentHTML('beforeend', buttonHTML);
            }
        } else {
            // Add to content area
            targetElement.insertAdjacentHTML('beforeend', buttonHTML);
        }
        
        console.log('Request button created successfully');
    }

    cleanupDuplicateButtons() {
        // Remove any existing duplicate buttons
        const existingButtons = document.querySelectorAll('.raise-request-btn');
        if (existingButtons.length > 1) {
            console.log(`Found ${existingButtons.length} duplicate buttons, cleaning up...`);
            // Keep only the first button, remove the rest
            for (let i = 1; i < existingButtons.length; i++) {
                const buttonContainer = existingButtons[i].closest('.request-button-container');
                if (buttonContainer) {
                    buttonContainer.remove();
                } else {
                    existingButtons[i].remove();
                }
            }
            console.log('Duplicate buttons cleaned up');
        }
    }

    attachEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.request-form-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Overlay click
        const overlay = this.modal.querySelector('.request-form-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal());
        }
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    openModal() {
        if (!this.currentOffering) {
            console.error('No offering detected');
            return;
        }
        
        // Generate form
        this.generateForm();
        
        // Show modal
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset form
        const form = document.getElementById('serviceRequestForm');
        if (form) form.reset();
    }

    generateForm() {
        const form = document.getElementById('serviceRequestForm');
        if (!form) return;
        
        let formHTML = '';
        
        // Add offering information (read-only)
        formHTML += this.generateOfferingSection();
        
        // Get category-specific configuration
        const categoryConfig = this.formConfig[this.currentOffering.category] || this.formConfig.default;
        
        // Add customer information section
        formHTML += this.generateCustomerSection();
        
        // Add category-specific sections
        if (categoryConfig && categoryConfig.sections) {
            categoryConfig.sections.forEach(section => {
                formHTML += this.generateFieldSection(section.title, section.fields);
            });
        }
        
        // Add general requirements
        formHTML += this.generateGeneralRequirements();
        
        // Add submit button
        formHTML += `
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="requestForm.closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Submit Request</button>
            </div>
        `;
        
        form.innerHTML = formHTML;
        
        // Attach form submit handler
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    generateOfferingSection() {
        const categoryConfig = this.formConfig[this.currentOffering.category] || this.formConfig.default;
        const title = categoryConfig ? categoryConfig.title : this.currentOffering.category;
        const children = this.getCategoryChildren(this.currentOffering.category);
        
        let serviceProductField;
        if (children.length > 0) {
            // Use dropdown with all services/products from sitemap (left pane Our Offerings)
            const currentSlug = (this.currentOffering.name || '').replace(/\.html$/, '');
            const options = children.map(child => {
                const selected = child.slug === currentSlug ? ' selected' : '';
                return `<option value="${child.slug}"${selected}>${child.title}</option>`;
            }).join('');
            serviceProductField = `
                <select name="offering_service" id="offering_service" required>
                    <option value="">Select Service/Product</option>
                    ${options}
                </select>
                <span class="error-message" id="offering_service_error"></span>
            `;
        } else {
            // No children - show readonly category name
            const displayName = this.currentOffering.name 
                ? this.formatOfferingName(this.currentOffering.name) 
                : this.formatOfferingName(this.currentOffering.category);
            serviceProductField = `<input type="text" value="${displayName}" readonly class="readonly-field">`;
        }
        
        return `
            <div class="form-section offering-section">
                <h3>Request For</h3>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" value="${title}" readonly class="readonly-field">
                </div>
                <div class="form-group">
                    <label>Service/Product <span class="required-mark">*</span></label>
                    ${serviceProductField}
                </div>
            </div>
        `;
    }

    generateCustomerSection() {
        return `
            <div class="form-section">
                <h3>Customer Information</h3>
                <div class="form-group">
                    <label>Full Name <span class="required-mark">*</span></label>
                    <input type="text" name="customer_name" id="customer_name" required>
                </div>
                <div class="form-group">
                    <label>Email Address <span class="required-mark">*</span></label>
                    <input type="email" name="customer_email" id="customer_email" required>
                </div>
                <div class="form-group">
                    <label>Phone Number <span class="required-mark">*</span></label>
                    <input type="tel" name="customer_phone" id="customer_phone" required>
                </div>
                <div class="form-group">
                    <label>Address <span class="required-mark">*</span></label>
                    <textarea name="customer_address" id="customer_address" required rows="3" placeholder="Enter your complete address"></textarea>
                </div>
            </div>
        `;
    }

    generateFieldSection(title, fields) {
        let html = `<div class="form-section"><h3>${title}</h3>`;
        
        fields.forEach(field => {
            html += this.generateField(field);
        });
        
        html += '</div>';
        return html;
    }

    generateField(field) {
        const required = field.required ? 'required' : '';
        const requiredMark = field.required ? '<span class="required-mark">*</span>' : '';
        
        let inputHTML = '';
        
        switch (field.type) {
            case 'textarea':
                inputHTML = `
                    <textarea 
                        name="${field.name}" 
                        id="${field.name}" 
                        placeholder="${field.placeholder || ''}"
                        ${required}
                        rows="4"
                    ></textarea>
                `;
                break;
            
            case 'select':
                inputHTML = `
                    <select name="${field.name}" id="${field.name}" ${required}>
                        <option value="">Select ${field.label}</option>
                        ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
                break;
            
            case 'date':
                const today = new Date().toISOString().split('T')[0];
                inputHTML = `
                    <input 
                        type="date" 
                        name="${field.name}" 
                        id="${field.name}"
                        min="${today}"
                        ${required}
                    >
                `;
                break;
            
            default:
                inputHTML = `
                    <input 
                        type="${field.type}" 
                        name="${field.name}" 
                        id="${field.name}" 
                        placeholder="${field.placeholder || ''}"
                        ${required}
                    >
                `;
        }
        
        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}${requiredMark}</label>
                ${inputHTML}
                <span class="error-message" id="${field.name}_error"></span>
            </div>
        `;
    }

    generateGeneralRequirements() {
        return `
            <div class="form-section">
                <h3>Additional Information</h3>
                <div class="form-group">
                    <label>Additional Requirements</label>
                    <textarea name="additional_requirements" id="additional_requirements" rows="3" placeholder="Any additional information or special requirements"></textarea>
                </div>
            </div>
        `;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Disable submit button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Submit to API
            const result = await this.submitToAPI(formData);
            
            if (result.success) {
                // Send email
                await this.sendEmail(formData, result.requestId);
                
                // Open WhatsApp
                this.openWhatsApp(formData, result.requestId);
                
                // Show success message
                this.showSuccess();
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    }

    validateForm() {
        const form = document.getElementById('serviceRequestForm');
        let isValid = true;
        
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        form.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
        
        // Validate required fields
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate email
        const emailField = form.querySelector('[name="customer_email"]');
        if (emailField && emailField.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value)) {
                this.showFieldError(emailField, 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        // Validate phone
        const phoneField = form.querySelector('[name="customer_phone"]');
        if (phoneField && phoneField.value) {
            const phoneRegex = /^[+]?[0-9]{10,15}$/;
            if (!phoneRegex.test(phoneField.value.replace(/[\s-]/g, ''))) {
                this.showFieldError(phoneField, 'Please enter a valid phone number');
                isValid = false;
            }
        }
        
        return isValid;
    }

    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.name}_error`);
        if (errorElement) {
            errorElement.textContent = message;
            field.closest('.form-group').classList.add('has-error');
        }
    }

    collectFormData() {
        const form = document.getElementById('serviceRequestForm');
        const formData = new FormData(form);
        
        // Use selected service/product from dropdown if available, else current page's offering
        const offeringService = formData.get('offering_service');
        const offeringName = offeringService || this.currentOffering.name || this.currentOffering.category;
        
        const data = {
            offering_category: this.currentOffering.category,
            offering_name: offeringName,
            customer_name: formData.get('customer_name'),
            customer_email: formData.get('customer_email'),
            customer_phone: formData.get('customer_phone'),
            customer_address: formData.get('customer_address'),
            request_details: {},
            page_url: window.location.href,
            submitted_at: new Date().toISOString()
        };
        
        // Collect category-specific fields
        const categoryConfig = this.formConfig[this.currentOffering.category] || this.formConfig.default;
        if (categoryConfig && categoryConfig.sections) {
            categoryConfig.sections.forEach(section => {
                section.fields.forEach(field => {
                    const value = formData.get(field.name);
                    if (value) {
                        data.request_details[field.name] = value;
                    }
                });
            });
        }
        
        // Add general requirements
        const additionalReq = formData.get('additional_requirements');
        if (additionalReq) {
            data.request_details.additional_requirements = additionalReq;
        }
        
        return data;
    }

    async submitToAPI(data) {
        const response = await fetch('/api/service-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit request');
        }
        
        return await response.json();
    }

    async sendEmail(data, requestId) {
        try {
            // Initialize EmailJS if not already done
            if (typeof emailjs === 'undefined') {
                console.warn('EmailJS not loaded, skipping email');
                return;
            }
            
            // Initialize EmailJS with public key
            emailjs.init('C93hFxxbGd9Ruotnl');
            console.log('EmailJS initialized');
            
            // Use same template and display format for ALL submissions - whether from Services index
            // or dedicated service page (e.g. home-maintenance). getOfferingDisplayName ensures
            // consistent labels matching left pane Our Offerings.
            const offeringDisplayName = this.getOfferingDisplayName(
                data.offering_name,
                data.offering_category
            );
            
            // Format request details for email (dynamic form content)
            const formDetailsFormatted = Object.entries(data.request_details)
                .filter(([key]) => key !== 'page_url')
                .map(([key, value]) => `${this.formatFieldName(key)}: ${value}`)
                .join('\n');
            
            // Prepare template parameters for admin notification (same template for all pages)
            const adminParams = {
                email: 'cncfoundation2021@gmail.com',
                to_name: 'CNC Foundation',
                request_id: requestId,
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone,
                customer_address: data.customer_address,
                offering_category: this.formatOfferingName(data.offering_category),
                offering_name: offeringDisplayName,
                form_details: formDetailsFormatted,
                page_url: data.page_url || 'N/A',
                submitted_at: new Date(data.submitted_at).toLocaleString('en-IN')
            };
            
            console.log('Sending admin email with params:', adminParams);
            
            // Send email to admin - same template (template_k68ksse) for Services index and dedicated pages
            const adminResponse = await emailjs.send(
                'service_ywrm5zc',
                'template_k68ksse',
                adminParams
            );
            
            console.log('Admin email sent successfully:', adminResponse);
            
            // Prepare template parameters for customer confirmation (same template for all pages)
            const customerParams = {
                customer_email: data.customer_email,
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                offering_category: this.formatOfferingName(data.offering_category),
                offering_name: offeringDisplayName,
                form_details: formDetailsFormatted,
                submitted_at: new Date(data.submitted_at).toLocaleString('en-IN'),
                support_email: 'cncfoundation2021@gmail.com',
                support_phone: '+916002610858'
            };
            
            console.log('Sending customer confirmation email');
            
            // Send confirmation email to customer
            try {
                const customerResponse = await emailjs.send(
                    'service_ywrm5zc',
                    'template_ohbquyf', // Customer confirmation template
                    customerParams
                );
                console.log('Customer confirmation email sent successfully:', customerResponse);
            } catch (custError) {
                console.error('Customer confirmation email failed:', custError);
                console.error('Error details:', custError.text || custError.message);
            }
            
        } catch (error) {
            console.error('Email sending failed:', error);
            console.error('Error details:', error.text || error.message);
            // Don't fail the whole submission if email fails
        }
    }

    openWhatsApp(data, requestId) {
        const offeringDisplayName = this.getOfferingDisplayName(
            data.offering_name,
            data.offering_category
        );
        const message = `
*New Service Request - CNC Assam*

*Request ID:* ${requestId}

*Customer Details:*
Name: ${data.customer_name}
Email: ${data.customer_email}
Phone: ${data.customer_phone}
Address: ${data.customer_address}

*Request For:*
Category: ${this.formatOfferingName(data.offering_category)}
Service/Product: ${offeringDisplayName}

*Details:*
${Object.entries(data.request_details).map(([key, value]) => `${this.formatFieldName(key)}: ${value}`).join('\n')}

*Submitted at:* ${new Date(data.submitted_at).toLocaleString('en-IN')}
        `.trim();
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/916002610858?text=${encodedMessage}`;
        
        // Open WhatsApp in new tab
        setTimeout(() => {
            window.open(whatsappURL, '_blank');
        }, 1000);
    }

    showSuccess() {
        const form = document.getElementById('serviceRequestForm');
        form.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✓</div>
                <h3>Request Submitted Successfully!</h3>
                <p>Thank you for your request. We have received your information and will contact you shortly.</p>
                <p>📧 A confirmation email has been sent to your email address.</p>
                <button type="button" class="btn-primary" onclick="requestForm.closeModal()">Close</button>
            </div>
        `;
    }

    showError(message) {
        alert(`Error: ${message}\n\nPlease try again or contact us directly.`);
    }

    formatOfferingName(name) {
        return name
            .replace(/\.html$/, '') // Remove .html extension
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatFieldName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Initialize the form when DOM is ready
let requestForm;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!requestForm) {
            requestForm = new RequestForm();
        }
    });
} else {
    if (!requestForm) {
        requestForm = new RequestForm();
    }
}

