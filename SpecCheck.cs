using System;
using System.Collections.Generic;
using System.Management;
using System.Web.Script.Serialization;
using System.Text;
using System.Diagnostics;

namespace SpecCheck
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                var data = new Dictionary<string, object>();

                // System Info
                var system = new Dictionary<string, object>();
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_ComputerSystem"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        system["manufacturer"] = GetVal(obj, "Manufacturer", "Unknown");
                        system["model"] = GetVal(obj, "Model", "Unknown");
                        system["serial"] = GetSerialNumber();
                        system["version"] = "v1.0";
                        data["system"] = system;
                        break;
                    }
                }

                // CPU Info
                var cpu = new Dictionary<string, object>();
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        cpu["manufacturer"] = GetVal(obj, "Manufacturer", "Unknown");
                        cpu["brand"] = GetVal(obj, "Name", "Unknown");
                        cpu["speed"] = Convert.ToDouble(obj["CurrentClockSpeed"] ?? 0) / 1000.0;
                        cpu["cores"] = Convert.ToInt32(obj["NumberOfLogicalProcessors"] ?? 0);
                        cpu["physicalCores"] = Convert.ToInt32(obj["NumberOfCores"] ?? 0);
                        data["cpu"] = cpu;
                        break;
                    }
                }

                // RAM Layout
                var ramLayout = new List<object>();
                long totalRam = 0;
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemory"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        long size = Convert.ToInt64(obj["Capacity"] ?? 0);
                        totalRam += size;
                        
                        string bank = GetVal(obj, "BankLabel", GetVal(obj, "DeviceLocator", "Unknown"));
                        string mfg = GetVal(obj, "Manufacturer", "Unknown");
                        string part = GetVal(obj, "PartNumber", "Unknown").Trim();
                        string serial = GetVal(obj, "SerialNumber", "Unknown");
                        uint clock = Convert.ToUInt32(obj["ConfiguredClockSpeed"] ?? obj["Speed"] ?? 0);
                        uint voltage = Convert.ToUInt32(obj["ConfiguredVoltage"] ?? 0);
                        double volts = voltage > 0 ? voltage / 1000.0 : 1.2;

                        var stick = new Dictionary<string, object>();
                        stick["size"] = size;
                        stick["bank"] = bank;
                        stick["type"] = "DDR4";
                        stick["ecc"] = false;
                        stick["clockSpeed"] = clock;
                        stick["formFactor"] = GetFormFactor(Convert.ToUInt16(obj["FormFactor"] ?? 0));
                        stick["manufacturer"] = mfg;
                        stick["partNum"] = part;
                        stick["serialNum"] = serial;
                        stick["voltageConfigured"] = volts;
                        ramLayout.Add(stick);
                    }
                }
                data["ramLayout"] = ramLayout;
                
                // Memory array to get total physical slots
                int totalSlots = 2;
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemoryArray"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        totalSlots = Convert.ToInt32(obj["MemoryDevices"] ?? 2);
                        break;
                    }
                }
                data["ramTotalSlots"] = totalSlots;

                // Memory Info
                var mem = new Dictionary<string, object>();
                mem["total"] = totalRam;
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_OperatingSystem"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        long freeMem = Convert.ToInt64(obj["FreePhysicalMemory"] ?? 0) * 1024;
                        mem["free"] = freeMem;
                        mem["available"] = freeMem;
                        mem["used"] = totalRam - freeMem;
                        break;
                    }
                }
                data["mem"] = mem;

                // Graphics Info
                var graphics = new Dictionary<string, object>();
                var controllers = new List<object>();
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_VideoController"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        long vram = Convert.ToInt64(obj["AdapterRAM"] ?? 0);
                        var ctrl = new Dictionary<string, object>();
                        ctrl["vendor"] = GetVal(obj, "AdapterCompatibility", "Unknown");
                        ctrl["model"] = GetVal(obj, "Name", "Unknown");
                        ctrl["vram"] = vram > 0 ? vram / (1024 * 1024) : 512;
                        controllers.Add(ctrl);
                    }
                }
                graphics["controllers"] = controllers;
                
                var display1 = new Dictionary<string, object>();
                display1["vendor"] = "Primary Display";
                display1["model"] = "Generic PnP Monitor";
                display1["resolutionX"] = 1920;
                display1["resolutionY"] = 1080;
                display1["currentRefreshRate"] = 60;
                
                graphics["displays"] = new List<object> { display1 };
                data["graphics"] = graphics;

                // Disk Layout
                var diskLayout = new List<object>();
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        var disk = new Dictionary<string, object>();
                        disk["name"] = GetVal(obj, "Model", "Unknown Drive");
                        disk["type"] = GetVal(obj, "MediaType", "").Contains("SSD") ? "SSD" : "HDD/SSD";
                        disk["size"] = Convert.ToInt64(obj["Size"] ?? 0);
                        disk["smartStatus"] = GetVal(obj, "Status", "OK");
                        diskLayout.Add(disk);
                    }
                }
                data["diskLayout"] = diskLayout;

                // Battery Info
                var battery = new Dictionary<string, object>();
                battery["hasBattery"] = false;
                
                try 
                {
                    using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("root\\WMI", "SELECT * FROM BatteryStaticData"))
                    {
                        foreach (ManagementObject obj in searcher.Get())
                        {
                            battery["hasBattery"] = true;
                            battery["designedCapacity"] = Convert.ToInt32(obj["DesignedCapacity"] ?? 45000);
                            battery["manufacturer"] = GetVal(obj, "ManufactureName", "Internal Battery");
                            break;
                        }
                    }
                    
                    using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("root\\WMI", "SELECT * FROM BatteryFullChargedCapacity"))
                    {
                        foreach (ManagementObject obj in searcher.Get())
                        {
                            battery["maxCapacity"] = Convert.ToInt32(obj["FullChargedCapacity"] ?? 45000);
                            break;
                        }
                    }
                    
                    using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("root\\WMI", "SELECT * FROM BatteryStatus"))
                    {
                        foreach (ManagementObject obj in searcher.Get())
                        {
                            battery["acConnected"] = Convert.ToBoolean(obj["PowerOnline"] ?? false);
                            battery["isCharging"] = Convert.ToBoolean(obj["Charging"] ?? false);
                            battery["currentCapacity"] = Convert.ToInt32(obj["RemainingCapacity"] ?? 45000);
                            break;
                        }
                    }
                    
                    using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("root\\WMI", "SELECT * FROM BatteryCycleCount"))
                    {
                        foreach (ManagementObject obj in searcher.Get())
                        {
                            battery["cycleCount"] = Convert.ToInt32(obj["CycleCount"] ?? 0);
                            break;
                        }
                    }
                }
                catch { }

                // Fallback / Percent using Win32_Battery
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Battery"))
                {
                    var results = searcher.Get();
                    if (results.Count > 0)
                    {
                        foreach (ManagementObject obj in results)
                        {
                            battery["hasBattery"] = true;
                            battery["percent"] = Convert.ToInt32(obj["EstimatedChargeRemaining"] ?? 100);
                            
                            if (!battery.ContainsKey("isCharging")) 
                                battery["isCharging"] = Convert.ToInt32(obj["BatteryStatus"] ?? 1) == 2;
                            if (!battery.ContainsKey("acConnected")) 
                                battery["acConnected"] = Convert.ToInt32(obj["BatteryStatus"] ?? 1) == 2;
                            if (!battery.ContainsKey("manufacturer")) 
                                battery["manufacturer"] = GetVal(obj, "SystemName", "Internal Battery");
                            
                            if (!battery.ContainsKey("maxCapacity")) {
                                battery["designedCapacity"] = Convert.ToInt32(obj["DesignCapacity"] ?? 45000);
                                battery["maxCapacity"] = Convert.ToInt32(obj["FullChargeCapacity"] ?? 45000);
                                battery["currentCapacity"] = Convert.ToInt32(obj["EstimatedChargeRemaining"] ?? 100) * 450;
                            }
                            
                            if (!battery.ContainsKey("percent") && battery.ContainsKey("currentCapacity") && battery.ContainsKey("maxCapacity")) {
                                double max = Convert.ToDouble(battery["maxCapacity"]);
                                double cur = Convert.ToDouble(battery["currentCapacity"]);
                                battery["percent"] = (int)((cur / max) * 100);
                            }
                            
                            battery["cycleCount"] = 0;
                            break;
                        }
                    }
                }
                
                // Calculate actual health based on root\wmi data if available
                if (battery.ContainsKey("designedCapacity") && battery.ContainsKey("maxCapacity"))
                {
                    double dCap = Convert.ToDouble(battery["designedCapacity"]);
                    double mCap = Convert.ToDouble(battery["maxCapacity"]);
                    if (dCap > 0) 
                    {
                        double health = (mCap / dCap) * 100.0;
                        if (health > 100) health = 100;
                        battery["healthPercent"] = Math.Round(health, 1);
                    }
                }
                
                data["battery"] = battery;

                // OS Info
                var os = new Dictionary<string, object>();
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_OperatingSystem"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        os["distro"] = GetVal(obj, "Caption", "Windows");
                        os["arch"] = GetVal(obj, "OSArchitecture", "x64");
                        os["release"] = GetVal(obj, "BuildNumber", "Unknown");
                        os["hostname"] = Environment.MachineName;
                        os["uefi"] = true;
                        break;
                    }
                }
                data["os"] = os;

                // Serialize and encode
                JavaScriptSerializer serializer = new JavaScriptSerializer();
                string json = serializer.Serialize(data);
                string base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
                
                // Open Browser
                // Production URL: https://bizzcohubtest.netlify.app/resources/spec2
                string url = "https://bizzcohubtest.netlify.app/resources/spec2?data=" + Uri.EscapeDataString(base64);
                
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error scanning hardware: " + ex.Message);
                Console.ReadLine();
            }
        }
        
        static string GetVal(ManagementBaseObject obj, string prop, string defaultVal)
        {
            try 
            {
                object val = obj[prop];
                if (val != null)
                {
                    string s = val.ToString();
                    if (!string.IsNullOrEmpty(s)) return s;
                }
            }
            catch { }
            return defaultVal;
        }

        static string GetSerialNumber()
        {
            try
            {
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_BIOS"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        return GetVal(obj, "SerialNumber", "Unknown");
                    }
                }
            }
            catch { }
            return "Unknown";
        }
        
        static string GetFormFactor(ushort factor)
        {
            switch (factor)
            {
                case 8: return "DIMM";
                case 12: return "SODIMM";
                case 11: return "RIMM";
                default: return "SODIMM";
            }
        }
    }
}
