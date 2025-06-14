# Game Store Inventory Management System

A simple web-based inventory management system for a game store, built with Python Flask and modern web technologies.

## Features

- Add new inventory items with name, type, and purchase price
- Remove/sell items from inventory
- Track sold items with profit/loss information
- Filter items by name and type
- View item history (when added and when sold)
- Modern, responsive user interface
- Local JSON file storage

## Requirements

- Python 3.7 or higher
- Flask
- python-dateutil

## Installation

1. Clone this repository or download the files
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Running the Application

1. Open a terminal in the project directory
2. Run the Flask application:
   ```
   python app.py
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

### Adding Items
1. Click the "Add Item" button
2. Fill in the item details:
   - Item Name
   - Item Type (Console, Video Game, Accessory, Controller, or Merchandise)
   - Purchase Price
3. Click "Add Item" to save

### Selling Items
1. Find the item in the inventory list
2. Click the "Sell Item" button
3. Enter the selling price
4. Click "Confirm Sale" to complete the transaction

### Filtering Items
- Use the search box to filter items by name
- Use the type dropdown to filter by item type
- View sold items by clicking the "Sold Items" tab

## Data Storage

The application stores all data in JSON files in the `data` directory:
- `inventory.json`: Current inventory items
- `sold_items.json`: History of sold items

## Security Note

This application is designed for local use only and does not include authentication. Do not expose it to the internet without proper security measures. 