#!/usr/bin/env python3
"""
Test script for the authentication system
"""

import requests
import json

# API base URL
API_URL = "http://localhost:8000"

def test_login(username, password):
    """Test login functionality"""
    print(f"\n=== Testing login for {username} ===")
    
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "username": username,
        "password": password
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful!")
        print(f"   User: {data['user']['username']}")
        print(f"   Role: {data['user']['role']}")
        print(f"   Token: {data['access_token'][:20]}...")
        return data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_protected_endpoint(token, endpoint, method="GET"):
    """Test a protected endpoint"""
    print(f"\n=== Testing {method} {endpoint} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    if method == "GET":
        response = requests.get(f"{API_URL}{endpoint}", headers=headers)
    elif method == "POST":
        response = requests.post(f"{API_URL}{endpoint}", headers=headers, json={})
    
    if response.status_code == 200:
        print(f"✅ Access granted")
        return True
    elif response.status_code == 403:
        print(f"❌ Access denied - insufficient permissions")
        return False
    elif response.status_code == 401:
        print(f"❌ Unauthorized - invalid token")
        return False
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_unauthorized_access(endpoint, method="GET"):
    """Test access without authentication"""
    print(f"\n=== Testing {method} {endpoint} without auth ===")
    
    if method == "GET":
        response = requests.get(f"{API_URL}{endpoint}")
    elif method == "POST":
        response = requests.post(f"{API_URL}{endpoint}", json={})
    
    if response.status_code == 401:
        print(f"✅ Correctly blocked unauthorized access")
        return True
    else:
        print(f"❌ Unexpected response: {response.status_code}")
        return False

def main():
    print("🔐 Testing Data Catalog Authentication System")
    print("=" * 50)
    
    # Test users
    test_users = [
        ("reader1", "reader123", "reader"),
        ("editor1", "editor123", "editor"),
        ("admin", "admin123", "admin")
    ]
    
    # Test endpoints
    read_endpoints = [
        "/api/models",
        "/api/domains",
        "/api/applications"
    ]
    
    write_endpoints = [
        "/api/models",
        "/api/applications"
    ]
    
    # Test unauthorized access
    print("\n🚫 Testing unauthorized access...")
    for endpoint in read_endpoints:
        test_unauthorized_access(endpoint)
    
    for endpoint in write_endpoints:
        test_unauthorized_access(endpoint, "POST")
    
    # Test each user
    for username, password, role in test_users:
        token = test_login(username, password)
        if not token:
            continue
        
        print(f"\n📖 Testing read access for {role}...")
        for endpoint in read_endpoints:
            test_protected_endpoint(token, endpoint)
        
        print(f"\n✏️ Testing write access for {role}...")
        for endpoint in write_endpoints:
            if role == "reader":
                # Readers should be denied write access
                test_protected_endpoint(token, endpoint, "POST")
            else:
                # Editors and admins should have write access
                test_protected_endpoint(token, endpoint, "POST")
    
    print("\n✅ Authentication testing complete!")

if __name__ == "__main__":
    main()
