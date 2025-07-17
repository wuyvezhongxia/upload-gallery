import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { ConfigState } from "@yuanjing/shared";
export function useIsExpired() {
  const { qiniu } = useSelector((state: RootState) => (state.config as ConfigState));
  const isExpired = qiniu.date <= Date.now();
  return isExpired;
}
