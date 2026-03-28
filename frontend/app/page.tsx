import Categories from "@/components/Categories";
import Features from "@/components/Features";
import Header from "@/components/Header";
import HeroScroll from "@/components/HeroScroll";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroScroll />
        <Features />
        <Categories />
      </main>
    </div>
  );
}
