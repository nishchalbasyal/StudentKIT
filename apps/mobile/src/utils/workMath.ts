export function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function calculateWorkDuration(date: string, startTime: string, endTime: string, breakMinutes: number) {
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { hours: 0, minutes: 0, warning: "Choose a valid date and time." };
  }

  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const workedMinutes = totalMinutes - breakMinutes;

  if (workedMinutes < 0) {
    return { hours: 0, minutes: workedMinutes, warning: "Break time cannot be longer than the shift." };
  }

  if (workedMinutes > 16 * 60) {
    return {
      hours: workedMinutes / 60,
      minutes: workedMinutes,
      warning: "This shift is longer than 16 hours. Please check the time.",
    };
  }

  return { hours: workedMinutes / 60, minutes: workedMinutes, warning: null };
}
