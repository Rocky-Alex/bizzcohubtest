

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useState, useEffect } from 'react';
import '../styles/Stack.css';

interface CardRotateProps {
    children: React.ReactNode;
    onSendToBack: () => void;
    sensitivity: number;
    disableDrag?: boolean;
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }: CardRotateProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [60, -60]);
    const rotateY = useTransform(x, [-100, 100], [-60, 60]);

    function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
        if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
            onSendToBack();
        } else {
            x.set(0);
            y.set(0);
        }
    }

    if (disableDrag) {
        return (
            <motion.div
                className="card-rotate-disabled"
                style={{ x: 0, y: 0 }}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            className="card-rotate"
            style={{ x, y, rotateX, rotateY }}
            drag
            dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
            dragElastic={0.6}
            whileTap={{ cursor: 'grabbing' }}
            onDragEnd={handleDragEnd}
        >
            {children}
        </motion.div>
    );
}

interface StackProps {
    randomRotation?: boolean;
    sensitivity?: number;
    sendToBackOnClick?: boolean;
    cards?: React.ReactNode[];
    animationConfig?: { stiffness: number; damping: number };
    autoplay?: boolean;
    autoplayDelay?: number;
    pauseOnHover?: boolean;
    mobileClickOnly?: boolean;
    mobileBreakpoint?: number;
}

export default function Stack({
    randomRotation = false,
    sensitivity = 200,
    cards = [],
    animationConfig = { stiffness: 260, damping: 20 },
    sendToBackOnClick = false,
    autoplay = false,
    autoplayDelay = 3000,
    pauseOnHover = false,
    mobileClickOnly = false,
    mobileBreakpoint = 768,
}: StackProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [cardRotations, setCardRotations] = useState<Record<number, number>>({});

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < mobileBreakpoint);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [mobileBreakpoint]);

    const shouldDisableDrag = isMobile || (mobileClickOnly && isMobile);
    const shouldEnableClick = !isMobile && (sendToBackOnClick || shouldDisableDrag);

    const [stack, setStack] = useState<{ id: number; content: React.ReactNode }[]>(
        () => {
            if (cards.length) {
                return cards.map((content, index) => ({ id: index + 1, content }));
            } else {
                return [
                    {
                        id: 1,
                        content: (
                            <img
                                src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format"
                                alt="card-1"
                                className="card-image"
                            />
                        ),
                    },
                    {
                        id: 2,
                        content: (
                            <img
                                src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format"
                                alt="card-2"
                                className="card-image"
                            />
                        ),
                    },
                    {
                        id: 3,
                        content: (
                            <img
                                src="https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format"
                                alt="card-3"
                                className="card-image"
                            />
                        ),
                    },
                    {
                        id: 4,
                        content: (
                            <img
                                src="https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format"
                                alt="card-4"
                                className="card-image"
                            />
                        ),
                    },
                ];
            }
        }
    );

    // Generate random rotations only on client-side
    useEffect(() => {
        if (randomRotation && stack.length > 0) {
            const rotations: Record<number, number> = {};
            stack.forEach(card => {
                rotations[card.id] = Math.random() * 10 - 5;
            });
            setCardRotations(rotations);
        }
    }, [randomRotation, stack.length]);

    useEffect(() => {
        if (cards.length) {
            setStack(cards.map((content, index) => ({ id: index + 1, content })));
        }
    }, [cards]);

    const sendToBack = (id: number) => {
        setStack((prev) => {
            const newStack = [...prev];
            const index = newStack.findIndex((card) => card.id === id);
            const [card] = newStack.splice(index, 1);
            newStack.unshift(card);
            return newStack;
        });
    };

    useEffect(() => {
        if (autoplay && !isPaused) {
            const interval = setInterval(() => {
                setStack((prev) => {
                    if (prev.length <= 1) return prev;
                    const newStack = [...prev];
                    const card = newStack.pop(); // Remove the top card (last element)
                    if (card) {
                        newStack.unshift(card); // Move it to bottom (first element)
                    }
                    return newStack;
                });
            }, autoplayDelay);

            return () => clearInterval(interval);
        }
    }, [autoplay, autoplayDelay, isPaused]);

    return (
        <div
            className="stack-container"
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            {stack.map((card, index) => {
                const randomRotate = cardRotations[card.id] || 0;
                return (
                    <CardRotate
                        key={card.id}
                        onSendToBack={() => sendToBack(card.id)}
                        sensitivity={sensitivity}
                        disableDrag={shouldDisableDrag}
                    >
                        <motion.div
                            className="card"
                            onClick={() => shouldEnableClick && sendToBack(card.id)}
                            animate={{
                                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                                scale: 1 + index * 0.06 - stack.length * 0.06,
                                transformOrigin: '90% 90%',
                            }}
                            initial={false}
                            transition={{
                                type: 'spring',
                                stiffness: animationConfig.stiffness,
                                damping: animationConfig.damping,
                            }}
                        >
                            {card.content}
                        </motion.div>
                    </CardRotate>
                );
            })}
        </div>
    );
}
