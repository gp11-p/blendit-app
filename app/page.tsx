import { Header } from "@/components/Header";
import { RecipeFinder } from "@/components/RecipeFinder";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <RecipeFinder />
    </div>
  );
}
