"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Importing the JSON file directly
import insights from "./calibration_insights.json";

// ✅ Custom ShadCN Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <Card className="p-2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-md">
      <CardContent className="p-2">
        <p className="text-xs text-gray-500"> {label} </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-semibold text-gray-700">
            {entry.name}: <span className="text-blue-500">{entry.value}</span>
          </p>
        ))}
      </CardContent>
    </Card>
  );
};

export default function Graphs() {
  if (!insights) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Loading insights...</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="exercise">
        <TabsList className="flex flex-wrap mb-4">
          <TabsTrigger value="exercise">Exercise </TabsTrigger>
          <TabsTrigger value="sleep">Sleep </TabsTrigger>
          <TabsTrigger value="mood">Mood </TabsTrigger>
        </TabsList>

        {/* ✅ Exercise vs. Confidence Score */}
        <TabsContent value="exercise">
          <Card>
            <CardHeader>
              <CardTitle>Exercise vs. Confidence Score</CardTitle>
              <CardDescription>
                How exercise affects confidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.exercise_vs_confidence}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="exercise" tick={{ fontSize: 12 }} />

                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="confidence_score" fill="#3b82f6" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ Sleep Buckets vs. Confidence Score */}
        <TabsContent value="sleep">
          <Card>
            <CardHeader>
              <CardTitle>Sleep vs. Confidence Score</CardTitle>
              <CardDescription>
                Does more sleep improve confidence?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insights.sleep_vs_confidence}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sleep_bucket" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="confidence_score" fill="#16a34a" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ Mood vs. Confidence Score (Line Chart) */}
        <TabsContent value="mood">
          <Card>
            <CardHeader>
              <CardTitle>Mood vs. Confidence Score</CardTitle>
              <CardDescription>Does mood impact confidence?</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={insights.mood_vs_confidence}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mood" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="confidence_score"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
