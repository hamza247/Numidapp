<?php
$action = $_POST['action'] ?? '';

if ($action === 'toggle_maintenance') {
    $val = $_POST['maintenance_mode'] ?? '0';
    setSetting($db, 'maintenance_mode', $val);
    $_SESSION['flash_success'] = $val === '1' ? "Maintenance mode enabled." : "Maintenance mode disabled.";
    header("Location: /admin/settings");
    exit;
}

if ($action === 'grant_coins') {
    $phone = $_POST['grant_phone'] ?? '';
    $amount = (int)($_POST['grant_amount'] ?? 0);
    if ($phone && $amount > 0) {
        $stmt = $db->prepare("UPDATE profiles SET coins = GREATEST(0, coins + :amt) WHERE phone = :phone");
        $stmt->execute(['amt' => $amount, 'phone' => $phone]);
        if ($stmt->rowCount()) {
            $_SESSION['flash_success'] = "Granted {$amount} coins to {$phone}.";
        } else {
            $_SESSION['flash_success'] = "Phone number not found.";
        }
    }
}

if ($action === 'reset_coins') {
    $amount = (int)($_POST['reset_amount'] ?? 0);
    $db->prepare("UPDATE profiles SET coins = :amt")->execute(['amt' => $amount]);
    $_SESSION['flash_success'] = "All users reset to {$amount} coins.";
}

if ($action === 'save_app_config') {
    $fields = ['free_daily_searches', 'search_cost', 'reveal_cost', 'initial_coins', 'remove_phone_cost'];
    foreach ($fields as $f) {
        if (isset($_POST[$f])) {
            setSetting($db, $f, (string)(int)$_POST[$f]);
        }
    }
    $_SESSION['flash_success'] = "App configuration saved successfully.";
    header("Location: /admin/settings");
    exit;
}

if ($action === 'clear_contacts') {
    $confirm = $_POST['confirm_clear'] ?? '';
    if ($confirm === 'CONFIRM') {
        $db->exec("DELETE FROM contacts");
        $_SESSION['flash_success'] = "All contacts cleared from the database.";
    } else {
        $_SESSION['flash_success'] = "You must type CONFIRM to proceed.";
    }
}

header("Location: /admin/settings");
