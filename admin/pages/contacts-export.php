<?php
$search = $_GET['search'] ?? '';

$where = '';
$params = [];
if ($search) {
    $where = "WHERE c.stored_number LIKE :s1 OR c.stored_name ILIKE :s2 OR c.uploader_phone LIKE :s3";
    $params = ['s1' => "%$search%", 's2' => "%$search%", 's3' => "%$search%"];
}

$sql = "SELECT c.stored_name, c.stored_number, c.label, c.uploader_phone, p.full_name as uploader_name, c.created_at FROM contacts c LEFT JOIN profiles p ON c.uploader_phone = p.phone $where ORDER BY c.created_at DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$filename = 'contacts_export_' . date('Y-m-d_His');
if ($search) {
    $filename .= '_filtered';
}
$filename .= '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

$output = fopen('php://output', 'w');

fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

fputcsv($output, ['Saved Name', 'Phone Number', 'Label', 'Uploaded By (Phone)', 'Uploaded By (Name)', 'Date Added']);

function sanitizeCsvCell($val) {
    $val = (string)$val;
    if (strlen($val) > 0 && in_array($val[0], ['=', '+', '-', '@', "\t", "\r"])) {
        $val = "'" . $val;
    }
    return $val;
}

foreach ($contacts as $c) {
    fputcsv($output, [
        sanitizeCsvCell($c['stored_name']),
        sanitizeCsvCell($c['stored_number']),
        sanitizeCsvCell($c['label'] ?? ''),
        sanitizeCsvCell($c['uploader_phone']),
        sanitizeCsvCell($c['uploader_name'] ?? ''),
        date('Y-m-d H:i:s', strtotime($c['created_at'])),
    ]);
}

fclose($output);
