
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';
import getCroppedImg from '@/utils/cropImage';
import './AvatarUploader.css';

interface AvatarUploaderProps {
    currentImage?: string;
    onUpload: (file: Blob) => Promise<void>;
    nameInitial?: string;
}

export default function AvatarUploader({ currentImage, onUpload, nameInitial = 'U' }: AvatarUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    // const [rotation, setRotation] = useState(0); 
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validate
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size limits to 5MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload an image file");
                return;
            }

            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
            setIsModalOpen(true);
            // Reset state
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            if (!imageSrc || !croppedAreaPixels) return;

            setUploading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (croppedImageBlob) {
                await onUpload(croppedImageBlob);
                setIsModalOpen(false);
                setImageSrc(null); // Clear selection
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="avatar-uploader-container">
            <div className="avatar-preview-wrapper">
                {currentImage ? (
                    <img src={currentImage} alt="Profile" className="avatar-preview" />
                ) : (
                    <div className="avatar-placeholder">
                        {nameInitial.toUpperCase()}
                    </div>
                )}
            </div>

            <div className="uploader-actions">
                <input
                    type="file"
                    id="avatar-input-hidden"
                    accept="image/*"
                    onChange={onFileChange}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="btn-upload"
                    onClick={() => document.getElementById('avatar-input-hidden')?.click()}
                >
                    <i className="fas fa-camera" style={{ marginRight: '8px' }}></i>
                    Change Photo
                </button>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    JPG, GIF or PNG. Max 5MB.
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal">
                        <div className="crop-modal-header">
                            <h3>Edit Photo</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <div className="crop-container">
                            <Cropper
                                image={imageSrc || ''}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Circular/Square aspect
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="controls-container">
                            <div className="slider-group">
                                <span className="slider-label">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="zoom-slider"
                                />
                            </div>

                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button className="btn-save" onClick={handleSave} disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Save & Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
