import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// react-native-web's Alert.alert() is a no-op stub - it never shows anything
// and never calls onPress. Fall back to window.alert/confirm on web so info
// messages and (crucially) destructive confirmations like "Pflanze löschen"
// actually work when the app runs in a browser.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const confirmButton = buttons.find(b => b.style !== 'cancel') ?? buttons[buttons.length - 1];
  const cancelButton = buttons.find(b => b.style === 'cancel');

  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
