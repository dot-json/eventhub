import { Button } from "@/components/ui/button";
import { Link } from "react-router";

const LandingPage = () => {
  return (
    <div className="my-4 flex flex-col gap-12 sm:m-auto">
      <div className="text-center">
        <h1 className="mb-4">Welcome to EventHub</h1>
        <p className="text-muted-foreground mb-8 sm:text-lg md:text-xl">
          Discover, create, and manage amazing events. Connect with your
          community and make every moment memorable.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="no-underline">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login" className="no-underline">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
