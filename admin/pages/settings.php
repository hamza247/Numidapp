<?php
$pageTitle = 'Settings';

$avgCoins = round((float)$db->query("SELECT COALESCE(AVG(coins), 0) FROM profiles")->fetchColumn(), 1);
$zeroCoins = (int)$db->query("SELECT COUNT(*) FROM profiles WHERE coins = 0")->fetchColumn();
$richest = $db->query("SELECT full_name, phone, coins FROM profiles ORDER BY coins DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$maintenanceMode = getSetting($db, 'maintenance_mode', '0');

ob_start();
?>
<div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5 mb-5">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-sm font-semibold text-white mb-1">Maintenance Mode</h2>
            <p class="text-xs text-gray-500">When enabled, the app shows a maintenance screen to all users. Admin panel remains accessible.</p>
        </div>
        <form method="POST" action="/admin/settings" class="flex items-center gap-3">
            <input type="hidden" name="action" value="toggle_maintenance">
            <input type="hidden" name="maintenance_mode" value="<?= $maintenanceMode === '1' ? '0' : '1' ?>">
            <?php if ($maintenanceMode === '1'): ?>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-orange-400/10 text-orange-400 border border-orange-400/20">ACTIVE</span>
                <button type="submit" class="px-4 py-2.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl text-sm font-medium transition-colors">Turn OFF</button>
            <?php else: ?>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">OFF</span>
                <button type="submit" class="px-4 py-2.5 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 rounded-xl text-sm font-medium transition-colors" onclick="return confirm('Enable maintenance mode? Users will not be able to use the app.')">Turn ON</button>
            <?php endif; ?>
        </form>
    </div>
</div>

<?php
$freeDailySearches  = getSetting($db, 'free_daily_searches', '5');
$searchCost         = getSetting($db, 'search_cost', '1');
$initialCoins       = getSetting($db, 'initial_coins', '5');
$removePhoneCost    = getSetting($db, 'remove_phone_cost', '3');
$revealCost         = getSetting($db, 'reveal_cost', '1');
$referralRewardCoins = getSetting($db, 'referral_reward_coins', '7');
?>
<div class="grid grid-cols-2 gap-4 mb-5">
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-4">App Configuration</h2>
        <form method="POST" action="/admin/settings" class="space-y-3">
            <input type="hidden" name="action" value="save_app_config">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Free Daily Searches</label>
                <input type="number" name="free_daily_searches" value="<?= htmlspecialchars($freeDailySearches) ?>" min="0" max="100"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Search Cost (coins)</label>
                <input type="number" name="search_cost" value="<?= htmlspecialchars($searchCost) ?>" min="0" max="100"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Reveal Cost (coins)</label>
                <input type="number" name="reveal_cost" value="<?= htmlspecialchars($revealCost) ?>" min="0" max="100"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Initial Coins (new users)</label>
                <input type="number" name="initial_coins" value="<?= htmlspecialchars($initialCoins) ?>" min="0" max="10000"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Remove Phone Cost (coins)</label>
                <input type="number" name="remove_phone_cost" value="<?= htmlspecialchars($removePhoneCost) ?>" min="0" max="100"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Referral Reward (coins per referred friend)</label>
                <input type="number" name="referral_reward_coins" value="<?= htmlspecialchars($referralRewardCoins) ?>" min="0" max="1000"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <button type="submit" class="w-full mt-1 bg-[#00C9D4]/10 text-[#00C9D4] hover:bg-[#00C9D4]/20 rounded-xl py-2.5 text-sm font-medium transition-colors">Save Configuration</button>
        </form>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-4">Coin Statistics</h2>
        <div class="space-y-3">
            <div class="flex items-center justify-between py-2.5 border-b border-white/5">
                <span class="text-sm text-gray-400">Average balance per user</span>
                <span class="text-sm font-semibold text-yellow-400"><?= $avgCoins ?> coins</span>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-white/5">
                <span class="text-sm text-gray-400">Users with 0 coins</span>
                <span class="text-sm font-semibold text-white"><?= $zeroCoins ?></span>
            </div>
            <?php if ($richest): ?>
                <div class="flex items-center justify-between py-2.5">
                    <span class="text-sm text-gray-400">Richest user</span>
                    <a href="/admin/users/<?= urlencode($richest['phone']) ?>" class="text-sm font-semibold text-[#00C9D4] hover:underline"><?= htmlspecialchars($richest['full_name']) ?> (<?= $richest['coins'] ?>)</a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<div class="grid grid-cols-3 gap-4">
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-1">Grant Coins to User</h2>
        <p class="text-xs text-gray-500 mb-4">Add coins to a specific user.</p>
        <form method="POST" action="/admin/settings" class="flex flex-col gap-3">
            <input type="hidden" name="action" value="grant_coins">
            <div><label class="block text-xs text-gray-500 mb-1.5">Phone Number</label>
                <input type="text" name="grant_phone" placeholder="e.g. 17734940397" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50"></div>
            <div><label class="block text-xs text-gray-500 mb-1.5">Amount</label>
                <input type="number" name="grant_amount" placeholder="e.g. 50" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50"></div>
            <button type="submit" class="bg-[#00C9D4]/10 text-[#00C9D4] hover:bg-[#00C9D4]/20 rounded-xl py-2.5 text-sm font-medium transition-colors mt-1">Grant Coins</button>
        </form>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-1">Reset All Coins</h2>
        <p class="text-xs text-gray-500 mb-4">Set every user's balance to a fixed amount.</p>
        <form method="POST" action="/admin/settings" class="flex flex-col gap-3" onsubmit="return confirm('Reset ALL users coin balances?')">
            <input type="hidden" name="action" value="reset_coins">
            <div><label class="block text-xs text-gray-500 mb-1.5">New Balance for Everyone</label>
                <input type="number" name="reset_amount" placeholder="e.g. 5" min="0" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50"></div>
            <button type="submit" class="bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 rounded-xl py-2.5 text-sm font-medium transition-colors mt-1">Reset All Balances</button>
        </form>
    </div>

    <div class="bg-[#0F1623] border border-red-500/10 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p class="text-xs text-gray-500 mb-4">Permanently delete all uploaded contacts.</p>
        <form method="POST" action="/admin/settings" class="flex flex-col gap-3" onsubmit="return confirm('Delete ALL contacts? This is irreversible.')">
            <input type="hidden" name="action" value="clear_contacts">
            <div><label class="block text-xs text-gray-500 mb-1.5">Type CONFIRM to proceed</label>
                <input type="text" name="confirm_clear" placeholder="CONFIRM" class="w-full bg-[#080C14] border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50"></div>
            <button type="submit" class="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl py-2.5 text-sm font-medium transition-colors mt-1">Clear All Contacts</button>
        </form>
    </div>
</div>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
