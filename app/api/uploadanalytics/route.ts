// app/api/uploadphoto/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    // Extract data from request body
    const {
      radialError,
      score,
      feedback,
      confidence,
      medicineTaken,
      exercised,
      hoursOfSleep,
      mood,
    } = await req.json();

    // Log received data to debug
    console.log("Received data:", {
      radialError,
      score,
      feedback,
      confidence,
      medicineTaken,
      exercised,
      hoursOfSleep,
      mood,
    });

    // Ensure all values are defined
    const firestoreData = {
      radialError: radialError ?? 0, // Default to 0 if undefined
      score: score ?? 0,
      feedback: feedback ?? "No feedback",
      medicineTaken: medicineTaken ?? false,
      exercised: exercised ?? false,
      hoursOfSleep: hoursOfSleep ?? 8,
      mood: mood ?? 3,
      timestamp: serverTimestamp(),
    };

    // Save to Firestore under "calibrationStats"
    console.log("Storing data:", firestoreData);
    const docRef = await addDoc(collection(db, "calibrationStats"), firestoreData);

    return NextResponse.json({ success: true, docId: docRef.id });
  } catch (error: any) {
    console.error("Error storing calibration stats:", error);
    return NextResponse.json(
      { error: "Failed to store calibration stats", details: error.message },
      { status: 500 }
    );
  }
}
