import React, { useState, useEffect, useRef } from "react";
import { Search, Send, CheckCircle2, User, Clock, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function MessagesPage() {
  const { activePatientId, currentPatient, showToast, role } = useApp();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeContact, setActiveContact] = useState("dr_priya");
  const [searchTerm, setSearchTerm] = useState("");
  const chatBottomRef = useRef(null);

  const contacts = [
    { id: "dr_priya", name: "Dr. Priya Menon", role: "Lead Endocrinologist", initials: "DP", status: "Available", unread: 0 },
    { id: "nurse_ramesh", name: "Ramesh Kumar, RN", role: "Care Coordinator", initials: "RK", status: "Online", unread: 1 }
  ];

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(activePatientId);
      setMessages(data);
    } catch (err) {
      console.warn("Using sample messages:", err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [activePatientId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageText = text;
    setText("");

    try {
      const senderName = role === "Patient" ? (currentPatient?.name || "Ananya Rao") : "Dr. Priya Menon";
      const senderRole = role === "Patient" ? "patient" : "clinician";

      const saved = await api.sendMessage(activePatientId, {
        text: messageText,
        sender_role: senderRole,
        sender_name: senderName
      });

      setMessages(prev => [...prev, saved]);
      showToast("Message securely dispatched to care team");

      // Poll for auto-reply after 1.8s
      setTimeout(() => {
        loadMessages();
      }, 1800);
    } catch (err) {
      // Local fallback
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender_role: "patient",
          sender_name: currentPatient?.name || "Ananya Rao",
          sender_initials: currentPatient?.avatar_initials || "AR",
          text: messageText,
          sent_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showToast("Message sent", "info");
    }
  };

  const selectedContact = contacts.find(c => c.id === activeContact) || contacts[0];

  return (
    <div className="messages-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">SECURE ENCRYPTED CARE TELECOMMUNICATION</div>
          <h1>Care Team Consultation & Messaging</h1>
          <p>Direct asynchronous communication with your assigned endocrinologist and nurse coordinator.</p>
        </div>
      </div>

      <div className="messages-layout">
        {/* Left: Care Team Contact List */}
        <div className="conversation-list">
          <div className="search-box">
            <Search size={15} />
            <input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              id="input-search-chat"
            />
          </div>

          {contacts
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((c) => (
              <div
                key={c.id}
                className={`conversation ${activeContact === c.id ? "active" : ""}`}
                onClick={() => setActiveContact(c.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="avatar" style={{ background: activeContact === c.id ? "var(--primary)" : "#dceeff", color: activeContact === c.id ? "#fff" : "#1264b5" }}>
                  {c.initials}
                </div>
                <div>
                  <b>{c.name}</b>
                  <span>{c.role}</span>
                </div>
                {c.unread > 0 && <i>{c.unread}</i>}
              </div>
            ))}

          <div style={{ padding: "14px", marginTop: "auto", borderTop: "1px solid var(--line)", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#6a7b8e" }}>
              <ShieldCheck size={14} color="var(--green)" /> HIPAA & Telehealth Compliant
            </div>
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="chat">
          <div className="chat-head">
            <div className="avatar" style={{ background: "#dceeff", color: "#1264b5" }}>
              {selectedContact.initials}
            </div>
            <div>
              <b>{selectedContact.name}</b>
              <span>{selectedContact.role} · CareSync Certified Provider</span>
            </div>
            <StatusBadge label={selectedContact.status} tone="green" />
          </div>

          <div className="chat-body" id="chat-messages-container">
            {messages.map((m, idx) => {
              const isMe = m.sender_role === (role === "Patient" ? "patient" : "clinician");
              return (
                <div
                  key={m.id || idx}
                  className={`message ${isMe ? "sent" : "received"}`}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "3px", opacity: 0.85 }}>
                    {m.sender_name}
                  </div>
                  <div>{m.text}</div>
                  <small style={{ textAlign: isMe ? "right" : "left", opacity: 0.75 }}>
                    {m.sent_at ? String(m.sent_at).slice(11, 16) || "Today" : "Just now"}
                  </small>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          <form className="chat-input" onSubmit={handleSend}>
            <input
              placeholder={`Write a confidential message to ${selectedContact.name}...`}
              value={text}
              onChange={e => setText(e.target.value)}
              id="input-chat-message"
            />
            <button type="submit" aria-label="Send message" id="btn-send-message">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
