import React, { useRef, useEffect } from "react";

const DoubleSlit = ({ isEmitting, isDetectorOn }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

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
    let impacts = [];
    let impactCounts = [];
    let channelImpactCounts = { top: 0, bottom: 0 };
    let wavefronts = [];
    let frameCount = 0;
    const emissionInterval = 20; // Emit particles more frequently for smoother animation

    const resetAnimation = () => {
      particles = [];
      wavefronts = [];
      impacts = [];
      impactCounts = [];
      channelImpactCounts = { top: 0, bottom: 0 };
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
      }

      move() {
        if (this.x < barrierPosition) {
          this.x += this.vx;
        } else {
          if (!this.channel) {
            if (isDetectorOn) {
              this.channel = Math.random() < 0.5 ? "top" : "bottom";
            } else {
              this.channel = "both";
              // Remove particle and generate initial wavefronts
              const index = particles.indexOf(this);
              if (index > -1) {
                particles.splice(index, 1);
              }
              wavefronts.push(
                new Wavefront(
                  barrierPosition + slitWidth / 2,
                  slitY1 + slitHeight / 2,
                  this.vx
                ),
                new Wavefront(
                  barrierPosition + slitWidth / 2,
                  slitY2 + slitHeight / 2,
                  this.vx
                )
              );
              return;
            }
          }

          this.x += this.vx;

          if (this.channel === "top") {
            this.y = slitY1 + slitHeight / 2;
          } else if (this.channel === "bottom") {
            this.y = slitY2 + slitHeight / 2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#4A0E4E";
        ctx.fill();
      }
    }

    class Wavefront {
      constructor(x, y, vx) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.amplitude = 1;
        this.phase = 0;
      }

      propagate() {
        this.x += this.vx;
        this.phase += 0.1; // Adjust for wave speed
        if (this.x >= screenPosition) {
          // Calculate interference at the screen
          for (let i = 0; i < canvas.height; i++) {
            const pathDifference = Math.abs(i - this.y);
            const wavelength = 20; // Adjust wavelength for visualization
            const phaseDifference = (2 * Math.PI * pathDifference) / wavelength;
            const intensity = this.amplitude * Math.cos(this.phase - phaseDifference);

            if (!impactCounts[i]) {
              impactCounts[i] = 0;
            }
            impactCounts[i] += intensity;
          }
          // Remove wavefront after reaching the screen
          const index = wavefronts.indexOf(this);
          if (index > -1) {
            wavefronts.splice(index, 1);
          }
        }
      }

      draw() {
        // Visualize the wavefront as a moving sinusoidal wave
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 0, 255, 0.2)";
        ctx.lineWidth = 1;
        for (let x = this.x; x < this.x + 50; x += 1) {
          const y =
            this.y +
            20 * Math.sin((2 * Math.PI * (x - this.x)) / 40 - this.phase);
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

    const updateInterferencePattern = () => {
      if (isDetectorOn) {
        const y = impacts[impacts.length - 1].y;
        const channel = y < canvas.height / 2 ? "top" : "bottom";
        channelImpactCounts[channel]++;
      }
    };

    const drawInterferencePattern = () => {
      ctx.fillStyle = "#CFD8DC";
      ctx.fillRect(screenPosition + 2, 0, 48, canvas.height);

      if (isDetectorOn) {
        const totalImpacts = channelImpactCounts.top + channelImpactCounts.bottom;
        if (totalImpacts > 0) {
          const topHeight = (channelImpactCounts.top / totalImpacts) * canvas.height;
          const bottomHeight = canvas.height - topHeight;

          ctx.fillStyle = topSlitColor;
          ctx.fillRect(screenPosition + 2, 0, 48, topHeight);
          ctx.fillStyle = bottomSlitColor;
          ctx.fillRect(screenPosition + 2, topHeight, 48, bottomHeight);
        }
      } else {
        const maxCount = Math.max(
          ...impactCounts.map((count) => Math.abs(count))
        );

        for (let y = 0; y < canvas.height; y++) {
          const intensity = impactCounts[y] ? impactCounts[y] / maxCount : 0;
          const brightness = Math.pow(intensity, 2); // Square of amplitude gives intensity
          const color = `rgba(100, 181, 246, ${Math.abs(brightness)})`;
          ctx.fillStyle = color;
          ctx.fillRect(screenPosition + 2, y, 48, 1);
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBarrier();
      drawScreen();

      frameCount++;

      if (isEmitting && frameCount % emissionInterval === 0) {
        particles.push(new Particle());
      }

      particles.forEach((particle) => {
        particle.move();
        particle.draw();

        if (particle.x >= screenPosition) {
          impacts.push({
            y: particle.y,
            channel: particle.channel,
            intensity: 1,
          });
          const index = particles.indexOf(particle);
          particles.splice(index, 1);
          if (isDetectorOn) {
            updateInterferencePattern();
          }
        }
      });

      wavefronts.forEach((wavefront) => {
        wavefront.propagate();
        wavefront.draw();
      });

      if (impacts.length > 0 || wavefronts.length > 0) {
        drawInterferencePattern();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resetAnimation();
    };
  }, [isEmitting, isDetectorOn]);

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