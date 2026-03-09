<?php
$stmt = $db->prepare("SELECT * FROM profiles WHERE phone = :p");
$stmt->execute(['p' => $viewPhone]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) { header('Location: /admin/users'); exit; }

$pageTitle = $user['full_name'];
$contactCount = $db->prepare("SELECT COUNT(*) FROM contacts WHERE uploader_phone = :p");
$contactCount->execute(['p' => $viewPhone]);
$contactCount = (int)$contactCount->fetchColumn();

$contactsStmt = $db->prepare("SELECT * FROM contacts WHERE uploader_phone = :p ORDER BY created_at DESC LIMIT 50");
$contactsStmt->execute(['p' => $viewPhone]);
$contacts = $contactsStmt->fetchAll(PDO::FETCH_ASSOC);

$isRemoved = $db->prepare("SELECT 1 FROM removed_numbers WHERE phone = :p");
$isRemoved->execute(['p' => $viewPhone]);
$isRemoved = (bool)$isRemoved->fetchColumn();

ob_start();
?>
<div class="mb-5">
    <a href="/admin/users" class="text-sm text-gray-500 hover:text-white flex items-center gap-1 transition-colors w-fit">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Users
    </a>
</div>

<div class="grid grid-cols-3 gap-4 mb-5">
    <div class="col-span-2 bg-[#0F1623] border border-white/5 rounded-2xl p-6">
        <div class="flex items-start gap-4 mb-6">
            <div class="w-14 h-14 rounded-full bg-[#00C9D4]/10 flex items-center justify-center text-xl font-bold text-[#00C9D4]"><?= strtoupper(substr($user['full_name'], 0, 1)) ?></div>
            <div>
                <h2 class="text-lg font-semibold text-white"><?= htmlspecialchars($user['full_name']) ?></h2>
                <p class="text-sm text-gray-400 font-mono">+<?= htmlspecialchars($user['phone']) ?></p>
                <p class="text-xs text-gray-500 mt-1">Joined <?= date('F d, Y', strtotime($user['created_at'])) ?></p>
            </div>
            <?php if ($isRemoved): ?>
                <span class="ml-auto px-2.5 py-1 rounded-lg bg-orange-400/10 text-orange-400 text-xs font-medium">Number Hidden</span>
            <?php endif; ?>
        </div>
        <div class="grid grid-cols-3 gap-4">
            <div class="bg-[#080C14] rounded-xl p-4">
                <div class="text-xs text-gray-500 mb-1">Country</div>
                <div class="text-base font-semibold text-white"><?= htmlspecialchars($user['country_code'] ?? 'N/A') ?></div>
            </div>
            <div class="bg-[#080C14] rounded-xl p-4">
                <div class="text-xs text-gray-500 mb-1">Contacts Uploaded</div>
                <div class="text-base font-semibold text-white"><?= number_format($contactCount) ?></div>
            </div>
            <div class="bg-[#080C14] rounded-xl p-4">
                <div class="text-xs text-gray-500 mb-1">Coin Balance</div>
                <div class="text-base font-semibold text-yellow-400"><?= $user['coins'] ?> coins</div>
            </div>
        </div>
    </div>

    <div class="flex flex-col gap-3">
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h3 class="text-sm font-semibold text-white mb-3">Adjust Coins</h3>
            <form method="POST" action="/admin/users/<?= urlencode($user['phone']) ?>/coins" class="flex flex-col gap-3">
                <input type="number" name="amount" placeholder="e.g. 10 or -5" class="bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 w-full">
                <button type="submit" class="bg-[#00C9D4]/10 text-[#00C9D4] hover:bg-[#00C9D4]/20 rounded-xl py-2.5 text-sm font-medium transition-colors">Update Coins</button>
            </form>
        </div>
        <div class="bg-[#0F1623] border border-red-500/10 rounded-2xl p-5">
            <h3 class="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
            <form method="POST" action="/admin/users/<?= urlencode($user['phone']) ?>/delete" onsubmit="return confirm('Delete this user and all their contacts? This cannot be undone.')">
                <button type="submit" class="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl py-2.5 text-sm font-medium transition-colors">Delete Account</button>
            </form>
        </div>
    </div>
</div>

<?php if (!empty($contacts)): ?>
<div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
    <h3 class="text-sm font-semibold text-white mb-4">Uploaded Contacts (first 50)</h3>
    <div class="grid grid-cols-2 gap-2">
        <?php foreach ($contacts as $c): ?>
            <div class="flex items-center gap-3 bg-[#080C14] rounded-xl px-3.5 py-3">
                <div class="w-7 h-7 rounded-full bg-purple-400/10 flex items-center justify-center text-xs text-purple-400"><?= strtoupper(substr($c['stored_name'], 0, 1)) ?></div>
                <div class="min-w-0 flex-1">
                    <div class="text-sm text-white truncate"><?= htmlspecialchars($c['stored_name']) ?></div>
                    <div class="text-xs text-gray-500 font-mono"><?= htmlspecialchars($c['stored_number']) ?></div>
                </div>
                <span class="text-xs text-gray-600"><?= htmlspecialchars($c['label'] ?? '') ?></span>
            </div>
        <?php endforeach; ?>
    </div>
</div>
<?php endif; ?>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
