import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { promises as fs } from "fs";
import path from "path";

const TOKENS_FILE = path.join(process.cwd(), "fcm-tokens.json");

export async function POST(req: Request) {
  const { title, body, data } = await req.json();
  
  console.log("[BROADCAST] Request received:", { title, body, data });

  if (!title || !body) {
    console.log("[BROADCAST] Missing title or body");
    return NextResponse.json({ error: "title และ body จำเป็น" }, { status: 400 });
  }

  try {
    // อ่าน tokens จากไฟล์
    let tokens: string[] = [];
    try {
      const tokensData = await fs.readFile(TOKENS_FILE, "utf8");
      tokens = JSON.parse(tokensData);
      console.log("[BROADCAST] Found tokens:", tokens.length);
    } catch {
      console.log("[BROADCAST] No tokens file found");
      return NextResponse.json({ error: "ไม่มี FCM tokens" }, { status: 400 });
    }
    
    if (tokens.length === 0) {
      return NextResponse.json({ error: "ไม่มี FCM tokens" }, { status: 400 });
    }

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

    // ส่งไปยังแต่ละ token
    const results = [];
    for (const token of tokens) {
      const payload = {
        message: {
          notification: { title, body },
          data: data || {},
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
      results.push({ token: token.substring(0, 20) + "...", success: response.ok, result });
      console.log("[BROADCAST] Sent to token:", token.substring(0, 20) + "...", "Success:", response.ok);
    }
    
    return NextResponse.json({ 
      success: true, 
      totalTokens: tokens.length,
      results
    });
    
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send notifications" 
    }, { status: 500 });
  }
}
