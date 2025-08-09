import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Settings as SettingsIcon, 
  Shield, 
  FileText,
  Edit,
  Trash2,
  UserPlus,
  Save
} from 'lucide-react';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'Administrator' | 'Healthcare Staff';
  status: 'Active' | 'Inactive';
}

// Mock data
const mockUsers: User[] = [
  { id: 1, name: 'John Admin', email: 'admin@gmail.com', role: 'Administrator', status: 'Active' },
  { id: 2, name: 'Jane Staff', email: 'staff@gmail.com', role: 'Healthcare Staff', status: 'Active' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'Healthcare Staff', status: 'Inactive' },
];

const mockAuditLogs = [
  { id: 1, date: '2024-01-09 10:30', user: 'John Admin', action: 'User login' },
  { id: 2, date: '2024-01-09 09:15', user: 'Jane Staff', action: 'Password changed' },
  { id: 3, date: '2024-01-08 16:45', user: 'John Admin', action: 'System settings updated' },
  { id: 4, date: '2024-01-08 14:20', user: 'Bob Wilson', action: 'User deactivated' },
];

const modules = [
  { name: 'Dashboard', id: 'dashboard' },
  { name: 'Products', id: 'products' },
  { name: 'Inventory', id: 'inventory' },
  { name: 'Orders', id: 'orders' },
  { name: 'Shipments', id: 'shipments' },
  { name: 'Invoices', id: 'invoices' },
  { name: 'Reports', id: 'reports' },
];

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['Administrator', 'Healthcare Staff']),
});

const systemConfigSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
});

const Settings: React.FC = () => {
  const [user, setUser] = useState<{name: string, role: string} | null>(null);
  const [users, setUsers] = useState(mockUsers);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modulePermissions, setModulePermissions] = useState<{[key: string]: {admin: boolean, staff: boolean}}>({
    dashboard: { admin: true, staff: true },
    products: { admin: true, staff: false },
    inventory: { admin: true, staff: true },
    orders: { admin: true, staff: true },
    shipments: { admin: true, staff: true },
    invoices: { admin: true, staff: true },
    reports: { admin: true, staff: false },
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Healthcare Staff',
    },
  });

  const systemForm = useForm<z.infer<typeof systemConfigSchema>>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      companyName: 'AutoMedi Flow',
      contactEmail: 'admin@automedflow.com',
      contactPhone: '+1 (555) 123-4567',
      address: '123 Healthcare Blvd, Medical City, HC 12345',
    },
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || parsedUser.email?.split('@')[0] || 'User',
        role: parsedUser.role || 'staff'
      });

      // Redirect non-admin users
      if (parsedUser.role !== 'Administrator') {
        navigate('/');
        return;
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleUserSubmit = (values: z.infer<typeof userSchema>) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
      toast({ title: 'User updated successfully' });
    } else {
      const newUser: User = {
        id: users.length + 1,
        name: values.name,
        email: values.email,
        role: values.role,
        status: 'Active'
      };
      setUsers([...users, newUser]);
      toast({ title: 'User added successfully' });
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
    userForm.reset();
  };

  const handleSystemConfigSubmit = (values: z.infer<typeof systemConfigSchema>) => {
    toast({ title: 'System configuration saved successfully' });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.reset(user);
    setIsUserDialogOpen(true);
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' }
        : u
    ));
    toast({ title: 'User status updated' });
  };

  const handlePermissionChange = (moduleId: string, role: 'admin' | 'staff', checked: boolean) => {
    setModulePermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [role]: checked
      }
    }));
  };

  if (!user || user.role !== 'Administrator') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and user access.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              System Config
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Access Control
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user accounts and their roles.
                    </CardDescription>
                  </div>
                  <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingUser(null); userForm.reset(); }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingUser ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                          <FormField
                            control={userForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Administrator">Administrator</SelectItem>
                                    <SelectItem value="Healthcare Staff">Healthcare Staff</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingUser ? 'Update User' : 'Add User'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure system-wide settings and company information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...systemForm}>
                  <form onSubmit={systemForm.handleSubmit(handleSystemConfigSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={systemForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={systemForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={systemForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Access Control Settings</CardTitle>
                <CardDescription>
                  Configure module access permissions for different user roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Administrator</TableHead>
                      <TableHead>Healthcare Staff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={modulePermissions[module.id]?.admin || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(module.id, 'admin', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={modulePermissions[module.id]?.staff || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(module.id, 'staff', checked as boolean)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  View recent system activities and user actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.date}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;