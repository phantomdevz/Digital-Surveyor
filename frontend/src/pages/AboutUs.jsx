import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award, Target } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function AboutUs() {
    const teamMembers = [
        {
            name: 'Aryan Nayak',
            role: 'Team Leader'
        },
        {
            name: 'Swati Smita Sahu',
            role: 'Team Member'
        },
        {
            name: 'Manaswinee Tripathy',
            role: 'Team Member'
        },
        {
            name: 'Swayam Pujari',
            role: 'Team Member'
        }
    ];

    const achievements = [
        {
            icon: Target,
            title: 'Our Mission',
            description: 'To revolutionize vehicle damage assessment using cutting-edge AI technology, making repairs faster, more accurate, and transparent.'
        },
        {
            icon: Star,
            title: 'Innovation',
            description: 'Leveraging YOLO V8 and advanced deep learning models to provide precise damage detection and cost estimation.'
        },
        {
            icon: Award,
            title: 'Excellence',
            description: 'Committed to delivering premium solutions that combine technical sophistication with user-friendly design.'
        }
    ];

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                            Team <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">CoreSynapse</span>
                        </h1>
                        <p className="text-white/70 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                            A passionate team of innovators building the future of AI-powered vehicle damage assessment
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission, Vision, Values */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {achievements.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300"
                            >
                                <item.icon className="w-12 h-12 text-blue-400 mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-white/70 leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Meet Our Team
                        </h2>
                        <p className="text-white/70 text-lg max-w-2xl mx-auto">
                            The brilliant minds behind Digital Surveyor
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member, index) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 group text-center"
                            >
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                                    {member.name}
                                </h3>
                                <p className="text-white/50 text-sm font-medium uppercase tracking-wider">
                                    {member.role}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-20 px-4 border-t border-white/10">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                            Powered by Advanced Technology
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { name: 'YOLO V8', desc: 'AI Model' },
                                { name: 'React', desc: 'Frontend' },
                                { name: 'FastAPI', desc: 'Backend' },
                                { name: 'Supabase', desc: 'Database' }
                            ].map((tech, index) => (
                                <motion.div
                                    key={tech.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all"
                                >
                                    <h3 className="text-xl font-bold text-white mb-1">{tech.name}</h3>
                                    <p className="text-white/60 text-sm">{tech.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
