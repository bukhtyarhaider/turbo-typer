import { useState, useRef, useEffect, useCallback } from "react";
import { GameStatus, Obstacle, PowerUp } from "../types";
import { soundService } from "../services/soundService";

interface UseGameEngineProps {
  status: GameStatus;
  onCrash: () => void;
}

export const useGameEngine = ({ status, onCrash }: UseGameEngineProps) => {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0);

  const obstacleIdCounter = useRef<number>(0);
  const powerUpIdCounter = useRef<number>(0);

  const resetGameEngine = useCallback(() => {
    setObstacles([]);
    setPowerUps([]);
    setHasShield(false);
    setSpeed(0);
  }, []);

  const spawnObstacle = useCallback(() => {
    const id = obstacleIdCounter.current++;
    const newObstacle: Obstacle = {
      id,
      x: 1200,
      type: Math.random() > 0.5 ? "rock" : "cone",
      hit: false,
    };
    setObstacles((prev) => [...prev, newObstacle]);
  }, []);

  const spawnPowerUp = useCallback(() => {
    const id = powerUpIdCounter.current++;
    const newPowerUp: PowerUp = {
      id,
      x: 1200 + Math.random() * 200,
      type: Math.random() > 0.6 ? "shield" : "nitro",
      collected: false,
    };
    setPowerUps((prev) => [...prev, newPowerUp]);
  }, []);

  const handleCollision = useCallback(
    (id: number) => {
      let shielded = false;
      setHasShield((current) => {
        if (current) {
          shielded = true;
          return false;
        }
        return current;
      });

      setObstacles((prev) =>
        prev.map((obs) => {
          if (obs.id === id && !obs.hit) {
            if (shielded) {
              soundService.playShieldDeflect();
            } else {
              soundService.playBump();
              setSpeed((s) => Math.max(0, s - 30));
              onCrash();
            }
            return { ...obs, hit: true };
          }
          return obs;
        })
      );
    },
    [onCrash]
  );

  const handlePowerUpCollect = useCallback((id: number) => {
    setPowerUps((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target && !target.collected) {
        soundService.playPowerUp();
        if (target.type === "nitro") {
          setSpeed((s) => s + 50);
        } else if (target.type === "shield") {
          setHasShield(true);
        }
        return prev.map((p) => (p.id === id ? { ...p, collected: true } : p));
      }
      return prev;
    });
  }, []);

  // Filter out off-screen entities and move them
  const updateEntities = useCallback(() => {
    const moveAmount = 2 + speed * 0.15;

    setObstacles((prev) =>
      prev
        .map((obs) => ({ ...obs, x: obs.x - moveAmount }))
        .filter((obs) => obs.x > -100)
    );

    setPowerUps((prev) =>
      prev
        .map((p) => ({ ...p, x: p.x - moveAmount }))
        .filter((p) => p.x > -100 && !p.collected)
    );
  }, [speed]);

  const updateSpeed = useCallback((targetSpeed: number) => {
    setSpeed((prevSpeed) => {
      if (prevSpeed > targetSpeed + 40) {
        return prevSpeed * 0.92;
      }
      const diff = targetSpeed - prevSpeed;
      return prevSpeed + diff * 0.15;
    });
  }, []);

  // Note: updateEntities depends on speed, so this runs on speed change which might be too often or not enough if using rAF.

  return {
    obstacles,
    powerUps,
    hasShield,
    speed,
    resetGameEngine,
    spawnObstacle,
    handleCollision,
    handlePowerUpCollect,
    updateSpeed,
    updateEntities,
    spawnPowerUp,
  };
};
