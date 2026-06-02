// Data Storage
let users = JSON.parse(localStorage.getItem('users')) || [];
let products = JSON.parse(localStorage.getItem('products')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || [];
let accessCodes = JSON.parse(localStorage.getItem('accessCodes')) || [];
let salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let rules = localStorage.getItem('rules') || 'Welcome to Findscape! Please follow community guidelines when buying and selling collectibles.';

// Initialize
window.addEventListener('load', () => {
    loadRules();
    updateUserDisplay();
    archiveOldSoldProducts();
    navigateTo('home');
});

// Archive sold products after 30 days
function archiveOldSoldProducts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    products = products.filter(product => {
        if (product.status === 'sold' && product.dateSold) {
            const soldDate = new Date(product.dateSold);
            if (soldDate < thirtyDaysAgo) {
                // Archive to sales history
                archiveProductToHistory(product);
                return false; // Remove from active products
            }
        }
        return true;
    });

    localStorage.setItem('products', JSON.stringify(products));
}

// Archive product to sales history
function archiveProductToHistory(product) {
    const seller = users.find(u => u.id === product.sellerId);
    if (!seller) return;

    // Initialize sales history for seller if not exists
    if (!seller.salesHistory) {
        seller.salesHistory = [];
    }

    // Add product to seller's sales history
    seller.salesHistory.push({
        ...product,
        archivedAt: new Date().toISOString()
    });

    // Update user in the users array
    users = users.map(u => u.id === seller.id ? seller : u);
    localStorage.setItem('users', JSON.stringify(users));

    // Also maintain global sales history
    salesHistory.push({
        ...product,
        archivedAt: new Date().toISOString()
    });
    localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
}

// Navigation
function navigateTo(page) {
    // Close user dropdown
    document.getElementById('userDropdown').classList.remove('show');

    // Check authentication
    if (['profile', 'my-listings', 'create-listing', 'messages', 'admin-dashboard'].includes(page)) {
        if (!currentUser) {
            alert('Please login first');
            navigateTo('login');
            return;
        }
        if (page === 'admin-dashboard' && currentUser.role !== 'admin') {
            alert('Admin access only');
            return;
        }
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // Show selected page
    const pageEl = document.getElementById(page);
    if (pageEl) {
        pageEl.classList.remove('hidden');
        pageEl.classList.add('active');

        // Load page content
        if (page === 'marketplace') loadMarketplace();
        if (page === 'profile') loadProfile();
        if (page === 'my-listings') loadMyListings();
        if (page === 'messages') loadMessages();
        if (page === 'analytics') loadAnalytics();
        if (page === 'admin-dashboard') loadAdminDashboard();
        if (page === 'product-detail') loadProductDetail();
    }
}

// User Authentication
function registerMember(e) {
    e.preventDefault();

    if (!document.getElementById('acceptRules').checked) {
        alert('Please accept the community rules');
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (users.find(u => u.email === email || u.username === username)) {
        alert('Email or username already exists');
        return;
    }

    const newUser = {
        id: Date.now(),
        fullName,
        email,
        username,
        password: btoa(password), // Simple encoding (use proper hashing in production)
        role: 'pending',
        createdAt: new Date().toISOString(),
        profile: {
            bio: '',
            profilePicture: null,
            shopName: ''
        },
        salesHistory: [],
        weeklySalesData: {}
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Registration submitted! Please wait for admin approval. You will receive an access code via email.');
    navigateTo('login');
}

function loginMember(e) {
    e.preventDefault();

    const loginUsername = document.getElementById('loginUsername').value;
    const loginPassword = document.getElementById('loginPassword').value;

    const user = users.find(u => 
        (u.email === loginUsername || u.username === loginUsername) && 
        u.password === btoa(loginPassword)
    );

    if (!user) {
        alert('Invalid email/username or password');
        return;
    }

    if (user.role === 'pending') {
        alert('Your account is pending admin approval');
        return;
    }

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserDisplay();
    alert('Login successful!');
    navigateTo('home');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserDisplay();
    navigateTo('home');
}

function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    const userBtn = document.getElementById('userBtn');
    const adminLink = document.getElementById('adminLink');

    if (currentUser) {
        userDisplay.textContent = currentUser.username;
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
        }
    } else {
        userDisplay.textContent = 'Guest';
        userBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <a href="#" onclick="navigateTo(\'login\')" style="color:white;text-decoration:none;">Login</a>';
    }
}

function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}

