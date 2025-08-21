import Logo from "./icons/logo";
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
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const { user, isOrganizer, isCustomer, isAdmin } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky border-b backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="size-8" />
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
                  <p className="font-semibold">{`${user?.first_name} ${user?.last_name}`}</p>
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
