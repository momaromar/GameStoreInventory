# Game Store Inventory Management System - Flowchart Documentation

This flowchart provides a comprehensive overview of how the application works, making it easy for new collaborators to understand the codebase and contribute effectively. 

## Application Overview
This is a web-based inventory management system for a game store, built with Python Flask backend and modern JavaScript frontend. Data is stored in local JSON files.

## System Architecture

```
┌─────────────────┐    HTTP Requests    ┌─────────────────┐    JSON Files    ┌─────────────────┐
│   Frontend      │ ◄─────────────────► │   Flask Backend │ ◄──────────────► │   Data Storage  │
│   (HTML/CSS/JS) │                     │   (Python)      │                  │   (JSON Files)  │
└─────────────────┘                     └─────────────────┘                  └─────────────────┘
```

## File Structure
```
GameStoreInventory/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Setup instructions
├── FLOWCHART.md          # This documentation
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── style.css         # CSS styling
│   └── script.js         # Frontend JavaScript
└── data/                 # Created automatically
    ├── inventory.json    # Current inventory items
    └── sold_items.json   # Sold items history
```

## Application Flow

### 1. Application Startup
```
┌─────────────────┐
│   Start app.py  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Initialize JSON │ ◄─── Create data/ directory and JSON files if they don't exist
│     Files       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Start Flask     │ ◄─── Run on localhost:5000
│   Server        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Load Main Page  │ ◄─── Serve index.html
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Initialize      │ ◄─── Set up modals, event listeners, load initial data
│ Frontend        │
└─────────────────┘
```

### 2. Main Page Load (Frontend Initialization)
```
┌─────────────────┐
│ DOMContentLoaded│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Initialize      │ ◄─── Create Bootstrap modal objects
│   Modals        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Set Up Event    │ ◄─── Search input, type filter, form submissions
│   Listeners     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Load Initial    │ ◄─── Fetch inventory and sold items from API
│   Data          │
└─────────────────┘
```

### 3. Data Flow - Inventory Management

#### Adding New Items
```
┌─────────────────┐
│ Click "Add Item"│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Show Add Item   │ ◄─── Bootstrap modal opens
│   Modal         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Fill Form       │ ◄─── Item name, type, purchase price
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Click "Add Item"│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ addItem()       │ ◄─── JavaScript function
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ POST /api/add-  │ ◄─── Send data to Flask backend
│   item          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ add_item()      │ ◄─── Flask route handler
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Create Item     │ ◄─── Generate ID, timestamp, set on_hold=False
│   Object        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Save to         │ ◄─── Append to inventory.json
│ inventory.json  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Return Success  │ ◄─── JSON response to frontend
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Close Modal &   │ ◄─── Refresh inventory display
│ Refresh List    │
└─────────────────┘
```

#### Selling Items
```
┌─────────────────┐
│ Click "Sell     │
│   Item"         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Show Sell Modal │ ◄─── Bootstrap modal opens
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Enter Sell      │ ◄─── Price customer is paying
│   Price         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Click "Confirm  │
│   Sale"         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ sellItem()      │ ◄─── JavaScript function
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ POST /api/sell- │ ◄─── Send item ID and sell price
│   item          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ sell_item()     │ ◄─── Flask route handler
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Find Item in    │ ◄─── Search inventory.json by ID
│   Inventory     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Remove from     │ ◄─── Delete from inventory.json
│   Inventory     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Add to Sold     │ ◄─── Append to sold_items.json with sell info
│   Items         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Return Success  │ ◄─── JSON response to frontend
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Close Modal &   │ ◄─── Refresh both inventory and sold items
│ Refresh Lists   │
└─────────────────┘
```

#### Holding Items
```
┌─────────────────┐
│ Click "Hold     │
│   Item"         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Show Hold Modal │ ◄─── Bootstrap modal opens
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Fill Hold Form  │ ◄─── Customer name and hold note
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Click "Hold     │
│   Item"         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ holdItem()      │ ◄─── JavaScript function
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ POST /api/hold- │ ◄─── Send item ID, customer name, note
│   item          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ hold_item()     │ ◄─── Flask route handler
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Update Item     │ ◄─── Set on_hold=True, add hold_info
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Save to         │ ◄─── Update inventory.json
│ inventory.json  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Return Success  │ ◄─── JSON response to frontend
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Close Modal &   │ ◄─── Refresh inventory display
│ Refresh List    │
└─────────────────┘
```

