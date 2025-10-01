import React, { useState, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as EyeIcon,
  Edit as EditIcon2,
  Diamond as CrownIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { hashPassword } from '../utils/passwordUtils';

const UserManagementPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([
    {
      username: 'user',
      password_hash: 'hashed_password_here',
      role: 'admin',
      email: 'user@example.com',
      full_name: 'User',
      last_role_change: '2024-01-15 10:30:00',
      status: 'active'
    }
  ]);

  const [editingUser, setEditingUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'reader',
    status: 'active'
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <CrownIcon />;
      case 'editor': return <EditIcon2 />;
      case 'reader': return <EyeIcon />;
      default: return <EyeIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'editor': return 'secondary';
      case 'reader': return 'primary';
      default: return 'primary';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show existing password
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsEditDialogOpen(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'reader',
      status: 'active'
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      // Update existing user
      const updatedUser = {
        ...editingUser,
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        // Only update password if provided
        password_hash: formData.password ? 
          hashPassword(formData.password) : // Proper password hashing
          editingUser.password_hash
      };
      setUsers(users.map(u => 
        u.username === editingUser.username ? updatedUser : u
      ));
      setIsEditDialogOpen(false);
    } else {
      // Add new user
      const newUser = {
        username: formData.username,
        password_hash: hashPassword(formData.password), // Proper password hashing
        role: formData.role,
        email: formData.email,
        full_name: formData.full_name,
        last_role_change: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: formData.status
      };
      setUsers([...users, newUser]);
      setIsAddDialogOpen(false);
    }
    setEditingUser(null);
  };

  const handleDeleteUser = (username) => {
    setDeletingUser(username);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (deletingUser) {
      setUsers(users.filter(u => u.username !== deletingUser));
      setDeletingUser(null);
    }
    setShowDeleteDialog(false);
  };

  const handleCancel = () => {
    setIsEditDialogOpen(false);
    setIsAddDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
            User Management
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Manage user access and permissions across the data catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
          sx={{
            bgcolor: currentTheme.primary,
            color: currentTheme.background,
            '&:hover': {
              bgcolor: currentTheme.primaryHover || currentTheme.primary,
            }
          }}
        >
          Add User
        </Button>
      </Box>

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={user.username}>
            <Card
              sx={{
                bgcolor: currentTheme.card,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                '&:hover': {
                  boxShadow: `0 4px 20px ${currentTheme.primary}20`,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: currentTheme.primary,
                      color: currentTheme.background,
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {user.full_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: currentTheme.text, mb: 0.5 }}>
                      {user.full_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      @{user.username}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    color={getRoleColor(user.role)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Chip
                    label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    color={getStatusColor(user.status)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                  {user.email}
                </Typography>

                <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 2 }}>
                  Last role change: {user.last_role_change}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit User">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                      sx={{
                        color: currentTheme.primary,
                        '&:hover': {
                          bgcolor: currentTheme.primary + '20',
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.username)}
                      sx={{
                        color: currentTheme.error,
                        '&:hover': {
                          bgcolor: currentTheme.error + '20',
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit/Add User Dialog */}
      <Dialog
        open={isEditDialogOpen || isAddDialogOpen}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          },
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: currentTheme.background,
                  '& fieldset': {
                    borderColor: currentTheme.border,
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '& .MuiInputBase-input': {
                  color: currentTheme.text,
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme.textSecondary,
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: currentTheme.background,
                  '& fieldset': {
                    borderColor: currentTheme.border,
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '& .MuiInputBase-input': {
                  color: currentTheme.text,
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme.textSecondary,
                },
              }}
            />
            <TextField
              fullWidth
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: currentTheme.background,
                  '& fieldset': {
                    borderColor: currentTheme.border,
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '& .MuiInputBase-input': {
                  color: currentTheme.text,
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme.textSecondary,
                },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: currentTheme.background,
                  '& fieldset': {
                    borderColor: currentTheme.border,
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '& .MuiInputBase-input': {
                  color: currentTheme.text,
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme.textSecondary,
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: currentTheme.textSecondary }}>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role"
                sx={{
                  color: currentTheme.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.border,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.primary,
                  },
                }}
              >
                <MenuItem value="reader">Reader</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ color: currentTheme.textSecondary }}>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Status"
                sx={{
                  color: currentTheme.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.border,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.primary,
                  },
                }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            sx={{ color: currentTheme.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveUser}
            startIcon={<SaveIcon />}
            variant="contained"
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': {
                bgcolor: currentTheme.primaryHover || currentTheme.primary,
              }
            }}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deletingUser}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmDeleteUser} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagementPage;
