// ============================================
// PRODUCT STORE - JAVASCRIPT APPLICATION
// ============================================

// Admin credentials (you can change this)
const ADMIN_PASSWORD = "admin123";

// Application State
let appState = {
    isAdmin: false,
    currentPage: "shop",
    cart: [],
    products: [],
    orders: [],
};

// Product Description Page Variables
let selectedProductId = null;
let descriptionQty = 1;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
    attachEventListeners();
    loadDataFromLocalStorage();
    renderShopPage();
});

function initializeApp() {
    // Load initial products if none exist
    if (!localStorage.getItem("products")) {
        const initialProducts = [
            {
                id: 1,
                name: "Wireless Headphones",
                price: 79.99,
                category: "Electronics",
                description: "High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.",
                image: "https://via.placeholder.com/300x300?text=Wireless+Headphones",
                images: [
                    "https://via.placeholder.com/400x400?text=Wireless+Headphones+1",
                    "https://via.placeholder.com/400x400?text=Wireless+Headphones+2",
                    "https://via.placeholder.com/400x400?text=Wireless+Headphones+3"
                ],
                stock: 50,
                createdAt: new Date().toISOString(),
            },
            {
                id: 2,
                name: "USB-C Cable",
                price: 12.99,
                category: "Accessories",
                description: "Durable USB-C charging cable, 2 meters long. Fast charging and data transfer support.",
                image: "https://via.placeholder.com/300x300?text=USB-C+Cable",
                images: [
                    "https://via.placeholder.com/400x400?text=USB-C+Cable+1",
                    "https://via.placeholder.com/400x400?text=USB-C+Cable+2",
                    "https://via.placeholder.com/400x400?text=USB-C+Cable+3"
                ],
                stock: 150,
                createdAt: new Date().toISOString(),
            },
            {
                id: 3,
                name: "Phone Case",
                price: 24.99,
                category: "Accessories",
                description: "Protective phone case with premium design and durable material. Provides excellent protection.",
                image: "https://via.placeholder.com/300x300?text=Phone+Case",
                images: [
                    "https://via.placeholder.com/400x400?text=Phone+Case+1",
                    "https://via.placeholder.com/400x400?text=Phone+Case+2",
                    "https://via.placeholder.com/400x400?text=Phone+Case+3"
                ],
                stock: 200,
                createdAt: new Date().toISOString(),
            },
        ];
        localStorage.setItem("products", JSON.stringify(initialProducts));
    }

    // Initialize admin mode
    const isAdminMode = localStorage.getItem("adminMode");
    if (isAdminMode === "true") {
        appState.isAdmin = true;
        enableAdminMode();
    }
}

function attachEventListeners() {
    // Navigation buttons
    document.getElementById("shopBtn").addEventListener("click", () => goToPage("shop"));
    document.getElementById("ordersBtn").addEventListener("click", () => goToPage("orders"));
    document.getElementById("customBtn").addEventListener("click", () => goToPage("custom"));
    document.getElementById("cartBtn").addEventListener("click", () => toggleCartDrawer());

    // Admin toggle
    document.getElementById("adminToggle").addEventListener("click", toggleAdminMode);

    // Shop page
    document.getElementById("searchProduct").addEventListener("input", handleSearch);
    document.getElementById("sortBy").addEventListener("change", handleSort);

    // Product form
    document.getElementById("productForm").addEventListener("submit", handleAddProduct);

    // Admin controls
    document.getElementById("exportData").addEventListener("click", exportToGoogleSheets);
    document.getElementById("clearAllData").addEventListener("click", clearAllData);

    // Payment method change
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener("change", handlePaymentMethodChange);
    });

    // Checkout form
    document.getElementById("checkoutForm").addEventListener("submit", handleCheckoutSubmit);
}

// ============================================
// PAGE NAVIGATION
// ============================================

