@extends('layout')
@section('title', 'Contacts')

@section('content')

<div class="flex items-center gap-3 mb-5">
    <form method="GET" class="flex-1 flex gap-3">
        <input type="text" name="search" value="{{ $search }}" placeholder="Search by number, name, or uploader..."
            class="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00C9D4]/50">
        <button type="submit" class="px-4 py-2.5 bg-[#00C9D4]/10 text-[#00C9D4] rounded-xl text-sm hover:bg-[#00C9D4]/20 transition-colors">Search</button>
        @if($search)
            <a href="{{ route('contacts.index') }}" class="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Clear</a>
        @endif
    </form>
</div>

<div class="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full">
        <thead>
            <tr class="border-b border-white/5">
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Saved Name</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Stored Number</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Label</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Uploaded By</th>
                <th class="text-left px-5 py-3.5 text-xs text-gray-500 uppercase tracking-wider font-medium">Date</th>
                <th class="px-5 py-3.5"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
            @forelse ($contacts as $contact)
                <tr class="hover:bg-white/2 transition-colors">
                    <td class="px-5 py-3.5 text-sm text-white">{{ $contact->stored_name }}</td>
                    <td class="px-5 py-3.5 text-sm text-gray-400 font-mono">{{ $contact->stored_number }}</td>
                    <td class="px-5 py-3.5">
                        <span class="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-400">{{ $contact->label }}</span>
                    </td>
                    <td class="px-5 py-3.5">
                        <a href="{{ route('users.show', $contact->uploader_phone) }}" class="text-sm text-[#00C9D4] hover:underline">
                            {{ $contact->uploader_name ?? $contact->uploader_phone }}
                        </a>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-gray-500">{{ \Carbon\Carbon::parse($contact->created_at)->format('M d, Y') }}</td>
                    <td class="px-5 py-3.5 text-right">
                        <form method="POST" action="{{ route('contacts.destroy', $contact->id) }}" onsubmit="return confirm('Remove this contact entry?')">
                            @csrf @method('DELETE')
                            <button type="submit" class="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500">No contacts found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if ($contacts->hasPages())
        <div class="px-5 py-4 border-t border-white/5 flex items-center justify-between">
            <span class="text-sm text-gray-500">Showing {{ $contacts->firstItem() }}–{{ $contacts->lastItem() }} of {{ $contacts->total() }}</span>
            <div class="flex gap-2">
                @if ($contacts->onFirstPage())
                    <span class="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg">Previous</span>
                @else
                    <a href="{{ $contacts->previousPageUrl() }}" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Previous</a>
                @endif
                @if ($contacts->hasMorePages())
                    <a href="{{ $contacts->nextPageUrl() }}" class="px-3 py-1.5 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg">Next</a>
                @else
                    <span class="px-3 py-1.5 text-xs text-gray-600 bg-white/5 rounded-lg">Next</span>
                @endif
            </div>
        </div>
    @endif
</div>
@endsection
