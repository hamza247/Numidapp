<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RemovedNumbersController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('removed_numbers')
            ->leftJoin('profiles', 'removed_numbers.phone', '=', 'profiles.phone')
            ->select(
                'removed_numbers.phone',
                'removed_numbers.removed_at',
                'profiles.full_name'
            )
            ->orderByDesc('removed_numbers.removed_at');

        if ($search = $request->input('search')) {
            $query->where('removed_numbers.phone', 'like', "%{$search}%");
        }

        $removed = $query->paginate(20)->withQueryString();
        return view('removed.index', compact('removed', 'search'));
    }

    public function restore(string $phone)
    {
        DB::table('removed_numbers')->where('phone', $phone)->delete();
        return back()->with('success', "Number {$phone} restored to search results.");
    }
}
