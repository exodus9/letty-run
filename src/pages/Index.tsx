import { Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border mb-8 animate-float glow-primary">
          <Zap className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
          <span className="text-gradient">letty-run</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto mb-12">
          프로젝트가 준비되었습니다. 이제 무엇이든 만들어보세요.
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Ready to build
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-muted-foreground/50 text-sm">
        Powered by Lovable
      </div>
    </div>
  );
};

export default Index;