function goToPage(pageName) {
    // Hide all pages
    document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));

    // Update active button
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

    // Show selected page
    const pageMap = {
        shop: "shopPage",
        orders: "ordersPage",
        custom: "customPage",
        "product-description": "productDescriptionPage",
        checkout: "checkoutPage",
    };

    const pageId = pageMap[pageName];
    if (pageId) {
        document.getElementById(pageId).classList.add("active");
    }

    // Update active button
    const buttonMap = {
        shop: "shopBtn",
        orders: "ordersBtn",
        custom: "customBtn",
    };

    const buttonId = buttonMap[pageName];
    if (buttonId) {
        document.getElementById(buttonId).classList.add("active");
    }

    appState.currentPage = pageName;

    // Render page content
    if (pageName === "shop") {
        renderShopPage();
    } else if (pageName === "orders") {
        renderOrdersPage();
    } else if (pageName === "custom") {
        renderCustomPage();
    } else if (pageName === "checkout") {
        renderCheckoutPage();
    }
}

// ============================================
// PRODUCT DESCRIPTION PAGE
// ============================================

function openProductDetail(productId) {
    selectedProductId = productId;
    const product = appState.products.find(p => p.id === productId);

    if (!product) return;

    // Get images array, fallback to single image if not available
    const images = product.images && product.images.length > 0
        ? product.images
        : [product.image, product.image, product.image];

    // Set main image
    document.getElementById("mainProductImage").src = images[0];
    document.getElementById("imageBadge").textContent = "1/3";

    // Set thumbnail images
    document.getElementById("thumb1").src = images[0];
    document.getElementById("thumb2").src = images[1] || product.image;
    document.getElementById("thumb3").src = images[2] || product.image;

    // Update all thumbnails to not active
    document.querySelectorAll(".thumbnail-image").forEach(img => img.classList.remove("active"));
    document.getElementById("thumb1").classList.add("active");

    // Set product details
    document.getElementById("descProductName").textContent = product.name;
    document.getElementById("descProductPrice").textContent = "$" + product.price.toFixed(2);
    document.getElementById("descOriginalPrice").textContent = "$" + (product.price * 1.25).toFixed(2);
    document.getElementById("descProductDescription").textContent = product.description;
    document.getElementById("descProductCategory").textContent = product.category;
    document.getElementById("descProductStock").textContent = `Stock: ${product.stock}`;

    // Update stock progress bar
    const maxStock = 100;
    const stockPercentage = (product.stock / maxStock) * 100;
    document.getElementById("stockProgress").style.width = stockPercentage + "%";

    // Reset quantity
    document.getElementById("quantityInputDesc").value = 1;
    document.getElementById("quantityInputDesc").max = product.stock;
    descriptionQty = 1;

    // Update quantity notice
    if (product.stock < 10) {
        document.getElementById("qtyNotice").textContent = "⚠️ Limited stock available!";
        document.getElementById("qtyNotice").style.color = "#e74c3c";
    } else {
        document.getElementById("qtyNotice").textContent = "✓ In stock";
        document.getElementById("qtyNotice").style.color = "#27ae60";
    }

    // Navigate to product description page
    goToPage("product-description");
}

function changeMainImage(imageIndex) {
    const product = appState.products.find(p => p.id === selectedProductId);
    if (!product) return;

    const images = product.images && product.images.length > 0
        ? product.images
        : [product.image, product.image, product.image];

    const mainImage = document.getElementById("mainProductImage");
    mainImage.src = images[imageIndex - 1];
    document.getElementById("imageBadge").textContent = imageIndex + "/3";

    // Update active thumbnail
    document.querySelectorAll(".thumbnail-image").forEach(img => img.classList.remove("active"));
    document.getElementById(`thumb${imageIndex}`).classList.add("active");
}

function increaseQuantityDesc() {
    const input = document.getElementById("quantityInputDesc");
    const maxQty = parseInt(input.max);
    if (parseInt(input.value) < maxQty) {
        input.value = parseInt(input.value) + 1;
        descriptionQty = parseInt(input.value);
    }
}

function decreaseQuantityDesc() {
    const input = document.getElementById("quantityInputDesc");
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        descriptionQty = parseInt(input.value);
    }
}

function addToCartFromDescription() {
    const product = appState.products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(document.getElementById("quantityInputDesc").value);

    // Check if product already in cart
    const existingItem = appState.cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        appState.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: qty
        });
    }

    localStorage.setItem("cart", JSON.stringify(appState.cart));
    updateCartCount();
    showNotification(`${qty}x ${product.name} added to cart!`, "success");
    updateCartDrawer();
}

