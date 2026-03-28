"use client";

import React from "react";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Hero Content */}
          <div className="z-10 text-center lg:text-left animate-fade-in-up">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Shop Your Favorite <br />
              <span className="bg-gradient-to-r from-[#FFB7CE] to-[#D4A5FF] bg-clip-text text-transparent">
                Products
              </span> at LoopBazar
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-xl mx-auto lg:mx-0">
              Fresh deals every day, delivered to your door. Experience the joy
              of seamless shopping with our premium curated collections.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <button className="h-14 w-full sm:w-48 rounded-2xl bg-[#FFB7CE] text-lg font-bold text-white shadow-lg transition-all hover:bg-[#D4A5FF] hover:-translate-y-1 hover:shadow-xl sm:px-8">
                Shop Now
              </button>
              <button className="h-14 w-full sm:w-48 rounded-2xl border-2 border-[#D4A5FF] bg-transparent text-lg font-bold text-[#D4A5FF] transition-all hover:bg-[#D4A5FF]/10 sm:px-8">
                Explore More
              </button>
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="relative flex justify-center lg:justify-end animate-float">
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#FFB7CE]/20 to-[#D4A5FF]/20 blur-3xl" />
            
            <div className="relative z-10 w-full max-w-[500px]">
              {/* Replace with actual image path when confirmed */}
              <Image
                src="/hero-illustration.png" 
                alt="LoopBazar Shopping Illustration"
                width={600}
                height={600}
                className="h-auto w-full object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
