'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!data.success) {
                toast({ variant: 'destructive', title: 'Login Failed', description: data.message });
                return;
            }

            toast({ title: 'Signed in', description: 'Welcome back to ViaGraph.' });

            if (data.user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/find-route');
            }
        } catch {
            toast({ variant: 'destructive', title: 'Login Failed', description: 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .auth-page {
                    margin: 0;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(160deg, #0c1829 0%, #0e1f35 40%, #0b1a2d 100%);
                    padding: 24px;
                    position: relative;
                }

                /* Subtle grid overlay */
                .auth-page::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(45,212,191,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(45,212,191,0.03) 1px, transparent 1px);
                    background-size: 32px 32px;
                    pointer-events: none;
                    z-index: 0;
                }

                .auth-container {
                    width: 100%;
                    max-width: 1100px;
                    min-height: 560px;
                    display: flex;
                    position: relative;
                    z-index: 1;
                }

                /* ── Left branding ── */
                .auth-brand {
                    display: none;
                    width: 55%;
                    padding: 48px 64px 48px 40px;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                    z-index: 1;
                }

                @media (min-width: 768px) {
                    .auth-brand {
                        display: flex;
                    }
                }

                .auth-brand-content {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .auth-logo {
                    width: 180px;
                    height: 180px;
                    border-radius: 36px;
                    object-fit: cover;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }

                .auth-brand-title {
                    font-size: 48px;
                    font-weight: 800;
                    color: #f1f5f9;
                    line-height: 1.15;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .auth-brand-title span {
                    background: linear-gradient(135deg, #5eead4, #2dd4bf);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .auth-brand-desc {
                    font-size: 16px;
                    color: #64748b;
                    line-height: 1.6;
                    margin: -8px 0 0 0;
                }

                .auth-features {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    margin-top: 4px;
                }

                .auth-feat {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .auth-feat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: rgba(45,212,191,0.08);
                    border: 1px solid rgba(45,212,191,0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .auth-feat-icon svg {
                    width: 24px;
                    height: 24px;
                    color: #2dd4bf;
                }

                .auth-feat-text {
                    font-size: 15px;
                    color: #94a3b8;
                    line-height: 1.45;
                }

                .auth-feat-text strong {
                    color: #e2e8f0;
                    font-weight: 600;
                    display: block;
                    margin-bottom: 1px;
                }

                /* ── Right form section ── */
                .auth-form-side {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 32px;
                    position: relative;
                    z-index: 1;
                }

                .auth-form-wrapper {
                    width: 100%;
                    max-width: 380px;
                }

                /* Mobile logo */
                .auth-mobile-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 28px;
                }

                @media (min-width: 768px) {
                    .auth-mobile-logo {
                        display: none;
                    }
                }

                .auth-mobile-logo img {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                }

                .auth-mobile-logo-text {
                    font-size: 20px;
                    font-weight: 700;
                    color: #f1f5f9;
                }

                /* Form card */
                .auth-card {
                    background: rgba(15,25,42,0.6);
                    border: 1px solid rgba(45,212,191,0.08);
                    border-radius: 16px;
                    padding: 32px 28px;
                    backdrop-filter: blur(8px);
                }

                .auth-card-header {
                    margin-bottom: 28px;
                    text-align: center;
                }

                .auth-card-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0 0 6px 0;
                }

                .auth-card-subtitle {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0;
                }

                /* Fields */
                .auth-field {
                    margin-bottom: 18px;
                }

                .auth-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #94a3b8;
                    margin-bottom: 6px;
                }

                .auth-input {
                    width: 100%;
                    padding: 11px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(148,163,184,0.15);
                    background: rgba(15,23,42,0.7);
                    font-size: 14px;
                    font-family: inherit;
                    color: #e2e8f0;
                    outline: none;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .auth-input::placeholder {
                    color: #475569;
                }

                .auth-input:focus {
                    border-color: rgba(45,212,191,0.4);
                    box-shadow: 0 0 0 2px rgba(45,212,191,0.08);
                }

                /* Primary button */
                .auth-btn-primary {
                    width: 100%;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    color: #0f172a;
                    background: linear-gradient(135deg, #2dd4bf, #14b8a6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-sizing: border-box;
                    transition: all 0.2s ease;
                    margin-top: 6px;
                }

                .auth-btn-primary:hover {
                    background: linear-gradient(135deg, #5eead4, #2dd4bf);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(45,212,191,0.25);
                }

                .auth-btn-primary:active {
                    transform: translateY(0);
                }

                .auth-btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Spinner */
                .auth-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(15,23,42,0.3);
                    border-top-color: #0f172a;
                    border-radius: 50%;
                    animation: auth-spin 0.6s linear infinite;
                }

                @keyframes auth-spin {
                    to { transform: rotate(360deg); }
                }

                /* Divider */
                .auth-divider {
                    display: flex;
                    align-items: center;
                    margin: 22px 0;
                    gap: 12px;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: rgba(148,163,184,0.12);
                }

                .auth-divider-text {
                    font-size: 11px;
                    font-weight: 600;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    white-space: nowrap;
                }

                /* Google button */
                .auth-btn-google {
                    width: 100%;
                    padding: 11px 20px;
                    border-radius: 8px;
                    border: 1px solid rgba(148,163,184,0.15);
                    background: rgba(15,23,42,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    font-family: inherit;
                    color: #cbd5e1;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .auth-btn-google:hover {
                    background: rgba(30,41,59,0.7);
                    border-color: rgba(148,163,184,0.25);
                }

                .auth-btn-google img {
                    width: 18px;
                    height: 18px;
                }

                /* Footer link */
                .auth-footer {
                    text-align: center;
                    margin-top: 22px;
                    font-size: 14px;
                    color: #64748b;
                }

                .auth-footer a {
                    color: #2dd4bf;
                    text-decoration: none;
                    font-weight: 600;
                    transition: color 0.2s ease;
                }

                .auth-footer a:hover {
                    color: #5eead4;
                }

                .auth-field-footer {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 8px;
                }
                .auth-field-footer a {
                    font-size: 12px;
                    color: #2dd4bf;
                    text-decoration: none;
                    font-weight: 500;
                }
                .auth-field-footer a:hover {
                    color: #5eead4;
                }
            `}} />
            <div className="auth-page">
                <div className="auth-container">
                    {/* ── Left branding ── */}
                    <div className="auth-brand">
                        <div className="auth-brand-content">
                            <img
                                src="/images/ViaGraph_logo_final.png"
                                alt="ViaGraph Logo"
                                className="auth-logo"
                            />
                            <h1 className="auth-brand-title">
                                Welcome to<br /><span>ViaGraph</span>
                            </h1>
                            <p className="auth-brand-desc">
                                Your digital route guide for selected public transportation routes in Iligan City.
                            </p>

                            <div className="auth-features">
                                <div className="auth-feat">
                                    <div className="auth-feat-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.988-1.098a48.354 48.354 0 0 0-7.024 0A1.11 1.11 0 0 0 5.25 6.615v5.51" />
                                        </svg>
                                    </div>
                                    <div className="auth-feat-text">
                                        <strong>Route Coverage</strong>
                                        Selected jeepney and minibus routes in Iligan City
                                    </div>
                                </div>
                                <div className="auth-feat">
                                    <div className="auth-feat-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                        </svg>
                                    </div>
                                    <div className="auth-feat-text">
                                        <strong>Mapped Route Information</strong>
                                        Fare details, transfer points, and GeoJSON paths
                                    </div>
                                </div>
                                <div className="auth-feat">
                                    <div className="auth-feat-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.54 23.54 0 0 0-2.688 2.703C1.1 13.187.707 14.08.38 15.04A48.842 48.842 0 0 1 12 17.36a48.842 48.842 0 0 1 11.62-2.32c-.327-.96-.72-1.853-1.202-2.69a23.54 23.54 0 0 0-2.688-2.703m-15.482 0A23.54 23.54 0 0 1 12 6.353a23.54 23.54 0 0 1 7.741 3.794" />
                                        </svg>
                                    </div>
                                    <div className="auth-feat-text">
                                        <strong>Student-Friendly Guide</strong>
                                        Designed for MSU-IIT students and visitors
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right form ── */}
                    <div className="auth-form-side">
                        <div className="auth-form-wrapper">
                            <div className="auth-mobile-logo">
                                <img src="/images/ViaGraph_logo_final.png" alt="ViaGraph" />
                                <span className="auth-mobile-logo-text">ViaGraph</span>
                            </div>

                            <div className="auth-card">
                                <div className="auth-card-header">
                                    <h2 className="auth-card-title">Sign in to your account</h2>
                                    <p className="auth-card-subtitle">Enter your credentials to continue</p>
                                </div>

                                <form onSubmit={handleSignIn}>
                                    <div className="auth-field">
                                        <label className="auth-label">Email address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="auth-input"
                                            placeholder="your.name@gmail.com"
                                            required
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label className="auth-label">Password</label>
                                        <input
                                            name="password"
                                            type="password"
                                            className="auth-input"
                                            placeholder="••••••••"
                                            required
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                        <div className="auth-field-footer">
                                            <Link href="/forgot-password">Forgot password?</Link>
                                        </div>
                                    </div>

                                    <button className="auth-btn-primary" type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <span className="auth-spinner" />
                                                Signing in…
                                            </>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                </form>

                                <div className="auth-divider">
                                    <span className="auth-divider-text">Or continue with</span>
                                </div>

                                <button className="auth-btn-google" type="button">
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                                    Sign in with Google
                                </button>
                            </div>

                            <p className="auth-footer">
                                Don&apos;t have an account?{' '}
                                <Link href="/signup">Create one</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
