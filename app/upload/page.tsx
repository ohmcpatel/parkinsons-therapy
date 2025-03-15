"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast({
        title: "Files added",
        description: `${files.length} image(s) added for upload.`,
      });
    } else {
      toast({
        title: "Invalid files",
        description: "Please upload image files only.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length > 0) {
        setUploadedFiles((prev) => [...prev, ...files]);
        toast({
          title: "Files added",
          description: `${files.length} image(s) added for upload.`,
        });
      }
    }
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, you would upload the files to a server or Blob storage here
      // For example, using Vercel Blob Storage:
      // const uploadPromises = uploadedFiles.map(async (file) => {
      //   const formData = new FormData();
      //   formData.append("file", file);
      //   const response = await fetch("/api/upload", {
      //     method: "POST",
      //     body: formData,
      //   });
      //   return response.json();
      // });
      // const results = await Promise.all(uploadPromises);

      toast({
        title: "Upload successful",
        description: `${uploadedFiles.length} image(s) uploaded successfully.`,
      });

      // Navigate to gallery after successful upload
      router.push("/gallery");
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Upload Photos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload Photos for Drawing Exercises</CardTitle>
          <CardDescription>
            Upload photos that you want to use as templates for your drawing
            exercises. Drag and drop images or click to select files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/20"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              Drag and drop your images here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse your files
            </p>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" type="button">
              Select Files
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">
                Selected Files ({uploadedFiles.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      ×
                    </Button>
                    <p className="text-xs truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
