'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import './login.css';
import { toast } from 'sonner';
import OrbitingTechnologies from '@/components/ui/OrbitingTechnologies';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/utils/canvasUtils';

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
                window.location.href = '/admin/login';
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
        <div className="futuristic-login-container">
            <div className="content-wrapper">

                {/* Visual Side (Tech Core) */}
                <div className="tech-visual-container">
                    <OrbitingTechnologies />
                </div>

                {/* Login Form Side */}
                <div className="login-card-glass">
                    <div className="login-header">
                        <h1 className="login-title">
                            {isLogin ? 'User Login' : 'Create Account'}
                        </h1>
                        <p className="login-subtitle">
                            BIZZ CO HUB
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="avatar-upload-container">
                                <div
                                    className="avatar-preview-wrapper"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Upload Profile Picture"
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar Preview"
                                            className="avatar-image"
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <i className="fas fa-camera" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Add Photo</span>
                                        </div>
                                    )}
                                    {avatarPreview && (
                                        <div className="camera-icon-overlay">
                                            <i className="fas fa-pen"></i>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden-input"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                <div className="dark-form-group">
                                    <div className="flex gap-4">
                                        <div className="dark-input-container w-1/2">
                                            <i className="fas fa-user dark-input-icon"></i>
                                            <input
                                                type="text"
                                                className="dark-input"
                                                placeholder="First Name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                                autoComplete="given-name"
                                            />
                                        </div>
                                        <div className="dark-input-container w-1/2">
                                            <i className="fas fa-user dark-input-icon"></i>
                                            <input
                                                type="text"
                                                className="dark-input"
                                                placeholder="Last Name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                                autoComplete="family-name"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="dark-form-group">
                                    <div className="dark-input-container">
                                        <i className="fas fa-at dark-input-icon"></i>
                                        <input
                                            type="text"
                                            className="dark-input"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email Field - Used for both or adapted based on backend requirement */}
                        <div className="dark-form-group">
                            <div className="dark-input-container">
                                <i className="fas fa-envelope dark-input-icon"></i>
                                <input
                                    type="text" // generic text to allow username or email on login
                                    className="dark-input"
                                    placeholder={isLogin ? "Username / Email" : "Email"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="dark-form-group">
                                <div className="dark-input-container">
                                    <i className="fas fa-phone dark-input-icon"></i>
                                    <input
                                        type="tel"
                                        className="dark-input"
                                        placeholder="Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="dark-form-group">
                            <div className="dark-input-container">
                                <i className="fas fa-lock dark-input-icon"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="dark-input"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#64748b',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="dark-form-group">
                                <div className="dark-input-container">
                                    <i className="fas fa-lock dark-input-icon"></i>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="dark-input"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-btn-glow"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <i className="fas fa-circle-notch fa-spin"></i>
                            ) : (
                                isLogin ? 'Login' : 'Sign Up'
                            )}
                        </button>
                    </form>

                    <div className="toggle-auth-mode">
                        {isLogin ? (
                            <>
                                Don't have an account?
                                <span className="toggle-link" onClick={() => setIsLogin(false)}>
                                    Register
                                </span>
                            </>
                        ) : (
                            <>
                                Already have an account?
                                <span className="toggle-link" onClick={() => setIsLogin(true)}>
                                    Login
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Crop Modal */}
            {isCropping && cropImageSrc && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1000,
                    background: 'rgba(11, 17, 33, 0.95)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '500px', background: '#000', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
                                <i className="fas fa-search-minus"></i>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#007aff' }}
                                />
                                <i className="fas fa-search-plus"></i>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsCropping(false); setCropImageSrc(null); }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'transparent',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={showCroppedImage}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(90deg, #007aff, #00b4ff)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        boxShadow: '0 0 20px rgba(0, 122, 255, 0.4)'
                                    }}>
                                    Set Profile Picture
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
