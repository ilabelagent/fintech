import { useState, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Users,
  Bot,
  TrendingUp,
  MessageSquare,
  Shield,
  Activity,
  Zap,
  Trophy,
  Heart,
  Sparkles,
  BrainCircuit,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import AgentChat from '@/components/agent-chat';

export default function AdminPage() {
  const { toast } = useToast();
  const [userPage, setUserPage] = useState(0);
  const [botPage, setBotPage] = useState(0);
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [trainingDialog, setTrainingDialog] = useState(false);
  const [mintElementDialog, setMintElementDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('agents');
  const [elementFormData, setElementFormData] = useState({
    name: '',
    description: '',
    elementType: 'spiritual',
    power: 100,
    rarity: 'common',
    totalSupply: 100,
    imageUrl: '',
    animationUrl: '',
    attributes: '{}',
  });

  const usersPerPage = 10;
  const botsPerPage = 10;

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users', { limit: usersPerPage, offset: userPage * usersPerPage }],
  });

  // Fetch bots
  const { data: botsData, isLoading: botsLoading } = useQuery({
    queryKey: ['/api/admin/bots', { limit: botsPerPage, offset: botPage * botsPerPage }],
  });

  // Fetch bot training details
  const { data: trainingData } = useQuery({
    queryKey: ['/api/admin/bots', selectedBot?.id, 'training'],
    enabled: !!selectedBot,
  });

  // Fetch audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ['/api/admin/audit-logs', { limit: 20 }],
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return apiRequest('PATCH', `/api/admin/users/${userId}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Success',
        description: 'User status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    },
  });

  // Start training mutation
  const startTrainingMutation = useMutation({
    mutationFn: async ({ botId, sessionType, trainingDataset }: any) => {
      return apiRequest('POST', `/api/admin/bots/${botId}/train`, { sessionType, trainingDataset });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bots'] });
      setTrainingDialog(false);
      toast({
        title: 'Success',
        description: 'Training session started successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start training session',
        variant: 'destructive',
      });
    },
  });

  // Send broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/chat/send', data);
    },
    onSuccess: () => {
      setBroadcastDialog(false);
      toast({
        title: 'Success',
        description: 'Message broadcast sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send broadcast',
        variant: 'destructive',
      });
    },
  });

  // Mint ethereal element mutation
  const mintElementMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/assets/ethereal/mint', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ethereal/marketplace'] });
      setMintElementDialog(false);
      setElementFormData({
        name: '',
        description: '',
        elementType: 'spiritual',
        power: 100,
        rarity: 'common',
        totalSupply: 100,
        imageUrl: '',
        animationUrl: '',
        attributes: '{}',
      });
      toast({
        title: 'Success',
        description: 'Ethereal element minted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mint element',
        variant: 'destructive',
      });
    },
  });

  const handleBroadcast = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    sendBroadcastMutation.mutate({
      recipientType: formData.get('recipientType'),
      message: formData.get('message'),
      title: formData.get('title'),
      priority: formData.get('priority'),
    });
  };

  const handleStartTraining = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTrainingMutation.mutate({
      botId: selectedBot.id,
      sessionType: formData.get('sessionType'),
      trainingDataset: formData.get('trainingDataset'),
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Control Panel</h1>
          <p className="text-muted-foreground">Oversee the entire Kingdom</p>
        </div>
        <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-broadcast">
              <MessageSquare className="mr-2 h-4 w-4" />
              Broadcast Message
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-broadcast">
            <DialogHeader>
              <DialogTitle>Broadcast Message</DialogTitle>
              <DialogDescription>Send a message to users</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBroadcast}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Recipient Type</label>
                  <Select name="recipientType" defaultValue="all">
                    <SelectTrigger data-testid="select-recipient-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="specific_users">Specific Users</SelectItem>
                      <SelectItem value="user_group">User Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    name="title"
                    placeholder="Message title"
                    data-testid="input-broadcast-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    name="message"
                    placeholder="Enter your message"
                    data-testid="textarea-broadcast-message"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  disabled={sendBroadcastMutation.isPending}
                  data-testid="button-send-broadcast"
                >
                  Send Broadcast
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* System Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {(analytics as any)?.totalUsers || 0}
              </div>
            )}
          </CardContent>
          <div className="p-4 pt-0">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setActiveTab('users')}
              data-testid="button-view-all-users"
            >
              View All Users
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-active-bots">
                {(analytics as any)?.activeBots || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-learning-sessions">
                {(analytics as any)?.totalLearningSessions || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-avg-win-rate">
                {(analytics as any)?.avgWinRate || 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" data-testid="tab-agents">
            <BrainCircuit className="mr-2 h-4 w-4" />
            AI Agents
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="bots" data-testid="tab-bots">
            <Bot className="mr-2 h-4 w-4" />
            Bot Training
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="ethereal" data-testid="tab-ethereal">
            <Sparkles className="mr-2 h-4 w-4" />
            Ethereal Elements
          </TabsTrigger>
        </TabsList>

        {/* AI Agent Conversational Interface */}
        <TabsContent value="agents" className="space-y-4">
          <AgentChat />
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all users in the Kingdom</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>KYC Status</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(usersData as any)?.users?.map((user: any) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.kycStatus === 'approved' ? 'default' : 'secondary'}
                            >
                              {user.kycStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isAdmin ? 'destructive' : 'outline'}>
                              {user.isAdmin ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={user.isAdmin ? 'outline' : 'default'}
                              onClick={() =>
                                updateUserMutation.mutate({
                                  userId: user.id,
                                  isAdmin: !user.isAdmin,
                                })
                              }
                              disabled={updateUserMutation.isPending}
                              data-testid={`button-toggle-admin-${user.id}`}
                            >
                              {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                      disabled={userPage === 0}
                      data-testid="button-prev-users"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {userPage + 1} of{' '}
                      {Math.ceil(((usersData as any)?.total || 0) / usersPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setUserPage((p) => p + 1)}
                      disabled={
                        userPage >= Math.ceil(((usersData as any)?.total || 0) / usersPerPage) - 1
                      }
                      data-testid="button-next-users"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot Training */}
        <TabsContent value="bots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Training Dashboard</CardTitle>
              <CardDescription>Monitor and train all trading bots</CardDescription>
            </CardHeader>
            <CardContent>
              {botsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Strategy</TableHead>
                        <TableHead>Win Rate</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Avg Skill Level</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(botsData as any)?.bots?.map((bot: any) => (
                        <TableRow key={bot.id} data-testid={`row-bot-${bot.id}`}>
                          <TableCell className="font-medium">{bot.name}</TableCell>
                          <TableCell>{bot.user?.email}</TableCell>
                          <TableCell>
                            <Badge>{bot.strategy}</Badge>
                          </TableCell>
                          <TableCell>{parseFloat(bot.winRate || '0').toFixed(2)}%</TableCell>
                          <TableCell>{bot.skillsCount || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={bot.avgSkillLevel || 0} className="w-20" />
                              <span className="text-sm">{Math.round(bot.avgSkillLevel || 0)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{bot.sessionsCount || 0}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBot(bot);
                                setTrainingDialog(true);
                              }}
                              data-testid={`button-train-${bot.id}`}
                            >
                              <Zap className="mr-1 h-3 w-3" />
                              Train
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2"
                              onClick={() => {
                                // Placeholder for edit action
                                toast({
                                  title: 'Edit Bot',
                                  description: `Editing bot: ${bot.name}`,
                                });
                              }}
                              data-testid={`button-edit-bot-${bot.id}`}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setBotPage((p) => Math.max(0, p - 1))}
                      disabled={botPage === 0}
                      data-testid="button-prev-bots"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {botPage + 1} of{' '}
                      {Math.ceil(((botsData as any)?.total || 0) / botsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setBotPage((p) => p + 1)}
                      disabled={
                        botPage >= Math.ceil(((botsData as any)?.total || 0) / botsPerPage) - 1
                      }
                      data-testid="button-next-bots"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bot Training Progress Chart */}
          {selectedBot && trainingData && (
            <Card>
              <CardHeader>
                <CardTitle>Training Progress - {selectedBot.name}</CardTitle>
                <CardDescription>Learning sessions and skill development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Skills</h3>
                    <div className="space-y-2">
                      {(trainingData as any)?.skills?.map((skill: any) => (
                        <div key={skill.id} className="flex items-center justify-between">
                          <span className="text-sm">{skill.skillName}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={skill.skillLevel} className="w-24" />
                            <span className="text-sm font-medium">{skill.skillLevel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Recent Sessions</h3>
                    <div className="space-y-2">
                      {(trainingData as any)?.sessions?.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="flex items-center justify-between text-sm">
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                            {session.sessionType}
                          </Badge>
                          <span className="text-muted-foreground">
                            {session.improvementRate
                              ? `+${session.improvementRate}%`
                              : session.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Logs</CardTitle>
              <CardDescription>Recent admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditLogs as any)?.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.admin?.user?.email}</TableCell>
                      <TableCell>
                        <Badge>{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.targetType}</TableCell>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ethereal Elements */}
        <TabsContent value="ethereal" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ethereal Elements Minting</CardTitle>
                <CardDescription>
                  Create divine collectible elements for the marketplace
                </CardDescription>
              </div>
              <Dialog open={mintElementDialog} onOpenChange={setMintElementDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-mint-element">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Mint New Element
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="dialog-mint-element">
                  <DialogHeader>
                    <DialogTitle>Mint Ethereal Element</DialogTitle>
                    <DialogDescription>Create a new divine collectible element</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={elementFormData.name}
                          onChange={(e) =>
                            setElementFormData({ ...elementFormData, name: e.target.value })
                          }
                          placeholder="Divine Flame"
                          data-testid="input-element-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Element Type</label>
                        <Select
                          value={elementFormData.elementType}
                          onValueChange={(value) =>
                            setElementFormData({ ...elementFormData, elementType: value })
                          }
                        >
                          <SelectTrigger data-testid="select-element-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spiritual">Spiritual</SelectItem>
                            <SelectItem value="divine">Divine</SelectItem>
                            <SelectItem value="quantum">Quantum</SelectItem>
                            <SelectItem value="dimensional">Dimensional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={elementFormData.description}
                        onChange={(e) =>
                          setElementFormData({ ...elementFormData, description: e.target.value })
                        }
                        placeholder="A powerful divine element forged in the heavens..."
                        rows={3}
                        data-testid="textarea-element-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Rarity</label>
                        <Select
                          value={elementFormData.rarity}
                          onValueChange={(value) =>
                            setElementFormData({ ...elementFormData, rarity: value })
                          }
                        >
                          <SelectTrigger data-testid="select-element-rarity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                            <SelectItem value="legendary">Legendary</SelectItem>
                            <SelectItem value="divine">Divine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Power (0-1000)</label>
                        <Input
                          type="number"
                          min="0"
                          max="1000"
                          value={elementFormData.power}
                          onChange={(e) =>
                            setElementFormData({
                              ...elementFormData,
                              power: parseInt(e.target.value) || 0,
                            })
                          }
                          data-testid="input-element-power"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Total Supply (0 for unlimited)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={elementFormData.totalSupply}
                          onChange={(e) =>
                            setElementFormData({
                              ...elementFormData,
                              totalSupply: parseInt(e.target.value) || 0,
                            })
                          }
                          data-testid="input-element-supply"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Image URL</label>
                        <Input
                          value={elementFormData.imageUrl}
                          onChange={(e) =>
                            setElementFormData({ ...elementFormData, imageUrl: e.target.value })
                          }
                          placeholder="https://example.com/image.png"
                          data-testid="input-element-image"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Animation URL (optional)</label>
                      <Input
                        value={elementFormData.animationUrl}
                        onChange={(e) =>
                          setElementFormData({ ...elementFormData, animationUrl: e.target.value })
                        }
                        placeholder="https://example.com/animation.mp4"
                        data-testid="input-element-animation"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Attributes (JSON)</label>
                      <Textarea
                        value={elementFormData.attributes}
                        onChange={(e) =>
                          setElementFormData({ ...elementFormData, attributes: e.target.value })
                        }
                        placeholder='{"element": "fire", "strength": 10}'
                        rows={3}
                        data-testid="textarea-element-attributes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setMintElementDialog(false)}
                      data-testid="button-cancel-mint"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const data: any = {
                          name: elementFormData.name,
                          description: elementFormData.description,
                          elementType: elementFormData.elementType,
                          power: elementFormData.power,
                          rarity: elementFormData.rarity,
                          totalSupply: elementFormData.totalSupply || null,
                          imageUrl: elementFormData.imageUrl || null,
                          animationUrl: elementFormData.animationUrl || null,
                        };
                        try {
                          if (elementFormData.attributes) {
                            data.attributes = JSON.parse(elementFormData.attributes);
                          }
                        } catch (e) {
                          toast({
                            title: 'Error',
                            description: 'Invalid JSON in attributes field',
                            variant: 'destructive',
                          });
                          return;
                        }
                        mintElementMutation.mutate(data);
                      }}
                      disabled={
                        mintElementMutation.isPending ||
                        !elementFormData.name ||
                        !elementFormData.description
                      }
                      data-testid="button-confirm-mint"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {mintElementMutation.isPending ? 'Minting...' : 'Mint Element'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Sparkles className="mx-auto h-12 w-12 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Divine Element Minting</h3>
                <p className="text-muted-foreground mb-4">
                  Create unique ethereal elements for users to collect and trade
                </p>
                <p className="text-sm text-muted-foreground">
                  Elements will appear in the marketplace for users to purchase
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Training Dialog */}
      <Dialog open={trainingDialog} onOpenChange={setTrainingDialog}>
        <DialogContent data-testid="dialog-training">
          <DialogHeader>
            <DialogTitle>Start Training Session</DialogTitle>
            <DialogDescription>Configure training for {selectedBot?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartTraining}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Session Type</label>
                <Select name="sessionType" defaultValue="supervised">
                  <SelectTrigger data-testid="select-session-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supervised">Supervised Learning</SelectItem>
                    <SelectItem value="reinforcement">Reinforcement Learning</SelectItem>
                    <SelectItem value="transfer">Transfer Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Training Dataset</label>
                <Input
                  name="trainingDataset"
                  placeholder="Dataset name or path"
                  data-testid="input-training-dataset"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={startTrainingMutation.isPending}
                data-testid="button-start-training"
              >
                <Zap className="mr-2 h-4 w-4" />
                Start Training
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
