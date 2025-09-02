import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(req: Request) {
  const { title, body, data } = await req.json();
  
  console.log("[BROADCAST] Request received:", { title, body, data });

  if (!title || !body) {
    console.log("[BROADCAST] Missing title or body");
    return NextResponse.json({ error: "title และ body จำเป็น" }, { status: 400 });
  }

  try {
    console.log("[BROADCAST] Creating Google Auth...");
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
    console.log("[BROADCAST] Access token obtained, length:", accessToken?.length);

    const payload = {
      message: {
        notification: { title, body },
        data: data || {},
        topic: "Alluser"
      }
    };
    console.log("[BROADCAST] FCM payload:", JSON.stringify(payload, null, 2));

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

    console.log("[BROADCAST] FCM response status:", response.status);
    const result = await response.json();
    console.log("[BROADCAST] FCM response:", result);
    
    return NextResponse.json({ 
      success: response.ok, 
      status: response.status,
      result 
    });
    
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send notifications" 
    }, { status: 500 });
  }
}
