export function getAuthErrorMessage(error: any): string {
    const errorCode = error?.code || error?.message || '';

    if (errorCode.includes('auth/email-already-in-use')) {
        return 'This email is already registered. Please sign in instead.';
    }
    if (errorCode.includes('auth/invalid-email')) {
        return 'The email address is badly formatted.';
    }
    if (errorCode.includes('auth/weak-password')) {
        return 'The password is too weak. Please use at least 6 characters.';
    }
    if (errorCode.includes('auth/user-not-found') || errorCode.includes('auth/wrong-password')) {
        return 'Invalid email or password.';
    }
    if (errorCode.includes('auth/too-many-requests')) {
        return 'Too many failed login attempts. Please try again later.';
    }
    if (errorCode.includes('auth/network-request-failed')) {
        return 'Network error. Please check your internet connection.';
    }

    // Default fallback
    const rawMessage = error?.message || 'An unexpected error occurred.';
    // Clean up Firebase: prefix if present
    return rawMessage.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Authentication failed.';
}
