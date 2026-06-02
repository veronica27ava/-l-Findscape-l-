# FINDSCAPE - Trading Card & Collectibles Marketplace

## Overview

Findscape is a private, community-driven marketplace platform designed specifically for trading card and collectibles enthusiasts. The platform provides a secure environment for collectors to buy, sell, and showcase their treasured items.

## Features

### For Visitors (Public Browse)
- ✅ Browse products without account
- ✅ View product details and gallery
- ✅ View seller profiles
- ✅ Search and filter products
- ✅ View sales analytics

### For Members (Authenticated Users)
- ✅ Create, edit, and delete product listings
- ✅ Manage inventory (quantity, condition)
- ✅ Upload multiple product images with gallery view
- ✅ View personal profile with stats
- ✅ Send direct messages to other members
- ✅ Receive notifications
- ✅ View seller profiles
- ✅ Mark products as sold

### For Admin
- ✅ Member management (approve, reject, ban, kick)
- ✅ Generate access codes for member registration
- ✅ Product moderation (delete, ban listings)
- ✅ Manage website settings
- ✅ Edit community rules
- ✅ Upload custom logo
- ✅ View all activity

## Authentication System

### Registration Process
1. User visits registration page
2. User reads community rules
3. User enters:
   - Full Legal Name (Government Name - Admin only visible)
   - Email Address
   - Username
   - Password
4. Application sent to Admin for review
5. Admin generates access code
6. User receives code and can login

### Login
- Email or username authentication
- Session persistence (stays logged in)
- Forgot password functionality
- Logout option

## Product Management

### Required Product Information
- **Product Name** - What you're selling
- **Price** - In Philippine Peso (₱)
- **Quantity** - Units available
- **Condition** - Mint, Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged
- **Category** - Pokémon, MTG, Beyblade, Firstbound, Other (custom)
- **Description** - Detailed product information
- **Images** - Multiple photo support

### Product Display
- 3-column responsive grid
- 1:1 square image aspect ratio
- Shows: Name, Price, Quantity, Condition, Seller
- Product details page with full gallery
- Image zoom functionality
- Related products section

## User Roles

### Visitor
- Browse products
- View profiles
- View analytics

### Member
- All visitor permissions
- Create listings
- Edit own listings
- Delete own listings
- Send messages
- View own profile

### Admin
- All member permissions
- Member management
- Product moderation
- Access code generation
- Website settings

## Messaging System

- Direct member-to-member messaging
- Messenger-style conversation interface
- Message timestamps
- Real-time notifications
- Message history

## Analytics Dashboard

Public dashboard showing:
- Total products listed
- Total products sold
- Recently sold products
- Weekly sales data
- Monthly sales data

## Default Admin Account

**Test the platform:**
- Email/Username: `admin`
- Password: `admin123`

## Member Test Account

- Email/Username: `johncollector`
- Password: `password123`

## How to Use

### As a Buyer
1. Browse the marketplace without logging in
2. Search or filter products
3. Click products to see full details
4. View seller profiles
5. Message sellers for inquiries

### As a Seller
1. Register on the platform
2. Wait for admin approval
3. Use provided access code to activate account
4. Create product listings
5. Upload photos and description
6. Manage your inventory
7. Mark items as sold

### As an Admin
1. Access admin dashboard
2. Review pending member requests
3. Generate and manage access codes
4. Moderate product listings
5. Ban/remove inappropriate content
6. Customize website settings and rules

## Data Storage

All data is stored in browser localStorage:
- User accounts and profiles
- Product listings
- Messages
- Access codes
- Website settings

**Note:** For production, implement a backend database (MongoDB, Firebase, PostgreSQL, etc.)

## Security Features

- Full legal names only visible to admin
- Public profiles show username/shop name only
- Session persistence
- Member verification via access codes
- Admin oversight and moderation

## Customization

### Change Logo
1. Go to Admin Panel → Settings
2. Upload custom logo image
3. Or reset to default

### Edit Rules
1. Go to Admin Panel → Settings
2. Edit community rules
3. Save changes

### Manage Categories
- Custom categories supported
- Default: Pokémon, MTG, Beyblade, Firstbound, Other
- Add new categories in product creation

## File Structure

```
Findscape/
├── index.html      # Main application markup
├── styles.css      # Complete responsive styling
├── script.js       # All functionality and data management
└── README.md       # Documentation
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Deployment

### GitHub Pages
1. Go to repository Settings
2. Select Pages
3. Choose main branch
4. Site available at: `https://veronica27ava.github.io/Findscape`

### Other Platforms
- Netlify
- Vercel
- AWS Amplify
- Any static hosting

## Future Enhancements

- [ ] Backend database integration
- [ ] Real payment processing
- [ ] Seller ratings and reviews
- [ ] Advanced search filters
- [ ] Image upload to cloud storage
- [ ] Email notifications
- [ ] Mobile app
- [ ] Wish list feature
- [ ] Product comparison
- [ ] Auction system

## Support

For issues or questions:
1. Clear browser cache: `localStorage.clear()`
2. Check browser console for errors
3. Verify JavaScript is enabled
4. Try different browser

## License

Open source - Available for community use

---

**Findscape: Where collectors unite.** 🎴
