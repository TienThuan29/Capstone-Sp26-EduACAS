'use client';
import { useState, useEffect } from 'react';
import { Constant } from "@/configs/constant";
import { Card } from 'flowbite-react';

export default function TestAuthPage() {
    const [userProfileData, setUserProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get user profile from localStorage (client-side only)
        const userProfile = localStorage.getItem(Constant.USER_PROFILE_KEY);
        if (userProfile) {
            try {
                const parsed = JSON.parse(userProfile);
                setUserProfileData(parsed);
            } catch (error) {
                console.error('Error parsing user profile:', error);
                setUserProfileData(null);
            }
        } else {
            setUserProfileData(null);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!userProfileData) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Test Auth Page
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            No user profile found. Please log in first.
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
            <div className="mx-auto max-w-2xl">
                <Card>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Test Auth Page
                    </h1>
                    <div className="space-y-3">
                        <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{userProfileData.name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{userProfileData.email || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Role:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{userProfileData.role || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">ID:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{userProfileData.id || 'N/A'}</span>
                        </div>
                        {userProfileData.createdAt && (
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Created At:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{userProfileData.createdAt}</span>
                            </div>
                        )}
                        {userProfileData.updatedAt && (
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Updated At:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{userProfileData.updatedAt}</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}