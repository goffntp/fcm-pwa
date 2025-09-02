import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();
  
  console.log("FCM Token received:", token);
  
  return NextResponse.json({ 
    success: true, 
    message: "Token received. Topic subscription handled in client-side." 
  });
}