// Load Marketplace
function loadMarketplace() {
    filterProducts();
}

function filterProducts() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sort = document.getElementById('sortFilter').value;

    let filtered = products.filter(p => 
        p.status !== 'sold' &&
        (p.name.toLowerCase().includes(search) || 
         p.description.toLowerCase().includes(search)) &&
        (!category || p.category === category)
    );

    // Sort
    switch(sort) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.datePosted) - new Date(b.datePosted));
            break;
    }

    displayProducts(filtered);
}

function displayProducts(prods) {
    const grid = document.getElementById('productsGrid');
    
    if (prods.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No products found</p>';
        return;
    }

    grid.innerHTML = prods.map(p => `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <div class="product-image">
                ${p.images.length > 0 ? `<img src="${p.images[0]}" alt="${p.name}">` : '<i class="fas fa-image"></i>'}
            </div>
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-price">₱${p.price.toFixed(2)}</div>
                <div class="product-meta">
                    <div>Qty: ${p.quantity}</div>
                    <span class="product-condition">${p.condition}</span>
                </div>
                <div class="product-seller">By: ${users.find(u => u.id === p.sellerId)?.username || 'Unknown'}</div>
            </div>
        </div>
    `).join('');
}

// Product Management
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const seller = users.find(u => u.id === product.sellerId);
    
    const detail = document.getElementById('productDetailContent');
    detail.innerHTML = `
        <div class="product-detail-wrapper">
            <div class="product-detail-grid">
                <div class="product-gallery">
                    <div class="main-image" onclick="openImageModal('${product.images[0]}')">
                        <img src="${product.images[0]}" alt="${product.name}">
                    </div>
                    ${product.images.length > 1 ? `
                        <div class="thumbnail-gallery">
                            ${product.images.map((img, i) => `
                                <div class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage('${img}')">
                                    <img src="${img}" alt="">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="product-details">
                    <div class="detail-section">
                        <h1>${product.name}</h1>
                        <div class="product-price" style="margin: 1rem 0;">₱${product.price.toFixed(2)}</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-label">Condition</div>
                        <span class="condition-badge">${product.condition}</span>
                    </div>
                    <div class="detail-section">
                        <div class="detail-label">Quantity Available</div>
                        <div class="detail-value">${product.quantity} units</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-label">Category</div>
                        <div class="detail-value">${product.category}</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-label">Posted</div>
                        <div class="detail-value">${new Date(product.datePosted).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-section">
                        <div class="seller-card" onclick="viewSellerProfile(${seller.id})">
                            <div class="seller-avatar"><i class="fas fa-user"></i></div>
                            <div class="seller-info">
                                <h3>${seller.profile?.shopName || seller.username}</h3>
                                <p>Seller since ${new Date(seller.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width: 100%;" onclick="sendMessage(${seller.id})">Message Seller</button>
                </div>
            </div>
            <div class="detail-section" style="border-top: 2px solid var(--border); padding-top: 2rem; margin-top: 2rem;">
                <h3>Description</h3>
                <div class="product-description" style="white-space: pre-wrap;">${product.description}</div>
            </div>
        </div>
    `;

    navigateTo('product-detail');
}

function changeMainImage(imgSrc) {
    document.querySelector('.main-image img').src = imgSrc;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function openImageModal(imgSrc) {
    const modal = document.getElementById('imageModal');
    document.getElementById('modalImage').src = imgSrc;
    modal.classList.add('show');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('show');
}

function zoomImage(amount) {
    const img = document.getElementById('modalImage');
    const currentScale = img.dataset.scale || 1;
    const newScale = Math.max(0.5, Math.min(3, parseFloat(currentScale) + amount));
    img.dataset.scale = newScale;
    img.style.transform = `scale(${newScale})`;
}

function resetZoom() {
    const img = document.getElementById('modalImage');
    img.dataset.scale = 1;
    img.style.transform = 'scale(1)';
}

function viewSellerProfile(sellerId) {
    const seller = users.find(u => u.id === sellerId);
    if (!seller) return;

    const profileDiv = document.getElementById('sellerProfileContent');
    const sellerProducts = products.filter(p => p.sellerId === sellerId && p.status !== 'sold');

    profileDiv.innerHTML = `
        <div class="seller-profile-wrapper">
            <div style="background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
                <div style="display: flex; gap: 2rem; align-items: center; margin-bottom: 2rem;">
                    <div class="seller-avatar" style="width: 100px; height: 100px; font-size: 3rem;"><i class="fas fa-user"></i></div>
                    <div>
                        <h1>${seller.profile?.shopName || seller.username}</h1>
                        <p>Joined ${new Date(seller.createdAt).toLocaleDateString()}</p>
                        <p>${seller.profile?.bio || 'No bio'}</p>
                        <button class="btn btn-primary" onclick="sendMessage(${seller.id})">Send Message</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 2rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${sellerProducts.length}</div>
                        <div>Products Listed</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${seller.salesHistory ? seller.salesHistory.length : 0}</div>
                        <div>Products Sold</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${sellerProducts.length}</div>
                        <div>Available</div>
                    </div>
                </div>
            </div>
            <h2 style="margin-top: 2rem; margin-bottom: 1rem;">Products by ${seller.username}</h2>
            <div class="products-grid" id="sellerProducts"></div>
        </div>
    `;

    displaySellerProducts(sellerProducts);
    navigateTo('seller-profile');
}

function displaySellerProducts(prods) {
    const grid = document.getElementById('sellerProducts');
    grid.innerHTML = prods.map(p => `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <div class="product-image">
                ${p.images.length > 0 ? `<img src="${p.images[0]}" alt="${p.name}">` : '<i class="fas fa-image"></i>'}
            </div>
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-price">₱${p.price.toFixed(2)}</div>
                <div class="product-meta">
                    <div>Qty: ${p.quantity}</div>
                    <span class="product-condition">${p.condition}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Profile
function loadProfile() {
    if (!currentUser) return;

    const profileContent = document.getElementById('profileContent');
    const userProducts = products.filter(p => p.sellerId === currentUser.id);
    const soldProducts = currentUser.salesHistory || [];
    const totalSalesAmount = soldProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    profileContent.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
            <div style="display: flex; gap: 2rem; align-items: center; margin-bottom: 2rem;">
                <div class="seller-avatar" style="width: 100px; height: 100px; font-size: 3rem;"><i class="fas fa-user"></i></div>
                <div style="flex: 1;">
                    <h1>${currentUser.profile?.shopName || currentUser.username}</h1>
                    <p><strong>Username:</strong> ${currentUser.username}</p>
                    <p><strong>Email:</strong> ${currentUser.email}</p>
                    <p><strong>Joined:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
                    <p><strong>Bio:</strong> ${currentUser.profile?.bio || 'No bio yet'}</p>
                    <button class="btn btn-primary" onclick="editProfile()" style="margin-top: 1rem;">Edit Profile</button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2rem;">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${userProducts.length}</div>
                    <div>Products Listed</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${soldProducts.length}</div>
                    <div>Products Sold</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${userProducts.filter(p => p.status !== 'sold').length}</div>
                    <div>Available</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">₱${totalSalesAmount.toFixed(2)}</div>
                    <div>Total Sales</div>
                </div>
            </div>
        </div>
    `;
}

function editProfile() {
    const newBio = prompt('Enter your bio:', currentUser.profile?.bio || '');
    if (newBio !== null) {
        currentUser.profile.bio = newBio;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        users = users.map(u => u.id === currentUser.id ? currentUser : u);
        localStorage.setItem('users', JSON.stringify(users));
        loadProfile();
        alert('Profile updated!');
    }
}

// My Listings
function loadMyListings() {
    if (!currentUser) return;

    const userProducts = products.filter(p => p.sellerId === currentUser.id);
    const content = document.getElementById('myListingsContent');

    if (userProducts.length === 0) {
        content.innerHTML = '<p>No listings yet. <a href="#" onclick="navigateTo(\'create-listing\')">Create one</a></p>';
        return;
    }

    content.innerHTML = `
        <div style="display: grid; gap: 1rem; margin-top: 2rem;">
            ${userProducts.map(p => `
                <div style="background: white; padding: 1.5rem; border-radius: 8px; display: flex; gap: 2rem;">
                    <div style="width: 150px; height: 150px; flex-shrink: 0;">
                        <img src="${p.images[0]}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px;">
                    </div>
                    <div style="flex: 1;">
                        <h3>${p.name}</h3>
                        <p><strong>Price:</strong> ₱${p.price.toFixed(2)}</p>
                        <p><strong>Quantity:</strong> ${p.quantity}</p>
                        <p><strong>Condition:</strong> ${p.condition}</p>
                        <p><strong>Status:</strong> ${p.status}</p>
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="editListing(${p.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteListing(${p.id})">Delete</button>
                            ${p.status !== 'sold' ? `<button class="btn btn-success" onclick="markSold(${p.id})">Mark as Sold</button>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function previewImages(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = 'preview-img';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function saveListing(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const condition = document.getElementById('productCondition').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;
    const imageInputs = document.getElementById('productImages').files;

    // Convert images to base64
    const images = [];
    Array.from(imageInputs).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            images.push(e.target.result);
        };
        reader.readAsDataURL(file);
    });

    setTimeout(() => {
        const listing = {
            id: Date.now(),
            sellerId: currentUser.id,
            name,
            price,
            quantity,
            condition,
            category,
            description,
            images: images.length > 0 ? images : ['data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22100%22 height=%22100%22%3E%3C/rect%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'],
            status: 'available',
            datePosted: new Date().toISOString(),
            dateSold: null
        };

        products.push(listing);
        localStorage.setItem('products', JSON.stringify(products));

        alert('Listing created!');
        document.getElementById('listingForm').reset();
        navigateTo('my-listings');
    }, 500);
}

function editListing(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    navigateTo('create-listing');
    document.getElementById('listingFormTitle').textContent = 'Edit Listing';
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productCondition').value = product.condition;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description;

    const form = document.getElementById('listingForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        product.name = document.getElementById('productName').value;
        product.price = parseFloat(document.getElementById('productPrice').value);
        product.quantity = parseInt(document.getElementById('productQuantity').value);
        product.condition = document.getElementById('productCondition').value;
        product.category = document.getElementById('productCategory').value;
        product.description = document.getElementById('productDescription').value;

        localStorage.setItem('products', JSON.stringify(products));
        alert('Listing updated!');
        form.onsubmit = saveListing;
        navigateTo('my-listings');
    };
}

function deleteListing(productId) {
    if (confirm('Delete this listing?')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        loadMyListings();
        alert('Listing deleted!');
    }
}

function markSold(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.status = 'sold';
        product.dateSold = new Date().toISOString();
        localStorage.setItem('products', JSON.stringify(products));
        
        // Update weekly sales data
        updateWeeklySalesData(product);
        
        loadMyListings();
        alert('Listing marked as sold!');
    }
}

// Update weekly sales data for seller
function updateWeeklySalesData(product) {
    let seller = users.find(u => u.id === product.sellerId);
    if (!seller) return;

    if (!seller.weeklySalesData) {
        seller.weeklySalesData = {};
    }

    const date = new Date(product.dateSold);
    const weekStart = getWeekStartDate(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!seller.weeklySalesData[weekKey]) {
        seller.weeklySalesData[weekKey] = {
            weekStart: weekKey,
            totalItems: 0,
            totalRevenue: 0,
            products: []
        };
    }

    seller.weeklySalesData[weekKey].totalItems += product.quantity;
    seller.weeklySalesData[weekKey].totalRevenue += product.price * product.quantity;
    seller.weeklySalesData[weekKey].products.push({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        dateSold: product.dateSold
    });

    users = users.map(u => u.id === seller.id ? seller : u);
    localStorage.setItem('users', JSON.stringify(users));

    // Update currentUser if it's the same user
    if (currentUser && currentUser.id === seller.id) {
        currentUser = seller;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Get the start of the week (Monday)
function getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Messages
function sendMessage(recipientId) {
    if (!currentUser) {
        alert('Please login to send messages');
        navigateTo('login');
        return;
    }

    const message = prompt('Enter your message:');
    if (!message) return;

    const newMessage = {
        id: Date.now(),
        senderId: currentUser.id,
        recipientId: recipientId,
        content: message,
        timestamp: new Date().toISOString(),
        read: false
    };

    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    alert('Message sent!');
}

function loadMessages() {
    if (!currentUser) return;

    const userMessages = messages.filter(m => m.senderId === currentUser.id || m.recipientId === currentUser.id);
    const list = document.getElementById('messagesList');
    const thread = document.getElementById('messageThread');

    const conversations = {};
    userMessages.forEach(m => {
        const otherUserId = m.senderId === currentUser.id ? m.recipientId : m.senderId;
        if (!conversations[otherUserId]) {
            conversations[otherUserId] = [];
        }
        conversations[otherUserId].push(m);
    });

    list.innerHTML = Object.keys(conversations).map(userId => {
        const user = users.find(u => u.id == userId);
        return `
            <div style="padding: 1rem; cursor: pointer; border-bottom: 1px solid var(--border);" onclick="viewConversation(${userId})">
                <h4>${user?.username}</h4>
                <p style="font-size: 0.9rem; color: var(--text);">${conversations[userId][0]?.content.substring(0, 50)}...</p>
            </div>
        `;
    }).join('');
}

function viewConversation(userId) {
    const userMessages = messages.filter(m => 
        (m.senderId === currentUser.id && m.recipientId === userId) ||
        (m.senderId === userId && m.recipientId === currentUser.id)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const thread = document.getElementById('messageThread');
    const user = users.find(u => u.id == userId);

    thread.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 1.5rem;">
            <h3>${user?.username}</h3>
            <div style="max-height: 400px; overflow-y: auto; margin: 1rem 0; border: 1px solid var(--border); padding: 1rem; border-radius: 5px;">
                ${userMessages.map(m => `
                    <div style="margin-bottom: 1rem; ${m.senderId === currentUser.id ? 'text-align: right;' : ''}">
                        <div style="display: inline-block; background: ${m.senderId === currentUser.id ? 'var(--primary)' : 'var(--light)'}; color: ${m.senderId === currentUser.id ? 'white' : 'var(--text)'}; padding: 0.75rem 1rem; border-radius: 8px; max-width: 70%;">
                            ${m.content}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text); margin-top: 0.25rem;">${new Date(m.timestamp).toLocaleTimeString()}</div>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="messageInput" placeholder="Type message..." style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 5px;">
                <button class="btn btn-primary" onclick="sendDirectMessage(${userId})">Send</button>
            </div>
        </div>
    `;
}

function sendDirectMessage(recipientId) {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return;

    const newMessage = {
        id: Date.now(),
        senderId: currentUser.id,
        recipientId: recipientId,
        content: content,
        timestamp: new Date().toISOString(),
        read: false
    };

    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    input.value = '';
    viewConversation(recipientId);
}

// Analytics
function loadAnalytics() {
    const totalListed = products.filter(p => p.status === 'available').length;
    const totalSold = currentUser ? (currentUser.salesHistory ? currentUser.salesHistory.length : 0) : 0;
    const recentlySold = currentUser && currentUser.salesHistory ? 
        currentUser.salesHistory.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt)).slice(0, 5) : [];

    document.getElementById('totalListed').textContent = totalListed;
    document.getElementById('totalSold').textContent = totalSold;
    
    const recentlyDiv = document.getElementById('recentlySold');
    recentlyDiv.innerHTML = recentlySold.map(p => `
        <div style="padding: 0.5rem; border-bottom: 1px solid var(--border);">
            <p><strong>${p.name}</strong></p>
            <p style="font-size: 0.9rem;">₱${p.price.toFixed(2)}</p>
            <p style="font-size: 0.8rem; color: var(--text);">${new Date(p.dateSold).toLocaleDateString()}</p>
        </div>
    `).join('');

    // Display weekly sales analytics
    displayWeeklySalesAnalytics();
}

// Display weekly sales analytics
function displayWeeklySalesAnalytics() {
    if (!currentUser || !currentUser.weeklySalesData) {
        document.getElementById('weeklySalesContainer').innerHTML = '<p>No sales data yet</p>';
        return;
    }

    const weeks = Object.values(currentUser.weeklySalesData).sort((a, b) => 
        new Date(b.weekStart) - new Date(a.weekStart)
    );

    const analyticsHtml = `
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid var(--border);">
            <h2 style="margin-bottom: 1.5rem;">Weekly Sales Analysis</h2>
            <div style="display: grid; gap: 1.5rem;">
                ${weeks.map(week => `
                    <div style="background: white; padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text); text-transform: uppercase; margin-bottom: 0.5rem;">Week of ${new Date(week.weekStart).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text); text-transform: uppercase; margin-bottom: 0.5rem;">Items Sold</div>
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">${week.totalItems}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text); text-transform: uppercase; margin-bottom: 0.5rem;">Revenue</div>
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">₱${week.totalRevenue.toFixed(2)}</div>
                            </div>
                        </div>
                        <div style="background: var(--light); padding: 1rem; border-radius: 5px;">
                            <h4 style="margin-bottom: 0.5rem;">Products Sold:</h4>
                            <ul style="list-style: none; padding: 0;">
                                ${week.products.map(p => `
                                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem;">
                                        <strong>${p.name}</strong> - ${p.quantity} unit(s) × ₱${p.price.toFixed(2)} = ₱${(p.quantity * p.price).toFixed(2)}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('weeklySalesContainer').innerHTML = analyticsHtml;
}

// Admin Functions
function loadAdminDashboard() {
    switchAdminTab('members');
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.add('hidden'));

    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.remove('hidden');

    if (tab === 'members') loadAdminMembers();
    if (tab === 'products') loadAdminProducts();
    if (tab === 'access-codes') loadAccessCodes();
    if (tab === 'settings') loadAdminSettings();
}

function loadAdminMembers() {
    const pending = users.filter(u => u.role === 'pending');
    const active = users.filter(u => u.role !== 'pending' && u.role !== 'admin');

    document.getElementById('pendingMembers').innerHTML = pending.map(u => `
        <div class="member-card">
            <h4>${u.username}</h4>
            <p><strong>Email:</strong> ${u.email}</p>
            <p><strong>Full Name:</strong> ${u.fullName}</p>
            <div class="member-actions">
                <button class="btn btn-success" onclick="approveMember(${u.id})">Approve</button>
                <button class="btn btn-danger" onclick="rejectMember(${u.id})">Reject</button>
            </div>
        </div>
    `).join('');

    document.getElementById('activeMembers').innerHTML = active.map(u => `
        <div class="member-card">
            <h4>${u.username}</h4>
            <p><strong>Email:</strong> ${u.email}</p>
            <p><strong>Joined:</strong> ${new Date(u.createdAt).toLocaleDateString()}</p>
            <p><strong>Products Sold:</strong> ${u.salesHistory ? u.salesHistory.length : 0}</p>
            <div class="member-actions">
                <button class="btn btn-danger" onclick="banMember(${u.id})">Ban</button>
                <button class="btn btn-danger" onclick="kickMember(${u.id})">Kick</button>
            </div>
        </div>
    `).join('');
}

function approveMember(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.role = 'member';
        user.salesHistory = [];
        user.weeklySalesData = {};
        localStorage.setItem('users', JSON.stringify(users));
        alert('Member approved!');
        loadAdminMembers();
    }
}

function rejectMember(userId) {
    if (confirm('Reject this registration?')) {
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        alert('Member rejected!');
        loadAdminMembers();
    }
}

function banMember(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.role = 'banned';
        localStorage.setItem('users', JSON.stringify(users));
        alert('Member banned!');
        loadAdminMembers();
    }
}

function kickMember(userId) {
    if (confirm('Kick this member?')) {
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        alert('Member kicked!');
        loadAdminMembers();
    }
}

function loadAdminProducts() {
    const allProducts = products;
    document.getElementById('allProducts').innerHTML = allProducts.map(p => `
        <div class="member-card">
            <h4>${p.name}</h4>
            <p><strong>Seller:</strong> ${users.find(u => u.id === p.sellerId)?.username}</p>
            <p><strong>Price:</strong> ₱${p.price.toFixed(2)}</p>
            <p><strong>Status:</strong> ${p.status}</p>
            <div class="member-actions">
                <button class="btn btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
                <button class="btn btn-danger" onclick="banProduct(${p.id})">Ban</button>
            </div>
        </div>
    `).join('');
}

function deleteProduct(productId) {
    const reason = prompt('Reason for deletion:');
    if (reason !== null) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        alert('Product deleted!');
        loadAdminProducts();
    }
}

function banProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.status = 'banned';
        localStorage.setItem('products', JSON.stringify(products));
        alert('Product banned!');
        loadAdminProducts();
    }
}

