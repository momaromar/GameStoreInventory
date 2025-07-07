from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime, date
import os
from dateutil import parser
import threading
import time

app = Flask(__name__)

# Ensure data directory exists
if not os.path.exists('data'):
    os.makedirs('data')

# Track last auto-release check
last_auto_release_check = None

# Initialize JSON files if they don't exist
def init_json_files():
    if not os.path.exists('data/inventory.json'):
        with open('data/inventory.json', 'w') as f:
            json.dump([], f)
    if not os.path.exists('data/sold_items.json'):
        with open('data/sold_items.json', 'w') as f:
            json.dump([], f)

def perform_auto_release():
    """Perform auto-release of expired holds"""
    global last_auto_release_check
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    today = date.today()
    released_count = 0
    
    # Find items that need to be auto-released
    for item in inventory:
        if (item.get('on_hold', False) and 
            item.get('hold_info') and 
            item['hold_info'].get('auto_release_date')):
            
            try:
                auto_release_date = datetime.strptime(item['hold_info']['auto_release_date'], '%Y-%m-%d').date()
                if auto_release_date <= today:
                    # Auto-release this item
                    if item.get('quantity', 1) == 1:
                        # Try to merge back into original group
                        merged = False
                        for other_item in inventory:
                            if (other_item['id'] != item['id'] and 
                                not other_item.get('on_hold', False) and
                                other_item['name'].lower() == item['name'].lower() and
                                other_item['type'] == item['type'] and
                                float(other_item['purchase_price']) == float(item['purchase_price'])):
                                
                                other_item['quantity'] = other_item.get('quantity', 1) + item.get('quantity', 1)
                                inventory.remove(item)
                                merged = True
                                break
                        
                        if not merged:
                            item['on_hold'] = False
                            item['hold_info'] = None
                    else:
                        item['on_hold'] = False
                        item['hold_info'] = None
                    
                    released_count += 1
            except ValueError:
                # Invalid date format, skip this item
                continue
    
    if released_count > 0:
        with open('data/inventory.json', 'w') as f:
            json.dump(inventory, f, indent=4)
        print(f"Auto-released {released_count} expired hold(s)")
    
    last_auto_release_check = today

def auto_release_checker():
    """Background thread that checks for expired holds daily"""
    global last_auto_release_check
    
    while True:
        try:
            today = date.today()
            
            if last_auto_release_check != today:
                perform_auto_release()
            
            time.sleep(3600)  # Check every hour
        except Exception as e:
            print(f"Error in auto-release checker: {e}")
            time.sleep(3600)  # Wait an hour before retrying

# Start background thread for auto-release checking
auto_release_thread = threading.Thread(target=auto_release_checker, daemon=True)
auto_release_thread.start()

# Perform initial auto-release check on startup
perform_auto_release()

init_json_files()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    return jsonify(inventory)

@app.route('/api/sold-items', methods=['GET'])
def get_sold_items():
    with open('data/sold_items.json', 'r') as f:
        sold_items = json.load(f)
    return jsonify(sold_items)

@app.route('/api/add-item', methods=['POST'])
def add_item():
    data = request.json
    quantity = int(data.get('quantity', 1))
    item = {
        'id': str(datetime.now().timestamp()),
        'name': data['name'],
        'type': data['type'],
        'purchase_price': float(data['purchase_price']),
        'date_added': datetime.now().isoformat(),
        'on_hold': False,
        'hold_info': None,
        'quantity': quantity
    }
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    # If an item with the same name, type, and price exists and is not on hold, increment its quantity
    found = False
    for inv_item in inventory:
        if (
            inv_item['name'].lower() == item['name'].lower() and
            inv_item['type'] == item['type'] and
            float(inv_item['purchase_price']) == float(item['purchase_price']) and
            not inv_item.get('on_hold', False)
        ):
            inv_item['quantity'] = inv_item.get('quantity', 1) + quantity
            found = True
            break
    if not found:
        inventory.append(item)
    
    with open('data/inventory.json', 'w') as f:
        json.dump(inventory, f, indent=4)
    
    return jsonify({'success': True})

@app.route('/api/sell-item', methods=['POST'])
def sell_item():
    data = request.json
    item_id = data['id']
    sell_price = float(data['sell_price'])
    quantity_to_sell = int(data.get('quantity', 1))
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    # Find the item in inventory
    item_to_sell = None
    for item in inventory:
        if item['id'] == item_id:
            item_to_sell = item
            break
    
    if item_to_sell:
        available_qty = item_to_sell.get('quantity', 1)
        if quantity_to_sell > available_qty:
            return jsonify({'success': False, 'error': 'Not enough quantity available'}), 400
        # Decrement quantity or remove item
        if available_qty > quantity_to_sell:
            item_to_sell['quantity'] -= quantity_to_sell
        else:
            inventory.remove(item_to_sell)
        # Add to sold items
        sold_item = {
            **item_to_sell,
            'sell_price': sell_price,
            'date_sold': datetime.now().isoformat(),
            'quantity': quantity_to_sell
        }
        with open('data/sold_items.json', 'r') as f:
            sold_items = json.load(f)
        sold_items.append(sold_item)
        with open('data/sold_items.json', 'w') as f:
            json.dump(sold_items, f, indent=4)
        with open('data/inventory.json', 'w') as f:
            json.dump(inventory, f, indent=4)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Item not found'})

