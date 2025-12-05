// Social Media Configuration
export const socialMediaConfig = {
    facebook: {
        name: 'Facebook',
        url: 'https://facebook.com/rishadnpm',
        icon: 'facebook',
        enabled: true
    },
    instagram: {
        name: 'Instagram',
        url: 'https://instagram.com/Im_rishad_',
        icon: 'instagram',
        enabled: true
    },
    tiktok: {
        name: 'TikTok',
        url: 'https://tiktok.com/@rishadnpm',
        icon: 'tiktok',
        enabled: true
    },
    whatsapp: {
        name: 'WhatsApp',
        url: 'https://wa.me/971567064457',
        icon: 'whatsapp',
        enabled: true
    },
    gmail: {
        name: 'Gmail',
        url: 'mailto:bizzcohub@gmail.com',
        icon: 'gmail',
        enabled: true
    }
};

// Get all enabled social media links
export const getEnabledSocialMedia = () => {
    return Object.entries(socialMediaConfig)
        .filter(([_, config]) => config.enabled)
        .map(([key, config]) => ({ key, ...config }));
};
