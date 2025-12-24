import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <div className="text-8xl mb-4">😢</div>
          <h1 className="text-6xl md:text-8xl font-bubble font-bold bg-gradient-to-r from-idol-pink via-idol-purple to-idol-blue bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-2xl md:text-3xl font-bubble text-idol-purple">
            PAGE NOT FOUND
          </p>
          <p className="font-fun text-lg text-muted-foreground">
            Oops! This page doesn't exist.
          </p>
          <Link to="/">
            <Button
              size="lg"
              className="font-bubble text-xl bg-gradient-to-r from-idol-pink to-idol-purple hover:from-idol-purple hover:to-idol-pink text-white shadow-pop border-4 border-white rounded-2xl px-8 py-6"
            >
              🏠 RETURN HOME
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
