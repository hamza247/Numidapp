@extends('layout')
@section('title', 'Settings')

@section('content')

<div class="grid grid-cols-2 gap-4 mb-5">
    {{-- App Settings (read-only info) --}}
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-4">App Configuration</h2>
        <div class="space-y-3">
            @foreach ([
                'Free Daily Searches' => $settings['free_daily_searches'],
                'Search Cost (coins)' => $settings['search_cost'],
                'Initial Coins (new users)' => $settings['initial_coins'],
                'Remove Phone Cost (coins)' => $settings['remove_phone_cost'],
            ] as $label => $value)
                <div class="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span class="text-sm text-gray-400">{{ $label }}</span>
                    <span class="text-sm font-semibold text-white">{{ $value }}</span>
                </div>
            @endforeach
        </div>
        <p class="mt-4 text-xs text-gray-600">These values are defined in the app source code. To change them, update the constants in <code class="text-gray-500">lib/coins.tsx</code>.</p>
    </div>

    {{-- Coin Stats --}}
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-4">Coin Statistics</h2>
        <div class="space-y-3">
            <div class="flex items-center justify-between py-2.5 border-b border-white/5">
                <span class="text-sm text-gray-400">Average balance per user</span>
                <span class="text-sm font-semibold text-yellow-400">{{ $stats['avg_coins'] }} coins</span>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-white/5">
                <span class="text-sm text-gray-400">Users with 0 coins</span>
                <span class="text-sm font-semibold text-white">{{ $stats['zero_coins'] }}</span>
            </div>
            @if ($stats['richest_user'])
                <div class="flex items-center justify-between py-2.5">
                    <span class="text-sm text-gray-400">Richest user</span>
                    <a href="{{ route('users.show', $stats['richest_user']->phone) }}" class="text-sm font-semibold text-[#00C9D4] hover:underline">
                        {{ $stats['richest_user']->full_name }} ({{ $stats['richest_user']->coins }})
                    </a>
                </div>
            @endif
        </div>
    </div>
</div>

<div class="grid grid-cols-3 gap-4">
    {{-- Grant Coins --}}
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-1">Grant Coins to User</h2>
        <p class="text-xs text-gray-500 mb-4">Add or subtract coins from a specific user account.</p>
        <form method="POST" action="{{ route('settings.update') }}" class="flex flex-col gap-3">
            @csrf
            <input type="hidden" name="action" value="grant_coins">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Phone Number</label>
                <input type="text" name="grant_phone" placeholder="e.g. 17734940397"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Amount (negative to deduct)</label>
                <input type="number" name="grant_amount" placeholder="e.g. 50"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <button type="submit" class="bg-[#00C9D4]/10 text-[#00C9D4] hover:bg-[#00C9D4]/20 rounded-xl py-2.5 text-sm font-medium transition-colors mt-1">
                Grant Coins
            </button>
        </form>
    </div>

    {{-- Reset All Coins --}}
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-white mb-1">Reset All Coins</h2>
        <p class="text-xs text-gray-500 mb-4">Set every user's coin balance to a specific amount. Use with caution.</p>
        <form method="POST" action="{{ route('settings.update') }}" class="flex flex-col gap-3" onsubmit="return confirm('Reset ALL users coin balances? This cannot be undone.')">
            @csrf
            <input type="hidden" name="action" value="reset_coins">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">New Balance for Everyone</label>
                <input type="number" name="reset_amount" placeholder="e.g. 5" min="0"
                    class="w-full bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
            </div>
            <button type="submit" class="bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 rounded-xl py-2.5 text-sm font-medium transition-colors mt-1">
                Reset All Balances
            </button>
        </form>
    </div>

    {{-- Danger: Clear Contacts --}}
    <div class="bg-[#0F1623] border border-red-500/10 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p class="text-xs text-gray-500 mb-4">Permanently delete all uploaded contacts from the database. Users will need to re-upload.</p>
        <form method="POST" action="{{ route('settings.update') }}" class="flex flex-col gap-3" onsubmit="return confirm('Delete ALL contacts from the database? This is irreversible.')">
            @csrf
            <input type="hidden" name="action" value="clear_contacts">
            <div>
                <label class="block text-xs text-gray-500 mb-1.5">Type CONFIRM to proceed</label>
                <input type="text" name="confirm_clear" placeholder="CONFIRM"
                    class="w-full bg-[#080C14] border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50">
            </div>
            <button type="submit" class="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl py-2.5 text-sm font-medium transition-colors mt-1">
                Clear All Contacts
            </button>
        </form>
    </div>
</div>

@endsection
