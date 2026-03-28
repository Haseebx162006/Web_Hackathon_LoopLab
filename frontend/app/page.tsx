import Categories from "@/components/Categories";
import Features from "@/components/Features";
import Header from "@/components/Header";
import HeroScroll from "@/components/HeroScroll";
import Products from "@/components/Products";
import Subscribe from "@/components/Subscribe";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroScroll />
        <Features />
        <Categories />
        <Products />
        <Subscribe />
        <Footer />
      </main>
    </div>
  );
}
