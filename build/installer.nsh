; build/installer.nsh
; NSIS script fragment included by electron-builder.
; Adds a custom installer page with two checkboxes:
;  - Create Desktop Shortcut
;  - Create Start Menu Shortcut
; Supports English and Spanish localization (extendable).

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

Var DESKTOP_CHECKBOX_HANDLE
Var STARTMENU_CHECKBOX_HANDLE
Var DESKTOP_CHECKBOX_STATE
Var STARTMENU_CHECKBOX_STATE

; localized strings
!macro LOCALIZED_STRINGS
  ; Default to English (LANG_ENGLISH = 1033)
  StrCpy $R0 ""
  StrCpy $R1 ""
  StrCpy $R2 ""
  StrCpy $R3 ""
  ; Set translations based on $LANGUAGE
  ; English
  StrCmp $LANGUAGE ${LANG_ENGLISH} 0 +3
    StrCpy $R0 "Choose shortcuts to create:"
    StrCpy $R1 "Create Desktop Shortcut"
    StrCpy $R2 "Create Start Menu Shortcut"
    StrCpy $R3 "Shortcuts"
    Goto done_localize
  ; Spanish (LANG_SPANISH = 1034)
  StrCmp $LANGUAGE ${LANG_SPANISH} 0 +3
    StrCpy $R0 "Elija accesos directos para crear:"
    StrCpy $R1 "Crear acceso directo en el Escritorio"
    StrCpy $R2 "Crear acceso directo en el Menú Inicio"
    StrCpy $R3 "Accesos directos"
    Goto done_localize
  ; Fallback English
  StrCpy $R0 "Choose shortcuts to create:"
  StrCpy $R1 "Create Desktop Shortcut"
  StrCpy $R2 "Create Start Menu Shortcut"
  StrCpy $R3 "Shortcuts"
done_localize:
!macroend

Page custom CreateShortcutsPage CreateShortcutsPageLeave

Function CreateShortcutsPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  !insertmacro LOCALIZED_STRINGS

  ${NSD_CreateLabel} 0u 8u 100% 12u "$R0"
  Pop $R4

  ; Desktop checkbox
  ${NSD_CreateCheckBox} 10u 30u 100% 12u "$R1"
  Pop $DESKTOP_CHECKBOX_HANDLE
  ${NSD_SetState} $DESKTOP_CHECKBOX_HANDLE ${BST_CHECKED}

  ; Start Menu checkbox
  ${NSD_CreateCheckBox} 10u 50u 100% 12u "$R2"
  Pop $STARTMENU_CHECKBOX_HANDLE
  ${NSD_SetState} $STARTMENU_CHECKBOX_HANDLE ${BST_CHECKED}

  nsDialogs::Show
FunctionEnd

Function CreateShortcutsPageLeave
  ${NSD_GetState} $DESKTOP_CHECKBOX_HANDLE $0
  StrCmp $0 ${BST_CHECKED} 0 _desktop_not_checked
  StrCpy $DESKTOP_CHECKBOX_STATE "1"
  goto _desktop_done
_desktop_not_checked:
  StrCpy $DESKTOP_CHECKBOX_STATE "0"
_desktop_done:

  ${NSD_GetState} $STARTMENU_CHECKBOX_HANDLE $1
  StrCmp $1 ${BST_CHECKED} 0 _startmenu_not_checked
  StrCpy $STARTMENU_CHECKBOX_STATE "1"
  goto _startmenu_done
_startmenu_not_checked:
  StrCpy $STARTMENU_CHECKBOX_STATE "0"
_startmenu_done:
FunctionEnd

; After installation, create shortcuts based on checkbox states
Function .onInstSuccess
  StrCmp $DESKTOP_CHECKBOX_STATE "1" 0 no_desktop
    ; Create desktop shortcut
    !macroifeq '${PRODUCT_FILENAME}' ''
      StrCpy $0 "$INSTDIR\\${PRODUCT_NAME}.exe"
    !macroelse
      StrCpy $0 "$INSTDIR\\${PRODUCT_FILENAME}.exe"
    !macroendif
    CreateShortCut "$DESKTOP\\${PRODUCT_NAME}.lnk" "$0" "" "$INSTDIR" 0
  no_desktop:

  StrCmp $STARTMENU_CHECKBOX_STATE "1" 0 no_startmenu
    ; Create Start Menu shortcut (in Programs folder)
    CreateDirectory "$SMPROGRAMS\\${PRODUCT_NAME}"
    CreateShortCut "$SMPROGRAMS\\${PRODUCT_NAME}\\${PRODUCT_NAME}.lnk" "$0" "" "$INSTDIR" 0
  no_startmenu:
FunctionEnd

; Ensure uninstaller removes the shortcuts if they exist
Function un.onUninstSuccess
  Delete "$DESKTOP\\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\\${PRODUCT_NAME}\\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\\${PRODUCT_NAME}"
FunctionEnd