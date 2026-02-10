export default function Logo({ className = "w-8 h-8", showText = true }) {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/logo.png" 
        alt="Flow Logo" 
        className={`${className} object-contain rounded-lg`}
      />
      {showText && (
        <span className="font-heading font-bold text-xl text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
          Flow
        </span>
      )}
    </div>
  );
}
