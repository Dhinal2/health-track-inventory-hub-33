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
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bell, 
  Building2,
  Users, 
  FileText,
  Edit,
  Trash2,
  UserPlus,
  Save,
  Search,
  Eye,
  RotateCcw
} from 'lucide-react';

// Types
interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'Administrator' | 'Healthcare Staff';
  status: 'Active' | 'Inactive';
  contactNumber?: string;
}

interface AuditLog {
  id: number;
  dateTime: string;
  user: string;
  action: string;
  itemAffected: string;
}

// Mock data
const mockUsers: UserData[] = [
  { id: 1, name: 'Admin', email: 'admin@gmail.com', role: 'Administrator', status: 'Active', contactNumber: '+1-555-0001' },
  { id: 2, name: 'Healthcare Staff', email: 'staff@gmail.com', role: 'Healthcare Staff', status: 'Active', contactNumber: '+1-555-0002' },
  { id: 3, name: 'Dr. Smith', email: 'smith@example.com', role: 'Healthcare Staff', status: 'Inactive', contactNumber: '+1-555-0003' },
];

const mockAuditLogs: AuditLog[] = [
  { id: 1, dateTime: '2024-01-09 10:30:15', user: 'Admin', action: 'User login', itemAffected: 'System' },
  { id: 2, dateTime: '2024-01-09 09:15:22', user: 'Healthcare Staff', action: 'Password changed', itemAffected: 'User Profile' },
  { id: 3, dateTime: '2024-01-08 16:45:10', user: 'Admin', action: 'Inventory threshold updated', itemAffected: 'Paracetamol' },
  { id: 4, dateTime: '2024-01-08 14:20:33', user: 'Admin', action: 'User deactivated', itemAffected: 'Dr. Smith' },
  { id: 5, dateTime: '2024-01-08 11:30:45', user: 'Healthcare Staff', action: 'Order placed', itemAffected: 'Order #ORD-001' },
];

const departments = ['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Pharmacy'];

// Form schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['Administrator', 'Healthcare Staff']),
  contactNumber: z.string().min(10, 'Contact number is required'),
});

