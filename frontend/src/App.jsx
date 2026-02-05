// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/DigitalGarage';
import Scanner from './pages/Scanner';
import AnalysisResult from './pages/AnalysisResult';
import Landing from './pages/Landing';
import Help from './pages/Help';
import AboutUs from './pages/AboutUs';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <AuthGuard>
                                <Dashboard />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/scan/new"
                        element={
                            <AuthGuard>
                                <Scanner />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/scan/:id"
                        element={
                            <AuthGuard>
                                <AnalysisResult />
                            </AuthGuard>
                        }
                    />

                    {/* Landing Page */}
                    <Route path="/" element={<Landing />} />

                    {/* Help Page */}
                    <Route path="/help" element={<Help />} />

                    {/* About Us Page */}
                    <Route path="/about" element={<AboutUs />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
