import React from 'react';
import { History, X, CheckCircle2, Copy, Trash2 } from 'lucide-react';
import { VerificationRecord } from '../types';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: VerificationRecord[];
  onClear: () => void;
  onDeleteOrder?: (id: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onClear,
  onDeleteOrder
}) => {
  if (!isOpen) return null;

  const copyOrder = (order: VerificationRecord) => {
    navigator.clipboard.writeText(
      `ALIGHTMASTER LICENSE RECORD\nEmail: ${order.email}\nStatus: PRO 1 TAHUN (${order.status})\nID Lisensi: ${order.id}\nTanggal: ${order.timestamp}\nExpired: ${order.expiresAt}`
    );
    alert('Detail lisensi berhasil disalin ke clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-3xl max-w-lg w-full shadow-[6px_6px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] overflow-hidden select-none animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-yellow-200 dark:bg-slate-900 p-4 border-b-2 border-slate-900 dark:border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                Riwayat Order Aktivasi
              </h3>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Daftar lisensi terverifikasi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 flex items-center justify-center mx-auto text-slate-400">
                <History className="w-6 h-6" />
              </div>
              <p className="font-bold text-xs text-slate-500 dark:text-slate-400">Belum ada riwayat aktivasi akun.</p>
              <p className="text-[11px] text-slate-400">Silakan lakukan verifikasi melalui formulir utama.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3.5 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[180px]">
                      {order.email}
                    </span>
                  </div>
                  <span className="bg-emerald-300 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-slate-900 dark:border-slate-600">
                    AKTIF (1 TAHUN)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">ID Lisensi</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">{order.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Tgl Verifikasi</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{order.timestamp}</span>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 pt-1">
                  {onDeleteOrder && (
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-red-300 flex items-center gap-1 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  )}

                  <button
                    onClick={() => copyOrder(order)}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-slate-900 dark:border-slate-600 flex items-center gap-1 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin Info</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-slate-900 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          {orders.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Apakah kamu yakin ingin menghapus SELURUH riwayat aktivasi?')) {
                  onClear();
                }
              }}
              className="text-red-600 hover:text-red-800 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Riwayat ({orders.length})</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-5 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
