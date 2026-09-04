import React from "react";
import DayView from "@/components/recovery/DayView";
import { todayStr } from "@/lib/dates";

export default function Home() {
  return <DayView date={todayStr()} />;
}