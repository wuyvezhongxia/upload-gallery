import { useSelector } from "react-redux";
import type { RootState } from "@/store";
export function useIsExpired() {
  const { qiniu } = useSelector((state: RootState) => state.config);
  const isExpired = qiniu.date <= Date.now();
  return isExpired;
}
