'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import './login.css';
import { toast } from 'sonner';

import Cropper from 'react-easy-crop';
import getCroppedImg from '@/utils/cropImage';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';


export default function CustomerAuthPage() {
    // We'll keep the state for logic, but visual focus is on "Login"
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form Data
    const [email, setEmail] = useState(''); // Used for Login
    const [password, setPassword] = useState('');

    // Sign Up Specific
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Avatar State
    const [avatarFile, setAvatarFile] = useState<File | Blob | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Cropping State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    // Secret Admin Navigation
    useEffect(() => {
        let keySequence: string[] = [];
        const secretCode = 'BIZZCOADMIN';

        const handleKeyDown = (e: KeyboardEvent) => {
            // User must be holding shift as per requirements
            if (!e.shiftKey) {
                keySequence = [];
                return;
            }

            // Ignore modifier keys themselves
            if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

            const char = e.key.toUpperCase();
            keySequence.push(char);

            // Keep only the last N characters
            if (keySequence.length > secretCode.length) {
                keySequence.shift();
            }

            if (keySequence.join('') === secretCode) {
                toast.info("Accessing Admin Portal...");
                window.location.href = '/bch/login';
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCropImageSrc(reader.result as string);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
            // Don't set avatarFile yet, wait for crop
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        if (!cropImageSrc || !croppedAreaPixels) return;
        try {
            const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            if (croppedImageBlob) {
                setAvatarFile(new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" }));
                setAvatarPreview(URL.createObjectURL(croppedImageBlob));
                setIsCropping(false);
                setCropImageSrc(null); // Cleanup
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image");
        }
    }, [cropImageSrc, croppedAreaPixels]);

    const handleGoogleSignIn = () => {
        if (!GOOGLE_CLIENT_ID) {
            toast.error('Google Sign-In is not configured.');
            return;
        }
        const redirectUri = `${window.location.origin}/api/auth/google/callback`;
        const scope = 'openid email profile';
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope,
            access_type: 'offline',
            prompt: 'select_account',
        });
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!isLogin && password !== confirmPassword) {
            toast.error("Passwords do not match!");
            setIsLoading(false);
            return;
        }

        try {
            let avatarUrl = null;

            // Upload Avatar if present
            if (!isLogin && avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);
                formData.append('folder', 'Customers/Avatars');
                formData.append('fileName', `${username || 'user'}_${Date.now()}`);

                try {
                    const uploadRes = await fetch('/api/imagekit/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        avatarUrl = uploadData.url;
                    } else {
                        console.error('Avatar upload failed');
                        toast.error('Failed to upload profile picture, continuing without it.');
                    }
                } catch (err) {
                    console.error('Avatar upload error:', err);
                }
            }

            const endpoint = '/api/auth/customer';
            const payload = isLogin
                ? { action: 'login', identifier: email, password }
                : { action: 'signup', firstName, lastName, username, email, phone, password, avatar: avatarUrl };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (isLogin) {
                    // Update UI State
                    localStorage.setItem('customer_user', JSON.stringify(data.user));
                    window.dispatchEvent(new Event('user-login'));
                    toast.success('Login success!');

                    // Redirect
                    window.location.href = '/products';
                } else {
                    toast.success('Account created successfully! Please login.');
                    setIsLogin(true);
                    // Clear form
                    setPassword('');
                    setConfirmPassword('');
                    setAvatarFile(null);
                    setAvatarPreview(null);
                }
            } else {
                toast.error(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth Error:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="minimal-login-container">
                <div className="minimal-login-card">
                    <div className="minimal-header">
                        <h2>{isLogin ? 'Sign In' : 'Create a Tailark Account'}</h2>
                        <p>{isLogin ? 'Welcome back! Please enter your details' : 'Welcome! Create an account to get started'}</p>
                    </div>

                    <div className="minimal-sso-grid">
                        <button type="button" className="minimal-sso-btn" onClick={handleGoogleSignIn}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={18} height={18}>
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            <span>Google</span>
                        </button>
                        <button type="button" className="minimal-sso-btn" onClick={() => toast.info('Microsoft login coming soon')}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" width={18} height={18} />
                            <span>Microsoft</span>
                        </button>
                    </div>

                    <div className="minimal-divider">
                        <span></span>
                    </div>

                    <form onSubmit={handleSubmit} className="minimal-form">
                        {!isLogin && (
                            <div className="minimal-avatar-upload">
                                <div
                                    className="avatar-preview-circle"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Upload Profile Picture"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <i className="fas fa-camera"></i>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden-input"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="minimal-form-row">
                                <div className="minimal-form-group">
                                    <label>Firstname</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div className="minimal-form-group">
                                    <label>Lastname</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="minimal-form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        )}

                        <div className="minimal-form-group">
                            <label>{isLogin ? 'Email or Username' : 'Email'}</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        {!isLogin && (
                            <div className="minimal-form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    autoComplete="tel"
                                />
                            </div>
                        )}

                        <div className="minimal-form-group">
                            <div className="minimal-password-header">
                                <label>Password</label>
                                {isLogin && <Link href="/forgot-password" className="minimal-forgot-link">Forgot password?</Link>}
                            </div>
                            <div className="minimal-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    className="minimal-toggle-pwd"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="minimal-form-group">
                                <label>Confirm Password</label>
                                <div className="minimal-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="minimal-toggle-pwd"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="minimal-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Continue'}
                        </button>
                    </form>
                </div>

                <div className="minimal-footer-tray">
                    {isLogin ? (
                        <p>Don't have an account ? <button type="button" onClick={() => setIsLogin(false)}>Sign Up</button></p>
                    ) : (
                        <p>Have an account ? <button type="button" onClick={() => setIsLogin(true)}>Sign In</button></p>
                    )}
                </div>

                {/* Crop Modal */}
                {isCropping && cropImageSrc && (
                    <div className="minimal-crop-modal">
                        <div className="minimal-crop-container">
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={true}
                            />
                        </div>
                        <div className="minimal-crop-controls">
                            <button type="button" className="crop-cancel-btn" onClick={() => { setIsCropping(false); setCropImageSrc(null); }}>
                                Cancel
                            </button>
                            <button type="button" className="crop-save-btn" onClick={showCroppedImage}>
                                Set Picture
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
