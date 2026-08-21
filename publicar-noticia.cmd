@echo off
if "%~1"=="" (
  node "%~dp0scripts\add-blog-post.js" --help
  exit /b 1
)
if /I "%~1"=="--help" (
  node "%~dp0scripts\add-blog-post.js" --help
  exit /b %ERRORLEVEL%
)
node "%~dp0scripts\add-blog-post.js" --file %*
