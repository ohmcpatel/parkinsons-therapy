import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Activity, Image, PenTool, LineChart } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Tremor Trace</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Track your progress and improve your motor skills with our specialized
          therapy tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <Image className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>
              Browse your uploaded photos and select them for drawing exercises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View all your uploaded photos in a clean, organized gallery.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/gallery" className="w-full">
              <Button className="w-full">View Gallery</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <PenTool className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Drawing Exercises</CardTitle>
            <CardDescription>
              Practice drawing over photos to improve your motor skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Draw over selected photos with our interactive canvas.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/drawing" className="w-full">
              <Button className="w-full">Start Drawing</Button>
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Image className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Big Write</CardTitle>
            <CardDescription>
              A training tool that helps parkinson's patients deal with
              micrographia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fix tremor induced small writing habits with Big Write.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/micro" className="w-full">
              <Button className="w-full">Big Write</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Activity className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Calibration Test</CardTitle>
            <CardDescription>
              Perform calibration tests to track your progress over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Draw over spiral templates to measure your motor control.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/calibration" className="w-full">
              <Button className="w-full">Take Test</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <LineChart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Track Your Progress</CardTitle>
            <CardDescription>
              View analytics and visualizations of your therapy progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Our analytics dashboard provides insights into your improvement
              over time, helping you and your healthcare provider monitor your
              progress.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/analytics" className="w-full">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
