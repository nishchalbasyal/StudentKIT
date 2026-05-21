import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSize,
  radius,
  spacing,
  shadows,
} from "../../constants/colors";

export type TableRow = {
  columns: {
    label: string;
    value: string;
    tone?: "default" | "green" | "red" | "muted";
    width?: number | string; // flex or pixels
  }[];
  divider?: boolean;
};

type Props = {
  title?: string;
  headers?: string[];
  rows: TableRow[];
  columnWidths?: (number | string)[]; // [0.3, 0.35, 0.35] for flex ratios
};

export function GroupedTableCard({
  title,
  headers,
  rows,
  columnWidths,
}: Props) {
  const getColumnColor = (tone?: "default" | "green" | "red" | "muted") => {
    switch (tone) {
      case "green":
        return colors.primary;
      case "red":
        return colors.danger;
      case "muted":
        return colors.muted;
      default:
        return colors.text;
    }
  };

  const getColumnWidth = (index: number) => {
    if (columnWidths && columnWidths[index]) {
      return columnWidths[index];
    }
    return 1 / rows[0]?.columns.length;
  };

  return (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}

      {headers && (
        <View style={styles.headerRow}>
          {headers.map((header, index) => (
            <Text
              key={index}
              style={[
                styles.headerCell,
                {
                  flex:
                    typeof getColumnWidth(index) === "number"
                      ? (getColumnWidth(index) as number)
                      : undefined,
                  width:
                    typeof getColumnWidth(index) === "string"
                      ? (getColumnWidth(index) as string)
                      : undefined,
                },
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
      )}

      {headers && <View style={styles.headerDivider} />}

      <View style={styles.body}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex}>
            <View style={styles.row}>
              {row.columns.map((col, colIndex) => (
                <View
                  key={colIndex}
                  style={{
                    flex:
                      typeof getColumnWidth(colIndex) === "number"
                        ? (getColumnWidth(colIndex) as number)
                        : undefined,
                    width:
                      typeof getColumnWidth(colIndex) === "string"
                        ? (getColumnWidth(colIndex) as string)
                        : undefined,
                  }}
                >
                  <Text
                    style={[
                      styles.cell,
                      {
                        color: getColumnColor(col.tone),
                      },
                      colIndex === 0 && styles.firstCell,
                    ]}
                    numberOfLines={1}
                  >
                    {col.value}
                  </Text>
                </View>
              ))}
            </View>
            {row.divider && <View style={styles.rowDivider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerCell: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
    textAlign: "left",
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  body: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 40,
    paddingVertical: spacing.sm,
  },
  cell: {
    fontSize: fontSize.caption,
    fontWeight: "600",
    color: colors.text,
  },
  firstCell: {
    fontWeight: "700",
    fontSize: fontSize.body,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
