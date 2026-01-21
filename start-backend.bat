@echo off
echo ========================================
echo PBL by GyanSetu - Starting Backend
echo ========================================
echo.

cd server
echo Installing dependencies...
call npm install
echo.

echo Starting backend server...
echo Backend will run on http://localhost:5000
echo.
call npm run dev
