import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';

const Help = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            question: "How does AI damage assessment work?",
            answer: "Our AI uses advanced YOLO V8 models trained on thousands of car damage images to automatically detect and assess damage severity. Simply upload photos of your vehicle, and our system will analyze the damage, identify affected parts, and provide a detailed repair estimate."
        },
        {
            question: "What types of damage can the AI detect?",
            answer: "Our AI can detect various types of damage including dents, scratches, broken parts, cracks, and structural damage. It works on all vehicle types and can assess damage to bumpers, doors, hoods, fenders, and other body parts."
        },
        {
            question: "How accurate are the damage assessments?",
            answer: "Our AI model achieves over 95% accuracy in damage detection and classification. However, we recommend having complex or severe damage verified by a professional mechanic for the most accurate repair estimates."
        },
        {
            question: "How long does an analysis take?",
            answer: "Most analyses are completed within 30-60 seconds. The AI processes your images instantly and generates a comprehensive damage report with estimated repair costs."
        },
        {
            question: "What photo quality do I need?",
            answer: "For best results, take clear, well-lit photos from multiple angles. Ensure the damaged area is visible and in focus. We recommend taking photos in daylight and from distances of 3-5 feet from the vehicle."
        },
        {
            question: "Is my data secure?",
            answer: "Yes, we take data security seriously. All uploaded images and reports are encrypted and stored securely. We never share your data with third parties without your explicit consent."
        },
        {
            question: "Can I get a PDF report?",
            answer: "Yes, you can download a detailed PDF report of your damage assessment from the dashboard. The report includes all detected damage, severity scores, affected parts, and estimated repair costs."
        },
        {
            question: "Do you support insurance claims?",
            answer: "Our detailed damage reports can be submitted to insurance companies as supporting documentation for claims. The reports include all necessary information that insurers typically require."
        }
    ];

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex justify-center mb-6">
                        <HelpCircle size={48} className="text-white/80" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">How Can We Help?</h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto">
                        Find answers to common questions about our AI-powered damage assessment service
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-white/20"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex justify-between items-center text-left"
                                >
                                    <span className="text-lg font-semibold pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''
                                            }`}
                                        size={24}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'
                                        }`}
                                >
                                    <div className="px-6 pb-5 text-white/70 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 px-4 pb-8">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">Still Need Help?</h2>
                    <p className="text-center text-white/70 mb-12">
                        Can't find what you're looking for? Our support team is here to help.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-all">
                            <Mail className="mx-auto mb-4" size={32} />
                            <h3 className="font-semibold mb-2">Email Support</h3>
                            <p className="text-white/70 text-sm mb-3">Get help via email</p>
                            <a href="mailto:support@digitalsurveyor.com" className="text-white/90 hover:text-white text-sm">
                                support@digitalsurveyor.com
                            </a>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-all">
                            <MessageCircle className="mx-auto mb-4" size={32} />
                            <h3 className="font-semibold mb-2">Live Chat</h3>
                            <p className="text-white/70 text-sm mb-3">Chat with our team</p>
                            <button className="text-white/90 hover:text-white text-sm">
                                Start Chat
                            </button>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-all">
                            <Phone className="mx-auto mb-4" size={32} />
                            <h3 className="font-semibold mb-2">Phone Support</h3>
                            <p className="text-white/70 text-sm mb-3">Call us directly</p>
                            <a href="tel:+1234567890" className="text-white/90 hover:text-white text-sm">
                                +1 (234) 567-890
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Help;