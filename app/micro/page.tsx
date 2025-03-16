"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  Award,
  BarChart3,
  Eraser,
  ZoomIn,
  ZoomOut,
  StopCircle,
  PlayCircle,
} from "lucide-react";

export default function BigWrite() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [strokeHeight, setStrokeHeight] = useState(0);
  const [feedback, setFeedback] = useState<"none" | "good" | "small">("none");
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<"practice" | "challenge" | "free">(
    "practice"
  );
  const [lineWidth, setLineWidth] = useState(3);
  const [minStrokeHeight, setMinStrokeHeight] = useState(30); // Minimum height threshold
  const [strokes, setStrokes] = useState<
    Array<{ height: number; isGood: boolean }>
  >([]);
  // session state variables
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStrokes, setSessionStrokes] = useState<
    Array<{ height: number; isGood: boolean }>
  >([]);
  // dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goodStrokesPercentage, setGoodStrokesPercentage] = useState(0);

  // Instead of state, use a ref for current stroke boundaries for synchronous updates.
  const currentStrokeRef = useRef<{ minY: number; maxY: number }>({
    minY: 0,
    maxY: 0,
  });

  const startSession = () => {
    setIsSessionActive(true);
    setSessionStrokes([]);
  };

  const stopSession = () => {
    setIsSessionActive(false);
    const goodStrokes = sessionStrokes.filter((stroke) => stroke.isGood).length;
    let percentage = (goodStrokes / sessionStrokes.length) * 100;
    if (sessionStrokes.length === 0) {
      percentage = 0;
    }
    setGoodStrokesPercentage(percentage);
    setIsDialogOpen(true);
  };

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions to match parent container
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      if (ctx) {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = "#000000";
        setContext(ctx);
      }

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [lineWidth]);

  // Draw guidelines for practice mode
  useEffect(() => {
    if (context && canvasRef.current && mode === "practice") {
      const canvas = canvasRef.current;
      const guidelineY = canvas.height / 2;

      // Clear existing guidelines
      context.save();
      context.globalCompositeOperation = "destination-over";

      // Draw middle guideline
      context.beginPath();
      context.moveTo(0, guidelineY);
      context.lineTo(canvas.width, guidelineY);
      context.strokeStyle = "#9ca3af"; // Gray color
      context.lineWidth = 1;
      context.setLineDash([5, 5]); // Dashed line
      context.stroke();

      // Draw top guideline (minimum height)
      context.beginPath();
      context.moveTo(0, guidelineY - minStrokeHeight);
      context.lineTo(canvas.width, guidelineY - minStrokeHeight);
      context.strokeStyle = "#d1d5db"; // Lighter gray
      context.stroke();

      // Draw bottom guideline (minimum height)
      context.beginPath();
      context.moveTo(0, guidelineY + minStrokeHeight);
      context.lineTo(canvas.width, guidelineY + minStrokeHeight);
      context.strokeStyle = "#d1d5db"; // Lighter gray
      context.stroke();

      context.restore();
    }
  }, [context, mode, minStrokeHeight]);

  // Handle mouse/touch events
  const startDrawing = (x: number, y: number) => {
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
      setIsDrawing(true);
      setLastPoint({ x, y });
      // Initialize the current stroke boundaries synchronously
      currentStrokeRef.current = { minY: y, maxY: y };
      setFeedback("none");
    }
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing || !context) return;

    context.lineWidth = lineWidth;
    context.lineTo(x, y);
    context.stroke();

    // Update current stroke boundaries synchronously
    currentStrokeRef.current.minY = Math.min(currentStrokeRef.current.minY, y);
    currentStrokeRef.current.maxY = Math.max(currentStrokeRef.current.maxY, y);

    setLastPoint({ x, y });
  };

  const endDrawing = () => {
    if (!isDrawing || !context) return;

    context.closePath();
    setIsDrawing(false);

    // Calculate stroke height from the ref (synchronously updated)
    const { minY, maxY } = currentStrokeRef.current;
    const height = Math.abs(maxY - minY);
    setStrokeHeight(height);

    // Provide feedback based on stroke height and update streak immediately
    if (height >= minStrokeHeight) {
      setFeedback("good");
      setStreak((prev) => prev + 1);
      setProgress((prev) => Math.min(prev + 5, 100));
    } else {
      setFeedback("small");
      // Reset the streak immediately when a bad letter is detected
      setStreak(0);
    }

    // Add stroke to history
    setStrokes((prev) => [
      ...prev,
      { height, isGood: height >= minStrokeHeight },
    ]);

    // Add stroke to session history if session is active
    if (isSessionActive) {
      setSessionStrokes((prev) => [
        ...prev,
        { height, isGood: height >= minStrokeHeight },
      ]);
    }
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startDrawing(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    draw(x, y);
  };

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startDrawing(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    draw(x, y);
  };

  // Clear canvas
  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      setFeedback("none");

      // Redraw guidelines if in practice mode
      if (mode === "practice" && canvasRef.current) {
        const canvas = canvasRef.current;
        const guidelineY = canvas.height / 2;

        context.save();
        context.globalCompositeOperation = "destination-over";

        // Draw middle guideline
        context.beginPath();
        context.moveTo(0, guidelineY);
        context.lineTo(canvas.width, guidelineY);
        context.strokeStyle = "#9ca3af";
        context.lineWidth = 1;
        context.setLineDash([5, 5]);
        context.stroke();

        // Draw top guideline
        context.beginPath();
        context.moveTo(0, guidelineY - minStrokeHeight);
        context.lineTo(canvas.width, guidelineY - minStrokeHeight);
        context.strokeStyle = "#d1d5db";
        context.stroke();

        // Draw bottom guideline
        context.beginPath();
        context.moveTo(0, guidelineY + minStrokeHeight);
        context.lineTo(canvas.width, guidelineY + minStrokeHeight);
        context.strokeStyle = "#d1d5db";
        context.stroke();

        context.restore();
      }
    }
  };

  // Adjust line width
  const increaseLineWidth = () => {
    setLineWidth((prev) => Math.min(prev + 1, 10));
  };

  const decreaseLineWidth = () => {
    setLineWidth((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">BigWrite</h1>
          <p className="text-muted-foreground">
            A smart writing aid for people with micrographia
          </p>
        </div>

        <Tabs
          defaultValue="practice"
          onValueChange={(value) =>
            setMode(value as "practice" | "challenge" | "free")
          }
        >
          <TabsContent value="practice" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Practice Mode</CardTitle>
                <CardDescription>
                  Write between the guidelines to practice consistent letter
                  size
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px] border rounded-md overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={endDrawing}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {feedback === "good" && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>Great size!</span>
                      </div>
                    )}
                    {feedback === "small" && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>Try writing bigger!</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={clearCanvas}>
                      <Eraser className="h-4 w-4" />
                    </Button>
                    {isSessionActive ? (
                      <Button variant="outline" onClick={stopSession}>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Session
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={startSession}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Session
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span>Streak: {streak}</span>
                </div>
                <div className="w-1/2">
                  <Progress value={progress} className="h-2" />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="challenge" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Mode</CardTitle>
                <CardDescription>
                  Write consistently without guidelines. Your writing will be
                  analyzed for size.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px] border rounded-md overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={endDrawing}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={clearCanvas}>
                      <Eraser className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decreaseLineWidth}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={increaseLineWidth}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {feedback === "good" && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Perfect Size
                      </Badge>
                    )}
                    {feedback === "small" && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Too Small
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="free" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Free Writing</CardTitle>
                <CardDescription>
                  Practice writing freely with subtle size feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px] border rounded-md overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={endDrawing}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={clearCanvas}>
                      <Eraser className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decreaseLineWidth}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={increaseLineWidth}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm">
                    {strokes.length > 0
                      ? `Average stroke height: ${Math.round(
                          strokes.reduce((acc, s) => acc + s.height, 0) /
                            strokes.length
                        )}px`
                      : "No strokes recorded yet"}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>About BigWrite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              BigWrite is an interactive writing aid designed to help people
              with micrographia (abnormally small handwriting) practice writing
              with proper size and legibility. The app provides real-time
              feedback and gamification to make handwriting practice engaging
              and effective.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Real-time Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant feedback on your writing size
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your improvement over time
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Gamified Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn streaks and track progress
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Summary</DialogTitle>
            <DialogDescription>
              Good Strokes: {goodStrokesPercentage.toFixed(2)}%
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
