<?php
$pageTitle = 'AdMob / Ads Configuration';

$adsEnabled = getSetting($db, 'ads_enabled', '0');
$adProvider = getSetting($db, 'ad_provider', 'admob');
$admobAppId = getSetting($db, 'admob_app_id', '');
$admobBannerAndroid = getSetting($db, 'admob_banner_android', '');
$admobBannerIos = getSetting($db, 'admob_banner_ios', '');
$admobInterstitialAndroid = getSetting($db, 'admob_interstitial_android', '');
$admobInterstitialIos = getSetting($db, 'admob_interstitial_ios', '');
$admobRewardedAndroid = getSetting($db, 'admob_rewarded_android', '');
$admobRewardedIos = getSetting($db, 'admob_rewarded_ios', '');
$customBannerUrl = getSetting($db, 'custom_banner_url', '');
$customBannerLink = getSetting($db, 'custom_banner_link', '');
$adFrequency = getSetting($db, 'ad_frequency', 'every_search');
$rewardedCoinAmount = getSetting($db, 'rewarded_coin_amount', '3');

ob_start();
?>
<form method="POST" action="/admin/admob">
    <input type="hidden" name="action" value="save_ads">

    <div class="grid grid-cols-2 gap-4 mb-5">
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-white">Ads Status</h2>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="ads_enabled" value="0">
                    <input type="checkbox" name="ads_enabled" value="1" class="sr-only peer" <?= $adsEnabled === '1' ? 'checked' : '' ?>>
                    <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9D4]"></div>
                    <span class="ml-3 text-sm text-gray-400"><?= $adsEnabled === '1' ? 'Enabled' : 'Disabled' ?></span>
                </label>
            </div>

            <div class="mb-4">
                <label class="block text-xs text-gray-500 mb-2">Ad Provider</label>
                <div class="flex gap-2">
                    <label class="flex-1 cursor-pointer">
                        <input type="radio" name="ad_provider" value="admob" class="sr-only peer" <?= $adProvider === 'admob' ? 'checked' : '' ?>>
                        <div class="text-center py-2.5 rounded-xl text-sm border transition-colors peer-checked:bg-[#00C9D4]/10 peer-checked:border-[#00C9D4]/30 peer-checked:text-[#00C9D4] border-white/10 text-gray-400">AdMob</div>
                    </label>
                    <label class="flex-1 cursor-pointer">
                        <input type="radio" name="ad_provider" value="custom_banner" class="sr-only peer" <?= $adProvider === 'custom_banner' ? 'checked' : '' ?>>
                        <div class="text-center py-2.5 rounded-xl text-sm border transition-colors peer-checked:bg-[#00C9D4]/10 peer-checked:border-[#00C9D4]/30 peer-checked:text-[#00C9D4] border-white/10 text-gray-400">Custom Banner</div>
                    </label>
                </div>
            </div>

            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Ad Display Frequency</label>
                <select name="ad_frequency" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
                    <option value="every_search" <?= $adFrequency === 'every_search' ? 'selected' : '' ?>>Every search</option>
                    <option value="every_2" <?= $adFrequency === 'every_2' ? 'selected' : '' ?>>Every 2 searches</option>
                    <option value="every_5" <?= $adFrequency === 'every_5' ? 'selected' : '' ?>>Every 5 searches</option>
                    <option value="once_per_session" <?= $adFrequency === 'once_per_session' ? 'selected' : '' ?>>Once per session</option>
                </select>
            </div>

            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Rewarded ad coins</label>
                <input type="number" name="rewarded_coin_amount" value="<?= htmlspecialchars($rewardedCoinAmount) ?>" placeholder="3" min="1"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
                <p class="mt-1 text-xs text-gray-600">Coins granted per rewarded video ad watched.</p>
            </div>
        </div>

        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">Custom Banner Ad</h2>
            <p class="text-xs text-gray-500 mb-4">When "Custom Banner" is selected, the app shows your own image banner instead of AdMob ads.</p>
            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Banner Image URL</label>
                <input type="url" name="custom_banner_url" value="<?= htmlspecialchars($customBannerUrl) ?>" placeholder="https://example.com/banner.png"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Click-through URL</label>
                <input type="url" name="custom_banner_link" value="<?= htmlspecialchars($customBannerLink) ?>" placeholder="https://example.com"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <?php if ($customBannerUrl): ?>
                <div class="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                    <p class="text-xs text-gray-500 mb-2">Preview:</p>
                    <img src="<?= htmlspecialchars($customBannerUrl) ?>" alt="Banner preview" class="max-h-20 rounded-lg" onerror="this.style.display='none'">
                </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-semibold text-white mb-4">AdMob Configuration</h2>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1.5">AdMob App ID</label>
            <input type="text" name="admob_app_id" value="<?= htmlspecialchars($admobAppId) ?>" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
                class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h3 class="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Android Ad Units</h3>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5">Banner Ad Unit</label>
                        <input type="text" name="admob_banner_android" value="<?= htmlspecialchars($admobBannerAndroid) ?>" placeholder="ca-app-pub-xxx/yyy"
                            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5">Interstitial Ad Unit</label>
                        <input type="text" name="admob_interstitial_android" value="<?= htmlspecialchars($admobInterstitialAndroid) ?>" placeholder="ca-app-pub-xxx/yyy"
                            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5">Rewarded Ad Unit</label>
                        <input type="text" name="admob_rewarded_android" value="<?= htmlspecialchars($admobRewardedAndroid) ?>" placeholder="ca-app-pub-xxx/yyy"
                            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                    </div>
                </div>
            </div>
            <div>
                <h3 class="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">iOS Ad Units</h3>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5">Banner Ad Unit</label>
                        <input type="text" name="admob_banner_ios" value="<?= htmlspecialchars($admobBannerIos) ?>" placeholder="ca-app-pub-xxx/yyy"
                            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5">Interstitial Ad Unit</label>
                        <input type="text" name="admob_interstitial_ios" value="<?= htmlspecialchars($admobInterstitialIos) ?>" placeholder="ca-app-pub-xxx/yyy"
                            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5">Rewarded Ad Unit</label>
                        <input type="text" name="admob_rewarded_ios" value="<?= htmlspecialchars($admobRewardedIos) ?>" placeholder="ca-app-pub-xxx/yyy"
                            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <button type="submit" class="px-6 py-3 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold rounded-xl transition-colors">Save Ad Settings</button>
</form>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
