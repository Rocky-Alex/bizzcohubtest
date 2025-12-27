"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Email {
    id: number;
    sender_name: string;
    sender_email: string;
    subject: string;
    body: string;
    snippet: string;
    folder: string;
    is_read: boolean;
    is_starred: boolean;
    labels: string[];
    avatar: string;
    created_at: string;
    selected?: boolean;
}

interface EmailClientProps {
    userRole?: string;
}

export default function EmailClient({ userRole }: EmailClientProps) {
    const [activeFolder, setActiveFolder] = useState('inbox');
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [counts, setCounts] = useState({ inbox: 0, starred: 0, sent: 0, drafts: 0, trash: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Compose State
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeMessage, setComposeMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Gmail Login State
    const [gmailUser, setGmailUser] = useState('');
    const [gmailPass, setGmailPass] = useState('');
    const [authError, setAuthError] = useState('');
    const [isGmailConnected, setIsGmailConnected] = useState(false);

    useEffect(() => {
        // Check session storage
        const storedUser = sessionStorage.getItem('gmail_user');
        const storedPass = sessionStorage.getItem('gmail_pass');
        if (storedUser && storedPass) {
            setGmailUser(storedUser);
            setGmailPass(storedPass);
            setIsGmailConnected(true);
        }
    }, []);

    useEffect(() => {
        if (isGmailConnected) {
            fetchEmails();
        }
    }, [activeFolder, isGmailConnected]);

    const fetchEmails = async () => {
        setIsLoading(true);
        try {
            const query = searchTerm ? `?folder=${activeFolder}&search=${searchTerm}` : `?folder=${activeFolder}`;
            const headers: any = {};
            if (gmailUser && gmailPass) {
                headers['x-gmail-user'] = gmailUser;
                headers['x-gmail-password'] = gmailPass;
            }

            const res = await fetch(`/api/admin/email${query}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setEmails(data.emails || []);
                setCounts(data.counts || { inbox: 0, starred: 0, sent: 0, drafts: 0, trash: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch emails", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (gmailUser && gmailPass) {
                headers['x-gmail-user'] = gmailUser;
                headers['x-gmail-password'] = gmailPass;
            }

            const res = await fetch('/api/admin/email', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    to: composeTo,
                    subject: composeSubject,
                    message: composeMessage,
                    isDraft: false
                })
            });

            if (res.ok) {
                toast.success('Email sent successfully');
                setIsComposeOpen(false);
                setComposeTo('');
                setComposeSubject('');
                setComposeMessage('');
                if (activeFolder === 'sent') fetchEmails();
            } else {
                const err = await res.json();
                toast.error(`Failed to send: ${err.error}`);
            }
        } catch (error) {
            toast.error('Error sending email');
        } finally {
            setIsSending(false);
        }
    };

    const toggleStar = async (email: Email) => {
        // Optimistic update
        const updatedEmails = emails.map(e => e.id === email.id ? { ...e, is_starred: !e.is_starred } : e);
        setEmails(updatedEmails);

        try {
            await fetch('/api/admin/email', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: email.id, action: 'toggleStar', value: !email.is_starred })
            });
            // Refetch to sync counts if needed
        } catch (error) {
            console.error('Error toggling star');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleGmailLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize credentials
        const cleanUser = gmailUser.trim();
        const cleanPass = gmailPass.replace(/\s+/g, ''); // Remove all spaces from App Password

        if (!cleanUser || !cleanPass) {
            setAuthError("Please fill in all fields");
            return;
        }

        // Update state and session
        setGmailUser(cleanUser);
        setGmailPass(cleanPass);
        sessionStorage.setItem('gmail_user', cleanUser);
        sessionStorage.setItem('gmail_pass', cleanPass);

        setIsGmailConnected(true);
    };

    const handleGmailLogout = () => {
        sessionStorage.removeItem('gmail_user');
        sessionStorage.removeItem('gmail_pass');
        setGmailUser('');
        setGmailPass('');
        setIsGmailConnected(false);
        setEmails([]);
        setCounts({ inbox: 0, starred: 0, sent: 0, drafts: 0, trash: 0 });
        toast.info("Disconnected from Gmail");
    };

    if (!isGmailConnected) {
        return (
            <div className="gmail-login-container">
                <div className="gmail-login-card">
                    <div className="gmail-logo-wrapper">
                        <i className="fas fa-envelope-open-text" style={{ fontSize: '2.5rem', color: '#EA4335' }}></i>
                    </div>
                    <h2>Connect your Gmail</h2>
                    <p className="subtitle">Enter your details to sync and send emails.</p>

                    {authError && <div className="auth-error">{authError}</div>}

                    <form onSubmit={handleGmailLogin}>
                        <div className="login-form-group">
                            <label>Gmail Address</label>
                            <input
                                type="email"
                                placeholder="you@gmail.com"
                                value={gmailUser}
                                onChange={e => { setGmailUser(e.target.value); setAuthError(''); }}
                            />
                        </div>
                        <div className="login-form-group">
                            <label>App Password</label>
                            <input
                                type="password"
                                placeholder="xxxx xxxx xxxx xxxx"
                                value={gmailPass}
                                onChange={e => { setGmailPass(e.target.value); setAuthError(''); }}
                            />
                            <a href="https://myaccount.google.com/apppasswords" target="_blank" className="help-link">
                                Get an App Password <i className="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                        <button type="submit" className="login-btn">
                            Connect Account
                        </button>
                        <p className="disclaimer">
                            We do not store your password on our servers. It is kept in your browser session.
                        </p>
                    </form>
                </div>
                <style jsx>{`
                    .gmail-login-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100%;
                        width: 100%;
                        background: var(--bg-tertiary);
                    }
                    .gmail-login-card {
                        background: var(--bg-primary);
                        padding: 3rem;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                        width: 100%;
                        max-width: 450px;
                        text-align: center;
                        border: 1px solid var(--border);
                    }
                    .gmail-logo-wrapper {
                        margin-bottom: 1.5rem;
                        background: rgba(234, 67, 53, 0.1);
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    h2 { color: var(--text-primary); margin: 0 0 0.5rem 0; font-size: 1.5rem; }
                    .subtitle { color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.95rem; }
                    
                    .login-form-group {
                        text-align: left;
                        margin-bottom: 1.25rem;
                    }
                    .login-form-group label {
                        display: block;
                        font-size: 0.85rem;
                        font-weight: 600;
                        color: var(--text-primary);
                        margin-bottom: 0.5rem;
                    }
                    .login-form-group input {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        background: var(--bg-tertiary);
                        color: var(--text-primary);
                        font-size: 1rem;
                    }
                    .login-form-group input:focus {
                        outline: none;
                        border-color: #EA4335;
                        box-shadow: 0 0 0 2px rgba(234, 67, 53, 0.1);
                    }
                    .help-link {
                        display: inline-block;
                        margin-top: 0.5rem;
                        font-size: 0.8rem;
                        color: #6366f1;
                        text-decoration: none;
                    }
                    .help-link:hover { text-decoration: underline; }
                    
                    .auth-error {
                        background: #fee2e2;
                        color: #ef4444;
                        padding: 0.75rem;
                        border-radius: 8px;
                        font-size: 0.9rem;
                        margin-bottom: 1.5rem;
                    }
                    
                    .login-btn {
                        width: 100%;
                        padding: 0.875rem;
                        background: #EA4335;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                        margin-bottom: 1.5rem;
                    }
                    .login-btn:hover { background: #d93025; }
                    
                    .disclaimer {
                        font-size: 0.75rem;
                        color: var(--text-tertiary);
                        margin: 0;
                        line-height: 1.4;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="email-client-wrapper">
            {/* Sidebar */}
            <div className="email-sidebar">
                <div className="compose-btn-wrapper">
                    <button className="compose-btn" onClick={() => setIsComposeOpen(true)}>
                        <i className="fas fa-pen"></i> Compose
                    </button>
                </div>

                <div className="email-nav-section">
                    <h3>Emails</h3>
                    <button className={`email-nav-item ${activeFolder === 'inbox' ? 'active' : ''}`} onClick={() => setActiveFolder('inbox')}>
                        <span className="nav-icon"><i className="fas fa-inbox"></i> Inbox</span>
                        {counts.inbox > 0 && <span className="nav-badge">{counts.inbox}</span>}
                    </button>
                    <button className={`email-nav-item ${activeFolder === 'starred' ? 'active' : ''}`} onClick={() => setActiveFolder('starred')}>
                        <span className="nav-icon"><i className="fas fa-star"></i> Starred</span>
                        <span className="nav-count">{counts.starred}</span>
                    </button>
                    <button className={`email-nav-item ${activeFolder === 'sent' ? 'active' : ''}`} onClick={() => setActiveFolder('sent')}>
                        <span className="nav-icon"><i className="fas fa-paper-plane"></i> Sent</span>
                        <span className="nav-count">{counts.sent}</span>
                    </button>
                    <button className={`email-nav-item ${activeFolder === 'drafts' ? 'active' : ''}`} onClick={() => setActiveFolder('drafts')}>
                        <span className="nav-icon"><i className="fas fa-file"></i> Drafts</span>
                        <span className="nav-count">{counts.drafts}</span>
                    </button>
                    <button className={`email-nav-item ${activeFolder === 'trash' ? 'active' : ''}`} onClick={() => setActiveFolder('trash')}>
                        <span className="nav-icon"><i className="fas fa-trash"></i> Deleted</span>
                        <span className="nav-count">{counts.trash}</span>
                    </button>
                </div>

                <div className="email-nav-section">
                    <div className="section-header">
                        <h3>Labels</h3>
                        <button className="add-label-btn"><i className="fas fa-plus"></i></button>
                    </div>
                    <div className="label-item"><span className="label-dot green"></span> Team Events</div>
                    <div className="label-item"><span className="label-dot orange"></span> Work</div>
                    <div className="label-item"><span className="label-dot red"></span> External</div>
                    <div className="label-item"><span className="label-dot purple"></span> Projects</div>
                </div>

                <div className="email-nav-section" style={{ marginTop: 'auto' }}>
                    <button className="email-nav-item logout-btn" onClick={handleGmailLogout}>
                        <span className="nav-icon"><i className="fas fa-sign-out-alt"></i> Disconnect Gmail</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="email-content">
                <div className="email-header">
                    <div className="header-title">
                        <h2>{activeFolder.charAt(0).toUpperCase() + activeFolder.slice(1)}</h2>
                        <span className="header-subtitle">{emails.length} Emails</span>
                    </div>
                    <div className="header-search">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchEmails()}
                        />
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn" onClick={fetchEmails}><i className="fas fa-sync-alt"></i></button>
                        <button className="icon-btn"><i className="fas fa-cog"></i></button>
                    </div>
                </div>

                <div className="email-list">
                    {isLoading ? (
                        <div className="email-loading">Loading emails...</div>
                    ) : emails.length === 0 ? (
                        <div className="email-empty">No emails in {activeFolder}</div>
                    ) : (
                        emails.map(email => (
                            <div key={email.id} className={`email-item ${!email.is_read ? 'unread' : ''}`}>
                                <div className="email-checkbox">
                                    <input type="checkbox" />
                                </div>
                                <div className="email-star" onClick={(e) => { e.stopPropagation(); toggleStar(email); }}>
                                    <i className={`${email.is_starred ? 'fas' : 'far'} fa-star ${email.is_starred ? 'starred' : ''}`}></i>
                                </div>
                                <div className="email-sender">
                                    <img src={email.avatar} alt={email.sender_name} className="sender-avatar" />
                                    <div className="sender-info">
                                        <span className="sender-name">{email.sender_name}</span>
                                        <span className="email-subject-mobile">{email.subject}</span>
                                    </div>
                                </div>
                                <div className="email-body">
                                    <span className="email-subject">{email.subject}</span>
                                    <span className="email-snippet"> - {email.snippet}</span>

                                    <div className="email-labels">
                                        {email.labels && email.labels.map((label, i) => (
                                            <span key={i} className={`email-label ${label.toLowerCase().replace(' ', '-')}`}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="email-date">
                                    {formatDate(email.created_at)}
                                </div>
                                <div className="email-actions-hover">
                                    <button title="Archive"><i className="fas fa-archive"></i></button>
                                    <button title="Delete"><i className="fas fa-trash"></i></button>
                                    <button title="Mark as Read"><i className="fas fa-envelope-open"></i></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="compose-overlay">
                    <div className="compose-modal">
                        <div className="compose-header">
                            <h3>New Message</h3>
                            <button onClick={() => setIsComposeOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSend}>
                            <div className="compose-body">
                                <div className="form-group">
                                    <input
                                        type="email"
                                        placeholder="To"
                                        value={composeTo}
                                        onChange={e => setComposeTo(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        value={composeSubject}
                                        onChange={e => setComposeSubject(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group editor">
                                    <textarea
                                        placeholder="Message..."
                                        value={composeMessage}
                                        onChange={e => setComposeMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="compose-footer">
                                <button type="submit" className="send-btn" disabled={isSending}>
                                    {isSending ? 'Sending...' : 'Send'} <i className="fas fa-paper-plane"></i>
                                </button>
                                <button type="button" className="discard-btn" onClick={() => setIsComposeOpen(false)}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .email-client-wrapper {
                    display: flex;
                    height: 100%;
                    width: 100%;
                    background: var(--bg-primary);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }

                /* Sidebar */
                .email-sidebar {
                    width: 260px;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .compose-btn-wrapper {
                    margin-bottom: 10px;
                }

                .compose-btn {
                    width: 100%;
                    padding: 12px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
                }

                .compose-btn:hover {
                    background: #4f46e5;
                    transform: translateY(-1px);
                }

                .email-nav-section h3 {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-bottom: 10px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .email-nav-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: var(--text-primary);
                    cursor: pointer;
                    margin-bottom: 4px;
                    transition: all 0.2s;
                }

                .email-nav-item:hover {
                    background: rgba(0,0,0,0.05);
                }

                .email-nav-item.active {
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                    font-weight: 600;
                }

                .nav-icon {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .nav-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-weight: bold;
                }
                
                .nav-count {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .add-label-btn {
                    background: none;
                    border: none;
                    color: #6366f1;
                    cursor: pointer;
                }

                .logout-btn {
                    color: #ef4444 !important;
                }
                .logout-btn:hover {
                    background: #fee2e2 !important;
                }

                .label-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }

                .label-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .label-dot.green { background: #10b981; }
                .label-dot.orange { background: #f59e0b; }
                .label-dot.red { background: #ef4444; }
                .label-dot.purple { background: #8b5cf6; }

                /* Content */
                .email-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary);
                }

                .email-header {
                    padding: 20px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--bg-primary);
                }

                .header-title h2 {
                    font-size: 1.5rem;
                    margin: 0;
                    color: var(--text-primary);
                }

                .header-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }

                .header-search {
                    flex: 1;
                    max-width: 400px;
                    margin: 0 20px;
                    position: relative;
                }

                .header-search i {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }

                .header-search input {
                    width: 100%;
                    padding: 10px 10px 10px 35px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                }

                .icon-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 1px solid var(--border);
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    color: #6366f1;
                    border-color: #6366f1;
                }

                /* List */
                .email-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .email-item {
                    display: flex;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    transition: background 0.1s;
                    position: relative;
                }

                .email-item:hover {
                    background: var(--bg-tertiary);
                }
                
                .email-item:hover .email-actions-hover {
                    display: flex;
                }

                .email-item.unread {
                    background: rgba(99, 102, 241, 0.03);
                }
                
                .email-item.unread .sender-name,
                .email-item.unread .email-subject {
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .email-checkbox {
                    margin-right: 15px;
                }

                .email-star {
                    margin-right: 15px;
                    color: #cbd5e1;
                    cursor: pointer;
                }

                .email-star .starred {
                    color: #f59e0b;
                }

                .email-sender {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 200px;
                    flex-shrink: 0;
                }

                .sender-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .sender-info {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .sender-name {
                    font-size: 0.95rem;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .email-subject-mobile {
                    display: none;
                }

                .email-body {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    padding-right: 20px;
                }

                .email-subject {
                    font-size: 0.95rem;
                    color: var(--text-primary);
                    white-space: nowrap;
                }

                .email-snippet {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-left: 5px;
                }

                .email-labels {
                    display: flex;
                    gap: 5px;
                    margin-left: 10px;
                }

                .email-label {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: rgba(0,0,0,0.1);
                    white-space: nowrap;
                }
                
                .email-label.projects { color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.1); }
                .email-label.work { color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.1); }
                .email-label.external { color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }
                .email-label.team-events { color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); }

                .email-date {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    width: 70px;
                    text-align: right;
                }

                .email-actions-hover {
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: none;
                    gap: 5px;
                    background: var(--bg-tertiary); 
                    padding: 5px;
                    border-radius: 4px;
                }

                .email-actions-hover button {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    border-radius: 4px;
                }
                
                .email-actions-hover button:hover {
                    background: rgba(0,0,0,0.1);
                    color: var(--text-primary);
                }

                /* Compose Overlay */
                .compose-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 0 50px 0 0;
                }

                .compose-modal {
                    width: 500px;
                    background: var(--bg-primary);
                    border-radius: 12px 12px 0 0;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .compose-header {
                    padding: 15px 20px;
                    background: #6366f1;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .compose-header h3 { margin: 0; font-size: 1rem; }
                .compose-header button { background: none; border: none; color: white; cursor: pointer; }

                .compose-body {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-bottom: 1px solid var(--border);
                    background: transparent;
                    font-family: inherit;
                    color: var(--text-primary);
                }

                .form-group.editor textarea {
                    min-height: 200px;
                    resize: none;
                }
                
                .form-group input:focus, .form-group textarea:focus {
                    outline: none;
                    border-bottom-color: #6366f1;
                }

                .compose-footer {
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid var(--border);
                }

                .send-btn {
                    padding: 8px 20px;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .discard-btn {
                    padding: 8px;
                    background: transparent;
                    color: var(--text-secondary);
                    border: none;
                    cursor: pointer;
                }
                
                .email-loading, .email-empty {
                    padding: 40px;
                    text-align: center;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
