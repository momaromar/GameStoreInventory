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
    item = {
        'id': str(datetime.now().timestamp()),
        'name': data['name'],
        'type': data['type'],
        'purchase_price': float(data['purchase_price']),
        'date_added': datetime.now().isoformat(),
        'on_hold': False,
        'hold_info': None
    }
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    inventory.append(item)
    
    with open('data/inventory.json', 'w') as f:
        json.dump(inventory, f, indent=4)
    
    return jsonify({'success': True})

@app.route('/api/sell-item', methods=['POST'])
def sell_item():
    data = request.json
    item_id = data['id']
    sell_price = float(data['sell_price'])
    
    with open('data/inventory.json', 'r') as f:
        inventory = json.load(f)
    
    # Find and remove the item from inventory
    item_to_sell = None
    for item in inventory:
        if item['id'] == item_id:
            item_to_sell = item
            inventory.remove(item)
            break
    
    if item_to_sell:
        # Add to sold items
        sold_item = {
            **item_to_sell,
            'sell_price': sell_price,
            'date_sold': datetime.now().isoformat()
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

if __name__ == '__main__':
    app.run(debug=True) 