function generateAccessCode() {
    const code = 'FC' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const accessCode = {
        id: Date.now(),
        code: code,
        used: false,
        createdAt: new Date().toISOString(),
        usedAt: null,
        usedBy: null
    };

    accessCodes.push(accessCode);
    localStorage.setItem('accessCodes', JSON.stringify(accessCodes));
    alert('Access code generated: ' + code);
    loadAccessCodes();
}

function loadAccessCodes() {
    document.getElementById('accessCodesList').innerHTML = `
        <div style="display: grid; gap: 1rem; margin-top: 2rem;">
            ${accessCodes.map(code => `
                <div style="background: white; padding: 1rem; border-radius: 5px; border-left: 4px solid ${code.used ? 'var(--danger)' : 'var(--success)'};">
                    <p><strong>Code:</strong> ${code.code}</p>
                    <p><strong>Status:</strong> ${code.used ? 'Used' : 'Available'}</p>
                    ${code.used ? `<p><strong>Used by:</strong> ${code.usedBy}</p>` : ''}
                    <button class="btn btn-danger" onclick="deleteAccessCode(${code.id})">Delete</button>
                </div>
            `).join('')}
        </div>
    `;
}

function deleteAccessCode(codeId) {
    accessCodes = accessCodes.filter(c => c.id !== codeId);
    localStorage.setItem('accessCodes', JSON.stringify(accessCodes));
    loadAccessCodes();
}

