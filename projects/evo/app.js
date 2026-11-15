const STORE_KEY = "evo.memory.v1";
const FEEDBACK_KEY = "evo.feedback.v1";
const EPISODE_KEY = "evo.episodes.v1";
const $ = id => document.getElementById(id);
let turns = 0;

function read(key) { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } }
const loadMemory = () => read(STORE_KEY);
const loadFeedback = () => read(FEEDBACK_KEY);
const loadEpisodes = () => read(EPISODE_KEY);
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function saveMemory(items) { write(STORE_KEY, items); renderMemory(); }

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

/* Adaptive layer: transparent, local and reversible.
   Feedback changes response strategy only; it does not train a model. */
function adaptationFor(intent) {
  const relevant = loadFeedback().filter(x => x.intent === intent.toUpperCase());
  const helpful = relevant.filter(x => x.rating === "helpful").length;
  const negative = relevant.filter(x => x.rating === "needs_improvement").length;
  const total = helpful + negative;
  if (total < 3) return { mode:"baseline", sample:total, rate:null, instruction:"Mengumpulkan minimal 3 penilaian untuk intent ini." };
  const rate = helpful / total;
  if (rate < 0.5) return { mode:"clarify", sample:total, rate, instruction:"Respons sebelumnya sering perlu diperbaiki; gunakan jawaban lebih ringkas dan minta konteks spesifik." };
  if (rate >= 0.8) return { mode:"maintain", sample:total, rate, instruction:"Strategi respons saat ini cukup membantu; pertahankan struktur." };
  return { mode:"balanced", sample:total, rate, instruction:"Gunakan struktur seimbang dan periksa apakah tujuan sudah terpenuhi." };
}
function think(text) {
  const intent = detectIntent(text);
  const memories = recall(text);
  const templates = {
    learning: ["Sepertinya ada informasi yang ingin kamu jadikan pengetahuan. Aku tidak akan menyimpannya diam-diam; gunakan tombol Simpan agar kamu mengonfirmasi isinya.", "Konfirmasi informasi yang ingin disimpan melalui panel Memori EVO."],
    planning: ["Aku menangkap tujuan perencanaan. Kita perlu memecahnya menjadi hasil akhir, batasan, dan langkah yang bisa dievaluasi.", "Tentukan satu hasil terukur sebagai langkah pertama."],
    reflection: ["Aku akan melihat pola, asumsi, dan kemungkinan perbaikan berdasarkan konteks yang tersedia. Analisis ini masih berbasis aturan sederhana.", "Uji satu perubahan kecil dan evaluasi hasilnya."],
    question: ["Aku mengenali ini sebagai pertanyaan. Prototipe ini belum terhubung ke model bahasa eksternal, jadi kemampuan menjawab pengetahuan umum masih terbatas.", "Berikan konteks tambahan atau pecah pertanyaan menjadi bagian yang lebih spesifik."],
    action: ["Aku memahami ada permintaan tindakan. Dalam mode semi-otonom, aku hanya menyiapkan usulan dan tidak menjalankan tindakan eksternal.", "Tinjau usulan langkah sebelum memberi persetujuan."],
    general: ["Aku menerima pesanmu. Bantu aku memahami tujuan atau konteks yang lebih spesifik agar respons berikutnya lebih relevan.", "Jelaskan hasil yang ingin kamu capai."]
  };
  let [response, next] = templates[intent];
  const adaptation = adaptationFor(intent);
  if (adaptation.mode === "clarify") {
    response = "Aku akan menjawab lebih ringkas karena beberapa respons sebelumnya pada kategori ini dinilai kurang membantu. " + response;
    next = "Apa satu detail terpenting yang perlu aku ketahui agar lebih tepat?";
  }
  const memoryText = memories.length ? memories.map(m => "• " + m.content).join("\n") : "Belum ada memori yang cocok.";
  const episode = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), intent, input:text, memoryIds:memories.map(m=>m.id), strategy:adaptation.mode, at:new Date().toISOString() };
  const episodes = loadEpisodes(); episodes.push(episode); write(EPISODE_KEY, episodes.slice(-500));
  return { intent, response, next, memoryText, episodeId:episode.id, adaptation };
}
function addMessage(role, text, meta = "", episodeId = "") {
  const article = document.createElement("article"); article.className = "message " + role;
  const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = role === "evo" ? "E" : "K";
  const body = document.createElement("div");
  const speaker = document.createElement("div"); speaker.className = "speaker"; speaker.textContent = role === "evo" ? "EVO · " + meta : "KAMU";
  const p = document.createElement("p"); p.textContent = text;
  body.append(speaker,p); article.append(avatar,body); $("messages").append(article);
  if (role === "evo" && episodeId) {
    const feedback = document.createElement("div"); feedback.className = "feedback";
    const label = document.createElement("span"); label.textContent = "Respons ini membantu?";
    const yes = document.createElement("button"); yes.textContent = "Membantu";
    const no = document.createElement("button"); no.textContent = "Perlu diperbaiki";
    const record = rating => {
      const data=loadFeedback();
      if(data.some(x=>x.episodeId===episodeId)) return;
      data.push({episodeId,rating,intent:meta,at:new Date().toISOString()});
      write(FEEDBACK_KEY,data.slice(-500)); feedback.textContent="Umpan balik dicatat. Strategi akan dievaluasi dari beberapa penilaian.";
      renderLearning();
    };
    yes.addEventListener("click",()=>record("helpful")); no.addEventListener("click",()=>record("needs_improvement"));
    feedback.append(label,yes,no); body.append(feedback);
  }
  $("messages").scrollTop=$("messages").scrollHeight;
}
function renderMemory() {
  const items=loadMemory(); $("memoryCount").textContent=items.length;
  const list=$("memoryList"); list.replaceChildren();
  if(!items.length){const e=document.createElement("div");e.className="empty";e.textContent="Belum ada memori. Simpan fakta atau preferensi untuk mulai membangun konteks.";list.append(e);return;}
  items.slice().reverse().forEach(item=>{
    const card=document.createElement("div");card.className="memory-item";
    const del=document.createElement("button");del.textContent="Hapus";del.setAttribute("aria-label","Hapus memori");
    del.addEventListener("click",()=>saveMemory(loadMemory().filter(x=>x.id!==item.id)));
    const cat=document.createElement("small");cat.textContent=String(item.category||"general").toUpperCase();
    const content=document.createElement("span");content.textContent=item.content;
    card.append(del,cat,content);list.append(card);
  });
}
function renderLearning() {
  const episodes=loadEpisodes(), feedback=loadFeedback();
  if($("episodeCount")) $("episodeCount").textContent=episodes.length;
  if($("feedbackCount")) $("feedbackCount").textContent=feedback.length;
  if($("adaptationSummary")) {
    const intents=["LEARNING","PLANNING","REFLECTION","QUESTION","ACTION","GENERAL"];
    const lines=intents.map(intent=>{
      const rows=feedback.filter(x=>x.intent===intent), good=rows.filter(x=>x.rating==="helpful").length;
      const mode=adaptationFor(intent.toLowerCase()).mode;
      return intent+": "+rows.length+" penilaian · "+mode;
    });
    $("adaptationSummary").textContent=lines.join("\n");
  }
}
async function requestRemote(text, intent, memories, adaptation) {
  const endpoint=localStorage.getItem("evo.api.endpoint.v1");
  if(!endpoint) return null;
  const response=await fetch(endpoint.replace(/\/$/,"")+"/api/chat",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message:text,memories:memories.map(x=>x.content),strategy:adaptation.instruction})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||"Backend tidak dapat memproses permintaan.");
  if(typeof data.reply!=="string") throw new Error("Format respons backend tidak valid.");
  const episode={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),intent,input:text,memoryIds:memories.map(x=>x.id),strategy:"remote-"+adaptation.mode,at:new Date().toISOString()};
  const episodes=loadEpisodes();episodes.push(episode);write(EPISODE_KEY,episodes.slice(-500));
  return {reply:data.reply,episodeId:episode.id};
}
async function sendMessage(text) {
  addMessage("user",text);
  const input=$("userInput");input.value="";input.disabled=true;
  try {
    const intent=detectIntent(text), memories=recall(text), adaptation=adaptationFor(intent);
    const remote=await requestRemote(text,intent,memories,adaptation);
    if(remote) {
      const context=memories.length?"\n\nKonteks memori yang digunakan:\n"+memories.map(m=>"• "+m.content).join("\n"):"";
      addMessage("evo",remote.reply+context+"\n\nMesin penalaran: remote · Strategi: "+adaptation.mode,intent.toUpperCase(),remote.episodeId);
    } else {
      const result=think(text);
      const used=result.memoryText==="Belum ada memori yang cocok."?"":"\n\nKonteks memori yang cocok:\n"+result.memoryText;
      addMessage("evo",result.response+used+"\n\nUsulan langkah berikutnya: "+result.next+"\n\nMesin penalaran: lokal · Strategi adaptasi: "+result.adaptation.mode+" ("+result.adaptation.instruction+")",result.intent.toUpperCase(),result.episodeId);
    }
    turns++;$("turnCount").textContent=turns;renderLearning();
  } catch(error) {
    addMessage("evo","Koneksi mesin penalaran gagal: "+error.message+"\nPeriksa URL backend dan status server. Tidak ada tindakan eksternal yang dijalankan.","CORE");
  } finally { input.disabled=false;input.focus(); }
}
$("chatForm").addEventListener("submit",event=>{
  event.preventDefault();const text=$("userInput").value.trim();if(text)sendMessage(text);
});
$("userInput").addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();$("chatForm").requestSubmit();}});
$("addMemory").addEventListener("click",()=>$("memoryDialog").showModal());
$("closeDialog").addEventListener("click",()=>$("memoryDialog").close());
$("memoryForm").addEventListener("submit",event=>{
  event.preventDefault();const content=$("memoryText").value.trim();if(!content)return;
  const items=loadMemory();items.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),content,category:$("memoryCategory").value,createdAt:new Date().toISOString()});
  saveMemory(items);$("memoryText").value="";$("memoryDialog").close();
  addMessage("evo","Informasi berhasil disimpan di memori lokal browser. Kamu dapat melihat atau menghapusnya kapan saja.","MEMORY");
});
$("clearChat").addEventListener("click",()=>{$("messages").replaceChildren();addMessage("evo","Riwayat tampilan percakapan dibersihkan. Memori dan pengalaman evaluasi tetap tersimpan.","CORE");});
$("exportMemory").addEventListener("click",()=>{
  const payload={format:"evo-memory",version:2,exportedAt:new Date().toISOString(),memories:loadMemory(),feedback:loadFeedback(),episodes:loadEpisodes()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;link.download="evo-memory-backup.json";link.click();URL.revokeObjectURL(url);
});
$("importMemory").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text());
    if(payload.format!=="evo-memory"||!Array.isArray(payload.memories))throw new Error("Format file tidak dikenali.");
    const merged=[...loadMemory()];
    payload.memories.filter(x=>x&&typeof x.content==="string"&&x.content.trim()).forEach(x=>{
      if(!merged.some(old=>old.content===x.content))merged.push({id:String(x.id||Date.now()+Math.random()),content:x.content.slice(0,3000),category:String(x.category||"general").slice(0,40),createdAt:x.createdAt||new Date().toISOString()});
    });
    saveMemory(merged);
    if(Array.isArray(payload.feedback))write(FEEDBACK_KEY,[...loadFeedback(),...payload.feedback].slice(-500));
    if(Array.isArray(payload.episodes))write(EPISODE_KEY,[...loadEpisodes(),...payload.episodes].slice(-500));
    renderLearning();addMessage("evo","Cadangan diproses. Memori, pengalaman, dan feedback yang valid telah digabungkan.","MEMORY");
  }catch(error){alert("Impor gagal: "+error.message);}
  event.target.value="";
});
renderMemory();renderLearning();

const endpointInput=$("apiEndpoint");
endpointInput.value=localStorage.getItem("evo.api.endpoint.v1")||"";
$("saveEndpoint").addEventListener("click",()=>{
  const value=endpointInput.value.trim();
  if(value){try{new URL(value);localStorage.setItem("evo.api.endpoint.v1",value);$("backendStatus").textContent="ENDPOINT SET";}catch{$("backendStatus").textContent="INVALID URL";}}
  else{localStorage.removeItem("evo.api.endpoint.v1");$("backendStatus").textContent="LOCAL MODE";}
});
$("checkBackend").addEventListener("click",async()=>{
  const value=endpointInput.value.trim();
  if(!value){$("backendStatus").textContent="LOCAL MODE";return;}
  try{
    const response=await fetch(value.replace(/\/$/,"")+"/api/health");
    const data=await response.json();
    $("backendStatus").textContent=response.ok&&data.ok?(data.providerConfigured?"REMOTE READY":"KEY MISSING"):"BACKEND ERROR";
  }catch{$("backendStatus").textContent="OFFLINE / CORS";}
});
