import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(req: Request) {
  const { token } = await req.json();
  
  console.log("[SUBSCRIBE] FCM Token received:", token?.substring(0, 20) + "...");
  
  if (!token) {
    return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 });
  }
  
  try {
    // ใช้ Google Auth เพื่อ subscribe topic
    const auth = new GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"]
    });
    
    const accessToken = await auth.getAccessToken();
    console.log("[SUBSCRIBE] Access token obtained");
    
    // Subscribe ไป topic "Alluser" ผ่าน FCM REST API
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/sg-secom-notify/subscriptions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "Alluser",
          tokens: [token]
        }),
      }
    );
    
    const result = await response.json();
    console.log("[SUBSCRIBE] Topic subscription result:", result);
    
    return NextResponse.json({ 
      success: response.ok, 
      message: response.ok ? "Subscribed to Alluser topic" : "Subscription failed",
      result
    });
    
  } catch (error) {
    console.error("[SUBSCRIBE] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to subscribe to topic" 
    }, { status: 500 });
  }
}
