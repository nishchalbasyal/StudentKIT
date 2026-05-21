import { colors as brandColors } from "../theme/colors";
import { radius } from "../theme/radius";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { fontSize, typography } from "../theme/typography";

export const colors = {
  ...brandColors,
  action: brandColors.brightGreen,
  primarySoft: brandColors.softGreen,
  low: brandColors.primary,
  medium: brandColors.warning,
  high: brandColors.danger,
} as const;

export { fontSize, radius, shadows, spacing, typography };
