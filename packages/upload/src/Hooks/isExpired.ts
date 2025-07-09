import { UseSelector } from "react-redux";

export function useIsExpired() {
  const { qiniu } = UseSelector((state: RootOptions) => state.config);
  const isExpired = qiniu.date <= Date.now();
  return isExpired;
}
