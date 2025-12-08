import React, { useState, useEffect } from "react";
import { SiteConfig } from "@/config/site";

interface SettingsManagerProps {
    activeSection: string;
}

export default function SettingsManager({
    activeSection,
}: SettingsManagerProps) {
    const [siteSettings, setSiteSettings] = useState<any>({
        siteName: SiteConfig.siteName,
        description: SiteConfig.footer.companyDescription,
        vision: "",
        mapUrl: "",
    });

    const [branding, setBranding] = useState<any>({
        logo: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#1f2937",
        accentColor: "#10b981",
    });

    const [contact, setContact] = useState<any>(SiteConfig.contact);
    const [social, setSocial] = useState<any>(SiteConfig.social);
    const [footer, setFooter] = useState<any>(SiteConfig.footer);

    useEffect(() => {
        // Load from localStorage if available, else use defaults
        const savedSettings = JSON.parse(
            localStorage.getItem("bchSiteSettings") || "{}"
        );
        if (savedSettings.siteName) setSiteSettings(savedSettings);

        const savedBranding = JSON.parse(
            localStorage.getItem("bchBranding") || "{}"
        );
        if (savedBranding.primaryColor) setBranding(savedBranding);

        const savedContact = JSON.parse(localStorage.getItem("bchContact") || "{}");
        if (savedContact.phone) setContact(savedContact);

        const savedSocial = JSON.parse(localStorage.getItem("bchSocial") || "{}");
        if (savedSocial.facebook) setSocial(savedSocial);

        const savedFooter = JSON.parse(localStorage.getItem("bchFooter") || "{}");
        if (savedFooter.copyright) setFooter(savedFooter);
    }, []);

    const handleSave = (key: string, data: any) => {
        localStorage.setItem(key, JSON.stringify(data));
        alert("✅ Settings saved successfully!");
    };

    const renderSiteSettings = () => (
        <div className="settings-card">
            <h3>
                <i className="fas fa-cog"></i> General Settings
            </h3>
            <div className="form-group">
                <label>Website Name</label>
                <input
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) =>
                        setSiteSettings({ ...siteSettings, siteName: e.target.value })
                    }
                />
            </div>
            <div className="form-group">
                <label>Site Description</label>
                <textarea
                    rows={3}
                    value={siteSettings.description}
                    onChange={(e) =>
                        setSiteSettings({ ...siteSettings, description: e.target.value })
                    }
                ></textarea>
            </div>
            <div className="form-group">
                <label>Our Vision Text</label>
                <textarea
                    rows={3}
                    value={siteSettings.vision}
                    onChange={(e) =>
                        setSiteSettings({ ...siteSettings, vision: e.target.value })
                    }
                ></textarea>
            </div>
            <div className="form-group">
                <label>Google Map Embed URL</label>
                <input
                    type="text"
                    value={siteSettings.mapUrl}
                    onChange={(e) =>
                        setSiteSettings({ ...siteSettings, mapUrl: e.target.value })
                    }
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={() => handleSave("bchSiteSettings", siteSettings)}
            >
                Save Changes
            </button>
        </div>
    );

    const renderBranding = () => (
        <div className="settings-card">
            <h3>
                <i className="fas fa-palette"></i> Branding & Colors
            </h3>
            <div className="logo-preview-section">
                <div className="current-logo">
                    <h4>Current Logo</h4>
                    <div className="logo-display">
                        {branding.logo ? (
                            <img src={branding.logo} alt="Logo" />
                        ) : (
                            <p>No logo uploaded</p>
                        )}
                    </div>
                </div>
                <div className="logo-upload">
                    <h4>Upload New Logo</h4>
                    <div className="form-group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) =>
                                        setBranding({ ...branding, logo: ev.target?.result });
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        {branding.logo && (
                            <button
                                className="btn btn-danger"
                                style={{
                                    marginTop: "0.5rem",
                                    fontSize: "0.875rem",
                                    padding: "0.5rem 1rem",
                                    width: "auto",
                                    display: "inline-block"
                                }}
                                onClick={() => {
                                    if (confirm("Are you sure you want to remove the current logo?")) {
                                        setBranding({ ...branding, logo: "" });
                                    }
                                }}
                            >
                                <i className="fas fa-trash"></i> Remove Logo
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="color-picker-grid">
                <div className="color-item">
                    <label>Primary Color</label>
                    <div className="color-input-wrapper">
                        <input
                            type="color"
                            value={branding.primaryColor}
                            onChange={(e) =>
                                setBranding({ ...branding, primaryColor: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            value={branding.primaryColor}
                            readOnly
                        />
                    </div>
                </div>
                <div className="color-item">
                    <label>Secondary Color</label>
                    <div className="color-input-wrapper">
                        <input
                            type="color"
                            value={branding.secondaryColor}
                            onChange={(e) =>
                                setBranding({ ...branding, secondaryColor: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            value={branding.secondaryColor}
                            readOnly
                        />
                    </div>
                </div>
                <div className="color-item">
                    <label>Accent Color</label>
                    <div className="color-input-wrapper">
                        <input
                            type="color"
                            value={branding.accentColor}
                            onChange={(e) =>
                                setBranding({ ...branding, accentColor: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            value={branding.accentColor}
                            readOnly
                        />
                    </div>
                </div>
            </div>
            <button
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
                onClick={() => handleSave("bchBranding", branding)}
            >
                Save Branding
            </button>
        </div>
    );

    const renderContact = () => (
        <div className="settings-card">
            <h3>
                <i className="fas fa-address-book"></i> Contact Information
            </h3>
            <div className="form-row">
                <div className="form-group">
                    <label>Phone Number</label>
                    <input
                        type="text"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Address</label>
                <input
                    type="text"
                    value={contact.address}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>City/Location</label>
                <input
                    type="text"
                    value={contact.city}
                    onChange={(e) => setContact({ ...contact, city: e.target.value })}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={() => handleSave("bchContact", contact)}
            >
                Save Contact Info
            </button>
        </div>
    );

    const renderSocial = () => (
        <div className="settings-card">
            <h3>
                <i className="fas fa-share-alt"></i> Social Media Links
            </h3>
            <div className="form-group">
                <label>Facebook URL</label>
                <input
                    type="text"
                    value={social.facebook}
                    onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>Instagram URL</label>
                <input
                    type="text"
                    value={social.instagram}
                    onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>WhatsApp URL</label>
                <input
                    type="text"
                    value={social.whatsapp}
                    onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>TikTok URL</label>
                <input
                    type="text"
                    value={social.tiktok}
                    onChange={(e) => setSocial({ ...social, tiktok: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>Gmail/Email Link</label>
                <input
                    type="text"
                    value={social.gmail}
                    onChange={(e) => setSocial({ ...social, gmail: e.target.value })}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={() => handleSave("bchSocial", social)}
            >
                Save Social Links
            </button>
        </div>
    );

    const renderFooter = () => (
        <div className="settings-card">
            <h3>
                <i className="fas fa-edit"></i> Footer Content
            </h3>
            <div className="form-group">
                <label>Company Description</label>
                <textarea
                    rows={3}
                    value={footer.companyDescription}
                    onChange={(e) =>
                        setFooter({ ...footer, companyDescription: e.target.value })
                    }
                ></textarea>
            </div>
            <div className="form-group">
                <label>Copyright Text</label>
                <input
                    type="text"
                    value={footer.copyright}
                    onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label>Designed By Text</label>
                <input
                    type="text"
                    value={footer.designedBy}
                    onChange={(e) => setFooter({ ...footer, designedBy: e.target.value })}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={() => handleSave("bchFooter", footer)}
            >
                Save Footer Content
            </button>
        </div>
    );

    switch (activeSection) {
        case "site-settings":
            return renderSiteSettings();
        case "branding":
            return renderBranding();
        case "contact-info":
            return renderContact();
        case "social-media":
            return renderSocial();
        case "footer-editor":
            return renderFooter();
        default:
            return null;
    }
}
