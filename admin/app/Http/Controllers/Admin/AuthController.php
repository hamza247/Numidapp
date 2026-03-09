<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (session('admin_logged_in')) {
            return redirect()->route('dashboard');
        }
        return view('login');
    }

    public function login(Request $request)
    {
        $username = $request->input('username');
        $password = $request->input('password');

        if (
            $username === config('admin.username') &&
            $password === config('admin.password')
        ) {
            session(['admin_logged_in' => true, 'admin_username' => $username]);
            return redirect()->route('dashboard');
        }

        return back()->withErrors(['credentials' => 'Invalid username or password.'])->withInput();
    }

    public function logout()
    {
        session()->forget(['admin_logged_in', 'admin_username']);
        return redirect()->route('login');
    }
}
