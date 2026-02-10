import { useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const HandleProfile = lazy(() => import("./HandleProfile"));

const NotFound = () => {
  const location = useLocation();

  // Handle /@handle paths that React Router can't match with partial params
  const handleMatch = location.pathname.match(/^\/@(.+)$/);

  useEffect(() => {
    if (!handleMatch) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname, handleMatch]);

  if (handleMatch) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      }>
        <HandleProfile />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
