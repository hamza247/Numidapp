<?php
$admins = $db->query("SELECT id, username, full_name, role, created_at, last_login FROM admin_users ORDER BY role DESC, created_at ASC")->fetchAll(PDO::FETCH_ASSOC);
$editTarget = null;
if (!empty($_GET['edit'])) {
    $stmt = $db->prepare("SELECT id, username, full_name, role FROM admin_users WHERE id = :id");
    $stmt->execute(['id' => (int)$_GET['edit']]);
    $editTarget = $stmt->fetch(PDO::FETCH_ASSOC);
}
$showAdd = !empty($_GET['add']);
$pageError = $_SESSION['flash_error'] ?? null;
unset($_SESSION['flash_error']);

ob_start();
?>
<div class="px-8 py-8 max-w-5xl">

    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-2xl font-bold text-white">Admin Accounts</h1>
            <p class="text-gray-500 text-sm mt-1">Manage who has access to this admin panel</p>
        </div>
        <a href="/admin/admins?add=1" class="flex items-center gap-2 bg-[#00C9D4] hover:bg-[#00b5bf] text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Admin
        </a>
    </div>

    <?php if ($pageError): ?>
        <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><?= htmlspecialchars($pageError) ?></div>
    <?php endif; ?>

    <?php if ($successMsg): ?>
        <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><?= htmlspecialchars($successMsg) ?></div>
    <?php endif; ?>

    <!-- Env admin info banner -->
    <div class="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
            <p class="text-amber-400 text-sm font-medium">Environment admin always exists</p>
            <p class="text-gray-500 text-xs mt-1">The account configured via <code class="bg-white/5 px-1 rounded">ADMIN_USERNAME</code> / <code class="bg-white/5 px-1 rounded">ADMIN_PASSWORD</code> env vars is always a Super Admin, regardless of this list.</p>
        </div>
    </div>

    <!-- Admins table -->
    <div class="bg-[#0F1623] rounded-2xl border border-white/5 overflow-hidden mb-8">
        <?php if (empty($admins)): ?>
            <div class="p-12 text-center">
                <svg class="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <p class="text-gray-500 text-sm">No additional admin accounts yet.</p>
                <a href="/admin/admins?add=1" class="inline-block mt-3 text-[#00C9D4] text-sm hover:underline">Add the first one</a>
            </div>
        <?php else: ?>
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-white/5">
                    <th class="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                    <th class="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th class="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th class="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th class="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                <?php foreach ($admins as $a): ?>
                <tr class="hover:bg-white/2 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold <?= $a['role'] === 'super_admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-[#00C9D4]/10 text-[#00C9D4]' ?>">
                                <?= strtoupper(substr($a['username'], 0, 1)) ?>
                            </div>
                            <div>
                                <p class="text-white font-medium"><?= htmlspecialchars($a['username']) ?></p>
                                <?php if (!empty($a['full_name'])): ?>
                                    <p class="text-gray-500 text-xs"><?= htmlspecialchars($a['full_name']) ?></p>
                                <?php endif; ?>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <?php if ($a['role'] === 'super_admin'): ?>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                Super Admin
                            </span>
                        <?php else: ?>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00C9D4]/10 text-[#00C9D4] text-xs font-semibold">Admin</span>
                        <?php endif; ?>
                    </td>
                    <td class="px-6 py-4 text-gray-400">
                        <?= $a['last_login'] ? date('M j, Y H:i', strtotime($a['last_login'])) : '<span class="text-gray-600">Never</span>' ?>
                    </td>
                    <td class="px-6 py-4 text-gray-500 text-xs">
                        <?= date('M j, Y', strtotime($a['created_at'])) ?>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center justify-end gap-2">
                            <a href="/admin/admins?edit=<?= $a['id'] ?>" class="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="Edit">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </a>
                            <?php if ($a['id'] != $currentAdminId): ?>
                            <form method="POST" action="/admin/admins" onsubmit="return confirm('Delete admin «<?= htmlspecialchars($a['username']) ?>»? This cannot be undone.')">
                                <input type="hidden" name="action" value="delete">
                                <input type="hidden" name="id" value="<?= $a['id'] ?>">
                                <button type="submit" class="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors" title="Delete">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </form>
                            <?php else: ?>
                            <span class="px-2.5 py-1 text-xs text-gray-600 italic">You</span>
                            <?php endif; ?>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>

</div>

<!-- Add modal -->
<?php if ($showAdd): ?>
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" id="addModal">
    <div class="bg-[#0F1623] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 class="text-lg font-semibold text-white">Add Admin Account</h2>
            <a href="/admin/admins" class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>
        </div>
        <form method="POST" action="/admin/admins" class="px-6 py-5 space-y-4">
            <input type="hidden" name="action" value="create">
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Username <span class="text-red-400">*</span></label>
                <input type="text" name="username" required autocomplete="off" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm" placeholder="e.g. john_doe">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Full Name</label>
                <input type="text" name="full_name" autocomplete="off" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm" placeholder="e.g. John Doe">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Password <span class="text-red-400">*</span></label>
                <input type="password" name="password" required class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm" placeholder="Min. 8 characters">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Role <span class="text-red-400">*</span></label>
                <select name="role" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm">
                    <option value="admin">Admin — standard access</option>
                    <option value="super_admin">Super Admin — full access + manage admins</option>
                </select>
            </div>
            <div class="flex gap-3 pt-2">
                <a href="/admin/admins" class="flex-1 text-center py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors">Cancel</a>
                <button type="submit" class="flex-1 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold py-3 rounded-xl text-sm transition-colors">Create Account</button>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<!-- Edit modal -->
<?php if ($editTarget): ?>
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-[#0F1623] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 class="text-lg font-semibold text-white">Edit Admin Account</h2>
            <a href="/admin/admins" class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>
        </div>
        <form method="POST" action="/admin/admins" class="px-6 py-5 space-y-4">
            <input type="hidden" name="action" value="update">
            <input type="hidden" name="id" value="<?= $editTarget['id'] ?>">
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Username <span class="text-red-400">*</span></label>
                <input type="text" name="username" required value="<?= htmlspecialchars($editTarget['username']) ?>" autocomplete="off" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Full Name</label>
                <input type="text" name="full_name" value="<?= htmlspecialchars($editTarget['full_name']) ?>" autocomplete="off" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">New Password <span class="text-gray-600 font-normal">(leave blank to keep current)</span></label>
                <input type="password" name="password" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm" placeholder="••••••••">
            </div>
            <?php if ($editTarget['id'] != $currentAdminId): ?>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Role <span class="text-red-400">*</span></label>
                <select name="role" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 transition-colors text-sm">
                    <option value="admin" <?= $editTarget['role'] === 'admin' ? 'selected' : '' ?>>Admin — standard access</option>
                    <option value="super_admin" <?= $editTarget['role'] === 'super_admin' ? 'selected' : '' ?>>Super Admin — full access + manage admins</option>
                </select>
            </div>
            <?php else: ?>
            <div class="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-400 text-xs">You cannot change your own role.</div>
            <?php endif; ?>
            <div class="flex gap-3 pt-2">
                <a href="/admin/admins" class="flex-1 text-center py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors">Cancel</a>
                <button type="submit" class="flex-1 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold py-3 rounded-xl text-sm transition-colors">Save Changes</button>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<?php
$content = ob_get_clean();
$pageTitle = 'Admin Accounts';
include __DIR__ . '/../layout.php';
