import { toast } from "sonner";

export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    closeButton: true,
    classNames: {
      toast: "!bg-success/15 !backdrop-blur-xl !border !border-success",
      icon: "!text-success",
      title: "!text-success",
    },
  });
};

export const toastError = (message: string) => {
  toast.error(message, {
    duration: 3000,
    closeButton: true,
    classNames: {
      toast: "!bg-destructive/15 !backdrop-blur-xl !border !border-destructive",
      icon: "!text-destructive",
      title: "!text-destructive",
    },
  });
};

export const toastInfo = (message: string) => {
  toast.info(message, {
    duration: 3000,
    closeButton: true,
    classNames: {
      toast: "!bg-info/15 !backdrop-blur-xl !border !border-info",
      icon: "!text-info",
      title: "!text-info",
    },
  });
};