function loadAdminSettings() {
    document.getElementById('rulesEdit').value = rules;
}

function uploadLogo(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const logo = event.target.result;
        localStorage.setItem('siteLogo', logo);
        document.getElementById('siteLogo').src = logo;
        alert('Logo updated!');
    };
    reader.readAsDataURL(file);
}

function resetLogo() {
    localStorage.removeItem('siteLogo');
    document.getElementById('siteLogo').src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%234f46e5%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22 font-weight=%22bold%22%3EFS%3C/text%3E%3C/svg%3E';
    alert('Logo reset!');
}

function saveRules() {
    rules = document.getElementById('rulesEdit').value;
    localStorage.setItem('rules', rules);
    alert('Rules updated!');
}

function loadRules() {
    const rulesContent = document.getElementById('rulesContent');
    if (rulesContent) {
        rulesContent.innerHTML = `<p>${rules}</p>`;
    }
}

// Load saved logo
window.addEventListener('load', () => {
    const savedLogo = localStorage.getItem('siteLogo');
    if (savedLogo) {
        document.getElementById('siteLogo').src = savedLogo;
    }
});

// Create sample data for testing
function createSampleData() {
    if (products.length === 0) {
        const sampleProducts = [
            {
                id: 1,
                sellerId: 2,
                name: 'Charizard Base Set Holo',
                price: 500,
                quantity: 1,
                condition: 'Near Mint',
                category: 'Pokemon',
                description: 'Classic Charizard from Base Set 1. In Near Mint condition.',
                images: ['data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 280%22%3E%3Crect fill=%22%23FF6B6B%22 width=%22200%22 height=%22280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22 font-weight=%22bold%22%3EPokemon%3C/text%3E%3C/svg%3E'],
                status: 'available',
                datePosted: new Date().toISOString(),
                dateSold: null
            },
            {
                id: 2,
                sellerId: 2,
                name: 'Blue Eyes White Dragon',
                price: 750,
                quantity: 1,
                condition: 'Mint',
                category: 'Other',
                description: 'Rare Blue Eyes White Dragon. Perfect condition.',
                images: ['data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 280%22%3E%3Crect fill=%224169E1%22 width=%22200%22 height=%22280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22 font-weight=%22bold%22%3ECard%3C/text%3E%3C/svg%3E'],
                status: 'available',
                datePosted: new Date().toISOString(),
                dateSold: null
            }
        ];
        const sampleUsers = [
            {
                id: 1,
                fullName: 'Admin User',
                email: 'admin@findscape.com',
                username: 'admin',
                password: btoa('admin123'),
                role: 'admin',
                createdAt: new Date().toISOString(),
                profile: { bio: 'System Administrator', profilePicture: null, shopName: 'Admin' },
                salesHistory: [],
                weeklySalesData: {}
            },
            {
                id: 2,
                fullName: 'John Collector',
                email: 'john@example.com',
                username: 'johncollector',
                password: btoa('password123'),
                role: 'member',
                createdAt: new Date().toISOString(),
                profile: { bio: 'Avid trading card collector', profilePicture: null, shopName: 'John\'s Cards' },
                salesHistory: [],
                weeklySalesData: {}
            }
        ];
        users = sampleUsers;
        products = sampleProducts;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('products', JSON.stringify(products));
    }
}

createSampleData();

// Logo click to go home
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.logo-section').addEventListener('click', () => navigateTo('home'));
});
