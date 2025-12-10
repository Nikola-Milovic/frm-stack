import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 720);
    window.addEventListener("resize", () => {
      setIsMobile(window.innerWidth < 720);
    });
    return () => {
      window.removeEventListener("resize", () => {
        setIsMobile(window.innerWidth < 720);
      });
    };
  }, []);

  return isMobile;
};
