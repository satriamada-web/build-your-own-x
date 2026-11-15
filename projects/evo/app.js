const STORE_KEY = "evo.memory.v1";
const FEEDBACK_KEY = "evo.feedback.v1";
const $ = (id) => document.getElementById(id);
let turns = 0;

function loadMemory() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
  catch { return []; }
}
function loadFeedback() { try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]"); } catch { return []; } }
function saveMemory(items) {
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
  $("exportMemory").addEventListener("click", () => {
  const payload = { format:"evo-memory", version:1, exportedAt:new Date().toISOString(), memories:loadMemory(), feedback:loadFeedback() };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href=url; link.download="evo-memory-backup.json"; link.click(); URL.revokeObjectURL(url);
});
$("importMemory").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.format !== "evo-memory" || !Array.isArray(payload.memories)) throw new Error("Format file tidak dikenali.");
    const valid = payload.memories.filter(x => x && typeof x.content === "string" && x.content.trim()).map(x => ({
      id: String(x.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now()+Math.random())),
      content: x.content.slice(0,3000), category: String(x.category || "general").slice(0,40),
      createdAt: x.createdAt || new Date().toISOString()
    }));
    const merged = [...loadMemory()];
    for (const item of valid) if (!merged.some(old => old.content === item.content)) merged.push(item);
    saveMemory(merged);
    if (Array.isArray(payload.feedback)) localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...loadFeedback(), ...payload.feedback].slice(-500)));
    addMessage("evo", valid.length + " catatan berhasil diproses. Catatan duplikat dilewati.", "MEMORY");
  } catch (error) { alert("Impor gagal: " + error.message); }
  event.target.value = "";
});
renderMemory();
}
function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 2);
}
function detectIntent(text) {
  const t = text.toLowerCase();
  const rules = [
    ["learning", /\b(ingat|simpan|pelajari|ingatkan|catat)\b/],
    ["planning", /\b(rencana|buatkan|susun|target|strategi|jadwal)\b/],
    ["reflection", /\b(analisis|evaluasi|perbaiki|menurutmu|refleksi)\b/],
    ["question", /\b(apa|mengapa|kenapa|bagaimana|jelaskan|siapa|kapan)\b/],
    ["action", /\b(lakukan|jalankan|mulai|kerjakan|buat|bangun)\b/]
  ];
  return rules.find(([, pattern]) => pattern.test(t))?.[0] || "general";
}
function recall(text) {
  const words = new Set(tokenize(text));
  return loadMemory().map(item => {
    const overlap = tokenize(item.content).filter(w => words.has(w)).length;
    return { ...item, score: overlap };
  }).filter(x => x.score > 0).sort((a,b) => b.score-a.score).slice(0,3);
}
function think(text) {
  const intent = detectIntent(text);
  const memories = recall(text);
  const responses = {
    learning: ["Sepertinya ada informasi yang ingin kamu jadikan pengetahuan. Aku tidak akan menyimpannya diam-diam; gunakan tombol “Simpan” agar kamu mengonfirmasi isinya.", "Konfirmasi informasi yang ingin disimpan melalui panel Memori EVO."],
    planning: ["Aku menangkap tujuan perencanaan. Kita perlu memecahnya menjadi hasil akhir, batasan, dan langkah yang bisa dievaluasi.", "Tentukan satu hasil terukur sebagai langkah pertama."],
    reflection: ["Aku akan melihat pola, asumsi, dan kemungkinan perbaikan berdasarkan konteks yang tersedia. Analisis ini masih berbasis aturan sederhana.", "Uji satu perubahan kecil dan evaluasi hasilnya."],
    question: ["Aku mengenali ini sebagai pertanyaan. Prototipe v0.1 belum terhubung ke model bahasa eksternal, jadi kemampuan menjawab pengetahuan umum masih terbatas.", "Berikan konteks tambahan atau pecah pertanyaan menjadi bagian yang lebih spesifik."],
    action: ["Aku memahami ada permintaan tindakan. Dalam mode semi-otonom, aku hanya menyiapkan usulan dan tidak menjalankan tindakan eksternal.", "Tinjau usulan langkah sebelum memberi persetujuan."],
    general: ["Aku menerima pesanmu. Bantu aku memahami tujuan atau konteks yang lebih spesifik agar respons berikutnya lebih relevan.", "Jelaskan hasil yang ingin kamu capai."]
  };
  const [response, next] = responses[intent];
  const memoryText = memories.length ? memories.map(m => "• " + m.content).join("\n") : "Belum ada memori yang cocok.";
  return { intent, response, next, memoryText };
}
function addMessage(role, text, meta = "") {
  const article = document.createElement("article");
  article.className = "message " + role;
  const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = role === "evo" ? "E" : "K";
  const body = document.createElement("div");
  const speaker = document.createElement("div"); speaker.className = "speaker"; speaker.textContent = role === "evo" ? "EVO · " + meta : "KAMU";
  const p = document.createElement("p"); p.textContent = text;
  body.append(speaker, p); article.append(avatar, body); $("messages").append(article);
  if (role === "evo" && meta !== "CORE" && meta !== "MEMORY") {
    const feedback = document.createElement("div"); feedback.className = "feedback";
    const label = document.createElement("span"); label.textContent = "Respons ini membantu?";
    const yes = document.createElement("button"); yes.textContent = "Membantu";
    const no = document.createElement("button"); no.textContent = "Perlu diperbaiki";
    const record = (rating) => { const data = loadFeedback(); data.push({rating, intent:meta, at:new Date().toISOString()}); localStorage.setItem(FEEDBACK_KEY, JSON.stringify(data)); feedback.textContent = "Terima kasih. Umpan balik dicatat untuk evaluasi lokal."; };
    yes.addEventListener("click", () => record("helpful")); no.addEventListener("click", () => record("needs_improvement"));
    feedback.append(label, yes, no); body.append(feedback);
  }
  $("messages").scrollTop = $("messages").scrollHeight;
}
function renderMemory() {
  const items = loadMemory();
  $("memoryCount").textContent = items.length;
  const list = $("memoryList"); list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "Belum ada memori. Simpan fakta atau preferensi untuk mulai membangun konteks."; list.append(empty); return;
  }
  items.slice().reverse().forEach(item => {
    const card = document.createElement("div"); card.className = "memory-item";
    const del = document.createElement("button"); del.textContent = "Hapus"; del.setAttribute("aria-label","Hapus memori");
    del.addEventListener("click", () => saveMemory(loadMemory().filter(x => x.id !== item.id)));
    const category = document.createElement("small"); category.textContent = item.category.toUpperCase();
    const content = document.createElement("span"); content.textContent = item.content;
    card.append(del, category, content); list.append(card);
  });
}
$("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const text = $("userInput").value.trim(); if (!text) return;
  addMessage("user", text); $("userInput").value = "";
  const result = think(text); turns++; $("turnCount").textContent = turns;
  const used = result.memoryText === "Belum ada memori yang cocok." ? "" : "\n\nKonteks memori yang cocok:\n" + result.memoryText;
  addMessage("evo", result.response + used + "\n\nUsulan langkah berikutnya: " + result.next, result.intent.toUpperCase());
});
$("userInput").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); $("chatForm").requestSubmit(); }
});
$("addMemory").addEventListener("click", () => $("memoryDialog").showModal());
$("closeDialog").addEventListener("click", () => $("memoryDialog").close());
$("memoryForm").addEventListener("submit", event => {
  event.preventDefault();
  const content = $("memoryText").value.trim(); if (!content) return;
  const items = loadMemory();
  items.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), content, category: $("memoryCategory").value, createdAt: new Date().toISOString() });
  saveMemory(items); $("memoryText").value = ""; $("memoryDialog").close();
  addMessage("evo", "Informasi berhasil disimpan di memori lokal browser. Kamu dapat melihat atau menghapusnya kapan saja.", "MEMORY");
});
$("clearChat").addEventListener("click", () => {
  $("messages").replaceChildren();
  addMessage("evo", "Riwayat tampilan percakapan dibersihkan. Memori tersimpan tetap ada sampai kamu menghapusnya.", "CORE");
});
renderMemory();
