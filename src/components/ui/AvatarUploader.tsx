import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './AvatarUploader.css';

interface AvatarUploaderProps {
    onImageSelected: (file: File) => void;
    currentImage?: string | null;
    aspect?: number; // default 1:1
    nameInitial?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
        image.src = url;
    });

const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
};

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0);

    // As Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) resolve(file);
            else reject(new Error('Canvas is empty'));
        }, 'image/jpeg');
    });
}

export default function AvatarUploader({ onImageSelected, currentImage, aspect = 1, nameInitial }: AvatarUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    // Internal Preview
    const [preview, setPreview] = useState<string | null>(currentImage || null);

    // Update preview if prop changes externally
    React.useEffect(() => {
        if (currentImage) setPreview(currentImage);
    }, [currentImage]);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Validate Type
            if (!file.type.match(/image\/(jpeg|png)/)) {
                alert("Only JPG or PNG images are allowed.");
                return;
            }

            // Validate Size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit.");
                return;
            }

            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
            setIsCropModalOpen(true);
            e.target.value = ""; // reset input
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

    const handleSaveCrop = async () => {
        try {
            if (imageSrc && croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (croppedBlob) {
                    // Create a File from Blob
                    const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

                    // Update Preview
                    const previewUrl = URL.createObjectURL(croppedBlob);
                    setPreview(previewUrl);

                    // Pass to Parent
                    onImageSelected(croppedFile);

                    setIsCropModalOpen(false);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to crop image.");
        }
    };

    return (
        <div className="avatar-uploader-container">
            <div className="avatar-upload-area">
                <div className="avatar-preview-wrapper">
                    {preview ? (
                        <img src={preview} alt="Avatar Preview" />
                    ) : (
                        <div className="placeholder-icon" style={nameInitial ? {
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            color: '#6366f1',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#e0e7ff'
                        } : {}}>
                            {nameInitial ? nameInitial.toUpperCase() : <i className="fas fa-image"></i>}
                        </div>
                    )}
                </div>

                <div className="upload-controls">
                    <label className="btn-choose-file">
                        <i className="fas fa-upload"></i>
                        <span>Upload Image</span>
                        <input
                            type="file"
                            onChange={onFileChange}
                            accept="image/png, image/jpeg"
                            style={{ display: 'none' }}
                        />
                    </label>
                    <p className="upload-hint">JPG or PNG format, max 5MB.</p>
                </div>
            </div>

            {/* Crop Modal */}
            {isCropModalOpen && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal">
                        <div className="crop-modal-header">
                            <h3>Edit Image</h3>
                            <button className="btn-close-icon" onClick={() => setIsCropModalOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="crop-container">
                            <Cropper
                                image={imageSrc || ""}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={true}
                                cropShape={aspect === 1 ? "round" : "rect"}
                            />
                        </div>
                        <div className="slider-container">
                            <span className="zoom-label">-</span>
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
                            <span className="zoom-label">+</span>
                        </div>
                        <div className="crop-modal-footer">
                            <button className="btn-cancel" onClick={() => setIsCropModalOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSaveCrop}>Save & Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
