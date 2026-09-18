using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace MindoraLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            Directory.SetCurrentDirectory(baseDir);

            // Step 1: Ensure Node.js is installed
            if (!IsCommandAvailable("node"))
            {
                MessageBox.Show(
                    "Node.js is not installed or not found in system PATH!\n\nPlease install Node.js (v18 or higher) from https://nodejs.org",
                    "MINDORA Setup Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Step 2: Auto-install dependencies if missing
            if (!Directory.Exists(Path.Combine(baseDir, "node_modules")))
            {
                RunCmd("npm install");
            }
            if (!Directory.Exists(Path.Combine(baseDir, "client\\node_modules")))
            {
                RunCmd("cd client && npm install");
            }
            if (!Directory.Exists(Path.Combine(baseDir, "client\\dist")))
            {
                RunCmd("npm run build:client");
            }

            // Step 3: Check MongoDB service on 27017
            if (!IsPortListening(27017))
            {
                RunCmd("net start MongoDB");
            }

            // Step 4: Clear lingering process on port 3000
            KillPortProcess(3000);

            // Step 5: Start Node Server in background
            Process serverProcess = new Process();
            serverProcess.StartInfo.FileName = "node";
            serverProcess.StartInfo.Arguments = "server/server.js";
            serverProcess.StartInfo.WorkingDirectory = baseDir;
            serverProcess.StartInfo.CreateNoWindow = true;
            serverProcess.StartInfo.UseShellExecute = false;
            serverProcess.Start();

            // Wait 2.5 seconds for Express server to start listening
            Thread.Sleep(2500);

            // Step 6: Launch Desktop App Window (Edge or Chrome in standalone App Mode)
            Process appWindow = null;
            if (IsCommandAvailable("msedge"))
            {
                appWindow = Process.Start("msedge", "--app=http://localhost:3000 --window-size=1280,850");
            }
            else if (IsCommandAvailable("chrome"))
            {
                appWindow = Process.Start("chrome", "--app=http://localhost:3000 --window-size=1280,850");
            }
            else
            {
                appWindow = Process.Start("http://localhost:3000");
            }

            // Wait for user to close app window, then terminate background server process
            if (appWindow != null)
            {
                appWindow.WaitForExit();
            }

            try
            {
                if (!serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch {}
        }

        static bool IsCommandAvailable(string cmd)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.FileName = "where";
                p.StartInfo.Arguments = cmd;
                p.StartInfo.CreateNoWindow = true;
                p.StartInfo.UseShellExecute = false;
                p.Start();
                p.WaitForExit();
                return p.ExitCode == 0;
            }
            catch { return false; }
        }

        static bool IsPortListening(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(500);
                    if (success) client.EndConnect(result);
                    return success;
                }
            }
            catch { return false; }
        }

        static void KillPortProcess(int port)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.FileName = "cmd.exe";
                p.StartInfo.Arguments = string.Format("/c \"for /f \"tokens=5\" %a in ('netstat -aon ^| findstr \":{0}\" ^| findstr \"LISTENING\"') do taskkill /F /PID %a\"", port);
                p.StartInfo.CreateNoWindow = true;
                p.StartInfo.UseShellExecute = false;
                p.Start();
                p.WaitForExit();
            }
            catch {}
        }

        static void RunCmd(string command)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.FileName = "cmd.exe";
                p.StartInfo.Arguments = "/c " + command;
                p.StartInfo.CreateNoWindow = true;
                p.StartInfo.UseShellExecute = false;
                p.Start();
                p.WaitForExit();
            }
            catch {}
        }
    }
}