function goToCheckout() {
    const product = appState.products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Clear cart and add only this product
    appState.cart = [{
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: parseInt(document.getElementById("quantityInputDesc").value)
    }];

    localStorage.setItem("cart", JSON.stringify(appState.cart));
    updateCartCount();

    // Navigate to checkout
    goToPage("checkout");
    renderCheckoutPage();
}

// ============================================
// ADMIN MODE
// ============================================

function toggleAdminMode() {
    if (!appState.isAdmin) {
        // Prompt for password
        const password = prompt("Enter admin password:");
        if (password === ADMIN_PASSWORD) {
            appState.isAdmin = true;
            localStorage.setItem("adminMode", "true");
            enableAdminMode();
            showNotification("Admin mode enabled!", "success");
        } else {
            showNotification("Incorrect password!", "error");
        }
    } else {
        appState.isAdmin = false;
        localStorage.setItem("adminMode", "false");
        disableAdminMode();
        goToPage("shop");
        showNotification("Admin mode disabled!", "warning");
    }
}

function enableAdminMode() {
    appState.isAdmin = true;
    document.getElementById("customBtn").style.display = "flex";
    document.getElementById("adminToggle").classList.add("active");
    document.getElementById("adminToggle").innerHTML = '<i class="fas fa-lock-open"></i> <span>Admin (ON)</span>';
}

function disableAdminMode() {
    appState.isAdmin = false;
    document.getElementById("customBtn").style.display = "none";
    document.getElementById("adminToggle").classList.remove("active");
    document.getElementById("adminToggle").innerHTML = '<i class="fas fa-lock"></i> <span>Admin</span>';
}

// ============================================
// SHOP PAGE
// ============================================

function renderShopPage() {
    loadDataFromLocalStorage();
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = "";

    if (appState.products.length === 0) {
        productGrid.innerHTML = '<div class="empty-message">No products available yet.</div>';
        return;
    }

    appState.products.forEach((product) => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });

    updateCartCount();
}

