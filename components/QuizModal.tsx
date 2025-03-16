"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuizModalProps {
  timestamp: string;
  radialError: number;
}

export default function QuizModal({ timestamp, radialError }: QuizModalProps) {
  const [confidence, setConfidence] = useState(50);
  const [medicineTaken, setMedicineTaken] = useState(false);
  const [exercised, setExercised] = useState(false);
  const [hoursOfSleep, setHoursOfSleep] = useState(8);
  const [mood, setMood] = useState(3);

  const handleSubmit = () => {
    // For now, we simply log the quiz responses.
    console.log({
      timestamp,
      radialError,
      confidence,
      medicineTaken,
      exercised,
      hoursOfSleep,
      mood,
    });
    // You can send these values to your backend for analysis or save them locally.
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4">
          Take Calibration Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Calibration Quiz</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="timestamp">Timestamp</Label>
            <Input
              id="timestamp"
              type="text"
              value={timestamp}
              readOnly
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="radial-error">Radial Error</Label>
            <Input
              id="radial-error"
              type="text"
              value={radialError.toFixed(2)}
              readOnly
              className="mt-1"
            />
          </div>
          <div>
            <Label>Confidence</Label>
            <Slider
              value={[confidence]}
              onValueChange={(val) => setConfidence(val[0])}
              max={100}
              step={1}
              className="mt-1"
            />
            <div className="text-sm text-muted-foreground">{confidence}%</div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="medicine-taken"
              checked={medicineTaken}
              onCheckedChange={(checked) =>
                setMedicineTaken(checked as boolean)
              }
            />
            <Label htmlFor="medicine-taken">Medicine Taken</Label>
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
        <DialogFooter>
          <Button onClick={handleSubmit}>Submit Quiz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
