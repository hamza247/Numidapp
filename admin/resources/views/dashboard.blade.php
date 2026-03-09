@extends('layout')
@section('title', 'Overview')

@section('content')

{{-- Stat cards --}}
<div class="grid grid-cols-4 gap-4 mb-6">
    @php
        $cards = [
            ['label' => 'Total Users', 'value' => number_format($stats['total_users']), 'color' => '#00C9D4', 'icon' => 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
            ['label' => 'Total Contacts', 'value' => number_format($stats['total_contacts']), 'color' => '#a78bfa', 'icon' => 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
            ['label' => 'Removed Numbers', 'value' => number_format($stats['removed_numbers']), 'color' => '#fb923c', 'icon' => 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'],
            ['label' => 'Coins in Circulation', 'value' => number_format($stats['total_coins']), 'color' => '#FFD700', 'icon' => 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
        ];
    @endphp

    @foreach ($cards as $card)
        <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
                <span class="text-xs text-gray-500 uppercase tracking-wider">{{ $card['label'] }}</span>
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:{{ $card['color'] }}18">
                    <svg class="w-4 h-4" style="color:{{ $card['color'] }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $card['icon'] }}"/>
                    </svg>
                </div>
            </div>
            <div class="text-2xl font-bold text-white">{{ $card['value'] }}</div>
        </div>
    @endforeach
</div>

<div class="grid grid-cols-2 gap-4">
    {{-- Recent Users --}}
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-white">Recent Users</h2>
            <a href="{{ route('users.index') }}" class="text-xs text-[#00C9D4] hover:underline">View all</a>
        </div>
        <div class="space-y-3">
            @forelse ($recentUsers as $user)
                <a href="{{ route('users.show', $user->phone) }}" class="flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-full bg-[#00C9D4]/10 flex items-center justify-center text-sm font-semibold text-[#00C9D4]">
                        {{ strtoupper(substr($user->full_name, 0, 1)) }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm text-white truncate group-hover:text-[#00C9D4] transition-colors">{{ $user->full_name }}</div>
                        <div class="text-xs text-gray-500">+{{ $user->phone }}</div>
                    </div>
                    <div class="flex items-center gap-1 text-xs text-yellow-400">
                        <span>{{ $user->coins }}</span>
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                </a>
            @empty
                <p class="text-sm text-gray-500">No users yet.</p>
            @endforelse
        </div>
    </div>

    {{-- Top Uploaders --}}
    <div class="bg-[#0F1623] border border-white/5 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-white">Top Contact Uploaders</h2>
            <a href="{{ route('contacts.index') }}" class="text-xs text-[#00C9D4] hover:underline">View all</a>
        </div>
        <div class="space-y-3">
            @forelse ($topUploaders as $i => $uploader)
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs text-gray-400 font-mono">
                        {{ $i + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm text-white font-mono">+{{ $uploader->uploader_phone }}</div>
                    </div>
                    <div class="text-sm text-[#00C9D4] font-semibold">{{ number_format($uploader->contact_count) }}</div>
                </div>
            @empty
                <p class="text-sm text-gray-500">No contacts uploaded yet.</p>
            @endforelse
        </div>
    </div>
</div>

@endsection
