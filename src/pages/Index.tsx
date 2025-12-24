import Navigation from "@/components/Navigation";
import LettyRunGame from "@/components/LettyRunGame";

const Index = () => {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <Navigation />
        <main className="flex-1">
          <LettyRunGame />
        </main>
      </div>
    </div>
  );
};

export default Index;