function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300?text=${product.name.replace(/ /g, '+')}'" />
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-description">${product.description.substring(0, 60)}...</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-stock ${product.stock < 20 ? "low" : ""}">
                Stock: ${product.stock}
            </div>
            <div class="product-actions">
                <button class="btn btn-primary" onclick="openProductDetail(${product.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-primary" onclick="quickAddToCart(${product.id})" ${product.stock === 0 ? "disabled" : ""}>
                    <i class="fas fa-shopping-cart"></i> Add
                </button>
            </div>
        </div>
    `;
    return card;
}

function quickAddToCart(productId) {
    const product = appState.products.find((p) => p.id === productId);
    if (!product || product.stock === 0) {
        showNotification("Product out of stock!", "error");
        return;
    }

    const existingItem = appState.cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        appState.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(appState.cart));
    updateCartCount();
    showNotification(`${product.name} added to cart!`, "success");
    updateCartDrawer();
}

function handleSearch() {
    const searchTerm = document.getElementById("searchProduct").value.toLowerCase();
    loadDataFromLocalStorage();

    const filtered = appState.products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
    );

    appState.products = filtered;
    renderShopPage();
}

function handleSort() {
    const sortType = document.getElementById("sortBy").value;
    loadDataFromLocalStorage();

    switch (sortType) {
        case "name":
            appState.products.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "price-low":
            appState.products.sort((a, b) => a.price - b.price);
            break;
        case "price-high":
            appState.products.sort((a, b) => b.price - a.price);
            break;
    }

    renderShopPage();
}

// ============================================
// CART FUNCTIONS
// ============================================

function updateCartCount() {
    loadDataFromLocalStorage();
    const cartCount = appState.cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById("cartCount").textContent = cartCount;
}

function toggleCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    drawer.classList.toggle("open");
    if (drawer.classList.contains("open")) {
        updateCartDrawer();
    }
}

function updateCartDrawer() {
    loadDataFromLocalStorage();
    const cartItemsList = document.getElementById("cartItems");
    cartItemsList.innerHTML = "";

    if (appState.cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>';
        document.getElementById("cartTotal").textContent = "$0.00";
        return;
    }

    let cartTotal = 0;

    appState.cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        cartTotal += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="decreaseCartQty(${index})">−</button>
                <span>${item.quantity}</span>
                <button onclick="increaseCartQty(${index})">+</button>
            </div>
            <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItemsList.appendChild(cartItem);
    });

    document.getElementById("cartTotal").textContent = "$" + cartTotal.toFixed(2);
}

function increaseCartQty(index) {
    if (appState.cart[index]) {
        appState.cart[index].quantity += 1;
        localStorage.setItem("cart", JSON.stringify(appState.cart));
        updateCartCount();
        updateCartDrawer();
    }
}

function decreaseCartQty(index) {
    if (appState.cart[index] && appState.cart[index].quantity > 1) {
        appState.cart[index].quantity -= 1;
        localStorage.setItem("cart", JSON.stringify(appState.cart));
        updateCartCount();
        updateCartDrawer();
    }
}

function removeFromCart(index) {
    appState.cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(appState.cart));
    updateCartCount();
    updateCartDrawer();
    showNotification("Item removed from cart", "success");
}

function proceedToCheckout() {
    if (appState.cart.length === 0) {
        showNotification("Cart is empty!", "error");
        return;
    }
    document.getElementById("cartDrawer").classList.remove("open");
    goToPage("checkout");
    renderCheckoutPage();
}

// ============================================
// CHECKOUT PAGE
// ============================================

function renderCheckoutPage() {
    loadDataFromLocalStorage();

    if (appState.cart.length === 0) {
        goToPage("shop");
        showNotification("Your cart is empty!", "error");
        return;
    }

    const checkoutItems = document.getElementById("checkoutItems");
    checkoutItems.innerHTML = "";

    let subtotal = 0;

    appState.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const itemDiv = document.createElement("div");
        itemDiv.className = "checkout-item";
        itemDiv.innerHTML = `
            <span>${item.name}</span>
            <span>x${item.quantity}</span>
            <span>$${itemTotal.toFixed(2)}</span>
        `;
        checkoutItems.appendChild(itemDiv);
    });

    const shipping = subtotal > 50 ? 0 : 5;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    document.getElementById("subtotal").textContent = "$" + subtotal.toFixed(2);
    document.getElementById("shipping").textContent = shipping === 0 ? "FREE" : "$" + shipping.toFixed(2);
    document.getElementById("tax").textContent = "$" + tax.toFixed(2);
    document.getElementById("totalAmount").textContent = "$" + total.toFixed(2);

    // Store total in sessionStorage for checkout
    sessionStorage.setItem("checkoutTotal", total.toFixed(2));
}

function handlePaymentMethodChange(e) {
    const method = e.target.value;
    document.getElementById("cardDetails").style.display = method === "card" ? "block" : "none";
    document.getElementById("paypalDetails").style.display = method === "paypal" ? "block" : "none";
    document.getElementById("upiDetails").style.display = method === "upi" ? "block" : "none";
}

function handleCheckoutSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const country = document.getElementById("country").value;
    const address = document.getElementById("address").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const zip = document.getElementById("zip").value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const termsAccepted = document.getElementById("terms").checked;

    if (!fullName || !email || !phone || !country || !address || !city || !state || !zip) {
        showNotification("Please fill all shipping fields!", "error");
        return;
    }

    if (!termsAccepted) {
        showNotification("Please accept the Terms & Conditions!", "error");
        return;
    }

    // Validate payment method details
    if (paymentMethod === "card") {
        const cardName = document.getElementById("cardName").value;
        const cardNumber = document.getElementById("cardNumber").value;
        const expiry = document.getElementById("expiry").value;
        const cvv = document.getElementById("cvv").value;

        if (!cardName || !cardNumber || !expiry || !cvv) {
            showNotification("Please fill all card details!", "error");
            return;
        }
    } else if (paymentMethod === "upi") {
        const upiId = document.getElementById("upiId").value;
        if (!upiId) {
            showNotification("Please enter UPI ID!", "error");
            return;
        }
    }

    // Create order
    placeOrder({
        fullName,
        email,
        phone,
        country,
        address,
        city,
        state,
        zip,
        paymentMethod
    });
}

function placeOrder(customerInfo) {
    loadDataFromLocalStorage();

    if (appState.cart.length === 0) {
        showNotification("Cart is empty!", "error");
        return;
    }

    const total = parseFloat(sessionStorage.getItem("checkoutTotal")) || 0;

    const order = {
        id: "ORD-" + Date.now(),
        items: [...appState.cart],
        total: total,
        status: "pending",
        date: new Date().toISOString(),
        customer: customerInfo
    };

    appState.orders.push(order);
    localStorage.setItem("orders", JSON.stringify(appState.orders));

    // Update product stock
    appState.cart.forEach(cartItem => {
        const product = appState.products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.quantity;
        }
    });
    localStorage.setItem("products", JSON.stringify(appState.products));

    // Clear cart
    appState.cart = [];
    localStorage.setItem("cart", JSON.stringify(appState.cart));

    showNotification("Order placed successfully! 🎉", "success");
    updateCartCount();

    // Reset checkout form
    document.getElementById("checkoutForm").reset();

    // Navigate to orders page
    setTimeout(() => {
        goToPage("orders");
    }, 1500);
}

// ============================================
// ORDERS PAGE
// ============================================

function renderOrdersPage() {
    loadDataFromLocalStorage();
    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML = "";

    if (appState.orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-message">No orders yet. Start shopping!</div>';
        return;
    }

    appState.orders.forEach((order) => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card";

    const itemsList = order.items
        .map((item) => `<div class="order-item"><span>${item.name} x${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>`)
        .join("");

    const customerInfo = order.customer ? `
        <div class="order-customer-info">
            <strong>Shipped to:</strong> ${order.customer.fullName}, ${order.customer.city}, ${order.customer.country}
        </div>
    ` : "";

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">Order #${order.id}</div>
            <div class="order-status ${order.status}">${order.status.toUpperCase()}</div>
        </div>
        ${customerInfo}
        <div class="order-items">${itemsList}</div>
        <div class="order-total">Total: $${order.total.toFixed(2)}</div>
        <div class="order-date">Date: ${new Date(order.date).toLocaleDateString()}</div>
    `;
    return card;
}

