const path = require('path');
const { exec } = require('child_process');

function exportADUsers() {
  const scriptPath = path.join(__dirname, '..', 'phone', 'export-users.ps1');
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("PowerShell Hatası:", error.message);
      return;
    }
    if (stderr) {
      console.error("PowerShell stderr:", stderr);
    }

    console.log("PowerShell script başarıyla çalıştı.");
    console.log("stdout:", stdout);
  });
}

module.exports = {
  exportADUsers
};
