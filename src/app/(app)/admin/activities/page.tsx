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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

    const loadActivities = async (category?: 'user' | 'admin') => {
        setIsActivitiesLoading(true);
        try {
            const url = category ? `/api/mysql/activity-logs?category=${category}` : '/api/mysql/activity-logs';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setActivities(data.logs ?? []);
        } catch { }
        setIsActivitiesLoading(false);
    };

    useEffect(() => {
        loadActivities();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
                <p className="text-muted-foreground text-sm">Track user and administrator actions across the system.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>System Activity</CardTitle>
                        <CardDescription>View and filter recent logs.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => loadActivities()} disabled={isActivitiesLoading}>
                        {isActivitiesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full" onValueChange={(v) => loadActivities(v === 'all' ? undefined : v as any)}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All Activities</TabsTrigger>
                            <TabsTrigger value="user">User Actions</TabsTrigger>
                            <TabsTrigger value="admin">Admin Actions</TabsTrigger>
                        </TabsList>

                        {isActivitiesLoading ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading activities...
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.map((log: any, index: number) => (
                                        <TableRow key={`${log.id}-${index}`}>
                                            <TableCell className="font-medium">
                                                {log.username || 'Unknown'}
                                                <div className="text-[10px] text-muted-foreground">{log.uid}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-slate-700">{log.action}</span>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate text-xs" title={log.details}>
                                                {log.details || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.category === 'admin'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-xs whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {activities.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                                No activities recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
