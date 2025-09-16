// Page generator for creating dummy pages from sitemap
class PageGenerator {
    constructor() {
        this.baseTemplate = null;
        this.sitemap = null;
    }

    async init() {
        try {
            // Load base template
            const templateResponse = await fetch('templates/base-page.html');
            this.baseTemplate = await templateResponse.text();
            
            // Load sitemap
            const sitemapResponse = await fetch('config/sitemap.json');
            this.sitemap = await sitemapResponse.json();
            
            console.log('Page generator initialized');
        } catch (error) {
            console.error('Failed to initialize page generator:', error);
        }
    }

    generatePage(route, title, description, content) {
        if (!this.baseTemplate) {
            console.error('Base template not loaded');
            return null;
        }

        return this.baseTemplate
            .replace(/\{\{title\}\}/g, title)
            .replace(/\{\{description\}\}/g, description)
            .replace(/\{\{pageTitle\}\}/g, title)
            .replace(/\{\{pageDescription\}\}/g, description)
            .replace(/\{\{content\}\}/g, content);
    }

    getDummyContent(type, slug) {
        const contentTemplates = {
            'manufacturing': this.getManufacturingContent(slug),
            'supply': this.getSupplyContent(slug),
            'services': this.getServicesContent(slug),
            'ebusiness': this.getEBusinessContent(slug),
            'dealers': this.getDealersContent(slug),
            'service-centre': this.getServiceCentreContent(slug),
            'authorized-reseller': this.getAuthorizedResellerContent(slug),
            'construction-repairing': this.getConstructionContent(slug),
            'donation': this.getDonationContent(slug),
            'info': this.getInfoContent(slug)
        };

        return contentTemplates[type] || this.getDefaultContent(slug);
    }

    getManufacturingContent(slug) {
        const products = {
            'sweets': 'Traditional Assamese Sweets',
            'nimkin': 'Crispy Nimkin Snacks',
            'puffed-rice': 'Premium Puffed Rice',
            'flattened-rice': 'Quality Flattened Rice'
        };

        const product = products[slug] || 'Manufactured Products';
        
        return `
            <div class="product-section">
                <h2>${product}</h2>
                <div class="product-grid">
                    <div class="product-card">
                        <h3>Product Details</h3>
                        <p>High-quality ${product.toLowerCase()} manufactured using traditional methods and modern technology.</p>
                        <ul>
                            <li>Premium ingredients</li>
                            <li>Hygienic processing</li>
                            <li>Quality assurance</li>
                            <li>Fresh packaging</li>
                        </ul>
                    </div>
                    <div class="product-card">
                        <h3>Specifications</h3>
                        <ul>
                            <li>Weight: 500g, 1kg, 2kg packs</li>
                            <li>Shelf Life: 6 months</li>
                            <li>Storage: Cool, dry place</li>
                            <li>Certification: FSSAI approved</li>
                        </ul>
                    </div>
                </div>
                <div class="cta-section">
                    <button class="btn btn-primary">Request Quote</button>
                    <button class="btn btn-secondary">View Catalog</button>
                </div>
            </div>
        `;
    }

    getSupplyContent(slug) {
        const supplies = {
            'supply-of-general-products': 'General Products Supply',
            'supply-of-machinaries': 'Machinery Supply',
            'supply-of-instruments': 'Instrument Supply',
            'supply-of-office-stationeries': 'Office Stationery Supply',
            'supply-of-printing-materials-etc': 'Printing Materials Supply'
        };

        const supply = supplies[slug] || 'Supply Services';
        
        return `
            <div class="supply-section">
                <h2>${supply}</h2>
                <div class="supply-info">
                    <div class="info-card">
                        <h3>Our Supply Network</h3>
                        <p>We maintain a robust supply chain across Assam to ensure timely delivery of quality products.</p>
                        <ul>
                            <li>Verified suppliers</li>
                            <li>Quality inspection</li>
                            <li>Timely delivery</li>
                            <li>Competitive pricing</li>
                        </ul>
                    </div>
                    <div class="info-card">
                        <h3>Coverage Areas</h3>
                        <ul>
                            <li>Guwahati</li>
                            <li>Dibrugarh</li>
                            <li>Jorhat</li>
                            <li>Silchar</li>
                            <li>Tezpur</li>
                        </ul>
                    </div>
                </div>
                <div class="contact-section">
                    <h3>Get Supply Quote</h3>
                    <p>Contact us for competitive pricing and delivery schedules.</p>
                    <button class="btn btn-primary">Contact Now</button>
                </div>
            </div>
        `;
    }

