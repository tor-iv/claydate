import { redirect } from "next/navigation";
import { currentMonthParam } from "@/lib/dates";

export default function CalendarRoot() {
  redirect(`/calendar/${currentMonthParam()}`);
}
