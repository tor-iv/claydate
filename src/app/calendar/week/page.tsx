import { redirect } from "next/navigation";
import { currentWeekParam } from "@/lib/dates";

export default function WeekIndexPage() {
  redirect(`/calendar/week/${currentWeekParam()}`);
}