#### Releasing Holds
```
┌─────────────────┐
│ Click "Release  │
│   Hold"         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Confirm Dialog  │ ◄─── "Are you sure?" prompt
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ releaseHold()   │ ◄─── JavaScript function
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ POST /api/      │ ◄─── Send item ID
│ release-hold    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ release_hold()  │ ◄─── Flask route handler
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Update Item     │ ◄─── Set on_hold=False, clear hold_info
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Save to         │ ◄─── Update inventory.json
│ inventory.json  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Return Success  │ ◄─── JSON response to frontend
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Refresh List    │ ◄─── Update inventory display
└─────────────────┘
```

### 4. Search and Filtering
```
┌─────────────────┐
│ User Types in   │ ◄─── Search input or selects type filter
│ Search/Filter   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ filterItems()   │ ◄─── JavaScript function (debounced)
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ GET /api/search │ ◄─── Send query and type parameters
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ search_items()  │ ◄─── Flask route handler
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Load Inventory  │ ◄─── Read inventory.json
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Filter by Query │ ◄─── Case-insensitive name search
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Filter by Type  │ ◄─── Exact type match
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Return Filtered │ ◄─── JSON array of matching items
│   Results       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Update Display  │ ◄─── Refresh inventory list
└─────────────────┘
```

### 5. Navigation Between Views
```
┌─────────────────┐
│ Click "Inventory"│
│ or "Sold Items" │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ showInventory() │ ◄─── Show inventory section, hide sold items
│ or              │
│ showSoldItems() │ ◄─── Show sold items section, hide inventory
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Update Active   │ ◄─── Highlight active nav link
│   Nav Link      │
└─────────────────┘
```

## Data Structures

### Inventory Item Object
```json
{
  "id": "1703123456.789",
  "name": "PlayStation 5",
  "type": "console",
  "purchase_price": 400.00,
  "date_added": "2023-12-21T10:30:00.000Z",
  "on_hold": false,
  "hold_info": null
}
```

### Item on Hold
```json
{
  "id": "1703123456.789",
  "name": "PlayStation 5",
  "type": "console",
  "purchase_price": 400.00,
  "date_added": "2023-12-21T10:30:00.000Z",
  "on_hold": true,
  "hold_info": {
    "customer_name": "John Doe",
    "hold_note": "Will pick up tomorrow, phone: 555-1234",
    "date_held": "2023-12-21T14:30:00.000Z"
  }
}
```

### Sold Item Object
```json
{
  "id": "1703123456.789",
  "name": "PlayStation 5",
  "type": "console",
  "purchase_price": 400.00,
  "date_added": "2023-12-21T10:30:00.000Z",
  "on_hold": false,
  "hold_info": null,
  "sell_price": 550.00,
  "date_sold": "2023-12-22T15:45:00.000Z"
}
```

## Key Functions Reference

### Backend (Flask) Functions
- `init_json_files()`: Creates data directory and JSON files if they don't exist
- `add_item()`: Adds new item to inventory with timestamp and hold status
- `sell_item()`: Removes item from inventory and adds to sold items with profit tracking
- `hold_item()`: Marks item as on hold with customer information
- `release_hold()`: Removes hold status from item
- `search_items()`: Filters inventory by name and type

### Frontend (JavaScript) Functions
- `loadInventory()`: Fetches and displays current inventory
- `loadSoldItems()`: Fetches and displays sold items history
- `displayInventory()`: Renders inventory cards with hold status
- `displaySoldItems()`: Renders sold item cards with profit info
- `createItemCard()`: Creates HTML for inventory item with hold indicators
- `createSoldItemCard()`: Creates HTML for sold item with profit display
- `filterItems()`: Handles search and type filtering
- `addItem()`: Submits new item form to backend
- `sellItem()`: Submits sale form to backend
- `holdItem()`: Submits hold form to backend
- `releaseHold()`: Confirms and submits hold release to backend

### UI Functions
- `showAddItemModal()`: Opens add item modal
- `showSellItemModal()`: Opens sell item modal
- `showHoldItemModal()`: Opens hold item modal
- `showInventory()`: Switches to inventory view
- `showSoldItems()`: Switches to sold items view

## Error Handling
- Form validation on frontend before submission
- Try-catch blocks for API calls
- User-friendly error messages
- Confirmation dialogs for destructive actions
- Graceful handling of missing data

## Security Considerations
- Local use only (no authentication)
- Input validation on both frontend and backend
- No SQL injection (JSON files only)
- XSS protection through proper HTML escaping
