import { AppHeader } from "./AppHeader";

type Props = {
  title: string;
  avatarUri?: string;
  avatarText?: string;
  onAvatarPress?: () => void;
  onMagicPress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  showSettings?: boolean;
  aiConnected?: boolean;
};

export function AppTopBar({
  title,
  avatarUri,
  avatarText,
  onAvatarPress,
  onMagicPress,
  onSearchPress,
  onSettingsPress,
  showSettings = true,
  aiConnected = true,
}: Props) {
  return (
    <AppHeader
      title={title}
      avatarUri={avatarUri}
      avatarText={avatarText}
      onAvatarPress={onAvatarPress}
      onMagicPress={aiConnected ? onMagicPress : undefined}
      onSearchPress={onSearchPress}
      onSettingsPress={onSettingsPress}
      showSettings={showSettings}
    />
  );
}
