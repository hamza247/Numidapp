<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?> — Who Saved Me Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#080C14] text-white min-h-screen flex">
    <?php $maintenanceOn = getSetting($db, 'maintenance_mode', '0') === '1'; ?>
    <aside class="w-60 shrink-0 bg-[#0F1623] border-r border-white/5 flex flex-col min-h-screen fixed left-0 top-0 bottom-0">
        <div class="px-5 py-5 border-b border-white/5">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#00C9D4]/10 border border-[#00C9D4]/20 flex items-center justify-center">
                    <svg class="w-5 h-5 text-[#00C9D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                </div>
                <div>
                    <div class="text-sm font-semibold text-white">Who Saved Me</div>
                    <div class="text-xs text-gray-500">Admin Panel</div>
                </div>
            </div>
            <?php if ($maintenanceOn): ?>
                <div class="mt-3 px-3 py-1.5 rounded-lg bg-orange-400/10 border border-orange-400/20 text-center">
                    <span class="text-xs font-medium text-orange-400">MAINTENANCE MODE ON</span>
                </div>
            <?php endif; ?>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-0.5">
            <?php
            $nav = [
                ['/admin', 'Overview', 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
                ['/admin/users', 'Users', 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
                ['/admin/contacts', 'Contacts', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
                ['/admin/removed', 'Removed Numbers', 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'],
                ['/admin/stripe', 'Stripe', 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
                ['/admin/twilio', 'Twilio / OTP', 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'],
                ['/admin/admob', 'AdMob / Ads', 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'],
                ['/admin/coin-store', 'Coin Store', 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'],
                ['/admin/branding', 'Branding', 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
                ['/admin/settings', 'Settings', 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
            ];
            $currentPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            foreach ($nav as [$href, $label, $icon]):
                $active = ($href === '/admin' && $currentPath === '/admin') || ($href !== '/admin' && strpos($currentPath, $href) === 0);
                $cls = $active ? 'bg-[#00C9D4]/10 text-[#00C9D4]' : 'text-gray-400 hover:bg-white/5 hover:text-white';
            ?>
                <a href="<?= $href ?>" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors <?= $cls ?>">
                    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="<?= $icon ?>"/>
                    </svg>
                    <?= $label ?>
                </a>
            <?php endforeach; ?>
            <?php if (!empty($isSuperAdmin)): ?>
            <?php
                $adminHref = '/admin/admins';
                $adminActive = strpos($currentPath, $adminHref) === 0;
                $adminCls = $adminActive ? 'bg-amber-500/10 text-amber-400' : 'text-gray-400 hover:bg-white/5 hover:text-white';
            ?>
            <a href="/admin/admins" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors <?= $adminCls ?>">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Admin Accounts
            </a>
            <?php endif; ?>
        </nav>
        <div class="px-3 py-4 border-t border-white/5">
            <form method="POST" action="/admin/logout">
                <button type="submit" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                </button>
            </form>
        </div>
    </aside>
    <main class="flex-1 ml-60 min-h-screen">
        <header class="sticky top-0 z-10 bg-[#080C14]/80 backdrop-blur border-b border-white/5 px-8 py-4 flex items-center justify-between">
            <h1 class="text-lg font-semibold text-white"><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?></h1>
            <span class="text-sm text-gray-500"><?= htmlspecialchars($_SESSION['admin_username'] ?? 'admin') ?></span>
        </header>
        <div class="px-8 py-6">
            <?php if (!empty($successMsg)): ?>
                <div class="mb-5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"><?= htmlspecialchars($successMsg) ?></div>
            <?php endif; ?>
            <?= $content ?>
        </div>
    </main>
</body>
</html>
