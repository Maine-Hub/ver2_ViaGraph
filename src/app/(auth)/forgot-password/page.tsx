'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'selection' | 'email' | 'username' | 'success'>('selection');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');

    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Mock recovery process
            const res = await fetch('/api/auth/recover-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            
            if (data.success) {
                setStep('success');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Recovery Failed',
                description: error.message || 'Email not found.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Mock email recovery
            const res = await fetch('/api/auth/recover-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            
            if (data.success) {
                toast({
                    title: 'Email Found',
                    description: `Your registered email is: ${data.email}`,
                });
                setStep('selection');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Recovery Failed',
                description: error.message || 'Username not found.',
            });
        } finally {
            setIsLoading(false);
        }
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
                .auth-input-wrapper {
                    position: relative;
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
                .auth-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
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
                }
                .auth-back:hover {
                    color: #f1f5f9;
                }
                .option-card {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .option-card:hover {
                    background: rgba(30, 41, 59, 0.6);
                    border-color: rgba(45, 212, 191, 0.3);
                }
                .option-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(45, 212, 191, 0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2dd4bf;
                }
                .option-text h3 {
                    font-size: 15px;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                }
                .option-text p {
                    font-size: 12px;
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
                            <p className="auth-subtitle">Select the option that best describes your situation.</p>
                            
                            <div className="option-card" onClick={() => setStep('email')}>
                                <div className="option-icon"><KeyRound className="h-5 w-5" /></div>
                                <div className="option-text">
                                    <h3>Forgot Password</h3>
                                    <p>I remember my email but forgot my password.</p>
                                </div>
                            </div>
                            
                            <div className="option-card" onClick={() => setStep('username')}>
                                <div className="option-icon"><Mail className="h-5 w-5" /></div>
                                <div className="option-text">
                                    <h3>Forgot Email</h3>
                                    <p>I forgot which email I used for my account.</p>
                                </div>
                            </div>

                            <Link href="/signin" className="auth-back">
                                <ArrowLeft className="h-4 w-4" /> Back to Login
                            </Link>
                        </>
                    )}

                    {step === 'email' && (
                        <>
                            <h1 className="auth-title">Reset Password</h1>
                            <p className="auth-subtitle">Enter your email and we'll send you recovery instructions.</p>
                            
                            <form onSubmit={handleSubmitEmail}>
                                <div className="auth-field">
                                    <label className="auth-label">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="auth-input" 
                                        placeholder="your@email.com" 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                                </button>
                            </form>

                            <button onClick={() => setStep('selection')} className="auth-back">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>
                        </>
                    )}

                    {step === 'username' && (
                        <>
                            <h1 className="auth-title">Find My Email</h1>
                            <p className="auth-subtitle">Enter your username and we'll help you identify your account.</p>
                            
                            <form onSubmit={handleSubmitUsername}>
                                <div className="auth-field">
                                    <label className="auth-label">Username</label>
                                    <input 
                                        type="text" 
                                        className="auth-input" 
                                        placeholder="e.g. johndoe" 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="auth-btn" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Find Account'}
                                </button>
                            </form>

                            <button onClick={() => setStep('selection')} className="auth-back">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>
                        </>
                    )}

                    {step === 'success' && (
                        <div className="text-center">
                            <div className="success-icon">
                                <ShieldCheck className="h-10 w-10" />
                            </div>
                            <h1 className="auth-title">Check Your Inbox</h1>
                            <p className="auth-subtitle">
                                We've sent a recovery link to <strong>{email}</strong>. Please follow the instructions to reset your password.
                            </p>
                            
                            <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setStep('selection')}>
                                Try another email
                            </Button>

                            <Link href="/signin" className="auth-back">
                                <ArrowLeft className="h-4 w-4" /> Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
