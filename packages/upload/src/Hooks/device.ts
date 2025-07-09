import { useState, useEffect, useMemo } from "react";

type DeviceType = "mobile" | "tablet" | "desktop";

interface UseDeviceDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  userAgent: string;
  windowWidth: number | null;
}

interface DeviceDetectionOptions {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  debounceDelay?: number;
}

const useDeviceDetection = (
  options: DeviceDetectionOptions = {}
): UseDeviceDetection => {
  const {
    mobileBreakpoint = 768,
    tabletBreakpoint = 1024,
    debounceDelay = 200,
  } = options;

  const [deviceInfo, setDeviceInfo] = useState<UseDeviceDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: "desktop",
    userAgent: "",
    windowWidth: null,
  });

  // 初始化检测逻辑
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateDeviceInfo = () => {
      console.log("nnnnnnnnnn", navigator.userAgent);
      // 获取并处理浏览器用户代理字符串
      const userAgent = navigator.userAgent.toLowerCase();
      const windowWidth = window.innerWidth;

      // 设备类型检测
      const isMobile =
        /iphone|ipod|android|blackberry|windows phone/g.test(userAgent) ||
        windowWidth <= mobileBreakpoint;

      const isTablet =
        /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent) ||
        (windowWidth > mobileBreakpoint && windowWidth <= tabletBreakpoint);

      let deviceType: DeviceType = "desktop";
      if (isMobile) deviceType = "mobile";
      else if (isTablet) deviceType = "tablet";

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        deviceType,
        userAgent,
        windowWidth,
      });
    };

    // 初始检测
    updateDeviceInfo();

    // 窗口大小变化监听（带防抖）
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDeviceInfo, debounceDelay);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileBreakpoint, tabletBreakpoint, debounceDelay]);

  // 使用 useMemo 缓存结果
  return useMemo(() => deviceInfo, [deviceInfo]);
};

export default useDeviceDetection;
