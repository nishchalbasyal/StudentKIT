import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? "4000";

function getConfiguredApiUrl() {
  const configured = Constants.expoConfig?.extra?.apiUrl;
  return typeof configured === "string" && configured.trim().length > 0
    ? configured.trim()
    : null;
}

function getExpoHost() {
  const expoConfigHost = Constants.expoConfig?.hostUri;
  const manifestHost =
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;
  const hostUri = expoConfigHost ?? manifestHost;

  return typeof hostUri === "string" ? hostUri.split(":")[0] ?? null : null;
}

function isLocalhost(host: string) {
  return host === "localhost" || host === "127.0.0.1";
}

function rewriteLocalhostForPhysicalAndroid(configuredUrl: string, expoHost: string | null) {
  if (Platform.OS !== "android" || !Constants.isDevice || !expoHost || isLocalhost(expoHost)) {
    return configuredUrl;
  }

  try {
    const url = new URL(configuredUrl);

    if (isLocalhost(url.hostname)) {
      const port = url.port ? `:${url.port}` : "";
      return `${url.protocol}//${expoHost}${port}${url.pathname}${url.search}`.replace(/\/$/, "");
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
}

function getDefaultApiBaseUrl() {
  const configuredApiUrl = getConfiguredApiUrl();
  const expoHost = getExpoHost();

  if (configuredApiUrl) {
    return rewriteLocalhostForPhysicalAndroid(configuredApiUrl, expoHost);
  }

  if (Platform.OS === "android") {
    if (expoHost && !isLocalhost(expoHost)) {
      return `http://${expoHost}:${API_PORT}/api`;
    }

    return Constants.isDevice
      ? `http://localhost:${API_PORT}/api`
      : `http://10.0.2.2:${API_PORT}/api`;
  }

  if (expoHost) {
    return `http://${expoHost}:${API_PORT}/api`;
  }

  return `http://localhost:${API_PORT}/api`;
}

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = envApiUrl
  ? rewriteLocalhostForPhysicalAndroid(envApiUrl, getExpoHost())
  : getDefaultApiBaseUrl();

export const REQUEST_TIMEOUT_MS = 12_000;
