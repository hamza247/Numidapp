<?php
$pageTitle = 'Stripe Configuration';

$stripeEnabled        = getSetting($db, 'stripe_enabled', '0');
$stripeMode           = getSetting($db, 'stripe_mode', 'test');
$stripePkTest         = getSetting($db, 'stripe_pk_test', '');
$stripeSkTest         = getSetting($db, 'stripe_sk_test', '');
$stripePkLive         = getSetting($db, 'stripe_pk_live', '');
$stripeSkLive         = getSetting($db, 'stripe_sk_live', '');
$stripeWebhookSecret  = getSetting($db, 'stripe_webhook_secret', '');
$stripeCurrency       = getSetting($db, 'stripe_currency', 'usd');
$stripeCoinPrice      = getSetting($db, 'stripe_coin_price', '0.99');
$stripeCoinAmount     = getSetting($db, 'stripe_coin_amount', '10');
$stripeProductName    = getSetting($db, 'stripe_product_name', '{coins} Coins — Who Saved Me');
$stripeProductDesc    = getSetting($db, 'stripe_product_desc', 'Add {coins} coins to your Who Saved Me account instantly.');
$stripeProductImage   = getSetting($db, 'stripe_product_image', '');
$stripeCheckoutMsg    = getSetting($db, 'stripe_checkout_message', 'Coins are added to your account immediately after payment.');
$stripeLocale         = getSetting($db, 'stripe_locale', 'auto');
$stripeAllowPromo     = getSetting($db, 'stripe_allow_promo_codes', '0');
$stripeCollectBilling = getSetting($db, 'stripe_collect_billing', '0');

