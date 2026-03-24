import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Mail, User, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginModal: React.FC = () => {
    const { isLoginModalOpen, closeLoginModal, login, signUp, sendEmailOTP, verifyEmailOTP, resetPasswordWithOTP } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [showPassword, setShowPassword] = useState(false);

    // Form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');

    // UI states
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    if (!isLoginModalOpen) return null;

    const handleSendOTP = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const { error: otpError } = await sendEmailOTP(email, mode === 'forgot' ? 'forgot' : 'signup');
            if (otpError) {
                setError(otpError.message || "Failed to send OTP.");
            } else {
                setIsOtpSent(true);
                setOtpTimer(60);
                setSuccessMessage("OTP sent to your email!");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (mode === 'signup' || mode === 'forgot') {
            if (!isOtpVerified) {
                setError("Please verify your email address first.");
                return;
            }
            if (password.length < 8) {
                setError("Password must be at least 8 characters long.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                const { error: loginError } = await login(email, password);
                if (loginError) setError(loginError.message);
                else closeLoginModal();
            } else if (mode === 'signup') {
                const { error: signUpError } = await signUp(username, email, password, otp);
                if (signUpError) {
                    setError(signUpError.message);
                } else {
                    setSuccessMessage("Account created successfully!");
                    // Login is automatic in our AuthContext
                }
            } else if (mode === 'forgot') {
                const { error: resetError } = await resetPasswordWithOTP(email, otp, password);
                if (resetError) {
                    setError(resetError.error || resetError.message);
                } else {
                    setSuccessMessage("Password reset successfully! You can now sign in.");
                    setTimeout(() => {
                        setMode('login');
                        resetFields();
                    }, 2000);
                }
            }
        } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputFocus = () => {
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    const resetFields = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setOtp('');
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setError(null);
        setSuccessMessage(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={closeLoginModal}
            ></div>

            <div className="relative bg-white w-full max-w-[450px] rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                {/* Header Image */}
                <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                        src="/kk.png"
                        alt="Kottravai"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-[0.15em]">
                                {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join Us' : 'Recovery'}
                            </h2>
                            <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-medium">
                                {mode === 'login' ? 'Sign in to continue' : mode === 'signup' ? 'Create an email verified account' : 'Reset your credentials'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={closeLoginModal}
                        className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-8 sm:p-10 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-3">
                            {/* Username field (Signup only) */}
                            {mode === 'signup' && (
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#b5128f] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-gray-700 placeholder-gray-400 focus:bg-white focus:border-[#b5128f]/20 focus:ring-4 focus:ring-[#b5128f]/5 outline-none transition-all"
                                    />
                                </div>
                            )}

                            {/* Email field (Shared by login/signup) */}
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#b5128f] transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    onFocus={handleInputFocus}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-gray-700 placeholder-gray-400 focus:bg-white focus:border-[#b5128f]/20 focus:ring-4 focus:ring-[#b5128f]/5 outline-none transition-all"
                                />
                            </div>

                            {/* Email OTP Verification (Signup and Forgot) */}
                            {(mode === 'signup' || mode === 'forgot') && (
                                <div className="space-y-3">
                                    <div className="relative group flex gap-2">
                                        {!isOtpVerified && !isOtpSent && (
                                            <button
                                                type="button"
                                                onClick={handleSendOTP}
                                                disabled={!email || isSubmitting}
                                                className="w-full px-6 py-4 bg-[#b5128f] text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors disabled:bg-gray-200 disabled:text-gray-400"
                                            >
                                                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                                            </button>
                                        )}
                                    </div>

                                    {/* OTP Field */}
                                    {isOtpSent && !isOtpVerified && (
                                        <div className="flex flex-col gap-2 mt-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Enter Verification Code</label>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="OTP"
                                                    required
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                    className="flex-1 px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-center text-lg font-black tracking-[0.5em] text-emerald-900 focus:border-emerald-500 outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setIsSubmitting(true);
                                                        const { error: vErr } = await verifyEmailOTP(email, otp);
                                                        if (vErr) setError(vErr.message);
                                                        else {
                                                            setIsOtpVerified(true);
                                                            setSuccessMessage("Email verified successfully!");
                                                        }
                                                        setIsSubmitting(false);
                                                    }}
                                                    disabled={otp.length !== 6 || isSubmitting}
                                                    className="px-6 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase"
                                                >
                                                    Confirm
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSendOTP}
                                                disabled={otpTimer > 0 || isSubmitting}
                                                className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 self-center mt-2 flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} className={isSubmitting ? 'animate-spin' : ''} />
                                                {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend Code'}
                                            </button>
                                        </div>
                                    )}

                                    {isOtpVerified && (
                                        <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                                            <RefreshCw size={14} className="text-emerald-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Email Verified</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Password field */}
                            {(mode !== 'forgot' || isOtpVerified) && (
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#b5128f] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder={mode === 'forgot' ? "New Password" : "Password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="w-full pl-14 pr-14 py-4 bg-gray-50 border border-transparent rounded-2xl text-gray-700 placeholder-gray-400 focus:bg-white focus:border-[#b5128f]/20 focus:ring-4 focus:ring-[#b5128f]/5 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            )}

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-1 fade-in duration-300">
                                    <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-tight">
                                        {error}
                                    </p>
                                </div>
                            )}
                            {successMessage && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-1 fade-in duration-300">
                                    <p className="text-[10px] font-bold text-emerald-600 text-center uppercase tracking-tight">
                                        {successMessage}
                                    </p>
                                </div>
                            )}
                        </div>

                        {mode === 'login' && (
                            <div className="flex justify-start">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetFields();
                                        setMode('forgot');
                                    }}
                                    className="text-xs font-bold text-gray-400 hover:text-[#b5128f] transition-colors uppercase tracking-widest"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || (mode === 'signup' && !isOtpVerified)}
                            className={`group relative w-full py-5 bg-black text-white font-black uppercase tracking-[0.3em] text-sm rounded-2xl hover:bg-[#b5128f] transition-all transform active:scale-[0.98] shadow-xl overflow-hidden disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isSubmitting ? 'Please Wait' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Recover'}
                                {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {mode === 'login' ? "New to Kottravai? " : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'signup' : 'login');
                                        resetFields();
                                    }}
                                    className="text-[#b5128f] font-black hover:underline underline-offset-4"
                                >
                                    {mode === 'login' ? 'Join Now' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;

