import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { Link } from "react-router";

const NotFoundPage = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="bg-destructive/10 grid place-items-center rounded-full p-3">
        <SearchX className="text-destructive size-10" />
      </div>
      <h1>Content Not Found</h1>
      <p>Sorry, we couldn't find the content you're looking for.</p>
      <div className="mt-4 flex gap-4">
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
        <Link to="/events">
          <Button variant="secondary">Go to Events</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
