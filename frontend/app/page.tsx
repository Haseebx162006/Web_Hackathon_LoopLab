"use client";

import React, { useState } from "react";
import Categories from "@/components/Categories";
import Features from "@/components/Features";
import Header from "@/components/Header";
import HeroScroll from "@/components/HeroScroll";
import Products from "@/components/Products";
import Subscribe from "@/components/Subscribe";
import Footer from "@/components/Footer";
import CinematicPreloader from "@/components/CinematicPreloader";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showPreloader && (
          <CinematicPreloader onComplete={() => setShowPreloader(false)} />
        )}
      </AnimatePresence>
      
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
