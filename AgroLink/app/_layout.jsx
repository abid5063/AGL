import { Stack } from "expo-router";
import { LanguageProvider } from "../utils/LanguageContext";
import "../utils/i18n"; // Initialize i18n

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}