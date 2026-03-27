' SecureVision AI - Silent Launcher
' This script launches the app without showing a terminal window

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory this script is in
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if frontend is built
If Not fso.FileExists(scriptDir & "\frontend-react\dist\index.html") Then
    MsgBox "Frontend not built yet!" & vbCrLf & vbCrLf & _
           "Please run 'build.bat' first to build the application.", _
           vbExclamation, "SecureVision AI"
    WshShell.Run """" & scriptDir & "\build.bat""", 1, True
End If

' Set environment variables and launch Flask in hidden window
WshShell.Environment("Process")("SERVE_FRONTEND") = "1"
WshShell.Environment("Process")("FLASK_ENV") = "production"

' Start Flask server (hidden window - 0)
WshShell.Run "cmd /c cd /d """ & scriptDir & "\backend"" && python app.py", 0, False

' Wait for server to start
WScript.Sleep 3000

' Open browser
WshShell.Run "http://localhost:5000", 1, False
