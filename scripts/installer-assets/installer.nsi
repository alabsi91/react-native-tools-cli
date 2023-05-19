
!define AppName ""
!define AppVersion ""
!define AppDescription ""
!define JsFile ""

;--------------------------------
;Include Modern UI

  !include "MUI2.nsh"
  ; installer icon
  !define MUI_ICON favicon.ico
  ; uninstaller icon
  !define MUI_UNICON uninstall.ico
  ; welcome image in the installer
  !define MUI_WELCOMEFINISHPAGE_BITMAP welcome.bmp
  ; welcome image in the uninstaller
  !define MUI_UNWELCOMEFINISHPAGE_BITMAP welcome.bmp
  ; import powershell plugin
  !include "powershell.nsi"

;--------------------------------

;General

  ;Name and file
  Name "${AppName} ${AppVersion}"
  OutFile "installer.exe"
  Setcompressor /SOLID LZMA
  Unicode True

  ;Default installation folder
  InstallDir "$PROGRAMFILES\${AppName}"

  ;Get installation folder from registry if available
  InstallDirRegKey HKCU "Software\${AppName}" ""

  ;Request application privileges for Windows Vista
  RequestExecutionLevel admin

;--------------------------------

;Interface Settings

  !define MUI_ABORTWARNING

;--------------------------------

;Pages

  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "${NSISDIR}\Docs\Modern UI\License.txt"
  !insertmacro MUI_PAGE_COMPONENTS
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH

  !insertmacro MUI_UNPAGE_WELCOME
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  !insertmacro MUI_UNPAGE_FINISH

;--------------------------------

;Languages

  !insertmacro MUI_LANGUAGE "English"

;--------------------------------

;Installer Sections

Section "${AppName} ${AppVersion}" SecCli
  ; set as required
  SectionIn RO

  ; Set output path to the installation directory.
  SetOutPath $INSTDIR

  ;ADD YOUR OWN FILES HERE...
  File ${JsFile} "${AppName}.cmd" "${AppName}.ps1" "${AppName}"

  ; Write the installation path into the registry
  WriteRegStr HKLM SOFTWARE\${AppName} "Install_Dir" "$INSTDIR"
  
  ; Write the uninstall keys for Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${AppName}" "DisplayName" "${AppName}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${AppName}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${AppName}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${AppName}" "NoRepair" 1
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Add to path variable
  ${PowerShellExec} "if($$Env:PATH.Contains('$INSTDIR')){Write-Output 'path already exists';}else{[Environment]::SetEnvironmentVariable('PATH', $$Env:PATH + ';$INSTDIR', [EnvironmentVariableTarget]::Machine)}"
SectionEnd

Section "Node.js" SecNode
  ; set as optional
  SectionIn 1

  ; Set output path to the installation directory.
  SetOutPath $INSTDIR

  ;ADD YOUR OWN FILES HERE...
  File node.exe

SectionEnd

;--------------------------------

;Descriptions

  ;Language strings
  LangString DESC_SecCli ${LANG_ENGLISH} "${AppDescription}"
  LangString DESC_SecNode ${LANG_ENGLISH} "if you don't have Node.js installed or you have a lower version install it"

  ;Assign language strings to sections
  !insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN

  ;Language strings
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCli} $(DESC_SecCli)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecNode} $(DESC_SecNode)
  
  !insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------

;Uninstaller Section

Section "Uninstall"
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${AppName}"
  DeleteRegKey HKLM SOFTWARE\${AppName}
  DeleteRegKey /ifempty HKCU "Software\${AppName}"

  ;ADD YOUR OWN FILES HERE...
  Delete "$INSTDIR\Uninstall.exe"

  RMDir /R "$INSTDIR"

  ; Remove from path variable
  ${PowerShellExec} "if($$Env:PATH.Contains(';$INSTDIR')){[Environment]::SetEnvironmentVariable('PATH', $$Env:PATH.Replace(';$INSTDIR',''), [EnvironmentVariableTarget]::Machine)}"

SectionEnd
