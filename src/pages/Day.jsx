import React from "react";
import { useParams } from "react-router-dom";
import DayView from "@/components/recovery/DayView";

export default function Day() {
  const { date } = useParams();
  return <DayView date={date} />;
}