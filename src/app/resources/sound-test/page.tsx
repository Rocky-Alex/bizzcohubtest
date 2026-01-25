"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAudioFiles } from './actions';
import { ArrowLeft, Volume2, Mic, Play, Pause, Square, Music } from 'lucide-react';

export default function SoundTestPage() {
    const [audioFiles, setAudioFiles] = useState<{ name: string; path: string }[]>([]);

    useEffect(() => {
        getAudioFiles().then(setAudioFiles);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '80px',
            backgroundColor: '#0a0a0a',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <header style={{
                padding: '24px',
                borderBottom: '1px solid #262626',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <Link href="/resources" style={{ color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <ArrowLeft size={20} /> Back
                </Link>
                <div style={{ width: '1px', height: '24px', background: '#404040' }}></div>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>System Dashboard</h1>
            </header>

            <main style={{
                flex: '1',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '40px'
            }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Audio Diagnostics
                </h1>

                {/* Speaker Test Section */}
                <SpeakerTester files={audioFiles} />

                {/* Reference Tracks Section */}
                <ReferenceTracks files={audioFiles} />

                {/* Microphone Test Section */}
                <MicrophoneTester />

            </main>
        </div>
    );
}

const ReferenceTracks = ({ files }: { files: { name: string; path: string }[] }) => {
    const [playingFile, setPlayingFile] = useState<string | null>(null);
    const [panMode, setPanMode] = useState<'left' | 'right' | 'both'>('both');

    // Refs for Web Audio API
    const audioCtxRef = useRef<AudioContext | null>(null);
    const pannerRef = useRef<StereoPannerNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    // Handle Pan Change
    const handlePanChange = (mode: 'left' | 'right' | 'both') => {
        setPanMode(mode);
        if (pannerRef.current && audioCtxRef.current) {
            const val = mode === 'left' ? -1 : mode === 'right' ? 1 : 0;
            pannerRef.current.pan.setValueAtTime(val, audioCtxRef.current.currentTime);
        }
    };

    const togglePlay = async (file: { name: string; path: string }) => {
        // Stop logic
        if (playingFile === file.name) {
            audioRef.current?.pause();
            setPlayingFile(null);
            return;
        }

        // Cleanup existing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Initialize Audio Context if needed
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }

        // Initialize Panner
        if (!pannerRef.current) {
            pannerRef.current = audioCtxRef.current.createStereoPanner();
            pannerRef.current.connect(audioCtxRef.current.destination);
        }

        // Set initial pan based on current mode
        const currentPan = panMode === 'left' ? -1 : panMode === 'right' ? 1 : 0;
        pannerRef.current.pan.value = currentPan;

        // Create new Audio element
        const audio = new Audio(file.path);
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;

        // Create Source and connect to Panner
        const source = audioCtxRef.current.createMediaElementSource(audio);
        source.connect(pannerRef.current);
        sourceRef.current = source;

        // Handle end
        audio.onended = () => setPlayingFile(null);

        try {
            await audio.play();
            setPlayingFile(file.name);
        } catch (err) {
            console.error("Playback failed:", err);
        }
    };

    if (files.length === 0) return null;

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#171717',
            borderRadius: '24px',
            border: '1px solid #262626',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {/* Header and Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e5e5' }}>
                    <Music size={24} color="#38bdf8" />
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Speaker Testing Reference Tracks</h2>
                </div>

                {/* Channel Controls */}
                <div style={{
                    display: 'flex',
                    background: '#262626',
                    padding: '4px',
                    borderRadius: '12px',
                    gap: '4px'
                }}>
                    <button
                        onClick={() => handlePanChange('left')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: panMode === 'left' ? '#ec4899' : 'transparent',
                            color: panMode === 'left' ? 'white' : '#737373',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        L
                    </button>
                    <button
                        onClick={() => handlePanChange('both')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: panMode === 'both' ? '#8b5cf6' : 'transparent',
                            color: panMode === 'both' ? 'white' : '#737373',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        L+R
                    </button>
                    <button
                        onClick={() => handlePanChange('right')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: panMode === 'right' ? '#ec4899' : 'transparent',
                            color: panMode === 'right' ? 'white' : '#737373',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        R
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((file) => (
                    <div
                        key={file.name}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            background: playingFile === file.name ? 'rgba(56, 189, 248, 0.1)' : '#262626',
                            borderRadius: '12px',
                            border: playingFile === file.name ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div style={{
                                width: '40px', height: '40px',
                                background: playingFile === file.name ? '#38bdf8' : '#334155',
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {playingFile === file.name ? <Pause size={20} color="black" /> : <Play size={20} color="white" />}
                            </div>
                            <span style={{ fontSize: '14px', color: playingFile === file.name ? '#38bdf8' : '#e5e5e5', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.name}
                            </span>
                        </div>

                        <button
                            onClick={() => togglePlay(file)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #404040',
                                color: '#a3a3a3',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {playingFile === file.name ? 'Stop' : 'Play'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SpeakerTester = ({ files }: { files: { name: string; path: string }[] }) => {
    const [playing, setPlaying] = useState<'left' | 'right' | 'both' | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | MediaElementAudioSourceNode | null>(null);
    const audioElRef = useRef<HTMLAudioElement | null>(null);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            // If it's an oscillator or buffer source, we can try stop
            try { (sourceNodeRef.current as any).stop(); } catch (e) { }
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (audioElRef.current) {
            audioElRef.current.pause();
            audioElRef.current = null;
        }
        setPlaying(null);
    };

    const playSound = async (pan: number, type: 'left' | 'right' | 'both') => {
        // If clicking same button, toggle off
        if (playing === type) {
            stopAudio();
            return;
        }

        // Stop any current playback first
        stopAudio();

        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current!;
        if (ctx.state === 'suspended') await ctx.resume();

        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        panner.connect(ctx.destination);

        // CHOICE: Use File or Tone?
        if (files.length > 0) {
            // Play the first available file
            const file = files[0];
            const audio = new Audio(file.path);
            audio.crossOrigin = "anonymous"; // Important for some setups

            const source = ctx.createMediaElementSource(audio);
            source.connect(panner);

            audio.play();
            audio.onended = () => setPlaying(null);

            audioElRef.current = audio;
            sourceNodeRef.current = source;
        } else {
            // Fallback to Beep
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

            oscillator.connect(gainNode);
            gainNode.connect(panner);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 1);

            sourceNodeRef.current = oscillator as any;
        }

        setPlaying(type);
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#171717',
            borderRadius: '24px',
            border: '1px solid #262626',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e5e5' }}>
                <Volume2 size={24} color="#ec4899" />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Speaker Testing</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {/* Left */}
                <button
                    onClick={() => playSound(-1, 'left')}
                    style={{
                        padding: '24px',
                        background: playing === 'left' ? '#ec4899' : '#262626',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                        color: 'white'
                    }}
                >
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>L</div>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>Test Left</span>
                </button>

                {/* Center */}
                <button
                    onClick={() => playSound(0, 'both')}
                    style={{
                        padding: '24px',
                        background: playing === 'both' ? '#8b5cf6' : '#262626',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                        color: 'white'
                    }}
                >
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>L+R</div>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>Test Both</span>
                </button>

                {/* Right */}
                <button
                    onClick={() => playSound(1, 'right')}
                    style={{
                        padding: '24px',
                        background: playing === 'right' ? '#ec4899' : '#262626',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                        color: 'white'
                    }}
                >
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>R</div>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>Test Right</span>
                </button>
            </div>

            <p style={{ textAlign: 'center', color: '#737373', fontSize: '13px' }}>
                {files.length > 0
                    ? `Playing: ${files[0].name}`
                    : "No reference tracks found. Playing test tone."}
            </p>
        </div>
    );
};

const MicrophoneTester = () => {
    const [listening, setListening] = useState(false);
    const [recording, setRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);

    // Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current;

            analyserRef.current = ctx.createAnalyser();
            analyserRef.current.fftSize = 256;

            sourceRef.current = ctx.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            setListening(true);
            updateMeter();
        } catch (err) {
            console.error("Mic Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopMic = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        // Stop recording if active
        if (recording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (sourceRef.current) {
            sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            sourceRef.current.disconnect();
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => { });
        }

        setListening(false);
        setRecording(false);
        setVolume(0);
    };

    const startRecording = () => {
        if (!sourceRef.current) return;

        const stream = sourceRef.current.mediaStream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setRecording(false);
        };

        mediaRecorder.start();
        setRecording(true);
        setAudioUrl(null); // Clear previous recording
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const updateMeter = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        setVolume(Math.min(100, average * 1.5)); // Scale up a bit

        rafRef.current = requestAnimationFrame(updateMeter);
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#171717',
            borderRadius: '24px',
            border: '1px solid #262626',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e5e5' }}>
                <Mic size={24} color="#8b5cf6" />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Microphone Testing</h2>
            </div>

            {/* Volume Visualization */}
            <div style={{
                height: '64px',
                background: '#262626',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px'
            }}>
                <div style={{
                    height: '32px',
                    width: `${volume}%`,
                    background: recording ? '#ec4899' : 'linear-gradient(90deg, #8b5cf6, #ec4899)', // Red when recording
                    borderRadius: '8px',
                    transition: 'width 0.05s ease-out',
                    minWidth: '4px'
                }}></div>

                {!listening && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373', fontSize: '14px' }}>
                        Microphone is off
                    </div>
                )}
                {recording && (
                    <div style={{ position: 'absolute', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ec4899', fontSize: '12px', fontWeight: 'bold' }}>
                        <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }}></div>
                        REC
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {!listening ? (
                    <button
                        onClick={startMic}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#8b5cf6', color: 'white',
                            border: 'none', padding: '12px 32px', borderRadius: '12px',
                            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        <Play size={18} /> Start Mic
                    </button>
                ) : (
                    <>
                        <button
                            onClick={stopMic}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#262626', color: '#e5e5e5',
                                border: '1px solid #404040', padding: '12px 24px', borderRadius: '12px',
                                fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            <Square size={16} fill="currentColor" /> Stop Mic
                        </button>

                        {!recording ? (
                            <button
                                onClick={startRecording}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: '#ec4899', color: 'white',
                                    border: 'none', padding: '12px 24px', borderRadius: '12px',
                                    fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white' }}></div> Record Clip
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: '#be185d', color: 'white',
                                    border: 'none', padding: '12px 24px', borderRadius: '12px',
                                    fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                <Square size={14} fill="currentColor" /> Stop Rect
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Playback Section */}
            {audioUrl && (
                <div style={{
                    marginTop: '8px',
                    background: '#262626',
                    padding: '16px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e5e5' }}>Playback Recording</div>
                    <audio controls src={audioUrl} style={{ width: '100%', height: '32px' }} />
                </div>
            )}

        </div>
    );
};