// ============================================
// CUSTOM PRODUCT PAGE (ADMIN ONLY)
// ============================================

function renderCustomPage() {
    if (!appState.isAdmin) {
        goToPage("shop");
        showNotification("Admin access required!", "error");
        return;
    }

    document.querySelector(".admin-panel").classList.add("active");
    updateAdminDashboard();
}

function handleAddProduct(e) {
    e.preventDefault();

    const name = document.getElementById("productName").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const description = document.getElementById("productDescription").value;
    const category = document.getElementById("productCategory").value;
    const image = document.getElementById("productImage").value;
    const image2 = document.getElementById("productImage2").value || image;
    const image3 = document.getElementById("productImage3").value || image;
    const stock = parseInt(document.getElementById("productStock").value);

    if (!name || !price || !description || !category || !image || stock === "") {
        showNotification("Please fill all required fields!", "error");
        return;
    }

    const newProduct = {
        id: Date.now(),
        name,
        price,
        description,
        category,
        image,
        images: [image, image2, image3],
        stock,
        createdAt: new Date().toISOString(),
    };

    appState.products.push(newProduct);
    localStorage.setItem("products", JSON.stringify(appState.products));

    // Reset form
    document.getElementById("productForm").reset();
    showNotification("Product added successfully!", "success");

    // Update dashboard
    updateAdminDashboard();
}

function updateAdminDashboard() {
    loadDataFromLocalStorage();

    // Update stats
    document.getElementById("totalProducts").textContent = appState.products.length;
    document.getElementById("totalOrders").textContent = appState.orders.length;

    const totalRevenue = appState.orders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById("totalRevenue").textContent = "$" + totalRevenue.toFixed(2);

    // Update products list
    const adminProductsList = document.getElementById("adminProductsList");
    adminProductsList.innerHTML = "";

    if (appState.products.length === 0) {
        adminProductsList.innerHTML = '<div class="empty-message">No products added yet.</div>';
    } else {
        appState.products.forEach((product) => {
            const item = document.createElement("div");
            item.className = "admin-product-item";
            item.innerHTML = `
                <div class="admin-product-info">
                    <div class="admin-product-name">${product.name}</div>
                    <div class="admin-product-details">
                        Price: $${product.price.toFixed(2)} | Stock: ${product.stock} | Category: ${product.category}
                    </div>
                </div>
                <div class="admin-product-actions">
                    <button class="btn btn-edit" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            `;
            adminProductsList.appendChild(item);
        });
    }

    // Update orders list
    const adminOrdersList = document.getElementById("adminOrdersList");
    adminOrdersList.innerHTML = "";

    if (appState.orders.length === 0) {
        adminOrdersList.innerHTML = '<div class="empty-message">No orders yet.</div>';
    } else {
        appState.orders.forEach((order) => {
            const item = document.createElement("div");
            item.className = "admin-order-item";
            const itemsText = order.items.map((i) => `${i.name} x${i.quantity}`).join(", ");
            const customerName = order.customer ? order.customer.fullName : "Guest";
            item.innerHTML = `
                <div class="admin-order-info">
                    <div class="admin-order-detail">Order #${order.id}</div>
                    <div class="admin-order-details">
                        Customer: ${customerName} | Items: ${itemsText} | Total: $${order.total.toFixed(2)} | Status: ${order.status}
                    </div>
                </div>
            `;
            adminOrdersList.appendChild(item);
        });
    }
}

