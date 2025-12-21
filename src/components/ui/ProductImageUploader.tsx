import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import './ProductImageUploader.css';

interface ProductImageUploaderProps {
    onImageSelected: (file: File) => void;
    onError?: (message: string) => void;
}

// Helpers
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) resolve(file);
            else reject(new Error('Canvas is empty'));
        }, 'image/jpeg', 0.95);
    });
}

export default function ProductImageUploader({ onImageSelected, onError }: ProductImageUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    // File Queue for Multi-upload
    const [filesQueue, setFilesQueue] = useState<File[]>([]);

    // Explicitly 688x529 Aspect Ratio
    const ASPECT_RATIO = 688 / 529;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            // Validate Type and Size
            const validFiles: File[] = [];
            let errorMsg = null;

            newFiles.forEach(file => {
                if (!file.type.match(/image\/(jpeg|png|webp)/)) {
                    errorMsg = "Only JPG, PNG or WebP images are allowed.";
                } else if (file.size > 10 * 1024 * 1024) {
                    errorMsg = "File size exceeds 10MB limit.";
                } else {
                    validFiles.push(file);
                }
            });

            if (errorMsg) {
                if (onError) onError(errorMsg);
                else alert(errorMsg);
            }

            if (validFiles.length > 0) {
                // Add to queue
                setFilesQueue(prev => [...prev, ...validFiles]);
            }

            e.target.value = "";
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    // Effect to process queue automatically
    React.useEffect(() => {
        if (filesQueue.length > 0 && !isCropModalOpen && !imageSrc) {
            const fileToProcess = filesQueue[0];
            readFile(fileToProcess).then(dataUrl => {
                setImageSrc(dataUrl as string);
                setIsCropModalOpen(true);
            });
        }
    }, [filesQueue, isCropModalOpen, imageSrc]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const processNext = () => {
        setIsCropModalOpen(false);
        setImageSrc(null);
        setZoom(1);
        setFilesQueue(prev => prev.slice(1)); // Remove first element, trigger next
    };

    const handleSaveCrop = async () => {
        try {
            if (imageSrc && croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (croppedBlob) {
                    const timestamp = new Date().getTime();
                    const croppedFile = new File([croppedBlob], `product_img_${timestamp}.jpg`, { type: "image/jpeg" });

                    onImageSelected(croppedFile);
                    processNext();
                }
            }
        } catch (e) {
            console.error(e);
            if (onError) onError("Failed to crop image.");
        }
    };

    const handleSkip = () => {
        // Skip current image and go to next
        processNext();
    };

    const handleCloseFull = () => {
        // Stop the entire flow
        setIsCropModalOpen(false);
        setImageSrc(null);
        setZoom(1);
        setFilesQueue([]);
    };

    return (
        <div className="product-uploader-container">
            {/* Trigger Area */}
            <div
                className="product-upload-trigger"
                onClick={() => fileInputRef.current?.click()}
            >
                <i className="fas fa-cloud-upload-alt product-upload-icon"></i>
                <div>
                    <p className="product-upload-text">Click to Add Product Images</p>
                    <p className="product-upload-subtext">Optimized for 688x529 px. Supports Multiple Uploads.</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple // Enabled multiple
                    onChange={onFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Crop Modal */}
            {isCropModalOpen && (
                <div className="product-crop-overlay">
                    <div className="product-crop-modal">
                        <div className="product-crop-header">
                            <h3>Edit Product Image ({filesQueue.length} remaining)</h3>
                            <button type="button" className="product-crop-close-btn" onClick={handleCloseFull}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="product-crop-area-container">
                            <Cropper
                                image={imageSrc || ""}
                                crop={crop}
                                zoom={zoom}
                                aspect={ASPECT_RATIO}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={true}
                                objectFit="contain"
                            />
                        </div>

                        <div className="product-crop-controls">
                            <div className="product-slider-group">
                                <i className="fas fa-minus" style={{ color: '#94a3b8' }}></i>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="product-zoom-slider"
                                />
                                <i className="fas fa-plus" style={{ color: '#94a3b8' }}></i>
                            </div>

                            <div className="product-crop-actions">
                                <button type="button" className="btn-product-cancel" onClick={handleSkip}>Skip This</button>
                                <button type="button" className="btn-product-save" onClick={handleSaveCrop}>
                                    <i className={`fas ${filesQueue.length > 1 ? 'fa-arrow-right' : 'fa-check'}`}></i> {filesQueue.length > 1 ? 'Next' : 'Crop & Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
