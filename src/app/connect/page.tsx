
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import "./connect.css";

export const metadata = {
    title: 'Connect With Us',
    description: 'Join our community on social media and stay updated with the latest tech news and offers.',
};

const platforms = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Chat with us directly',
        icon: (
            <Image
                src="/icons/whatsapp.svg"
                alt="WhatsApp"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        description: 'Follow our page',
        icon: (
            <Image
                src="/icons/facebook.svg"
                alt="Facebook"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'messenger',
        name: 'Messenger',
        description: 'Send us a message',
        icon: (
            <Image
                src="/icons/facebook-messenger.svg"
                alt="Messenger"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        description: 'See our latest updates',
        icon: (
            <Image
                src="/icons/instagram.svg"
                alt="Instagram"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Watch short clips',
        icon: (
            <Image
                src="/icons/tiktok.svg"
                alt="TikTok"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'telegram',
        name: 'Telegram',
        description: 'Join our channel',
        icon: (
            <Image
                src="/icons/telegram.svg"
                alt="Telegram"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Join the community',
        icon: (
            <Image
                src="/icons/discord.svg"
                alt="Discord"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: 'Watch reviews',
        icon: (
            <Image
                src="/icons/youtube.svg"
                alt="YouTube"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'email',
        name: 'Email',
        description: 'Get in touch',
        icon: (
            <Image
                src="/icons/gmail-.svg"
                alt="Email"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '#'
    },
    {
        id: 'website',
        name: 'Website',
        description: 'Visit our store',
        icon: (
            <Image
                src="/icons/website.svg"
                alt="Website"
                width={68}
                height={68}
                className="platform-image"
            />
        ),
        href: '/'
    }
];

export default function ConnectPage() {
    return (
        <main className="connect-page">
            <div className="bg-glow"></div>

            <div className="connect-container">
                <div className="connect-header">
                    <h1 className="connect-title">Connect With Us</h1>
                    <p className="connect-description">
                        Be part of our growing community. Follow us on social media for exclusive updates and special offers.
                    </p>
                </div>

                <div className="platforms-grid">
                    {platforms.map((platform) => (
                        <Link
                            key={platform.id}
                            href={platform.href}
                            className={`platform-card platform-${platform.id}`}
                        >
                            <div className="icon-wrapper">
                                {platform.icon}
                            </div>
                            <div className="platform-info">
                                <h3>{platform.name}</h3>
                                <p>{platform.description}</p>
                            </div>
                            <div className="arrow-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
