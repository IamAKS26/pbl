@echo off
echo ========================================
echo PBL by GyanSetu - Starting Frontend
echo ========================================
echo.

cd client
echo Installing dependencies...
call npm install
echo.

echo Starting frontend...
echo Frontend will run on http://localhost:3000
echo.
call npm run dev
