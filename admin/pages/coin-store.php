<?php
$defaultPackages = [
    ['id' => 'starter',  'coins' => 5,   'price' => 0.99,  'label' => '',            'popular' => false, 'bestValue' => false, 'enabled' => true],
    ['id' => 'basic',    'coins' => 15,  'price' => 1.99,  'label' => 'save33',      'popular' => false, 'bestValue' => false, 'enabled' => true],
    ['id' => 'popular',  'coins' => 40,  'price' => 3.99,  'label' => 'mostPopular', 'popular' => true,  'bestValue' => false, 'enabled' => true],
    ['id' => 'pro',      'coins' => 100, 'price' => 7.99,  'label' => 'save47',      'popular' => false, 'bestValue' => false, 'enabled' => true],
    ['id' => 'mega',     'coins' => 250, 'price' => 14.99, 'label' => 'bestValue',   'popular' => false, 'bestValue' => true,  'enabled' => true],
];

$raw = getSetting($db, 'coin_packages', '');
$packages = $raw ? json_decode($raw, true) : $defaultPackages;
if (!is_array($packages)) $packages = $defaultPackages;

$editTarget = null;
if (!empty($_GET['edit']) && is_numeric($_GET['edit'])) {
    $idx = (int)$_GET['edit'];
    if (isset($packages[$idx])) $editTarget = ['index' => $idx, 'pkg' => $packages[$idx]];
}
$showAdd = !empty($_GET['add']);
$pageError = $_SESSION['flash_error'] ?? null;
unset($_SESSION['flash_error']);

$labelOptions = [
    ''            => 'No badge',
    'save33'      => 'Save 33%',
    'save47'      => 'Save 47%',
    'save50'      => 'Save 50%',
    'mostPopular' => 'Most Popular',
    'bestValue'   => 'Best Value',
    'new'         => 'New',
    'hot'         => 'Hot',
];

