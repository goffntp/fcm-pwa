import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const TOKENS_FILE = path.join(process.cwd(), "fcm-tokens.json");

export async function POST(req: Request) {
  const { token } = await req.json();
  
  console.log("FCM Token received:", token);
  
  try {
    let tokens: string[] = [];
    try {
      const data = await fs.readFile(TOKENS_FILE, "utf8");
      tokens = JSON.parse(data);
    } catch {
      // ไฟล์ยังไม่มี สร้างใหม่
    }
    
    if (token && !tokens.includes(token)) {
      tokens.push(token);
      await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
      console.log("Token saved. Total tokens:", tokens.length);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Token saved successfully",
      totalTokens: tokens.length
    });
  } catch (error) {
    console.error("Error saving token:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save token" 
    }, { status: 500 });
  }
}
