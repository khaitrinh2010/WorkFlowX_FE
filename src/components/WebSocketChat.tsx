"use client";
import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WebSocketChat = () => {
    const [messages, setMessages] = useState<{ content: string }[]>([]);
    const [message, setMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8083/ws");
        clientRef.current = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {},
            onConnect: () => {
                console.log("Connected to WebSocket ✅");
                clientRef.current?.subscribe("/topic/messages", (msg) => {
                    setMessages((prevMessages) => [...prevMessages, JSON.parse(msg.body)]);
                });
            },
            onStompError: (frame) => {
                console.error("STOMP Connection Error ❌", frame);
            },
        });

        if (clientRef.current instanceof Client) {
            clientRef.current.activate();
        }

        return () => {
            if (clientRef.current) {
                if (clientRef.current instanceof Client) {
                    clientRef.current.deactivate();
                }
            }
        };
    }, []);

    const sendMessage = () => {

        if (message.trim() !== "") {
            clientRef.current?.publish({
                destination: "/app/chat",
                body: JSON.stringify({ content: message }),
            });
            setMessage("");
        }
    };

    return (
        <div className="p-4 border rounded shadow-md w-96 mx-auto mt-4">
            <h2 className="text-lg font-bold">WebSocket Chat</h2>
            <p className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}>
            </p>
            <div className="border p-2 my-2 h-40 overflow-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="p-1 border-b">{msg.content}</div>
                ))}
            </div>
            <input
                type="text"
                className="border p-2 w-full"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button
                className={`px-4 py-2 mt-2 w-full`}
                onClick={sendMessage}
            >
                Send Message
            </button>
        </div>
    );
};

export default WebSocketChat;
