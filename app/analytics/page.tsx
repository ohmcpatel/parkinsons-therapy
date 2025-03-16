"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendItem,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import Graphs from "@/components/Graphs";

interface CalibrationResult {
  date: string;
  score: number;
  feedback: string;
}

// Importing the JSON file directly
import insights from "../../components/calibration_insights.json";

export default function AnalyticsPage() {
  const [results, setResults] = useState<CalibrationResult[]>([]);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    // Load results from localStorage
    const storedResults = localStorage.getItem("calibrationResults");

    if (storedResults) {
      const parsedResults = JSON.parse(storedResults) as CalibrationResult[];
      setResults(parsedResults);
    } else {
      // Generate mock data if no results exist
      generateMockData();
    }
  }, []);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const mockResults: CalibrationResult[] = [];
    const now = new Date();

    // Generate data for the past 30 days
    for (let i = 30; i >= 0; i -= 2) {
      const date = subDays(now, i);

      // Start with a lower score and gradually improve
      const baseScore = 65 + (30 - i) * 0.5;
      // Add some randomness
      const score = Math.min(
        95,
        Math.max(60, Math.floor(baseScore + (Math.random() * 10 - 5)))
      );

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

      mockResults.push({
        date: date.toISOString(),
        score,
        feedback,
      });
    }

    setResults(mockResults);
    localStorage.setItem("calibrationResults", JSON.stringify(mockResults));
  };

  // Filter results based on selected time range
  const getFilteredResults = (data: any[]) => {
    if (data.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    if (timeRange === "week") {
      cutoffDate = subDays(now, 7);
    } else if (timeRange === "month") {
      cutoffDate = subDays(now, 30);
    } else {
      return data;
    }

    return data.filter((result) => new Date(result.date) >= cutoffDate);
  };

  // Format data for charts
  const getChartData = (data: any[]) => {
    const filteredResults = getFilteredResults(data);

    return filteredResults.map((result) => ({
      date: format(new Date(result.date), "MMM dd"),
      score: result.confidence_score || result.score,
    }));
  };

  // Calculate statistics
  const getStatistics = (data: any[]) => {
    const filteredResults = getFilteredResults(data);

    if (filteredResults.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        improvement: 0,
      };
    }

    const scores = filteredResults.map(
      (result) => result.confidence_score || result.score
    );
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Calculate improvement (difference between first and last score)
    const firstScore =
      filteredResults[0].confidence_score || filteredResults[0].score;
    const lastScore =
      filteredResults[filteredResults.length - 1].confidence_score ||
      filteredResults[filteredResults.length - 1].score;
    const improvement = lastScore - firstScore;

    return {
      average: Math.round(average * 10) / 10,
      highest,
      lowest,
      improvement: Math.round(improvement * 10) / 10,
    };
  };

  const scoreChartData = getChartData(insights.score_vs_time);
  const bigwriteChartData = getChartData(insights.bigwrite_vs_time);
  const scoreStatistics = getStatistics(insights.score_vs_time);
  const bigwriteStatistics = getStatistics(insights.bigwrite_vs_time);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={timeRange === "week" ? "default" : "outline"}
          onClick={() => setTimeRange("week")}
        >
          Last Week
        </Button>
        <Button
          variant={timeRange === "month" ? "default" : "outline"}
          onClick={() => setTimeRange("month")}
        >
          Last Month
        </Button>
        <Button
          variant={timeRange === "all" ? "default" : "outline"}
          onClick={() => setTimeRange("all")}
        >
          All Time
        </Button>
      </div>

      {results.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No calibration test results found. Complete a calibration test to
            see your analytics.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scoreStatistics.average}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Highest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scoreStatistics.highest}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Lowest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scoreStatistics.lowest}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    scoreStatistics.improvement >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {scoreStatistics.improvement >= 0 ? "+" : ""}
                  {scoreStatistics.improvement}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="score" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="score">Score vs Time</TabsTrigger>
              <TabsTrigger value="bigwrite">BigWrite Over Time</TabsTrigger>
            </TabsList>
            <TabsContent value="score">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Score vs Time</CardTitle>
                  <CardDescription>
                    Your calibration test scores over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Scatter
                          data={scoreChartData.map((result) => ({
                            date: result.date,
                            confidence_score: result.score,
                          }))}
                          dataKey="confidence_score"
                          fill="#8884d8"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bigwrite">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>BigWrite Over Time</CardTitle>
                  <CardDescription>
                    Your BigWrite test scores over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Scatter
                          data={bigwriteChartData.map((result) => ({
                            date: result.date,
                            confidence_score: result.score,
                          }))}
                          dataKey="confidence_score"
                          fill="#8884d8"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Your most recent calibration test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredResults(results)
                  .slice(-5)
                  .reverse()
                  .map((result, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(result.date),
                              "MMMM d, yyyy 'at' h:mm a"
                            )}
                          </span>
                        </div>
                        <div className="font-medium">
                          Score: {result.score}/100
                        </div>
                      </div>
                      <p className="text-sm">{result.feedback}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      <Graphs />
    </div>
  );
}
