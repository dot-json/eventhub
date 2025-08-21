import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router";

const UnauthorizedPage = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="bg-destructive/10 grid place-items-center rounded-full p-3">
        <AlertTriangle className="text-destructive size-10" />
      </div>
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="text-muted-foreground">
        You don't have permission to access this page.
      </p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
