Dim fso, f, content, fixed
Set fso = CreateObject("Scripting.FileSystemObject")
Set f = fso.OpenTextFile("c:\Users\visha\Desktop\Tekunik\Automation\frontend\src\pages\AdminPanel.jsx", 1, False, -1)
content = f.ReadAll
f.Close

Dim bad1, bad2, bad3, good
good = "  const fetchAllProducts = useCallback(async () => {"
bad1 = good & Chr(13) & Chr(10) & "  const fetchAllProducts = useCallback(async () => {"
bad2 = good & Chr(10) & "  const fetchAllProducts = useCallback(async () => {"
bad3 = good & Chr(13) & "  const fetchAllProducts = useCallback(async () => {"

If InStr(content, bad1) > 0 Then
    content = Replace(content, bad1, good)
    fixed = "bad1"
ElseIf InStr(content, bad2) > 0 Then
    content = Replace(content, bad2, good)
    fixed = "bad2"
ElseIf InStr(content, bad3) > 0 Then
    content = Replace(content, bad3, good)
    fixed = "bad3"
Else
    fixed = "NOT FOUND"
End If

If fixed <> "NOT FOUND" Then
    Set f = fso.OpenTextFile("c:\Users\visha\Desktop\Tekunik\Automation\frontend\src\pages\AdminPanel.jsx", 2, False, -1)
    f.Write content
    f.Close
    WScript.Echo "Fixed using: " & fixed
Else
    WScript.Echo "NOT FOUND - count of fetchAllProducts: " & (Len(content) - Len(Replace(content, "const fetchAllProducts", ""))) / Len("const fetchAllProducts")
End If
