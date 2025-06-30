// Global variables
let addItemModal;
let sellItemModal;
let holdItemModal;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    addItemModal = new bootstrap.Modal(document.getElementById('addItemModal'));
    sellItemModal = new bootstrap.Modal(document.getElementById('sellItemModal'));
    holdItemModal = new bootstrap.Modal(document.getElementById('holdItemModal'));
    
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
            </div>
        `;
    }
    
    itemDiv.innerHTML = `
        <div class="${itemClass}">
            ${holdStatus}
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-type">${item.type}</div>
                <div class="item-price">$${item.purchase_price}</div>
                <div class="item-date">Added: ${dateAdded}</div>
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
                    Purchase: $${item.purchase_price}<br>
                    Sold: $${item.sell_price}<br>
                    <span class="${profitClass}">Profit: $${profit}</span>
                </p>
                <p class="date-added">
                    Added: ${dateAdded}<br>
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
    sellItemModal.show();
}

// Show hold item modal
function showHoldItemModal(itemId) {
    document.getElementById('hold-item-form').reset();
    document.getElementById('hold-item-id').value = itemId;
    holdItemModal.show();
}

// Add new item
async function addItem() {
    const name = document.getElementById('item-name').value;
    const type = document.getElementById('item-type').value;
    const purchasePrice = document.getElementById('purchase-price').value;
    
    if (!name || !type || !purchasePrice) {
        alert('Please fill in all fields');
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
                purchase_price: purchasePrice
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
    
    if (!sellPrice) {
        alert('Please enter a sell price');
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
                sell_price: sellPrice
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
    const holdNote = document.getElementById('hold-note').value;
    
    if (!customerName || !holdNote) {
        alert('Please fill in all fields');
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
                hold_note: holdNote
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