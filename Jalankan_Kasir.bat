@echo off
title Launcher Kasir Warung
echo ==============================================
echo       MEMULAI APLIKASI KASIR WARUNG
echo ==============================================
echo.

:: 1. Cek apakah Apache XAMPP sedang berjalan
tasklist /nh /fi "imagename eq httpd.exe" | find /i "httpd.exe" > nul
if %errorlevel% neq 0 (
    echo [INFO] Menyalakan Web Server Apache...
    if exist "D:\xampp\apache\bin\httpd.exe" (
        cd /d "D:\xampp\apache\bin"
        start /b httpd.exe
    ) else (
        echo [ERROR] Apache tidak ditemukan di D:\xampp\apache\bin\httpd.exe
        echo Silakan pastikan XAMPP terinstall di Drive D:
        pause
        exit
    )
) else (
    echo [INFO] Apache sudah berjalan.
)

:: 2. Cek apakah MySQL XAMPP sedang berjalan
tasklist /nh /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" > nul
if %errorlevel% neq 0 (
    echo [INFO] Menyalakan Database MySQL...
    if exist "D:\xampp\mysql\bin\mysqld.exe" (
        cd /d "D:\xampp\mysql\bin"
        start /b mysqld.exe
    ) else (
        echo [ERROR] MySQL tidak ditemukan di D:\xampp\mysql\bin\mysqld.exe
        echo Silakan pastikan XAMPP terinstall di Drive D:
        pause
        exit
    )
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
