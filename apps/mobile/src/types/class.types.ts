export type AttendanceType = "MANDATORY" | "OPTIONAL" | "FLEXIBLE";

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type ClassSchedule = {
  id: string;
  courseName: string;
  professorName?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  location?: string | null;
  attendanceType: AttendanceType;
  priority: Priority;
  reminderMinutesBefore?: number | null;
  notes?: string | null;
};

export type ClassInput = {
  courseName: string;
  professorName?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  location?: string;
  attendanceType: AttendanceType;
  priority: Priority;
  reminderMinutesBefore?: number;
  notes?: string;
};

