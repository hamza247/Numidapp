<?php
session_start();

// ── Load .env from project root ──────────────────────────────────────────────
$envFile = __DIR__ . '/../.env';
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim(trim($v), '"\'');
        if ($k !== '') putenv("$k=$v");
    }
}

// ── Connect using DATABASE_URL ────────────────────────────────────────────────
// .env is loaded above; getenv() now returns the .env value if set there.
// If .env is absent (e.g. dev), Replit's managed DATABASE_URL is used instead.
$databaseUrl = getenv('DATABASE_URL');
if (!$databaseUrl) {
    http_response_code(500);
    die('<h2>Configuration error</h2><p>DATABASE_URL is not set. Add it to your .env file.</p>');
}

function buildDsn(string $url): array {
    $p = parse_url($url);
    $host   = $p['host'] ?? 'localhost';
    $port   = $p['port'] ?? 5432;
    $dbname = ltrim($p['path'] ?? '/postgres', '/');
    $user   = urldecode($p['user'] ?? '');
    $pass   = urldecode($p['pass'] ?? '');
    $ssl    = '';
    if (!empty($p['query'])) {
        parse_str($p['query'], $qp);
        if (!empty($qp['sslmode']) && $qp['sslmode'] !== 'disable') {
            $ssl = ";sslmode={$qp['sslmode']}";
        }
    }
    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}{$ssl}";
    return [$dsn, $user, $pass];
}

[$dsn, $dbUser, $dbPass] = buildDsn($databaseUrl);

$db = null;
$lastError = '';

// Try primary URL (from .env)
try {
    $db = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]);
} catch (PDOException $e) {
    $lastError = $e->getMessage();
}

// If primary failed and we have PGHOST set (Replit dev fallback), try that
if (!$db && getenv('PGHOST') && getenv('PGHOST') !== 'localhost') {
    $devUrl = sprintf(
        'postgresql://%s:%s@%s:%s/%s',
        getenv('PGUSER') ?: 'postgres',
        getenv('PGPASSWORD') ?: '',
        getenv('PGHOST'),
        getenv('PGPORT') ?: 5432,
        getenv('PGDATABASE') ?: 'postgres'
    );
    [$dsnDev, $devUser, $devPass] = buildDsn($devUrl);
    try {
        $db = new PDO($dsnDev, $devUser, $devPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]);
    } catch (PDOException $e2) {
        $lastError = $e2->getMessage();
    }
}

if (!$db) {
    http_response_code(500);
    die('<h2>Database connection failed</h2><p>Check DATABASE_URL in your .env file.</p><pre>' . htmlspecialchars($lastError) . '</pre>');
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
