import { NextResponse } from "next/server";
import { getPredictions } from "@/lib/googlecloud";

export async function POST(req: Request) {
  try {
    // Extract base64 image from request body
    const { base64Image } = await req.json();

    if (!base64Image) {
      return NextResponse.json(
        { error: "Base64 image is required" },
        { status: 400 }
      );
    }

    // Call the getPredictions function
    const predictions = await getPredictions(base64Image);

    // Return the predictions
    return NextResponse.json({ success: true, predictions });
  } catch (error: any) {
    console.error("Error getting predictions:", error);
    return NextResponse.json(
      { error: "Failed to get predictions", details: error.message },
      { status: 500 }
    );
  }
}