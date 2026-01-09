import { useEffect } from "react";

export function usePageTitle(title: string, suffix: string = "BakerIQ") {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : suffix;
    document.title = fullTitle;
    
    return () => {
      document.title = suffix;
    };
  }, [title, suffix]);
}
