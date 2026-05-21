import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Text, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

type ScalableComponent = {
  defaultProps?: {
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
  };
};

(Text as unknown as ScalableComponent).defaultProps = {
  ...((Text as unknown as ScalableComponent).defaultProps ?? {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1
};

(TextInput as unknown as ScalableComponent).defaultProps = {
  ...((TextInput as unknown as ScalableComponent).defaultProps ?? {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  }
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
