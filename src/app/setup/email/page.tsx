'use client';

import React, { useState } from 'react';
import './setup.css';

export default function EmailSetupPage() {
    const [migrationStatus, setMigrationStatus] = useState<string>('');
    const [migrationResult, setMigrationResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailTestStatus, setEmailTestStatus] = useState<string>('');

    const runMigration = async () => {
        setIsLoading(true);
        setMigrationStatus('Running migration...');

        try {
            const response = await fetch('/api/setup/migrate-email', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setMigrationStatus('✅ Migration completed successfully!');
                setMigrationResult(data);
            } else {
                setMigrationStatus(`❌ Migration failed: ${data.message}`);
            }
        } catch (error) {
            setMigrationStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testEmailConfig = async () => {
        setEmailTestStatus('Testing email configuration...');

        try {
            const response = await fetch('/api/setup/test-email', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setEmailTestStatus('✅ Email configuration is working!');
            } else {
                setEmailTestStatus(`❌ Email test failed: ${data.message}`);
            }
        } catch (error) {
            setEmailTestStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-content">
                <h1>📧 Email System Setup</h1>
                <p className="subtitle">Configure your email delivery system</p>

                {/* Step 1: SMTP Configuration */}
                <div className="setup-card">
                    <h2>Step 1: Configure SMTP Credentials</h2>
                    <p>Add the following to your <code>.env.local</code> file:</p>

                    <div className="code-block">
                        <pre>{`# For Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password`}</pre>
                    </div>

                    <div className="info-box">
                        <h3>🔐 Gmail Setup Instructions:</h3>
                        <ol>
                            <li>Enable 2-Factor Authentication on your Google Account</li>
                            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">Google App Passwords</a></li>
                            <li>Generate a new app password for "Mail"</li>
                            <li>Use that password in <code>SMTP_PASS</code></li>
                        </ol>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={testEmailConfig}
                    >
                        Test Email Configuration
                    </button>
                    {emailTestStatus && (
                        <div className={`status-message ${emailTestStatus.includes('✅') ? 'success' : 'error'}`}>
                            {emailTestStatus}
                        </div>
                    )}
                </div>

                {/* Step 2: Database Migration */}
                <div className="setup-card">
                    <h2>Step 2: Update Database Schema</h2>
                    <p>Add email column to users table and set default email for admin.</p>

                    <button
                        className="btn btn-primary"
                        onClick={runMigration}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Running Migration...' : 'Run Database Migration'}
                    </button>

                    {migrationStatus && (
                        <div className={`status-message ${migrationStatus.includes('✅') ? 'success' : 'error'}`}>
                            {migrationStatus}
                        </div>
                    )}

                    {migrationResult && migrationResult.users && (
                        <div className="users-table">
                            <h3>Current Users:</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {migrationResult.users.map((user: any, index: number) => (
                                        <tr key={index}>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td><span className="role-badge">{user.role}</span></td>
                                            <td><span className={`status-badge ${user.status}`}>{user.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Step 3: Test Password Reset */}
                <div className="setup-card">
                    <h2>Step 3: Test Password Reset</h2>
                    <p>Once both steps above are complete, test the password reset flow:</p>

                    <ol>
                        <li>Go to <a href="/admin/login">/admin/login</a></li>
                        <li>Click "Forgot Password?"</li>
                        <li>Enter "admin" as username</li>
                        <li>Check your email for the OTP</li>
                        <li>Complete the password reset</li>
                    </ol>

                    <a href="/admin/login" className="btn btn-success">
                        Go to Login Page
                    </a>
                </div>

                {/* Documentation */}
                <div className="setup-card">
                    <h2>📚 Documentation</h2>
                    <p>For detailed setup instructions, troubleshooting, and configuration options:</p>
                    <ul>
                        <li><strong>EMAIL_SETUP.md</strong> - Complete setup guide</li>
                        <li><strong>.env.example</strong> - Environment variables template</li>
                        <li><strong>migrations/add_email_to_users.sql</strong> - SQL migration script</li>
                    </ul>
                </div>

                <div className="footer-note">
                    <p>Need help? Contact: bizzcohub@gmail.com | +971 567064457</p>
                </div>
            </div>
        </div>
    );
}
