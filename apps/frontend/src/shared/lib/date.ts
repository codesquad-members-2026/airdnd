import { differenceInCalendarDays, parseISO } from 'date-fns';

export function getStayNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  return Math.max(differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)), 0);
}
