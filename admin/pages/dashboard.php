<?php
$pageTitle = 'Overview';

$totalUsers = $db->query("SELECT COUNT(*) FROM profiles")->fetchColumn();
$totalContacts = $db->query("SELECT COUNT(*) FROM contacts")->fetchColumn();
$removedNumbers = $db->query("SELECT COUNT(*) FROM removed_numbers")->fetchColumn();
$totalCoins = $db->query("SELECT COALESCE(SUM(coins), 0) FROM profiles")->fetchColumn();

$recentUsers = $db->query("SELECT full_name, phone, country_code, coins, created_at FROM profiles ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$topUploaders = $db->query("SELECT uploader_phone, COUNT(*) as contact_count FROM contacts GROUP BY uploader_phone ORDER BY contact_count DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

ob_start();
?>
<div class="grid grid-cols-4 gap-4 mb-6">
    <?php
    $cards = [
        ['Total Users', number_format($totalUsers), '#00C9D4', 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
        ['Total Contacts', number_format($totalContacts), '#a78bfa', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
        ['Removed Numbers', number_format($removedNumbers), '#fb923c', 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'],
        ['Coins in Circulation', number_format($totalCoins), '#FFD700', 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
    ];
    foreach ($cards as [$label, $value, $color, $icon]):
    ?>
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
                <span class="text-xs text-gray-500 uppercase tracking-wider"><?= $label ?></span>
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:<?= $color ?>18">
                    <svg class="w-4 h-4" style="color:<?= $color ?>" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="<?= $icon ?>"/>
                    </svg>
                </div>
            </div>
            <div class="text-2xl font-bold text-white"><?= $value ?></div>
        </div>
    <?php endforeach; ?>
</div>

<div class="grid grid-cols-2 gap-4">
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-white">Recent Users</h2>
            <a href="/admin/users" class="text-xs text-[#00C9D4] hover:underline">View all</a>
        </div>
        <div class="space-y-3">
            <?php if (empty($recentUsers)): ?>
                <p class="text-sm text-gray-500">No users yet.</p>
            <?php else: foreach ($recentUsers as $u): ?>
                <a href="/admin/users/<?= urlencode($u['phone']) ?>" class="flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-full bg-[#00C9D4]/10 flex items-center justify-center text-sm font-semibold text-[#00C9D4]"><?= strtoupper(substr($u['full_name'], 0, 1)) ?></div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm text-white truncate group-hover:text-[#00C9D4] transition-colors"><?= htmlspecialchars($u['full_name']) ?></div>
                        <div class="text-xs text-gray-500">+<?= htmlspecialchars($u['phone']) ?></div>
                    </div>
                    <span class="text-xs text-yellow-400 font-semibold"><?= $u['coins'] ?></span>
                </a>
            <?php endforeach; endif; ?>
        </div>
    </div>

    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-white">Top Contact Uploaders</h2>
            <a href="/admin/contacts" class="text-xs text-[#00C9D4] hover:underline">View all</a>
        </div>
        <div class="space-y-3">
            <?php if (empty($topUploaders)): ?>
                <p class="text-sm text-gray-500">No contacts uploaded yet.</p>
            <?php else: foreach ($topUploaders as $i => $up): ?>
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs text-gray-400 font-mono"><?= $i + 1 ?></div>
                    <div class="flex-1 text-sm text-white font-mono">+<?= htmlspecialchars($up['uploader_phone']) ?></div>
                    <div class="text-sm text-[#00C9D4] font-semibold"><?= number_format($up['contact_count']) ?></div>
                </div>
            <?php endforeach; endif; ?>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
