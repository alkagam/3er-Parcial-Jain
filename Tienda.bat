@echo off
title Iniciar Proyecto Tienda Moderna

REM Abre PowerShell para el frontend
start powershell -NoExit -Command "cd 'C:\Users\saulm\Desktop\Proyecto\tienda-moderna-frontend'; npm start"

REM Abre PowerShell para el backend
start powershell -NoExit -Command "cd 'C:\Users\saulm\Desktop\Proyecto\tienda-moderna-backend'; node server.js"
