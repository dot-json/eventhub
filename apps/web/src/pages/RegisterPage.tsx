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
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toastError } from "@/utils/toastWrapper";
import { Loader2Icon, UserRoundPen } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router";

type RegisterInputs = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  orgName?: string;
};

const RegisterPage = () => {
  const { isLoading, register: registerUser, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "ORGANIZER">(
    "CUSTOMER",
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInputs>();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit: SubmitHandler<RegisterInputs> = async (data) => {
    const registerData = {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      role: selectedRole,
      ...(selectedRole === "ORGANIZER" &&
        data.orgName && { org_name: data.orgName }),
    };

    const result = await registerUser(registerData);

    if (result && "error" in result) {
      toastError(result.error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="grid flex-1 sm:place-items-center">
      <Card className="sm:bg-card w-full border-0 bg-transparent p-0 shadow-none sm:max-w-sm sm:border sm:py-6 sm:shadow-sm [&>div]:p-0 sm:[&>div]:px-6">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Fill in the details below to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="relative grid origin-center overflow-hidden rounded-full border text-sm select-none">
                <button
                  type="button"
                  onClick={() => setSelectedRole("CUSTOMER")}
                  className={cn(
                    `dark:hover:bg-primary/10 h-9 w-[calc(50%+1rem)] rounded-l-full transition-colors [clip-path:polygon(0_0,_100%_0%,_calc(100%-2rem)_100%,_0%_100%)] [grid-area:1/1]`,
                    selectedRole === "CUSTOMER"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent cursor-pointer",
                  )}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("ORGANIZER")}
                  className={cn(
                    `dark:hover:bg-primary/10 h-9 w-[calc(50%+1rem)] cursor-pointer justify-self-end rounded-r-full transition-colors [clip-path:polygon(calc(0%+2rem)_0,_100%_0%,_100%_100%,_0%_100%)] [grid-area:1/1]`,
                    selectedRole === "ORGANIZER"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent cursor-pointer",
                  )}
                >
                  Organizer
                </button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="John"
                  {...register("firstName", {
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters",
                    },
                  })}
                />
                {errors.firstName && (
                  <span className="-mt-1 text-xs text-red-600">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Doe"
                  {...register("lastName", {
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters",
                    },
                  })}
                />
                {errors.lastName && (
                  <span className="-mt-1 text-xs text-red-600">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              {selectedRole === "ORGANIZER" && (
                <div className="grid gap-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    type="text"
                    placeholder="Your Organization"
                    {...register("orgName", {
                      required:
                        selectedRole === "ORGANIZER"
                          ? "Organization name is required for organizers"
                          : false,
                      minLength: {
                        value: 2,
                        message:
                          "Organization name must be at least 2 characters",
                      },
                    })}
                  />
                  {errors.orgName && (
                    <span className="-mt-1 text-xs text-red-600">
                      {errors.orgName.message}
                    </span>
                  )}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Please enter a valid email",
                    },
                  })}
                />
                {errors.email && (
                  <span className="-mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password123"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                {errors.password && (
                  <span className="-mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="password123"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <span className="-mt-1 text-xs text-red-600">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
              <div className="mt-2 grid gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <UserRoundPen />
                  )}
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
                <div className="text-muted-foreground text-center text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="underline">
                    Log in
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

export default RegisterPage;
