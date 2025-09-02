import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export async function GET() {
  try {
    // ตรวจสอบ Environment Variables
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    };

    // ทดสอบ Google Auth
    let authTest = null;
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
      authTest = {
        success: true,
        tokenLength: accessToken?.length || 0,
        tokenPrefix: accessToken?.substring(0, 20) + "..."
      };
    } catch (error) {
      authTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // ทดสอบ FCM API
    let fcmTest = null;
    if (authTest.success) {
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
                notification: { 
                  title: "Debug Test", 
                  body: "Testing FCM connection" 
                },
                topic: "debug-test"
              }
            }),
          }
        );

        const result = await response.json();
        fcmTest = {
          success: response.ok,
          status: response.status,
          result
        };
      } catch (error) {
        fcmTest = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      googleAuth: authTest,
      fcmApi: fcmTest
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}