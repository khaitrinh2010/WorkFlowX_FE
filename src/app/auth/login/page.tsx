"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { FcGoogle } from "react-icons/fc"; // Google icon
import { motion } from "framer-motion"; // Animation

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");

        try {
            let googleLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
            router.push(googleLoginUrl);
        } catch (err) {
            setError("Failed to login. Try again.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
            <motion.div
                className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    Welcome Back
                </h2>
                <button
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 p-3 rounded-lg shadow-md hover:bg-gray-100 transition-all"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <svg
                            className="animate-spin h-5 w-5 text-gray-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                        </svg>
                    ) : (
                        <>
                            <FcGoogle className="text-2xl" />
                            <span className="text-gray-700 font-medium">Login with Google</span>
                        </>
                    )}
                </button>

                <p className="text-gray-500 text-center text-sm mt-4">
                    By logging in, you agree to our{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                        Terms & Conditions
                    </a>.
                </p>
            </motion.div>
        </div>
    );
}
