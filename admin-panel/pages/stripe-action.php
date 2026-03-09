<?php
$fields = [
    'stripe_enabled', 'stripe_mode', 'stripe_pk_test', 'stripe_sk_test',
    'stripe_pk_live', 'stripe_sk_live', 'stripe_webhook_secret',
    'stripe_currency', 'stripe_coin_price', 'stripe_coin_amount',
];
foreach ($fields as $f) {
    if (isset($_POST[$f])) {
        setSetting($db, $f, $_POST[$f]);
    }
}
$_SESSION['flash_success'] = "Stripe settings saved successfully.";
header("Location: /admin/stripe");
