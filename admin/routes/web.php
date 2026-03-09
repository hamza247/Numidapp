<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\Admin\ContactsController;
use App\Http\Controllers\Admin\RemovedNumbersController;
use App\Http\Controllers\Admin\SettingsController;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('admin.auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UsersController::class, 'index'])->name('index');
        Route::get('/{phone}', [UsersController::class, 'show'])->name('show');
        Route::post('/{phone}/coins', [UsersController::class, 'updateCoins'])->name('coins');
        Route::delete('/{phone}', [UsersController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('contacts')->name('contacts.')->group(function () {
        Route::get('/', [ContactsController::class, 'index'])->name('index');
        Route::delete('/{id}', [ContactsController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('removed-numbers')->name('removed.')->group(function () {
        Route::get('/', [RemovedNumbersController::class, 'index'])->name('index');
        Route::post('/{phone}/restore', [RemovedNumbersController::class, 'restore'])->name('restore');
    });

    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::post('/', [SettingsController::class, 'update'])->name('update');
    });
});
