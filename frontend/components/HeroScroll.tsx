"use client";

import React, { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 192;
const IMG_PREFIX = "ezgif-frame-";

const HeroScroll = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const frameIndex = i.toString().padStart(3, "0");
      const img = new Image();
      img.src = `/assets/hero/${IMG_PREFIX}${frameIndex}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setIsLoaded(true);
        }
      };
      loadedImages[i] = img;
    }
    setImages(loadedImages);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !canvasRef.current || !isLoaded) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      const scrollTop = window.scrollY;
      const maxScroll = container.scrollHeight - window.innerHeight;
      const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
      
      let frameIndex = Math.floor(scrollFraction * (TOTAL_FRAMES - 1)) + 1;
      
      if (frameIndex > TOTAL_FRAMES) frameIndex = TOTAL_FRAMES;

      const img = images[frameIndex];
      if (img && img.complete) {
        // Cover logic for canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
        const newWidth = imgWidth * ratio;
        const newHeight = imgHeight * ratio;
        const x = (canvasWidth - newWidth) / 2;
        const y = (canvasHeight - newHeight) / 2;

        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(img, x, y, newWidth, newHeight);
      }
    };

    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        handleScroll();
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [images, isLoaded]);

  return (
    <div ref={containerRef} className="relative h-[800vh] w-full bg-brand-bg">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover mix-blend-multiply opacity-100"
        />
        
        {/* Scroll Indicator (Luxurious) */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none animate-fade-in-up">
            <div className="w-[1px] h-20 bg-gradient-to-b from-gray-200 to-transparent"></div>
        </div>

        {/* Loading Indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">LoopBazar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroScroll;
