<?php
session_start();

$dbUrl = getenv('DATABASE_URL');
if ($dbUrl) {
    $p = parse_url($dbUrl);
    $host = $p['host'] ?? 'helium';
    $port = $p['port'] ?? 5432;
    $dbname = ltrim($p['path'] ?? '/heliumdb', '/');
    $user = $p['user'] ?? 'postgres';
    $pass = $p['pass'] ?? 'password';
    $db = new PDO("pgsql:host={$host};port={$port};dbname={$dbname}", $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} else {
    $db = new PDO("pgsql:host=helium;port=5432;dbname=heliumdb", "postgres", "password", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
}

$db->exec("CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(255) PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT NOW())");

function getSetting(PDO $db, string $key, string $default = ''): string {
    $stmt = $db->prepare("SELECT value FROM app_settings WHERE key = :k");
    $stmt->execute(['k' => $key]);
    $val = $stmt->fetchColumn();
    return $val !== false ? $val : $default;
}

function setSetting(PDO $db, string $key, string $value): void {
    $stmt = $db->prepare("INSERT INTO app_settings (key, value, updated_at) VALUES (:k, :v, NOW()) ON CONFLICT (key) DO UPDATE SET value = :v2, updated_at = NOW()");
    $stmt->execute(['k' => $key, 'v' => $value, 'v2' => $value]);
}

$adminUser = getenv('ADMIN_USERNAME') ?: 'admin';
$adminPass = getenv('ADMIN_PASSWORD') ?: 'admin123';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/') ?: '/admin';

$publicPages = ['/admin/login'];
$loggedIn = !empty($_SESSION['admin_logged_in']);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $uri === '/admin/login') {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';
    if ($u === $adminUser && $p === $adminPass) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $u;
        header('Location: /admin');
        exit;
    }
    $loginError = 'Invalid username or password.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $uri === '/admin/logout') {
    session_destroy();
    header('Location: /admin/login');
    exit;
}

if (!$loggedIn && !in_array($uri, $publicPages)) {
    header('Location: /admin/login');
    exit;
}

$successMsg = $_SESSION['flash_success'] ?? null;
unset($_SESSION['flash_success']);

switch (true) {
    case $uri === '/admin/login':
        include __DIR__ . '/pages/login.php';
        break;
    case $uri === '/admin':
        include __DIR__ . '/pages/dashboard.php';
        break;
    case $uri === '/admin/users' && $_SERVER['REQUEST_METHOD'] === 'GET':
        include __DIR__ . '/pages/users.php';
        break;
    case preg_match('#^/admin/users/(.+)/coins$#', $uri, $m) && $_SERVER['REQUEST_METHOD'] === 'POST':
        $phone = $m[1];
        $amount = (int)($_POST['amount'] ?? 0);
        $stmt = $db->prepare("UPDATE profiles SET coins = GREATEST(0, coins + :amt) WHERE phone = :phone");
        $stmt->execute(['amt' => $amount, 'phone' => $phone]);
        $_SESSION['flash_success'] = "Coins updated successfully.";
        header("Location: /admin/users/" . urlencode($phone));
        exit;
    case preg_match('#^/admin/users/(.+)/delete$#', $uri, $m) && $_SERVER['REQUEST_METHOD'] === 'POST':
        $phone = $m[1];
        $db->prepare("DELETE FROM contacts WHERE uploader_phone = :p")->execute(['p' => $phone]);
        $db->prepare("DELETE FROM phone_verifications WHERE phone = :p")->execute(['p' => $phone]);
        $db->prepare("DELETE FROM profiles WHERE phone = :p")->execute(['p' => $phone]);
        $_SESSION['flash_success'] = "User deleted successfully.";
        header("Location: /admin/users");
        exit;
    case preg_match('#^/admin/users/(.+)$#', $uri, $m) && $_SERVER['REQUEST_METHOD'] === 'GET':
        $viewPhone = $m[1];
        include __DIR__ . '/pages/user-detail.php';
        break;
    case $uri === '/admin/contacts/export':
        include __DIR__ . '/pages/contacts-export.php';
        exit;
    case $uri === '/admin/contacts':
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
            $db->prepare("DELETE FROM contacts WHERE id = :id")->execute(['id' => (int)$_POST['delete_id']]);
            $_SESSION['flash_success'] = "Contact removed.";
            header("Location: /admin/contacts?" . http_build_query(['search' => $_GET['search'] ?? '']));
            exit;
        }
        include __DIR__ . '/pages/contacts.php';
        break;
    case $uri === '/admin/removed':
        include __DIR__ . '/pages/removed.php';
        break;
    case preg_match('#^/admin/removed/(.+)/restore$#', $uri, $m) && $_SERVER['REQUEST_METHOD'] === 'POST':
        $phone = $m[1];
        $db->prepare("DELETE FROM removed_numbers WHERE phone = :p")->execute(['p' => $phone]);
        $_SESSION['flash_success'] = "Number restored to search results.";
        header("Location: /admin/removed");
        exit;
    case $uri === '/admin/stripe':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/stripe-action.php';
            exit;
        }
        include __DIR__ . '/pages/stripe.php';
        break;
    case $uri === '/admin/admob':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/admob-action.php';
            exit;
        }
        include __DIR__ . '/pages/admob.php';
        break;
    case $uri === '/admin/settings':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/settings-action.php';
            exit;
        }
        include __DIR__ . '/pages/settings.php';
        break;
    default:
        header('Location: /admin');
        exit;
}
