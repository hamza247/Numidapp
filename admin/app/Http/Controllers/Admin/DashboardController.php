<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users'   => DB::table('profiles')->count(),
            'total_contacts' => DB::table('contacts')->count(),
            'removed_numbers' => DB::table('removed_numbers')->count(),
            'total_coins'   => DB::table('profiles')->sum('coins'),
        ];

        $recentUsers = DB::table('profiles')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['full_name', 'phone', 'country_code', 'coins', 'created_at']);

        $topUploaders = DB::table('contacts')
            ->select('uploader_phone', DB::raw('count(*) as contact_count'))
            ->groupBy('uploader_phone')
            ->orderByDesc('contact_count')
            ->limit(5)
            ->get();

        return view('dashboard', compact('stats', 'recentUsers', 'topUploaders'));
    }
}
