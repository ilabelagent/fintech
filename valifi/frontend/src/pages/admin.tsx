import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Shield, Activity, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialog, setRoleDialog] = useState(false);
  const [kycDialog, setKycDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [kycStatus, setKycStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newRole, setNewRole] = useState("");

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users?limit=50&offset=0"],
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs?limit=50&offset=0"],
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "Role updated successfully" });
      setRoleDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });

  // Update KYC status mutation
  const updateKYCMutation = useMutation({
    mutationFn: async ({ userId, kycStatus, rejectionReason }: { userId: string; kycStatus: string; rejectionReason?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/kyc`, { kycStatus, rejectionReason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "KYC status updated successfully" });
      setKycDialog(false);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to update KYC status", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "User deleted successfully" });
      setDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateRole = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const handleUpdateKYC = () => {
    if (selectedUser && kycStatus) {
      updateKYCMutation.mutate({ 
        userId: selectedUser.id, 
        kycStatus,
        rejectionReason: kycStatus === 'Rejected' ? rejectionReason : undefined
      });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const getKYCBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-purple-500"><Shield className="w-3 h-3 mr-1" /> Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Valifi Admin Panel
          </h1>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{analytics?.totalUsers || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{analytics?.totalUsers || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pending KYC</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {usersData?.users?.filter((u: any) => u.kycStatus === 'Pending').length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-8 w-20 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {usersData?.users?.filter((u: any) => u.role === 'admin' || u.role === 'superadmin').length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-gray-700">
              <Activity className="w-4 h-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Users</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage user accounts, roles, and KYC status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full bg-gray-700" />
                    <Skeleton className="h-12 w-full bg-gray-700" />
                    <Skeleton className="h-12 w-full bg-gray-700" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Email</TableHead>
                          <TableHead className="text-gray-300">Username</TableHead>
                          <TableHead className="text-gray-300">Role</TableHead>
                          <TableHead className="text-gray-300">KYC Status</TableHead>
                          <TableHead className="text-gray-300">Balance</TableHead>
                          <TableHead className="text-gray-300">Created</TableHead>
                          <TableHead className="text-gray-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData?.users?.map((user: any) => (
                          <TableRow key={user.id} className="border-gray-700">
                            <TableCell className="text-white">{user.email}</TableCell>
                            <TableCell className="text-gray-300">{user.username}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getKYCBadge(user.kycStatus)}</TableCell>
                            <TableCell className="text-gray-300">${user.balance?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewRole(user.role);
                                  setRoleDialog(true);
                                }}
                              >
                                Change Role
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500 text-green-400 hover:bg-green-500/10"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setKycStatus(user.kycStatus);
                                  setKycDialog(true);
                                }}
                              >
                                Update KYC
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialog(true);
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Activity Audit Logs</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete audit trail of all system activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full bg-gray-700" />
                    <Skeleton className="h-12 w-full bg-gray-700" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Timestamp</TableHead>
                          <TableHead className="text-gray-300">Activity Type</TableHead>
                          <TableHead className="text-gray-300">Description</TableHead>
                          <TableHead className="text-gray-300">User</TableHead>
                          <TableHead className="text-gray-300">IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs?.map((log: any) => (
                          <TableRow key={log.id} className="border-gray-700">
                            <TableCell className="text-gray-400 text-sm">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {log.activityType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{log.description}</TableCell>
                            <TableCell className="text-gray-300">{log.userId}</TableCell>
                            <TableCell className="text-gray-400">{log.ipAddress || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Change User Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole} 
              disabled={updateRoleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update KYC Dialog */}
      <Dialog open={kycDialog} onOpenChange={setKycDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Update KYC Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update KYC status for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={kycStatus} onValueChange={setKycStatus}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select KYC status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {kycStatus === 'Rejected' && (
              <Textarea
                placeholder="Rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycDialog(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateKYC} 
              disabled={updateKYCMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateKYCMutation.isPending ? "Updating..." : "Update KYC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser} 
              disabled={deleteUserMutation.isPending}
              variant="destructive"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
