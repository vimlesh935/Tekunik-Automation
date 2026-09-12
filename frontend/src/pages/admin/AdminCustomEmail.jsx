import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Send, Eye, Bold, Italic, Underline, List, ListOrdered, AlignLeft,
  AlignCenter, AlignRight, Link2, Unlink, Undo2, Redo2, Type, Save, Loader2,
  CheckCircle2, XCircle, X, User, AtSign, Mail, History, Trash2, RotateCcw,
  Clock, Info, ShieldCheck,
} from "lucide-react";
import apiCall from "../../services/api.js";
import Toast from "../../admin/components/common/Toast.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Simple visual email editor — the admin never sees HTML/CSS/JSON.
// Supports bold, italic, underline, headings, bullet & numbered lists, links,
// alignment, paragraphs and line breaks. Inserts friendly tags only.
// ─────────────────────────────────────────────────────────────────────────────
function RichEditor({ value, onChange, placeholder, registerApi }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
    // Only sync when the value changes externally (load template). While the
    // admin types, the DOM is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the parent state in sync when the external value changes (e.g. load).
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const captureSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const exec = (command, val = null) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode))) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand(command, false, val || undefined);
    emit();
  };

  const formatBlock = (block) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("formatBlock", false, block);
    emit();
  };

  const insertLink = () => {
    const url = window.prompt("Enter the link URL", "https://");
    if (url === null) return;
    const value = url.trim();
    if (!value) { exec("unlink"); return; }
    if (!/^https?:\/\//i.test(value) && !/^mailto:/i.test(value)) {
      window.alert("Please enter a link starting with https:// or mailto:");
      return;
    }
    exec("createLink", value);
  };

  const insertTag = (tag) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode))) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand("insertText", false, tag);
    emit();
  };

  useEffect(() => {
    if (registerApi) registerApi.current = { insertTag };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insertTag]);

  return (
    <div className="editor-shell rounded-xl overflow-hidden border border-gray-700 bg-white">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-900/80 border-b border-gray-700 flex-wrap">
        <button type="button" title="Bold" onClick={() => exec("bold")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <Bold size={14} />
        </button>
        <button type="button" title="Italic" onClick={() => exec("italic")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <Italic size={14} />
        </button>
        <button type="button" title="Underline" onClick={() => exec("underline")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <Underline size={14} />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <div className="relative">
          <select
            title="Text style"
            onChange={(e) => { if (e.target.value) formatBlock(e.target.value); e.target.value = ""; }}
            defaultValue=""
            className="appearance-none h-8 pl-2 pr-6 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 border border-gray-700 text-xs font-semibold cursor-pointer outline-none"
          >
            <option value="" disabled>Style</option>
            <option value="p">Regular text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <Type size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <button type="button" title="Bullet list" onClick={() => exec("insertUnorderedList")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <List size={14} />
        </button>
        <button type="button" title="Numbered list" onClick={() => exec("insertOrderedList")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <button type="button" title="Align left" onClick={() => exec("justifyLeft")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <AlignLeft size={14} />
        </button>
        <button type="button" title="Align center" onClick={() => exec("justifyCenter")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <AlignCenter size={14} />
        </button>
        <button type="button" title="Align right" onClick={() => exec("justifyRight")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <AlignRight size={14} />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <button type="button" title="Insert link" onClick={insertLink}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <Link2 size={14} />
        </button>
        <button type="button" title="Remove link" onClick={() => exec("unlink")}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
          <Unlink size={14} />
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" title="Undo" onClick={() => exec("undo")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
            <Undo2 size={14} />
          </button>
          <button type="button" title="Redo" onClick={() => exec("redo")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700">
            <Redo2 size={14} />
          </button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        data-placeholder={placeholder}
        onInput={emit}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        onClick={captureSelection}
        onFocus={captureSelection}
        suppressContentEditableWarning
        className="rich-canvas rich-canvas-body"
      />
      <style>{`
        .rich-canvas {
          background: #ffffff;
          color: #1f2937;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.65;
          outline: none;
          word-break: break-word;
        }
        .rich-canvas-body { padding: 18px 22px; min-height: 300px; }
        .rich-canvas-body:empty::before { content: attr(data-placeholder); color: #9ca3af; }
        .rich-canvas h1 { font-size: 30px; font-weight: 800; margin: 14px 0 8px; color: #111827; }
        .rich-canvas h2 { font-size: 24px; font-weight: 700; margin: 12px 0 8px; color: #111827; }
        .rich-canvas h3 { font-size: 19px; font-weight: 600; margin: 10px 0 6px; color: #111827; }
        .rich-canvas p { margin: 8px 0; }
        .rich-canvas ul, .rich-canvas ol { padding-left: 26px; margin: 8px 0; }
        .rich-canvas a { color: #1d4ed8; text-decoration: underline; }
        .rich-canvas blockquote { border-left: 4px solid #cbd5e1; padding-left: 14px; color: #374151; margin: 10px 0; }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const ok = status === "sent";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${ok ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {ok ? "Sent" : "Failed"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function AdminCustomEmail() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [resolveInfo, setResolveInfo] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [insertInto, setInsertInto] = useState("body");

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const subjectRef = useRef(null);
  const bodyApiRef = useRef(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const validRecipient = useMemo(() => EMAIL_REGEX.test(recipient.trim()), [recipient]);
  const canSend = Boolean(validRecipient && subject.trim() && body.trim() && !sending);

  const checkRecipient = async (email) => {
    const value = String(email || recipient || "").trim();
    if (!EMAIL_REGEX.test(value)) {
      setResolveInfo(null);
      return;
    }
    setResolveLoading(true);
    try {
      const json = await apiCall("/api/admin/custom-email/resolve", {
        method: "POST",
        body: JSON.stringify({ to: value }),
      });
      if (json.success) {
        setResolveInfo({
          email: json.data.email,
          isRegistered: json.data.isRegistered,
          name: json.data.name,
        });
      }
    } catch {
      setResolveInfo(null);
    } finally {
      setResolveLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { checkRecipient(recipient); }, 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient]);

  const insertTagAt = (tag) => {
    if (insertInto === "subject") {
      const el = subjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      el.focus();
      const next = el.value.slice(0, start) + tag + el.value.slice(end);
      setSubject(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + tag.length;
      });
    } else {
      bodyApiRef.current?.insertTag(tag);
    }
  };

  const clearForm = () => {
    setRecipient("");
    setSubject("");
    setBody("");
    setTestEmail("");
    setResolveInfo(null);
    setTestResult(null);
    setPreview(null);
    setSelectedTemplateId("");
    setTemplateName("");
  };

  const openPreview = async () => {
    if (!validRecipient) return showToast("Enter a valid recipient email", "error");
    if (!subject.trim()) return showToast("Email Subject cannot be empty", "error");
    if (!body.trim()) return showToast("Email Message cannot be empty", "error");
    setPreviewing(true);
    try {
      const json = await apiCall("/api/admin/custom-email/preview", {
        method: "POST",
        body: JSON.stringify({ to: recipient.trim(), subject, body }),
      });
      if (json.success) {
        setPreview(json.data);
      } else {
        showToast(json.message || "Preview failed", "error");
      }
    } catch (err) {
      showToast(err.message || "Preview failed", "error");
    } finally {
      setPreviewing(false);
    }
  };

  const sendTest = async () => {
    const to = testEmail.trim();
    if (!EMAIL_REGEX.test(to)) return showToast("Enter a valid test email address", "error");
    if (!subject.trim() || !body.trim()) return showToast("Write a subject and message first", "error");
    setSendingTest(true);
    setTestResult(null);
    try {
      const json = await apiCall("/api/admin/custom-email/send-test", {
        method: "POST",
        body: JSON.stringify({ to, subject, body }),
      });
      if (json.success && json.data?.sent) {
        setTestResult({ ok: true, to, message: `Test email sent to ${to}` });
        showToast("Test email sent");
      } else {
        setTestResult({ ok: false, to, message: "Unable to send email. Please try again." });
        showToast("Unable to send email. Please try again.", "error");
      }
    } catch (err) {
      setTestResult({ ok: false, to, message: err.message || "Unable to send email. Please try again." });
      showToast("Unable to send email. Please try again.", "error");
    } finally {
      setSendingTest(false);
    }
  };

  const confirmSend = () => {
    if (!canSend) return;
    setConfirmOpen(true);
  };

  const doSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const json = await apiCall("/api/admin/custom-email/send", {
        method: "POST",
        body: JSON.stringify({ to: recipient.trim(), subject, body }),
      });
      if (json.success) {
        showToast("Email sent successfully.");
        loadHistory();
      } else {
        showToast(json.message || "Unable to send email. Please try again.", "error");
      }
    } catch (err) {
      showToast(err.message || "Unable to send email. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  // ── Templates ──────────────────────────────────────────────────────────────
  const loadTemplates = async () => {
    try {
      const json = await apiCall("/api/admin/custom-email/templates");
      if (json.success) setTemplates(json.data || []);
    } catch {
      /* non-blocking */
    }
  };

  const loadTemplate = async (id) => {
    if (!id) return;
    try {
      const json = await apiCall(`/api/admin/custom-email/templates/${id}`);
      if (json.success) {
        const t = json.data;
        setSubject(t.subject || "");
        setBody(t.body || "");
        setTemplateName(t.template_name || "");
        showToast(`Loaded "Simple" template: ${t.template_name}`);
      }
    } catch (err) {
      showToast(err.message || "Unable to load template", "error");
    }
  };

  const saveTemplate = async () => {
    const name = templateName.trim();
    if (!name) return showToast("Enter a template name", "error");
    if (!subject.trim() || !body.trim()) return showToast("Write a subject and message first", "error");
    setSavingTemplate(true);
    try {
      let json;
      if (selectedTemplateId) {
        json = await apiCall(`/api/admin/custom-email/templates/${selectedTemplateId}`, {
          method: "PUT",
          body: JSON.stringify({ template_name: name, subject, body }),
        });
      } else {
        json = await apiCall("/api/admin/custom-email/templates", {
          method: "POST",
          body: JSON.stringify({ template_name: name, subject, body }),
        });
      }
      if (json.success) {
        showToast("Custom template saved");
        loadTemplates();
        if (!selectedTemplateId) setSelectedTemplateId(String(json.data?.id || ""));
      } else {
        showToast(json.message || "Unable to save template", "error");
      }
    } catch (err) {
      showToast(err.message || "Unable to save template", "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!window.confirm("Delete this custom template?")) return;
    setDeletingTemplate(true);
    try {
      const json = await apiCall(`/api/admin/custom-email/templates/${selectedTemplateId}`, { method: "DELETE" });
      if (json.success) {
        showToast("Custom template deleted");
        setSelectedTemplateId("");
        setTemplateName("");
        loadTemplates();
      } else {
        showToast(json.message || "Unable to delete template", "error");
      }
    } catch (err) {
      showToast(err.message || "Unable to delete template", "error");
    } finally {
      setDeletingTemplate(false);
    }
  };

  // ── History ────────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const json = await apiCall("/api/admin/custom-email/history?limit=50");
      if (json.success) setHistory(json.data || []);
    } catch {
      /* non-blocking */
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: compose */}
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-black/40 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Recipient Email</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  onBlur={() => { if (validRecipient) checkRecipient(recipient); }}
                  placeholder="customer@example.com or any valid email"
                  className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition"
                />
                {resolveLoading && <Loader2 size={18} className="animate-spin text-cyan-400 shrink-0" />}
              </div>
              {resolveInfo && (
                <div className={`mt-2 flex items-start gap-2 text-xs rounded-xl px-3 py-2 border ${resolveInfo.isRegistered ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-gray-900/50 text-gray-400 border-gray-700"}`}>
                  {resolveInfo.isRegistered ? <User size={14} className="shrink-0 mt-0.5" /> : <Info size={14} className="shrink-0 mt-0.5" />}
                  <span>
                    {resolveInfo.isRegistered
                      ? <>Registered customer — <strong>[Name]</strong> will be <strong>{resolveInfo.name}</strong> and <strong>[Email]</strong> resolves to {resolveInfo.email}.</>
                      : <>Not a registered user — <strong>[Name]</strong> will be replaced with "Customer". <strong>[Email]</strong> resolves to {resolveInfo.email}.</>}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Subject</label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setInsertInto("subject")}
                maxLength={500}
                placeholder="Important Update"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Email Message</label>
                <span className="text-gray-600 text-xs">Type naturally — no coding needed.</span>
              </div>
              <RichEditor
                value={body}
                onChange={setBody}
                placeholder="Write your email message here..."
                registerApi={bodyApiRef}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={confirmSend} disabled={!canSend}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Email
            </button>
            <button type="button" onClick={openPreview} disabled={previewing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800/70 text-gray-200 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold disabled:opacity-50">
              {previewing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Preview
            </button>
            <button type="button" onClick={clearForm} disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800/70 text-gray-300 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold disabled:opacity-50">
              <RotateCcw size={16} /> Cancel
            </button>
          </div>
          <p className="text-gray-500 text-xs">
            The recipient receives exactly what you write. Only [Name] and [Email] are resolved for the chosen recipient.
          </p>
        </div>

        {/* Right: details, test, templates */}
        <div className="space-y-5">
          <section className="bg-black/40 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <AtSign size={16} className="text-cyan-400" /> Add Details
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Insert into:</span>
              {[
                { v: "subject", label: "Subject" },
                { v: "body", label: "Message" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setInsertInto(o.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${insertInto === o.v ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40" : "bg-gray-900/50 text-gray-400 border-gray-700 hover:text-gray-200"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => insertTagAt("[Name]")}
                className="w-full flex items-center gap-2 bg-gray-900/50 border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800/60 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center"><User size={14} /></span> [Name]
              </button>
              <button type="button" onClick={() => insertTagAt("[Email]")}
                className="w-full flex items-center gap-2 bg-gray-900/50 border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800/60 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center"><AtSign size={14} /></span> [Email]
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-3">
              If the recipient is a registered customer, [Name] uses their real name. Otherwise it becomes "Customer" — the email never breaks.
            </p>
          </section>

          <section className="bg-black/40 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Send size={16} className="text-cyan-400" /> Send Test Email
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email address"
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition flex-1"
              />
              <button
                type="button"
                onClick={sendTest}
                disabled={sendingTest}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-xs font-semibold disabled:opacity-40 whitespace-nowrap"
              >
                {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Test Email
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Sends this draft only to the test address with sample values. No user data is modified.
            </p>
            {testResult && (
              <div className={`mt-3 rounded-xl px-3 py-2.5 text-xs border ${testResult.ok ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-red-500/10 text-red-300 border-red-500/30"}`}>
                <CheckCircle2 size={13} className="inline" /> {testResult.message}
              </div>
            )}
          </section>

          <section className="bg-black/40 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Save size={16} className="text-cyan-400" /> Reusable Custom Templates
            </h3>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Load Template</label>
            <div className="flex items-center gap-2 mb-3">
              <select
                value={selectedTemplateId}
                onChange={(e) => { setSelectedTemplateId(e.target.value); loadTemplate(e.target.value); }}
                className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition"
              >
                <option value="">{templates.length ? "Choose a template..." : "No templates yet"}</option>
                {templates.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.template_name}</option>
                ))}
              </select>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Customer Follow-up"
              maxLength={200}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none transition mb-3"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveTemplate}
                disabled={savingTemplate}
                className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save as Template
              </button>
              <button
                type="button"
                onClick={deleteTemplate}
                disabled={deletingTemplate || !selectedTemplateId}
                title="Delete selected template"
                className="inline-flex items-center justify-center w-10 h-10 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg disabled:opacity-40"
              >
                {deletingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-3">
              Custom templates are saved separately from the automated email templates.
            </p>
          </section>
        </div>
      </div>

      {/* History */}
      <section className="bg-black/40 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <History size={16} className="text-cyan-400" /> Custom Email History
        </h3>
        {historyLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-500 text-sm">
            <Loader2 size={18} className="animate-spin text-cyan-400" /> Loading...
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No custom emails have been sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Recipient</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Subject</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">Sent By</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Date &amp; Time</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-gray-800/60 last:border-0 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <div className="text-white font-semibold">{h.recipient_email}</div>
                      {h.recipient_name && <div className="text-gray-500 text-xs">Resolved name: {h.recipient_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-300 line-clamp-1 max-w-[280px]">{h.subject}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{h.sent_by_email || "Admin"}</td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-gray-600" /> {formatDate(h.created_at)}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Preview modal — never sends a real email */}
      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-6">
          <div className="w-full max-w-2xl bg-black/70 border border-gray-700 rounded-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye size={18} className="text-cyan-400" /> Email Preview
                </h3>
                <p className="text-gray-500 text-xs mt-1">Shows how the email will look. No email is sent during preview.</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="w-9 h-9 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center justify-center" aria-label="Close preview">
                <X size={16} />
              </button>
            </div>
            <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
              <Mail size={14} className="text-cyan-500/70" /> To: <span className="text-white font-semibold">{preview.recipient}</span>
              <span className="text-gray-600">·</span> [Name] → {preview.name}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Subject</p>
              <div className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">{preview.subject}</div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Message</p>
            <div className="bg-black/40 border border-gray-800 rounded-xl overflow-hidden">
              <div className="w-full border-0 bg-white p-6" dangerouslySetInnerHTML={{ __html: preview.body }} />
            </div>
            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setPreview(null)} className="px-5 py-2.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl text-sm font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation before sending */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-black/70 border border-gray-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Send size={18} className="text-cyan-400" /> Confirm Send
            </h3>
            <div className="space-y-2 text-sm mb-5">
              <p className="text-gray-400">Send this email to:</p>
              <p className="text-white font-bold">{recipient.trim()}</p>
              <p className="text-gray-400 mt-2">Subject:</p>
              <p className="text-white font-semibold">{subject}</p>
              {resolveInfo && !resolveInfo.isRegistered && (
                <p className="text-gray-500 text-xs mt-2">[Name] will be replaced with "Customer".</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmOpen(false)} className="px-5 py-2.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl text-sm font-semibold">Cancel</button>
              <button type="button" onClick={doSend} disabled={sending}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}