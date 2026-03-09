<?php
$pageTitle = 'Contacts';
$search = $_GET['search'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 30;
$offset = ($page - 1) * $perPage;

$where = '';
$params = [];
if ($search) {
    $where = "WHERE c.stored_number LIKE :s1 OR c.stored_name ILIKE :s2 OR c.uploader_phone LIKE :s3";
    $params = ['s1' => "%$search%", 's2' => "%$search%", 's3' => "%$search%"];
}

$countStmt = $db->prepare("SELECT COUNT(*) FROM contacts c $where");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = max(1, ceil($total / $perPage));

$sql = "SELECT c.*, p.full_name as uploader_name FROM contacts c LEFT JOIN profiles p ON c.uploader_phone = p.phone $where ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset";
$stmt = $db->prepare($sql);
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue('offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

ob_start();
?>
<div class="flex items-center gap-3 mb-5">
    <form method="GET" class="flex-1 flex gap-3">
        <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search by number, name, or uploader..."
            class="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
        <button type="submit" class="px-4 py-2.5 bg-[#00C9D4]/10 text-[#00C9D4] rounded-xl text-sm hover:bg-[#00C9D4]/20 transition-colors">Search</button>
        <?php if ($search): ?><a href="/admin/contacts" class="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Clear</a><?php endif; ?>
    </form>
</div>

<div class="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full">
        <thead><tr class="border-b border-white/5">
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Saved Name</th>
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Number</th>
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Label</th>
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Uploaded By</th>
            <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
            <th class="px-5 py-3.5"></th>
        </tr></thead>
        <tbody class="divide-y divide-white/5">
            <?php if (empty($contacts)): ?>
                <tr><td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">No contacts found.</td></tr>
            <?php else: foreach ($contacts as $c): ?>
                <tr class="hover:bg-white/[0.02] transition-colors">
                    <td class="px-5 py-3.5 text-sm text-white"><?= htmlspecialchars($c['stored_name']) ?></td>
                    <td class="px-5 py-3.5 text-sm text-gray-400 font-mono"><?= htmlspecialchars($c['stored_number']) ?></td>
                    <td class="px-5 py-3.5"><span class="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-400"><?= htmlspecialchars($c['label'] ?? '') ?></span></td>
                    <td class="px-5 py-3.5"><a href="/admin/users/<?= urlencode($c['uploader_phone']) ?>" class="text-sm text-[#00C9D4] hover:underline"><?= htmlspecialchars($c['uploader_name'] ?? $c['uploader_phone']) ?></a></td>
                    <td class="px-5 py-3.5 text-sm text-gray-500"><?= date('M d, Y', strtotime($c['created_at'])) ?></td>
                    <td class="px-5 py-3.5 text-right">
                        <form method="POST" onsubmit="return confirm('Remove this contact?')"><input type="hidden" name="delete_id" value="<?= $c['id'] ?>">
                            <button type="submit" class="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; endif; ?>
        </tbody>
    </table>
    <?php if ($totalPages > 1): ?>
        <div class="px-5 py-4 border-t border-white/5 flex items-center justify-between">
            <span class="text-sm text-gray-500">Page <?= $page ?> of <?= $totalPages ?> (<?= $total ?> total)</span>
            <div class="flex gap-2">
                <?php if ($page > 1): ?><a href="?page=<?= $page - 1 ?>&search=<?= urlencode($search) ?>" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Previous</a><?php endif; ?>
                <?php if ($page < $totalPages): ?><a href="?page=<?= $page + 1 ?>&search=<?= urlencode($search) ?>" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Next</a><?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
</div>
<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
