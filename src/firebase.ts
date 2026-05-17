import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Validate Connection to Firestore as per guidelines
async function testConnection() {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  console.log("Initializing Firestore with Database ID:", dbId);
  try {
    // We use a dummy path to test the connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection SUCCESSful to database:", dbId);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Firestore connection FAILED:", error.message);
      console.error("Full error details:", error);
      if (error.message.includes('the client is offline') || error.message.includes('Could not reach')) {
        console.warn("CRITICAL: Network issue or invalid database ID detected.");
      }
    }
  }
}
testConnection();

export default app;
