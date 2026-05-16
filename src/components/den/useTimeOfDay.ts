import { useState, useEffect } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export function useTimeOfDay() {
  const [time, setTime] = useState<TimeOfDay>("morning");

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) setTime("morning");
      else if (hour >= 12 && hour < 18) setTime("afternoon");
      else if (hour >= 18 && hour < 22) setTime("evening");
      else setTime("night");
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return time;
}
