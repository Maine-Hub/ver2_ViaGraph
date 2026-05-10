'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, ShieldCheck, KeyRound, ShieldQuestion, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'selection' | 'email' | 'username' | 'security_id' | 'security_answer' | 'reset_pwd' | 'success'>('selection');
    
    // Recovery Data
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/recover-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) setStep('success');
            else throw new Error(data.message);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Recovery Failed', description: error.message });
        } finally { setIsLoading(false); }
    };

    const handleSubmitUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/recover-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'Email Found', description: `Your registered email is: ${data.email}` });
                setStep('selection');
            } else throw new Error(data.message);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Recovery Failed', description: error.message });
        } finally { setIsLoading(false); }
    };

    const handleFetchQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/get-security-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier }),
            });
            const data = await res.json();
            if (data.success) {
                setQuestion(data.question);
                setStep('security_answer');
            } else throw new Error(data.message);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Account Not Found', description: error.message });
        } finally { setIsLoading(false); }
    };

    const handleVerifyAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/verify-security-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, securityAnswer: answer }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('reset_pwd');
            } else throw new Error(data.message);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
        } finally { setIsLoading(false); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Mismatch', description: 'Passwords do not match.' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, securityAnswer: answer, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'Success', description: 'Your password has been reset.' });
                setStep('success');
            } else throw new Error(data.message);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
        } finally { setIsLoading(false); }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #020617;
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                }
                .auth-card {
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(45, 212, 191, 0.1);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 420px;
                    padding: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .auth-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #f1f5f9;
                    margin-bottom: 8px;
                    text-align: center;
                }
                .auth-subtitle {
                    font-size: 14px;
                    color: #94a3b8;
                    margin-bottom: 32px;
                    text-align: center;
                    line-height: 1.5;
                }
                .auth-field {
                    margin-bottom: 20px;
                }
                .auth-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #94a3b8;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .auth-input {
                    width: 100%;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #f1f5f9;
                    font-size: 15px;
                    transition: all 0.2s ease;
                }
                .auth-input:focus {
                    outline: none;
                    border-color: #2dd4bf;
                    background: rgba(30, 41, 59, 0.8);
                    box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1);
                }
                .auth-btn {
                    width: 100%;
                    background: #2dd4bf;
                    color: #0f172a;
                    border: none;
                    border-radius: 12px;
                    padding: 14px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .auth-btn:hover {
                    background: #5eead4;
                    transform: translateY(-1px);
                }
                .auth-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: #94a3b8;
                    text-decoration: none;
                    font-size: 14px;
                    margin-top: 24px;
                    transition: color 0.2s ease;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    width: 100%;
                }
                .auth-back:hover {
                    color: #f1f5f9;
                }
                .option-card {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .option-card:hover {
                    background: rgba(30, 41, 59, 0.6);
                    border-color: rgba(45, 212, 191, 0.3);
                }
                .option-icon {
                    width: 36px;
                    height: 36px;
                    background: rgba(45, 212, 191, 0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2dd4bf;
                }
                .option-text h3 {
                    font-size: 14px;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                }
                .option-text p {
                    font-size: 11px;
                    color: #64748b;
                    margin: 2px 0 0 0;
                }
                .success-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(34, 197, 94, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #22c55e;
                    margin: 0 auto 24px auto;
                }
            `}} />
            <div className="auth-page">
                <div className="auth-card">
                    {step === 'selection' && (
                        <>
                            <h1 className="auth-title">Account Recovery</h1>
                            <p className="auth-subtitle">Choose how you&apos;d like to recover your account.</p>
                            
                            <div className="option-card" onClick={() => setStep('email')}>
                                <div className="option-icon"><Mail className="h-5 w-5" /></div>
                                <div className="option-text">
                                    <h3>Email Recovery</h3>
                                    <p>Reset via a link sent to your inbox.</p>
                                </div>
                            </div>
                            
                            <div className="option-card" onClick={() => setStep('security_id')}>
                                <div className="option-icon"><ShieldQuestion className="h-5 w-5" /></div>
                                <div className="option-text">
                                    <h3>Security Question</h3>
                                    <p>Reset by answering your secret question.</p>
                                </div>
                            </div>

                            <div className="option-card" onClick={() => setStep('username')}>
                                <div className="option-icon"><User className="h-5 w-5" /></div>
                                <div className="option-text">
                                    <h3>Forgot Email</h3>
                                    <p>Find your email using your username.</p>
                                </div>
                            </div>

                            <Link href="/signin" className="auth-back">
                                <ArrowLeft className="h-4 w-4" /> Back to Login
                            </Link>
                        </>
                    )}

                    {step === 'email' && (
                        <>
                            <h1 className="auth-title">Email Recovery</h1>
                            <p className="auth-subtitle">Enter your email and we&apos;ll send you a recovery link.</p>
                            <form onSubmit={handleSubmitEmail}>
                                <div className="auth-field">
                                    <label className="auth-label">Email Address</label>
                                    <input type="email" className="auth-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                                </button>
                            </form>
                            <button onClick={() => setStep('selection')} className="auth-back"><ArrowLeft className="h-4 w-4" /> Back</button>
                        </>
                    )}

                    {step === 'security_id' && (
                        <>
                            <h1 className="auth-title">Security Recovery</h1>
                            <p className="auth-subtitle">Enter your email or username to find your security question.</p>
                            <form onSubmit={handleFetchQuestion}>
                                <div className="auth-field">
                                    <label className="auth-label">Email or Username</label>
                                    <input type="text" className="auth-input" placeholder="Enter your ID" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Find Question'}
                                </button>
                            </form>
                            <button onClick={() => setStep('selection')} className="auth-back"><ArrowLeft className="h-4 w-4" /> Back</button>
                        </>
                    )}

                    {step === 'security_answer' && (
                        <>
                            <h1 className="auth-title">Security Answer</h1>
                            <p className="auth-subtitle">{question}</p>
                            <form onSubmit={handleVerifyAnswer}>
                                <div className="auth-field">
                                    <label className="auth-label">Your Secret Answer</label>
                                    <input type="text" className="auth-input" placeholder="Enter answer" value={answer} onChange={e => setAnswer(e.target.value)} required />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Answer'}
                                </button>
                            </form>
                            <button onClick={() => setStep('security_id')} className="auth-back"><ArrowLeft className="h-4 w-4" /> Back</button>
                        </>
                    )}

                    {step === 'reset_pwd' && (
                        <>
                            <h1 className="auth-title">Set New Password</h1>
                            <p className="auth-subtitle">Your answer was correct! Please set your new password below.</p>
                            <form onSubmit={handleResetPassword}>
                                <div className="auth-field">
                                    <label className="auth-label">New Password</label>
                                    <input type="password" className="auth-input" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="auth-field">
                                    <label className="auth-label">Confirm New Password</label>
                                    <input type="password" className="auth-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 'username' && (
                        <>
                            <h1 className="auth-title">Find My Email</h1>
                            <p className="auth-subtitle">Enter your username and we&apos;ll help you identify your account.</p>
                            <form onSubmit={handleSubmitUsername}>
                                <div className="auth-field">
                                    <label className="auth-label">Username</label>
                                    <input type="text" className="auth-input" placeholder="e.g. johndoe" value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Find Account'}
                                </button>
                            </form>
                            <button onClick={() => setStep('selection')} className="auth-back"><ArrowLeft className="h-4 w-4" /> Back</button>
                        </>
                    )}

                    {step === 'success' && (
                        <div className="text-center">
                            <div className="success-icon"><ShieldCheck className="h-10 w-10" /></div>
                            <h1 className="auth-title">Success!</h1>
                            <p className="auth-subtitle">
                                Your account has been recovered. You can now sign in with your new credentials.
                            </p>
                            <Link href="/signin" className="w-full">
                                <Button className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold">Sign In Now</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
