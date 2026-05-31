'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user } = useAppContext();
  const [users, setUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch('/api/mysql/users');
      const data = await res.json();
      if (data.success) setUsers(data.users ?? []);
    } catch { }
    setIsUsersLoading(false);
  };

  const handleRoleChange = async (uid: string, newRole: 'user' | 'admin') => {
    try {
      const res = await fetch('/api/mysql/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: newRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast({ title: 'Role Updated', description: `User role changed to ${newRole}.` });
      loadUsers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u: any) => {
    const term = searchQuery.toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm">Manage user accounts and permissions.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>View all accounts and manage their roles.</CardDescription>
          </div>
          <Button variant="outline" onClick={loadUsers} disabled={isUsersLoading}>
            {isUsersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => setSearchQuery('')}
                className="text-xs h-9 px-3"
              >
                Clear
              </Button>
            )}
          </div>

          {isUsersLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u: any) => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin'
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-slate-100 text-slate-600'
                        }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {u.uid === user?.uid ? (
                        <span className="text-xs text-muted-foreground italic">You</span>
                      ) : u.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-slate-600 border-slate-300 hover:bg-slate-50"
                          onClick={() => handleRoleChange(u.uid, 'user')}
                        >
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-cyan-700 border-cyan-300 hover:bg-cyan-50"
                          onClick={() => handleRoleChange(u.uid, 'admin')}
                        >
                          Make Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      {searchQuery ? 'No matching users found.' : 'No users found. Click Refresh to load.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

