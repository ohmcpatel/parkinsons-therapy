"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface Image {
  docId?: string; // Not strictly needed, but you can keep for keys
  originalFileName: string;
  originalFileUrl: string;
  uploadedAt?: any;
}

export default function GalleryPage() {
  "use client";

  // 1. Hard-code your images here
  const images: Image[] = [
    {
      docId: "1",
      originalFileName: "Image 1.png",
      originalFileUrl: "/Image1.png",
    },
    {
      docId: "2",
      originalFileName: "Image 2.png",
      originalFileUrl: "/Image2.png",
    },
    {
      docId: "3",
      originalFileName: "Image 3.png",
      originalFileUrl: "/Image3.png",
    },
    {
      docId: "4",
      originalFileName: "Image 4.png",
      originalFileUrl: "/Image4.png",
    },
    {
      docId: "5",
      originalFileName: "Image 5.png",
      originalFileUrl: "/Image5.png",
    },
    {
      docId: "6",
      originalFileName: "Image 6.png",
      originalFileUrl: "/Image6.png",
    },
  ];

  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const router = useRouter();

  // 2. If you want a "draw" feature, pass the image URL to a drawing page
  const handleDrawClick = (image: Image) => {
    const encodedImageUrl = encodeURIComponent(image.originalFileUrl);
    router.push(`/drawing?imageUrl=${encodedImageUrl}`);
  };

  // 3. Open a dialog to preview the selected image
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Photo Gallery</h1>

      {/* 4. If you need an “empty” state, conditionally render it if images is empty */}
      {!images || images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No photos found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There are no photos to display.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.originalFileName} className="group relative">
              <div
                className="aspect-square rounded-md overflow-hidden border cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.originalFileUrl}
                  alt={image.originalFileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  className="mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrawClick(image);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Draw
                </Button>
              </div>
              <p className="text-xs truncate mt-1">{image.originalFileName}</p>
            </div>
          ))}
        </div>
      )}

      {/* 5. Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedImage?.originalFileName}</DialogTitle>
            <DialogDescription>
              Click the Draw button to use this image for your drawing exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage?.originalFileUrl}
              alt={selectedImage?.originalFileName}
              className="max-h-[60vh] object-contain rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </DialogClose>
            <Button
              onClick={() => selectedImage && handleDrawClick(selectedImage)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Draw
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
