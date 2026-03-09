<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('profiles')->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                  ->orWhere('full_name', 'ilike', "%{$search}%");
            });
        }

        $users = $query->paginate(20)->withQueryString();
        return view('users.index', compact('users', 'search'));
    }

    public function show(string $phone)
    {
        $user = DB::table('profiles')->where('phone', $phone)->first();
        if (!$user) abort(404);

        $contactCount = DB::table('contacts')->where('uploader_phone', $phone)->count();
        $contacts = DB::table('contacts')
            ->where('uploader_phone', $phone)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $isRemoved = DB::table('removed_numbers')->where('phone', $phone)->exists();

        return view('users.show', compact('user', 'contactCount', 'contacts', 'isRemoved'));
    }

    public function updateCoins(Request $request, string $phone)
    {
        $request->validate(['amount' => 'required|integer']);
        $amount = (int) $request->input('amount');

        DB::table('profiles')
            ->where('phone', $phone)
            ->update(['coins' => DB::raw("GREATEST(0, coins + {$amount})")]);

        return back()->with('success', 'Coins updated successfully.');
    }

    public function destroy(string $phone)
    {
        DB::table('contacts')->where('uploader_phone', $phone)->delete();
        DB::table('phone_verifications')->where('phone', $phone)->delete();
        DB::table('profiles')->where('phone', $phone)->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