const organizationSchema = z.object({
  hospitalName: z.string().min(2, 'Hospital name is required'),
  address: z.string().min(5, 'Address is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(10, 'Phone number is required'),
  reorderThreshold: z.number().min(1, 'Threshold must be at least 1'),
});

const Settings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{name: string, role: string, email: string} | null>(null);
  const [users, setUsers] = useState(mockUsers);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [activeDepartments, setActiveDepartments] = useState(departments.slice(0, 4));
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    newOrderAlerts: true,
    orderStatusUpdates: true,
    shipmentUpdates: false,
    reportFrequency: 'weekly'
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      contactNumber: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Healthcare Staff',
      contactNumber: '',
    },
  });

  const organizationForm = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      hospitalName: 'AutoMedi Flow Hospital',
      address: '123 Healthcare Blvd, Medical City, HC 12345',
      contactEmail: 'admin@automedflow.com',
      contactPhone: '+1 (555) 123-4567',
      reorderThreshold: 10,
    },
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const user = {
        name: parsedUser.email === 'admin@gmail.com' ? 'Admin' : 'Healthcare Staff',
        role: parsedUser.role || 'Staff',
        email: parsedUser.email || ''
      };
      setCurrentUser(user);

      // Set profile form defaults
      profileForm.setValue('name', user.name);
      profileForm.setValue('email', user.email);
      profileForm.setValue('contactNumber', user.email === 'admin@gmail.com' ? '+1-555-0001' : '+1-555-0002');
    } else {
      navigate('/login');
    }
  }, [navigate, profileForm]);

  const isAdmin = currentUser?.role === 'Administrator';
  const logsPerPage = 5;
  const filteredLogs = auditLogs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.itemAffected.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const displayedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const handleProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    toast({ title: 'Profile updated successfully' });
  };

  const handleUserSubmit = (values: z.infer<typeof userSchema>) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
      toast({ title: 'User updated successfully' });
    } else {
      const newUser: UserData = {
        id: users.length + 1,
        name: values.name,
        email: values.email,
        role: values.role,
        status: 'Active',
        contactNumber: values.contactNumber
      };
      setUsers([...users, newUser]);
      toast({ title: 'User added successfully' });
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
    userForm.reset();
  };

  const handleOrganizationSubmit = (values: z.infer<typeof organizationSchema>) => {
    toast({ title: 'Organization settings saved successfully' });
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    userForm.reset(user);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: 'User deleted successfully' });
  };

  const handleResetPassword = (userId: number) => {
    toast({ title: 'Password reset email sent successfully' });
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' }
        : u
    ));
    toast({ title: 'User status updated' });
  };

  const handleNotificationChange = (setting: string, value: boolean | string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const addDepartment = (department: string) => {
    if (!activeDepartments.includes(department)) {
      setActiveDepartments([...activeDepartments, department]);
    }
  };

  const removeDepartment = (department: string) => {
    setActiveDepartments(activeDepartments.filter(d => d !== department));
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and system configuration.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-2'}`}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="organization" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Audit Logs
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information and change your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={profileForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="border-t pt-4 mt-6">
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage your email alerts and notification preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Alerts</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="low-stock">Low Stock Warnings</Label>
                        <p className="text-sm text-muted-foreground">Get notified when inventory is running low</p>
                      </div>
                      <Switch
                        id="low-stock"
                        checked={notificationSettings.lowStockAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('lowStockAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-orders">New Orders Placed</Label>
                        <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
                      </div>
                      <Switch
                        id="new-orders"
                        checked={notificationSettings.newOrderAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('newOrderAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="order-status">Order Status Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified when order status changes</p>
                      </div>
                      <Switch
                        id="order-status"
                        checked={notificationSettings.orderStatusUpdates}
                        onCheckedChange={(checked) => handleNotificationChange('orderStatusUpdates', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="shipment-updates">Shipment Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about shipment status changes</p>
                      </div>
                      <Switch
                        id="shipment-updates"
                        checked={notificationSettings.shipmentUpdates}
                        onCheckedChange={(checked) => handleNotificationChange('shipmentUpdates', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Report Frequency</h3>
                  <div className="max-w-xs">
                    <Select
                      value={notificationSettings.reportFrequency}
                      onValueChange={(value) => handleNotificationChange('reportFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Settings Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="organization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>
                    Manage hospital/clinic information and global settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...organizationForm}>
                    <form onSubmit={organizationForm.handleSubmit(handleOrganizationSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={organizationForm.control}
                            name="hospitalName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hospital/Clinic Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={organizationForm.control}
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
                            control={organizationForm.control}
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
                          <FormField
                            control={organizationForm.control}
                            name="reorderThreshold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Global Reorder Threshold</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={organizationForm.control}
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
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Departments</h3>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {activeDepartments.map((dept) => (
                              <Badge key={dept} variant="default" className="flex items-center gap-1">
                                {dept}
                                <button
                                  type="button"
                                  onClick={() => removeDepartment(dept)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Select onValueChange={addDepartment}>
                              <SelectTrigger className="max-w-xs">
                                <SelectValue placeholder="Add department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments
                                  .filter(dept => !activeDepartments.includes(dept))
                                  .map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Organization Settings
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* User Management Tab - Admin Only */}
          {isAdmin && (
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
                              name="contactNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                  <Select onValueChange={field.onChange} value={field.value}>
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>
                              {user.role}
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
                                onClick={() => handleResetPassword(user.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
          )}

          {/* Audit Logs Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Audit Logs</CardTitle>
                      <CardDescription>
                        View recent system activities and user actions.
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search logs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Item Affected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">{log.dateTime}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.itemAffected}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * logsPerPage + 1, filteredLogs.length)} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} results
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;