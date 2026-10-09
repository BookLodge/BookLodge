import { useState, useEffect } from 'react';

export const useCountdown = (targetTime, onExpire) => {
  const calculateRemaining = () => {
    if (!targetTime) return 0;
    const diff = targetTime - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemaining);

  useEffect(() => {
    if (!targetTime) return;

    setSecondsLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = secondsLeft <= 0;

  return { secondsLeft, formatted, isExpired };
};
