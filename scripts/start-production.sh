#!/bin/sh
php -S 0.0.0.0:8000 admin-panel/index.php &
node server_dist/index.js