ob_start();
?>
<div class="px-8 py-8 max-w-5xl">

    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-2xl font-bold text-white">Coin Store Packages</h1>
            <p class="text-gray-500 text-sm mt-1">Configure the coin packages shown to users in the app</p>
        </div>
        <a href="/admin/coin-store?add=1" class="flex items-center gap-2 bg-[#00C9D4] hover:bg-[#00b5bf] text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Package
        </a>
    </div>

    <?php if ($pageError): ?>
        <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><?= htmlspecialchars($pageError) ?></div>
    <?php endif; ?>
    <?php if ($successMsg): ?>
        <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><?= htmlspecialchars($successMsg) ?></div>
    <?php endif; ?>

    <!-- Packages table -->
    <div class="bg-[#0F1623] rounded-2xl border border-white/5 overflow-hidden mb-6">
        <?php if (empty($packages)): ?>
            <div class="p-12 text-center">
                <svg class="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <p class="text-gray-500 text-sm">No packages configured yet.</p>
                <a href="/admin/coin-store?add=1" class="inline-block mt-3 text-[#00C9D4] text-sm hover:underline">Add the first one</a>
            </div>
        <?php else: ?>
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-white/5">
                    <th class="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coins</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Per Coin</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Badge</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-5 py-4"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                <?php foreach ($packages as $idx => $pkg): ?>
                <?php
                    $isFirst = $idx === 0;
                    $isLast  = $idx === count($packages) - 1;
                    $perCoin = $pkg['coins'] > 0 ? round($pkg['price'] / $pkg['coins'] * 100, 1) . '¢' : '—';
                    $highlight = !empty($pkg['popular']) || !empty($pkg['bestValue']);
                    $labelText = $labelOptions[$pkg['label'] ?? ''] ?? ($pkg['label'] ?: '—');
                ?>
                <tr class="hover:bg-white/2 transition-colors <?= !($pkg['enabled'] ?? true) ? 'opacity-50' : '' ?>">
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl flex items-center justify-center <?= $highlight ? 'bg-amber-500/10 text-amber-400' : 'bg-[#00C9D4]/10 text-[#00C9D4]' ?>">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"/><path fill-rule="evenodd" d="M10 4a1 1 0 011 1v4.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V5a1 1 0 011-1z" clip-rule="evenodd"/></svg>
                            </div>
                            <div>
                                <p class="text-white font-medium font-mono"><?= htmlspecialchars($pkg['id']) ?></p>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[#C49A2A]">◆</span>
                            <span class="text-white font-semibold"><?= (int)$pkg['coins'] ?></span>
                        </div>
                    </td>
                    <td class="px-5 py-4 text-white font-semibold">$<?= number_format((float)$pkg['price'], 2) ?></td>
                    <td class="px-5 py-4 text-gray-400 text-xs"><?= $perCoin ?></td>
                    <td class="px-5 py-4">
                        <?php if (!empty($pkg['label'])): ?>
                            <?php if (!empty($pkg['popular'])): ?>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-[#00C9D4]/15 text-[#00C9D4] text-xs font-semibold"><?= htmlspecialchars($labelText) ?></span>
                            <?php elseif (!empty($pkg['bestValue'])): ?>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs font-semibold"><?= htmlspecialchars($labelText) ?></span>
                            <?php else: ?>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-xs font-semibold"><?= htmlspecialchars($labelText) ?></span>
                            <?php endif; ?>
                        <?php else: ?>
                            <span class="text-gray-600 text-xs">—</span>
                        <?php endif; ?>
                    </td>
                    <td class="px-5 py-4">
                        <?php if ($pkg['enabled'] ?? true): ?>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                            </span>
                        <?php else: ?>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-500 text-xs font-semibold">
                                <span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Hidden
                            </span>
                        <?php endif; ?>
                    </td>
                    <td class="px-5 py-4">
                        <div class="flex items-center justify-end gap-1">
                            <?php if (!$isFirst): ?>
                            <form method="POST" action="/admin/coin-store">
                                <input type="hidden" name="action" value="move_up">
                                <input type="hidden" name="index" value="<?= $idx ?>">
                                <button type="submit" class="p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-colors" title="Move up">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                                </button>
                            </form>
                            <?php endif; ?>
                            <?php if (!$isLast): ?>
                            <form method="POST" action="/admin/coin-store">
                                <input type="hidden" name="action" value="move_down">
                                <input type="hidden" name="index" value="<?= $idx ?>">
                                <button type="submit" class="p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-colors" title="Move down">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                </button>
                            </form>
                            <?php endif; ?>
                            <a href="/admin/coin-store?edit=<?= $idx ?>" class="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="Edit">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </a>
                            <form method="POST" action="/admin/coin-store" onsubmit="return confirm('Delete this package?')">
                                <input type="hidden" name="action" value="delete">
                                <input type="hidden" name="index" value="<?= $idx ?>">
                                <button type="submit" class="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors" title="Delete">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>

    <!-- Help note -->
    <div class="p-4 rounded-xl bg-[#00C9D4]/5 border border-[#00C9D4]/15 text-sm text-gray-400 flex items-start gap-3">
        <svg class="w-5 h-5 text-[#00C9D4] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
            Known badge keys are automatically translated in all app languages: <code class="bg-white/5 px-1 rounded text-[#00C9D4]">save33</code>, <code class="bg-white/5 px-1 rounded text-[#00C9D4]">save47</code>, <code class="bg-white/5 px-1 rounded text-[#00C9D4]">save50</code>, <code class="bg-white/5 px-1 rounded text-[#00C9D4]">mostPopular</code>, <code class="bg-white/5 px-1 rounded text-[#00C9D4]">bestValue</code>. Custom text is shown as-is.
        </div>
    </div>

</div>

<!-- Add modal -->
<?php if ($showAdd): ?>
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-[#0F1623] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 class="text-lg font-semibold text-white">Add Coin Package</h2>
            <a href="/admin/coin-store" class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>
        </div>
        <form method="POST" action="/admin/coin-store" class="px-6 py-5 space-y-4">
            <input type="hidden" name="action" value="create">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1.5">ID <span class="text-red-400">*</span></label>
                    <input type="text" name="id" required placeholder="e.g. starter" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 text-sm font-mono">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1.5">Coins <span class="text-red-400">*</span></label>
                    <input type="number" name="coins" required min="1" placeholder="10" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 text-sm">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Price (USD) <span class="text-red-400">*</span></label>
                <input type="number" name="price" required min="0.01" step="0.01" placeholder="1.99" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 text-sm">
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Badge / Label</label>
                <select name="label" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 text-sm">
                    <?php foreach ($labelOptions as $key => $display): ?>
                        <option value="<?= htmlspecialchars($key) ?>"><?= htmlspecialchars($display) ?></option>
                    <?php endforeach; ?>
                    <option value="_custom">Custom text…</option>
                </select>
                <input type="text" name="label_custom" placeholder="Custom badge text" class="w-full mt-2 bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 text-sm hidden" id="customLabelAdd">
            </div>
            <div class="grid grid-cols-3 gap-3">
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#080C14] border border-white/10">
                    <input type="checkbox" name="popular" value="1" class="w-4 h-4 rounded accent-[#00C9D4]">
                    <span class="text-sm text-gray-300">Popular</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#080C14] border border-white/10">
                    <input type="checkbox" name="bestValue" value="1" class="w-4 h-4 rounded accent-amber-500">
                    <span class="text-sm text-gray-300">Best Value</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#080C14] border border-white/10">
                    <input type="checkbox" name="enabled" value="1" checked class="w-4 h-4 rounded accent-emerald-500">
                    <span class="text-sm text-gray-300">Active</span>
                </label>
            </div>
            <div class="flex gap-3 pt-2">
                <a href="/admin/coin-store" class="flex-1 text-center py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors">Cancel</a>
                <button type="submit" class="flex-1 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold py-3 rounded-xl text-sm transition-colors">Add Package</button>
            </div>
        </form>
    </div>
</div>
<script>
document.querySelector('select[name="label"]').addEventListener('change', function(){
    document.getElementById('customLabelAdd').classList.toggle('hidden', this.value !== '_custom');
});
</script>
<?php endif; ?>

<!-- Edit modal -->
<?php if ($editTarget): ?>
<?php $ep = $editTarget['pkg']; $ei = $editTarget['index']; ?>
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-[#0F1623] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 class="text-lg font-semibold text-white">Edit Package</h2>
            <a href="/admin/coin-store" class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>
        </div>
        <form method="POST" action="/admin/coin-store" class="px-6 py-5 space-y-4">
            <input type="hidden" name="action" value="update">
            <input type="hidden" name="index" value="<?= $ei ?>">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1.5">ID <span class="text-red-400">*</span></label>
                    <input type="text" name="id" required value="<?= htmlspecialchars($ep['id']) ?>" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 text-sm font-mono">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1.5">Coins <span class="text-red-400">*</span></label>
                    <input type="number" name="coins" required min="1" value="<?= (int)$ep['coins'] ?>" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 text-sm">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Price (USD) <span class="text-red-400">*</span></label>
                <input type="number" name="price" required min="0.01" step="0.01" value="<?= number_format((float)$ep['price'], 2, '.', '') ?>" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 text-sm">
            </div>
            <?php
                $curLabel = $ep['label'] ?? '';
                $isKnownLabel = array_key_exists($curLabel, $labelOptions);
                $editLabelSelect = $isKnownLabel ? $curLabel : ($curLabel !== '' ? '_custom' : '');
                $editLabelCustom = !$isKnownLabel && $curLabel !== '' ? $curLabel : '';
            ?>
            <div>
                <label class="block text-sm text-gray-400 mb-1.5">Badge / Label</label>
                <select name="label" id="editLabelSelect" class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C9D4]/50 text-sm">
                    <?php foreach ($labelOptions as $key => $display): ?>
                        <option value="<?= htmlspecialchars($key) ?>" <?= $editLabelSelect === $key ? 'selected' : '' ?>><?= htmlspecialchars($display) ?></option>
                    <?php endforeach; ?>
                    <option value="_custom" <?= $editLabelSelect === '_custom' ? 'selected' : '' ?>>Custom text…</option>
                </select>
                <input type="text" name="label_custom" value="<?= htmlspecialchars($editLabelCustom) ?>" placeholder="Custom badge text" class="w-full mt-2 bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 text-sm <?= $editLabelSelect === '_custom' ? '' : 'hidden' ?>" id="customLabelEdit">
            </div>
            <div class="grid grid-cols-3 gap-3">
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#080C14] border border-white/10">
                    <input type="checkbox" name="popular" value="1" <?= !empty($ep['popular']) ? 'checked' : '' ?> class="w-4 h-4 rounded accent-[#00C9D4]">
                    <span class="text-sm text-gray-300">Popular</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#080C14] border border-white/10">
                    <input type="checkbox" name="bestValue" value="1" <?= !empty($ep['bestValue']) ? 'checked' : '' ?> class="w-4 h-4 rounded accent-amber-500">
                    <span class="text-sm text-gray-300">Best Value</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#080C14] border border-white/10">
                    <input type="checkbox" name="enabled" value="1" <?= ($ep['enabled'] ?? true) ? 'checked' : '' ?> class="w-4 h-4 rounded accent-emerald-500">
                    <span class="text-sm text-gray-300">Active</span>
                </label>
            </div>
            <div class="flex gap-3 pt-2">
                <a href="/admin/coin-store" class="flex-1 text-center py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors">Cancel</a>
                <button type="submit" class="flex-1 bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold py-3 rounded-xl text-sm transition-colors">Save Changes</button>
            </div>
        </form>
    </div>
</div>
<script>
document.getElementById('editLabelSelect').addEventListener('change', function(){
    document.getElementById('customLabelEdit').classList.toggle('hidden', this.value !== '_custom');
});
</script>
<?php endif; ?>

<?php
$content = ob_get_clean();
$pageTitle = 'Coin Store Packages';
include __DIR__ . '/../layout.php';
