"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

// Mock data for gallery images
// In a real app, this would come from your database or storage service
const mockImages = [
  {
    id: "1",
    url: "/placeholder.svg?height=400&width=400",
    name: "Sample Image 1",
  },
  {
    id: "2",
    url: "/placeholder.svg?height=400&width=400",
    name: "Sample Image 2",
  },
  {
    id: "3",
    url: "/placeholder.svg?height=400&width=400",
    name: "Sample Image 3",
  },
  {
    id: "4",
    url: "/placeholder.svg?height=400&width=400",
    name: "Sample Image 4",
  },
  {
    id: "5",
    url: "/placeholder.svg?height=400&width=400",
    name: "Sample Image 5",
  },
  {
    id: "6",
    url: "/placeholder.svg?height=400&width=400",
    name: "Sample Image 6",
  },
];

interface Image {
  id: string;
  url: string;
  name: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Simulate loading images from an API
    const fetchImages = async () => {
      try {
        // In a real app, you would fetch images from your API
        // const response = await fetch('/api/images');
        // const data = await response.json();
        // setImages(data);

        // Using mock data for demonstration
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setImages(mockImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleDrawClick = (image: Image) => {
    // Store the selected image in localStorage or state management
    localStorage.setItem("selectedImageForDrawing", JSON.stringify(image));
    router.push("/drawing");
  };

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Photo Gallery</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your photos...</span>
        </div>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No photos found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload some photos to get started with your drawing exercises.
              </p>
              <Button onClick={() => router.push("/upload")}>
                Upload Photos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative">
              <div
                className="aspect-square rounded-md overflow-hidden border cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.name}
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
              <p className="text-xs truncate mt-1">{image.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedImage?.name}</DialogTitle>
            <DialogDescription>
              Click the Draw button to use this image for your drawing exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage?.url || "/placeholder.svg"}
              alt={selectedImage?.name}
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
