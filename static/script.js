// Global variables
let addItemModal;
let sellItemModal;
let holdItemModal;
let editItemModal;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    addItemModal = new bootstrap.Modal(document.getElementById('addItemModal'));
    sellItemModal = new bootstrap.Modal(document.getElementById('sellItemModal'));
    holdItemModal = new bootstrap.Modal(document.getElementById('holdItemModal'));
    editItemModal = new bootstrap.Modal(document.getElementById('editItemModal'));
    
    // Set up event listeners
    document.getElementById('search-input').addEventListener('input', filterItems);
    document.getElementById('type-filter').addEventListener('change', filterItems);
    
    // Load initial data
    loadInventory();
    loadSoldItems();
});

// Load inventory items
async function loadInventory() {
    try {
        const response = await fetch('/api/inventory');
        const items = await response.json();
        window.currentInventoryItems = items;
        displayInventory(items);
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// Load sold items
async function loadSoldItems() {
    try {
        const response = await fetch('/api/sold-items');
        const items = await response.json();
        displaySoldItems(items);
    } catch (error) {
        console.error('Error loading sold items:', error);
    }
}

// Display inventory items
function displayInventory(items) {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemElement = createItemCard(item);
        container.appendChild(itemElement);
    });
}

// Display sold items
function displaySoldItems(items) {
    const container = document.getElementById('sold-items-list');
    container.innerHTML = '';
    
    items.forEach(item => {
        const card = createSoldItemCard(item);
        container.appendChild(card);
    });
}

// Create inventory item card (compact vertical layout)
function createItemCard(item) {
    const itemDiv = document.createElement('div');
    
    const dateAdded = new Date(item.date_added).toLocaleDateString();
    
    // Create hold status indicator
    let holdStatus = '';
    let holdInfo = '';
    let itemClass = 'inventory-item';
    
    if (item.on_hold && item.hold_info) {
        itemClass += ' on-hold';
        holdStatus = '<span class="hold-badge">ON HOLD</span>';
        const dateHeld = new Date(item.hold_info.date_held).toLocaleDateString();
        holdInfo = `
            <div class="hold-info">
                <strong>Customer:</strong> ${item.hold_info.customer_name}<br>
                <strong>Phone:</strong> ${item.hold_info.customer_phone}<br>
                <strong>Note:</strong> ${item.hold_info.hold_note}<br>
                <strong>Held since:</strong> ${dateHeld}
            </div>
        `;
    }
    
    // Create action buttons
    let actionButtons = '';
    if (item.on_hold) {
        actionButtons = `
            <div class="action-buttons">
                <button class="btn btn-release" onclick="releaseHold('${item.id}')">Release Hold</button>
                <button class="btn btn-primary" onclick="showSellItemModal('${item.id}')">Sell Item</button>
            </div>
        `;
    } else {
        actionButtons = `
            <div class="action-buttons">
                <button class="btn btn-hold" onclick="showHoldItemModal('${item.id}')">Hold Item</button>
                <button class="btn btn-primary" onclick="showSellItemModal('${item.id}')">Sell Item</button>
                <button class="btn btn-success" onclick="showEditItemModal('${item.id}')">Edit</button>
            </div>
        `;
    }
    
    itemDiv.innerHTML = `
        <div class="${itemClass}">
            ${holdStatus}
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-type">${item.type}</div>
                <div class="item-price">Listing Price: $${item.purchase_price}</div>
                <div class="item-quantity">Qty: <strong>${item.quantity || 1}</strong></div>
                ${holdInfo}
            </div>
            ${actionButtons}
        </div>
    `;
    
    return itemDiv;
}

// Create sold item card
function createSoldItemCard(item) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3';
    
    const dateAdded = new Date(item.date_added).toLocaleDateString();
    const dateSold = new Date(item.date_sold).toLocaleDateString();
    const profit = (item.sell_price - item.purchase_price).toFixed(2);
    const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
    
    col.innerHTML = `
        <div class="card sold-item-card">
            <div class="card-body">
                <h5 class="card-title">${item.name}</h5>
                <span class="badge bg-secondary item-type-badge">${item.type}</span>
                <p class="card-text price-info">
                    Listing Price: $${item.purchase_price}<br>
                    Sold: $${item.sell_price}<br>
                </p>
                <p class="date-added">
                    Sold: ${dateSold}
                </p>
            </div>
        </div>
    `;
    
    return col;
}

// Filter items based on search and type
async function filterItems() {
    const query = document.getElementById('search-input').value;
    const type = document.getElementById('type-filter').value;
    
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
        const items = await response.json();
        displayInventory(items);
    } catch (error) {
        console.error('Error filtering items:', error);
    }
}

// Show add item modal
function showAddItemModal() {
    document.getElementById('add-item-form').reset();
    addItemModal.show();
}

// Show sell item modal
function showSellItemModal(itemId) {
    document.getElementById('sell-item-form').reset();
    document.getElementById('sell-item-id').value = itemId;
    const item = window.currentInventoryItems?.find(i => i.id === itemId);
    const availableQty = item ? (item.quantity || 1) : 1;
    document.getElementById('sell-quantity').max = availableQty;
    document.getElementById('sell-quantity').value = 1;
    document.getElementById('available-quantity-info').textContent = `Available: ${availableQty}`;
    sellItemModal.show();
}

