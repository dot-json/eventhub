import { Link } from "react-router";
import { Button } from "./ui/button";
import { useAuth, useUser } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Calendar,
  CircleUserRound,
  LogOut,
  Settings,
  Tickets,
  Moon,
  Sun,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useTheme } from "./theme-provider";

const Header = () => {
  const { setTheme, theme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const { user, isOrganizer, isCustomer, isAdmin } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const resolveHomeLink = (): string => {
    if (isAuthenticated()) {
      if (isOrganizer) {
        return "/my-events";
      }
      return "/events";
    } else {
      return "/";
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4">
        <Link to={resolveHomeLink()} className="flex items-center gap-2">
          <span className="cursor-pointer text-2xl font-semibold select-none">
            EventHub
          </span>
        </Link>
        {isAuthenticated() ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <CircleUserRound strokeWidth="1.5" className="size-7" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="mx-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">{`${user?.first_name} ${user?.last_name}`}</p>
                  {user?.org_name && (
                    <p className="text-sm">{user?.org_name}</p>
                  )}
                </div>
                <hr />
                <div className="flex flex-col gap-2">
                  {(isOrganizer || isAdmin) && (
                    <Link to="/my-events" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Calendar />
                        <span>My Events</span>
                      </Button>
                    </Link>
                  )}
                  {(isCustomer || isAdmin) && (
                    <Link to="/my-tickets" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Tickets />
                        <span>My Tickets</span>
                      </Button>
                    </Link>
                  )}
                  <Link to="/settings" onClick={closeMenu}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings />
                      <span>Settings</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() =>
                      setTheme(theme === "light" ? "dark" : "light")
                    }
                  >
                    {theme === "light" ? <Moon /> : <Sun />}
                    {theme === "light"
                      ? "Switch to Dark Mode"
                      : "Switch to Light Mode"}
                  </Button>
                </div>
                <hr />
                <Button
                  className="size-full"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                >
                  <LogOut />
                  Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="default">Register</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
