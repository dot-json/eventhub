import { useUserStore } from "../stores/userStore";

export const useAuth = () => {
  const {
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useUserStore();

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};

export const useUser = () => {
  const { user, updateProfile, updatePassword, isLoading, error, clearError } =
    useUserStore();

  return {
    user,
    updateProfile,
    updatePassword,
    isLoading,
    error,
    clearError,
    isCustomer: user?.role === "CUSTOMER",
    isOrganizer: user?.role === "ORGANIZER",
    isAdmin: user?.role === "ADMIN",
  };
};
