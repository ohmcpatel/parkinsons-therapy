"use client";

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
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DrawingCanvasProps {
  imageUrl: string;
  width: number;
  height: number;
}

function DrawingCanvas({ imageUrl, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [strokeColor, setStrokeColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  // Modal state for score display
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!canvas || !canvasContainer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setContext(ctx);
    canvas.width = width;
    canvas.height = height;

    // Load background image from the URL
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      // Draw background image (which is assumed to be a black line on white background)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Save the initial state to history (for comparison later)
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDrawingHistory([initialState]);
      setHistoryIndex(0);
    };
  }, [imageUrl, width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    let offsetX, offsetY;
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect();
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
    } else {
      offsetX = e.nativeEvent.offsetX;
      offsetY = e.nativeEvent.offsetY;
    }
    return { offsetX, offsetY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    setIsDrawing(false);
    context.closePath();
    const newState = context.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const newHistory = drawingHistory.slice(0, historyIndex + 1);
    setDrawingHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !context || !canvasRef.current) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const imageData = drawingHistory[newIndex];
    context.putImageData(imageData, 0, 0);
  };

  const handleClear = () => {
    if (!context || !canvasRef.current || historyIndex <= 0) return;
    const initialState = drawingHistory[0];
    context.putImageData(initialState, 0, 0);
    setDrawingHistory([initialState]);
    setHistoryIndex(0);
    toast({
      title: "Canvas cleared",
      description: "Your drawing has been cleared.",
    });
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
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

  // Fast scoring: check every red pixel in the drawn canvas.
  // If a red pixel (from your stroke) is drawn on a black background pixel, count it as correct.
  // Otherwise (drawn on white), count as incorrect.
  const handleSubmit = () => {
    if (!canvasRef.current || drawingHistory.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the final drawing (background + strokes)
    const drawnData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // The initial background (assumed to have the stencil: black line on white)
    const backgroundData = drawingHistory[0];

    let correct = 0;
    let incorrect = 0;

    for (let i = 0; i < drawnData.data.length; i += 4) {
      const r = drawnData.data[i];
      const g = drawnData.data[i + 1];
      const b = drawnData.data[i + 2];
      // Simple threshold for red (your drawing stroke)
      if (r > 200 && g < 50 && b < 50) {
        const bgR = backgroundData.data[i];
        const bgG = backgroundData.data[i + 1];
        const bgB = backgroundData.data[i + 2];
        // Assume background pixel is black if all RGB values are low
        if (bgR < 50 && bgG < 50 && bgB < 50) {
          correct++;
        } else {
          incorrect++;
        }
      }
    }

    // Calculate score percentage
    const total = correct + incorrect;
    const scoreValue = total > 0 ? Math.round((correct / total) * 100) : 0;
    setScore(scoreValue);
    setShowScoreModal(true);
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
        {/* Submit Button */}
        <Button variant="outline" size="sm" onClick={handleSubmit}>
          Submit
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
      <div
        className="border rounded-md overflow-hidden"
        ref={canvasContainerRef}
      >
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
      {showScoreModal && (
        <Dialog
          open={showScoreModal}
          onOpenChange={() => setShowScoreModal(false)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Score</DialogTitle>
              <DialogDescription>Your score is: {score}%</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowScoreModal(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function DrawingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const imageUrl = searchParams.get("imageUrl");

  useEffect(() => {
    if (!imageUrl) {
      toast({
        title: "No image selected",
        description: "Please select an image from the gallery first.",
        variant: "destructive",
      });
      router.push("/gallery");
    }
  }, [imageUrl, router, toast]);

  const canvasWidth = 800;
  const canvasHeight = 800;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Drawing Exercise</h1>
      {imageUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Draw over the image</CardTitle>
            <CardDescription>
              Use your finger or mouse to trace over the stencil image. This
              exercise helps improve fine motor control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DrawingCanvas
              imageUrl={imageUrl}
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
