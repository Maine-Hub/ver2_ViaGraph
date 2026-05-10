'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, User, Calendar, MapPin, Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
    const { user, setUser, role, loading } = useAppContext();
    const { toast } = useToast();
    
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Password Reset States
    const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [lastPwdChanged, setLastPwdChanged] = useState<string>('3 months ago');

    useEffect(() => {
        if (user) {
            setNewUsername(user.username || '');
            fetchUserDetailed();
        }
    }, [user]);

    const fetchUserDetailed = async () => {
        try {
            const res = await fetch('/api/mysql/users/me');
            const data = await res.json();
            if (data.success && data.user.password_changed_at) {
                setLastPwdChanged(formatRelativeTime(data.user.password_changed_at));
            }
        } catch (err) {
            console.error('Failed to fetch detailed user info', err);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    if (!user) return null;

    const handleUpdateProfile = async () => {
        if (newUsername === user.username) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/mysql/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername }),
            });
            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                toast({
                    title: "Profile updated",
                    description: "Your changes have been saved successfully.",
                });
                setIsEditing(false);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update failed",
                description: error.message || "Something went wrong.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPwd !== confirmPwd) {
            toast({
                variant: "destructive",
                title: "Passwords mismatch",
                description: "New password and confirmation do not match.",
            });
            return;
        }

        setPwdLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Password updated",
                    description: "Your security credentials have been refreshed.",
                });
                setPwdDialogOpen(false);
                setCurrentPwd('');
                setNewPwd('');
                setConfirmPwd('');
                setLastPwdChanged('Just now');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Reset failed",
                description: error.message || "Incorrect current password.",
            });
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Account Settings</h1>
                <p className="text-slate-500 text-sm">Manage your personal presence and security preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Avatar & Summary */}
                <Card className="lg:col-span-1 h-fit overflow-hidden border-slate-200/60 shadow-sm">
                    <div className="h-24 bg-gradient-to-r from-cyan-500 to-teal-600 opacity-80" />
                    <CardContent className="relative pt-0 flex flex-col items-center text-center">
                        <div className="-mt-12 mb-4 p-1 bg-white dark:bg-slate-950 rounded-full shadow-lg">
                            <Avatar className="h-20 w-20 border-2 border-white dark:border-slate-950">
                                <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200/200`} />
                                <AvatarFallback className="text-2xl bg-cyan-100 text-cyan-700 font-bold">
                                    {user.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {user.username || user.email?.split('@')[0]}
                        </h2>
                        <Badge className="mt-2 bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20 px-3 py-0.5 rounded-full capitalize">
                            {role}
                        </Badge>
                        
                        <Separator className="my-6" />
                        
                        <div className="w-full space-y-4 text-sm text-left px-2">
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg"><Calendar className="h-4 w-4" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Member Since</p>
                                    <span className="font-medium">May 2026</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg"><MapPin className="h-4 w-4" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                                    <span className="font-medium">Iligan City, PH</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your public username and display name.</CardDescription>
                                </div>
                                {!isEditing && (
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                        <User className="h-3 w-3" /> Display Username
                                    </label>
                                    {isEditing ? (
                                        <Input 
                                            value={newUsername} 
                                            onChange={e => setNewUsername(e.target.value)}
                                            placeholder="Enter new username"
                                            className="bg-white"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between group">
                                            {user.username}
                                            <CheckCircle2 className="h-4 w-4 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Email Address
                                    </label>
                                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 rounded-xl font-medium text-slate-500 italic flex items-center gap-2 cursor-not-allowed">
                                        {user.email}
                                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase not-italic">Verified</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 pl-1">Email cannot be changed for security reasons.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                        <Shield className="h-3 w-3" /> System Role
                                    </label>
                                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800 rounded-xl font-medium flex items-center gap-3">
                                        <Badge variant="outline" className="capitalize border-slate-300">{role}</Badge>
                                        <span className="text-xs text-slate-400 font-normal">
                                            {role === 'admin' ? 'Full administrative access' : 'Standard passenger access'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        {isEditing && (
                            <CardFooter className="bg-slate-50/50 dark:bg-slate-900/30 border-t flex justify-end gap-3 py-3">
                                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setNewUsername(user.username); }}>Cancel</Button>
                                <Button size="sm" onClick={handleUpdateProfile} disabled={isSaving || !newUsername}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    <Card className="border-red-100/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-red-50/30 dark:bg-red-950/10 pb-4">
                            <CardTitle className="text-red-800 dark:text-red-400 flex items-center gap-2 text-lg">
                                <KeyRound className="h-5 w-5" /> Security & Privacy
                            </CardTitle>
                            <CardDescription>Update your credentials to keep your account safe.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white dark:bg-slate-950">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Password Reset</p>
                                    <p className="text-xs text-slate-500">Last changed {lastPwdChanged}</p>
                                </div>
                                <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-cyan-600 border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700">Change Password</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Update Password</DialogTitle>
                                            <DialogDescription>
                                                Please enter your current password to set a new one.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="current">Current Password</Label>
                                                <Input id="current" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="grid gap-2">
                                                <Label htmlFor="new">New Password</Label>
                                                <Input id="new" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="confirm">Confirm New Password</Label>
                                                <Input id="confirm" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setPwdDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleChangePassword} disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}>
                                                {pwdLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                Update Credentials
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
