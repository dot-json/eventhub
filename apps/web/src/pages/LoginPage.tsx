import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  return (
    <div className="grid flex-1 sm:place-items-center">
      <Card className="sm:bg-card w-full border-0 bg-transparent p-0 shadow-none sm:max-w-sm sm:border sm:py-6 sm:shadow-sm [&>div]:p-0 sm:[&>div]:px-6">
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>
            Enter your email and password to proceed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password123"
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <div className="text-muted-foreground text-center text-sm">
            Don't have an account?{" "}
            <a href="/register" className="underline">
              Sign up
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
