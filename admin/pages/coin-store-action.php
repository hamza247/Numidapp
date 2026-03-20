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

function savePackages(PDO $db, array $pkgs): void {
    $stmt = $db->prepare("INSERT INTO app_settings (key, value, updated_at) VALUES ('coin_packages', :v, NOW()) ON CONFLICT (key) DO UPDATE SET value = :v2, updated_at = NOW()");
    $stmt->execute(['v' => json_encode(array_values($pkgs)), 'v2' => json_encode(array_values($pkgs))]);
}

function resolveLabel(string $select, string $custom): string {
    if ($select === '_custom') return trim($custom);
    return $select;
}

$action = $_POST['action'] ?? '';

if ($action === 'create') {
    $id = preg_replace('/[^a-z0-9_\-]/', '', strtolower(trim($_POST['id'] ?? '')));
    $coins = (int)($_POST['coins'] ?? 0);
    $price = (float)($_POST['price'] ?? 0);
    $label = resolveLabel($_POST['label'] ?? '', $_POST['label_custom'] ?? '');
    $popular   = isset($_POST['popular'])   && $_POST['popular']   === '1';
    $bestValue = isset($_POST['bestValue']) && $_POST['bestValue'] === '1';
    $enabled   = isset($_POST['enabled'])   && $_POST['enabled']   === '1';

    if ($id === '' || $coins < 1 || $price <= 0) {
        $_SESSION['flash_error'] = 'ID, coins, and price are required.';
        header('Location: /admin/coin-store?add=1');
        exit;
    }
    foreach ($packages as $p) {
        if ($p['id'] === $id) {
            $_SESSION['flash_error'] = "A package with ID «{$id}» already exists.";
            header('Location: /admin/coin-store?add=1');
            exit;
        }
    }
    $packages[] = ['id' => $id, 'coins' => $coins, 'price' => round($price, 2), 'label' => $label, 'popular' => $popular, 'bestValue' => $bestValue, 'enabled' => $enabled];
    savePackages($db, $packages);
    $_SESSION['flash_success'] = "Package «{$id}» created.";
    header('Location: /admin/coin-store');
    exit;
}

if ($action === 'update') {
    $idx = (int)($_POST['index'] ?? -1);
    if ($idx < 0 || !isset($packages[$idx])) {
        header('Location: /admin/coin-store');
        exit;
    }
    $id = preg_replace('/[^a-z0-9_\-]/', '', strtolower(trim($_POST['id'] ?? '')));
    $coins = (int)($_POST['coins'] ?? 0);
    $price = (float)($_POST['price'] ?? 0);
    $label = resolveLabel($_POST['label'] ?? '', $_POST['label_custom'] ?? '');
    $popular   = isset($_POST['popular'])   && $_POST['popular']   === '1';
    $bestValue = isset($_POST['bestValue']) && $_POST['bestValue'] === '1';
    $enabled   = isset($_POST['enabled'])   && $_POST['enabled']   === '1';

    if ($id === '' || $coins < 1 || $price <= 0) {
        $_SESSION['flash_error'] = 'ID, coins, and price are required.';
        header("Location: /admin/coin-store?edit={$idx}");
        exit;
    }
    foreach ($packages as $i => $p) {
        if ($p['id'] === $id && $i !== $idx) {
            $_SESSION['flash_error'] = "Another package with ID «{$id}» already exists.";
            header("Location: /admin/coin-store?edit={$idx}");
            exit;
        }
    }
    $packages[$idx] = ['id' => $id, 'coins' => $coins, 'price' => round($price, 2), 'label' => $label, 'popular' => $popular, 'bestValue' => $bestValue, 'enabled' => $enabled];
    savePackages($db, $packages);
    $_SESSION['flash_success'] = "Package «{$id}» updated.";
    header('Location: /admin/coin-store');
    exit;
}

if ($action === 'delete') {
    $idx = (int)($_POST['index'] ?? -1);
    if ($idx >= 0 && isset($packages[$idx])) {
        $removed = $packages[$idx]['id'];
        array_splice($packages, $idx, 1);
        savePackages($db, $packages);
        $_SESSION['flash_success'] = "Package «{$removed}» deleted.";
    }
    header('Location: /admin/coin-store');
    exit;
}

if ($action === 'move_up') {
    $idx = (int)($_POST['index'] ?? 0);
    if ($idx > 0 && isset($packages[$idx])) {
        [$packages[$idx - 1], $packages[$idx]] = [$packages[$idx], $packages[$idx - 1]];
        savePackages($db, $packages);
    }
    header('Location: /admin/coin-store');
    exit;
}

if ($action === 'move_down') {
    $idx = (int)($_POST['index'] ?? 0);
    if ($idx < count($packages) - 1 && isset($packages[$idx])) {
        [$packages[$idx], $packages[$idx + 1]] = [$packages[$idx + 1], $packages[$idx]];
        savePackages($db, $packages);
    }
    header('Location: /admin/coin-store');
    exit;
}

header('Location: /admin/coin-store');
exit;
