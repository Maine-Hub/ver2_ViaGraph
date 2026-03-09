'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
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
                .signin-body {
                    margin: 0;
                    font-family: "Segoe UI", Arial, sans-serif;
                    background-color: #12464b; 
                    color: #e6e6e6;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }

                .signin-container {
                    width: 90%;
                    max-width: 1500px;
                    display: flex;
                    flex-direction: column;
                    md-flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    padding: 40px 20px;
                }
                
                @media (min-width: 768px) {
                    .signin-container {
                        flex-direction: row;
                        padding: 40px 60px;
                    }
                }

                .signin-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;      
                    text-align: center;       
                    gap: 25px;
                    padding-bottom: 40px;
                }
                
                @media (min-width: 768px) {
                    .signin-left {
                        padding-right: 105px;
                        padding-bottom: 0;
                    }
                }

                .signin-left img {
                    width: 160px;
                    border-radius: 25px;
                    margin-bottom: 10px;
                }

                .signin-left h1 {
                    font-size: 40px;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(to right, #78e8fc, #05a7cf);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                }
                
                @media (min-width: 768px) {
                    .signin-left h1 {
                        font-size: 50px;
                    }
                }

                .signin-left p {
                    font-size: 18px;
                    max-width: 600px;
                    margin: 0 auto;
                    text-align: center;
                }

                .signin-left ul {
                    font-size: 18px;
                    list-style: disc;
                    padding-left: 0;
                    margin-top: 5px;
                    text-align: justify;
                    max-width: 350px;
                }

                .signin-sub-note {
                    display: block;
                    font-size: 18px;
                    margin-left: 25px; 
                }

                .signin-left ul li {
                    margin-bottom: 8px;
                    list-style-position: inside;
                }

                .signin-card {
                    background: rgba(67, 111, 129, 0.637);
                    width: 100%;
                    max-width: 400px;
                    padding: 20px;
                    margin-right: 20px;
                    border-radius: 20px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.356);
                    backdrop-filter: blur(10px);
                }

                .signin-card h1 {
                    font-size: 32px;
                    text-align: center;
                    margin: 0 0 1px 0;
                    font-weight: 600;
                    color: #ffffff;
                }

                .signin-sub {
                    text-align: center;
                    margin: 0 0 18px 0;
                    font-size: 14px;
                    color: #ffffff;
                }

                .signin-input-group {
                    margin-bottom: 20px;
                    width: 100%;
                    display: block;
                }

                .signin-label {
                    display: block;
                    font-size: 14px;
                    margin-bottom: 6px;
                    color: #fffefe;
                }

                .signin-input {
                    width: 100%;
                    background: rgba(41, 52, 56, 0.589);
                    border: 1px solid #344148;
                    padding: 12px;
                    border-radius: 10px;
                    font-size: 15px;
                    color: white;
                    outline: none;
                    box-sizing: border-box;
                    transition: border 0.2s, box-shadow 0.2s;
                }

                .signin-input:focus {
                    border: 1px solid #6fbaff; 
                    box-shadow: 0 0 6px rgba(111, 186, 255, 0.5);
                }

                .signin-login-btn {
                    width: 100%;
                    border: none;
                    padding: 14px;
                    border-radius: 10px;
                    font-size: 17px;
                    cursor: pointer;
                    background: linear-gradient(to right, #4be0fa, #028daf);
                    color: white;
                    margin-top: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-sizing: border-box;
                    transition: transform 0.15s ease, opacity 0.15s ease;
                }

                .signin-login-btn:hover {
                    opacity: 0.85;
                    transform: translateY(-2px); 
                    color: rgb(0, 0, 0);
                }

                .signin-login-btn:active {
                    transform: scale(0.97); 
                    opacity: 0.75;
                }
                
                .signin-login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .signin-divider {
                    display: flex;
                    align-items: center;
                    margin: 25px 0;
                    color: #a4a9ac;
                    font-size: 14px;
                }

                .signin-divider::before,
                .signin-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #2d3a42;
                }

                .signin-divider span {
                    margin: 0 10px;
                }

                .signin-google-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid #3a4e59;
                    background-color: #1d2a30;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-size: 16px;
                    cursor: pointer;
                    color: white;
                }

                .signin-google-btn img {
                    width: 20px;
                }

                .signin-signup-text {
                    text-align: center;
                    margin-top: 25px;
                    font-size: 14px;
                }

                .signin-signup-text a {
                    color: #70b8fc;
                    text-decoration: none;
                    transition: color 0.2s ease, opacity 0.2s ease;
                }

                .signin-signup-text a:hover {
                    color: #ffffff;  
                    opacity: 0.85;
                }
            `}} />
            <div className="signin-body">
                <div className="signin-container">
                    <div className="signin-left">
                        <img src="/images/ViaGraph_LOGO.png" alt="ViaGraph Logo" />
                        <h1>Welcome to ViaGraph</h1>
                        <p>Your optimized transport guide for navigating Iligan City</p>

                        <ul>
                            <li>Jeepney & Minibus</li>
                            <li>Accurate routes & fare structure</li>
                            <li>Built for MSU-IIT students <span className="signin-sub-note">(especially non-locals)</span></li>
                        </ul>
                    </div>

                    <div className="signin-card">
                        <h1>Sign In</h1>
                        <p className="signin-sub">Use your email</p>

                        <form onSubmit={handleSignIn}>
                            <div className="signin-input-group">
                                <label className="signin-label">Email</label>
                                <input name="email" type="email" className="signin-input" placeholder="your.name@gmail.com" required />
                            </div>

                            <div className="signin-input-group">
                                <label className="signin-label">Password</label>
                                <input name="password" type="password" className="signin-input" placeholder="••••••••" required />
                            </div>

                            <button className="signin-login-btn" type="submit" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="signin-divider"><span>Or continue with</span></div>

                        <button className="signin-google-btn" type="button">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                            Sign in with Google
                        </button>

                        <p className="signin-signup-text">Don't have an account? <Link href="/signup">Sign Up</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
}
