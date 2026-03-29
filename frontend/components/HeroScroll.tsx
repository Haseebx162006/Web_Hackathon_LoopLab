"use client";

import React, { useEffect, useRef, useState } from "react";

const START_FRAME = 7;
const END_FRAME = 192;
const IMG_PREFIX = "ezgif-frame-";

const HeroScroll = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [initialFrameLoaded, setInitialFrameLoaded] = useState(false);

  // Preload images - Phase 1: Initial Frame (Instant Load)
  useEffect(() => {
    const totalFrames = END_FRAME - START_FRAME + 1;
    const loadImage = (index: number) => {
      return new Promise<void>((resolve) => {
        if (imagesRef.current[index]) {
            resolve();
            return;
        }
        const frameIndex = index.toString().padStart(3, "0");
        const img = new Image();
        img.src = `/assets/hero/${IMG_PREFIX}${frameIndex}.png`;
        img.onload = () => {
          imagesRef.current[index] = img;
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    const loadSequence = async () => {
      // 1. Critical Frame
      await loadImage(START_FRAME);
      setInitialFrameLoaded(true);

      // 2. Buffer Frames (immediate scroll range)
      const bufferTasks = [];
      for (let i = START_FRAME + 1; i <= Math.min(START_FRAME + 20, END_FRAME); i++) {
        bufferTasks.push(loadImage(i));
      }
      await Promise.all(bufferTasks);

      // 3. Sparse Frames (rough animation for fast scroll)
      const sparseTasks = [];
      for (let i = START_FRAME + 21; i <= END_FRAME; i += 10) {
        sparseTasks.push(loadImage(i));
      }
      await Promise.all(sparseTasks);

      // 4. Background Fill (rest of the frames)
      for (let i = START_FRAME; i <= END_FRAME; i++) {
        if (!imagesRef.current[i]) {
            await loadImage(i);
        }
      }
    };

    loadSequence();
  }, []);

  useEffect(() => {
    let requestRef = 0;

    const drawFrame = (forceIndex?: number) => {
      if (!containerRef.current || !canvasRef.current || !initialFrameLoaded) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const container = containerRef.current;
      const scrollTop = window.scrollY;
      const maxScroll = container.scrollHeight - window.innerHeight;
      const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
      
      let frameIndex = forceIndex !== undefined ? forceIndex : Math.floor(scrollFraction * (END_FRAME - START_FRAME)) + START_FRAME;
      
      frameIndex = Math.max(START_FRAME, Math.min(END_FRAME, frameIndex));

      // Find nearest loaded frame
      const images = imagesRef.current;
      let img = images[frameIndex];
      
      if (!img || !img.complete) {
          // Search neighbors
          for (let offset = 1; offset < 20; offset++) {
              const prevIndex = frameIndex - offset;
              const nextIndex = frameIndex + offset;
              if (prevIndex >= START_FRAME && images[prevIndex]?.complete) {
                  img = images[prevIndex];
                  break;
              }
              if (nextIndex <= END_FRAME && images[nextIndex]?.complete) {
                  img = images[nextIndex];
                  break;
              }
          }
      }

      if (img && img.complete) {
        const { width: cw, height: ch } = canvas;
        const { width: iw, height: ih } = img;
        const ratio = Math.max(cw / iw, ch / ih);
        const nw = iw * ratio;
        const nh = ih * ratio;
        const x = (cw - nw) / 2;
        const y = (ch - nh) / 2;

        context.clearRect(0, 0, cw, ch);
        context.drawImage(img, x, y, nw, nh);
      }
    };

    const handleScroll = () => {
        if (requestRef) cancelAnimationFrame(requestRef);
        requestRef = requestAnimationFrame(() => drawFrame());
    };

    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        drawFrame();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    if (initialFrameLoaded) {
        drawFrame(START_FRAME);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resizeCanvas);
      if (requestRef) cancelAnimationFrame(requestRef);
    };
  }, [initialFrameLoaded]);

  return (
    <div ref={containerRef} className="relative h-[800vh] w-full bg-brand-bg">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover mix-blend-multiply opacity-100"
        />
        
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-black/5 z-10 pointer-events-none"></div>
        
        {/* Scroll Indicator (Luxurious) */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none animate-fade-in-up z-20">
            <div className="w-px h-20 bg-linear-to-b from-gray-300 to-transparent"></div>
        </div>

        {/* Loading Indicator - only show before the first frame is ready */}
        {!initialFrameLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">LoopBazar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroScroll;