function deleteProduct(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
        appState.products = appState.products.filter((p) => p.id !== productId);
        localStorage.setItem("products", JSON.stringify(appState.products));
        updateAdminDashboard();
        showNotification("Product deleted!", "success");
    }
}

function editProduct(productId) {
    const product = appState.products.find((p) => p.id === productId);
    if (!product) return;

    document.getElementById("productName").value = product.name;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productDescription").value = product.description;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productImage").value = product.image;
    document.getElementById("productImage2").value = product.images ? product.images[1] : "";
    document.getElementById("productImage3").value = product.images ? product.images[2] : "";
    document.getElementById("productStock").value = product.stock;

    // Add update handler
    const form = document.getElementById("productForm");
    form.onsubmit = function (e) {
        e.preventDefault();
        product.name = document.getElementById("productName").value;
        product.price = parseFloat(document.getElementById("productPrice").value);
        product.description = document.getElementById("productDescription").value;
        product.category = document.getElementById("productCategory").value;
        product.image = document.getElementById("productImage").value;
        product.images = [
            document.getElementById("productImage").value,
            document.getElementById("productImage2").value || document.getElementById("productImage").value,
            document.getElementById("productImage3").value || document.getElementById("productImage").value
        ];
        product.stock = parseInt(document.getElementById("productStock").value);

        localStorage.setItem("products", JSON.stringify(appState.products));
        form.onsubmit = handleAddProduct;
        form.reset();
        updateAdminDashboard();
        showNotification("Product updated successfully!", "success");
    };
}

// ============================================
// GOOGLE SHEETS EXPORT
// ============================================

function exportToGoogleSheets() {
    loadDataFromLocalStorage();

    const data = {
        products: appState.products,
        orders: appState.orders,
        exportDate: new Date().toISOString(),
    };

    // This will send data to your Google Apps Script
    const scriptUrl = "YOUR_GOOGLE_APPS_SCRIPT_URL"; // You'll add this after creating the Apps Script

    if (scriptUrl === "YOUR_GOOGLE_APPS_SCRIPT_URL") {
        showNotification(
            "Please set up Google Apps Script URL in the code first.",
            "warning"
        );
        console.log("Export data:", data);
        return;
    }

    fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                showNotification("Data exported to Google Sheets successfully!", "success");
                console.log("Export result:", result);
            } else {
                showNotification("Export failed: " + result.error, "error");
            }
        })
        .catch((error) => {
            showNotification("Export error: " + error.message, "error");
            console.error("Export error:", error);
        });
}

// ============================================
// LOCAL STORAGE
// ============================================

function loadDataFromLocalStorage() {
    const products = localStorage.getItem("products");
    const orders = localStorage.getItem("orders");
    const cart = localStorage.getItem("cart");

    if (products) appState.products = JSON.parse(products);
    if (orders) appState.orders = JSON.parse(orders);
    if (cart) appState.cart = JSON.parse(cart);
}

function clearAllData() {
    if (
        confirm(
            "WARNING: This will delete ALL products and orders. Are you sure? This cannot be undone!"
        )
    ) {
        localStorage.removeItem("products");
        localStorage.removeItem("orders");
        localStorage.removeItem("cart");
        appState.products = [];
        appState.orders = [];
        appState.cart = [];
        updateAdminDashboard();
        updateCartCount();
        showNotification("All data cleared!", "warning");
    }
}

// ============================================
// UTILITIES
// ============================================

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}
