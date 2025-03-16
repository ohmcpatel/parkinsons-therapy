"use client";

import React, { useState, useEffect, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateRadialError, generateSpiralPoint } from "@/lib/utils";
import { getPredictions } from "@/lib/googlecloud";

function calculateFinalScore(aiScore: number, radialError: number) {
  // Calculate final score based on AI score and radial error
  let score = 100 * 2 ** (5 * aiScore - 5) - 100 * radialError;
  score = Math.max(0, score);
  score = Math.min(100, score);
  score = Math.round(score);
  return score;
}

export default function CalibrationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([[]]);
  const [currentStroke, setCurrentStroke] = useState<
    { x: number; y: number }[]
  >([]);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    feedback: string;
    radialError: number;
  } | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const { toast } = useToast();

  // Quiz states
  const [medicineTaken, setMedicineTaken] = useState(false);
  const [exercised, setExercised] = useState(false);
  const [hoursOfSleep, setHoursOfSleep] = useState(8);
  const [mood, setMood] = useState(3);

  // Canvas dimensions
  const canvasWidth = 600;
  const canvasHeight = 600;

  // Initialize canvas and draw spiral template
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!canvas || !canvasContainer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setContext(ctx);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    {
      const { width, height } = canvasContainer.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSpiralTemplate(ctx, canvas.width, canvas.height);

    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  const drawSpiralTemplate = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.3;
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let angle = 0; angle < 6 * Math.PI; angle += 0.1) {
      let { x, y } = generateSpiralPoint(maxRadius, angle);
      x += centerX;
      y += centerY;
      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.fillStyle = "#666666";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Trace over the spiral as accurately as possible",
      centerX,
      height - 30
    );
  };

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
    if (!context || !canvasRef?.current) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const relativeX = offsetX - centerX;
    const relativeY = offsetY - centerY;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    setCurrentStroke([{ x: relativeX, y: relativeY }]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context || !canvasRef?.current) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const relativeX = offsetX - centerX;
    const relativeY = offsetY - centerY;
    context.lineTo(offsetX, offsetY);
    context.stroke();
    setCurrentStroke((prev) => [...prev, { x: relativeX, y: relativeY }]);
  };

  const stopDrawing = () => {
    if (!isDrawing || !context || !canvasRef?.current) return;
    setIsDrawing(false);
    context.closePath();
    const newState = context.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const newHistory = drawingHistory.slice(0, historyIndex + 1);
    const newStrokes = strokes.slice(0, historyIndex + 1);
    setDrawingHistory([...newHistory, newState]);
    setStrokes([...newStrokes, currentStroke]);
    setCurrentStroke([]);
    setHistoryIndex(newHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !context || !canvasRef?.current) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const imageData = drawingHistory[newIndex];
    context.putImageData(imageData, 0, 0);
  };

  const handleClear = () => {
    if (!context || !canvasRef?.current) return;
    if (drawingHistory.length > 0) {
      const initialState = drawingHistory[0];
      context.putImageData(initialState, 0, 0);
      setDrawingHistory([initialState]);
      setHistoryIndex(0);
      setCurrentStroke([]);
      setStrokes([[]]);
      toast({
        title: "Canvas cleared",
        description: "Your drawing has been cleared.",
      });
    }
    setAnalysisResult(null);
  };

  const getBase64FromCanvas = () => {
    if (!canvasRef.current) return undefined;
    return canvasRef.current.toDataURL("image/png");
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    try {
      const offScreenCanvas = document.createElement("canvas");
      offScreenCanvas.width = canvasRef.current.width;
      offScreenCanvas.height = canvasRef.current.height;
      const offScreenContext = offScreenCanvas.getContext("2d");
      if (!offScreenContext) return;
      offScreenContext.fillStyle = "white";
      offScreenContext.fillRect(
        0,
        0,
        offScreenCanvas.width,
        offScreenCanvas.height
      );
      offScreenContext.strokeStyle = strokeColor;
      offScreenContext.lineWidth = strokeWidth;
      offScreenContext.lineCap = "round";
      offScreenContext.lineJoin = "round";
      strokes.forEach((stroke) => {
        if (stroke.length > 0) {
          offScreenContext.beginPath();
          offScreenContext.moveTo(
            stroke[0].x + offScreenCanvas.width / 2,
            stroke[0].y + offScreenCanvas.height / 2
          );
          stroke.forEach((point) => {
            offScreenContext.lineTo(
              point.x + offScreenCanvas.width / 2,
              point.y + offScreenCanvas.height / 2
            );
          });
          offScreenContext.stroke();
        }
      });
      const dataUrl = offScreenCanvas.toDataURL("image/png");
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

  // Analyze drawing, simulate analysis, then open quiz modal
  const handleAnalyze = async () => {
    if (!canvasRef.current || historyIndex <= 0) {
      toast({
        title: "No drawing to analyze",
        description: "Please complete the spiral tracing first.",
        variant: "destructive",
      });
      return;
    }
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const maxRadius = Math.min(width, height) * 0.3;
    setIsAnalyzing(true);

    let base64img = getBase64FromCanvas();
    console.log(base64img?.substring(0, 50));
    let aiScore = -1;
    if (base64img) {
      console.log("Uploading image to server...");
      const res = await fetch("/api/uploadcalibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64img }),
      });
      const data = await res.json();
      // console.log(data);
      aiScore =
        data.predictions[0].structValue.fields.confidences.listValue.values[1].numberValue.toFixed(
          2
        );
      console.log("AI Score: ", aiScore);
    }

    let averageRadialError = 0;
    let numPoints = 0;
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      const strokeRadialError = calculateRadialError(stroke, maxRadius);
      averageRadialError += strokeRadialError;
      numPoints += stroke.length;
    }
    averageRadialError /= numPoints;
    console.log("Average Radial Error: ", averageRadialError);
    let score = calculateFinalScore(aiScore, averageRadialError);
    console.log("Final Score: ", score);

    // setTimeout(() => {
    //   const score = Math.floor(Math.random() * 36) + 60;
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
    setAnalysisResult({ score, feedback, radialError: averageRadialError });
    setIsAnalyzing(false);
    toast({
      title: "Analysis complete",
      description: "Your drawing has been analyzed.",
    });
    // Open the quiz modal automatically after analysis
    setIsQuizOpen(true);
    // }, 2000);
  };

  // Function to handle quiz submission and upload to Firebase
  const handleQuizSubmit = async () => {
    if (!analysisResult) return;
    const payload = {
      timestamp: new Date().toISOString(),
      radialError: analysisResult.radialError,
      score: analysisResult.score,
      feedback: analysisResult.feedback,
      medicineTaken,
      exercised,
      hoursOfSleep,
      mood,
    };
    try {
      const res = await fetch("/api/uploadanalytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast({
        title: "Quiz submitted",
        description: "Your calibration quiz responses have been recorded.",
      });
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    }
    setIsQuizOpen(false);
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
          <div
            className="border rounded-md overflow-hidden bg-white"
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
              "Analyzing..."
            ) : (
              <>
                <Activity className="h-4 w-4 mr-1" />
                Analyze Drawing
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Quiz Modal */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calibration Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input
                id="timestamp"
                type="text"
                value={new Date().toISOString()}
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="radial-error">Score</Label>
              <Input
                id="radial-error"
                type="text"
                value={analysisResult ? analysisResult.score : "0"}
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="radial-error">Radial Error</Label>
              <Input
                id="radial-error"
                type="text"
                value={
                  analysisResult ? analysisResult.radialError.toFixed(8) : "0"
                }
                readOnly
                className="mt-1"
              />
            </div>
            <div></div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="medicine-taken"
                checked={medicineTaken}
                onCheckedChange={(checked) =>
                  setMedicineTaken(checked as boolean)
                }
              />
              <Label htmlFor="medicine-taken">
                Have you taken your medicine?
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exercised"
                checked={exercised}
                onCheckedChange={(checked) => setExercised(checked as boolean)}
              />
              <Label htmlFor="exercised">Have you exercised?</Label>
            </div>
            <div>
              <Label>Hours of Sleep</Label>
              <Slider
                value={[hoursOfSleep]}
                onValueChange={(val) => setHoursOfSleep(val[0])}
                min={0}
                max={12}
                step={0.5}
                className="mt-1"
              />
              <div className="text-sm text-muted-foreground">
                {hoursOfSleep} hrs
              </div>
            </div>
            <div>
              <Label>Mood</Label>
              <Slider
                value={[mood]}
                onValueChange={(val) => setMood(val[0])}
                min={1}
                max={5}
                step={1}
                className="mt-1"
              />
              <div className="text-sm text-muted-foreground">Mood: {mood}</div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleQuizSubmit}>Submit Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
