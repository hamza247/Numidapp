<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = $this->getSettings();
        $stats = [
            'avg_coins'    => round(DB::table('profiles')->avg('coins'), 1),
            'zero_coins'   => DB::table('profiles')->where('coins', 0)->count(),
            'richest_user' => DB::table('profiles')->orderByDesc('coins')->first(['full_name', 'phone', 'coins']),
        ];
        return view('settings.index', compact('settings', 'stats'));
    }

    public function update(Request $request)
    {
        $action = $request->input('action');

        if ($action === 'grant_coins') {
            $request->validate([
                'grant_phone' => 'required|string',
                'grant_amount' => 'required|integer|min:1|max:10000',
            ]);
            $phone = $request->input('grant_phone');
            $amount = (int) $request->input('grant_amount');
            $updated = DB::table('profiles')
                ->where('phone', $phone)
                ->update(['coins' => DB::raw("GREATEST(0, coins + {$amount})")]);

            if ($updated) {
                return back()->with('success', "Granted {$amount} coins to {$phone}.");
            }
            return back()->withErrors(['grant_phone' => 'Phone number not found.']);
        }

        if ($action === 'reset_coins') {
            $request->validate(['reset_amount' => 'required|integer|min:0|max:10000']);
            $amount = (int) $request->input('reset_amount');
            DB::table('profiles')->update(['coins' => $amount]);
            return back()->with('success', "All users reset to {$amount} coins.");
        }

        if ($action === 'clear_contacts') {
            $request->validate(['confirm_clear' => 'required|in:CONFIRM']);
            DB::table('contacts')->delete();
            return back()->with('success', 'All contacts cleared from the database.');
        }

        return back();
    }

    private function getSettings(): array
    {
        return [
            'free_daily_searches' => 5,
            'search_cost'         => 1,
            'initial_coins'       => 5,
            'remove_phone_cost'   => 3,
        ];
    }
}
