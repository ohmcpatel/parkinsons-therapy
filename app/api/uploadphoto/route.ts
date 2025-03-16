

// app/api/uploadphoto/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "@/lib/s3";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import path from "path";
import os from "os";
import fs from "fs";
import { promises as fsPromises } from "fs";
import sharp from "sharp";

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: Request) {
  try {
    // Step 1: Get photo from the request
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    // Read file into buffer
    const originalArrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(originalArrayBuffer);
    // Generate a unique file name for the original photo
    const originalFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Step 2: Upload the original photo to S3 (as-is)
    const originalUploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: originalFileName,
      Body: originalBuffer,
      ContentType: file.type,
    };
    await s3.send(new PutObjectCommand(originalUploadParams));
    const originalFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${originalFileName}`;
    console.log("Original photo uploaded to:", originalFileUrl);

    // Step 3: Convert the original image to PNG, convert to black and white (grayscale),
    // and ensure it's under 4 MB by resizing if needed.
    let pngBuffer = await sharp(originalBuffer)
      .resize({ width: 1024, height: 1024, fit: "inside" })
      .greyscale() // convert to black and white
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (pngBuffer.length > MAX_SIZE) {
      // If still too large, try reducing dimensions further (e.g., 800x800)
      pngBuffer = await sharp(originalBuffer)
        .resize({ width: 800, height: 800, fit: "inside" })
        .greyscale()
        .png({ compressionLevel: 9 })
        .toBuffer();
    }

    // Step 4: Decrease opacity by compositing a white overlay (50% opacity)
    const overlayBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 } // 50% opacity
      }
    })
      .png()
      .toBuffer();

    const stencilBuffer = await sharp(pngBuffer)
      .composite([
        {
          input: overlayBuffer,
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in"
        }
      ])
      .png()
      .toBuffer();

    // Step 5: Upload the stencil image to S3
    const stencilFileName = `stencil-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const stencilUploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: stencilFileName,
      Body: stencilBuffer,
      ContentType: "image/png",
    };
    await s3.send(new PutObjectCommand(stencilUploadParams));
    const stencilFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${stencilFileName}`;
    console.log("Stencil image uploaded to:", stencilFileUrl);

    // Step 6: Store both original and stencil details in Firestore
    const firestoreData = {
      originalFileName,
      originalFileUrl,
      stencilFileName,
      stencilFileUrl,
      uploadedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "uploads"), firestoreData);

    return NextResponse.json({
      success: true,
      originalFileUrl,
      stencilFileUrl,
      docId: docRef.id,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message },
      { status: 500 }
    );
  }
}



/*
// app/api/uploadphoto/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "@/lib/s3";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import path from "path";
import { promises as fs } from "fs";

export async function POST(req: Request) {
  try {
    const uploadsCollection = collection(db, "uploads");
    const existingDocs = await getDocs(uploadsCollection);
    const docCount = existingDocs.docs.length;

    // 1. If there are already 6 documents, skip re-upload.
    if (docCount === 6) {
      // Return the existing docs so the front-end can still receive them.
      const existingUploads = existingDocs.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      return NextResponse.json({
        success: true,
        message: "Already populated with 6 images. Skipping re-upload.",
        uploads: existingUploads,
      });
    }

    // 2. Otherwise, clear the "uploads" collection (if it has fewer than 6 or more).
    for (const docSnapshot of existingDocs.docs) {
      await deleteDoc(docSnapshot.ref);
    }

    // 3. Define the directory where your six photos are stored.
    const photosDir = path.join(process.cwd(), "app", "api", "photos");

    // 4. Read all files in the directory and filter for PNG images.
    const files = await fs.readdir(photosDir);
    const photoFiles = files.filter((file) => /\.png$/i.test(file)).slice(0, 6);

    // 5. Process each photo.
    const uploads = [];
    for (const photoFile of photoFiles) {
      const filePath = path.join(photosDir, photoFile);
      const originalBuffer = await fs.readFile(filePath);
      const fileType = "image/png"; // since all photos are PNG

      // Use the original file name from the local directory (no unique IDs).
      const originalFileName = photoFile;

      // Upload to S3 (overwrites if the same file name already exists).
      const originalUploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: originalFileName,
        Body: originalBuffer,
        ContentType: fileType,
      };
      await s3.send(new PutObjectCommand(originalUploadParams));

      const originalFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${originalFileName}`;
      console.log("Original photo uploaded to:", originalFileUrl);

      // Store only the original image details in Firestore.
      const firestoreData = {
        originalFileName,
        originalFileUrl,
        uploadedAt: serverTimestamp(),
      };
      const docRef = await addDoc(uploadsCollection, firestoreData);

      uploads.push({
        docId: docRef.id,
        originalFileName,
        originalFileUrl,
      });
    }

    return NextResponse.json({ success: true, uploads });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message },
      { status: 500 }
    );
  }
}
*/