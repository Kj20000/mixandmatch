import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full bg-pastel-lavender opacity-50" />
      <div className="absolute bottom-[-60px] right-[-60px] w-48 h-48 rounded-full bg-pastel-mint opacity-50" />
      <div className="absolute top-[20%] right-[10%] w-24 h-24 rounded-full bg-pastel-peach opacity-40" />
      <div className="absolute bottom-[30%] left-[5%] w-20 h-20 rounded-full bg-pastel-sky opacity-40" />

      {/* Settings button */}
      <button
        onClick={() => navigate("/settings")}
        className="absolute top-6 right-6 p-3 rounded-full bg-card shadow-md hover:shadow-lg transition-shadow"
        aria-label="Settings"
      >
        <Settings className="w-6 h-6 text-muted-foreground" />
      </button>

      {/* Main content */}
      <div className="text-center z-10 animate-bounce-in">
        <div className="text-6xl mb-4">🧩</div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 font-display">
          Word Match
        </h1>
        <p className="text-lg text-muted-foreground mb-10 font-body max-w-xs mx-auto">
          Connect words to pictures by drawing a line!
        </p>

        <Button
          onClick={() => navigate("/play")}
          size="lg"
          className="text-2xl px-12 py-8 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 font-display"
        >
          ▶ Play
        </Button>
      </div>
    </div>
  );
};

export default Home;
