import React, { useRef, useEffect } from "react";

const DoubleSlit = ({ isEmitting, isDetectorOn, setTooltipContent, setParticleDistribution, setShowBarChart }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    const barrierPosition = canvas.width / 2 - 50;
    const screenPosition = canvas.width - 50;

    const slitWidth = 10;
    const slitHeight = 60;
    const slitGap = 80;
    const slitY1 = (canvas.height - slitGap) / 2 - slitHeight / 2;
    const slitY2 = (canvas.height + slitGap) / 2 - slitHeight / 2;

    const topSlitColor = "#FF6B6B";
    const bottomSlitColor = "#4ECDC4";

    let particles = [];
    let detectedParticles = [];
    let wavefronts = [];
    let frameCount = 0;
    const emissionInterval = 20;
    let interferencePatternActive = false;

    // Create an off-screen canvas for the detection screen
    const detectionCanvas = document.createElement('canvas');
    detectionCanvas.width = 50;
    detectionCanvas.height = canvas.height;
    const detectionCtx = detectionCanvas.getContext('2d');

    const resetAnimation = () => {
      particles = [];
      wavefronts = [];
      detectedParticles = [];
      interferencePatternActive = false;
      detectionCtx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    class Particle {
      constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.vx = 2;
        this.vy = 0;
        this.channel = null;
        this.inSuperposition = true;
        this.superpositionWaves = [];
        this.probabilityCloud = [];
        this.collapsing = false;
        this.collapseProgress = 0;
        this.trail = [];
      }

      move() {
        if (this.x < barrierPosition - 100) {
          this.x += this.vx;
          if (this.inSuperposition && this.x > 100) {
            this.createProbabilityCloud();
          }
        } else if (this.x < barrierPosition) {
          this.x += this.vx;
          this.updateProbabilityCloud();
        } else {
          if (!this.channel) {
            if (isDetectorOn) {
              this.channel = Math.random() < 0.5 ? "top" : "bottom";
              this.inSuperposition = false;
              this.collapsing = true;
            } else {
              this.channel = "both";
              const index = particles.indexOf(this);
              if (index > -1) {
                particles.splice(index, 1);
              }
              wavefronts.push(
                new Wavefront(barrierPosition + slitWidth / 2, slitY1 + slitHeight / 2, this.vx),
                new Wavefront(barrierPosition + slitWidth / 2, slitY2 + slitHeight / 2, this.vx)
              );
              return;
            }
          }

          if (this.collapsing) {
            this.collapseProgress += 0.1;
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

            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 20) {
              this.trail.shift();
            }
          }
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
          point.opacity -= 0.02;
        });
        this.probabilityCloud = this.probabilityCloud.filter((point) => point.opacity > 0);
      }

      draw() {
        if (this.inSuperposition && this.x > 100) {
          this.drawProbabilityCloud();
        } else if (this.collapsing) {
          this.drawCollapse();
        } else {
          this.drawParticle();
          this.drawTrail();
        }
      }

      drawProbabilityCloud() {
        this.probabilityCloud.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 14, 78, ${point.opacity})`;
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
        ctx.strokeStyle = "#FF4081";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#FF4081";
        ctx.fill();

        // Highlight chosen slit
        const slitY = this.channel === "top" ? slitY1 : slitY2;
        ctx.strokeStyle = "#FF4081";
        ctx.lineWidth = 3;
        ctx.strokeRect(barrierPosition, slitY, slitWidth, slitHeight);
      }

      drawParticle() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#4A0E4E";
        ctx.fill();
      }

      drawTrail() {
        ctx.beginPath();
        this.trail.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.strokeStyle = "rgba(74, 14, 78, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    class Wavefront {
      constructor(x, y, vx, wavelength) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.wavelength = wavelength || 50;
        this.amplitude = 1;
        this.angularFrequency = (2 * Math.PI * vx) / this.wavelength;
        this.initialPhase = 0;
      }

      propagate() {
        this.x += this.vx;
        if (this.x >= screenPosition) {
          interferencePatternActive = true;
          this.x = screenPosition;
          return false;
        }
        return false;
      }

      draw(ctx, time) {
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 0, 255, 0.2)";
        ctx.lineWidth = 1;
        for (let x = this.x; x < this.x + 50; x += 1) {
          const distance = x - this.x;
          const y = this.y + 20 * Math.sin(this.angularFrequency * (time - distance / this.vx) + this.initialPhase);
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
      ctx.fillStyle = color + "80"; // Add 50% opacity
      ctx.fill();
    };

    const updateDetectionScreen = (x, y, color) => {
      const gradient = detectionCtx.createRadialGradient(x - screenPosition, y, 0, x - screenPosition, y, 20);
      gradient.addColorStop(0, color + "40"); // 25% opacity at center
      gradient.addColorStop(1, "transparent");
      detectionCtx.fillStyle = gradient;
      detectionCtx.fillRect(x - screenPosition - 20, y - 20, 40, 40);
    };

    const drawDetectionScreen = () => {
      ctx.drawImage(detectionCanvas, screenPosition, 0);
    };

    const updateParticleDistribution = (y) => {
      const binIndex = Math.floor((y / canvas.height) * 20);
      setParticleDistribution(prev => {
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

        // Draw "sensors" near slits
        ctx.fillRect(barrierPosition - 15, slitY1, 20, slitHeight);
        ctx.fillRect(barrierPosition - 15, slitY2, 20, slitHeight);

        setTooltipContent("Detector Active: Observing particle paths through slits");
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

    // New function for calculating interference
    const calculateInterference = (y, time) => {
      const wavelength = 50;
      const k = (2 * Math.PI) / wavelength;
      const _slitSeparation = slitY2 + slitHeight / 2 - (slitY1 + slitHeight / 2);
      const screenDistance = screenPosition - barrierPosition;

      const yPosition = y + 0.5;
      const deltaY1 = yPosition - (slitY1 + slitHeight / 2);
      const deltaY2 = yPosition - (slitY2 + slitHeight / 2);

      const r1 = Math.sqrt(screenDistance ** 2 + deltaY1 ** 2);
      const r2 = Math.sqrt(screenDistance ** 2 + deltaY2 ** 2);

      const pathDifference = r2 - r1;
      const _phaseDifference = k * pathDifference;

      const amplitude1 = Math.cos(k * r1 - 2 * Math.PI * time / 100);
      const amplitude2 = Math.cos(k * r2 - 2 * Math.PI * time / 100);

      const intensity = (amplitude1 + amplitude2) ** 2;

      return intensity / 4; // Normalize to [0, 1]
    };

    // New function for drawing interference pattern
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
            imageData.data[index + x * 4] = 100;     // R
            imageData.data[index + x * 4 + 1] = 181; // G
            imageData.data[index + x * 4 + 2] = 246; // B
            imageData.data[index + x * 4 + 3] = color; // A
          }
        }

        ctx.putImageData(imageData, screenPosition + 2, 0);
      }
    };

    const playSound = () => {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz - A4 note
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
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
            const particleColor = particle.channel === "top" ? topSlitColor : bottomSlitColor;
            drawFlash(screenPosition, particle.y, particleColor);
            updateDetectionScreen(screenPosition, particle.y, particleColor);
            updateParticleDistribution(particle.y);
            playSound(); // Play sound when particle hits the screen
          }
          particles.splice(index, 1);
        }
      });

      wavefronts.forEach((wavefront) => {
        wavefront.propagate();
        wavefront.draw(ctx, frameCount);
      });

      if (isDetectorOn) {
        drawDetectionScreen();
      } else {
        drawInterferencePattern();
      }

      // Draw superposition explanation
      if (particles.length > 0 && particles[0].inSuperposition) {
        ctx.font = "14px Arial";
        ctx.fillStyle = "#333";
        ctx.fillText("Particle in superposition", 10, 20);
      }

      // Update tooltip content
      if (isDetectorOn) {
        setTooltipContent("Detector Active: Wave function collapses, particle chooses one slit");
      } else {
        setTooltipContent("Detector Inactive: Particle behaves as a wave, passing through both slits");
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resetAnimation();
    };
  }, [isEmitting, isDetectorOn, setTooltipContent, setParticleDistribution, setShowBarChart]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        marginTop: "20px",
        border: "2px solid #90A4AE",
        borderRadius: "4px",
      }}
    />
  );
};

export default DoubleSlit;