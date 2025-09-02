import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(req: Request) {
  const { token, title, body } = await req.json();
  
  console.log("[TEST-DIRECT] Sending to token:", token?.substring(0, 20) + "...");
  
  if (!token || !title || !body) {
    return NextResponse.json({ error: "token, title และ body จำเป็น" }, { status: 400 });
  }

  try {
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
    console.log("[TEST-DIRECT] Access token obtained");

    const payload = {
      message: {
        notification: { title, body },
        token
      }
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/sg-secom-notify/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log("[TEST-DIRECT] FCM response:", result);
    
    return NextResponse.json({ 
      success: response.ok, 
      status: response.status,
      result 
    });
    
  } catch (error) {
    console.error("[TEST-DIRECT] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send notification" 
    }, { status: 500 });
  }
}