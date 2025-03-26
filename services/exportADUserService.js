const { exec } = require('child_process');

function exportADUsers() {
  const script = `
    cd D:\\GitHub\\boltas-portal\\phone;
    Get-ADUser -Filter * -Properties Mobile,mail,msExchHideFromAddressLists,DisplayName,userAccountControl, physicalDeliveryOfficeName |
    Select-Object DisplayName,mail,Mobile,msExchHideFromAddressLists,userAccountControl, physicalDeliveryOfficeName |
    ConvertTo-Json -Depth 3 | Out-File -FilePath "ADUserExport.json" -Encoding UTF8
  `;

  exec(`powershell.exe -Command "${script}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("PowerShell Hatası:", error.message);
      return;
    }
    if (stderr) {
      console.error("PowerShell Çıktısı (stderr):", stderr);
      return;
    }
    console.log("PowerShell komutu başarıyla çalıştı.");
  });
}

module.exports = {
  exportADUsers
};
