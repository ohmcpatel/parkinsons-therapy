"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo, Save, Trash2, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface DrawingCanvasProps {
  imageUrl: string;
  width: number;
  height: number;
}

function DrawingCanvas({ imageUrl, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [strokeColor, setStrokeColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  // Initialize canvas and load background image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setContext(ctx);

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Load background image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Save initial state to history
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDrawingHistory([initialState]);
      setHistoryIndex(0);
    };
  }, [imageUrl, width, height]);

  // Handle drawing
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return;

    setIsDrawing(true);

    // Get coordinates
    const { offsetX, offsetY } = getCoordinates(e);

    // Start new path
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;

    // Prevent scrolling on touch devices
    e.preventDefault();

    // Get coordinates
    const { offsetX, offsetY } = getCoordinates(e);

    // Draw line
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;

    setIsDrawing(false);
    context.closePath();

    // Save current state to history
    const newState = context.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Remove any states after current index
    const newHistory = drawingHistory.slice(0, historyIndex + 1);

    setDrawingHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
  };

  // Helper function to get coordinates from mouse or touch event
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    let offsetX, offsetY;

    if ("touches" in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      offsetX = e.nativeEvent.offsetX;
      offsetY = e.nativeEvent.offsetY;
    }

    return { offsetX, offsetY };
  };

  // Undo last drawing action
  const handleUndo = () => {
    if (historyIndex <= 0 || !context || !canvasRef.current) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const imageData = drawingHistory[newIndex];
    context.putImageData(imageData, 0, 0);
  };

  // Clear canvas and reset to background image
  const handleClear = () => {
    if (!context || !canvasRef.current || historyIndex <= 0) return;

    // Reset to initial state (background image only)
    const initialState = drawingHistory[0];
    context.putImageData(initialState, 0, 0);

    setDrawingHistory([initialState]);
    setHistoryIndex(0);

    toast({
      title: "Canvas cleared",
      description: "Your drawing has been cleared.",
    });
  };

  // Save drawing
  const handleSave = () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = dataUrl;
      link.click();

      toast({
        title: "Drawing saved",
        description: "Your drawing has been saved as an image.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your drawing.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
        >
          <Undo className="h-4 w-4 mr-1" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={historyIndex <= 0}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>

        <div className="flex items-center ml-auto">
          <label htmlFor="stroke-color" className="mr-2 text-sm">
            Color:
          </label>
          <input
            id="stroke-color"
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center ml-4 space-x-2">
          <label htmlFor="stroke-width" className="text-sm">
            Width:
          </label>
          <Slider
            id="stroke-width"
            min={1}
            max={20}
            step={1}
            value={[strokeWidth]}
            onValueChange={(value) => setStrokeWidth(value[0])}
            className="w-24"
          />
          <span className="text-sm">{strokeWidth}px</span>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none max-w-full h-auto"
          style={{ cursor: "crosshair" }}
        />
      </div>
    </div>
  );
}

export default function DrawingPage() {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a selected image in localStorage
    const storedImage = localStorage.getItem("selectedImageForDrawing");
    if (storedImage) {
      setSelectedImage(JSON.parse(storedImage));
    } else {
      toast({
        title: "No image selected",
        description: "Please select an image from the gallery first.",
        variant: "destructive",
      });
      router.push("/gallery");
    }
  }, [router, toast]);

  // Default canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Drawing Exercise</h1>

      {selectedImage ? (
        <Card>
          <CardHeader>
            <CardTitle>Draw over the image</CardTitle>
            <CardDescription>
              Use your finger or mouse to trace over the image. This exercise
              helps improve fine motor control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DrawingCanvas
              imageUrl={selectedImage.url}
              width={canvasWidth}
              height={canvasHeight}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No image selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please select an image from the gallery to start drawing.
            </p>
            <Button onClick={() => router.push("/gallery")}>
              Go to Gallery
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
