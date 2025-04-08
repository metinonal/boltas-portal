cd "D:\GitHub\boltas-portal\phone"

Get-ADUser -Filter * -Properties Mobile,mail,msExchHideFromAddressLists,DisplayName,userAccountControl,physicalDeliveryOfficeName |
Select-Object DisplayName,mail,Mobile,msExchHideFromAddressLists,userAccountControl,physicalDeliveryOfficeName |
ConvertTo-Json -Depth 3 | Out-File -FilePath "ADUserExport.json" -Encoding UTF8
