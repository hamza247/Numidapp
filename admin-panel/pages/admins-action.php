<?php
if (!$isSuperAdmin) {
    header('Location: /admin');
    exit;
}

$action = $_POST['action'] ?? '';

if ($action === 'create') {
    $username = trim($_POST['username'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = in_array($_POST['role'] ?? '', ['admin', 'super_admin']) ? $_POST['role'] : 'admin';

    if ($username === '' || $password === '') {
        $_SESSION['flash_error'] = 'Username and password are required.';
        header('Location: /admin/admins?add=1');
        exit;
    }
    if (strlen($password) < 8) {
        $_SESSION['flash_error'] = 'Password must be at least 8 characters.';
        header('Location: /admin/admins?add=1');
        exit;
    }
    $check = $db->prepare("SELECT COUNT(*) FROM admin_users WHERE username = :u");
    $check->execute(['u' => $username]);
    if ((int)$check->fetchColumn() > 0) {
        $_SESSION['flash_error'] = 'Username already exists.';
        header('Location: /admin/admins?add=1');
        exit;
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO admin_users (username, full_name, password_hash, role) VALUES (:u, :fn, :h, :r)");
    $stmt->execute(['u' => $username, 'fn' => $fullName, 'h' => $hash, 'r' => $role]);
    $_SESSION['flash_success'] = "Admin «{$username}» created successfully.";
    header('Location: /admin/admins');
    exit;
}

if ($action === 'update') {
    $id = (int)($_POST['id'] ?? 0);
    $username = trim($_POST['username'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($id === 0 || $username === '') {
        $_SESSION['flash_error'] = 'Invalid data.';
        header('Location: /admin/admins');
        exit;
    }

    $check = $db->prepare("SELECT COUNT(*) FROM admin_users WHERE username = :u AND id != :id");
    $check->execute(['u' => $username, 'id' => $id]);
    if ((int)$check->fetchColumn() > 0) {
        $_SESSION['flash_error'] = 'Username already taken by another account.';
        header("Location: /admin/admins?edit={$id}");
        exit;
    }

    if ($password !== '') {
        if (strlen($password) < 8) {
            $_SESSION['flash_error'] = 'Password must be at least 8 characters.';
            header("Location: /admin/admins?edit={$id}");
            exit;
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE admin_users SET username = :u, full_name = :fn, password_hash = :h WHERE id = :id");
        $stmt->execute(['u' => $username, 'fn' => $fullName, 'h' => $hash, 'id' => $id]);
    } else {
        $stmt = $db->prepare("UPDATE admin_users SET username = :u, full_name = :fn WHERE id = :id");
        $stmt->execute(['u' => $username, 'fn' => $fullName, 'id' => $id]);
    }

    if ($id != $currentAdminId && isset($_POST['role'])) {
        $role = in_array($_POST['role'], ['admin', 'super_admin']) ? $_POST['role'] : 'admin';
        if ($role === 'admin') {
            $superCount = (int)$db->query("SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin'")->fetchColumn();
            $thisRole = $db->prepare("SELECT role FROM admin_users WHERE id = :id");
            $thisRole->execute(['id' => $id]);
            $wasSuper = $thisRole->fetchColumn() === 'super_admin';
            if ($wasSuper && $superCount <= 1) {
                $_SESSION['flash_error'] = 'Cannot demote the only Super Admin. Promote another first.';
                header("Location: /admin/admins?edit={$id}");
                exit;
            }
        }
        $db->prepare("UPDATE admin_users SET role = :r WHERE id = :id")->execute(['r' => $role, 'id' => $id]);
    }

    if ($id == $currentAdminId) {
        $_SESSION['admin_username'] = $username;
    }

    $_SESSION['flash_success'] = "Admin account updated successfully.";
    header('Location: /admin/admins');
    exit;
}

if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id === 0) {
        header('Location: /admin/admins');
        exit;
    }
    if ($id == $currentAdminId) {
        $_SESSION['flash_error'] = 'You cannot delete your own account.';
        header('Location: /admin/admins');
        exit;
    }
    $stmt = $db->prepare("SELECT role FROM admin_users WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $targetRole = $stmt->fetchColumn();
    if ($targetRole === 'super_admin') {
        $superCount = (int)$db->query("SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin'")->fetchColumn();
        if ($superCount <= 1) {
            $_SESSION['flash_error'] = 'Cannot delete the only Super Admin.';
            header('Location: /admin/admins');
            exit;
        }
    }
    $db->prepare("DELETE FROM admin_users WHERE id = :id")->execute(['id' => $id]);
    $_SESSION['flash_success'] = 'Admin account deleted.';
    header('Location: /admin/admins');
    exit;
}

header('Location: /admin/admins');
exit;
