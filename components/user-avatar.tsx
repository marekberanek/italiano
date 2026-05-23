import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { ColorPalette } from "@/constants/theme";
import { Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useAuth } from "@/lib/auth/use-auth";

type Props = {
  size?: number;
  style?: ViewStyle;
  /** Where to navigate when the avatar is tapped. Defaults to /profile. */
  navigateTo?: "/profile" | null;
};

/**
 * Circular avatar of the signed-in user. Falls back to the user's initial
 * (from full name / email) when the OAuth provider didn't supply a picture.
 *
 * Returns `null` when nobody is signed in — callers should render the
 * default app logo in that case.
 */
export function UserAvatar({ size = 44, style, navigateTo = "/profile" }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [imageFailed, setImageFailed] = useState(false);

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const pictureUrl = useMemo<string | null>(() => {
    if (!user) return null;
    const fromMeta = (meta.avatar_url ?? meta.picture ?? meta.photo_url) as
      | string
      | undefined;
    return typeof fromMeta === "string" && fromMeta.length > 0 ? fromMeta : null;
  }, [user, meta]);

  const initial = useMemo<string>(() => {
    if (!user) return "?";
    const name =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      "";
    const source = name.trim() || user.email || "?";
    return source.charAt(0).toUpperCase();
  }, [user, meta]);

  if (!user) return null;

  const showImage = pictureUrl && !imageFailed;
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  const content = showImage ? (
    <Image
      source={{ uri: pictureUrl }}
      style={[styles.image, dimensions]}
      contentFit="cover"
      transition={120}
      onError={() => setImageFailed(true)}
      accessibilityLabel="Avatar uživatele"
    />
  ) : (
    <View style={[styles.fallback, dimensions]} accessibilityLabel="Avatar uživatele">
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>{initial}</Text>
    </View>
  );

  if (!navigateTo) {
    return <View style={style}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => router.push(navigateTo)}
      hitSlop={8}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel="Otevřít profil"
    >
      {content}
    </Pressable>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    image: {
      backgroundColor: p.surfaceMuted,
      borderWidth: 1,
      borderColor: p.border,
    },
    fallback: {
      backgroundColor: p.brandSoft,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: "center",
      justifyContent: "center",
    },
    initial: {
      fontFamily: Typography.title.fontFamily,
      color: p.brandDark,
      lineHeight: undefined,
      includeFontPadding: false,
    },
  });
}
