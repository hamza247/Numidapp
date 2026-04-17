// Web stub — react-native-google-mobile-ads is native-only.
// Metro resolves this file instead of the real package when bundling for web.

function noop() {}
function noopAsync() { return Promise.resolve(); }

const stub = {
  default: function MobileAds() {
    return { initialize: noopAsync };
  },
  BannerAd: function () { return null; },
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER",
    BANNER: "BANNER",
    FULL_BANNER: "FULL_BANNER",
    LARGE_BANNER: "LARGE_BANNER",
    LEADERBOARD: "LEADERBOARD",
    MEDIUM_RECTANGLE: "MEDIUM_RECTANGLE",
  },
  TestIds: {
    BANNER: "ca-app-pub-3940256099942544/6300978111",
    REWARDED: "ca-app-pub-3940256099942544/5224354917",
    INTERSTITIAL: "ca-app-pub-3940256099942544/1033173712",
  },
  RewardedAd: {
    createForAdRequest: function () {
      return {
        load: noop,
        show: noopAsync,
        addAdEventListener: function () { return noop; },
      };
    },
  },
  RewardedAdEventType: {
    LOADED: "loaded",
    EARNED_REWARD: "earned_reward",
    CLOSED: "closed",
    ERROR: "error",
  },
  InterstitialAd: {
    createForAdRequest: function () {
      return {
        load: noop,
        show: noopAsync,
        addAdEventListener: function () { return noop; },
      };
    },
  },
  AdEventType: {
    LOADED: "loaded",
    CLOSED: "closed",
    ERROR: "error",
  },
};

module.exports = stub;
module.exports.default = stub.default;
