<?php
session_start();

// Prefer Replit's individual PG* variables (always correct, even if DATABASE_URL is overridden).
// Fall back to parsing DATABASE_URL only when PG* vars are absent.
$dbHost = getenv('PGHOST')  ?: "localhost";
$dbPort = getenv('PGPORT')  ?: 5000;
$dbName = getenv('PGDATABASE') ?: "neondb";
$dbUser = getenv('PGUSER')  ?: "neondb_owner";
$dbPass = getenv('PGPASSWORD') ?: "Admin123456";

if (!$dbHost || !$dbUser) {
    // Fall back to DATABASE_URL
    $databaseUrl = getenv('DATABASE_URL');
    if (!$databaseUrl) {
        http_response_code(500);
        die('<h2>Configuration error</h2><p>Neither PG* variables nor DATABASE_URL are set.</p>');
    }
    $parsed = parse_url($databaseUrl);
    $dbHost = $dbHost ?: ($parsed['host'] ?? 'localhost');
    $dbPort = $dbPort ?: ($parsed['port'] ?? 5432);
    $dbName = $dbName ?: ltrim($parsed['path'] ?? '/postgres', '/');
    $dbUser = $dbUser ?: urldecode($parsed['user'] ?? '');
    $dbPass = $dbPass ?? urldecode($parsed['pass'] ?? '');
}

$dbPort = $dbPort ?: 5432;
$dbName = $dbName ?: 'postgres';

// Detect sslmode from DATABASE_URL query string if present
$sslPart = '';
$databaseUrl = $databaseUrl ?? getenv('DATABASE_URL');
if ($databaseUrl) {
    $parsedUrl = parse_url($databaseUrl);
    if (!empty($parsedUrl['query'])) {
        parse_str($parsedUrl['query'], $qp);
        if (!empty($qp['sslmode']) && $qp['sslmode'] !== 'disable') {
            $sslPart = ";sslmode={$qp['sslmode']}";
        }
    }
}

$dsn = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}{$sslPart}";

try {
    $db = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE  => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT  => 10,
    ]);
} catch (PDOException $e) {
    // Retry without SSL restriction
    try {
        $dsnNoSsl = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName};sslmode=disable";
        $db = new PDO($dsnNoSsl, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE  => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT  => 10,
        ]);
    } catch (PDOException $e2) {
        http_response_code(500);
        die('<h2>Database connection failed</h2><pre>' . htmlspecialchars($e2->getMessage()) . '</pre>');
    }
}

$db->exec("CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
)");

$db->exec("CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    full_name VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
)");

function getSetting(PDO $db, string $key, string $default = ''): string {
    $stmt = $db->prepare("SELECT value FROM app_settings WHERE key = :k");
    $stmt->execute(['k' => $key]);
    $val = $stmt->fetchColumn();
    return $val !== false ? $val : $default;
}

function setSetting(PDO $db, string $key, string $value): void {
    $stmt = $db->prepare("
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (:k, :v, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = :v2, updated_at = NOW()
    ");
    $stmt->execute(['k' => $key, 'v' => $value, 'v2' => $value]);
}

require_once __DIR__ . '/includes/phone-country.php';

$envAdminUser = '';
$envAdminPass = '';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/') ?: '/admin';

$publicPages = ['/admin/login'];
$loggedIn = !empty($_SESSION['admin_logged_in']);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $uri === '/admin/login') {
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';

    $adminRow = null;
    if ($u !== '') {
        $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = :u LIMIT 1");
        $stmt->execute(['u' => $u]);
        $adminRow = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $authenticated = false;
    $role = 'admin';
    $adminId = null;

    if ($adminRow && password_verify($p, $adminRow['password_hash'])) {
        $authenticated = true;
        $role = $adminRow['role'];
        $adminId = $adminRow['id'];
        $db->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = :id")->execute(['id' => $adminId]);
    } elseif ($u === $envAdminUser && $p === $envAdminPass) {
        $authenticated = true;
        $role = 'super_admin';
    }

    if ($authenticated) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $u;
        $_SESSION['admin_role'] = $role;
        $_SESSION['admin_id'] = $adminId;
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

$currentAdminRole = $_SESSION['admin_role'] ?? 'admin';
$isSuperAdmin = $currentAdminRole === 'super_admin';
$currentAdminId = $_SESSION['admin_id'] ?? null;

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
    case $uri === '/admin/twilio':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/twilio-action.php';
            exit;
        }
        include __DIR__ . '/pages/twilio.php';
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
    case $uri === '/admin/coin-store':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/coin-store-action.php';
            exit;
        }
        include __DIR__ . '/pages/coin-store.php';
        break;
    case $uri === '/admin/admins':
        if (!$isSuperAdmin) { header('Location: /admin'); exit; }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/admins-action.php';
            exit;
        }
        include __DIR__ . '/pages/admins.php';
        break;
    case $uri === '/admin/branding':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            include __DIR__ . '/pages/branding-action.php';
            exit;
        }
        include __DIR__ . '/pages/branding.php';
        break;
    default:
        header('Location: /admin');
        exit;
}
