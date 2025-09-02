import { GoogleAuth } from "google-auth-library";
import fs from "fs";

// อ่านไฟล์ JSON ด้วย fs
const serviceAccount = JSON.parse(
  fs.readFileSync("./firebase-service-account.json", "utf-8")
);

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const token = await auth.getAccessToken();
  console.log("ACCESS_TOKEN:", token);
  return token;
}

getAccessToken();
