'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const activeCanvas = canvas;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      pulse: number;
      pulseSpeed: number;

      constructor() {
        this.x = Math.random() * activeCanvas.width;
        this.y = Math.random() * activeCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.7 ? '#06b6d4' : '#f59e0b'; // cyan or amber
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += this.pulseSpeed;

        if (this.x < 0) this.x = activeCanvas.width;
        if (this.x > activeCanvas.width) this.x = 0;
        if (this.y < 0) this.y = activeCanvas.height;
        if (this.y > activeCanvas.height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        const alpha = 0.3 + 0.2 * Math.sin(this.pulse);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((activeCanvas.width * activeCanvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawGrid = () => {
      if (!ctx) return;

      // Deep space background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, activeCanvas.height);
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(0.5, '#0f0f1a');
      gradient.addColorStop(1, '#0a0a0f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);

      // Animated grid lines
      const gridSize = 50;
      const time = Date.now() * 0.0001;
      const offset = (time * 20) % gridSize;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)'; // cyan with low opacity
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < activeCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, activeCanvas.height);
        ctx.stroke();
      }

      // Horizontal lines with scan effect
      for (let y = offset - gridSize; y < activeCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(activeCanvas.width, y);
        ctx.stroke();
      }

      // Scan line
      const scanY = (Date.now() * 0.05) % activeCanvas.height;
      const scanGradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
      scanGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
      scanGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
      scanGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 50, activeCanvas.width, 100);
    };

    const animate = () => {
      drawGrid();

      // Draw and update particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections between nearby particles
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
