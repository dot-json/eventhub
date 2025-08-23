import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Loader2Icon, LogIn } from "lucide-react";
import { toastError } from "@/utils/toastWrapper";

type LoginInputs = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();
  const { login, isLoading, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    const result = await login(data);

    if ("error" in result) {
      toastError(result.error.message);
    } else {
      navigate("/");
    }
  };

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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  placeholder="m@example.com"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Please enter a valid email",
                    },
                  })}
                />
                {errors.email && (
                  <span className="text-sm text-red-600">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  placeholder="password123"
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                {errors.password && (
                  <span className="text-sm text-red-600">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <div className="mt-2 grid gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <LogIn />
                  )}
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <div className="text-muted-foreground text-center text-sm">
                  Don't have an account?{" "}
                  <Link to="/register" className="underline">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
