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
} from "recharts";

interface CalibrationResult {
  date: string;
  score: number;
  feedback: string;
}

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
  const getFilteredResults = () => {
    if (results.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    if (timeRange === "week") {
      cutoffDate = subDays(now, 7);
    } else if (timeRange === "month") {
      cutoffDate = subDays(now, 30);
    } else {
      return results;
    }

    return results.filter((result) => new Date(result.date) >= cutoffDate);
  };

  // Format data for charts
  const getChartData = () => {
    const filteredResults = getFilteredResults();

    return filteredResults.map((result) => ({
      date: format(new Date(result.date), "MMM dd"),
      score: result.score,
    }));
  };

  // Calculate statistics
  const getStatistics = () => {
    const filteredResults = getFilteredResults();

    if (filteredResults.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        improvement: 0,
      };
    }

    const scores = filteredResults.map((result) => result.score);
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Calculate improvement (difference between first and last score)
    const firstScore = filteredResults[0].score;
    const lastScore = filteredResults[filteredResults.length - 1].score;
    const improvement = lastScore - firstScore;

    return {
      average: Math.round(average * 10) / 10,
      highest,
      lowest,
      improvement: Math.round(improvement * 10) / 10,
    };
  };

  const chartData = getChartData();
  const statistics = getStatistics();

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
                <div className="text-2xl font-bold">{statistics.average}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Highest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.highest}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Lowest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.lowest}</div>
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
                    statistics.improvement >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {statistics.improvement >= 0 ? "+" : ""}
                  {statistics.improvement}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                Your calibration test scores over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer>
                  <Chart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          domain={[50, 100]}
                          tick={{ fontSize: 12 }}
                          tickCount={6}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Score"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Chart>
                  <ChartLegend>
                    <ChartLegendItem name="Score" color="#3b82f6" />
                  </ChartLegend>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Your most recent calibration test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredResults()
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
    </div>
  );
}