    getServicesContent(slug) {
        const services = {
            'vehicle-services': 'Vehicle Services',
            'manpower-services': 'Manpower Services',
            'event-organizing': 'Event Organizing',
            'catering-services': 'Catering Services',
            'photography': 'Photography Services',
            'vediography': 'Videography Services',
            'web-development': 'Web Development',
            'graphic-design': 'Graphic Design',
            'email-marketing': 'Email Marketing',
            'paid-advertizing': 'Paid Advertising',
            'online-apply-services': 'Online Application Services'
        };

        const service = services[slug] || 'Professional Services';
        
        return `
            <div class="service-section">
                <h2>${service}</h2>
                <div class="service-details">
                    <div class="service-card">
                        <h3>Service Overview</h3>
                        <p>Professional ${service.toLowerCase()} with experienced team and modern equipment.</p>
                        <ul>
                            <li>Expert professionals</li>
                            <li>Modern equipment</li>
                            <li>Quality assurance</li>
                            <li>Timely delivery</li>
                        </ul>
                    </div>
                    <div class="service-card">
                        <h3>Pricing</h3>
                        <ul>
                            <li>Competitive rates</li>
                            <li>Package deals available</li>
                            <li>Custom quotes</li>
                            <li>Bulk discounts</li>
                        </ul>
                    </div>
                </div>
                <div class="booking-section">
                    <h3>Book Service</h3>
                    <p>Ready to get started? Contact us for a consultation.</p>
                    <button class="btn btn-primary">Book Now</button>
                </div>
            </div>
        `;
    }

    getEBusinessContent(slug) {
        return `
            <div class="ebusiness-section">
                <h2>Government E-Marketplace</h2>
                <div class="ebusiness-info">
                    <div class="info-card">
                        <h3>Digital Platform</h3>
                        <p>Connect with government procurement through our digital marketplace platform.</p>
                        <ul>
                            <li>Government tenders</li>
                            <li>B2B marketplace</li>
                            <li>Digital payments</li>
                            <li>Document management</li>
                        </ul>
                    </div>
                    <div class="info-card">
                        <h3>Benefits</h3>
                        <ul>
                            <li>Transparent process</li>
                            <li>Wider reach</li>
                            <li>Reduced paperwork</li>
                            <li>Faster transactions</li>
                        </ul>
                    </div>
                </div>
                <div class="registration-section">
                    <h3>Register Now</h3>
                    <p>Join our e-marketplace to access government contracts and business opportunities.</p>
                    <button class="btn btn-primary">Register</button>
                </div>
            </div>
        `;
    }

    getDealersContent(slug) {
        const brands = {
            'lg': 'LG Electronics',
            'blue-star': 'Blue Star',
            'luminous': 'Luminous Power',
            'acer': 'Acer',
            'uniline': 'Uniline',
            'microtek': 'Microtek',
            'cello': 'Cello',
            'supreme-furniture': 'Supreme Furniture',
            'eezy': 'Eezy',
            'bluprints': 'BluPrints',
            'decowell': 'Decowell',
            'benq': 'BenQ',
            'gym-creation': 'Gym Creation',
            'kent': 'Kent',
            'euronics': 'Euronics',
            'zebronics': 'Zebronics'
        };

        const brand = brands[slug] || 'Authorized Dealer';
        
        return `
            <div class="dealer-section">
                <h2>${brand} - Authorized Dealer</h2>
                <div class="dealer-info">
                    <div class="dealer-card">
                        <h3>Product Range</h3>
                        <p>Complete range of ${brand} products with genuine warranty and after-sales support.</p>
                        <ul>
                            <li>Genuine products</li>
                            <li>Manufacturer warranty</li>
                            <li>After-sales service</li>
                            <li>Competitive pricing</li>
                        </ul>
                    </div>
                    <div class="dealer-card">
                        <h3>Services</h3>
                        <ul>
                            <li>Product demonstration</li>
                            <li>Installation support</li>
                            <li>Maintenance services</li>
                            <li>Spare parts availability</li>
                        </ul>
                    </div>
                </div>
                <div class="contact-dealer">
                    <h3>Contact Dealer</h3>
                    <p>Visit our showroom or contact us for product information and pricing.</p>
                    <button class="btn btn-primary">Contact Dealer</button>
                </div>
            </div>
        `;
    }

