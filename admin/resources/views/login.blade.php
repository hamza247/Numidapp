<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login — Who Saved Me</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { darkMode: 'class' }</script>
</head>
<body class="bg-[#080C14] min-h-screen flex items-center justify-center">
    <div class="w-full max-w-sm px-6">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00C9D4]/10 border border-[#00C9D4]/20 mb-4">
                <svg class="w-8 h-8 text-[#00C9D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
            <p class="text-gray-500 text-sm mt-1">Who Saved Me</p>
        </div>

        <div class="bg-[#0F1623] rounded-2xl border border-white/5 p-6">
            @if ($errors->has('credentials'))
                <div class="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {{ $errors->first('credentials') }}
                </div>
            @endif

            <form method="POST" action="{{ route('login.post') }}">
                @csrf
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-1.5">Username</label>
                    <input
                        type="text"
                        name="username"
                        value="{{ old('username') }}"
                        class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors"
                        placeholder="admin"
                        autofocus
                    >
                </div>
                <div class="mb-6">
                    <label class="block text-sm text-gray-400 mb-1.5">Password</label>
                    <input
                        type="password"
                        name="password"
                        class="w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 transition-colors"
                        placeholder="••••••••"
                    >
                </div>
                <button type="submit" class="w-full bg-[#00C9D4] hover:bg-[#00b5bf] text-black font-semibold py-3 rounded-xl transition-colors">
                    Sign In
                </button>
            </form>
        </div>
    </div>
</body>
</html>
