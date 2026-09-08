import React from "react";
import { useParams } from "react-router-dom";
import DayView from "@/components/recovery/DayView";

export default function Day() {
  const { date } = useParams();
  // A day reached from History is opened to read, so its add grid starts shut.
  // Today's page is where logging happens and stays open.
  return <DayView date={date} startCollapsed />;
}