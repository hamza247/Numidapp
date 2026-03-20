<?php
$fields = [
    'twilio_enabled',
    'twilio_account_sid',
    'twilio_auth_token',
    'twilio_phone_number',
    'twilio_otp_expiry',
];
foreach ($fields as $f) {
    if (isset($_POST[$f])) {
        setSetting($db, $f, $_POST[$f]);
    }
}
$_SESSION['flash_success'] = "Twilio settings saved successfully.";
header("Location: /admin/twilio");
