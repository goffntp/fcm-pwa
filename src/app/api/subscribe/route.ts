import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { token } = await req.json();
  
  console.log("[SUBSCRIBE] FCM Token received:", token?.substring(0, 20) + "...");
  
  if (!token) {
    return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 });
  }
  
  try {
    // ใช้ Firebase Admin SDK REST API สำหรับ topic subscription
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    };
    
    // สร้าง JWT token สำหรับ Google Auth
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };
    
    const assertion = jwt.sign(payload, serviceAccount.private_key!, { algorithm: 'RS256' });
    
    // ขอ access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    
    const { access_token } = await tokenResponse.json();
    console.log("[SUBSCRIBE] Access token obtained");
    
    // Subscribe token ไป topic ผ่าน Firebase Admin SDK
    const subscribeResponse = await fetch(
      `https://iid.googleapis.com/iid/v1/${token}/rel/topics/Alluser`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log("[SUBSCRIBE] Subscription status:", subscribeResponse.status);
    
    return NextResponse.json({ 
      success: subscribeResponse.ok, 
      message: subscribeResponse.ok ? "Subscribed to Alluser topic successfully" : "Subscription failed",
      status: subscribeResponse.status
    });
    
  } catch (error) {
    console.error("[SUBSCRIBE] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to subscribe to topic" 
    }, { status: 500 });
  }
}
