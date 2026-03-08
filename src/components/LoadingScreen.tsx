import servnestLogo from "@/assets/servnest-logo.png";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <img
        src={servnestLogo}
        alt="ServNest"
        className="h-24 w-auto animate-pulse md:h-32"
      />
      <p className="mt-6 text-sm font-medium text-muted-foreground animate-fade-in">
        Loading ServNest Services…
      </p>
    </div>
  );
};

export default LoadingScreen;
