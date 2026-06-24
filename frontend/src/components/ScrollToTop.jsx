import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const scrollToPageTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });
};

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToPageTop();

    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  useEffect(() => {
    scrollToPageTop();
    requestAnimationFrame(scrollToPageTop);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
