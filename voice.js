import { VOICE } from "./config.js";

const DIRECTION_TEXT = Object.freeze({
  RISE: "subida", FALL: "bajada", EVEN: "par", ODD: "impar", OVER: "mayor", UNDER: "menor", BOOM: "boom", CRASH: "crash"
});

class VoiceAssistant {
  constructor(){ this.enabled=true; this.rate=VOICE.rate; this.voices=[]; this.voice=null; }
  async init(){ if (!("speechSynthesis" in window)){ this.enabled=false; return; } await new Promise(r=>setTimeout(r,180)); this.loadVoices(); speechSynthesis.addEventListener?.("voiceschanged",()=>this.loadVoices()); }
  loadVoices(){ this.voices=speechSynthesis.getVoices(); this.voice=this.voices.find(v=>v.lang.toLowerCase()==="es-sv")||this.voices.find(v=>v.lang.toLowerCase().startsWith("es"))||this.voices[0]||null; }
  speak(text,{replace=true,rate=this.rate}={}){ return new Promise(resolve=>{ if(!this.enabled||!text||!("speechSynthesis" in window)){resolve();return;} if(replace)speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=this.voice?.lang||VOICE.language; u.voice=this.voice; u.rate=rate; u.pitch=1; u.onend=resolve; u.onerror=resolve; speechSynthesis.speak(u); }); }
  describeDirection(result){ return result.direction==="MATCH"?`coincidencia ${result.metadata?.digit}`:(DIRECTION_TEXT[result.direction]||result.direction); }
  async announcePredictionAndExecution(result, explanation){ const direction=this.describeDirection(result); const reason=explanation?`${explanation}.`:""; await this.speak(`Predicción confirmada. ${direction}. ${reason} Tiene diez segundos para realizar la operación.`,{replace:true,rate:Math.max(1.02,this.rate)}); }
  speakCountdownNumber(number){ return this.speak(String(number),{replace:true,rate:1.18}); }
  toggle(){ this.enabled=!this.enabled; if(!this.enabled&&("speechSynthesis" in window))speechSynthesis.cancel(); return this.enabled; }
}
export const voiceAssistant = new VoiceAssistant();
