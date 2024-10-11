import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DoubleSlit = ({
  isEmitting,
  isDetectorOn,
  setTooltipContent,
  setParticleDistribution,
  setShowBarChart,
}) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const animationRef = useRef();
  const detectionCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    detectionCanvasRef.current = document.createElement("canvas");
    detectionCanvasRef.current.width = 50;
    detectionCanvasRef.current.height = canvas.height;
    const detectionCtx = detectionCanvasRef.current.getContext("2d");

    const barrierPosition = canvas.width / 2 - 50;
    const screenPosition = canvas.width - 50;
    const sourcePosition = 50;

    const particleVelocity = 2.8; // Reduced by 30%
    const emissionInterval = 14; // Increased by ~30% to slow down emission rate

    const slitWidth = 10;
    const slitHeight = 60;
    const slitGap = 80;
    const slitY1 = (canvas.height - slitGap) / 2 - slitHeight / 2;
    const slitY2 = (canvas.height + slitGap) / 2 - slitHeight / 2;

    const topSlitColor = "#FF6B6B";
    const bottomSlitColor = "#4ECDC4";
    const waveColor = "#00b0ff"; // New color for waves

    let particles = [];
    let wavefronts = [];
    let frameCount = 0;
    let interferencePatternActive = false;

    const numPaths = 50;
    const pathOpacity = 0.1;

    const resetAnimation = () => {
      particles = [];
      wavefronts = [];
      frameCount = 0;
      interferencePatternActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopWaveSound();
      detectionCtx.clearRect(
        0,
        0,
        detectionCanvasRef.current.width,
        detectionCanvasRef.current.height,
      );
    };

    class Particle {
      constructor() {
        this.x = sourcePosition;
        this.y = canvas.height / 2;
        this.vx = particleVelocity;
        this.vy = 0;
        this.channel = null;
        this.inSuperposition = true;
        this.probabilityCloud = [];
        this.collapsing = false;
        this.collapseProgress = 0;
        this.color = "#4A0E4E";
        this.paths = this.generatePaths();
        this.opacity = 1;
      }

      generatePaths() {
        let paths = [];
        for (let i = 0; i < numPaths; i++) {
          paths.push({
            points: [{ x: this.x, y: this.y }],
            slit: Math.random() < 0.5 ? "top" : "bottom",
          });
        }
        return paths;
      }

      updatePaths() {
        this.paths.forEach((path) => {
          let lastPoint = path.points[path.points.length - 1];
          let nextX = lastPoint.x + particleVelocity;
          let nextY = lastPoint.y;

          if (nextX < barrierPosition) {
            nextY += (Math.random() - 0.5) * 1.4; // Reduced randomness by 30%
          } else if (nextX === barrierPosition) {
            nextY =
              path.slit === "top"
                ? slitY1 + slitHeight / 2
                : slitY2 + slitHeight / 2;
          } else {
            let targetY = Math.random() * canvas.height;
            nextY += (targetY - lastPoint.y) * 0.07; // Reduced speed by 30%
          }

          path.points.push({ x: nextX, y: nextY });
        });
      }

      drawPaths(ctx) {
        this.paths.forEach((path) => {
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          path.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.strokeStyle = `rgba(74, 14, 78, ${pathOpacity * this.opacity})`;
          ctx.stroke();
        });
      }

      move() {
        if (this.x < barrierPosition) {
          this.x += this.vx;
          if (this.x > 100) {
            this.createProbabilityCloud();
          }
          this.updateProbabilityCloud();
        } else {
          if (!this.channel) {
            if (isDetectorOn) {
              this.channel = Math.random() < 0.5 ? "top" : "bottom";
              this.color =
                this.channel === "top" ? topSlitColor : bottomSlitColor;
              this.inSuperposition = false;
              this.collapsing = true;
            } else {
              this.channel = "both";
              const index = particles.indexOf(this);
              if (index > -1) {
                particles.splice(index, 1);
              }
              wavefronts.push(
                new Wavefront(
                  barrierPosition + slitWidth / 2,
                  slitY1 + slitHeight / 2,
                  this.vx,
                ),
                new Wavefront(
                  barrierPosition + slitWidth / 2,
                  slitY2 + slitHeight / 2,
                  this.vx,
                ),
              );
              return;
            }
          }

          if (this.collapsing) {
            this.collapseProgress += 0.07; // Reduced by 30%
            if (this.collapseProgress >= 1) {
              this.collapsing = false;
              this.collapseProgress = 1;
            }
          } else {
            this.x += this.vx;
            if (this.channel === "top") {
              this.y = slitY1 + slitHeight / 2;
            } else if (this.channel === "bottom") {
              this.y = slitY2 + slitHeight / 2;
            }
          }
        }
        this.updatePaths();

        // Fade out particles as they approach the screen
        if (this.x > barrierPosition) {
          this.opacity = Math.max(
            0,
            1 - (this.x - barrierPosition) / (screenPosition - barrierPosition),
          );
        }
      }

      createProbabilityCloud() {
        for (let i = 0; i < 20; i++) {
          this.probabilityCloud.push({
            x: this.x + Math.random() * 60 - 30,
            y: this.y + Math.random() * 60 - 30,
            opacity: Math.random() * 0.5 + 0.5,
          });
        }
      }

      updateProbabilityCloud() {
        this.probabilityCloud.forEach((point) => {
          point.x += this.vx;
          point.opacity -= 0.014; // Reduced by 30%
        });
        this.probabilityCloud = this.probabilityCloud.filter(
          (point) => point.opacity > 0,
        );
      }

      draw() {
        ctx.globalAlpha = this.opacity;
        if (this.inSuperposition && this.x > 100 && this.x < barrierPosition) {
          this.drawProbabilityCloud();
          this.drawPaths(ctx);
        } else if (this.collapsing) {
          this.drawCollapse();
        } else {
          this.drawParticle();
        }
        ctx.globalAlpha = 1;
      }

      drawProbabilityCloud() {
        this.probabilityCloud.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 14, 78, ${point.opacity * this.opacity})`;
          ctx.fill();
        });
      }

      drawCollapse() {
        const startX = barrierPosition - 50;
        const endX = barrierPosition + slitWidth / 2;
        const x = startX + (endX - startX) * this.collapseProgress;

        ctx.beginPath();
        ctx.moveTo(startX, this.y);
        ctx.lineTo(x, this.y);
        ctx.strokeStyle = `rgba(255, 64, 129, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 64, 129, ${this.opacity})`;
        ctx.fill();

        const slitY = this.channel === "top" ? slitY1 : slitY2;
        ctx.strokeStyle = `rgba(255, 64, 129, ${this.opacity})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(barrierPosition, slitY, slitWidth, slitHeight);
      }

      drawParticle() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    class Wavefront {
      constructor(x, y, vx, wavelength) {
        this.x = x;
        this.y = y;
        this.vx = vx * 1.4; // Reduced by 30%
        this.wavelength = wavelength || 35; // Increased by ~30% to slow down wave
        this.amplitude = 1;
        this.angularFrequency = (2 * Math.PI * this.vx) / this.wavelength;
        this.initialPhase = 0;
        this.opacity = 1;
      }

      propagate() {
        this.x += this.vx;
        if (this.x >= screenPosition) {
          interferencePatternActive = true;
          this.x = screenPosition;
          return false;
        }
        this.opacity = Math.max(
          0,
          1 - (this.x - barrierPosition) / (screenPosition - barrierPosition),
        );
        return false;
      }

      draw(ctx, time) {
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 176, 255, ${this.opacity})`; // Use the new wave color with opacity
        ctx.lineWidth = 2; // Increased line width for better visibility
        for (let x = this.x; x < this.x + 50; x += 1) {
          const distance = x - this.x;
          const y =
            this.y +
            20 *
              Math.sin(
                this.angularFrequency * (time - distance / this.vx) +
                  this.initialPhase,
              );
          if (x === this.x) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    }

    const drawBarrier = () => {
      ctx.fillStyle = "#37474F";
      ctx.fillRect(barrierPosition, 0, slitWidth, canvas.height);
      ctx.clearRect(barrierPosition, slitY1, slitWidth, slitHeight);
      ctx.clearRect(barrierPosition, slitY2, slitWidth, slitHeight);

      const drawSlit = (y, color) => {
        ctx.strokeStyle = "#37474F";
        ctx.lineWidth = 2;
        ctx.strokeRect(barrierPosition, y, slitWidth, slitHeight);

        ctx.fillStyle = color;
        ctx.fillRect(barrierPosition, y, slitWidth, 2);
        ctx.fillRect(barrierPosition, y + slitHeight - 2, slitWidth, 2);
      };

      drawSlit(slitY1, topSlitColor);
      drawSlit(slitY2, bottomSlitColor);
    };

    const drawScreen = () => {
      ctx.fillStyle = "#CFD8DC";
      ctx.fillRect(screenPosition, 0, 2, canvas.height);
    };

    const drawFlash = (x, y, color) => {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color + "80";
      ctx.fill();
    };

    const updateDetectionScreen = (x, y, color) => {
      if (!color) {
        color = "#4A0E4E";
      }
      const gradient = detectionCtx.createRadialGradient(
        x - screenPosition,
        y,
        0,
        x - screenPosition,
        y,
        20,
      );
      gradient.addColorStop(0, color + "40");
      gradient.addColorStop(1, "transparent");
      detectionCtx.fillStyle = gradient;
      detectionCtx.fillRect(x - screenPosition - 20, y - 20, 40, 40);
    };

    const drawDetectionScreen = () => {
      ctx.drawImage(detectionCanvasRef.current, screenPosition, 0);
    };

    const updateParticleDistribution = (y) => {
      const binIndex = Math.floor((y / canvas.height) * 20);
      setParticleDistribution((prev) => {
        const newDist = [...prev];
        newDist[binIndex]++;
        return newDist;
      });
      setShowBarChart(true);
    };

    const drawDetector = () => {
      if (isDetectorOn) {
        ctx.fillStyle = "#FF4081";
        ctx.fillRect(barrierPosition - 20, 0, 10, canvas.height);
        ctx.fillRect(barrierPosition - 15, slitY1, 20, slitHeight);
        ctx.fillRect(barrierPosition - 15, slitY2, 20, slitHeight);
        setTooltipContent(
          "Detector Active: Observing particle paths through slits",
        );
      } else {
        setTooltipContent("");
      }
    };

    const highlightSlits = () => {
      if (isDetectorOn) {
        ctx.shadowColor = "#FF4081";
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#FF4081";
        ctx.strokeRect(barrierPosition, slitY1, slitWidth, slitHeight);
        ctx.strokeRect(barrierPosition, slitY2, slitWidth, slitHeight);
        ctx.shadowBlur = 0;
      }
    };

    const calculateInterference = (y, time) => {
      const wavelength = 70; // Increased by ~30% to slow down interference pattern
      const k = (2 * Math.PI) / wavelength;
      const screenDistance = screenPosition - barrierPosition;

      const yPosition = y + 0.5;
      const deltaY1 = yPosition - (slitY1 + slitHeight / 2);
      const deltaY2 = yPosition - (slitY2 + slitHeight / 2);

      const r1 = Math.sqrt(screenDistance ** 2 + deltaY1 ** 2);
      const r2 = Math.sqrt(screenDistance ** 2 + deltaY2 ** 2);

      const amplitude1 = Math.cos(k * r1 - (2 * Math.PI * time) / 140); // Slowed down by ~30%
      const amplitude2 = Math.cos(k * r2 - (2 * Math.PI * time) / 140); // Slowed down by ~30%

      const intensity = (amplitude1 + amplitude2) ** 2;

      return intensity / 4;
    };

    const drawInterferencePattern = () => {
      ctx.fillStyle = "#CFD8DC";
      ctx.fillRect(screenPosition + 2, 0, 48, canvas.height);

      if (!isDetectorOn && interferencePatternActive) {
        const imageData = ctx.createImageData(48, canvas.height);

        for (let y = 0; y < canvas.height; y++) {
          const intensity = calculateInterference(y, frameCount);
          const color = Math.floor(intensity * 255);

          const index = y * 48 * 4;
          for (let x = 0; x < 48; x++) {
            imageData.data[index + x * 4] = 100;
            imageData.data[index + x * 4 + 1] = 181;
            imageData.data[index + x * 4 + 2] = 246;
            imageData.data[index + x * 4 + 3] = color;
          }
        }

        ctx.putImageData(imageData, screenPosition + 2, 0);
      }
    };

    const playParticleSound = () => {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    };

    const startWaveSound = () => {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillatorRef.current = oscillator;
    };

    const stopWaveSound = () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBarrier();
      drawScreen();
      drawDetector();
      highlightSlits();

      frameCount++;

      if (isEmitting && frameCount % emissionInterval === 0) {
        particles.push(new Particle());
      }

      particles.forEach((particle, index) => {
        particle.move();
        particle.draw();

        if (particle.x >= screenPosition) {
          if (isDetectorOn) {
            drawFlash(screenPosition, particle.y, particle.color);
            updateDetectionScreen(screenPosition, particle.y, particle.color);
            updateParticleDistribution(particle.y);
            playParticleSound();
          } else {
            interferencePatternActive = true;
          }
          particles.splice(index, 1);
        }
      });

      wavefronts.forEach((wavefront, index) => {
        if (wavefront.propagate()) {
          wavefronts.splice(index, 1);
        } else {
          wavefront.draw(ctx, frameCount);
        }
      });

      if (isDetectorOn) {
        drawDetectionScreen();
      } else {
        drawInterferencePattern();
      }

      if (!isDetectorOn && interferencePatternActive) {
        if (!oscillatorRef.current) {
          startWaveSound();
        }
      } else {
        stopWaveSound();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resetAnimation();
    };
  }, [
    isEmitting,
    isDetectorOn,
    setTooltipContent,
    setParticleDistribution,
    setShowBarChart,
  ]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        marginTop: "20px",
        border: "2px solid #90A4AE",
        borderRadius: "4px",
      }}
    />
  );
};

export default DoubleSlit;
