"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo, Save, Trash2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function CalibrationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const { toast } = useToast();

  // Canvas dimensions
  const canvasWidth = 600;
  const canvasHeight = 600;

  // Initialize canvas and draw spiral template
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setContext(ctx);

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw spiral template
    drawSpiralTemplate(ctx, canvas.width, canvas.height);

    // Save initial state to history
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  // Draw spiral template
  const drawSpiralTemplate = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;

    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Draw spiral
    for (let angle = 0; angle < 8 * Math.PI; angle += 0.1) {
      const radius = (maxRadius * angle) / (8 * Math.PI);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Add instructions text
    ctx.fillStyle = "#666666";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Trace over the spiral as accurately as possible",
      centerX,
      height - 30
    );
  };

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

  // Clear canvas and reset to spiral template
  const handleClear = () => {
    if (!context || !canvasRef.current) return;

    // Reset to initial state (spiral template only)
    if (drawingHistory.length > 0) {
      const initialState = drawingHistory[0];
      context.putImageData(initialState, 0, 0);

      setDrawingHistory([initialState]);
      setHistoryIndex(0);

      toast({
        title: "Canvas cleared",
        description: "Your drawing has been cleared.",
      });
    }

    // Reset analysis result
    setAnalysisResult(null);
  };

  // Save drawing
  const handleSave = () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.download = "calibration-test.png";
      link.href = dataUrl;
      link.click();

      toast({
        title: "Test saved",
        description: "Your calibration test has been saved as an image.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your test.",
        variant: "destructive",
      });
    }
  };

  // Analyze drawing
  const handleAnalyze = () => {
    if (!canvasRef.current || historyIndex <= 0) {
      toast({
        title: "No drawing to analyze",
        description: "Please complete the spiral tracing first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Simulate analysis with a delay
    // In a real app, you would send the canvas data to a server for ML analysis
    setTimeout(() => {
      // Generate a random score between 60 and 95 for demonstration
      const score = Math.floor(Math.random() * 36) + 60;

      let feedback = "";
      if (score >= 90) {
        feedback = "Excellent control! Your tracing is very accurate.";
      } else if (score >= 80) {
        feedback = "Good control. Minor deviations from the template.";
      } else if (score >= 70) {
        feedback =
          "Moderate control. Some noticeable deviations from the template.";
      } else {
        feedback =
          "Keep practicing. There are significant deviations from the template.";
      }

      setAnalysisResult({ score, feedback });
      setIsAnalyzing(false);

      // Save result to localStorage for analytics page
      const now = new Date();
      const testResult = {
        date: now.toISOString(),
        score,
        feedback,
      };

      const storedResults = localStorage.getItem("calibrationResults");
      const results = storedResults ? JSON.parse(storedResults) : [];
      results.push(testResult);
      localStorage.setItem("calibrationResults", JSON.stringify(results));

      toast({
        title: "Analysis complete",
        description: "Your drawing has been analyzed.",
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Calibration Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Spiral Tracing Test</CardTitle>
          <CardDescription>
            Trace over the spiral as accurately as possible. This test helps
            measure your fine motor control.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                max={10}
                step={1}
                value={[strokeWidth]}
                onValueChange={(value) => setStrokeWidth(value[0])}
                className="w-24"
              />
              <span className="text-sm">{strokeWidth}px</span>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none max-w-full h-auto mx-auto"
              style={{ cursor: "crosshair" }}
            />
          </div>

          {analysisResult && (
            <div className="mt-6">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertTitle>Analysis Result</AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span>Score:</span>
                      <span className="font-medium">
                        {analysisResult.score}/100
                      </span>
                    </div>
                    <Progress value={analysisResult.score} className="mb-2" />
                    <p className="text-sm mt-2">{analysisResult.feedback}</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || historyIndex <= 0}
          >
            {isAnalyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-1" />
                Analyze Drawing
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
