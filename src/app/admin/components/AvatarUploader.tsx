"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';
import getCroppedImg from '../utils/cropImage';
import './AvatarUploader.css';

interface AvatarUploaderProps {
    currentImage?: string | null;
    onImageChange: (file: File, previewUrl: string) => void;
    imageName?: string;
}

export default function AvatarUploader({ currentImage, onImageChange, imageName = 'User' }: AvatarUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    // File input ref
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file (JPG, PNG)');
                return;
            }

            // Validate file size (e.g., 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setIsCropperOpen(true);
            });
            reader.readAsDataURL(file);

            // Reset input value to allow selecting same file again
            e.target.value = '';
        }
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );

            if (croppedBlob) {
                const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
                const previewUrl = URL.createObjectURL(croppedBlob);

                onImageChange(file, previewUrl);
                setIsCropperOpen(false);
                setZoom(1);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to crop image');
        }
    }, [imageSrc, croppedAreaPixels, onImageChange]);

    const handleSelectClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="avatar-uploader-container">
            <div className="avatar-preview-section">
                <div className="current-avatar-preview">
                    {currentImage ? (
                        <img src={currentImage} alt={imageName} />
                    ) : (
                        <div className="avatar-placeholder">
                            <i className="far fa-image"></i>
                        </div>
                    )}
                </div>

                <div className="upload-actions">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={onFileChange}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        onClick={handleSelectClick}
                        className="select-image-btn"
                    >
                        <i className="fas fa-upload"></i> Change Image
                    </button>
                    <p className="resize-hint">JPG or PNG. Max 5MB.</p>
                </div>
            </div>

            {isCropperOpen && (
                <div className="cropper-modal-overlay">
                    <div className="cropper-modal-content">
                        <div className="cropper-header">
                            <h3>Edit Image</h3>
                            <button
                                className="close-cropper-btn"
                                onClick={() => setIsCropperOpen(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="cropper-area">
                            <Cropper
                                image={imageSrc || ''}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="slider-container">
                            <i className="fas fa-minus zoom-icon"></i>
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
                            <i className="fas fa-plus zoom-icon"></i>
                        </div>

                        <div className="cropper-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setIsCropperOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-apply"
                                onClick={showCroppedImage}
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
