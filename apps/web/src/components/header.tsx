import Logo from "./icons/logo";
import { Link } from "react-router";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="sticky border-b backdrop-blur-2xl">
      <div className="container h-16 mx-auto flex items-center justify-between max-w-4xl px-4 w-full">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <h1 className="text-2xl font-semibold select-none cursor-pointer">EventHub</h1>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/register">Register</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
