@echo off
title Launcher Kasir Warung
echo ==============================================
echo       MEMULAI APLIKASI KASIR WARUNG
echo ==============================================
echo.

:: Tentukan lokasi XAMPP secara otomatis (Cari di D:, E:, atau C:)
set "XAMPP_PATH="
if exist "D:\xampp\apache\bin\httpd.exe" (
    set "XAMPP_PATH=D:\xampp"
) else if exist "E:\xampp\apache\bin\httpd.exe" (
    set "XAMPP_PATH=E:\xampp"
) else if exist "C:\xampp\apache\bin\httpd.exe" (
    set "XAMPP_PATH=C:\xampp"
)

if "%XAMPP_PATH%"=="" (
    echo [ERROR] Folder instalasi XAMPP tidak ditemukan di Drive C:, D:, atau E:!
    echo Silakan pastikan XAMPP terinstall di salah satu drive tersebut.
    pause
    exit
)

echo [INFO] XAMPP terdeteksi di: %XAMPP_PATH%
echo.

:: 1. Cek apakah Apache XAMPP sedang berjalan
tasklist /nh /fi "imagename eq httpd.exe" | find /i "httpd.exe" > nul
if %errorlevel% neq 0 (
    echo [INFO] Menyalakan Web Server Apache...
    cd /d "%XAMPP_PATH%\apache\bin"
    start /b httpd.exe
) else (
    echo [INFO] Apache sudah berjalan.
)

:: 2. Cek apakah MySQL XAMPP sedang berjalan
tasklist /nh /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" > nul
if %errorlevel% neq 0 (
    echo [INFO] Menyalakan Database MySQL...
    cd /d "%XAMPP_PATH%\mysql\bin"
    start /b mysqld.exe
) else (
    echo [INFO] MySQL sudah berjalan.
)

:: 3. Tunggu sebentar agar server siap
echo [INFO] Menunggu server siap...
timeout /t 3 /nobreak >nul

:: 4. Buka Browser
echo [INFO] Membuka Aplikasi Kasir...
start "" "http://localhost/kasirwarung/backend/public/"

echo ==============================================
echo    Aplikasi Kasir Warung Berhasil Dijalankan
echo ==============================================
exit
