@extends('layout')
@section('title', $user->full_name)

@section('content')

<div class="mb-5">
    <a href="{{ route('users.index') }}" class="text-sm text-gray-500 hover:text-white flex items-center gap-1 transition-colors w-fit">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Users
    </a>
</div>

<div class="grid grid-cols-3 gap-4 mb-5">
    {{-- Profile card --}}
    <div class="col-span-2 bg-[#0F1623] border border-white/5 rounded-2xl p-6">
        <div class="flex items-start gap-4 mb-6">
            <div class="w-14 h-14 rounded-full bg-[#00C9D4]/10 flex items-center justify-center text-xl font-bold text-[#00C9D4]">
                {{ strtoupper(substr($user->full_name, 0, 1)) }}
            </div>
            <div>
                <h2 class="text-lg font-semibold text-white">{{ $user->full_name }}</h2>
                <p class="text-sm text-gray-400 font-mono">+{{ $user->phone }}</p>
                <p class="text-xs text-gray-500 mt-1">Joined {{ \Carbon\Carbon::parse($user->created_at)->format('F d, Y') }}</p>
            </div>
            @if ($isRemoved)
                <span class="ml-auto px-2.5 py-1 rounded-lg bg-orange-400/10 text-orange-400 text-xs font-medium">Number Hidden</span>
            @endif
        </div>

        <div class="grid grid-cols-3 gap-4">
            <div class="bg-[#080C14] rounded-xl p-4">
                <div class="text-xs text-gray-500 mb-1">Country</div>
                <div class="text-base font-semibold text-white">{{ $user->country_code }}</div>
            </div>
            <div class="bg-[#080C14] rounded-xl p-4">
                <div class="text-xs text-gray-500 mb-1">Contacts Uploaded</div>
                <div class="text-base font-semibold text-white">{{ number_format($contactCount) }}</div>
            </div>
            <div class="bg-[#080C14] rounded-xl p-4">
                <div class="text-xs text-gray-500 mb-1">Coin Balance</div>
                <div class="text-base font-semibold text-yellow-400">{{ $user->coins }} coins</div>
            </div>
        </div>
    </div>

    {{-- Actions --}}
    <div class="flex flex-col gap-3">
        {{-- Adjust coins --}}
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <h3 class="text-sm font-semibold text-white mb-3">Adjust Coins</h3>
            <form method="POST" action="{{ route('users.coins', $user->phone) }}" class="flex flex-col gap-3">
                @csrf
                <input type="number" name="amount" placeholder="e.g. 10 or -5"
                    class="bg-[#080C14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50 w-full">
                <button type="submit" class="bg-[#00C9D4]/10 text-[#00C9D4] hover:bg-[#00C9D4]/20 rounded-xl py-2.5 text-sm font-medium transition-colors">
                    Update Coins
                </button>
            </form>
        </div>

        {{-- Delete user --}}
        <div class="bg-[#0F1623] border border-red-500/10 rounded-2xl p-5">
            <h3 class="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
            <form method="POST" action="{{ route('users.destroy', $user->phone) }}" onsubmit="return confirm('Delete this user and all their contacts? This cannot be undone.')">
                @csrf
                @method('DELETE')
                <button type="submit" class="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl py-2.5 text-sm font-medium transition-colors">
                    Delete Account
                </button>
            </form>
        </div>
    </div>
</div>

{{-- Recent contacts --}}
@if ($contacts->count())
<div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
    <h3 class="text-sm font-semibold text-white mb-4">Uploaded Contacts (showing first 50)</h3>
    <div class="grid grid-cols-2 gap-2">
        @foreach ($contacts as $contact)
            <div class="flex items-center gap-3 bg-[#080C14] rounded-xl px-3.5 py-3">
                <div class="w-7 h-7 rounded-full bg-purple-400/10 flex items-center justify-center text-xs text-purple-400">
                    {{ strtoupper(substr($contact->stored_name, 0, 1)) }}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-sm text-white truncate">{{ $contact->stored_name }}</div>
                    <div class="text-xs text-gray-500 font-mono">{{ $contact->stored_number }}</div>
                </div>
                <span class="text-xs text-gray-600">{{ $contact->label }}</span>
            </div>
        @endforeach
    </div>
</div>
@endif

@endsection
