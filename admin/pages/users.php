<?php
$pageTitle = 'Users';
$search = $_GET['search'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 20;
$offset = ($page - 1) * $perPage;

$where = '';
$params = [];
if ($search) {
    $where = "WHERE phone LIKE :s1 OR full_name ILIKE :s2";
    $params = ['s1' => "%$search%", 's2' => "%$search%"];
}

$countStmt = $db->prepare("SELECT COUNT(*) FROM profiles $where");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = max(1, ceil($total / $perPage));

$stmt = $db->prepare("SELECT * FROM profiles $where ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue('offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

ob_start();
?>
<div class="flex items-center gap-3 mb-5">
    <form method="GET" class="flex-1 flex gap-3">
        <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search by name or phone..."
            class="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
        <button type="submit" class="px-4 py-2.5 bg-[#00C9D4]/10 text-[#00C9D4] rounded-xl text-sm hover:bg-[#00C9D4]/20 transition-colors">Search</button>
        <?php if ($search): ?>
            <a href="/admin/users" class="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Clear</a>
        <?php endif; ?>
    </form>
</div>

<div class="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full">
        <thead>
            <tr class="border-b border-white/5">
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">User</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Phone</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Country</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Coins</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Joined</th>
                <th class="px-5 py-3.5"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
            <?php if (empty($users)): ?>
                <tr><td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">No users found.</td></tr>
            <?php else: foreach ($users as $u): ?>
                <tr class="hover:bg-white/[0.02] transition-colors">
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-[#00C9D4]/10 flex items-center justify-center text-xs font-semibold text-[#00C9D4]"><?= strtoupper(substr($u['full_name'], 0, 1)) ?></div>
                            <span class="text-sm text-white"><?= htmlspecialchars($u['full_name']) ?></span>
                        </div>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-400 font-mono">+<?= htmlspecialchars($u['phone']) ?></td>
                    <?php $cinfo = getCountryFromPhone($u['phone']); ?>
                    <td class="px-5 py-4 text-sm text-gray-400">
                        <span title="<?= htmlspecialchars($cinfo['dialCode']) ?>"><?= $cinfo['flag'] ?> <?= htmlspecialchars($cinfo['country']) ?></span>
                    </td>
                    <td class="px-5 py-4"><span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-semibold"><?= $u['coins'] ?></span></td>
                    <td class="px-5 py-4 text-sm text-gray-500"><?= date('M d, Y', strtotime($u['created_at'])) ?></td>
                    <td class="px-5 py-4 text-right"><a href="/admin/users/<?= urlencode($u['phone']) ?>" class="text-xs text-[#00C9D4] hover:underline">View</a></td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
    <?php if ($totalPages > 1): ?>
        <div class="px-5 py-4 border-t border-white/5 flex items-center justify-between">
            <span class="text-sm text-gray-500">Page <?= $page ?> of <?= $totalPages ?> (<?= $total ?> total)</span>
            <div class="flex gap-2">
                <?php if ($page > 1): ?>
                    <a href="?page=<?= $page - 1 ?>&search=<?= urlencode($search) ?>" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Previous</a>
                <?php endif; ?>
                <?php if ($page < $totalPages): ?>
                    <a href="?page=<?= $page + 1 ?>&search=<?= urlencode($search) ?>" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Next</a>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
</div>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
