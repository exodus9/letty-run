import Navigation from "@/components/Navigation";
import SimpleGame from "@/components/SimpleGame";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-2 py-2 md:px-4 md:py-8">
        <div className="text-center h-full">
          <SimpleGame />
        </div>
      </main>
    </div>
  );
};

export default Index;
