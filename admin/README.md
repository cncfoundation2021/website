# CNC Request Form & Admin System

A comprehensive service request management system for the CNC Assam website, featuring:

- 🎯 Dynamic request forms on all offering pages
- 📧 Email notifications via EmailJS
- 💬 WhatsApp integration for instant communication
- 💾 Dual storage: Supabase + Google Sheets backup
- 🔐 Secure admin panel with authentication
- 📊 Real-time dashboard for managing requests
- 👥 Multi-admin user management

## 📁 Project Structure

```
admin/
├── api/                          # API endpoints
│   ├── admin-auth.js            # Admin authentication
│   └── service-requests.js      # Service requests CRUD
│
├── config/                       # Configuration files
│   ├── request-forms.json       # Form field definitions
│   └── supabase-schema.sql      # Database schema
│
├── pages/                        # Admin UI pages
│   ├── login.html               # Admin login page
│   └── dashboard.html           # Admin dashboard
│
├── scripts/                      # JavaScript modules
│   ├── request-form.js          # Public-facing form component
│   ├── admin-dashboard.js       # Dashboard functionality
│   └── update-offering-pages.js # Utility script for bulk updates
│
├── styles/                       # CSS stylesheets
│   └── request-form.css         # Form modal styling
│
├── index.html                    # Redirects to login
├── README.md                     # This file
└── SETUP.md                      # Detailed setup instructions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ installed
- Supabase account (free tier)
- Vercel account for deployment
- EmailJS account (optional, for email notifications)
- Google account (optional, for Sheets backup)

### Installation

1. **Clone and navigate:**
   ```bash
   cd "C:\Users\wasim\Desktop\CNC Assam Website"
   ```

2. **Review the setup guide:**
   ```bash
   # Open admin/SETUP.md for detailed instructions
   ```

3. **Configure Supabase:**
   - Create a Supabase project
   - Run the SQL in `admin/config/supabase-schema.sql`
   - Get your API credentials

4. **Set environment variables in Vercel:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

5. **Add request buttons to all pages:**
   ```bash
   node admin/scripts/update-offering-pages.js
   ```

6. **Deploy:**
   ```bash
   vercel --prod
   ```

## 🎯 Features

### Request Form System

- **Dynamic Forms**: Different questions based on offering category
- **Validation**: Client-side validation for all fields
- **Multi-channel Submission**: 
  - Saved to Supabase database
  - Backup to Google Sheets
  - Email notification to admin
  - WhatsApp message for instant contact

### Admin Panel

- **Secure Login**: Session-based authentication
- **Dashboard Overview**: Statistics and recent requests
- **Request Management**:
  - View all requests
  - Filter by status, category
  - Search functionality
  - Update request status
  - View detailed information
- **User Management**: Add/remove admin users (super admin only)

### Offering-Specific Fields

Each category has custom fields:

- **Manufacturing**: quantity, delivery date, customization
- **Supply**: specifications, quantity, location, timeline
- **Services**: date, time, duration, requirements
- **Authorized Reseller**: model, quantity, warranty, installation
- **Construction**: scope, location, timeline, budget
- **Donation**: amount, purpose, receipt requirement
- And more...

## 📱 Usage

### For Website Visitors

1. Navigate to any offering page (except CNC Bazar)
2. Click the **"Raise Request"** button in the hero section
3. Fill in personal information
4. Complete offering-specific fields
5. Add any additional requirements
6. Submit the form
7. Receive confirmation and WhatsApp link opens

### For Administrators

1. Go to `https://your-domain.com/admin`
2. Login with credentials
3. View dashboard statistics
4. Manage service requests:
   - Click "View" to see full details
   - Click "Edit" to update status
5. Filter and search requests as needed
6. Logout when done

## 🔧 Configuration

### Form Fields

Edit `admin/config/request-forms.json` to customize:

- Common fields (shown on all forms)
- Category-specific fields
- Field types (text, email, date, select, textarea)
- Validation rules
- Required vs optional fields

Example:

```json
{
  "offeringCategories": {
    "your-category": {
      "title": "Your Category",
      "fields": [
        {
          "name": "field_name",
          "label": "Field Label",
          "type": "text",
          "required": true,
          "placeholder": "Enter value..."
        }
      ]
    }
  }
}
```

### Email Template

Configure EmailJS:

