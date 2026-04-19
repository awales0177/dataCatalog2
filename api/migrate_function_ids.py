#!/usr/bin/env python3
"""
Migration script to replace function IDs with UUIDs in toolkit.json
"""
import json
import os
from pathlib import Path

from catalog_uuid import new_uuid_str

# Path to toolkit.json
TOOLKIT_FILE = Path(__file__).parent / '_data' / 'toolkit.json'

def migrate_function_ids():
    """Replace all function IDs with UUIDs"""
    print(f"Reading toolkit data from {TOOLKIT_FILE}...")
    
    # Read the current toolkit data
    with open(TOOLKIT_FILE, 'r', encoding='utf-8') as f:
        toolkit_data = json.load(f)
    
    # Track old to new ID mappings for reference
    id_mappings = {}
    
    # Update each function's ID
    functions = toolkit_data['toolkit']['functions']
    print(f"Found {len(functions)} functions to migrate...")
    
    for function in functions:
        old_id = function['id']
        new_id = new_uuid_str()
        function['id'] = new_id
        id_mappings[old_id] = new_id
        print(f"  Migrated: {old_id} -> {new_id}")
    
    # Create backup
    backup_file = TOOLKIT_FILE.with_suffix('.json.backup')
    print(f"\nCreating backup at {backup_file}...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(toolkit_data, f, indent=2, ensure_ascii=False)
    
    # Write updated data
    print(f"Writing updated data to {TOOLKIT_FILE}...")
    with open(TOOLKIT_FILE, 'w', encoding='utf-8') as f:
        json.dump(toolkit_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Migration complete! {len(functions)} functions migrated.")
    print(f"📋 Backup saved to: {backup_file}")
    print("\nID Mappings (old -> new):")
    for old_id, new_id in id_mappings.items():
        print(f"  {old_id} -> {new_id}")

if __name__ == '__main__':
    if not TOOLKIT_FILE.exists():
        print(f"❌ Error: Toolkit file not found at {TOOLKIT_FILE}")
        exit(1)
    
    migrate_function_ids()


