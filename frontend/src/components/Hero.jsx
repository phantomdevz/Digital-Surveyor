import React from 'react'

const Hero = () => {
    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold mb-4">Welcome to CoreSynapse</h1>
                <p className="text-lg text-gray-600 mb-4">Your trusted partner for construction site safety and security.</p>
                <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium">
                    Get Started
                </Link>
            </div>
        </>
    )
}

export default Hero