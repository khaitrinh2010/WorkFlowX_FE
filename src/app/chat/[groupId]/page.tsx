"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Client } from "@stomp/stompjs"; // WebSocket Client
import { FaVideo, FaPaperclip, FaBookOpen } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { MdSummarize } from "react-icons/md";
import SockJS from "sockjs-client";

export default function ChatPage() {
    const { groupId } = useParams();
    const router = useRouter();
    const [userId] = useState(localStorage.getItem("userId"));
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [studyMaterials, setStudyMaterials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Toggle for the study materials drawer
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const stompClient = useRef<Client | null>(null);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8083/ws");
        const token = localStorage.getItem("token");
        if (!token || !userId) {
            router.push("/auth/login");
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/history/${groupId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessages(response.data);
            } catch (error) {
                console.error("Error fetching messages", error);
            }
        };

        fetchMessages();

        // Initialize WebSocket connection
        stompClient.current = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {},
            onConnect: () => {
                console.log("Connected to WebSocket ✅");
                stompClient.current?.subscribe("/topic/messages", (msg) => {
                    setMessages((prevMessages) => [...prevMessages, JSON.parse(msg.body)]);
                });
            },
            onStompError: (frame) => {
                console.error("STOMP Connection Error ❌", frame);
            },
        });

        stompClient.current.activate();

        return () => {
            stompClient.current.deactivate();
        };
    }, [groupId]);

    const scrollToBottom = () => {
        chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    };

    const summarizeMaterial = async (material) => {
        setSummaryText(material.summary)
        setSelectedMaterial(material);
        setIsModalOpen(true);
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !userId) return;

        const messageData = {
            senderId: userId,
            content: newMessage,
            studyGroup: { id: groupId }
        };

        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.publish({
                destination: "/app/chat",
                body: JSON.stringify(messageData),
            });
        }

        setNewMessage("");
        scrollToBottom();
    };

    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0];
        if (!uploadedFile) return;

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("title", uploadedFile.name);
        formData.append("description", "");
        formData.append("file", uploadedFile);
        formData.append("teamId", Number(groupId));

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/study-materials/upload`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages([...messages, { content: `📎 File uploaded: ${response.data.title}`, senderId: "System" }]);
        } catch (error) {
            console.error("File upload failed", error);
        }
    };

    const fetchStudyMaterials = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/study-materials/team/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudyMaterials(response.data);
            console.log("Study materials", response.data);
            setIsDrawerOpen(true); // Open the drawer when materials are fetched
        } catch (error) {
            console.error("Error fetching study materials", error);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Chat Header */}
            <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
                <h2 className="text-xl font-bold">Chat Room - {groupId}</h2>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 bg-blue-500 text-white p-2 rounded-lg" onClick={() => alert("Start Video Call")}>
                        <FaVideo /> Video Call
                    </button>
                    <button className="flex items-center gap-2 bg-green-500 text-white p-2 rounded-lg" onClick={fetchStudyMaterials}>
                        <FaBookOpen /> View Study Materials
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.senderId == userId ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[60%] px-4 py-2 rounded-lg shadow-md ${msg.senderId == userId ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>
                                <span className="font-semibold">{msg.senderId == userId ? "You" : `${msg.senderName}`}:</span> {msg.content}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center">No messages yet</p>
                )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-gray-800 shadow-md flex items-center gap-3">
                <input
                    type="text"
                    className="flex-1 p-2 border rounded-full dark:bg-gray-700"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="bg-blue-500 text-white p-2 rounded-full" onClick={sendMessage}>
                    <IoSend size={20} />
                </button>

                <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
                <button className="bg-gray-500 text-white p-2 rounded-full" onClick={() => fileInputRef.current.click()}>
                    <FaPaperclip size={20} />
                </button>
            </div>

            {/* Study Materials Drawer */}
            {isDrawerOpen && (
                <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg p-4 overflow-y-auto">
                    <button className="absolute top-2 right-2 text-gray-500" onClick={() => setIsDrawerOpen(false)}>❌</button>
                    <h2 className="text-lg font-bold mb-4">Study Materials</h2>
                    {studyMaterials.length > 0 ? (
                        studyMaterials.map((material, index) => (
                            <div key={index}
                                 className="p-2 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
                                <a href={material.fileUrl} target="_blank" rel="noopener noreferrer"
                                   className="text-blue-500">
                                    {material.title}
                                </a>
                                <button className="bg-blue-500 text-white p-1 rounded"
                                        onClick={() => summarizeMaterial(material)}>
                                    <MdSummarize size={20}/>
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No materials available</p>
                    )}
                </div>
            )}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative">
                        <button className="absolute top-2 right-2 text-gray-500" onClick={() => setIsModalOpen(false)}>❌</button>
                        <h2 className="text-lg font-bold mb-2">Summary of {selectedMaterial?.title}</h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{summaryText}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
