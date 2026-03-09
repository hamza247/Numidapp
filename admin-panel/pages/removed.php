<?php
$pageTitle = 'Removed Numbers';
$search = $_GET['search'] ?? '';

$where = '';
$params = [];
if ($search) {
    $where = "WHERE r.phone LIKE :s1";
    $params = ['s1' => "%$search%"];
}

$stmt = $db->prepare("SELECT r.phone, r.removed_at, p.full_name FROM removed_numbers r LEFT JOIN profiles p ON r.phone = p.phone $where ORDER BY r.removed_at DESC");
$stmt->execute($params);
$removed = $stmt->fetchAll(PDO::FETCH_ASSOC);

ob_start();
?>
<div class="mb-4 p-4 rounded-xl bg-orange-400/5 border border-orange-400/10 text-sm text-orange-300">
    Numbers listed here are permanently blocked from appearing in search results. Restoring a number removes it from the blocklist.
</div>

<div class="flex items-center gap-3 mb-5">
    <form method="GET" class="flex-1 flex gap-3">
        <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search by phone number..."
            class="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
        <button type="submit" class="px-4 py-2.5 bg-[#00C9D4]/10 text-[#00C9D4] rounded-xl text-sm hover:bg-[#00C9D4]/20 transition-colors">Search</button>
        <?php if ($search): ?><a href="/admin/removed" class="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Clear</a><?php endif; ?>
    </form>
</div>

<div class="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full">
        <thead><tr class="border-b border-white/5">
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Phone Number</th>
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Registered Name</th>
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Removed At</th>
            <th class="px-5 py-3.5"></th>
        </tr></thead>
        <tbody class="divide-y divide-white/5">
            <?php if (empty($removed)): ?>
                <tr><td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500">No removed numbers.</td></tr>
            <?php else: foreach ($removed as $r): ?>
                <tr class="hover:bg-white/[0.02] transition-colors">
                    <td class="px-5 py-4 text-sm text-white font-mono">+<?= htmlspecialchars($r['phone']) ?></td>
                    <td class="px-5 py-4 text-sm text-gray-400"><?= htmlspecialchars($r['full_name'] ?? '—') ?></td>
                    <td class="px-5 py-4 text-sm text-gray-500"><?= date('M d, Y H:i', strtotime($r['removed_at'])) ?></td>
                    <td class="px-5 py-4 text-right">
                        <form method="POST" action="/admin/removed/<?= urlencode($r['phone']) ?>/restore" onsubmit="return confirm('Restore +<?= htmlspecialchars($r['phone']) ?> to search results?')">
                            <button type="submit" class="text-xs text-[#00C9D4] hover:text-[#00b5bf] transition-colors">Restore</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
</div>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
