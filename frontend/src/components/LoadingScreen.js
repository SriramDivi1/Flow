export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in text-foreground">
      <div className="relative">
        <h1 className="font-heading text-6xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-muted-foreground/20 via-primary to-muted-foreground/20 bg-[length:200%_auto] animate-shimmer select-none">
          FLOW
        </h1>
        
        {/* Subtle glow underneath */}
        <div className="absolute -bottom-4 left-0 right-0 h-1 bg-primary/20 blur-xl rounded-full"></div>
      </div>
      
      <p className="mt-8 text-xs md:text-sm text-muted-foreground font-medium tracking-[0.3em] animate-pulse">
        LOADING...
      </p>
    </div>
  );
}
