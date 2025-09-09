# 🔐 Role-Based Access Control (RBAC) System

This document describes the authentication and authorization system implemented in the Data Catalog application.

## 🎯 Overview

The system implements role-based access control with three user roles:
- **Reader**: Can view all data but cannot create, edit, or delete
- **Editor**: Full access to create, edit, and delete all data
- **Admin**: All permissions including user management

## 🏗️ Architecture

### Backend (API)
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Endpoint protection based on user roles
- **Password Hashing**: SHA-256 password hashing
- **Token Expiration**: 30-minute token lifetime

### Frontend (React)
- **Authentication Context**: Global state management for user authentication
- **Protected Routes**: Route-level access control
- **UI Role Checks**: Show/hide features based on user role
- **Automatic Redirects**: Redirect to login for unauthenticated users

## 🚀 Quick Start

### 1. Start the API Server
```bash
cd api
pip install -r requirements.txt
python main.py
```

### 2. Start the Frontend
```bash
cd catalog
npm install
npm start
```

### 3. Test Authentication
```bash
python test_auth.py
```

## 👥 Test Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `reader1` | `reader123` | Reader | Read-only access |
| `editor1` | `editor123` | Editor | Full edit access |
| `admin` | `admin123` | Admin | Administrator access |

## 🔑 Authentication Flow

### 1. Login Process
1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. User is redirected to requested page

### 2. API Request Process
1. Frontend includes JWT token in Authorization header
2. Backend validates token and extracts user information
3. Backend checks user role against required permissions
4. Request is processed or rejected based on permissions

### 3. Logout Process
1. User clicks logout in user menu
2. Frontend removes token from localStorage
3. User is redirected to login page

## 🛡️ Security Features

### Backend Security
- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: SHA-256 with salt
- **Role Hierarchy**: Admin > Editor > Reader
- **Token Expiration**: Automatic token invalidation
- **CORS Protection**: Configured for secure cross-origin requests

### Frontend Security
- **Token Storage**: Secure localStorage with automatic cleanup
- **Route Protection**: Automatic redirects for unauthorized access
- **UI Security**: Role-based feature visibility
- **Error Handling**: Graceful handling of authentication errors

## 📋 API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout
- `GET /api/auth/roles` - Get available roles
- `GET /api/auth/test-users` - Get test user credentials

### Protected Endpoints
All CRUD endpoints require authentication and appropriate role:

#### Read Access (All authenticated users)
- `GET /api/models` - List data models
- `GET /api/domains` - List data domains
- `GET /api/applications` - List applications
- `GET /api/agreements` - List agreements
- `GET /api/reference` - List reference data
- `GET /api/toolkit` - List toolkit components
- `GET /api/policies` - List data policies

#### Write Access (Editor/Admin only)
- `POST /api/models` - Create data model
- `PUT /api/models/{id}` - Update data model
- `DELETE /api/models/{id}` - Delete data model
- `POST /api/applications` - Create application
- `PUT /api/applications/{id}` - Update application
- `DELETE /api/applications/{id}` - Delete application
- `POST /api/agreements` - Create agreement
- `PUT /api/agreements/{id}` - Update agreement
- `DELETE /api/agreements/{id}` - Delete agreement
- `POST /api/reference` - Create reference item
- `PUT /api/reference/{id}` - Update reference item
- `DELETE /api/reference/{id}` - Delete reference item
- `POST /api/toolkit` - Create toolkit component
- `PUT /api/toolkit/{type}/{id}` - Update toolkit component
- `DELETE /api/toolkit/{type}/{id}` - Delete toolkit component
- `POST /api/policies` - Create data policy
- `PUT /api/policies/{id}` - Update data policy
- `DELETE /api/policies/{id}` - Delete data policy

## 🎨 Frontend Components

### Authentication Components
- `AuthContext` - Global authentication state management
- `LoginPage` - User login interface
- `ProtectedRoute` - Route-level access control
- `UnauthorizedPage` - Access denied page

### UI Updates
- **AppHeader**: User menu with logout functionality
- **DataModelsPage**: Hide create button for readers
- **All Edit Pages**: Protected by editor role requirement
- **Navigation**: Role-based menu visibility

## 🔧 Configuration

### Environment Variables
```bash
# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# User Management
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### Frontend Configuration
```javascript
// API URL configuration
const API_URL = 'http://localhost:8000/api';

// Token storage
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));
```

## 🧪 Testing

### Manual Testing
1. Start both API and frontend servers
2. Navigate to `http://localhost:3000`
3. Try to access protected routes (should redirect to login)
4. Login with test credentials
5. Test role-based access:
   - Reader: Should see data but no edit buttons
   - Editor: Should see all data and edit buttons
   - Admin: Should see all data and edit buttons

### Automated Testing
```bash
# Run the test script
python test_auth.py
```

## 🚨 Security Considerations

### Production Deployment
1. **Change Default Passwords**: Update all default credentials
2. **Use Strong Secret Key**: Generate a secure JWT secret
3. **Enable HTTPS**: Use SSL/TLS for all communications
4. **Database Storage**: Move user data to a proper database
5. **Rate Limiting**: Implement API rate limiting
6. **Audit Logging**: Log all authentication events

### Best Practices
- Never store passwords in plain text
- Use environment variables for sensitive configuration
- Implement proper error handling
- Regular security audits
- Keep dependencies updated

## 🔄 Future Enhancements

### Planned Features
- **Password Reset**: Email-based password reset
- **Two-Factor Authentication**: TOTP support
- **Session Management**: Multiple device session handling
- **User Management UI**: Admin interface for user management
- **Audit Trail**: Comprehensive activity logging
- **API Key Management**: Service-to-service authentication

### Database Integration
- Replace in-memory user storage with database
- Implement user registration
- Add user profile management
- Support for external authentication providers

## 📞 Support

For issues or questions about the authentication system:
1. Check the test script output
2. Review browser console for frontend errors
3. Check API server logs for backend errors
4. Verify token expiration and refresh

## 📄 License

This authentication system is part of the Data Catalog project and follows the same license terms.
