"use client";
import { useRef, useState, useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function VideoCallTest() {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const [isCalling, setIsCalling] = useState(false);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8083/ws");
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log("Connected to WebSocket server");
                client.subscribe("/video/offer", (message) => handleVideoOffer(JSON.parse(message.body)));
                client.subscribe("/video/answer", (message) => handleVideoAnswer(JSON.parse(message.body)));
                client.subscribe("/video/candidate", (message) => handleIceCandidate(JSON.parse(message.body)));
            },
        });
        client.activate();
        setStompClient(client);
    }, []);

    const startCall = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && stompClient) {
                stompClient.publish({ destination: "/app/video-candidate", body: JSON.stringify(event.candidate) });
            }
        };

        setPeerConnection(pc);
        setIsCalling(true);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (stompClient) {
            stompClient.publish({ destination: "/app/video-offer", body: JSON.stringify({ sender: "user1", receiver: "user2", sdp: offer.sdp }) });
        }
    };

    const handleVideoOffer = async (offer) => {
        const pc = new RTCPeerConnection();
        setPeerConnection(pc);

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offer.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (stompClient) {
            stompClient.publish({ destination: "/app/video-answer", body: JSON.stringify({ sender: "user2", receiver: "user1", sdp: answer.sdp }) });
        }
    };

    const handleVideoAnswer = async (answer) => {
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answer.sdp }));
        }
    };

    const handleIceCandidate = async (candidate) => {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }




    };

    const endCall = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
        setIsCalling(false);
    };

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-xl font-bold mb-4">Video Call Test</h1>
            <div className="flex gap-4">
                <video ref={localVideoRef} autoPlay playsInline className="w-1/2 border" />
                <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border" />
            </div>
            <div className="mt-4">
                {!isCalling ? (
                    <button onClick={startCall} className="px-4 py-2 bg-blue-500 text-white rounded">Start Call</button>
                ) : (
                    <button onClick={endCall} className="px-4 py-2 bg-red-500 text-white rounded">End Call</button>
                )}
            </div>
        </div>
    );
}
