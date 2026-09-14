import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/common/Button";
import {
  QrCode,
  Wifi,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Laptop,
  Radio,
  ArrowLeft
} from "lucide-react";

export const ConnectPage = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await api.get("/system/network");
        if (res.data.success) {
          setNetworkInfo(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load network info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    success("Copied LAN address to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-xs font-bold text-navy-700 hover:text-navy-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to System
          </Link>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            OFFLINE LAN SYSTEM
          </div>
        </div>

        {/* Main QR Code Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200">
          <div className="text-center pb-6 border-b border-slate-100">
            <img
              src="/assets/mindora-logo.png"
              alt="MINDORA Logo"
              className="h-16 w-auto mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl md:text-3xl font-black text-navy-800 tracking-tight">
              Connect Registration Devices
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Connect registration phones and tablets to the MINDORA offline local network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              {networkInfo?.qrCode ? (
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={networkInfo.qrCode}
                    alt="Registration System QR Code"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-52 h-52 bg-slate-200 animate-pulse rounded-2xl" />
              )}
              <p className="text-xs font-bold text-navy-800 mt-4 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-green" />
                Scan to Open Registration Screen
              </p>
            </div>

            {/* Connection Details & Steps */}
            <div className="space-y-5">
              <div className="p-4 bg-navy-50/70 border border-navy-200 rounded-2xl">
                <div className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-1">
                  PRIMARY LAN ADDRESS
                </div>
                <div className="font-mono text-base font-extrabold text-navy-900 break-all select-all">
                  {networkInfo?.primaryUrl ? `${networkInfo.primaryUrl}/register` : "Loading..."}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopy(`${networkInfo.primaryUrl}/register`)}
                    icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <a
                    href={`${networkInfo?.primaryUrl}/register`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-navy-700 hover:text-navy-900 bg-white border border-slate-300 rounded-xl"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Browser
                  </a>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quick Setup Instructions
                </h4>

                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <div className="p-1.5 bg-brand-green/10 text-brand-green font-black rounded-lg">1</div>
                  <div>
                    <strong>Connect to Wi-Fi / Hotspot:</strong> Connect all registration phones to the admin laptop's Wi-Fi hotspot or exhibition router.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <div className="p-1.5 bg-brand-green/10 text-brand-green font-black rounded-lg">2</div>
                  <div>
                    <strong>Scan QR Code:</strong> Open the camera app on phone/tablet and scan the QR code above.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <div className="p-1.5 bg-brand-green/10 text-brand-green font-black rounded-lg">3</div>
                  <div>
                    <strong>Login to Desk:</strong> Log in with the assigned operator account (e.g., <code>desk01</code>, <code>desk02</code>).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Network Adapters Info */}
          {networkInfo?.interfaces?.length > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Available Network Adapters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {networkInfo.interfaces.map((iface, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-700 truncate mr-2">{iface.interface}</span>
                    <span className="font-mono text-navy-800 font-bold">{iface.ip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
