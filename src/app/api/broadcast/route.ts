import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function POST(req: Request) {
  const { title, body, data } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title และ body จำเป็น" }, { status: 400 });
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

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/sg-secom-notify/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            notification: { title, body },
            data: data || {},
            topic: "Alluser"
          }
        }),
      }
    );

    const result = await response.json();
    
    return NextResponse.json({ 
      success: true, 
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
