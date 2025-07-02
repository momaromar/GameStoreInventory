from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime
import os
from dateutil import parser

app = Flask(__name__)

# Ensure data directory exists
if not os.path.exists('data'):
    os.makedirs('data')

# Initialize JSON files if they don't exist
def init_json_files():
    if not os.path.exists('data/inventory.json'):
        with open('data/inventory.json', 'w') as f:
            json.dump([], f)
    if not os.path.exists('data/sold_items.json'):
        with open('data/sold_items.json', 'w') as f:
            json.dump([], f)

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
    hold_note = data['hold_note']
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    # Find and update the item
    for item in inventory:
        if item['id'] == item_id:
            item['on_hold'] = True
            item['hold_info'] = {
                'customer_name': customer_name,
                'hold_note': hold_note,
                'date_held': datetime.now().isoformat()
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
    
    # Find and update the item
    for item in inventory:
        if item['id'] == item_id:
            item['on_hold'] = False
            item['hold_info'] = None
            break
    
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

if __name__ == '__main__':
    app.run(debug=True) 