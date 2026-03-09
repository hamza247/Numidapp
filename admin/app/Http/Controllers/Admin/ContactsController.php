<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactsController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('contacts')
            ->leftJoin('profiles', 'contacts.uploader_phone', '=', 'profiles.phone')
            ->select(
                'contacts.id',
                'contacts.uploader_phone',
                'contacts.stored_number',
                'contacts.stored_name',
                'contacts.label',
                'contacts.created_at',
                'profiles.full_name as uploader_name'
            )
            ->orderByDesc('contacts.created_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('contacts.stored_number', 'like', "%{$search}%")
                  ->orWhere('contacts.stored_name', 'ilike', "%{$search}%")
                  ->orWhere('contacts.uploader_phone', 'like', "%{$search}%");
            });
        }

        $contacts = $query->paginate(30)->withQueryString();
        return view('contacts.index', compact('contacts', 'search'));
    }

    public function destroy(int $id)
    {
        DB::table('contacts')->where('id', $id)->delete();
        return back()->with('success', 'Contact removed.');
    }
}
