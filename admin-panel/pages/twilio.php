<?php
$pageTitle = 'Twilio Configuration';

$twilioEnabled     = getSetting($db, 'twilio_enabled', '0');
$twilioAccountSid  = getSetting($db, 'twilio_account_sid', '');
$twilioAuthToken   = getSetting($db, 'twilio_auth_token', '');
$twilioPhoneNumber = getSetting($db, 'twilio_phone_number', '');
$twilioOtpExpiry   = getSetting($db, 'twilio_otp_expiry', '10');

ob_start();
?>
<form method="POST" action="/admin/twilio">
    <input type="hidden" name="action" value="save_twilio">

    <div class="grid grid-cols-2 gap-4 mb-5">
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-white">Twilio Status</h2>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="twilio_enabled" value="0">
                    <input type="checkbox" name="twilio_enabled" value="1" class="sr-only peer" <?= $twilioEnabled === '1' ? 'checked' : '' ?>>
                    <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9D4]"></div>
                    <span class="ml-3 text-sm text-gray-400"><?= $twilioEnabled === '1' ? 'Enabled' : 'Disabled' ?></span>
                </label>
            </div>
            <div class="p-3 rounded-xl bg-[#00C9D4]/5 border border-[#00C9D4]/10 text-xs text-gray-400 leading-relaxed">
                When <strong class="text-white">enabled</strong>, OTP codes are sent via SMS using your Twilio account.<br>
                When <strong class="text-white">disabled</strong>, the hardcoded test OTP <code class="text-[#00C9D4]">112233</code> is used.
            </div>
        </div>

        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">OTP Settings</h2>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">OTP Expiry (minutes)</label>
                <input type="number" name="twilio_otp_expiry" value="<?= htmlspecialchars($twilioOtpExpiry) ?>" min="1" max="60" placeholder="10"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
                <p class="mt-1.5 text-xs text-gray-600">How long an OTP code remains valid after being sent.</p>
            </div>
        </div>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-semibold text-white mb-4">Account Credentials</h2>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Account SID</label>
                <input type="text" name="twilio_account_sid" value="<?= htmlspecialchars($twilioAccountSid) ?>" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                <p class="mt-1.5 text-xs text-gray-600">Found on your Twilio Console dashboard.</p>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Auth Token</label>
                <input type="password" name="twilio_auth_token" value="<?= htmlspecialchars($twilioAuthToken) ?>" placeholder="••••••••••••••••••••••••••••••••"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono text-xs">
                <p class="mt-1.5 text-xs text-gray-600">Keep this secret — never share publicly.</p>
            </div>
        </div>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-semibold text-white mb-4">Sender Phone Number</h2>
        <div class="max-w-sm">
            <label class="block text-xs text-gray-500 mb-1.5">From Number</label>
            <input type="text" name="twilio_phone_number" value="<?= htmlspecialchars($twilioPhoneNumber) ?>" placeholder="+1234567890"
                class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 font-mono">
            <p class="mt-1.5 text-xs text-gray-600">Must be a Twilio-purchased number in E.164 format (e.g. +12015551234).</p>
        </div>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-semibold text-white mb-3">How to Set Up</h2>
        <ol class="space-y-2 text-xs text-gray-400 list-decimal list-inside leading-relaxed">
            <li>Go to <a href="https://www.twilio.com/console" target="_blank" class="text-[#00C9D4] hover:underline">twilio.com/console</a> and sign in or create an account.</li>
            <li>Copy your <strong class="text-white">Account SID</strong> and <strong class="text-white">Auth Token</strong> from the dashboard into the fields above.</li>
            <li>Buy a phone number (Phone Numbers → Manage → Buy a Number) and paste it in <strong class="text-white">From Number</strong>.</li>
            <li>Toggle <strong class="text-white">Twilio Status</strong> to Enabled, then click <strong class="text-white">Save Twilio Settings</strong>.</li>
            <li>Test by registering a new user — a real SMS OTP will be sent to the phone.</li>
        </ol>
    </div>

    <?php if ($twilioEnabled === '1' && $twilioAccountSid && $twilioPhoneNumber): ?>
    <div class="mb-5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
        <svg class="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm text-green-400">Twilio is <strong>active</strong> — real SMS OTPs will be sent from <?= htmlspecialchars($twilioPhoneNumber) ?>.</p>
    </div>
    <?php elseif ($twilioEnabled !== '1'): ?>
    <div class="mb-5 p-3.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center gap-3">
        <svg class="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <p class="text-sm text-yellow-400">Twilio is <strong>disabled</strong> — the test OTP <code class="font-mono">112233</code> is active for all users.</p>
    </div>
    <?php endif; ?>

    <button type="submit" class="px-6 py-3 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold rounded-xl transition-colors">Save Twilio Settings</button>
</form>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
