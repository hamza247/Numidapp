import React from "react";
import { Image, StyleSheet } from "react-native";

interface FlagImageProps {
  code: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 20, height: 15 },
  md: { width: 24, height: 18 },
  lg: { width: 32, height: 24 },
};

export default function FlagImage({ code, size = "md" }: FlagImageProps) {
  const dim = SIZES[size];
  const uri = `https://flagcdn.com/${dim.width}x${dim.height}/${code.toLowerCase()}.png`;
  return (
    <Image
      source={{ uri }}
      style={[styles.base, { width: dim.width, height: dim.height }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 2,
  },
});
