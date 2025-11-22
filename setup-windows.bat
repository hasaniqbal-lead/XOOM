@echo off
REM XOOM Ride-Hailing App - Windows Setup Script
REM This script automates the complete setup process for Windows machines

echo.
echo ========================================
echo    XOOM Ride-Hailing App Setup
echo    Windows Installation Script
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)
echo [OK] Node.js is installed
node --version

REM Check if npm is installed
echo.
echo [2/8] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    echo npm should come with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
)
echo [OK] npm is installed
npm --version

REM Check if PostgreSQL is installed
echo.
echo [3/8] Checking PostgreSQL installation...
psql --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL is not installed!
    echo Please download and install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo Recommended version: 14.x or higher
    echo.
    echo After installation, make sure to:
    echo   1. Remember your PostgreSQL superuser (postgres) password
    echo   2. Add PostgreSQL bin directory to PATH
    echo   3. Restart this script
    pause
    exit /b 1
)
echo [OK] PostgreSQL is installed
psql --version

REM Install backend dependencies
echo.
echo [4/8] Installing backend dependencies...
cd backend
if exist "package.json" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed
) else (
    echo [ERROR] backend/package.json not found
    pause
    exit /b 1
)
cd ..

REM Install frontend dependencies
echo.
echo [5/8] Installing frontend dependencies...
cd frontend
if exist "package.json" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed
) else (
    echo [ERROR] frontend/package.json not found
    pause
    exit /b 1
)
cd ..

REM Setup environment files
echo.
echo [6/8] Setting up environment files...

REM Backend .env
if not exist "backend\.env" (
    echo Creating backend/.env from template...
    copy backend\.env.example backend\.env >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Could not create backend/.env automatically
        echo Please copy backend/.env.example to backend/.env manually
    ) else (
        echo [OK] backend/.env created
        echo [INFO] Edit backend/.env to configure your database credentials
    )
) else (
    echo [OK] backend/.env already exists
)

REM Frontend .env
if not exist "frontend\.env" (
    echo Creating frontend/.env...
    echo VITE_API_URL=http://localhost:3000 > frontend\.env
    echo [OK] frontend/.env created
) else (
    echo [OK] frontend/.env already exists
)

REM Setup database
echo.
echo [7/8] Setting up PostgreSQL database...
echo.
echo You will need your PostgreSQL superuser password
echo Default superuser is usually: postgres
echo.
set /p CONTINUE="Continue with database setup? (Y/N): "
if /i not "%CONTINUE%"=="Y" (
    echo [SKIPPED] Database setup skipped
    echo You can run it later with: node backend\scripts\setup-database.js
    goto :skip_db
)

cd backend
set DB_SUPERUSER=postgres
set /p DB_SUPERUSER_PASSWORD="Enter PostgreSQL superuser password: "
call node scripts\setup-database.js
if errorlevel 1 (
    echo.
    echo [ERROR] Database setup failed
    echo Please check the error messages above and try again
    echo You can run setup manually: node backend\scripts\setup-database.js
    cd ..
    goto :skip_db
)
echo [OK] Database setup completed
cd ..

:skip_db

REM Final instructions
echo.
echo [8/8] Setup completed!
echo.
echo ========================================
echo    XOOM Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Review configuration files:
echo    - backend/.env  (Database and server settings)
echo    - frontend/.env (API URL)
echo.
echo 2. Start the backend server:
echo    cd backend
echo    npm start
echo.
echo 3. In a new terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open your browser to: http://localhost:5173
echo.
echo ========================================
echo    Default Test Accounts
echo ========================================
echo.
echo After database setup, you can create accounts via the signup page
echo.
echo For development, you may want to create test accounts:
echo   - Rider: +923001234567
echo   - Driver: +923009876543
echo   - Password: test1234 (min 8 characters)
echo.
echo ========================================
echo.
echo Troubleshooting:
echo   - If database connection fails, check backend/.env
echo   - If frontend can't connect, check VITE_API_URL in frontend/.env
echo   - See docs/SETUP.md for detailed documentation
echo.
pause
