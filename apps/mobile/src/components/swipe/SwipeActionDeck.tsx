import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";
import { getSwipeDirection } from "../../utils/swipeEngine";
import { SwipeCard } from "./SwipeCard";
import type { SwipeDeckCard, SwipeCardType } from "./swipeActions";

type Props = {
  cards: SwipeDeckCard[];
  onSwipeLeft: (cardType: SwipeCardType) => void;
  onSwipeRight: (cardType: SwipeCardType) => void;
  onSwipeUp: (card: SwipeDeckCard) => void;
  onSwipeDown: (card: SwipeDeckCard) => void;
};

export function SwipeActionDeck({
  cards,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown
}: Props) {
  const [index, setIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const current = cards[index] ?? cards[0];

  const rotate = pan.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ["-3deg", "0deg", "3deg"]
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false
        }),
        onPanResponderRelease: (_, gesture) => {
          const direction = getSwipeDirection({
            translationX: gesture.dx,
            translationY: gesture.dy
          });

          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false
          }).start();

          if (!current || !direction) return;

          if (direction === "left") {
            onSwipeLeft(current.id);
            return;
          }

          if (direction === "right") {
            onSwipeRight(current.id);
            return;
          }

          if (direction === "up") {
            onSwipeUp(current);
            return;
          }

          onSwipeDown(current);
        }
      }),
    [current, onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp, pan]
  );

  if (!current) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Swipe Action Deck</Text>
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIndex((value) => (value === 0 ? cards.length - 1 : value - 1))}
            style={styles.control}
          >
            <Text style={styles.controlText}>{"<"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIndex((value) => (value + 1) % cards.length)}
            style={styles.control}
          >
            <Text style={styles.controlText}>{">"}</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.animatedCard,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate }
            ]
          }
        ]}
      >
        <SwipeCard card={current} index={index} total={cards.length} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  controls: {
    flexDirection: "row",
    gap: spacing.sm
  },
  control: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  controlText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  animatedCard: {
    zIndex: 2
  }
});
