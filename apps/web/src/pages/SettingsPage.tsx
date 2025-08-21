import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useAuth";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { toastError, toastSuccess } from "@/utils/toastWrapper";
import { extractErrorMessage } from "@/utils/errorHandler";

type UpdateProfileInput = {
  email: string;
  firstName: string;
  lastName: string;
};

type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const SettingsPage = () => {
  const { user, updateProfile, updatePassword, error, clearError, isLoading } =
    useUser();

  const {
    register: registerUpdateProfile,
    handleSubmit: handleUpdateProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>();
  const {
    register: registerUpdatePassword,
    handleSubmit: handleUpdatePasswordSubmit,
    formState: { errors: passwordErrors },
    watch,
    reset: resetUpdatePassword,
  } = useForm<UpdatePasswordInput>();

  const onUpdateProfileSubmit: SubmitHandler<UpdateProfileInput> = async (
    data,
  ) => {
    if (
      data.email === user?.email &&
      data.firstName === user?.first_name &&
      data.lastName === user?.last_name
    ) {
      return;
    }
    try {
      await updateProfile({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      toastSuccess("Profile updated successfully");
    } catch (_error) {
      const msg = extractErrorMessage(_error);
      toastError(msg);
    }
  };

  const onUpdatePasswordSubmit: SubmitHandler<UpdatePasswordInput> = async (
    data,
  ) => {
    try {
      await updatePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      toastSuccess("Password updated successfully");
      resetUpdatePassword();
    } catch (_error) {
      const msg = extractErrorMessage(_error);
      toastError(msg);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1>Settings</h1>
      <section className="flex flex-col gap-6">
        <div>
          <h2>Account</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex h-fit flex-col gap-4 rounded-md border p-4">
            <div>
              <h3>Profile Information</h3>
              <p className="text-muted-foreground text-sm">
                Update your profile information.
              </p>
            </div>
            <form
              onSubmit={handleUpdateProfileSubmit(onUpdateProfileSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  placeholder="m@example.com"
                  type="email"
                  defaultValue={user?.email}
                  {...registerUpdateProfile("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Please enter a valid email",
                    },
                  })}
                />
                {profileErrors.email && (
                  <span className="text-sm text-red-600">
                    {profileErrors.email.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="John"
                  defaultValue={user?.first_name}
                  {...registerUpdateProfile("firstName", {
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters",
                    },
                  })}
                />
                {profileErrors.firstName && (
                  <span className="-mt-1 text-xs text-red-600">
                    {profileErrors.firstName.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Doe"
                  defaultValue={user?.last_name}
                  {...registerUpdateProfile("lastName", {
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters",
                    },
                  })}
                />
                {profileErrors.lastName && (
                  <span className="-mt-1 text-xs text-red-600">
                    {profileErrors.lastName.message}
                  </span>
                )}
              </div>
              <Button type="submit" className="mt-2">
                {isLoading && <Loader2Icon className="animate-spin" />}
                {isLoading ? "Updating Profile..." : "Update Profile"}
              </Button>
            </form>
          </div>
          <div className="flex h-fit flex-col gap-4 rounded-md border p-4">
            <div>
              <h3>Account Security</h3>
              <p className="text-muted-foreground text-sm">
                Update your password.
              </p>
            </div>
            <form
              onSubmit={handleUpdatePasswordSubmit(onUpdatePasswordSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerUpdatePassword("currentPassword", {
                    required: "Current password is required",
                  })}
                  onChange={(e) => {
                    registerUpdatePassword("currentPassword").onChange(e);
                    if (error) clearError();
                  }}
                />
                {passwordErrors.currentPassword && (
                  <span className="text-sm text-red-600">
                    {passwordErrors.currentPassword.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerUpdatePassword("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "New password must be at least 8 characters",
                    },
                  })}
                />
                {passwordErrors.newPassword && (
                  <span className="-mt-1 text-xs text-red-600">
                    {passwordErrors.newPassword.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerUpdatePassword("confirmPassword", {
                    required: "Confirm password is required",
                    validate: (value) =>
                      value === watch("newPassword") ||
                      "Passwords do not match",
                  })}
                />
                {passwordErrors.confirmPassword && (
                  <span className="-mt-1 text-xs text-red-600">
                    {passwordErrors.confirmPassword.message}
                  </span>
                )}
              </div>
              <Button type="submit" className="mt-2" disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                {isLoading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
