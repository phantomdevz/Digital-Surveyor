import TrueFocus from '../components/TrueFocus';
import Navbar from '../components/Navbar';
import LaserFlow from '../components/LaserFlow';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DecryptedText from '../components/DecryptedText';



export default function Landing() {
    const laserSectionRef = useRef(null);
    const [isLaserVisible, setIsLaserVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Fade in when entering viewport, fade out when leaving
                    setIsLaserVisible(entry.isIntersecting);
                });
            },
            {
                threshold: 0.15, // Trigger when 15% of the section is visible
                rootMargin: '0px' // No offset
            }
        );

        if (laserSectionRef.current) {
            observer.observe(laserSectionRef.current);
        }

        return () => {
            if (laserSectionRef.current) {
                observer.unobserve(laserSectionRef.current);
            }
        };
    }, []);
    return (
        <div className="bg-black">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10 bg-black">
                <TrueFocus
                    sentence="Digital Surveyor"
                    manualMode
                    blurAmount={5}
                    borderColor="#ffffff"
                    animationDuration={0.5}
                    pauseBetweenAnimations={1}
                />

                {/* Motto Subheader */}
                <motion.p
                    className="text-white/80 text-2xl text-bold md:text-2xl font-light mt-8 text-center max-w-2xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
                >
                    Accidents Are Stressful. Your Repair Shouldn't Be.
                </motion.p>
            </section>

            {/* LaserFlow Section - Appears on scroll */}
            <section
                ref={laserSectionRef}
                className={`min-h-screen relative overflow-hidden bg-black transition-all duration-1000 ease-out ${isLaserVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                    }`}
            >
                <LaserFlow />

                {/* CTA Button below laser */}
                <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 z-20 px-20 pl-80">
                    <Link to="/login">
                        <motion.button
                            className="px-16 py-3 bg-grey/10 backdrop-blur-lg border border-grey/10 text-white text-2xl font-bold rounded-full shadow-2xl hover:bg-grey/20 hover:border-grey/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300 whitespace-nowrap"
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLaserVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            Start AI Analysis
                        </motion.button>
                    </Link>
                </div>

                {/* Counter at bottom center */}
                <div className="absolute bottom-12 left-[60%] transform -translate-x-1/2 z-20">
                    <div className="flex justify-center items-center gap-16 md:gap-24">
                        {/* Models Column */}
                        <div className="text-center">
                            <p className="text-white text-xl md:text-2xl font-bold mb-2">Models</p>
                            <h2 className="text-white text-3xl md:text-4xl font-bold whitespace-nowrap">YOLO V8</h2>
                        </div>

                        {/* Trained on Column */}
                        <div className="text-center">
                            <p className="text-white text-xl md:text-2xl font-bold mb-2">Trained on</p>
                            <h2 className="text-white text-3xl md:text-4xl font-bold">Roboflow</h2>
                        </div>

                        {/* Datasets Column */}
                        <div className="text-center">
                            <p className="text-white text-xl md:text-2xl font-bold mb-2">Datasets</p>
                            <h2 className="text-white text-3xl md:text-4xl font-bold">9.8k</h2>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-start pl-8 pt-16">
                    <div className="text-left text-white">
                        <motion.h2
                            className="text-8xl font-bold leading-none"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut"
                            }}
                        >

                            Let
                            <br />
                            AI
                            <br />
                            Do
                            <br />
                            Your
                            <br />
                            Math.
                        </motion.h2>
                    </div>
                </div>
            </section>
        </div>
    );
}
