"use client"
import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function OAuthCallback(){
    const router = useRouter();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const userId = urlParams.get("userId");
        if(token){
            localStorage.setItem("token", token);
            if (typeof userId === "string") {
                localStorage.setItem("userId", userId);
                console.log(localStorage.getItem("token"));
            }
            else{
                console.log("User ID is not a string");
            }
        }
        router.push("/dashboard");
        }, []);
    return

}
