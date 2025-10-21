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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Bell,
  Users,
  Edit,
  Trash2,
  UserPlus,
  Save,
} from 'lucide-react';
import { UserData } from '@/types';

// Form schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
});

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['Administrator', 'Healthcare Staff']),
  contactNumber: z.string().min(10, 'Contact number is required'),
  password: z.string().optional(),
});

const Settings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: 'admin' | 'staff' } | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    newOrderAlerts: true,
    orderStatusUpdates: true,
    shipmentUpdates: false,
    reportFrequency: 'weekly',
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', contactNumber: '' },
  });

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: 'Healthcare Staff', contactNumber: '', password: '' },
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setCurrentUser({
        id: parsedUser.UserID,
        name: parsedUser.Name,
        role: parsedUser.Role === 'Administrator' ? 'admin' : 'staff',
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/users/${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          profileForm.reset({
            name: data.name,
            email: data.email,
            contactNumber: data.contactNumber || '',
          });
        });

      if (currentUser.role === 'admin') {
        fetch('/api/users').then((res) => res.json()).then(setUsers);
      }
    }
  }, [currentUser, profileForm]);

  const isAdmin = currentUser?.role === 'admin';

  const handleProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((res) => {
        if (!res.ok) {
           // Try to get error message from server
           return res.json().then(errData => {
             throw new Error(errData.message || 'Failed to update profile');
           });
        }
        return res.json(); // Parse the successful JSON response
      })
      .then((data) => {
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.dispatchEvent(new Event('userUpdated'));
        
        toast({ title: 'Success!', description: 'Your profile has been updated.' });
      })
      .catch((error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      });
  };

  const handleUserSubmit = (values: z.infer<typeof userSchema>) => {
    if (!editingUser && !values.password) {
      userForm.setError('password', { type: 'manual', message: 'Password is required for new users.' });
      return;
    }

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((data) => {
        if (editingUser && values.password) {
          fetch(`/api/users/${editingUser.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: values.password }),
          });
        }

        if (editingUser) {
          setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u)));
          toast({ title: 'User updated successfully' });
        } else {
          setUsers([...users, data]);
          toast({ title: 'User added successfully' });
        }
        setIsUserDialogOpen(false);
        setEditingUser(null);
        userForm.reset();
      })
      .catch(() => toast({ title: 'Error saving user', variant: 'destructive' }));
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    userForm.reset({ ...user, password: '' });
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    fetch(`/api/users/${userId}`, { method: 'DELETE' })
      .then((res) => {
        if (res.ok) {
          setUsers(users.filter((u) => u.id !== userId));
          toast({ title: 'User deleted successfully' });
        } else {
          throw new Error('Failed to delete user');
        }
      })
      .catch((error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }));
  };

  const handleNotificationChange = (setting: string, value: boolean | string) => {
    setNotificationSettings((prev) => ({ ...prev, [setting]: value }));
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
          <p className="text-muted-foreground">Manage your profile and system configuration.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
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
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage your email alerts and notification preferences.</CardDescription>
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
                      <Switch id="low-stock" checked={notificationSettings.lowStockAlerts} onCheckedChange={(checked) => handleNotificationChange('lowStockAlerts', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="new-orders">New Orders Placed</Label>
                        <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
                      </div>
                      <Switch id="new-orders" checked={notificationSettings.newOrderAlerts} onCheckedChange={(checked) => handleNotificationChange('newOrderAlerts', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="order-status">Order Status Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified when order status changes</p>
                      </div>
                      <Switch id="order-status" checked={notificationSettings.orderStatusUpdates} onCheckedChange={(checked) => handleNotificationChange('orderStatusUpdates', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="shipment-updates">Shipment Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified about shipment status changes</p>
                      </div>
                      <Switch id="shipment-updates" checked={notificationSettings.shipmentUpdates} onCheckedChange={(checked) => handleNotificationChange('shipmentUpdates', checked)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Report Frequency</h3>
                  <div className="max-w-xs">
                    <Select value={notificationSettings.reportFrequency} onValueChange={(value) => handleNotificationChange('reportFrequency', value)}>
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

          {isAdmin && (
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage user accounts and their roles.</CardDescription>
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
                          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                        </DialogHeader>
                        <Form {...userForm}>
                          <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                            <FormField control={userForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={userForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={userForm.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={userForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Administrator">Administrator</SelectItem><SelectItem value="Healthcare Staff">Healthcare Staff</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={userForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} placeholder={editingUser ? 'Leave blank to keep current password' : 'Required for new user'} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
                              <Button type="submit">{editingUser ? 'Update User' : 'Add User'}</Button>
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
                            <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;