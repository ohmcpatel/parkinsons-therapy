

// app/api/fetchphoto/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import s3 from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { collection, getDocs } from "firebase/firestore";

// Define the expected structure of an upload document in the new schema
interface Upload {
  originalFileName: string;
  originalFileUrl: string;
  stencilFileName: string;
  stencilFileUrl: string;
  uploadedAt: any; // Firestore timestamp
}

export async function GET(req: Request) {
  try {
    // Ensure the AWS bucket name is defined
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error("AWS_BUCKET_NAME environment variable is not defined");
    }

    // Query Firestore for documents in the "uploads" collection
    const snapshot = await getDocs(collection(db, "uploads"));
    const uploads: Upload[] = snapshot.docs.map((doc) => doc.data() as Upload);

    if (!uploads.length) {
      console.warn("No uploads found in Firestore.");
      return NextResponse.json({ uploads: [] });
    }

    // For each upload, generate presigned URLs for both original and stencil images
    const presignedUploads = await Promise.all(
      uploads.map(async (upload) => {
        if (!upload.originalFileName || !upload.stencilFileName) {
          console.warn("Upload is missing file names:", upload);
          return null;
        }

        // Presigned URL for original image
        const commandOriginal = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: upload.originalFileName,
        });
        const displayUrl = await getSignedUrl(s3, commandOriginal, { expiresIn: 3600 });

        // Presigned URL for stencil image
        const commandStencil = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: upload.stencilFileName,
        });
        const stencilPresignedUrl = await getSignedUrl(s3, commandStencil, { expiresIn: 3600 });

        return {
          originalFileName: upload.originalFileName,
          displayUrl, // Presigned URL for original image
          originalFileUrl: upload.originalFileUrl,
          stencilFileUrl: upload.stencilFileUrl, // stored URL (if needed)
          stencilPresignedUrl, // Presigned URL for stencil image
          uploadedAt: upload.uploadedAt,
        };
      })
    );

    // Filter out any null entries
    const filteredUploads = presignedUploads.filter((item) => item !== null);

    return NextResponse.json({ uploads: filteredUploads });
  } catch (error: any) {
    console.error("Error in /api/fetchphoto GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch uploads", details: error.message },
      { status: 500 }
    );
  }
}


/*
// app/api/fetchphoto/route.ts
import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req: Request) {
  try {
    const querySnapshot = await getDocs(collection(db, "uploads"));
    const uploads = [];
    querySnapshot.forEach((doc) => {
      uploads.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json({ success: true, uploads });
  } catch (error: any) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Fetch failed", details: error.message },
      { status: 500 }
    );
  }
}

*/