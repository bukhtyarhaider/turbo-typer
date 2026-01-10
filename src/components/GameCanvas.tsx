import React, { useRef, useEffect } from "react";
import { Obstacle, PowerUp, Difficulty, GameStatus } from "../types";

interface GameCanvasProps {
  speed: number; // 0 to 100
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  hasShield: boolean;
  onCollide: (id: number) => void;
  onPowerUpCollect: (id: number) => void;
  status: GameStatus;
  progress: number; // 0-100
  difficulty: Difficulty;
  opponent?: {
    name: string;
    progress: number;
    speed: number;
    hasShield: boolean;
  } | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  speed,
  obstacles,
  powerUps,
  hasShield,
  onCollide,
  onPowerUpCollect,
  status,
  progress,
  difficulty,
  opponent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const carYBounceRef = useRef<number>(0);
  const skyOffsetRef = useRef<number>(0);

  // Ref to track decay speed after finish
  const localSpeedRef = useRef<number>(0);
  // Ref to track extra distance traveled after finish line
  const finishCoastDistanceRef = useRef<number>(0);

  // Constants
  const CAR_WIDTH = 130;
  const CAR_HEIGHT = 50;

  // Sync local speed with prop speed while playing
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      localSpeedRef.current = speed;
    }
  }, [speed, status]);

  // Reset coast distance on new game
  useEffect(() => {
    if (status === GameStatus.IDLE) {
      finishCoastDistanceRef.current = 0;
      localSpeedRef.current = 0;
    }
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const width = rect.width;
      const height = rect.height;

      // Determine slope based on difficulty
      let slopeAngle = 0; // Radians
      if (difficulty === "MEDIUM") slopeAngle = -0.05; // Slight incline
      if (difficulty === "HARD") slopeAngle = -0.12; // Steep incline

      // Logic for speed logic
      let currentDrawSpeed = localSpeedRef.current;

      if (status === GameStatus.FINISHED) {
        // Coasting logic: Decay speed slowly
        currentDrawSpeed *= 0.98;
        if (currentDrawSpeed < 0.5) currentDrawSpeed = 0;
        localSpeedRef.current = currentDrawSpeed;

        // Accumulate coast distance (scaled for visual movement)
        const coastMove =
          currentDrawSpeed > 0 ? 2 + currentDrawSpeed * 0.15 : 0;
        finishCoastDistanceRef.current += coastMove;
      }

      const moveSpeed = currentDrawSpeed > 0 ? 2 + currentDrawSpeed * 0.15 : 0;

      offsetRef.current -= moveSpeed;
      skyOffsetRef.current -= moveSpeed * 0.2;

      if (currentDrawSpeed > 0) {
        carYBounceRef.current = Math.sin(Date.now() / 80) * 2;
      } else {
        carYBounceRef.current = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // --- WORLD TRANSFORM (Rotation for Incline) ---
      ctx.save();

      // Pivot point for rotation: Bottom Leftish
      ctx.translate(0, height);
      ctx.rotate(slopeAngle);
      ctx.translate(0, -height);

      // We need to draw the sky larger to cover the corners when rotated
      const groundY = height * 0.75;

      // --- SKY ---
      const skyGradient = ctx.createLinearGradient(0, -200, 0, height);
      skyGradient.addColorStop(0, "#4FC3F7"); // Sky Blue
      skyGradient.addColorStop(1, "#E1F5FE");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(-100, -200, width + 400, height + 400);

      drawClouds(ctx, width, height, skyOffsetRef.current);
      drawMountains(ctx, width, height, skyOffsetRef.current * 0.1);

      // --- GROUND ---
      ctx.fillStyle = "#5D4037"; // Dirt
      ctx.fillRect(-100, groundY, width + 400, height);

      ctx.fillStyle = "#455A64"; // Road
      ctx.fillRect(-100, groundY, width + 400, 100);

      // Road Stripes
      ctx.fillStyle = "#ECEFF1";
      const stripeWidth = 40;
      const gapWidth = 60;
      const totalPeriod = stripeWidth + gapWidth;
      const stripeOffset = offsetRef.current % totalPeriod;

      for (let x = stripeOffset - 200; x < width + 200; x += totalPeriod) {
        ctx.fillRect(x, groundY + 40, stripeWidth, 10);
      }

      const carX = 100;
      const carY = groundY - CAR_HEIGHT + 5 + carYBounceRef.current;

      // --- FINISH LINE ---
      // We start showing the finish line earlier (at 70%)
      // If FINISHED, we use the coast distance to slide the finish line to the left

      let finishLineX = -9999;

      if (progress > 60 || status === GameStatus.FINISHED) {
        const pixelsPerPercent = 40;
        // Calculate where it should be based on progress (capped at 100)
        const cappedProgress = Math.min(100, progress);
        const distanceRemaining = (100 - cappedProgress) * pixelsPerPercent;

        // Base position when progress is 100 is "at the car nose"
        // We add a little buffer so the car nose is just touching it at 100
        // Then we subtract coast distance

        const baseFinishX = carX + CAR_WIDTH + 50;
        finishLineX =
          baseFinishX + distanceRemaining - finishCoastDistanceRef.current;

        // Only draw if visible on screen
        if (finishLineX > -200 && finishLineX < width + 200) {
          const carNoseX = carX + CAR_WIDTH;
          // Check if crossed for ribbon logic
          // Crossed if carNoseX > finishLineX + 20 (roughly post width)
          const crossed = carNoseX > finishLineX + 20;

          drawFinishLine(ctx, finishLineX, groundY, crossed);
        }
      }

      // --- OBJECTS ---
      // Don't draw objects if they are behind the finish line and we are finished?
      // For simplicity, just render them. They move with offsetRef which continues to update.
      powerUps.forEach((pu) => {
        if (!pu.collected) {
          drawPowerUp(ctx, pu.x, groundY, pu.type);
          if (
            status === GameStatus.PLAYING &&
            pu.x < carX + CAR_WIDTH - 20 &&
            pu.x + 30 > carX + 20
          ) {
            onPowerUpCollect(pu.id);
          }
        }
      });

      obstacles.forEach((obs) => {
        drawObstacle(ctx, obs.x, groundY, obs.type);
        if (
          !obs.hit &&
          status === GameStatus.PLAYING &&
          obs.x < carX + CAR_WIDTH - 20 &&
          obs.x + 40 > carX + 20
        ) {
          onCollide(obs.id);
        }
      });

      // --- CAR ---
      drawCar(ctx, carX, carY, currentDrawSpeed, "YOU");

      if (hasShield) {
        drawShieldAura(ctx, carX, carY);
      }

      // --- OPPONENT ---
      if (opponent) {
        const oppX = carX;
        // Move opponent relative to our progress
        // If they have same progress, they are at same X.
        // If they have MORE progress, they are AHEAD.
        const progressDiff = opponent.progress - progress;
        const oppDrawX = carX + progressDiff * 20; // Scale factor for visual gap
        const oppY = carY - 40; // OFFSET vertically or just same?
        // Let's draw them slightly "behind" in 2.5D space or just above.
        // Actually, let's draw them on a "different lane" which is just slightly higher groundY
        const oppGroundY = groundY - 20;
        const oppCarY =
          oppGroundY -
          CAR_HEIGHT +
          5 +
          (opponent.speed > 0 ? Math.sin(Date.now() / 90) * 2 : 0);

        ctx.save();
        ctx.globalAlpha = 0.7; // Ghostly or just faded
        drawCar(ctx, oppDrawX, oppCarY, opponent.speed, opponent.name);
        if (opponent.hasShield) {
          drawShieldAura(ctx, oppDrawX, oppCarY);
        }
        ctx.restore();
      }

      // --- SPEED LINES ---
      if (currentDrawSpeed > 50) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const ly = groundY - 10 - i * 15;
          const dashOffset = (offsetRef.current * 2 + i * 50) % width;
          ctx.beginPath();
          ctx.moveTo(width - (dashOffset % 300), ly);
          ctx.lineTo(
            width - (dashOffset % 300) - 50 + currentDrawSpeed / 2,
            ly
          );
          ctx.stroke();
        }
      }

      ctx.restore(); // Undo rotation

      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [
    speed,
    obstacles,
    powerUps,
    hasShield,
    onCollide,
    onPowerUpCollect,
    status,
    progress,
    difficulty,
    opponent,
  ]);

  // --- DRAWING HELPERS ---

  const drawCar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    currentSpeed: number,
    label?: string
  ) => {
    // Label
    if (label) {
      ctx.fillStyle = label === "YOU" ? "#FFEB3B" : "#FFF";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x + CAR_WIDTH / 2, y - 10);
    }
    // Drop Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(x + 65, y + 55, 60, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spoiler
    ctx.fillStyle = "#D32F2F";
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 10);
    ctx.lineTo(x + 15, y - 5);
    ctx.lineTo(x + 25, y + 10);
    ctx.fill();
    ctx.fillRect(x + 5, y - 5, 20, 5); // Wing

    // Main Body
    ctx.fillStyle = "#F44336";
    ctx.strokeStyle = "#B71C1C";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 40); // Rear bottom
    ctx.lineTo(x + 10, y + 20); // Rear top
    ctx.lineTo(x + 40, y + 20); // Rear deck
    ctx.lineTo(x + 60, y + 5); // Roof rear
    ctx.lineTo(x + 90, y + 5); // Roof front
    ctx.lineTo(x + 120, y + 25); // Hood
    ctx.lineTo(x + 130, y + 35); // Nose
    ctx.lineTo(x + 125, y + 45); // Front bumper
    ctx.lineTo(x + 10, y + 45); // Bottom
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = "#29B6F6";
    ctx.beginPath();
    ctx.moveTo(x + 62, y + 7);
    ctx.lineTo(x + 88, y + 7);
    ctx.lineTo(x + 115, y + 22);
    ctx.lineTo(x + 42, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.moveTo(x + 70, y + 7);
    ctx.lineTo(x + 80, y + 7);
    ctx.lineTo(x + 75, y + 20);
    ctx.closePath();
    ctx.fill();

    // Driver
    ctx.fillStyle = "#FFEB3B";
    ctx.beginPath();
    ctx.arc(x + 75, y + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Wheels
    const drawWheel = (wx: number, wy: number) => {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(Date.now() / (1000 / (currentSpeed + 20)));

      // Tire
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Rim
      ctx.fillStyle = "#FFC107";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Spokes
      ctx.strokeStyle = "#212121";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.stroke();

      ctx.restore();
    };

    drawWheel(x + 35, y + 45);
    drawWheel(x + 105, y + 45);

    // Exhaust
    if (currentSpeed > 20) {
      const time = Date.now();
      const puffX = x - 5 - (time % 40);
      const puffY = y + 40 + Math.sin(time / 50) * 2;
      const alpha = 1 - (time % 40) / 40;
      ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`;
      ctx.beginPath();
      ctx.arc(puffX, puffY, 5 + (time % 40) / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fire
    if (currentSpeed > 80) {
      ctx.fillStyle = "#FF5722";
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 38);
      ctx.lineTo(x - 20 - Math.random() * 20, y + 40);
      ctx.lineTo(x + 5, y + 42);
      ctx.fill();
    }
  };

  const drawFinishLine = (
    ctx: CanvasRenderingContext2D,
    x: number,
    groundY: number,
    crossed: boolean
  ) => {
    const postHeight = 160;

    // Left Post (Back)
    ctx.fillStyle = "#3E2723";
    ctx.fillRect(x + 10, groundY - postHeight, 15, postHeight);

    // Banner Arch
    ctx.fillStyle = "#D32F2F"; // Red Banner
    ctx.fillRect(x + 10, groundY - postHeight, 200, 40); // Top bar

    // Chequered Banner Text Area
    ctx.fillStyle = "#FFF";
    ctx.fillRect(x + 20, groundY - postHeight + 5, 180, 30);

    // "FINISH" Text
    ctx.fillStyle = "#000";
    ctx.font = "bold 20px monospace";
    ctx.fillText("FINISH", x + 75, groundY - postHeight + 27);

    // Ribbon Logic
    if (!crossed) {
      ctx.fillStyle = "#FF1744";
      ctx.fillRect(x + 10, groundY - 60, 200, 10); // Red tape
    } else {
      // Broken Ribbon Particles
      ctx.fillStyle = "#FF1744";
      // Simulate falling/flying particles roughly
      const t = Date.now() / 100;
      ctx.fillRect(x - 20 - (t % 50), groundY - 50 + (t % 50), 40, 10);
      ctx.fillRect(x + 200 + (t % 50), groundY - 70 + (t % 30), 40, 10);
    }

    // Left Post
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x, groundY - postHeight, 20, postHeight);

    // Right Post
    ctx.fillRect(x + 200, groundY - postHeight, 20, postHeight);

    // Checkered Floor Line
    const checkSize = 20;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#000" : "#FFF";
        ctx.fillRect(x + c * checkSize, groundY + r * 15 + 20, checkSize, 15);
      }
    }
  };

  const drawShieldAura = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    const time = Date.now();
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(time / 200) * 0.1;
    ctx.fillStyle = "#00E5FF";
    ctx.strokeStyle = "#84FFFF";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.ellipse(x + 65, y + 25, 85, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const drawPowerUp = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: "nitro" | "shield"
  ) => {
    const bobY = Math.sin(Date.now() / 200) * 10;
    const py = y - 20 + bobY;
    ctx.save();
    ctx.shadowBlur = 10;

    if (type === "nitro") {
      ctx.shadowColor = "#FFD700";
      ctx.fillStyle = "#FFC107";
      ctx.beginPath();
      ctx.arc(x + 15, py, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#D50000"; // Red bolt
      ctx.beginPath();
      ctx.moveTo(x + 20, py - 10);
      ctx.lineTo(x + 10, py + 10);
      ctx.lineTo(x + 25, py);
      ctx.fill();
    } else if (type === "shield") {
      ctx.shadowColor = "#00E5FF";
      ctx.fillStyle = "#00B0FF";
      ctx.beginPath();
      ctx.moveTo(x, py - 10);
      ctx.quadraticCurveTo(x + 15, py - 15, x + 30, py - 10);
      ctx.lineTo(x + 30, py + 5);
      ctx.bezierCurveTo(x + 30, py + 25, x + 15, py + 30, x + 15, py + 30);
      ctx.bezierCurveTo(x + 15, py + 30, x, py + 25, x, py + 5);
      ctx.fill();
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawObstacle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string
  ) => {
    if (type === "rock") {
      ctx.fillStyle = "#6D4C41";
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x + 15, y - 15);
      ctx.lineTo(x + 35, y + 10);
      ctx.fill();
      // Detail
      ctx.fillStyle = "#8D6E63";
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 10);
      ctx.lineTo(x + 15, y - 15);
      ctx.lineTo(x + 20, y + 10);
      ctx.fill();
    } else {
      ctx.fillStyle = "#FF6D00"; // Orange
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x + 15, y - 35); // Taller cone
      ctx.lineTo(x + 30, y + 10);
      ctx.fill();
      // White stripes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(x + 8, y - 15, 14, 5);
      ctx.fillRect(x + 5, y - 5, 20, 5);
      // Base
      ctx.fillStyle = "#E65100";
      ctx.fillRect(x - 2, y + 10, 34, 4);
    }
  };

  const drawClouds = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offset: number
  ) => {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const cloudPos = [
      { x: 50, y: 50, s: 1 },
      { x: 300, y: 80, s: 0.8 },
      { x: 600, y: 40, s: 1.2 },
      { x: 900, y: 70, s: 0.9 },
    ];
    cloudPos.forEach((cloud) => {
      let drawX = (cloud.x + offset) % (width + 300);
      if (drawX < -200) drawX += width + 300;
      const cy = cloud.y;
      ctx.beginPath();
      ctx.arc(drawX, cy, 30 * cloud.s, 0, Math.PI * 2);
      ctx.arc(
        drawX + 40 * cloud.s,
        cy - 10 * cloud.s,
        40 * cloud.s,
        0,
        Math.PI * 2
      );
      ctx.arc(drawX + 80 * cloud.s, cy, 30 * cloud.s, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawMountains = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offset: number
  ) => {
    ctx.fillStyle = "#90A4AE"; // Grey-blue distant mountains
    const mountainWidth = 300;
    const count = Math.ceil(width / mountainWidth) + 2;

    for (let i = 0; i < count; i++) {
      const mx = (i * mountainWidth + offset) % ((count - 1) * mountainWidth);
      const drawX = (i * mountainWidth + offset) % (width + mountainWidth);
      const finalX =
        drawX < -mountainWidth ? drawX + width + mountainWidth : drawX;

      ctx.beginPath();
      ctx.moveTo(finalX, height);
      ctx.lineTo(finalX + 150, height - 150);
      ctx.lineTo(finalX + 300, height);
      ctx.fill();

      // Snow cap
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.moveTo(finalX + 110, height - 110);
      ctx.lineTo(finalX + 150, height - 150);
      ctx.lineTo(finalX + 190, height - 110);
      ctx.lineTo(finalX + 170, height - 120);
      ctx.lineTo(finalX + 150, height - 110);
      ctx.lineTo(finalX + 130, height - 120);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#90A4AE"; // Reset
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-sky-300 relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-4 right-4 bg-white border-4 border-black p-2 rounded-xl transform rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
        <span className="text-2xl text-black font-mono">
          {Math.round(localSpeedRef.current)} MPH
        </span>
      </div>
    </div>
  );
};

export default GameCanvas;
