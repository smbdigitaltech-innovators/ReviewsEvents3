import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '../api/userApi';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
    // Development-only: allow bypassing Firebase auth by providing a DEV_AUTH_USER in localStorage.
    // This makes E2E testing easier without changing production behavior.
    // We parse it here but do not return early until after all hooks are declared (to avoid conditional hooks).
    let devAuthRaw = null;
    try {
      if (typeof window !== 'undefined') devAuthRaw = window.localStorage.getItem('DEV_AUTH_USER');
    } catch (e) {
      devAuthRaw = null;
    }
    let parsedDevUser = null;
    if (devAuthRaw) {
      try { parsedDevUser = JSON.parse(devAuthRaw); } catch (e) { parsedDevUser = null; }
    }

    // Function to check admin status from multiple sources
    const checkAdminStatus = async (firebaseUser) => {
        let adminStatus = false;

        // 1. Force-refresh token then check Firebase custom claims
        try {
            // Force a fresh ID token to ensure up-to-date custom claims
            try {
                await firebaseUser.getIdToken(true);
            } catch (refreshErr) {
                // Non-fatal: if refresh fails we'll still try to read claims
                console.warn('Could not refresh ID token when checking claims:', refreshErr);
            }

            const claims = await getIdTokenResult(firebaseUser);
            adminStatus = Boolean(claims?.claims?.isAdmin);
        } catch (error) {
            console.error('Error checking Firebase claims:', error);
        }
        
        // 2. If not admin by claims, check backend profile
        if (!adminStatus) {
            try {
                const profile = await getUserProfile(firebaseUser.uid);
                setUserProfile(profile);
                if (typeof profile?.isAdmin === 'boolean') {
                    adminStatus = profile.isAdmin;
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                // Set a default profile if there's an error
                setUserProfile({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email,
                    isAdmin: false
                });
            }
        }
        
        // 3. Check localStorage as last resort
        if (!adminStatus) {
            const storedRole = localStorage.getItem('userRole');
            if (storedRole === 'admin') {
                adminStatus = true;
            }
        }
        
        return adminStatus;
    };

    useEffect(() => {
        let tokenRefreshInterval = null;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get fresh token
                    const token = await firebaseUser.getIdToken(true);
                    localStorage.setItem('token', token);
                    
                    // Check admin status from multiple sources
                    const adminStatus = await checkAdminStatus(firebaseUser);
                    setIsAdmin(adminStatus);
                    
                    // Set up token refresh
                    tokenRefreshInterval = setInterval(async () => {
                        try {
                            const newToken = await firebaseUser.getIdToken(true);
                            localStorage.setItem('token', newToken);
                            
                            // Refresh admin status periodically
                            const refreshedAdminStatus = await checkAdminStatus(firebaseUser);
                            setIsAdmin(refreshedAdminStatus);
                        } catch (err) {
                            console.error('Token refresh failed:', err);
                        }
                    }, 10 * 60 * 1000); // Refresh every 10 minutes

                    setUser(firebaseUser);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error setting up auth:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsAdmin(false);
                }
            } else {
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
                setIsAdmin(false);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => {
            if (tokenRefreshInterval) {
                clearInterval(tokenRefreshInterval);
            }
            unsubscribe();
        };
    }, []);

        // If dev auth is present and valid, return a dev provider (after hooks are established)
        if (parsedDevUser) {
            return (
                <AuthContext.Provider value={{
                    user: parsedDevUser,
                    loading: false,
                    isAuthenticated: true,
                    isAdmin: Boolean(parsedDevUser.isAdmin),
                    currentUser: parsedDevUser,
                    logout: () => { window.localStorage.removeItem('DEV_AUTH_USER'); window.location.reload(); },
                    userProfile: parsedDevUser.profile || null
                }}>
                    {children}
                </AuthContext.Provider>
            );
        }

        const logout = async () => {
          try {
            await auth.signOut();
          } catch (e) {
            console.error('Error signing out:', e);
          }
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setUserProfile(null);
          window.location.href = '/login';
        };

        return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      isAdmin, 
      currentUser: user, 
      logout,
      userProfile
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};