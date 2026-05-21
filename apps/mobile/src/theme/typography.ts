export const fontSize = {
  tab: 11,
  badge: 12,
  caption: 13,
  body: 14,
  bodyLarge: 15,
  rowTitle: 16,
  cardTitle: 16,
  section: 18,
  title: 22,
} as const;

export const typography = {
  title: {
    fontSize: fontSize.title,
    fontWeight: "800" as const,
    lineHeight: 28,
  },
  section: {
    fontSize: fontSize.section,
    fontWeight: "800" as const,
    lineHeight: 24,
  },
  rowTitle: {
    fontSize: fontSize.rowTitle,
    fontWeight: "700" as const,
    lineHeight: 21,
  },
  body: {
    fontSize: fontSize.body,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: fontSize.caption,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  button: {
    fontSize: fontSize.body,
    fontWeight: "700" as const,
    lineHeight: 20,
  },
} as const;