@app.route('/api/hold-item', methods=['POST'])
def hold_item():
    data = request.json
    item_id = data['id']
    customer_name = data['customer_name']
    customer_phone = data['customer_phone']
    hold_note = data['hold_note']
    quantity_to_hold = int(data.get('quantity', 1))
    auto_release_date = data.get('auto_release_date')
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    for item in inventory:
        if item['id'] == item_id:
            available_qty = item.get('quantity', 1)
            if quantity_to_hold > available_qty:
                return jsonify({'success': False, 'error': 'Not enough quantity available'}), 400
            
            if available_qty > quantity_to_hold:
                # Decrement original item quantity
                item['quantity'] -= quantity_to_hold
                # Create a new on-hold item with quantity 1
                new_item = item.copy()
                new_item['id'] = str(datetime.now().timestamp())
                new_item['on_hold'] = True
                new_item['hold_info'] = {
                    'customer_name': customer_name,
                    'customer_phone': customer_phone,
                    'hold_note': hold_note,
                    'date_held': datetime.now().isoformat(),
                    'auto_release_date': auto_release_date if auto_release_date else None
                }
                new_item['quantity'] = quantity_to_hold
                inventory.append(new_item)
            else:
                item['on_hold'] = True
                item['hold_info'] = {
                    'customer_name': customer_name,
                    'customer_phone': customer_phone,
                    'hold_note': hold_note,
                    'date_held': datetime.now().isoformat(),
                    'auto_release_date': auto_release_date if auto_release_date else None
                }
            break
    
    with open('data/inventory.json', 'w') as f:
        json.dump(inventory, f, indent=4)
    
    return jsonify({'success': True})

@app.route('/api/release-hold', methods=['POST'])
def release_hold():
    data = request.json
    item_id = data['id']
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    # Find the on-hold item
    held_item = None
    held_item_index = None
    for idx, item in enumerate(inventory):
        if item['id'] == item_id and item.get('on_hold', False):
            held_item = item
            held_item_index = idx
            break
    
    if held_item:
        # Try to find a matching non-hold group to merge into
        for other_item in inventory:
            if (other_item['id'] != item_id and 
                not other_item.get('on_hold', False) and
                other_item['name'].lower() == held_item['name'].lower() and
                other_item['type'] == held_item['type'] and
                float(other_item['purchase_price']) == float(held_item['purchase_price'])):
                
                # Merge the held item into the existing group
                other_item['quantity'] = other_item.get('quantity', 1) + held_item.get('quantity', 1)
                # Remove the held item
                inventory.pop(held_item_index)
                break
        else:
            # No matching group found, just mark as not on hold
            held_item['on_hold'] = False
            held_item['hold_info'] = None
    
    with open('data/inventory.json', 'w') as f:
        json.dump(inventory, f, indent=4)
    
    return jsonify({'success': True})

@app.route('/api/search', methods=['GET'])
def search_items():
    query = request.args.get('query', '').lower()
    item_type = request.args.get('type', '')
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    filtered_items = inventory
    
    if query:
        filtered_items = [item for item in filtered_items if query in item['name'].lower()]
    
    if item_type:
        filtered_items = [item for item in filtered_items if item['type'] == item_type]
    
    return jsonify(filtered_items)

@app.route('/api/edit-item', methods=['POST'])
def edit_item():
    data = request.json
    item_id = data['id']
    new_name = data.get('name')
    new_type = data.get('type')
    new_purchase_price = data.get('purchase_price')
    new_quantity = data.get('quantity')

    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)

    for item in inventory:
        if item['id'] == item_id:
            if item.get('on_hold', False):
                return jsonify({'success': False, 'error': 'Cannot edit item while it is on hold.'}), 400
            if new_name is not None:
                item['name'] = new_name
            if new_type is not None:
                item['type'] = new_type
            if new_purchase_price is not None:
                item['purchase_price'] = float(new_purchase_price)
            if new_quantity is not None:
                item['quantity'] = int(new_quantity)
            break

    with open('data/inventory.json', 'w') as f:
        json.dump(inventory, f, indent=4)

    return jsonify({'success': True})

@app.route('/api/auto-release-holds', methods=['POST'])
def auto_release_holds():
    perform_auto_release()
    return jsonify({'success': True, 'released_count': 0})  # Count is printed in perform_auto_release

if __name__ == '__main__':
    app.run(debug=True) 