    getServiceCentreContent(slug) {
        return `
            <div class="service-centre-section">
                <h2>Service Centre - BenQ</h2>
                <div class="service-centre-info">
                    <div class="service-card">
                        <h3>Repair Services</h3>
                        <p>Professional repair services for BenQ products with genuine parts and expert technicians.</p>
                        <ul>
                            <li>LCD/LED repair</li>
                            <li>Projector servicing</li>
                            <li>Monitor repair</li>
                            <li>Warranty claims</li>
                        </ul>
                    </div>
                    <div class="service-card">
                        <h3>Service Features</h3>
                        <ul>
                            <li>Free diagnosis</li>
                            <li>Genuine parts only</li>
                            <li>Quick turnaround</li>
                            <li>Pickup & delivery</li>
                        </ul>
                    </div>
                </div>
                <div class="service-booking">
                    <h3>Book Service</h3>
                    <p>Schedule your repair service online or visit our service centre.</p>
                    <button class="btn btn-primary">Book Service</button>
                </div>
            </div>
        `;
    }

    getAuthorizedResellerContent(slug) {
        const brands = {
            'lg': 'LG Electronics',
            'blue-star': 'Blue Star',
            'luminous': 'Luminous Power',
            'acer': 'Acer',
            'uniline': 'Uniline',
            'microtek': 'Microtek',
            'cello': 'Cello',
            'supreme-furniture': 'Supreme Furniture',
            'eezy': 'Eezy',
            'bluprints': 'BluPrints',
            'decowell': 'Decowell',
            'benq': 'BenQ',
            'gym-creation': 'Gym Creation',
            'kent': 'Kent',
            'euronics': 'Euronics',
            'zebronics': 'Zebronics'
        };

        const brand = brands[slug] || 'Authorized Reseller';
        
        return `
            <div class="reseller-section">
                <h2>${brand} - Authorized Reseller</h2>
                <div class="reseller-info">
                    <div class="reseller-card">
                        <h3>Reseller Benefits</h3>
                        <p>Join our authorized reseller network for ${brand} products and enjoy exclusive benefits.</p>
                        <ul>
                            <li>Exclusive pricing</li>
                            <li>Marketing support</li>
                            <li>Training programs</li>
                            <li>Technical support</li>
                        </ul>
                    </div>
                    <div class="reseller-card">
                        <h3>Requirements</h3>
                        <ul>
                            <li>Valid business license</li>
                            <li>Showroom space</li>
                            <li>Technical expertise</li>
                            <li>Customer service commitment</li>
                        </ul>
                    </div>
                </div>
                <div class="become-reseller">
                    <h3>Become a Reseller</h3>
                    <p>Apply to become an authorized reseller and grow your business with us.</p>
                    <button class="btn btn-primary">Apply Now</button>
                </div>
            </div>
        `;
    }

    getConstructionContent(slug) {
        const constructionTypes = {
            'civil': 'Civil Construction',
            'electrical': 'Electrical Work',
            'maintainance': 'Maintenance Services'
        };

        const type = constructionTypes[slug] || 'Construction & Repairing';
        
        return `
            <div class="construction-section">
                <h2>${type}</h2>
                <div class="construction-info">
                    <div class="construction-card">
                        <h3>Services Offered</h3>
                        <p>Professional ${type.toLowerCase()} services with experienced contractors and quality materials.</p>
                        <ul>
                            <li>Residential projects</li>
                            <li>Commercial buildings</li>
                            <li>Infrastructure work</li>
                            <li>Renovation projects</li>
                        </ul>
                    </div>
                    <div class="construction-card">
                        <h3>Quality Assurance</h3>
                        <ul>
                            <li>Licensed contractors</li>
                            <li>Quality materials</li>
                            <li>Timely completion</li>
                            <li>Warranty on work</li>
                        </ul>
                    </div>
                </div>
                <div class="project-consultation">
                    <h3>Project Consultation</h3>
                    <p>Get a free consultation for your construction or repair project.</p>
                    <button class="btn btn-primary">Get Quote</button>
                </div>
            </div>
        `;
    }