// Show hold item modal
function showHoldItemModal(itemId) {
    document.getElementById('hold-item-form').reset();
    document.getElementById('hold-item-id').value = itemId;
    const item = window.currentInventoryItems?.find(i => i.id === itemId);
    const availableQty = item ? (item.quantity || 1) : 1;
    document.getElementById('hold-quantity').max = availableQty;
    document.getElementById('hold-quantity').value = 1;
    document.getElementById('hold-available-quantity-info').textContent = `Available: ${availableQty}`;
    holdItemModal.show();
}

// Show edit item modal
function showEditItemModal(itemId) {
    const item = window.currentInventoryItems?.find(i => i.id === itemId);
    if (!item) return;
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-type').value = item.type;
    document.getElementById('edit-purchase-price').value = item.purchase_price;
    document.getElementById('edit-item-quantity').value = item.quantity || 1;
    editItemModal.show();
}

// Add new item
async function addItem() {
    const name = document.getElementById('item-name').value;
    const type = document.getElementById('item-type').value;
    const purchasePrice = document.getElementById('purchase-price').value;
    const quantity = document.getElementById('item-quantity').value;
    
    if (!name || !type || !purchasePrice || !quantity || quantity < 1) {
        alert('Please fill in all fields and enter a valid quantity');
        return;
    }
    
    try {
        const response = await fetch('/api/add-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                type,
                purchase_price: purchasePrice,
                quantity: quantity
            })
        });
        
        if (response.ok) {
            addItemModal.hide();
            loadInventory();
        } else {
            alert('Error adding item');
        }
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item');
    }
}

// Sell item
async function sellItem() {
    const itemId = document.getElementById('sell-item-id').value;
    const sellPrice = document.getElementById('sell-price').value;
    const sellQuantity = parseInt(document.getElementById('sell-quantity').value, 10);
    const item = window.currentInventoryItems?.find(i => i.id === itemId);
    const availableQty = item ? (item.quantity || 1) : 1;
    
    if (!sellPrice || !sellQuantity || sellQuantity < 1) {
        alert('Please enter a sell price and a valid quantity');
        return;
    }
    if (sellQuantity > availableQty) {
        alert('Cannot sell more than available quantity.');
        return;
    }
    
    try {
        const response = await fetch('/api/sell-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: itemId,
                sell_price: sellPrice,
                quantity: sellQuantity
            })
        });
        
        if (response.ok) {
            sellItemModal.hide();
            loadInventory();
            loadSoldItems();
        } else {
            alert('Error selling item');
        }
    } catch (error) {
        console.error('Error selling item:', error);
        alert('Error selling item');
    }
}

// Hold item
async function holdItem() {
    const itemId = document.getElementById('hold-item-id').value;
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const holdNote = document.getElementById('hold-note').value;
    const holdQuantity = parseInt(document.getElementById('hold-quantity').value, 10);
    const item = window.currentInventoryItems?.find(i => i.id === itemId);
    const availableQty = item ? (item.quantity || 1) : 1;
    
    if (!customerName || !customerPhone || !holdNote || !holdQuantity || holdQuantity < 1) {
        alert('Please fill in all fields and enter a valid quantity');
        return;
    }
    if (holdQuantity > availableQty) {
        alert('Cannot hold more than available quantity.');
        return;
    }
    
    try {
        const response = await fetch('/api/hold-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: itemId,
                customer_name: customerName,
                customer_phone: customerPhone,
                hold_note: holdNote,
                quantity: holdQuantity
            })
        });
        
        if (response.ok) {
            holdItemModal.hide();
            loadInventory();
        } else {
            alert('Error holding item');
        }
    } catch (error) {
        console.error('Error holding item:', error);
        alert('Error holding item');
    }
}

// Release hold
async function releaseHold(itemId) {
    if (!confirm('Are you sure you want to release this hold?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/release-hold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: itemId
            })
        });
        
        if (response.ok) {
            loadInventory();
        } else {
            alert('Error releasing hold');
        }
    } catch (error) {
        console.error('Error releasing hold:', error);
        alert('Error releasing hold');
    }
}

// Edit item
async function editItem() {
    const id = document.getElementById('edit-item-id').value;
    const name = document.getElementById('edit-item-name').value;
    const type = document.getElementById('edit-item-type').value;
    const purchase_price = document.getElementById('edit-purchase-price').value;
    const quantity = document.getElementById('edit-item-quantity').value;
    if (!name || !type || !purchase_price || !quantity || quantity < 1) {
        alert('Please fill in all fields and enter a valid quantity');
        return;
    }
    try {
        const response = await fetch('/api/edit-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                name,
                type,
                purchase_price,
                quantity
            })
        });
        const result = await response.json();
        if (result.success) {
            editItemModal.hide();
            loadInventory();
        } else {
            alert(result.error || 'Error editing item');
        }
    } catch (error) {
        console.error('Error editing item:', error);
        alert('Error editing item');
    }
}

// Show inventory section
function showInventory() {
    document.getElementById('inventory-section').style.display = 'block';
    document.getElementById('sold-items-section').style.display = 'none';
    document.querySelector('a[onclick="showInventory()"]').classList.add('active');
    document.querySelector('a[onclick="showSoldItems()"]').classList.remove('active');
}

// Show sold items section
function showSoldItems() {
    document.getElementById('inventory-section').style.display = 'none';
    document.getElementById('sold-items-section').style.display = 'block';
    document.querySelector('a[onclick="showInventory()"]').classList.remove('active');
    document.querySelector('a[onclick="showSoldItems()"]').classList.add('active');
} 