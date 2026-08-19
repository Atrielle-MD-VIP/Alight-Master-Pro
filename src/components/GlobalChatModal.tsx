import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, ShieldAlert, Sparkles, AlertCircle, BadgeCheck, Trash2, UserX, Globe, Info, Reply, CornerUpLeft, VolumeX, Clock, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReplyTo {
  id: string;
  username: string;
  text: string;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  replyTo?: ReplyTo | null;
}

interface GlobalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string } | null;
}

export const GlobalChatModal: React.FC<GlobalChatModalProps> = ({ isOpen, onClose, currentUser }) => {
  // Local caching & deleted message persistence helpers
  const getDeletedIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem('alight_deleted_chat_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  };

  const addDeletedId = (id: string) => {
    try {
      const deleted = getDeletedIds();
      deleted.add(id);
      localStorage.setItem('alight_deleted_chat_ids', JSON.stringify(Array.from(deleted)));
    } catch {}
  };

  const getLocalChatCache = (): ChatMessage[] => {
    try {
      const saved = localStorage.getItem('alight_chat_messages_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalChatCache = (msgs: ChatMessage[]) => {
    try {
      localStorage.setItem('alight_chat_messages_cache', JSON.stringify(msgs.slice(-50)));
    } catch {}
  };

  const mergeMessages = (prevMsgs: ChatMessage[], serverMsgs: ChatMessage[]): ChatMessage[] => {
    const deletedIds = getDeletedIds();
    const cacheMsgs = getLocalChatCache();

    const map = new Map<string, ChatMessage>();
    [...cacheMsgs, ...prevMsgs, ...serverMsgs].forEach((m) => {
      if (m && m.id && !deletedIds.has(m.id)) {
        map.set(m.id, m);
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-50);
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => getLocalChatCache());
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDeleteMsg, setSelectedDeleteMsg] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [hiddenMsgIds, setHiddenMsgIds] = useState<Set<string>>(new Set());

  const [chatReportNotice, setChatReportNotice] = useState(() => 
    localStorage.getItem('alight_chat_report_notice') || 'silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00'
  );

  useEffect(() => {
    const handleSettingsUpdated = () => {
      setChatReportNotice(
        localStorage.getItem('alight_chat_report_notice') || 'silahkan lapor disini jika ada error atau gagal verifikasi akun pro, admin respon 22.00/04.00'
      );
    };
    window.addEventListener('alight_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('alight_settings_updated', handleSettingsUpdated);
  }, []);

  // Mute Status State
  const [muteStatus, setMuteStatus] = useState<{
    isMuted: boolean;
    isPermanent?: boolean;
    mutedUntil: number | null;
    remainingMs: number | null;
    reason?: string;
    durationLabel?: string;
  }>({ isMuted: false, isPermanent: false, mutedUntil: null, remainingMs: null });

  const [countdownString, setCountdownString] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    text: string;
  }>({ hours: 0, minutes: 0, seconds: 0, text: '' });

  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isNearBottomRef = useRef<boolean>(true);

  // Check Mute Status from Server
  const checkMuteStatus = async () => {
    if (!currentUser?.username) return;
    try {
      const res = await fetch(`/api/chat/mute-status?username=${encodeURIComponent(currentUser.username)}`);
      if (res.ok) {
        const data = await res.json();
        setMuteStatus({
          isMuted: Boolean(data.isMuted),
          isPermanent: Boolean(data.isPermanent || (data.isMuted && !data.mutedUntil)),
          mutedUntil: data.mutedUntil || null,
          remainingMs: data.remainingMs || null,
          reason: data.reason,
          durationLabel: data.durationLabel
        });
      }
    } catch (e) {}
  };

  // Live Countdown Effect (Jam, Menit, Detik)
  useEffect(() => {
    if (!muteStatus.isMuted || !muteStatus.mutedUntil) {
      setCountdownString({ hours: 0, minutes: 0, seconds: 0, text: '' });
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, (muteStatus.mutedUntil || 0) - now);

      if (diff <= 0) {
        setMuteStatus({ isMuted: false, mutedUntil: null, remainingMs: 0 });
        setCountdownString({ hours: 0, minutes: 0, seconds: 0, text: '' });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      let formatted = '';
      if (hours > 0) {
        formatted += `${hours} Jam `;
      }
      formatted += `${minutes} Menit ${seconds} Detik`;

      setCountdownString({
        hours,
        minutes,
        seconds,
        text: formatted.trim()
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [muteStatus.isMuted, muteStatus.mutedUntil]);

  // Load hidden messages for current user
  useEffect(() => {
    if (currentUser?.username) {
      try {
        const saved = localStorage.getItem(`alight_hidden_chats_${currentUser.username.toLowerCase()}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHiddenMsgIds(new Set(parsed));
          }
        }
      } catch (e) {}
    }
  }, [currentUser]);

  // Fetch initial chat history without triggering useless state updates
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/chat/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages((prev) => {
            const merged = mergeMessages(prev, data);

            if (
              prev.length === merged.length &&
              prev.every((m, idx) => m.id === merged[idx]?.id && m.text === merged[idx]?.text && m.timestamp === merged[idx]?.timestamp)
            ) {
              return prev;
            }

            saveLocalChatCache(merged);
            return merged;
          });
          setIsConnected(true);
          setIsConnecting(false);
        }
      }
    } catch (err) {
      // Quiet fail fallback
    }
  };

  // Setup WebSocket connection with REST fallback
  const wsFailedRef = useRef<boolean>(false);

  const connectWebSocket = () => {
    if (!isOpen || !currentUser || wsFailedRef.current) return;

    if (socketRef.current) {
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      try {
        socketRef.current.close();
      } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setErrorMsg(null);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'history') {
            if (Array.isArray(payload.data)) {
              setMessages((prev) => {
                const merged = mergeMessages(prev, payload.data);
                if (
                  prev.length === merged.length &&
                  prev.every((m: ChatMessage, idx: number) => m.id === merged[idx]?.id && m.text === merged[idx]?.text)
                ) {
                  return prev;
                }
                saveLocalChatCache(merged);
                return merged;
              });
            }
          } else if (payload.type === 'message') {
            const newMsg: ChatMessage = payload.data;
            setMessages((prev) => {
              const merged = mergeMessages(prev, [newMsg]);
              saveLocalChatCache(merged);
              return merged;
            });
          } else if (payload.type === 'delete_everyone') {
            if (payload.data?.id) {
              addDeletedId(payload.data.id);
              setMessages((prev) => {
                const updated = prev.filter((m) => m.id !== payload.data.id);
                saveLocalChatCache(updated);
                return updated;
              });
            }
          } else if (payload.type === 'mute_alert') {
            setMuteStatus({
              isMuted: true,
              isPermanent: Boolean(payload.isPermanent || !payload.mutedUntil),
              mutedUntil: payload.mutedUntil || null,
              remainingMs: payload.remainingMs || null,
              reason: payload.reason,
              durationLabel: payload.durationLabel
            });
          }
        } catch (err) {
          // ignore parsing error
        }
      };

      ws.onerror = () => {
        wsFailedRef.current = true;
        setIsConnecting(false);
        setIsConnected(true); // Fallback to REST polling mode cleanly
      };

      ws.onclose = () => {
        setIsConnecting(false);
        setIsConnected(true);
      };
    } catch (e) {
      wsFailedRef.current = true;
      setIsConnecting(false);
      setIsConnected(true);
    }
  };

  const username = currentUser?.username;

  useEffect(() => {
    let pollingInterval: any = null;

    if (isOpen && username) {
      fetchHistory();
      checkMuteStatus();
      connectWebSocket();

      pollingInterval = setInterval(() => {
        fetchHistory();
        checkMuteStatus();
      }, 4000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isOpen, username]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior });
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 90;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // First open: scroll to bottom
      scrollToBottom('auto');
    }
  }, [isOpen]);

  useEffect(() => {
    // Only scroll to bottom on new messages if the user is already near bottom
    if (isOpen && isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    if (muteStatus.isMuted) {
      setErrorMsg(`Anda sedang dimute oleh Admin. Sisa waktu: ${countdownString.text}`);
      return;
    }

    const textToSend = inputText.trim();
    const currentReplyTo = replyingTo ? {
      id: replyingTo.id,
      username: replyingTo.username.toLowerCase() === 'nabil' || replyingTo.username.toLowerCase() === 'admin' ? 'Admin' : replyingTo.username,
      text: replyingTo.text
    } : null;

    setInputText('');
    setReplyingTo(null);
    setErrorMsg(null);
    isNearBottomRef.current = true;
    scrollToBottom('smooth');

    const payload = {
      type: 'message',
      username: currentUser.username,
      text: textToSend,
      replyTo: currentReplyTo
    };

    let sentViaWs = false;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(payload));
        sentViaWs = true;
      } catch (err) {
        sentViaWs = false;
      }
    }

    if (!sentViaWs) {
      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser.username,
            text: textToSend,
            replyTo: currentReplyTo
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.message) {
            setMessages((prev) => {
              const merged = mergeMessages(prev, [data.message]);
              saveLocalChatCache(merged);
              return merged;
            });
            setIsConnected(true);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.isMuted) {
            setMuteStatus({
              isMuted: true,
              mutedUntil: errData.mutedUntil,
              remainingMs: errData.remainingMs,
              reason: errData.reason,
              durationLabel: errData.durationLabel
            });
            setErrorMsg(`Anda sedang dimute oleh Admin.`);
          } else {
            setErrorMsg(errData.error || 'Gagal mengirim pesan ke server. Silakan coba lagi.');
          }
        }
      } catch (err) {
        setErrorMsg('Gagal mengirim pesan. Silakan periksa koneksi internet kamu.');
      }
    }
  };

  // Delete message for oneself (Local hide)
  const handleDeleteForSelf = (msgId: string) => {
    if (!currentUser?.username) return;
    const newSet = new Set(hiddenMsgIds);
    newSet.add(msgId);
    setHiddenMsgIds(newSet);
    try {
      localStorage.setItem(
        `alight_hidden_chats_${currentUser.username.toLowerCase()}`,
        JSON.stringify(Array.from(newSet))
      );
    } catch (e) {}
    setSelectedDeleteMsg(null);
  };

  // Delete message for everyone (Global)
  const handleDeleteForEveryone = async (msg: ChatMessage) => {
    if (!currentUser) return;

    // Send WS payload if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(
          JSON.stringify({
            type: 'delete',
            messageId: msg.id,
            username: currentUser.username,
            deleteType: 'everyone'
          })
        );
      } catch (e) {}
    }

    // Always fallback to REST API to ensure global deletion
    try {
      const res = await fetch('/api/chat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msg.id,
          username: currentUser.username,
          deleteType: 'everyone'
        })
      });

      if (res.ok) {
        addDeletedId(msg.id);
        setMessages((prev) => {
          const updated = prev.filter((m) => m.id !== msg.id);
          saveLocalChatCache(updated);
          return updated;
        });
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Gagal menghapus pesan.');
      }
    } catch (e) {
      setErrorMsg('Gagal menghapus pesan. Silakan periksa koneksi.');
    }

    setSelectedDeleteMsg(null);
  };

  const getUserColorClass = (uname: string) => {
    const colors = [
      'text-blue-600 dark:text-blue-400',
      'text-emerald-600 dark:text-emerald-400',
      'text-indigo-600 dark:text-indigo-400',
      'text-purple-600 dark:text-purple-400',
      'text-pink-600 dark:text-pink-400',
      'text-rose-600 dark:text-rose-400',
      'text-amber-600 dark:text-amber-400',
      'text-cyan-600 dark:text-cyan-400'
    ];
    let hash = 0;
    for (let i = 0; i < uname.length; i++) {
      hash = uname.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderSenderName = (rawUsername: string, isMe: boolean) => {
    const isAdmin = rawUsername.toLowerCase() === 'nabil' || rawUsername.toLowerCase() === 'admin';
    const displayName = isAdmin ? 'Admin' : rawUsername;

    return (
      <div className="flex items-center gap-1 mb-0.5 px-1 max-w-full">
        <span className={`text-[10px] font-black truncate ${isAdmin ? 'text-blue-600 dark:text-blue-400' : getUserColorClass(rawUsername)}`}>
          {displayName}
        </span>
        {isAdmin && (
          <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20 dark:text-blue-400 dark:fill-blue-400/20 shrink-0" />
        )}
        {isMe && (
          <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
            (Anda)
          </span>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-[4px_4px_0px_#0f172a] overflow-hidden flex flex-col h-[85dvh] max-h-[620px] z-10"
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b-2 border-slate-900 dark:border-slate-800 bg-[#e0f2fe] dark:bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-[1.5px_1.5px_0px_#0f172a]">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                    <span>Chat Global AlightMaster</span>
                    <span className="bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 text-[8px] font-black px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-800/50 uppercase tracking-wider">
                      LIVE
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {isConnected 
                        ? 'Terhubung dengan Komunitas' 
                        : isConnecting 
                          ? 'Menghubungkan...' 
                          : 'Koneksi Terputus (Mencoba menghubungkan kembali)'
                      }
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border-2 border-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white transition-all shadow-[1px_1px_0px_#0f172a]"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#FAF8F5] dark:bg-slate-950/80"
            >
              {messages.filter((m) => !hiddenMsgIds.has(m.id)).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">Mulai Obrolan Baru</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    Belum ada pesan terkirim. Jadilah orang pertama yang mengirim pesan dan menyapa anggota AlightPro lainnya!
                  </p>
                </div>
              ) : (
                messages
                  .filter((m) => !hiddenMsgIds.has(m.id))
                  .map((msg) => {
                    const isMe = currentUser && msg.username.toLowerCase() === currentUser.username.toLowerCase();
                    return (
                      <div
                        key={msg.id}
                        className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
                      >
                        {/* Sender Info with Admin badge */}
                        {renderSenderName(msg.username, Boolean(isMe))}

                        {/* Swipeable & Clickable Chat Bubble Container */}
                        <div className={`relative flex items-center gap-1.5 max-w-[88%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <motion.div
                            drag="x"
                            dragConstraints={isMe ? { left: -35, right: 0 } : { left: -35, right: 35 }}
                            dragElastic={0}
                            dragSnapToOrigin={true}
                            animate={{ x: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            onDragEnd={(_, info) => {
                              if (info.offset.x > 15 && !isMe) {
                                setReplyingTo(msg);
                              }
                              if (info.offset.x < -15) {
                                setSelectedDeleteMsg(msg);
                              }
                            }}
                            className={`p-2.5 rounded-xl border-2 text-xs font-medium break-words leading-relaxed shadow-[1px_1px_0px_#0f172a] touch-pan-y cursor-grab active:cursor-grabbing ${
                              isMe
                                ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-950 dark:border-slate-800'
                                : 'bg-white dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {/* Quoted Message Preview if replying to another message */}
                            {msg.replyTo && (
                              <div
                                className={`p-2 rounded-lg mb-2 text-[11px] border-l-4 font-medium ${
                                  isMe
                                    ? 'bg-slate-800/90 text-blue-200 border-blue-500'
                                    : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-blue-500'
                                }`}
                              >
                                <div className="flex items-center gap-1 font-black text-[10px] mb-0.5">
                                  <Reply className="w-3 h-3 text-blue-400 shrink-0" />
                                  <span className={isMe ? 'text-blue-300' : 'text-blue-600 dark:text-blue-400'}>
                                    {msg.replyTo.username}
                                  </span>
                                </div>
                                <p className="line-clamp-2 opacity-90 italic text-[10px]">
                                  {msg.replyTo.text}
                                </p>
                              </div>
                            )}

                            <p>{msg.text}</p>
                            <span
                              className={`block text-[8px] text-right mt-1 font-bold ${
                                isMe ? 'text-slate-400' : 'text-slate-400 dark:text-slate-400'
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                            </span>
                          </motion.div>

                          {/* Quick Actions (Reply & Delete Buttons) */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0">
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => setReplyingTo(msg)}
                                title="Balas pesan"
                                className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 hover:bg-blue-200 text-blue-600 dark:text-blue-400 transition-all border border-blue-300 dark:border-blue-800 shrink-0"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedDeleteMsg(msg)}
                              title="Hapus pesan"
                              className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-600 dark:text-rose-400 transition-all border border-rose-300 dark:border-rose-800 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Delete Options Popup Modal */}
            <AnimatePresence>
              {selectedDeleteMsg && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-[4px_4px_0px_#0f172a] flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>Hapus Pesan</span>
                      </div>
                      <button
                        onClick={() => setSelectedDeleteMsg(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview of the selected message */}
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] mb-0.5">
                        {selectedDeleteMsg.username.toLowerCase() === 'nabil' || selectedDeleteMsg.username.toLowerCase() === 'admin'
                          ? 'Admin'
                          : selectedDeleteMsg.username}
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium italic line-clamp-2">
                        "{selectedDeleteMsg.text}"
                      </p>
                    </div>

                    {/* Option Buttons */}
                    <div className="flex flex-col gap-2 mt-1">
                      {/* Option 0: Balas Pesan (Only if not own message) */}
                      {currentUser && selectedDeleteMsg.username.toLowerCase() !== currentUser.username.toLowerCase() && (
                        <button
                          onClick={() => {
                            setReplyingTo(selectedDeleteMsg);
                            setSelectedDeleteMsg(null);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-slate-900 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-left transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-[1px_1px_0px_#0f172a]">
                              <Reply className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-xs font-black text-slate-900 dark:text-white">
                                Balas Pesan Ini
                              </span>
                              <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                Kutip pesan dan kirim balasan
                              </span>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Option 1: Hapus untuk Diri Sendiri */}
                      <button
                        onClick={() => handleDeleteForSelf(selectedDeleteMsg.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-left transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <UserX className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-black text-slate-900 dark:text-white">
                              Hapus untuk Saya
                            </span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                              Hanya hilang dari layar kamu
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Hapus untuk Semua Orang */}
                      {(() => {
                        const isMyMessage =
                          currentUser &&
                          selectedDeleteMsg.username.toLowerCase() === currentUser.username.toLowerCase();
                        const isAdminUser =
                          currentUser &&
                          (currentUser.username.toLowerCase() === 'nabil' ||
                            currentUser.username.toLowerCase() === 'admin');
                        const canDeleteForEveryone = isMyMessage || isAdminUser;

                        return (
                          <div className="flex flex-col gap-1">
                            <button
                              disabled={!canDeleteForEveryone}
                              onClick={() => handleDeleteForEveryone(selectedDeleteMsg)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition-all ${
                                canDeleteForEveryone
                                  ? 'border-slate-900 dark:border-slate-700 bg-rose-600 text-white hover:bg-rose-700 shadow-[1.5px_1.5px_0px_#0f172a] cursor-pointer'
                                  : 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`p-1.5 rounded-lg ${
                                    canDeleteForEveryone
                                      ? 'bg-rose-700 text-white'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  <Globe className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="block text-xs font-black">
                                    Hapus untuk Semua Orang
                                  </span>
                                  <span
                                    className={`block text-[10px] ${
                                      canDeleteForEveryone
                                        ? 'text-rose-100'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    Dihapus permanen untuk semua pengguna
                                  </span>
                                </div>
                              </div>
                            </button>

                            {!canDeleteForEveryone && (
                              <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                <Info className="w-3 h-3 shrink-0" />
                                <span>Hanya pemilik pesan atau Admin yang bisa menghapus untuk semua.</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => setSelectedDeleteMsg(null)}
                      className="mt-1 w-full py-2 rounded-xl border-2 border-slate-900 dark:border-slate-700 font-extrabold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Batal
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-t-2 border-slate-900 dark:border-slate-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-extrabold shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Safety Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/30 px-3.5 py-1.5 border-t border-slate-900 dark:border-slate-800 flex items-center gap-1.5 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[9px] font-bold text-amber-800 dark:text-amber-300">
                {chatReportNotice}
              </p>
            </div>

            {/* Mute Countdown / Permanent Warning Banner (Placed Directly Above Input) */}
            <AnimatePresence>
              {muteStatus.isMuted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-rose-50 dark:bg-rose-950/80 border-t-2 border-rose-500/80 p-3 sm:p-3.5 flex flex-col gap-2 shrink-0 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-sm shrink-0 animate-pulse">
                        <VolumeX className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                          <span>
                            {muteStatus.isPermanent
                              ? '⚠️ Akun / IP Anda Sedang Dimute permanen oleh Admin'
                              : '⚠️ Anda Sedang Dimute oleh Admin'}
                          </span>
                        </span>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                          {muteStatus.reason ? `Alasan: ${muteStatus.reason}` : 'Anda tidak dapat mengirim pesan selama status mute masih aktif.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timer or Permanent Display */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-rose-100/90 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700/70 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-extrabold text-xs">
                      {muteStatus.isPermanent ? (
                        <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span>Sisa Waktu Hukuman:</span>
                    </div>

                    {muteStatus.isPermanent ? (
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-red-700 dark:text-red-300">
                        <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Permanen</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-rose-900 dark:text-rose-100">
                        {countdownString.hours > 0 && (
                          <>
                            <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700 shadow-xs">
                              {String(countdownString.hours).padStart(2, '0')} Jam
                            </span>
                            <span className="text-rose-500 font-bold">:</span>
                          </>
                        )}
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700 shadow-xs">
                          {String(countdownString.minutes).padStart(2, '0')} Menit
                        </span>
                        <span className="text-rose-500 font-bold">:</span>
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-700 shadow-xs text-rose-600 dark:text-rose-400 font-extrabold">
                          {String(countdownString.seconds).padStart(2, '0')} Detik
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reply Preview Banner */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-blue-50 dark:bg-slate-800/90 border-t-2 border-slate-900 dark:border-slate-700 px-3.5 py-2 flex items-center justify-between text-xs shrink-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-[1px_1px_0px_#0f172a]">
                      <Reply className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block truncate">
                        Membales {replyingTo.username.toLowerCase() === 'nabil' || replyingTo.username.toLowerCase() === 'admin' ? 'Admin' : replyingTo.username}
                      </span>
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate italic">
                        {replyingTo.text}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 sm:p-3 border-t-2 border-slate-900 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.substring(0, 250))}
                disabled={!isConnected || muteStatus.isMuted}
                placeholder={
                  muteStatus.isMuted
                    ? `⚠️ anda sedang dimute admin sementara` // ${countdownString.text || 'Waktu aktif'}
                    : isConnected
                    ? "Ketik pesan kamu..."
                    : "Koneksi terputus..."
                }
                className={`flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 placeholder-slate-400 dark:placeholder-slate-400 ${
                  muteStatus.isMuted
                    ? 'text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 cursor-not-allowed'
                    : 'text-slate-900 dark:text-white'
                }`}
              />
              <button
                type="submit"
                disabled={!isConnected || !inputText.trim() || muteStatus.isMuted}
                className="bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border-slate-400 dark:disabled:border-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-black p-2 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] disabled:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center w-9 h-9 shrink-0"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
