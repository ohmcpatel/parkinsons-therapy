"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Adjust the import path as needed

export default function DrawYourPictures() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // When a new photo is selected, update the canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Clear the canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // If a photo is selected, draw it as the background; otherwise, fill white
      if (selectedPhoto) {
        const img = new Image();
        img.src = selectedPhoto;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
    }
  }, [selectedPhoto]);

  const getPointerPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    return { x, y };
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setDrawing(true);
    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw the selected photo as background if available
    if (selectedPhoto) {
      const img = new Image();
      img.src = selectedPhoto;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    try {
      const res = await fetch("http://localhost:5000/upload_drawing", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "img_data=" + encodeURIComponent(imgData),
      });
      const data = await res.json();
      setResult("Spiral Score: " + data.spiral_score);
    } catch (error) {
      setResult("Error saving drawing");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          setPhotos((prev) => [...prev, url]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Draw your balls</h1>
      <div className="flex space-x-8">
        {/* Left: Drag and Drop Section */}
        <div
          className="w-1/3 border-2 border-dashed border-gray-300 p-4 rounded-lg h-[500px] flex flex-col items-center justify-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p className="mb-4 text-gray-500">Drag and drop your photos here</p>
          <div className="flex flex-wrap gap-2 overflow-auto">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="w-16 h-16 border border-gray-200 rounded overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo}
                  alt={`photo-${idx}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Right: Canvas Drawing Area */}
        <div className="w-2/3 flex flex-col items-center space-y-4">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border border-gray-300 touch-none rounded-lg shadow-sm"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          ></canvas>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={clearCanvas}>
              Clear
            </Button>
            <Button onClick={saveDrawing}>Save Drawing</Button>
          </div>
          <div className="text-lg font-medium">{result}</div>
        </div>
      </div>
    </div>
  );
}
