"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";
import { MdLogout, MdSettings, MdGroup } from "react-icons/md";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            if (!token || !userId) {
                router.push("/auth/login");
                return;
            }

            console.log("User ID: ", userId);
            try {
                console.log(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`);

                debugger;

                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`);
                console.log("User response: ", response.data);
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchGroups = async () => {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            if (!token || !userId) {
                router.push("/auth/login");
                return;
            }

            try {
                console.log(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/user/${userId}`);
                const groupsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Groups response: ", groupsResponse.data);
                setGroups(groupsResponse.data);
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
        fetchGroups();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/auth/login");
    };

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Study Groups</h2>
                <ul>
                    {groups.length > 0 ? (
                        groups.map((group) => (
                            <li
                                key={group.id}
                                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 mb-2"
                                onClick={() => router.push(`/chat/${group.id}`)}
                            >
                                {group.name}
                            </li>
                        ))
                    ) : (
                        <p className="text-gray-500">No groups joined yet</p>
                    )}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                {/* Profile & Settings */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Dashboard</h2>
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 p-2 rounded-lg"
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <FaUserCircle className="text-2xl" />
                            {user?.username}
                        </button>

                        {showSettings && (
                            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 p-4 shadow-lg rounded-lg">
                                <button className="w-full flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <MdSettings /> Settings
                                </button>
                                <button
                                    className="w-full flex items-center gap-2 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-700"
                                    onClick={handleLogout}
                                >
                                    <MdLogout /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-gray-500">Select a group to view messages</p>
            </div>
        </div>
    );
}
