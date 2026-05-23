import { useEffect } from "react";

export interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  ttfb: number | null;
  pageLoadTime: number | null;
  domReady: number | null;
}

const metrics: PerformanceMetrics = {
  fcp: null,
  lcp: null,
  fid: null,
  ttfb: null,
  pageLoadTime: null,
  domReady: null,
};

// Start PerformanceObservers to gather standard Web Vitals
if (typeof window !== "undefined") {
  // 1. First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        metrics.fcp = entries[0].startTime;
        console.log(`[Perf Metrics] First Contentful Paint (FCP): ${metrics.fcp.toFixed(2)}ms`);
        fcpObserver.disconnect();
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });
  } catch (e) {
    console.warn("FCP observer not supported:", e);
  }

  // 2. Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = lastEntry.startTime;
        console.log(`[Perf Metrics] Largest Contentful Paint (LCP): ${metrics.lcp.toFixed(2)}ms`);
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) {
    console.warn("LCP observer not supported:", e);
  }

  // 3. First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const entry = entries[0] as any;
        metrics.fid = entry.processingStart - entry.startTime;
        console.log(`[Perf Metrics] First Input Delay (FID): ${metrics.fid.toFixed(2)}ms`);
        fidObserver.disconnect();
      }
    });
    fidObserver.observe({ type: "first-input", buffered: true });
  } catch (e) {
    console.warn("FID observer not supported:", e);
  }

  // 4. Navigation Timing metrics (TTFB, Page Load, DOM Ready)
  window.addEventListener("load", () => {
    setTimeout(() => {
      try {
        const navEntries = performance.getEntriesByType("navigation");
        if (navEntries.length > 0) {
          const nav = navEntries[0] as PerformanceNavigationTiming;
          metrics.ttfb = nav.responseStart - nav.requestStart;
          metrics.pageLoadTime = nav.loadEventEnd - nav.startTime;
          metrics.domReady = nav.domContentLoadedEventEnd - nav.startTime;

          console.log(`[Perf Metrics] Time To First Byte (TTFB): ${metrics.ttfb.toFixed(2)}ms`);
          console.log(`[Perf Metrics] DOMContentLoaded (DOM Ready): ${metrics.domReady.toFixed(2)}ms`);
          console.log(`[Perf Metrics] Full Page Load Time: ${metrics.pageLoadTime.toFixed(2)}ms`);
        }
      } catch (e) {
        console.warn("Navigation timing API not supported:", e);
      }
    }, 0);
  });
}

// Track custom API / task timings
export function startMeasure(name: string): () => void {
  if (typeof window === "undefined" || !performance) return () => {};
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  performance.mark(startMark);

  return () => {
    performance.mark(endMark);
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      if (measures.length > 0) {
        const lastMeasure = measures[measures.length - 1];
        console.log(`[Perf Metrics Measure] ${name} executed in ${lastMeasure.duration.toFixed(2)}ms`);
      }
    } catch (e) {}
    try {
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } catch (e) {}
  };
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return metrics;
}

export function usePerformanceLogger() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const logInterval = setInterval(() => {
      console.info("[Performance Report Dashboard]", {
        ...metrics,
        memory: (performance as any).memory
          ? {
              jsHeapSizeLimit: ((performance as any).memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + "MB",
              totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + "MB",
              usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + "MB",
            }
          : "unsupported",
      });
    }, 30000); // log every 30 seconds

    return () => clearInterval(logInterval);
  }, []);
}
