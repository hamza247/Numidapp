<?php
$fields = [
    'ads_enabled', 'ad_provider', 'admob_app_id',
    'admob_banner_android', 'admob_banner_ios',
    'admob_interstitial_android', 'admob_interstitial_ios',
    'admob_rewarded_android', 'admob_rewarded_ios',
    'custom_banner_url', 'custom_banner_link',
    'ad_frequency', 'rewarded_coin_amount',
];
foreach ($fields as $f) {
    if (isset($_POST[$f])) {
        setSetting($db, $f, $_POST[$f]);
    }
}
$_SESSION['flash_success'] = "Ad settings saved successfully.";
header("Location: /admin/admob");
