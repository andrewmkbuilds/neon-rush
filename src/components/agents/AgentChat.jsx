import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, ChevronLeft, Wrench, ChevronDown } from "lucide-react";

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || "pending";
  const failed = status === "failed" || status === "error";
  const running = ["pending", "running", "in_progress"].includes(status);
  const proj = toolCall.display_projection || {};
  const hide = proj.hide_details && proj.details_redacted;
  const label = proj.label || toolCall.name || "tool";
  const statusText = running
    ? (proj.active_label || "working…")
    : failed
    ? (proj.error_label || "failed")
    : (proj.label ? "done" : "done");

  let parsedArgs = toolCall.arguments_string;
  try { parsedArgs = JSON.parse(toolCall.arguments_string); } catch { /* keep raw */ }
  let parsedResults = toolCall.results;
  if (typeof parsedResults === "string") {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw */ }
  }
  const resultFailed = parsedResults && typeof parsedResults === "object" && parsedResults.success === false;

  return (
    <div className="mt-2 text-xs rounded-lg border border-white/10 bg-white/[0.04] overflow-hidden">
      <button
        onClick={() => hide ? null : setExpanded((e) => !e)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${hide ? "cursor-default" : "hover:bg-white/5"}`}
      >
        {running ? <Loader2 size={12} className="animate-spin text-[#00F5FF]" /> : <Wrench size={12} className={failed || resultFailed ? "text-[#FF3B5C]" : "text-[#34D399]"} />}
        <span className="font-display font-bold tracking-wide text-[#CBD5E1] truncate">{label}</span>
        <span className={failed || resultFailed ? "text-[#FF3B5C]" : running ? "text-[#00F5FF]" : "text-[#94A3B8]"}>· {statusText}</span>
        {!hide && <ChevronDown size={12} className={`ml-auto text-[#64748B] transition ${expanded ? "rotate-180" : ""}`} />}
      </button>
      {expanded && !hide && (
        <div className="px-2.5 pb-2 pt-1 space-y-1.5 border-t border-white/5">
          {parsedArgs !== undefined && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#64748B] mb-0.5">Parameters</div>
              <pre className="whitespace-pre-wrap break-all text-[#94A3B8] font-mono text-[10px] leading-relaxed">{typeof parsedArgs === "string" ? parsedArgs : JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults !== undefined && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#64748B] mb-0.5">Result</div>
              <pre className="whitespace-pre-wrap break-all text-[#94A3B8] font-mono text-[10px] leading-relaxed">{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${isUser ? "bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[#F8FAFC]" : "bg-white/[0.06] border border-white/10 text-[#E2E8F0]"}`}>
        {message.content && (isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed">{message.content}</ReactMarkdown>
        ))}
        {message.tool_calls?.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}

export default function AgentChat({ agentName, title, accentColor = "#00F5FF", onBack }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = null;
    (async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: agentName,
          metadata: { name: title, description: title },
        });
        if (cancelled) return;
        setConversation(conv);
        setMessages(conv.messages || []);
        unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
          if (!cancelled) setMessages(data.messages || []);
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Could not start conversation.");
      }
    })();
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [agentName, title]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversation || sending) return;
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (e) {
      setError(e?.message || "Message failed to send.");
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, conversation, sending]);

  return (
    <div className="flex flex-col h-full bg-[#05060D] text-[#F8FAFC]">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 border-b border-white/10 bg-[#05060D]/90 backdrop-blur">
        <button onClick={onBack} onMouseDown={(e) => e.preventDefault()} className="w-11 h-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/10 active:scale-95 transition" aria-label="Back">
          <ChevronLeft size={20} className="text-[#F8FAFC]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
          <div>
            <div className="font-display font-bold tracking-wider text-sm" style={{ color: accentColor }}>{title}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#64748B]">AI Assistant</div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-hide">
        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-[#FF3B5C]/40 bg-[#FF3B5C]/10 p-3 text-center text-sm text-[#FF8FA3]">
            {error}
          </div>
        )}
        {!conversation && !error && (
          <div className="flex items-center justify-center h-full text-[#64748B]">
            <Loader2 size={20} className="animate-spin mr-2" /> Connecting…
          </div>
        )}
        {conversation && messages.length === 0 && !sending && (
          <div className="text-center text-[#64748B] text-sm py-10">Say hello to start the conversation.</div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3.5 py-2.5 bg-white/[0.06] border border-white/10">
              <Loader2 size={14} className="animate-spin text-[#94A3B8]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/10 bg-[#05060D]/90 backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 resize-none max-h-32 rounded-xl bg-white/[0.06] border border-white/15 px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#00F5FF]/50 focus-visible:ring-1 focus-visible:ring-[#00F5FF]/40"
          />
          <button
            onClick={send}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!input.trim() || sending || !conversation}
            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: `${accentColor}1a`, border: `1px solid ${accentColor}55`, boxShadow: `0 0 12px ${accentColor}33` }}
            aria-label="Send"
          >
            {sending ? <Loader2 size={18} className="animate-spin" style={{ color: accentColor }} /> : <Send size={18} style={{ color: accentColor }} />}
          </button>
        </div>
      </div>
    </div>
  );
}