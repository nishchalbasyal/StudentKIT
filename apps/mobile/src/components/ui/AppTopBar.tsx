import { AppHeader } from "./AppHeader";

type Props = {
  title: string;
  avatarUri?: string;
  avatarText?: string;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  showSettings?: boolean;
};

export function AppTopBar({
  title,
  avatarUri,
  avatarText,
  onAvatarPress,
  onSearchPress,
  onSettingsPress,
  showSettings = true,
}: Props) {
  return (
    <AppHeader
      title={title}
      avatarUri={avatarUri}
      avatarText={avatarText}
      onAvatarPress={onAvatarPress}
      onSearchPress={onSearchPress}
      onSettingsPress={onSettingsPress}
      showSettings={showSettings}
    />
  );
}
