@extends('layout')
@section('title', 'Removed Numbers')

@section('content')

<div class="mb-4 p-4 rounded-xl bg-orange-400/5 border border-orange-400/10 text-sm text-orange-300">
    Numbers listed here are permanently blocked from appearing in search results. Restoring a number removes it from the blocklist.
</div>

<div class="flex items-center gap-3 mb-5">
    <form method="GET" class="flex-1 flex gap-3">
        <input type="text" name="search" value="{{ $search }}" placeholder="Search by phone number..."
            class="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
        <button type="submit" class="px-4 py-2.5 bg-[#00C9D4]/10 text-[#00C9D4] rounded-xl text-sm hover:bg-[#00C9D4]/20 transition-colors">Search</button>
        @if($search)
            <a href="{{ route('removed.index') }}" class="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Clear</a>
        @endif
    </form>
</div>

<div class="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full">
        <thead>
            <tr class="border-b border-white/5">
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Phone Number</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Registered Name</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Removed At</th>
                <th class="px-5 py-3.5"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
            @forelse ($removed as $item)
                <tr class="hover:bg-white/2 transition-colors">
                    <td class="px-5 py-4 text-sm text-white font-mono">+{{ $item->phone }}</td>
                    <td class="px-5 py-4 text-sm text-gray-400">{{ $item->full_name ?? '—' }}</td>
                    <td class="px-5 py-4 text-sm text-gray-500">{{ \Carbon\Carbon::parse($item->removed_at)->format('M d, Y H:i') }}</td>
                    <td class="px-5 py-4 text-right">
                        <form method="POST" action="{{ route('removed.restore', $item->phone) }}" onsubmit="return confirm('Restore +{{ $item->phone }} to search results?')">
                            @csrf
                            <button type="submit" class="text-xs text-[#00C9D4] hover:text-[#00b5bf] transition-colors">Restore</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500">No removed numbers.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if ($removed->hasPages())
        <div class="px-5 py-4 border-t border-white/5 flex items-center justify-between">
            <span class="text-sm text-gray-500">Showing {{ $removed->firstItem() }}–{{ $removed->lastItem() }} of {{ $removed->total() }}</span>
            <div class="flex gap-2">
                @if ($removed->onFirstPage())
                    <span class="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg">Previous</span>
                @else
                    <a href="{{ $removed->previousPageUrl() }}" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Previous</a>
                @endif
                @if ($removed->hasMorePages())
                    <a href="{{ $removed->nextPageUrl() }}" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Next</a>
                @else
                    <span class="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg">Next</span>
                @endif
            </div>
        </div>
    @endif
</div>
@endsection
