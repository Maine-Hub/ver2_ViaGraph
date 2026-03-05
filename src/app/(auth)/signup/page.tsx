'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase/provider';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState('user');
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const username = formData.get('username') as string;
        const adminCode = formData.get('adminCode') as string;

        if (role === 'admin') {
            const validCodes = (process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODES || '').split(',');
            if (!validCodes.includes(adminCode)) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Invalid Admin Access Code.',
                });
                return;
            }
        }

        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // Save user role and username to Firestore
            await setDoc(doc(firestore, 'users', user.uid), {
                id: user.uid,
                email: user.email,
                username: username || '',
                role: role,
                createdAt: new Date().toISOString(),
            });

            // If admin, also add to roles_admin collection
            // NOTE: This might fail if Firestore rules don't permit self-creation, 
            // but we'll try and handle it gracefully or let the user know.
            if (role === 'admin') {
                try {
                    await setDoc(doc(firestore, 'roles_admin', user.uid), {
                        id: user.uid,
                        email: user.email,
                        assignedAt: new Date().toISOString(),
                    });
                } catch (adminError) {
                    console.error('Failed to register admin role in Firestore:', adminError);
                    // We don't block the whole signup if role_admin write fails, 
                    // as it might require manual approval or different rules.
                }
            }

            toast({
                title: 'Account created',
                description: "You've successfully signed up.",
            });

            if (role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/find-route');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: getAuthErrorMessage(error),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                .signup-body {
                    margin: 0;
                    font-family: "Segoe UI", Arial, sans-serif;
                    background-color: #12464b;
                    color: #e6e6e6;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .signup-container {
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
                    .signup-container {
                        flex-direction: row;
                        padding: 40px 60px;
                    }
                }

                .signup-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;      
                    text-align: center;       
                    gap: 25px;
                    padding-bottom: 40px;
                }
                
                @media (min-width: 768px) {
                    .signup-left {
                        padding-right: 85px;
                        padding-bottom: 0;
                    }
                }

                .signup-left img {
                    width: 160px;
                    border-radius: 25px;
                    margin-bottom: 10px;
                }

                .signup-left h1 {
                    font-size: 36px;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(to right, #78e8fc, #05a7cf);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    white-space: nowrap;
                }
                
                @media (min-width: 768px) {
                    .signup-left h1 {
                        font-size: 48px;
                    }
                }

                .signup-left p {
                    font-size: 18px;
                    max-width: 600px;
                    margin: 0 auto;
                    text-align: center;
                }

                .signup-left ul {
                    font-size: 18px;
                    list-style: disc;
                    padding-left: 0;
                    margin-top: 5px;
                    text-align: justify;
                    max-width: 350px;
                }

                .signup-sub-note {
                    display: block;
                    font-size: 18px;
                    margin-left: 25px; 
                }

                .signup-left ul li {
                    margin-bottom: 8px;
                    list-style-position: inside;
                }

                .signup-card {
                    width: 100%;
                    max-width: 420px;
                    background: rgba(67, 111, 129, 0.6);
                    padding: 15px 25px;
                    margin-left: 0;
                    margin-top: 0;
                    border-radius: 20px;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                }
                
                @media (min-width: 768px) {
                    .signup-card {
                        margin-left: 50px;
                    }
                }

                .signup-select {
                    width: 100%;
                    padding: 10px;
                    border-radius: 10px;
                    background: rgba(41, 52, 56, 1);
                    border: 1px solid #344148;
                    color: white;
                    font-size: 15px;
                    outline: none;
                }

                .signup-card h2 {
                    text-align: center;
                    font-size: 32px;
                    margin: 0 0 4px 0;
                    font-weight: 600;
                    color: #ffffff;
                }

                .signup-sub {
                    text-align: center;
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #ffffff;
                }

                .signup-input-group {
                    margin-bottom: 10px;
                    width: 100%;
                    display: block;
                }

                .signup-label {
                    font-size: 14px;
                    margin-bottom: 5px;
                    display: block;
                    color: #fffefe;
                }

                .signup-input {
                    width: 100%;
                    padding: 10px;
                    border-radius: 10px;
                    background: rgba(41, 52, 56, 0.55);
                    border: 1px solid #344148;
                    color: white;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                    transition: border 0.2s, box-shadow 0.2s;
                }

                .signup-input:focus {
                    border: 1px solid #6fbaff; 
                    box-shadow: 0 0 6px rgba(111, 186, 255, 0.5);
                }

                .signup-login-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    border: none;
                    font-size: 15px;
                    background: linear-gradient(to right, #4be0fa, #028daf);
                    color: white;
                    margin-top: 15px;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-sizing: border-box;
                    transition: transform 0.15s ease, opacity 0.15s ease;
                }

                .signup-login-btn:hover {
                    opacity: 0.85;
                    transform: translateY(-2px);
                    color: #000000;
                }
                
                .signup-login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .signup-divider {
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                    color: #a4a9ac;
                    font-size: 14px;
                }

                .signup-divider::before, .signup-divider::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: #2d3a42;
                }

                .signup-divider span {
                    margin: 0 10px;
                }

                .signup-google-btn {
                    width: 100%;
                    padding: 10px;
                    background-color: #1d2a30;
                    border: 1px solid #3a4e59;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                }

                .signup-google-btn img {
                    width: 20px;
                }

                .signup-signup-text {
                    margin-top: 10px;
                    text-align: center;
                    font-size: 14px;
                }

                .signup-signup-text a {
                    color: #70b8fc;
                    text-decoration: none;
                    transition: color 0.2s ease, opacity 0.2s ease;
                }
            `}} />
            <div className="signup-body">
                <div className="signup-container">
                    <div className="signup-left">
                        <img src="/images/ViaGraph_LOGO.png" alt="ViaGraph Logo" />
                        <h1>Welcome to ViaGraph</h1>
                        <p>Your optimized transport guide for navigating Iligan City</p>

                        <ul>
                            <li>Jeepney & Minibus</li>
                            <li>Accurate routes & fare structure</li>
                            <li>Built for MSU-IIT students <span className="signup-sub-note">(especially non-locals)</span></li>
                        </ul>
                    </div>

                    <div className="signup-card">
                        <h2>Create Account</h2>
                        <p className="signup-sub">Use your email</p>

                        <form onSubmit={handleSignUp}>
                            <div className="signup-input-group">
                                <label className="signup-label">Account Type</label>
                                <select
                                    name="role"
                                    className="signup-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="signup-input-group">
                                <label className="signup-label">Username</label>
                                <input name="username" type="text" className="signup-input" required />
                            </div>

                            <div className="signup-input-group">
                                <label className="signup-label">Email</label>
                                <input name="email" type="email" className="signup-input" placeholder={role === 'admin' ? "admin@gmail.com" : "your.name@g.msuiit.edu.ph"} required />
                            </div>

                            {role === 'admin' && (
                                <div className="signup-input-group">
                                    <label className="signup-label">Admin Access Code</label>
                                    <input name="adminCode" type="password" className="signup-input" placeholder="Admin-only code" />
                                </div>
                            )}

                            <div className="signup-input-group">
                                <label className="signup-label">Password</label>
                                <input name="password" type="password" className="signup-input" placeholder="••••••••" required />
                            </div>

                            <button className="signup-login-btn" type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <div className="signup-divider"><span>Or continue with</span></div>

                        <button className="signup-google-btn" type="button">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                            Sign Up with Google
                        </button>

                        <p className="signup-signup-text">Already have an account? <Link href="/signin">Sign In</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
}
