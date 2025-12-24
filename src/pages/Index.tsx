import Navigation from "@/components/Navigation";
import LettyRunGame from "@/components/LettyRunGame";

const Index = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation />
      <main className="flex-1">
        <LettyRunGame />
      </main>
    </div>
  );
};

export default Index;