1. Create account at emailjs.com
2. Set up email service
3. Create template with variables:
   - `{{request_id}}`
   - `{{customer_name}}`
   - `{{customer_email}}`
   - `{{customer_phone}}`
   - `{{offering_name}}`
   - `{{request_details}}`
4. Update credentials in `admin/scripts/request-form.js`

### WhatsApp

The WhatsApp integration uses direct links:

```javascript
https://wa.me/916002610858?text=your_message
```

To change the number, edit `admin/scripts/request-form.js` line ~430.

## 🔐 Security

### Authentication

- Session-based auth with 8-hour expiration
- Password hashing (SHA-256, upgrade to bcrypt recommended)
- Secure session tokens stored in localStorage
- API endpoints protected with authentication

### Best Practices

1. **Change default admin password immediately**
2. **Use HTTPS in production** (automatically handled by Vercel)
3. **Never commit `.env` files**
4. **Regularly update dependencies**
5. **Monitor API usage** (Supabase, EmailJS limits)

### Recommended Improvements

- [ ] Implement bcrypt for password hashing
- [ ] Add 2FA for admin login
- [ ] Add rate limiting to API endpoints
- [ ] Implement CAPTCHA on request form
- [ ] Add email verification for requests
- [ ] Log all admin actions for audit trail

## 🧪 Testing

### Test Request Form Locally

```bash
# Serve the site locally
python -m http.server 8000
# Or use any local server

# Navigate to:
http://localhost:8000/offerings/manufacturing-of-products/namkeen.html

# Click "Raise Request" and submit test data
```

### Test Admin Panel

```bash
# Navigate to:
http://localhost:8000/admin

# Login with:
Username: admin
Password: admin123 (or your changed password)

# Verify:
- Dashboard loads
- Statistics display
- Requests table shows data
- Filters work
- Detail modal opens
- Status updates work
```

## 📊 Database Schema

### service_requests

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| offering_category | TEXT | Category slug |
| offering_name | TEXT | Offering slug |
| customer_name | TEXT | Full name |
| customer_email | TEXT | Email address |
| customer_phone | TEXT | Phone number |
| customer_address | TEXT | Full address |
| request_details | JSONB | Dynamic fields |
| status | TEXT | pending/in-progress/completed/cancelled |
| priority | TEXT | low/normal/high/urgent |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

### admin_users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | TEXT | Unique username |
| password_hash | TEXT | Hashed password |
| email | TEXT | Email address |
| full_name | TEXT | Display name |
| role | TEXT | admin/super_admin |
| is_active | BOOLEAN | Account status |
| last_login | TIMESTAMP | Last login time |

## 🚢 Deployment

### Deploy Everything

```bash
# Deploy all features including admin
vercel --prod
```

### Deploy Without Admin (Testing Other Features)

```bash
# Create .vercelignore
echo "admin/" > .vercelignore

# Deploy
vercel --prod

# To deploy admin later, delete .vercelignore
```

### Environment Variables Required

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Google Sheets (Optional)
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

## 🔄 Updates

### Add Request Button to New Pages

When you create new offering pages:

1. Add CSS link in `<head>`:
   ```html
   <link rel="stylesheet" href="../../admin/styles/request-form.css">
   ```

2. Add script before `</body>`:
   ```html
   <script src="../../admin/scripts/request-form.js"></script>
   ```

3. Add button in hero section:
   ```html
   <button class="raise-request-btn" onclick="requestForm.openModal()">
       <i class="fas fa-file-alt"></i> Raise Request
   </button>
   ```

Or run the automated script:

```bash
node admin/scripts/update-offering-pages.js
```

## 🐛 Troubleshooting

### Form Not Appearing

- Check browser console for errors
- Verify CSS/JS file paths
- Ensure files are being served correctly

### Admin Login Fails

- Verify Supabase credentials
- Check if tables exist in Supabase
- Verify password hash

### Email Not Sending

- Check EmailJS monthly limit (200 free)
- Verify template ID and service ID
- Check browser console

### Google Sheets Not Updating

- Verify service account has editor access
- Check Sheet ID is correct
- Verify environment variables

## 📝 License

© 2024 Care & Cure Foundation (CnC), Assam. All rights reserved.

## 📞 Support

- **Email**: cncfoundation2021@gmail.com
- **Phone**: +916002610858
- **Website**: https://cncassam.com

---

**Note**: See `SETUP.md` for detailed setup instructions with step-by-step guides for each service integration.

