import { useCallback } from "react";
import confetti from "canvas-confetti";

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  scalar?: number;
}

/**
 * Hook para disparar animações de confetti
 */
export function useConfetti() {
  /**
   * Explosão de fogo/laranja ao hypar
   */
  const fireExplosion = useCallback((element?: HTMLElement) => {
    const rect = element?.getBoundingClientRect();
    const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
    const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;

    // Cores de fogo: laranja, amarelo, vermelho
    const colors = ["#FF6B35", "#FF8C42", "#FFA500", "#FF4500", "#FFD700"];

    // Primeira explosão - partículas grandes
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors,
      scalar: 1.2,
      gravity: 1,
      drift: 0,
      ticks: 200,
      shapes: ["circle", "square"],
      startVelocity: 45,
    });

    // Segunda explosão - partículas menores (delay)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x, y },
        colors,
        scalar: 0.8,
        gravity: 0.8,
        drift: 0.5,
        ticks: 150,
        shapes: ["circle"],
        startVelocity: 35,
      });
    }, 100);

    // Terceira explosão - fogos laterais
    setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x, y },
        colors,
        scalar: 1,
        gravity: 1.2,
        startVelocity: 40,
      });

      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x, y },
        colors,
        scalar: 1,
        gravity: 1.2,
        startVelocity: 40,
      });
    }, 150);
  }, []);

  /**
   * Explosão personalizada
   */
  const customExplosion = useCallback(
    (options: ConfettiOptions = {}) => {
      const defaults = {
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#FF6B35", "#FF8C42", "#FFA500"],
        scalar: 1,
      };

      confetti({ ...defaults, ...options });
    },
    []
  );

  /**
   * Chuva de confetti do topo
   */
  const confettiRain = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ["#FF6B35", "#FF8C42", "#FFA500", "#FF4500", "#FFD700"];

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0 },
        colors,
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0 },
        colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  /**
   * Explosão de celebração (múltiplas direções)
   */
  const celebration = useCallback(() => {
    const count = 200;
    const colors = ["#FF6B35", "#FF8C42", "#FFA500", "#FF4500", "#FFD700"];

    const defaults = {
      origin: { y: 0.7 },
      colors,
    };

    confetti({
      ...defaults,
      particleCount: count,
      spread: 26,
      startVelocity: 55,
    });

    confetti({
      ...defaults,
      particleCount: count,
      spread: 60,
    });

    confetti({
      ...defaults,
      particleCount: count,
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    confetti({
      ...defaults,
      particleCount: count / 2,
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    confetti({
      ...defaults,
      particleCount: count / 4,
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  /**
   * Fogos de artifício
   */
  const fireworks = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ["#FF6B35", "#FF8C42", "#FFA500", "#FF4500", "#FFD700"];

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2,
        },
        colors,
      });
    }, 250);
  }, []);

  return {
    fireExplosion,
    customExplosion,
    confettiRain,
    celebration,
    fireworks,
  };
}

export default useConfetti;
