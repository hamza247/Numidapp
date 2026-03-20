<?php
$action = $_POST['action'] ?? '';

function upsertSetting(PDO $db, string $key, string $value): void {
    $stmt = $db->prepare(
        "INSERT INTO app_settings (key, value) VALUES (:k, :v)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
    );
    $stmt->execute(['k' => $key, 'v' => $value]);
}

function deleteSetting(PDO $db, string $key): void {
    $db->prepare("DELETE FROM app_settings WHERE key = :k")->execute(['k' => $key]);
}

function imageToDataUri(array $file): ?string {
    if ($file['error'] !== UPLOAD_ERR_OK) return null;
    if ($file['size'] > 2 * 1024 * 1024) return null;
    $mime = mime_content_type($file['tmp_name']);
    $allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/gif'];
    if (!in_array($mime, $allowedMimes)) return null;
    $data = file_get_contents($file['tmp_name']);
    return 'data:' . $mime . ';base64,' . base64_encode($data);
}

switch ($action) {
    case 'save_identity':
        upsertSetting($db, 'app_name', trim($_POST['app_name'] ?? ''));
        break;

    case 'save_seo':
        upsertSetting($db, 'site_title',       trim($_POST['site_title'] ?? ''));
        upsertSetting($db, 'meta_description',  trim($_POST['meta_description'] ?? ''));
        upsertSetting($db, 'meta_keywords',     trim($_POST['meta_keywords'] ?? ''));
        upsertSetting($db, 'og_title',          trim($_POST['og_title'] ?? ''));
        upsertSetting($db, 'og_description',    trim($_POST['og_description'] ?? ''));
        break;

    case 'save_hero':
        upsertSetting($db, 'hero_title',    trim($_POST['hero_title'] ?? ''));
        upsertSetting($db, 'hero_subtitle', trim($_POST['hero_subtitle'] ?? ''));
        break;

    case 'save_store_links':
        upsertSetting($db, 'ios_app_url',     trim($_POST['ios_app_url'] ?? ''));
        upsertSetting($db, 'android_app_url', trim($_POST['android_app_url'] ?? ''));
        upsertSetting($db, 'download_note',   trim($_POST['download_note'] ?? ''));
        break;

    case 'save_footer':
        upsertSetting($db, 'footer_email',     trim($_POST['footer_email'] ?? ''));
        upsertSetting($db, 'footer_tagline',   trim($_POST['footer_tagline'] ?? ''));
        upsertSetting($db, 'footer_copyright', trim($_POST['footer_copyright'] ?? ''));
        break;

    case 'upload_logo':
        if (!empty($_FILES['logo_file'])) {
            $dataUri = imageToDataUri($_FILES['logo_file']);
            if ($dataUri) {
                upsertSetting($db, 'landing_logo_base64', $dataUri);
            }
        }
        break;

    case 'remove_logo':
        deleteSetting($db, 'landing_logo_base64');
        break;

    case 'upload_favicon':
        if (!empty($_FILES['favicon_file'])) {
            $dataUri = imageToDataUri($_FILES['favicon_file']);
            if ($dataUri) {
                upsertSetting($db, 'landing_favicon_base64', $dataUri);
            }
        }
        break;

    case 'remove_favicon':
        deleteSetting($db, 'landing_favicon_base64');
        break;
}

$_SESSION['flash_success'] = 'Branding settings saved.';
header('Location: /admin/branding');
exit;
