import { ExpoConfig, ConfigContext } from "expo/config";

const ADMOB_ANDROID_APP_ID_TEST = "ca-app-pub-9253457742224170~9048378361";
const ADMOB_IOS_APP_ID_TEST = "ca-app-pub-9253457742224170~1705103219";

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidAppId =
    process.env.ADMOB_ANDROID_APP_ID || ADMOB_ANDROID_APP_ID_TEST;
  const iosAppId =
    process.env.ADMOB_IOS_APP_ID || ADMOB_IOS_APP_ID_TEST;

  return {
    ...config,
    name: "numidapp caller",
    slug: "numidapp-caller",
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-contacts",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId,
          iosAppId,
        },
      ],
    ],
  };
};