ob_start();
?>
<form method="POST" action="/admin/stripe">
    <input type="hidden" name="action" value="save_stripe">

    <div class="grid grid-cols-2 gap-4 mb-5">
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-white">Stripe Status</h2>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="stripe_enabled" value="0">
                    <input type="checkbox" name="stripe_enabled" value="1" class="sr-only peer" <?= $stripeEnabled === '1' ? 'checked' : '' ?>>
                    <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9D4]"></div>
                    <span class="ml-3 text-sm text-gray-400"><?= $stripeEnabled === '1' ? 'Enabled' : 'Disabled' ?></span>
                </label>
            </div>
            <div class="mb-4">
                <label class="block text-xs text-gray-500 mb-1.5">Mode</label>
                <div class="flex gap-2">
                    <label class="flex-1 cursor-pointer">
                        <input type="radio" name="stripe_mode" value="test" class="sr-only peer" <?= $stripeMode === 'test' ? 'checked' : '' ?>>
                        <div class="text-center py-2.5 rounded-xl text-sm border transition-colors peer-checked:bg-yellow-400/10 peer-checked:border-yellow-400/30 peer-checked:text-yellow-400 border-white/10 text-gray-400">Test</div>
                    </label>
                    <label class="flex-1 cursor-pointer">
                        <input type="radio" name="stripe_mode" value="live" class="sr-only peer" <?= $stripeMode === 'live' ? 'checked' : '' ?>>
                        <div class="text-center py-2.5 rounded-xl text-sm border transition-colors peer-checked:bg-green-400/10 peer-checked:border-green-400/30 peer-checked:text-green-400 border-white/10 text-gray-400">Live</div>
                    </label>
                </div>
            </div>
            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Currency</label>
                <select name="stripe_currency" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
                    <?php foreach (['usd' => 'USD ($)', 'eur' => 'EUR (€)', 'gbp' => 'GBP (£)', 'inr' => 'INR (₹)', 'aed' => 'AED (د.إ)'] as $code => $name): ?>
                        <option value="<?= $code ?>" <?= $stripeCurrency === $code ? 'selected' : '' ?>><?= $name ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">Coin Pricing</h2>
            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Price per coin pack</label>
                <input type="text" name="stripe_coin_price" value="<?= htmlspecialchars($stripeCoinPrice) ?>" placeholder="0.99"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Coins per purchase</label>
                <input type="number" name="stripe_coin_amount" value="<?= htmlspecialchars($stripeCoinAmount) ?>" placeholder="10"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div class="mt-4 p-3 rounded-xl bg-purple-400/5 border border-purple-400/10">
                <p class="text-xs text-purple-300">Users pay <strong><?= htmlspecialchars($stripeCoinPrice) ?> <?= strtoupper($stripeCurrency) ?></strong> for <strong><?= htmlspecialchars($stripeCoinAmount) ?> coins</strong></p>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-5">
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">Test Keys</h2>
            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Publishable Key (pk_test_...)</label>
                <input type="text" name="stripe_pk_test" value="<?= htmlspecialchars($stripePkTest) ?>" placeholder="pk_test_..."
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Secret Key (sk_test_...)</label>
                <input type="password" name="stripe_sk_test" value="<?= htmlspecialchars($stripeSkTest) ?>" placeholder="sk_test_..."
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
            </div>
        </div>

        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">Live Keys</h2>
            <div class="mb-3">
                <label class="block text-xs text-gray-500 mb-1.5">Publishable Key (pk_live_...)</label>
                <input type="text" name="stripe_pk_live" value="<?= htmlspecialchars($stripePkLive) ?>" placeholder="pk_live_..."
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Secret Key (sk_live_...)</label>
                <input type="password" name="stripe_sk_live" value="<?= htmlspecialchars($stripeSkLive) ?>" placeholder="sk_live_..."
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
            </div>
        </div>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-semibold text-white mb-3">Webhook Secret</h2>
        <input type="text" name="stripe_webhook_secret" value="<?= htmlspecialchars($stripeWebhookSecret) ?>" placeholder="whsec_..."
            class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
        <p class="mt-2 text-xs text-gray-600">Found in your Stripe Dashboard under Developers > Webhooks.</p>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-semibold text-white mb-1">Checkout Appearance</h2>
        <p class="text-xs text-gray-500 mb-4">Customize how your product appears on the Stripe-hosted checkout page. Use <code class="text-[#00C9D4]">{coins}</code> as a placeholder for the coin amount.</p>

        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Product Name</label>
                <input type="text" name="stripe_product_name" value="<?= htmlspecialchars($stripeProductName) ?>" placeholder="{coins} Coins — Who Saved Me"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
                <p class="mt-1 text-xs text-gray-600">Shown as the line item title on checkout.</p>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Product Description</label>
                <input type="text" name="stripe_product_desc" value="<?= htmlspecialchars($stripeProductDesc) ?>" placeholder="Add {coins} coins instantly."
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
                <p class="mt-1 text-xs text-gray-600">Shown below the product name.</p>
            </div>
        </div>

        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1.5">Product Image URL</label>
            <input type="url" name="stripe_product_image" value="<?= htmlspecialchars($stripeProductImage) ?>" placeholder="https://yourdomain.com/icon.png"
                class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
            <p class="mt-1 text-xs text-gray-600">Must be a publicly accessible HTTPS image URL (at least 300×300px). Shown next to the product on checkout.</p>
        </div>

        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1.5">Message Below Pay Button</label>
            <input type="text" name="stripe_checkout_message" value="<?= htmlspecialchars($stripeCheckoutMsg) ?>" placeholder="Coins are added to your account immediately after payment."
                class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            <p class="mt-1 text-xs text-gray-600">Short trust message shown underneath the Pay button. Max 500 characters.</p>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Checkout Language</label>
                <select name="stripe_locale" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
                    <?php foreach ([
                        'auto' => 'Auto (detect from browser)',
                        'en'   => 'English',
                        'ar'   => 'Arabic',
                        'fr'   => 'French',
                        'de'   => 'German',
                        'es'   => 'Spanish',
                        'it'   => 'Italian',
                        'pt'   => 'Portuguese',
                        'tr'   => 'Turkish',
                    ] as $code => $label): ?>
                        <option value="<?= $code ?>" <?= $stripeLocale === $code ? 'selected' : '' ?>><?= $label ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="flex flex-col justify-between">
                <label class="block text-xs text-gray-500 mb-1.5">Promotion / Coupon Codes</label>
                <label class="flex items-center gap-3 cursor-pointer py-2">
                    <input type="hidden" name="stripe_allow_promo_codes" value="0">
                    <input type="checkbox" name="stripe_allow_promo_codes" value="1" class="sr-only peer" <?= $stripeAllowPromo === '1' ? 'checked' : '' ?>>
                    <div class="relative w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9D4]"></div>
                    <span class="text-sm text-gray-400">Allow promo codes</span>
                </label>
            </div>
            <div class="flex flex-col justify-between">
                <label class="block text-xs text-gray-500 mb-1.5">Billing Address</label>
                <label class="flex items-center gap-3 cursor-pointer py-2">
                    <input type="hidden" name="stripe_collect_billing" value="0">
                    <input type="checkbox" name="stripe_collect_billing" value="1" class="sr-only peer" <?= $stripeCollectBilling === '1' ? 'checked' : '' ?>>
                    <div class="relative w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9D4]"></div>
                    <span class="text-sm text-gray-400">Require billing address</span>
                </label>
            </div>
        </div>

        <div class="p-3 rounded-xl bg-blue-400/5 border border-blue-400/10">
            <p class="text-xs text-blue-300">
                <strong>Brand colors &amp; logo</strong> are configured in your
                <a href="https://dashboard.stripe.com/settings/branding" target="_blank" class="underline text-[#00C9D4]">Stripe Dashboard → Settings → Branding</a>.
                Set your brand color, icon, and logo there — they apply automatically to all Stripe-hosted pages.
            </p>
        </div>
    </div>

    <button type="submit" class="px-6 py-3 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold rounded-xl transition-colors">Save Stripe Settings</button>
</form>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
