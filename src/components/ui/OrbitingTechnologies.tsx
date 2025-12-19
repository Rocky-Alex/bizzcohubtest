'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Laptop,
    ShoppingCart,
    CreditCard,
    Smartphone,
    Globe,
    ShieldCheck,
    Server,
    Zap,
    Box,
    TrendingUp,
    Cpu,
    Wifi
} from 'lucide-react';
import './orbiting-technologies.css';

// Define the tech items to orbit
const INNER_ORBIT_ITEMS = [
    { icon: Laptop, color: '#00f0ff', label: 'Tech' },
    { icon: Smartphone, color: '#007aff', label: 'Mobile' },
    { icon: Cpu, color: '#9d00ff', label: 'Hardware' },
    { icon: Wifi, color: '#00ff9d', label: 'Connectivity' },
];

const OUTER_ORBIT_ITEMS = [
    { icon: ShoppingCart, color: '#ff0055', label: 'Commerce' },
    { icon: CreditCard, color: '#ffaa00', label: 'Payments' },
    { icon: Globe, color: '#007aff', label: 'Global' },
    { icon: ShieldCheck, color: '#00ff9d', label: 'Security' },
    { icon: Server, color: '#ff00ff', label: 'Infrastructure' },
    { icon: TrendingUp, color: '#ff5500', label: 'Growth' },
];

const OrbitingItem = ({ item, radius, angle, duration, direction = 1 }: { item: any, radius: number, angle: number, duration: number, direction?: number }) => {
    return (
        <motion.div
            className="orbit-item"
            initial={{ rotate: 0 }}
            animate={{ rotate: direction * 360 }}
            transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
            style={{
                // reset rotation of container so icon stays upright if we wanted, 
                // but here we are rotating the PARENT container to orbit.
                // Actually, a better way is to animate the angle.
            }}
        >
            {/* Wait, standard rotation rotates the element itself. 
                To orbit, we need to transform the position based on time.
            */}
        </motion.div>
    );
};

// A helper to calculate position based on time. 
// However, Framer Motion can animate 'rotate' on a parent container.
// Let's us a container that rotates, and the children counter-rotate to stay upright.

interface OrbitRingProps {
    radius: number;
    duration: number;
    items: typeof INNER_ORBIT_ITEMS;
    reverse?: boolean;
}

const OrbitRing = ({ radius, duration, items, reverse = false }: OrbitRingProps) => {
    return (
        <div
            className="absolute rounded-full flex items-center justify-center"
            style={{ width: radius * 2, height: radius * 2 }}
        >
            {/* The Ring Visual */}
            <div className="orbit-ring" style={{ width: '100%', height: '100%' }}></div>

            {/* The Rotator */}
            <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: reverse ? -360 : 360 }}
                transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
            >
                {items.map((item, index) => {
                    const angleStep = 360 / items.length;
                    const angle = index * angleStep;
                    // Position items on the circle
                    // We can use standard absolute positioning with rotation transforms
                    // x = r * cos(a), y = r * sin(a)
                    // But inside a rotating container, we just need to place them at a static offset 
                    // and then counter-rotate the ICON itself so it stays upright.

                    /* 
                       Placement logic:
                       Rotate the ITEM container by 'angle' deg, then translate by 'radius'
                    */

                    return (
                        <div
                            key={index}
                            className="absolute top-1/2 left-1/2 flex items-center justify-center"
                            style={{
                                width: '50px',
                                height: '50px',
                                marginLeft: '-25px',
                                marginTop: '-25px',
                                transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                            }}
                        >
                            {/* The Actual Icon Item */}
                            {/* We need to counter-rotate this item against the PARENT'S continuous rotation so it doesn't spin */}
                            <motion.div
                                className="orbit-item"

                                animate={{ rotate: reverse ? 360 : -360 }}
                                transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
                            >
                                <item.icon size={24} color={item.color} />
                            </motion.div>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default function OrbitingTechnologies() {
    return (
        <div className="orbit-container">
            {/* Center Core */}
            <div className="orbit-center">
                <Box className="orbit-center-icon" />
            </div>

            {/* Inner Ring */}
            <OrbitRing
                radius={120}
                duration={20}
                items={INNER_ORBIT_ITEMS}
            />

            {/* Outer Ring */}
            <OrbitRing
                radius={200}
                duration={35}
                items={OUTER_ORBIT_ITEMS}
                reverse
            />
        </div>
    );
}
