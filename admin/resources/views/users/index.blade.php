@extends('layout')
@section('title', 'Users')

@section('content')

<div class="flex items-center gap-3 mb-5">
    <form method="GET" class="flex-1 flex gap-3">
        <input type="text" name="search" value="{{ $search }}" placeholder="Search by name or phone..."
            class="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
        <button type="submit" class="px-4 py-2.5 bg-[#00C9D4]/10 text-[#00C9D4] rounded-xl text-sm hover:bg-[#00C9D4]/20 transition-colors">Search</button>
        @if($search)
            <a href="{{ route('users.index') }}" class="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Clear</a>
        @endif
    </form>
</div>

<div class="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full">
        <thead>
            <tr class="border-b border-white/5">
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">User</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Phone</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Country</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Coins</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Joined</th>
                <th class="px-5 py-3.5"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
            @forelse ($users as $user)
                <tr class="hover:bg-white/2 transition-colors">
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-[#00C9D4]/10 flex items-center justify-center text-xs font-semibold text-[#00C9D4]">
                                {{ strtoupper(substr($user->full_name, 0, 1)) }}
                            </div>
                            <span class="text-sm text-white">{{ $user->full_name }}</span>
                        </div>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-400 font-mono">+{{ $user->phone }}</td>
                    <td class="px-5 py-4 text-sm text-gray-400">{{ $user->country_code }}</td>
                    <td class="px-5 py-4">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-semibold">
                            {{ $user->coins }}
                        </span>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-500">{{ \Carbon\Carbon::parse($user->created_at)->format('M d, Y') }}</td>
                    <td class="px-5 py-4 text-right">
                        <a href="{{ route('users.show', $user->phone) }}" class="text-xs text-[#00C9D4] hover:underline">View</a>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">No users found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if ($users->hasPages())
        <div class="px-5 py-4 border-t border-white/5 flex items-center justify-between">
            <span class="text-sm text-gray-500">
                Showing {{ $users->firstItem() }}–{{ $users->lastItem() }} of {{ $users->total() }}
            </span>
            <div class="flex gap-2">
                @if ($users->onFirstPage())
                    <span class="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg">Previous</span>
                @else
                    <a href="{{ $users->previousPageUrl() }}" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Previous</a>
                @endif
                @if ($users->hasMorePages())
                    <a href="{{ $users->nextPageUrl() }}" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Next</a>
                @else
                    <span class="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg">Next</span>
                @endif
            </div>
        </div>
    @endif
</div>

@endsection