    getDonationContent(slug) {
        const donationTypes = {
            'csr': 'Corporate Social Responsibility',
            'relief-fund': 'Relief Fund',
            'zakat': 'Zakat',
            'charity-fund': 'Charity Fund'
        };

        const type = donationTypes[slug] || 'Donation';
        
        return `
            <div class="donation-section">
                <h2>${type}</h2>
                <div class="donation-info">
                    <div class="donation-card">
                        <h3>How to Donate</h3>
                        <p>Support our social causes through ${type.toLowerCase()} and make a difference in the community.</p>
                        <ul>
                            <li>Online donations</li>
                            <li>Bank transfers</li>
                            <li>Cheque payments</li>
                            <li>In-kind donations</li>
                        </ul>
                    </div>
                    <div class="donation-card">
                        <h3>Impact Areas</h3>
                        <ul>
                            <li>Education support</li>
                            <li>Healthcare initiatives</li>
                            <li>Disaster relief</li>
                            <li>Community development</li>
                        </ul>
                    </div>
                </div>
                <div class="donate-now">
                    <h3>Make a Donation</h3>
                    <p>Every contribution makes a difference. Donate today to support our causes.</p>
                    <button class="btn btn-primary">Donate Now</button>
                </div>
            </div>
        `;
    }

    getInfoContent(slug) {
        const infoPages = {
            'about-us': {
                title: 'About Us',
                content: `
                    <div class="about-section">
                        <h2>About CNC Foundation</h2>
                        <p>CNC Foundation is a leading organization in Assam dedicated to manufacturing excellence, supply chain management, and e-business solutions.</p>
                        
                        <div class="about-grid">
                            <div class="about-card">
                                <h3>Our Mission</h3>
                                <p>To provide quality products and services while contributing to the economic development of Assam.</p>
                            </div>
                            <div class="about-card">
                                <h3>Our Vision</h3>
                                <p>To be the most trusted partner for manufacturing and business solutions in Northeast India.</p>
                            </div>
                        </div>
                        
                        <div class="company-stats">
                            <h3>Company Statistics</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-number">500+</span>
                                    <span class="stat-label">Projects Completed</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">50+</span>
                                    <span class="stat-label">Distributors</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">24/7</span>
                                    <span class="stat-label">Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            'key-contacts': {
                title: 'Key Contacts',
                content: `
                    <div class="contacts-section">
                        <h2>Key Contacts</h2>
                        <div class="contacts-grid">
                            <div class="contact-card">
                                <h3>General Inquiries</h3>
                                <p><strong>Phone:</strong> 9387102011</p>
                                <p><strong>Email:</strong> cncfoundation2021@gmail.com</p>
                                <p><strong>Address:</strong> Guwahati, Assam</p>
                            </div>
                            <div class="contact-card">
                                <h3>Business Development</h3>
                                <p><strong>Phone:</strong> +91-9876543210</p>
                                <p><strong>Email:</strong> business@cncfoundation.com</p>
                            </div>
                            <div class="contact-card">
                                <h3>Technical Support</h3>
                                <p><strong>Phone:</strong> +91-9876543211</p>
                                <p><strong>Email:</strong> support@cncfoundation.com</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'organisational-chart': {
                title: 'Organisational Chart',
                content: `
                    <div class="org-chart-section">
                        <h2>Organisational Structure</h2>
                        <div class="org-chart">
                            <div class="org-level">
                                <div class="org-position">Managing Director</div>
                            </div>
                            <div class="org-level">
                                <div class="org-position">Operations Manager</div>
                                <div class="org-position">Finance Manager</div>
                                <div class="org-position">Marketing Manager</div>
                            </div>
                            <div class="org-level">
                                <div class="org-position">Production Team</div>
                                <div class="org-position">Sales Team</div>
                                <div class="org-position">Support Team</div>
                            </div>
                        </div>
                    </div>
                `
            },
            'mission-vission': {
                title: 'Mission & Vision',
                content: `
                    <div class="mission-vision-section">
                        <div class="mission-card">
                            <h2>Our Mission</h2>
                            <p>To provide high-quality manufacturing, supply chain, and e-business solutions that contribute to the economic growth and development of Assam and Northeast India.</p>
                            <ul>
                                <li>Deliver excellence in all our products and services</li>
                                <li>Foster innovation and technological advancement</li>
                                <li>Build strong partnerships with local communities</li>
                                <li>Maintain the highest standards of quality and integrity</li>
                            </ul>
                        </div>
                        <div class="vision-card">
                            <h2>Our Vision</h2>
                            <p>To be the leading organization in Northeast India, recognized for our commitment to quality, innovation, and community development.</p>
                            <ul>
                                <li>Expand our reach across all Northeast states</li>
                                <li>Become a trusted partner for government and private sector</li>
                                <li>Contribute to sustainable development goals</li>
                                <li>Create employment opportunities for local youth</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            'online-marketing': {
                title: 'Online Marketing',
                content: `
                    <div class="marketing-section">
                        <h2>Online Marketing Services</h2>
                        <div class="marketing-services">
                            <div class="service-card">
                                <h3>Digital Marketing</h3>
                                <p>Comprehensive digital marketing solutions to boost your online presence.</p>
                                <ul>
                                    <li>Social media marketing</li>
                                    <li>Search engine optimization</li>
                                    <li>Content marketing</li>
                                    <li>Email campaigns</li>
                                </ul>
                            </div>
                            <div class="service-card">
                                <h3>Website Development</h3>
                                <p>Professional website design and development services.</p>
                                <ul>
                                    <li>Responsive design</li>
                                    <li>E-commerce solutions</li>
                                    <li>Content management</li>
                                    <li>SEO optimization</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },
            'marketing-research': {
                title: 'Marketing Research',
                content: `
                    <div class="research-section">
                        <h2>Marketing Research Services</h2>
                        <div class="research-info">
                            <div class="research-card">
                                <h3>Market Analysis</h3>
                                <p>Comprehensive market research to help you understand your target audience and competition.</p>
                                <ul>
                                    <li>Market size analysis</li>
                                    <li>Competitor research</li>
                                    <li>Customer behavior studies</li>
                                    <li>Trend analysis</li>
                                </ul>
                            </div>
                            <div class="research-card">
                                <h3>Research Methods</h3>
                                <ul>
                                    <li>Surveys and questionnaires</li>
                                    <li>Focus groups</li>
                                    <li>Data analysis</li>
                                    <li>Report generation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },
            'social-media': {
                title: 'Social Media',
                content: `
                    <div class="social-media-section">
                        <h2>Social Media Management</h2>
                        <div class="social-platforms">
                            <div class="platform-card">
                                <h3>Facebook</h3>
                                <p>Connect with us on Facebook for updates and news.</p>
                                <a href="#" class="btn btn-primary">Follow Us</a>
                            </div>
                            <div class="platform-card">
                                <h3>Instagram</h3>
                                <p>Follow our Instagram for visual content and behind-the-scenes.</p>
                                <a href="#" class="btn btn-primary">Follow Us</a>
                            </div>
                            <div class="platform-card">
                                <h3>LinkedIn</h3>
                                <p>Connect with us professionally on LinkedIn.</p>
                                <a href="#" class="btn btn-primary">Connect</a>
                            </div>
                        </div>
                    </div>
                `
            },
            'employee-management': {
                title: 'Employee Management',
                content: `
                    <div class="employee-section">
                        <h2>Employee Management</h2>
                        <div class="employee-info">
                            <div class="employee-card">
                                <h3>HR Services</h3>
                                <p>Comprehensive human resource management services for your organization.</p>
                                <ul>
                                    <li>Recruitment and selection</li>
                                    <li>Training and development</li>
                                    <li>Performance management</li>
                                    <li>Employee relations</li>
                                </ul>
                            </div>
                            <div class="employee-card">
                                <h3>Benefits</h3>
                                <ul>
                                    <li>Competitive salary packages</li>
                                    <li>Health insurance</li>
                                    <li>Professional development</li>
                                    <li>Work-life balance</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },
            'business-tie-ups': {
                title: 'Business Tie-ups',
                content: `
                    <div class="tieups-section">
                        <h2>Business Partnerships</h2>
                        <div class="partnership-info">
                            <div class="partnership-card">
                                <h3>Partnership Opportunities</h3>
                                <p>Explore various partnership opportunities with CNC Foundation.</p>
                                <ul>
                                    <li>Distributor partnerships</li>
                                    <li>Supplier collaborations</li>
                                    <li>Joint ventures</li>
                                    <li>Franchise opportunities</li>
                                </ul>
                            </div>
                            <div class="partnership-card">
                                <h3>Benefits</h3>
                                <ul>
                                    <li>Shared resources</li>
                                    <li>Market expansion</li>
                                    <li>Risk sharing</li>
                                    <li>Mutual growth</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },
            'grievances': {
                title: 'Grievances',
                content: `
                    <div class="grievances-section">
                        <h2>Grievance Redressal</h2>
                        <div class="grievance-info">
                            <div class="grievance-card">
                                <h3>Lodge a Grievance</h3>
                                <p>We take all grievances seriously and ensure timely resolution.</p>
                                <form class="grievance-form">
                                    <div class="form-group">
                                        <label for="grievance-type">Type of Grievance</label>
                                        <select id="grievance-type">
                                            <option value="service">Service Related</option>
                                            <option value="product">Product Related</option>
                                            <option value="billing">Billing Related</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="grievance-details">Details</label>
                                        <textarea id="grievance-details" rows="4"></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Submit Grievance</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `
            },
            'gallery-publications': {
                title: 'Gallery & Publications',
                content: `
                    <div class="gallery-section">
                        <h2>Gallery & Publications</h2>
                        <div class="gallery-content">
                            <div class="gallery-grid">
                                <div class="gallery-item">
                                    <h3>Photo Gallery</h3>
                                    <p>View our latest photos and events.</p>
                                    <button class="btn btn-secondary">View Gallery</button>
                                </div>
                                <div class="gallery-item">
                                    <h3>Publications</h3>
                                    <p>Download our latest publications and reports.</p>
                                    <button class="btn btn-secondary">View Publications</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            'announcements': {
                title: 'Announcements',
                content: `
                    <div class="announcements-section">
                        <h2>Latest Announcements</h2>
                        <div class="announcements-list">
                            <div class="announcement-item">
                                <h3>New Product Launch</h3>
                                <p class="announcement-date">December 15, 2024</p>
                                <p>We are excited to announce the launch of our new product line.</p>
                            </div>
                            <div class="announcement-item">
                                <h3>Holiday Schedule</h3>
                                <p class="announcement-date">December 10, 2024</p>
                                <p>Our office will be closed from December 25-26 for Christmas holidays.</p>
                            </div>
                            <div class="announcement-item">
                                <h3>Service Update</h3>
                                <p class="announcement-date">December 5, 2024</p>
                                <p>We have updated our service procedures for better customer experience.</p>
                            </div>
                        </div>
                    </div>
                `
            },
            'search': {
                title: 'Search',
                content: `
                    <div class="search-section">
                        <h2>Search</h2>
                        <div class="search-interface">
                            <div class="search-box">
                                <input type="search" placeholder="Search our website..." class="search-input">
                                <button class="btn btn-primary">Search</button>
                            </div>
                            <div class="search-filters">
                                <h3>Filter by Category</h3>
                                <div class="filter-options">
                                    <label><input type="checkbox" value="products"> Products</label>
                                    <label><input type="checkbox" value="services"> Services</label>
                                    <label><input type="checkbox" value="news"> News</label>
                                    <label><input type="checkbox" value="announcements"> Announcements</label>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            'contact-us': {
                title: 'Contact Us',
                content: `
                    <div class="contact-section">
                        <h2>Contact Us</h2>
                        <div class="contact-info">
                            <div class="contact-details">
                                <h3>Get in Touch</h3>
                                <div class="contact-item">
                                    <i class="fas fa-phone"></i>
                                    <span>9387102011</span>
                                </div>
                                <div class="contact-item">
                                    <i class="fas fa-envelope"></i>
                                    <span>cncfoundation2021@gmail.com</span>
                                </div>
                                <div class="contact-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>Guwahati, Assam, India</span>
                                </div>
                            </div>
                            <div class="contact-form">
                                <h3>Send us a Message</h3>
                                <form>
                                    <div class="form-group">
                                        <input type="text" placeholder="Your Name" required>
                                    </div>
                                    <div class="form-group">
                                        <input type="email" placeholder="Your Email" required>
                                    </div>
                                    <div class="form-group">
                                        <textarea placeholder="Your Message" rows="4" required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Send Message</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `
            }
        };

        const page = infoPages[slug];
        return page ? page.content : this.getDefaultContent(slug);
    }

    getDefaultContent(slug) {
        return `
            <div class="default-section">
                <h2>${slug.replace(/-/g, ' ').toUpperCase()}</h2>
                <p>This page is under construction. Content will be added soon.</p>
                <div class="coming-soon">
                    <h3>Coming Soon</h3>
                    <p>We are working on adding content for this section. Please check back later.</p>
                </div>
            </div>
        `;
    }
}

// Initialize page generator
const pageGenerator = new PageGenerator();
pageGenerator.init();

// Export for use in other scripts
window.pageGenerator = pageGenerator;
