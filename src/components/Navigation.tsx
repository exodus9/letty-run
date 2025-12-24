import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import CloseButton from "./CloseButton";
import { useLocale } from "@/hooks/useLocale";

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLocale();

  const navItems = [
    { path: "/", label: t.menuPlay, emoji: "O" },
    { path: "/scoreboard", label: t.menuLeaderboard, emoji: "X" },
  ];

  const NavLink = ({ item, onClick }: { item: typeof navItems[0], onClick?: () => void }) => (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "font-bold text-lg px-4 py-2 transition-all duration-200 block rounded-xl",
        "hover:bg-blue-100 hover:scale-105",
        location.pathname === item.path
          ? "bg-blue-500 text-white"
          : "text-gray-700"
      )}
    >
      <span className="mr-2">{item.emoji}</span>
      {item.label}
    </Link>
  );

  return (
    <nav className="w-full bg-white border-b-4 border-blue-500 shadow-md p-3 md:p-4">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between relative">
          {/* Hamburger Menu - Left side */}
          <div className="flex-shrink-0 -ml-2.5">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="lg" className="text-blue-500 hover:bg-blue-100 p-4">
                  <Menu className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] bg-white border-blue-500">
                <div className="flex flex-col space-y-4 mt-8">
                  <h2 className="font-bold text-blue-600 text-xl mb-4">{t.menuTitle}</h2>
                  {navItems.map((item) => (
                    <NavLink key={item.path} item={item} onClick={() => setIsOpen(false)} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Title - Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link to="/">
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-blue-600 whitespace-nowrap">
                SIMPLE GAME
              </h1>
            </Link>
          </div>

          {/* Close Button - Right side */}
          <div className="flex-shrink-0">
            <CloseButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
