// Valores de ejemplo: tus datos reales se cargan con "Importar" en Copia de seguridad.
var BUDGET={"Juntadas":50000,"Transporte":50000,"Supermercado":50000,"Deporte":50000,"Facultad":50000,"Otros":50000,"Salidas":50000,"Viajes":50000,"Regalos":50000,"Salud":50000};
var CLASES={};
var FIN="2000-01-01";
var SKIP=[];
var FECHAS=[];
var USD=[["Ahorro (sin invertir)",0],["Colchón",0]];
var ACC=[["Día a día",0]];
var GOAL={x:"Mi objetivo",target:1000,saved:0,months:0};
// Avisos por Telegram: solo para la cuenta que los tiene configurados (las cuentas nuevas arrancan sin avisos).
var TG=false,TGCHAT="",TGAV={d:[7,1],h:"09:00",hs:0};
var TG_BOT="mipanel_fv_bot"; // usuario del bot de Telegram sin @ (ej: "MiPanelBot"), para mostrar el link en Avisos
var RUT=[],VSTART=null,MON=null,REDIT=null;
var ONB=1; // 0 = cuenta nueva que todavía no terminó la pretemporada (la bienvenida de 3 pasos)
var CAP=0,CAPLATER=false; // CAP=1: ya cargó su capital inicial. CAPLATER: tocó "Más tarde" en esta visita
var AHO=10,WP=null; // AHO: % de cada ingreso que se propone separar para ahorro. WP: % elegido para el ingreso que se está cargando
var SEED={events:[],expenses:[]};
var KEY="panel-local-v1",L={events:[],expenses:[],saves:[],hidden:[],skip:[],ing:[],bal:{},fxAuto:true};
try{var s=localStorage.getItem(KEY);if(s)L=JSON.parse(s);if(!L.saves)L.saves=[];if(!L.hidden)L.hidden=[];if(!L.skip)L.skip=[];if(!L.ing)L.ing=[];if(!L.bal)L.bal={};if(!L.rskip)L.rskip=[];if(L.fxAuto==null)L.fxAuto=true}catch(e){}
var DOC=null,VER="v29";
var SUPABASE_URL="https://jrsjnmutdnzuxqimroaa.supabase.co";
var SUPABASE_KEY="sb_publishable__BLdyenbNV0eqb-5MdL2Cw_48V2WwDA";
var SB=null,UID=null;
// Errores: se guardan solos en Supabase (tabla "errores") para poder arreglarlos sin pedir capturas.
// Cada mensaje se manda una sola vez y como mucho 5 por visita, para no llenar la tabla.
var REPS=0,REPV={};
function reportar(msg,det){try{msg=String(msg||"").slice(0,500);if(!msg||REPV[msg]||REPS>=5)return;REPV[msg]=1;REPS++;
 var row={mensaje:msg,detalle:det?String(det).slice(0,4000):null,version:VER,dispositivo:navigator.userAgent.slice(0,300),pagina:(location.pathname+location.hash).slice(0,300)};
 if(SB){SB.from("errores").insert(row).then(function(){},function(){});return}
 fetch(SUPABASE_URL+"/rest/v1/errores",{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(row)}).catch(function(){})}catch(e){}}
function stat(t){var e=document.getElementById("est");if(e)e.textContent=t;if(/^(No pude|Error)/.test(t))reportar(t)}
function save0(){L.t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(L));if(HAVECFG)localStorage.setItem(KEY+"-cfg",JSON.stringify(cfgObj()))}catch(e){}
 if(DOC){try{DOC.set(JSON.parse(JSON.stringify({L:L}))).then(function(){stat("Guardado en tu cuenta · "+VER)}).catch(function(e){stat("No pude guardar en tu cuenta ("+(e&&(e.code||e.message)||"error")+"). Quedó guardado en este dispositivo.")})}catch(e){stat("No pude guardar en tu cuenta. Quedó guardado en este dispositivo.")}}}
var UNDO=[],PREV=null,HAVECFG=false;
function snap(){return JSON.stringify({L:L,cfg:cfgObj()})}
function updUndo(){var b=document.getElementById("un");if(b){b.disabled=!UNDO.length;b.textContent="↶ Deshacer"+(UNDO.length?" ("+UNDO.length+")":"")}}
function save(){if(PREV!==null){var c=snap();if(c!==PREV){UNDO.push(PREV);if(UNDO.length>30)UNDO.shift()}}save0();PREV=snap();updUndo()}
function norm(q){q=JSON.parse(JSON.stringify(q));return{events:q.events||[],expenses:q.expenses||[],saves:q.saves||[],hidden:q.hidden||[],skip:q.skip||[],ing:q.ing||[],bal:q.bal||{},rskip:q.rskip||[],fx:q.fx,fxAuto:q.fxAuto!==false,fxAt:q.fxAt||"",week:q.week,t:q.t}}
window.addEventListener("error",function(e){reportar("Error en la página: "+e.message,(e.error&&e.error.stack)||(e.filename+":"+e.lineno+":"+e.colno));var a=document.getElementById("aviso");if(a){a.style.display="";a.textContent="Error en la página: "+e.message+" (quedó registrado para arreglarlo)"}stat("Error en la página: "+e.message)});
window.addEventListener("unhandledrejection",function(e){var r=e.reason;reportar("Error sin manejar: "+(r&&(r.message||r.code)||r),r&&r.stack)});
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function $(i){return document.getElementById(i)}
function usd(n){return "US$ "+Math.round(n).toLocaleString("es-AR")}
function money(n){return "$"+Math.round(n).toLocaleString("es-AR")}
var now=new Date(),today=iso(now),ym=today.slice(0,7);
var dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
$("fecha").textContent=now.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
$("ed").value=today;
var cs=$("gc");Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});

function migrate(){ACC.forEach(function(a){if(a[0]==="DIARIO")a[0]="Día a día"});USD.forEach(function(a){if(a[0]==="En caja")a[0]="Colchón"});if(RUT.length)return;Object.keys(CLASES||{}).forEach(function(k){(CLASES[k]||[]).forEach(function(c){RUT.push({id:"r"+k+"-"+c[0].replace(":",""),d:+k,t:c[0],t2:c[1],x:c[2],from:"",to:FIN})})});CLASES={}}
var DN=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function plus(f,n){var d=new Date(f+"T00:00");d.setDate(d.getDate()+n);return iso(d)}
function fd(f){return f.slice(8)+"/"+f.slice(5,7)}
function occs(f){
 var dw=new Date(f+"T00:00").getDay(),a=[];
 RUT.forEach(function(r){if(r.d!==dw)return;if(r.from&&f<r.from)return;if(r.to&&f>r.to)return;
  if(SKIP.indexOf(f)>=0||L.skip.indexOf(f)>=0||L.rskip.indexOf(r.id+"|"+f)>=0)return;
  if(FECHAS.some(function(e){return e.f===f&&e.t===r.t&&vis(e)}))return;
  a.push({f:f,t:r.t,x:r.x+(r.t2?" (hasta "+r.t2+")":""),r:r})});
 FECHAS.forEach(function(e){if(e.f===f&&vis(e))a.push({f:f,t:e.t,x:e.x,o:e,k:"F"})});
 L.events.forEach(function(e){if(e.f===f)a.push({f:f,t:e.t,x:e.x,o:e,k:"E"})});
 return a}
function allExp(){
 var a=SEED.expenses.map(function(e){var d=Math.min(e.d,now.getDate());return{f:ym+"-"+String(d).padStart(2,"0"),m:e.m,c:e.c,x:e.x}});
 return a.concat(L.expenses.filter(function(e){return e.f.slice(0,7)===ym}).map(function(e,i){return{f:e.f,m:e.m,c:e.c,x:e.x,li:L.expenses.indexOf(e)}}));
}
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e}

function evBtns(row,it,f,box){
 var b=el("button","x","✎");b.setAttribute("aria-label","Editar");b.onclick=function(){if(it.r)openRut(it.r);else editEv(box||row,it.o)};
 var c=el("button","x","×");c.setAttribute("aria-label","Borrar");c.onclick=function(){if(it.r)L.rskip.push(it.r.id+"|"+f);else if(it.k==="E")drop(L.events,it.o);else drop(FECHAS,it.o);save();render()};
 row.appendChild(b);
 if(TG&&!it.r&&it.o){var on=it.k==="F"?it.o.imp!==false:it.o.imp===true;var n=el("button","x",on?"🔔":"🔕");n.title=on?"Te aviso por Telegram (tocá para desactivar)":"Sin aviso (tocá para activar)";n.setAttribute("aria-label","Aviso");n.onclick=function(){it.o.imp=!on;save();render()};row.appendChild(n)}else if(TG)row.appendChild(el("span","x-sp"))
 row.appendChild(c)}
function editEv(row,o){
 row.innerHTML="";row.style.flexWrap="wrap";
 var d=document.createElement("input");d.type="date";d.value=o.f;var h=document.createElement("input");h.type="time";h.value=o.t||"";var x=document.createElement("input");x.value=o.x;
 var ok=el("button","","Guardar"),no=el("button","x","Cancelar");
 ok.onclick=function(){if(!d.value||!x.value.trim())return;o.f=d.value;o.t=h.value;o.x=x.value.trim();save();render()};no.onclick=function(){render()};
 [d,h,x,ok,no].forEach(function(n){row.appendChild(n)})}
function renderAlerta(){
 var a=$("alerta"),q=[];
 FECHAS.filter(vis).concat(L.events).forEach(function(e){var n=Math.round((new Date(e.f+"T00:00")-new Date(today+"T00:00"))/864e5);if(n>=0&&n<=7)q.push([n,e])});
 q.sort(function(a,b){return a[0]-b[0]||(a[1].t||"").localeCompare(b[1].t||"")});
 if(!q.length){a.style.display="none";return}
 a.style.display="";a.innerHTML="";a.appendChild(el("b","","En los próximos 7 días"));
 q.forEach(function(p){var r=el("div","row");r.appendChild(el("span","",(p[1].t?p[1].t+" ":"")+p[1].x));r.appendChild(el("span","",fd(p[1].f)+(p[0]===0?" · hoy":p[0]===1?" · mañana":" · en "+p[0]+" días")));a.appendChild(r)})}
function renderMes(){
 var g=$("mg");g.innerHTML="";
 var b=MON||new Date(now.getFullYear(),now.getMonth(),1),st=VSTART||today;
 $("mt").textContent=b.toLocaleDateString("es-AR",{month:"long",year:"numeric"});
 ["L","M","M","J","V","S","D"].forEach(function(n){g.appendChild(el("b","",n))});
 var lead=(b.getDay()+6)%7,dm=new Date(b.getFullYear(),b.getMonth()+1,0).getDate();
 for(var i=0;i<lead;i++)g.appendChild(el("span"));
 for(var k=1;k<=dm;k++){(function(k){var f=iso(new Date(b.getFullYear(),b.getMonth(),k)),n=occs(f).length,c=el("button",(f===today?"t":"")+(f>=st&&f<=plus(st,6)?" h":""));
  c.appendChild(document.createTextNode(k));c.appendChild(el("i","",n?"●".repeat(Math.min(n,3)):"\u00a0"));c.onclick=function(){VSTART=f;render()};g.appendChild(c)})(k)}}
function renderRut(){
 var l=$("rl");l.innerHTML="";
 RUT.slice().sort(function(a,b){return((a.d+6)%7)-((b.d+6)%7)||a.t.localeCompare(b.t)}).forEach(function(r){
  var row=el("div","row"),s=el("span","",DN[r.d]+" "+r.t+(r.t2?"–"+r.t2:"")+" · "+r.x);
  if(r.from||r.to)s.appendChild(el("small","","  "+(r.from?"desde "+fd(r.from):"")+(r.to?" hasta "+fd(r.to):"")));
  var rt=el("span",""),b=el("button","x","✎"),c=el("button","x","×");
  b.onclick=function(){openRut(r)};c.onclick=function(){drop(RUT,r);save();render()};
  rt.appendChild(b);rt.appendChild(c);row.appendChild(s);row.appendChild(rt);l.appendChild(row)});
 if(!RUT.length)l.appendChild(el("div","none","Todavía no cargaste rutinas."))}
function openRut(r){REDIT=r;$("rdw").value=r.d;$("rt").value=r.t;$("rt2").value=r.t2||"";$("rx").value=r.x;$("rf").value=r.from||"";$("rto").value=r.to||"";$("rb").textContent="Guardar cambios";$("rc").style.display="";$("rd").open=true;if($("rd").scrollIntoView)$("rd").scrollIntoView()}
function closeRut(){REDIT=null;$("rx").value="";$("rt").value="";$("rt2").value="";$("rto").value="";$("rf").value=today;$("rb").textContent="Agregar rutina";$("rc").style.display="none"}
$("rc").onclick=closeRut;
$("rb").onclick=function(){var x=$("rx").value.trim(),t=$("rt").value;if(!x||!t){$("rm").textContent="Falta el nombre o la hora de inicio.";return}
 var o={d:+$("rdw").value,t:t,t2:$("rt2").value,x:x,from:$("rf").value,to:$("rto").value};
 if(o.from&&o.to&&o.to<o.from){$("rm").textContent="La fecha final es anterior a la inicial.";return}
 if(REDIT){var i=RUT.indexOf(REDIT);o.id=REDIT.id;if(i>=0)RUT[i]=o;else RUT.push(o)}else{o.id="r"+Date.now().toString(36);RUT.push(o)}
 $("rm").textContent="Rutina guardada.";closeRut();save();render()};
$("np").onclick=function(){VSTART=plus(VSTART||today,-7);render()};
$("nn").onclick=function(){VSTART=plus(VSTART||today,7);render()};
$("nh").onclick=function(){VSTART=null;MON=null;render()};
$("mp").onclick=function(){var b=MON||new Date(now.getFullYear(),now.getMonth(),1);MON=new Date(b.getFullYear(),b.getMonth()-1,1);renderMes()};
$("mn").onclick=function(){var b=MON||new Date(now.getFullYear(),now.getMonth(),1);MON=new Date(b.getFullYear(),b.getMonth()+1,1);renderMes()};
function render(){var th=$("tgh");if(th)th.style.display=TGCHAT||!UID?"none":"";
 var ag=$("agenda");ag.innerHTML="";var st=VSTART||today;
 $("agt").textContent=st===today?"Próximos 7 días":"Del "+fd(st)+" al "+fd(plus(st,6));
 for(var i=0;i<7;i++){
  var f=plus(st,i),d=new Date(f+"T00:00");
  var list=occs(f).sort(function(a,b){return(a.t||"").localeCompare(b.t||"")});
  var box=el("div","day"+(f===today?" today":""));
  box.appendChild(el("b","",f===today?"Hoy":d.toLocaleDateString("es-AR",st===today?{weekday:"long",day:"numeric"}:{weekday:"long",day:"numeric",month:"short"})));
  if(!list.length){box.appendChild(el("div","none","Sin nada agendado"))}
  list.forEach(function(e){var r=el("div","ev");r.appendChild(el("time","",e.t||"Todo el día"));r.appendChild(el("span","",e.x));evBtns(r,e,f);box.appendChild(r)});
  ag.appendChild(box);
 }
 renderMes();renderRut();renderAlerta();
 var ex=allExp(),tot=0,by={};
 ex.forEach(function(e){tot+=e.m;by[e.c]=(by[e.c]||0)+e.m});
 var bt=0;for(var k in BUDGET)bt+=BUDGET[k];
 var base=accVal(0)+ingTot()-sepTot(),spd=0;L.expenses.forEach(function(e){spd+=e.m});
 var left=base-spd,pct=base>0?spd/base*100:(spd>0?100:0);
 $("fill").style.width=Math.min(pct,100)+"%";$("fill").className="fill"+(pct>=80?" over":"");
 $("mark").style.display="none";
 $("frase").textContent=left>=0?ACC[0][0]+": te quedan "+money(left)+".":"Te pasaste "+money(-left)+" de lo que tenías en "+ACC[0][0]+".";
 $("gastado").textContent="Gastaste "+money(spd)+" de "+money(base);
 var cb=$("cats");cb.innerHTML="";
 var mx=0;Object.keys(BUDGET).forEach(function(k){mx=Math.max(mx,by[k]||0)});
 var Z=[];Object.keys(BUDGET).sort(function(a,b){return (by[b]||0)-(by[a]||0)}).forEach(function(k){
  if(!(by[k]||0)){Z.push(k);return}
  var u=by[k]||0,p=mx?u/mx*100:0,c=el("div","cat"),t=el("div");
  t.appendChild(el("span","",k));t.appendChild(el("span","",money(u)));
  var tr=el("div","track"),fl=el("div","fill");fl.style.width=Math.min(p,100)+"%";tr.appendChild(fl);
  c.appendChild(t);c.appendChild(tr);cb.appendChild(c)});
 if(Z.length){var zl=el("div","","Sin gastos: "+Z.join(", "));zl.style.cssText="font-size:13px;color:var(--mute,#8a7f78);margin:6px 0 4px";cb.appendChild(zl)}
 renderGoal();renderExtra();renderResumen();
 var gl=$("gastos");gl.innerHTML="";
 ex.sort(function(a,b){return b.f.localeCompare(a.f)}).slice(0,8).forEach(function(e){
  var r=el("div","row"),l=el("span");l.appendChild(document.createTextNode(e.x||e.c+" "));l.appendChild(el("small","",e.f.slice(8)+"/"+e.f.slice(5,7)+" · "+e.c));
  var rt=el("span","",money(e.m));
  if(e.li!=null){var b=el("button","x","×");b.setAttribute("aria-label","Borrar gasto");b.onclick=function(){L.expenses.splice(e.li,1);save();render()};rt.appendChild(b)}
  r.appendChild(l);r.appendChild(rt);gl.appendChild(r)});
}
// Plazo del objetivo: una fecha fija (GOAL.hasta), elegida en semanas, meses, años o como fecha exacta.
function sumaPlazo(f,n,u){var d=new Date(f+"T00:00");if(u==="s")d.setDate(d.getDate()+7*n);else if(u==="m")d.setMonth(d.getMonth()+n);else if(u==="a")d.setFullYear(d.getFullYear()+n);return iso(d)}
function metaFin(){return GOAL.hasta||(GOAL.months>0?sumaPlazo(today,GOAL.months,"m"):null)}
function metaDias(){var f=metaFin();return f?Math.round((new Date(f+"T00:00")-new Date(today+"T00:00"))/864e5):null}
function fLarga(f){return new Date(f+"T00:00").toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}
function cant(n,s,p){return n+" "+(n===1?s:p)}
function plazoTxt(d){if(d<14)return cant(d,"día","días");if(d<60)return cant(Math.round(d/7),"semana","semanas");if(d<730)return cant(Math.round(d/30.44),"mes","meses");var a=Math.round(d/365.25*10)/10;return(a===1?"1 año":String(a).replace(".",",")+" años")}
function ritmo(x,d){if(d<60)return usd(x/Math.max(d/7,1))+" por semana";var m=usd(x/(d/30.44))+" por mes";return d>=730?m+" ("+usd(x/(d/365.25))+" por año)":m}
function renderGoal(){
 var b=$("metas");b.innerHTML="";
 var extra=0;L.saves.forEach(function(e){extra+=e.m});
 var base=0;USD.forEach(function(a,i){base+=usdVal(i)});var got=base+extra,p=Math.min(got/GOAL.target*100,100),left=GOAL.target-got;
 var h=el("div","gh");h.appendChild(el("h3","",GOAL.x));h.appendChild(el("span","",Math.floor(p)+"%"));
 var tr=el("div","track"),fl=el("div","fill");fl.style.width=p+"%";tr.appendChild(fl);
 var fin=metaFin(),dias=metaDias(),t;
 if(left<=0)t="¡GOOOL! Objetivo cumplido.";
 else if(!fin)t="Te faltan "+usd(left)+".";
 else if(dias<=0)t="El plazo venció el "+fLarga(fin)+" y te faltaron "+usd(left)+". Podés ponerle un plazo nuevo en Ajustes.";
 else t="Te faltan "+usd(left)+" y quedan "+plazoTxt(dias)+" (hasta el "+fLarga(fin)+"): tenés que ahorrar "+ritmo(left,dias)+".";
 b.appendChild(h);b.appendChild(el("div","none",usd(got)+" de "+usd(GOAL.target)+" ("+USD.map(function(a){return a[0].toLowerCase()}).join(" + ")+(extra?" + aportes":"")+")"));b.appendChild(tr);b.appendChild(el("p","info",t));
 var cp=el("button","lk",fin?"Cambiar plazo":"Ponerle un plazo");cp.style.padding="0";cp.onclick=function(){$("aj").open=true;setTimeout(function(){var u=$("ajg-u");if(u){u.scrollIntoView({block:"center",behavior:"smooth"});u.focus()}},80)};b.appendChild(cp);
 if(L.saves.length){var u=el("button","x","Deshacer último aporte o retiro");u.onclick=function(){desligar(L.saves.pop());save();render()};b.appendChild(u)}
}
// Resumen financiero del mes y consejos según cómo se mueve la plata (reglas fijas, sin IA).
function sumM(a){var t=0;a.forEach(function(e){t+=e.m});return t}
function pc(x){return Math.round(x*100)+"%"}
function renderResumen(){
 var R=$("res"),T=$("tips");if(!R)return;R.innerHTML="";T.innerHTML="";
 function real(e){return e.x!=="Ajuste de saldo"}
 var dia=now.getDate(),resta=dim-dia+1,pym=iso(new Date(now.getFullYear(),now.getMonth()-1,1)).slice(0,7);
 var ex=allExp().filter(real),gm=sumM(ex),by={},pby={};ex.forEach(function(e){by[e.c]=(by[e.c]||0)+e.m});
 var pa=L.expenses.filter(function(e){return real(e)&&e.f.slice(0,7)===pym&&+e.f.slice(8)<=dia}),ph=sumM(pa);
 pa.forEach(function(e){pby[e.c]=(pby[e.c]||0)+e.m});
 var im=0;L.ing.forEach(function(e){if(!e.adj&&(e.f||e.k).slice(0,7)===ym)im+=e.v});
 var am=0,sepM=0;L.saves.forEach(function(e){if(e.f&&e.f.slice(0,7)===ym){am+=e.m;if(e.ars)sepM+=e.ars}});
 var proy=dia>=5&&gm?gm/dia*dim:null,Q=[];
 // Lo que había para el mes: lo que quedaba en el día a día al arrancar (capital inicial + movimientos anteriores) + lo que entró.
 // Lo separado para ahorro este mes sale del día a día: no cuenta como plata para gastar.
 var saldo=diaVal(),ini=saldo-im+sepM+sumM(L.expenses.filter(function(e){return real(e)&&e.f.slice(0,7)===ym})),disp=ini+im-sepM,hay=disp>0||im>0;
 var mes1=!L.expenses.concat(L.ing).some(function(e){return(e.f||e.k).slice(0,7)<ym});
 function tip(n,t){Q.push([n,t])}
 function kpi(l,v,sub,c){var k=el("div","kpi"+(c?" "+c:""));k.appendChild(el("small","",l));k.appendChild(el("b","",v));if(sub)k.appendChild(el("span","",sub));R.appendChild(k)}
 function pinta(){var O={mal:0,ojo:1,tip:2,bien:3},N={mal:"Tarjeta roja",ojo:"Amarilla",tip:"Del DT",bien:"¡Golazo!"};
  Q.sort(function(a,b){return O[a[0]]-O[b[0]]}).slice(0,8).forEach(function(q){var r=el("div","tip "+q[0]);r.appendChild(el("i"));var t=el("span");t.appendChild(el("b","",N[q[0]]+": "));t.appendChild(document.createTextNode(q[1]));r.appendChild(t);T.appendChild(r)})}
 if(capFalta())tip("ojo","Te falta cargar tu capital inicial ("+capTxt()+"). Sin eso, Petaca solo cuenta los ingresos que cargaste. Cargalo en El vestuario → Ajustes.");
 if(!ex.length&&!im){R.style.display="none";tip("tip","Cargá tus gastos e ingresos del mes y acá vas a ver un resumen de cómo se mueve tu plata, con consejos y avisos.");pinta();return}
 R.style.display="";
 if(ini>0)kpi("Arrancaste el mes con",money(ini),"en "+ACC[0][0]);
 kpi("Entró este mes",money(im),im?null:"sin ingresos cargados");
 if(sepM)kpi("Separaste para ahorro",money(sepM),(im?pc(sepM/im)+" de lo que entró":"")+(L.fx>0?" · ≈ "+usd(sepM/L.fx):""),"bien");
 kpi("Gastaste",money(gm),ph?(gm>=ph?"+":"−")+pc(Math.abs(gm-ph)/ph)+" vs. mes pasado":null,ph&&gm>ph*1.15?"mal":ph&&gm<ph*.9?"bien":"");
 if(hay)kpi(disp>=gm?"Te queda":"Te faltan",money(Math.abs(disp-gm)),ini>0||sepM?(disp>=gm?"de los ":"gastaste más de los ")+money(disp)+" que tuviste para gastar este mes":"guardás el "+pc(Math.max(im-gm,0)/im)+" de lo que entró",disp>=gm?"bien":"mal");
 kpi("Por día",money(gm/dia),"promedio en "+dia+" días");
 if(proy)kpi("Fin de mes",money(proy),"si seguís a este ritmo",hay&&proy>disp?"mal":"");
 // Presupuestos por categoría
 Object.keys(BUDGET).forEach(function(k){var B=BUDGET[k],u=by[k]||0;if(!(B>0)||!u)return;
  if(u>B)tip("mal","Te pasaste del presupuesto de "+k+": llevás "+money(u)+" de "+money(B)+" ("+money(u-B)+" de más).");
  else if(dia>=5&&u/dia*dim>B*1.05&&u>=B*.5)tip("ojo","A este ritmo "+k+" va a cerrar en ≈ "+money(u/dia*dim)+", arriba de los "+money(B)+" que te pusiste. Te quedan "+money(B-u)+": unos "+money((B-u)/resta)+" por día.");
  else if(u>=B*.8)tip("ojo","Ya usaste el "+pc(u/B)+" del presupuesto de "+k+".")});
 // Lo que tenías para el mes contra lo que vas gastando (si ya te pasaste, lo avisa el saldo en negativo de abajo)
 var tuv=ini>0||sepM?"lo que tenés para gastar este mes ("+money(disp)+": "+(ini>0?money(ini)+" con los que arrancaste + ":"")+money(im)+" que entró"+(sepM?" − "+money(sepM)+" que separaste para ahorro":"")+")":"lo que entró ("+money(im)+")";
 if(saldo>=0&&hay&&proy&&proy>disp)tip("ojo","Si seguís a este ritmo vas a gastar ≈ "+money(proy)+", más de "+tuv+". Para no pasarte, tratá de gastar hasta "+money((disp-gm)/resta)+" por día lo que queda del mes.");
 else if(saldo>=0&&ini>0&&!mes1&&im&&gm>im)tip("tip","Este mes gastaste "+money(gm-im)+" más de lo que entró: lo estás cubriendo con la plata que ya tenías. Si se repite todos los meses, tu capital va a ir bajando.");
 // Cuánto dura lo que hay en la cuenta del día a día
 var left=saldo,r14=sumM(L.expenses.filter(function(e){return real(e)&&e.f>=plus(today,-13)&&e.f<=today}))/14;
 if(left<0)tip("mal","Tu cuenta "+ACC[0][0]+" está en negativo (−"+money(-left)+"): gastaste más de lo que tenías. Revisá si falta cargar algún ingreso"+(capFalta()?" o tu capital inicial (en El vestuario → Ajustes)":" o corregí el saldo en Cuentas")+".");
 else if(r14>0&&left/r14<resta-1)tip("ojo","Con lo que tenés en "+ACC[0][0]+" ("+money(left)+") y gastando como en las últimas dos semanas ("+money(r14)+" por día), te alcanza para unos "+Math.floor(left/r14)+" días: antes de fin de mes.");
 // Comparación con el mes pasado a la misma altura
 if(ph&&dia>=3){var d=(gm-ph)/ph;
  if(d>=.25)tip("ojo","Vas gastando "+pc(d)+" más que el mes pasado a esta altura ("+money(gm)+" contra "+money(ph)+").");
  else if(d<=-.15)tip("bien","Vas gastando "+pc(-d)+" menos que el mes pasado a esta altura. ¡Bien!");
  Object.keys(by).filter(function(k){var p=pby[k]||0;return p>0&&by[k]>p*1.5&&by[k]-p>=gm*.1}).sort(function(a,b){return(by[b]-pby[b])-(by[a]-pby[a])}).slice(0,2)
   .forEach(function(k){tip("ojo",k+" subió "+pc(by[k]/pby[k]-1)+" respecto al mes pasado ("+money(pby[k])+" → "+money(by[k])+").")})}
 // En qué se concentra el gasto
 var top=Object.keys(by).sort(function(a,b){return by[b]-by[a]})[0];
 if(top&&ex.length>=5&&by[top]>=gm*.4)tip("tip",top+" se lleva el "+pc(by[top]/gm)+" de lo que gastaste este mes. Si querés recortar, empezá por ahí.");
 // Gastos hormiga
 if(ex.length>=10){var ch=ex.filter(function(e){return e.m<gm*.03}),sc=sumM(ch);if(ch.length>=8&&sc>=gm*.15)tip("tip","Tuviste "+ch.length+" gastos chicos que suman "+money(sc)+" ("+pc(sc/gm)+" del mes). Los gastos hormiga se acumulan: fijate cuáles podés evitar.")}
 // Gasto fuera de lo común
 var hs=L.expenses.filter(function(e){return real(e)&&e.f>=plus(today,-90)}).map(function(e){return e.m}).sort(function(a,b){return a-b});
 if(hs.length>=10){var med=hs[Math.floor(hs.length/2)],big=ex.slice().sort(function(a,b){return b.m-a.m})[0];
  if(big&&med>0&&big.m>=med*5)tip("tip","Tu gasto más grande del mes fue "+(big.x||big.c)+" ("+money(big.m)+", el "+fd(big.f)+"): "+Math.round(big.m/med)+" veces tu gasto típico. Si es algo que se repite, conviene separarle plata antes.")}
 // Esta semana contra el promedio de las 4 anteriores
 var wk=mon(),ws=sumM(L.expenses.filter(function(e){return real(e)&&e.f>=wk})),w0=plus(wk,-28);
 if(L.expenses.some(function(e){return e.f<w0})){var wa=sumM(L.expenses.filter(function(e){return real(e)&&e.f>=w0&&e.f<wk}))/4;
  if(wa>0&&ws>wa*1.4)tip("ojo","Esta semana ya gastaste "+money(ws)+", "+pc(ws/wa-1)+" más que tu promedio semanal ("+money(wa)+").")}
 // Ahorro y objetivo
 var sob=im-gm,lib=sob-sepM,got=saveTot();USD.forEach(function(a,i){got+=usdVal(i)});var falta=GOAL.target-got;
 if(im&&dia>=10&&sob/im>=.2)tip("bien","Estás guardando el "+pc(sob/im)+" de lo que entró este mes. ¡Buen ritmo!");
 var md=metaDias();
 if(falta>0&&md!=null&&md<=0)tip("ojo","Venció el plazo de tu objetivo \""+GOAL.x+"\" y te faltaron "+usd(falta)+". Ponele un plazo nuevo en Ajustes.");
 else if(falta>0&&md>0){var need=falta/Math.max(md/30.44,1);
  if(am<need)tip("tip","Para llegar a \""+GOAL.x+"\" antes del "+fLarga(metaFin())+" necesitás sumar "+usd(need)+" por mes; este mes llevás "+usd(Math.max(am,0))+"."+(lib>0&&L.fx>0?" Te sobran "+money(lib)+" (≈ "+usd(lib/L.fx)+") que podrías pasar al ahorro.":""));
  else tip("bien","Este mes ya sumaste lo que necesitás para tu objetivo \""+GOAL.x+"\".")}
 else if(falta>0&&am<=0&&sob>0&&dia>=20)tip("tip","Este mes te sobran "+money(sob)+" y todavía no sumaste nada al ahorro.");
 // Datos que faltan cargar
 var ult=L.expenses.reduce(function(m,e){return e.f>m?e.f:m},"");
 if(L.expenses.length>=5&&ult<plus(today,-5)){var n=Math.round((new Date(today+"T00:00")-new Date(ult+"T00:00"))/864e5);tip("tip","Hace "+n+" días que no cargás gastos. Si gastaste algo, anotalo para que el resumen sea real.")}
 if(!im&&dia>=7&&ex.length)tip("tip","No cargaste ingresos este mes. Cargalos en \"Sumar ingreso\" para ver cuánto te sobra.");
 if(!Q.length)tip("bien","Partido tranquilo: no veo nada raro en cómo se mueve tu plata este mes.");
 pinta()}
$("ar").onclick=function(){var m=parseFloat($("am").value);if(!(m>0))return;L.saves.push({f:today,m:-m});$("am").value="";save();render()};
$("ab").onclick=function(){var m=parseFloat($("am").value);if(!(m>0))return;L.saves.push({f:today,m:m});$("am").value="";save();render()};
var APPTOT=1;
var HIST=[["Sin datos",1]];
function renderHist(){
 var h=$("hist");h.innerHTML="";
 var cuentas=0;ACC.forEach(function(a,i){cuentas+=accVal(i)});
 var du=0;USD.forEach(function(a,i){du+=usdVal(i)});du+=saveTot();
 var by={},sp=0;L.expenses.forEach(function(e){sp+=e.m;by[e.c]=(by[e.c]||0)+e.m});
 var app=!(HIST.length===1&&HIST[0][0]==="Sin datos"),Y=now.getFullYear();
 var H=(app?HIST:[]).map(function(e){return[e[0],e[1]+(e[2]?0:(by[e[0]]||0)),e[2]]});
 Object.keys(by).forEach(function(k){if(!H.some(function(e){return e[0]===k}))H.push([k,by[k]])});
 H.sort(function(a,b){return b[1]-a[1]});
 var tot=(app?APPTOT:0)+sp,mov=0;H.forEach(function(e){if(e[2])mov+=e[1]});
 cuentas+=ingTot()-sp-sepTot();var rows=[["Tus cuentas en pesos",money(cuentas)],["Tus dólares","US$ "+du.toLocaleString("es-AR")],[app?"Registrado en "+Y+" (app + panel)":"Registrado en el panel","≈ "+money(tot)],["Movido a ahorro e inversión",money(mov)],["Gastos reales (sin ahorro ni inversión)","≈ "+money(tot-mov)]];
 rows.forEach(function(r){var d=el("div","row");d.appendChild(el("span","",r[0]));d.appendChild(el("b","",r[1]));h.appendChild(d)});
 if(!H.length){h.appendChild(el("p","sem","Todavía no cargaste gastos."));return}
 var t=el("h3","",app?"En qué se fue la plata en "+Y:"En qué se fue la plata");t.style.margin="18px 0 10px";t.style.fontSize="16px";h.appendChild(t);
 var mx=H[0][1]||1;
 H.forEach(function(e){
  var c=el("div","cat"),a=el("div");
  a.appendChild(el("span","",e[0]+(e[2]?" (no es gasto)":"")));
  a.appendChild(el("span","",(tot?Math.round(e[1]/tot*100):0)+"% · "+money(e[1])));
  var tr=el("div","track"),f=el("div","fill");f.style.width=(e[1]/mx*100)+"%";if(e[2])f.style.background="var(--mute)";
  tr.appendChild(f);c.appendChild(a);c.appendChild(tr);h.appendChild(c)});
 if(app)h.appendChild(el("p","sem","Las barras parten de tus capturas de la app y suman lo que cargás en este panel."));
}
function mon(){var d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)}
function renderExtra(){
 renderHist();renderMov();
 var pr=$("prox");pr.innerHTML="";
 FECHAS.filter(function(e){return e.f>=today&&vis(e)}).map(function(e){return{o:e,k:"F"}}).concat(L.events.filter(function(e){return e.f>=today}).map(function(e){return{o:e,k:"E"}})).sort(function(a,b){return(a.o.f+a.o.t).localeCompare(b.o.f+b.o.t)}).forEach(function(it){var e=it.o;
  var n=Math.round((new Date(e.f+"T00:00")-new Date(today+"T00:00"))/864e5),r=el("div","row");
  r.appendChild(el("span","",(e.t?e.t+" ":"")+e.x));
  var rt=el("span","",fd(e.f)+(n===0?" · hoy":n===1?" · mañana":" · en "+n+" días"));if(n<=7)r.style.fontWeight="700";
  evBtns(rt,it,e.f,r);r.appendChild(rt);pr.appendChild(r)});
 var sp=0;L.expenses.forEach(function(e){sp+=e.m});
 var wk=mon(),ws=0;L.expenses.forEach(function(e){if(e.f>=wk)ws+=e.m});
 var wi=null,wsep=0;L.ing.forEach(function(e){if(e.k===wk&&!e.adj)wi=(wi||0)+e.v});L.saves.forEach(function(e){if(e.ars&&e.f>=wk)wsep+=e.ars});var wl=(wi||0)-wsep-ws;
 $("sem").textContent=wi==null?"Cargá lo que te entró esta semana para ver cuánto te sobra.":"Esta semana entró "+money(wi)+(wsep?", separaste "+money(wsep)+" para ahorro":"")+" y gastaste "+money(ws)+(wl>0?": te sobran "+money(wl)+(L.fx>0?" (≈ "+usd(wl/L.fx)+")":"")+" para los próximos gastos.":": esta semana no sobra.");
 var c=$("ctas");c.innerHTML="";var t=0;
 ACC.forEach(function(a,i){var d=i===0,v=d?diaVal():accVal(i);t+=v;var r=el("div","row");r.appendChild(el("span","",d&&(sp||ingTot())?a[0]+" (con lo que cargaste)":a[0]));var rt=el("span","",money(v)),b=el("button","x","✎");b.setAttribute("aria-label","Corregir saldo");b.onclick=function(){editBal(r,v,function(nv){if(d)ajusteDiario(nv-v);else setBal("a"+i,nv)})};rt.appendChild(b);r.appendChild(rt);c.appendChild(r)});
 if(ACC.length>1){var r=el("div","row");r.appendChild(el("b","","Total en pesos"));r.appendChild(el("b","",money(t)));c.appendChild(r)}
 var u=el("div","none","Dólares");u.style.marginTop="12px";c.appendChild(u);var tu=0;
 USD.forEach(function(a,i){var sv=i===0,v=usdVal(i)+(sv?saveTot():0);tu+=v;var q=el("div","row");q.appendChild(el("span","",a[0]));var rt=el("span","","US$ "+v.toLocaleString("es-AR")),b=el("button","x","✎");b.setAttribute("aria-label","Corregir saldo");b.onclick=function(){editBal(q,v,function(nv){setBal("u"+i,sv?nv-saveTot():nv)})};rt.appendChild(b);q.appendChild(rt);c.appendChild(q)});
 var q=el("div","row");q.appendChild(el("b","","Total en dólares"));q.appendChild(el("b","","US$ "+tu.toLocaleString("es-AR")));c.appendChild(q);
 if(L.fx>0){var f1=el("div","row");f1.appendChild(el("span","",L.fxAuto?"Dólar blue (venta"+(L.fxAt?" · "+L.fxAt:"")+")":"Cotización usada (manual)"));f1.appendChild(el("span","",money(L.fx)+" por US$"));c.appendChild(f1);
  var f2=el("div","row");f2.appendChild(el("b","","Patrimonio (pesos + dólares)"));f2.appendChild(el("b","","≈ "+money(t+tu*L.fx)));c.appendChild(f2)}
}
$("fb").onclick=function(){var v=parseFloat($("fx").value);if(!(v>0))return;L.fx=v;L.fxAuto=false;$("fx").value="";save();render()};
$("fa").onclick=function(){L.fxAuto=true;save0();blue(true)};
$("wb").onclick=function(){var v=parseFloat($("wi").value);if(!(v>0))return;var p=WP==null?AHO:WP,o=sumarIng(today,v,p);$("wi").value="";WP=null;save();render();wpPaint();
 if(pctOk(p)&&!o.p)$("sem").textContent="Sumé el ingreso, pero no pude separar el ahorro: falta la cotización del dólar (cargala en Cuentas)."};
$("wi").addEventListener("input",function(){wpPaint()});
$("wi").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();$("wb").click()}});
$("eb").onclick=function(){var t=$("et").value.trim();if(!t||!$("ed").value)return;
 L.events.push({f:$("ed").value,t:$("eh").value,x:t});$("et").value="";save();render()};
$("gb").onclick=function(){var m=parseFloat($("gm").value);if(!(m>0))return;
 L.expenses.push({f:today,m:m,c:$("gc").value,x:$("gt").value.trim()});$("gm").value="";$("gt").value="";save();render()};
closeRut();render();

var busy=false;
function monOf(f){var d=new Date(f+"T00:00");d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)}
function setWeek(v){L.ing.push({f:today,k:mon(),v:v})}
function ingTot(){var t=0;L.ing.forEach(function(e){t+=e.v});return t}
function saveTot(){var t=0;L.saves.forEach(function(e){t+=e.m});return t}
function renderMov(){
 var h=$("mov");h.innerHTML="";var all=[];
 L.expenses.forEach(function(e){all.push({t:"g",e:e,f:e.f,l:"Gasto · "+e.c+(e.x?" · "+e.x:""),v:e.m})});
 L.ing.forEach(function(e){all.push({t:"i",e:e,f:e.f||e.k,l:e.adj?"Ajuste de saldo":"Ingreso"+(e.p?" · "+pctTxt(e.p)+" al ahorro":""),v:e.v})});
 L.saves.forEach(function(e){all.push({t:"a",e:e,f:e.f,l:e.m<0?"Retiro del ahorro":"Aporte al ahorro"+(e.ing?" · de un ingreso ("+money(e.ars)+")":""),v:e.m})});
 if(!all.length){h.appendChild(el("div","none","Todavía no cargaste movimientos desde el panel."));return}
 all.sort(function(a,b){return b.f.localeCompare(a.f)}).slice(0,30).forEach(function(m){
  var r=el("div","row"),l=el("span");l.appendChild(document.createTextNode(m.l+" "));l.appendChild(el("small","",m.f.slice(8)+"/"+m.f.slice(5,7)));
  var rt=el("span","",m.t==="a"?usd(m.v):money(m.v)),ed=el("button","x","✎"),dl=el("button","x","×");
  ed.setAttribute("aria-label","Editar monto");dl.setAttribute("aria-label","Borrar");
  ed.onclick=function(){editMov(r,m)};
  dl.onclick=function(){if(m.t==="g")drop(L.expenses,m.e);else if(m.t==="i"){drop(L.ing,m.e);drop(L.saves,aporteDe(m.e));if(L.week&&L.week.k===m.e.k)L.week=null}else{drop(L.saves,m.e);desligar(m.e)}save();render()};
  rt.appendChild(ed);rt.appendChild(dl);r.appendChild(l);r.appendChild(rt);h.appendChild(r)});
}
function editMov(r,m){
 r.innerHTML="";r.style.flexWrap="wrap";
 var n=document.createElement("input");n.type="number";n.value=m.v;n.setAttribute("aria-label","Monto");
 var sel=null,pi=null;
 if(m.t==="i"&&!m.e.adj){pi=document.createElement("input");pi.type="number";pi.min="0";pi.max="100";pi.value=m.e.p||0;pi.style.flex="0 0 90px";pi.setAttribute("aria-label","% para ahorro");pi.title="% para ahorro"}
 if(m.t==="g"){sel=document.createElement("select");Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;if(k===m.e.c)o.selected=true;sel.appendChild(o)})}
 var ok=el("button","","Guardar"),no=el("button","x","Cancelar");
 ok.onclick=function(){var v=parseFloat(n.value);if(m.t==="a"?!v||(m.e.ing&&v<0):!(v>0))return;
  if(pi&&!(parseFloat(pi.value)>=0&&parseFloat(pi.value)<=100))return;
  if(m.t==="g"){m.e.m=v;m.e.c=sel.value}else if(m.t==="i"){m.e.v=v;if(L.week&&L.week.k===m.e.k)L.week.v=v;if(pi)ligar(m.e,pi.value)}
  else{var fx=m.e.ars?m.e.fx||m.e.ars/m.e.m:0;m.e.m=v;if(fx){m.e.ars=Math.round(v*fx);L.ing.forEach(function(o){if(o.id===m.e.ing)o.p=Math.round(m.e.ars/o.v*1000)/10})}}
  save();render()};
 no.onclick=function(){render()};
 r.appendChild(n);if(sel)r.appendChild(sel);if(pi){r.appendChild(pi);r.appendChild(el("span","","% al ahorro"))}r.appendChild(ok);r.appendChild(no);
}
function bal(k,d){return L.bal&&L.bal[k]!=null?L.bal[k]:d}
function accVal(i){return bal("a"+i,ACC[i][1])}
function usdVal(i){return bal("u"+i,USD[i][1])}
function ajusteDiario(x){if(!x)return;if(x<0)L.expenses.push({f:today,m:-x,c:"Otros",x:"Ajuste de saldo"});else L.ing.push({f:today,k:mon(),v:x,adj:1});save();render()}
function setBal(k,v){if(!L.bal)L.bal={};L.bal[k]=v;save();render()}
function editBal(r,cur,fn){
 r.innerHTML="";r.style.flexWrap="wrap";
 var n=document.createElement("input");n.type="number";n.value=Math.round(cur);n.setAttribute("aria-label","Saldo correcto");
 var ok=el("button","","Guardar"),no=el("button","x","Cancelar");
 ok.onclick=function(){var v=parseFloat(n.value);if(!(v>=0))return;fn(v)};
 no.onclick=function(){render()};
 r.appendChild(n);r.appendChild(ok);r.appendChild(no)}
function n2(t){return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function pad(x){return String(x).padStart(2,"0")}
function pMonto(c){
 var t=c.replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g," ").replace(/a las? \d{1,2}([:.]\d{2})?\s*(hs|h|am|pm)?/g," ").replace(/\d{1,2}:\d{2}/g," ").replace(/\d{1,2}\s*(am|pm)\b/g," ");
 var m=t.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(mil\b|k\b|lucas?\b|palos?\b|millon(?:es)?\b)?/);
 if(!m)return null;var n=parseFloat(m[1].replace(/\./g,"").replace(",","."));var u=m[2]||"";
 if(/^(mil|k|luca)/.test(u))n*=1000;else if(/^(palo|millon)/.test(u))n*=1e6;
 return n>0?n:null}
function pFecha(c){
 var d=new Date(now),m;
 if(m=c.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)){var y=m[3]?(+m[3]<100?2000+ +m[3]:+m[3]):now.getFullYear();return y+"-"+pad(m[2])+"-"+pad(m[1])}
 if(/pasado manana/.test(c))d.setDate(d.getDate()+2);
 else if(/manana/.test(c))d.setDate(d.getDate()+1);
 else if(/ayer/.test(c))d.setDate(d.getDate()-1);
 else{var W=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"],f=false;
  for(var i=0;i<7;i++)if(new RegExp("\\b"+W[i]+"\\b").test(c)){d.setDate(d.getDate()+((i-d.getDay()+7)%7||7));f=true;break}
  if(!f&&(m=c.match(/\bel (\d{1,2})\b(?![\/:])/))){d.setDate(+m[1]);if(d<new Date(now.getFullYear(),now.getMonth(),now.getDate()))d.setMonth(d.getMonth()+1)}}
 return iso(d)}
function pHora(c){
 var m=c.match(/(\d{1,2}):(\d{2})/)||c.match(/a las?\s*(\d{1,2})()/)||c.match(/(\d{1,2})()\s*(?:am|pm)/);
 if(!m)return"";var h=+m[1];if(/pm|de la tarde|de la noche/.test(c)&&h<12)h+=12;return pad(h)+":"+(m[2]||"00")}
var CATS=[["Supermercado",/super|coto|carrefour|verdura|almacen|mercado|supermercado|chino/],["Transporte",/nafta|combustible|colectivo|sube|uber|taxi|peaje|estacionamiento|bondi|tren|subte/],["Salidas",/cena|restaurante|bar\b|birra|cerveza|boliche|hamburguesa|pizza|helado|cafe|salida/],["Juntadas",/juntada|asado|amigos/],["Deporte",/gym|gimnasio|cancha|futbol|entrenamiento|padel/],["Facultad",/fotocopia|libro|facultad|apunte|curso|impresion/],["Salud",/farmacia|medico|dentista|remedio|consulta|estudio/],["Regalos",/regalo|cumple/],["Viajes",/vuelo|hotel|viaje|pasaje|alquiler de auto/]];
function pCat(c){for(var i=0;i<CATS.length;i++)if(CATS[i][1].test(c))return CATS[i][0];return"Otros"}
function limpio(t){return t.replace(/\b\d[\d.,]*\s*k\b/ig,"").replace(/\b(agreg|anot|agend|sum|gast|pagu|compr|me entr)[a-záéíóúñ]*/ig,"").replace(/\b(tengo|que)\b/ig,"").replace(/a las?\s*\d{1,2}([:.]\d{2})?\s*(hs|h|am|pm)?/ig,"").replace(/\d{1,2}:\d{2}/g,"").replace(/\d{1,2}\s*(am|pm)\b/ig,"").replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g,"").replace(/\b(manana|mañana|hoy|ayer|pasado|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|el|la|los|las|en|de|por|un|una|mil|lucas?)\b/ig,"").replace(/\$?\d[\d.,]*/g,"").replace(/\s+/g," ").trim()}
function localParse(txt,C){
 var o={gastos:[],eventos:[],ingresos:[],ahorro_usd:null,cotizacion:null,cancelar:[],sin_clases:[],rutinas:[]},last="g";
 txt.split(/[,;\n]|\.(?!\d)|\s+y\s+/).forEach(function(raw){
  raw=raw.trim();if(!raw)return;var c=n2(raw),mo=pMonto(c),f=pFecha(c);
  var mr=c.match(/\btodos los (lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/),hh=pHora(c);
  if(mr&&hh){var tt=limpio(raw.replace(/todos los \S+/i,""))||"Rutina";o.rutinas.push({dia:["domingo","lunes","martes","miercoles","jueves","viernes","sabado"].indexOf(mr[1]),hora:hh,titulo:tt.charAt(0).toUpperCase()+tt.slice(1)});return}
  if(/\b(cancel|anul|borr|elimin|sac[aá]|quit[aá]|suspend|no voy|no tengo|no hay|se suspendio)/.test(c)){
   var hd=/\d{1,2}\/\d{1,2}|manana|ayer|lunes|martes|miercoles|jueves|viernes|sabado|domingo|\bel \d{1,2}\b/.test(c);
   if(/clase/.test(c)&&!/parcial|examen|turno/.test(c)){o.sin_clases.push(f);return}
   var ws=c.replace(/\b(cancel|anul|borr|elimin|sac|quit|suspend)[a-z]*/g," ").split(/[^a-z0-9]+/).filter(function(w){return w.length>=4&&!/^(para|sobre|desde|hasta|tengo|turno de|esto|esta|este|como|pero)$/.test(w)}),best=null,bs=0;
   if(C&&C.o)Object.keys(C.o).forEach(function(k){var e=C.o[k].e,tx=n2(String(e.x||"")+" "+String(e.c||"")),sc=0;
    ws.forEach(function(w){if(!/^\d+$/.test(w)&&tx.indexOf(w)>=0)sc+=2});
    if(hd&&e.f===f)sc+=2;
    if(mo&&e.m===mo)sc+=3;
    if(sc>bs){bs=sc;best=k}});
   if(best&&bs>=2)o.cancelar.push(best);
   return}
  if(/dolar/.test(c)&&/(esta a|cotiza|vale|esta en)/.test(c)&&mo){o.cotizacion=mo;return}
  if(/ahorr|guard/.test(c)&&/usd|dolar|u\$s/.test(c)&&mo){o.ahorro_usd=(o.ahorro_usd||0)+(/retir|saque|saqu|saco|use |gaste/.test(c)?-mo:mo);return}
  var ing=/(me entr|entraron|entro|cobre|ingrese|me pagaron|me depositaron|me transfirieron|gane)/.test(c),gas=/(gaste|gasto|pague|pago|compre|compra|me cobraron|salio|puse|invite)/.test(c),ev=/(tengo|turno|reunion|parcial|examen|vuelo|cita|clase|dentista|llamar|entrega|recuperatorio)/.test(c);
  if(mo&&ing){last="i"}else if(mo&&gas){last="g"}
  if(mo&&(ing||(!gas&&!ev&&last==="i"))){o.ingresos.push({monto:mo,fecha:f});return}
  if(mo&&(gas||!ev)){var det=limpio(raw);o.gastos.push({monto:mo,categoria:pCat(c),detalle:det.slice(0,40),fecha:f});return}
  if(ev||/manana|\d{1,2}\/\d{1,2}|lunes|martes|miercoles|jueves|viernes|sabado|domingo/.test(c)){var t=limpio(raw);var im=/importante|avis/.test(c);t=t.replace(/\b(importante|avis[a-záéíóúñ]*)\b/ig,"").replace(/\s+/g," ").trim();if(t)o.eventos.push({fecha:f,hora:pHora(c),titulo:t.charAt(0).toUpperCase()+t.slice(1),imp:im})}});
 return o}
function vis(e){return L.hidden.indexOf(e.f+"|"+e.x)<0}
function cands(){var o={},t=[];
 FECHAS.forEach(function(e){if(vis(e)&&e.f>=today){var k="F"+t.length;o[k]={t:"F",e:e};t.push(k+": "+e.f+" "+e.x)}});
 L.events.forEach(function(e){var k="E"+t.length;o[k]={t:"E",e:e};t.push(k+": "+e.f+" "+e.x)});
 L.expenses.slice(-10).forEach(function(e){var k="X"+t.length;o[k]={t:"X",e:e};t.push(k+": "+e.f+" "+money(e.m)+" "+e.c+" "+e.x)});
 return{o:o,list:t.join(" | ")}}
function drop(a,x){var i=a.indexOf(x);if(i>=0)a.splice(i,1)}
function lineEl(t){var d=el("div","row");d.appendChild(el("span","",t));return d}
function prompt1(txt,C){return "Hoy es "+today+" ("+now.toLocaleDateString("es-AR",{weekday:"long"})+"). Extraé de esta nota en español rioplatense los gastos en pesos, los eventos y, si aparecen, el ingreso de la semana en pesos o un aporte de ahorro en dólares (negativo si retira plata del ahorro). Devolvé SOLO un JSON con esta forma: {\"gastos\":[{\"monto\":number,\"categoria\":\"una de: "+Object.keys(BUDGET).join(", ")+"\",\"detalle\":string,\"fecha\":\"YYYY-MM-DD\"}],\"eventos\":[{\"fecha\":\"YYYY-MM-DD\",\"hora\":\"HH:MM o vacío\",\"titulo\":string,\"imp\":true si pide que le avisen o dice que es importante}],\"ingresos\":[{\"monto\":number,\"fecha\":\"YYYY-MM-DD\"}],\"ahorro_usd\":number o null,\"cotizacion\":number o null}. Si un gasto no tiene fecha, usá hoy. 'mil' vale 1000. Si la nota cancela o borra algo, devolvé también \"cancelar\":[ids de la lista de abajo] y, si dice que no va a clase algún día, \"sin_clases\":[\"YYYY-MM-DD\"]. Si algo se repite todas las semanas, devolvé también \"rutinas\":[{\"dia\":0 a 6 (0=domingo),\"hora\":\"HH:MM\",\"titulo\":string}]. Lista actual: "+C.list+". Nota: "+txt}
// Gemini vía la Edge Function "gemini" de Supabase: la clave vive como secreto en Supabase y nunca llega al navegador.
async function gemini(p){
 var r=await SB.functions.invoke("gemini",{body:{prompt:p}});
 if(r.error){var m=r.error.message;try{var b=await r.error.context.json();if(b&&b.error)m=b.error}catch(e){}throw new Error("Gemini: "+m)}
 return r.data}
$("nb").onclick=async function(){
 var txt=$("nt").value.trim(),out=$("nr");if(!txt||busy)return;
 out.textContent="Entendiendo tu nota…";
 try{
  busy=true;
  var C=cands(),ok=/^\d{4}-\d{2}-\d{2}$/,r=null,why="",nota="";
  var gErr="";if(SB&&UID)try{r=await gemini(prompt1(txt,C))}catch(err){gErr=err&&err.message||"error"}
  if(!r)try{var SM=window.claude?await claude.use("sample"):null;if(SM)r=await SM.json(prompt1(txt,C),{cache:false});else why="modo sin IA"}catch(err){why=err&&err.code==="not_granted"?"no diste permiso a la página para usar Claude":(err&&(err.code||err.message))||"error"}
  if(!r||typeof r!=="object"){r=localParse(txt,C);nota="Lo entendí sin IA. Revisá bien antes de guardar."+(gErr?" ("+gErr+")":"")}
  else if(r._ia&&!r._ia.propia&&r._ia.quedan<=5)nota=(r._ia.quedan?"Te quedan "+cant(r._ia.quedan,"nota","notas"):"Ya no te quedan notas")+" hoy con la IA compartida. Cargá tu propia clave gratis en El vestuario → IA de Petaca.";
  var G=(r.gastos||[]).filter(function(g){return g&&g.monto>0}).map(function(g){return{f:ok.test(g.fecha)?g.fecha:today,m:Number(g.monto),c:BUDGET[g.categoria]?g.categoria:"Otros",x:String(g.detalle||"")}});
  var E=(r.eventos||[]).filter(function(e){return e&&ok.test(e.fecha)&&e.titulo}).map(function(e){return{f:e.fecha,t:/^\d{2}:\d{2}$/.test(e.hora||"")?e.hora:"",x:String(e.titulo),imp:!!e.imp||/importante|avis/i.test(e.titulo)}});
  var IN=(r.ingresos||[]).filter(function(g){return g&&g.monto>0}).map(function(g){return{f:ok.test(g.fecha)?g.fecha:today,v:Number(g.monto),p:AHO}}),A=Number(r.ahorro_usd)||null;
  var FX=r.cotizacion>0?Number(r.cotizacion):null;
  var Cn=(r.cancelar||[]).filter(function(k){return C.o[k]}).map(function(k){return C.o[k]});
  var NS=(r.sin_clases||[]).filter(function(d){return ok.test(d)});
  var RU=(r.rutinas||[]).filter(function(u){return u&&u.dia>=0&&u.dia<=6&&/^\d{2}:\d{2}$/.test(u.hora||"")&&u.titulo}).map(function(u){return{id:"r"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),d:+u.dia,t:u.hora,t2:"",x:String(u.titulo),from:today,to:""}});
  out.innerHTML="";if(nota)out.appendChild(el("p","sem",nota));
  if(!G.length&&!E.length&&!IN.length&&A==null&&!Cn.length&&!NS.length&&!RU.length&&FX==null){out.textContent="No encontré gastos, eventos ni ingresos en esa nota. Probá con más detalle.";return}
  var fd=function(f){return f.slice(8)+"/"+f.slice(5,7)};
  // Vista previa editable: cada ítem se puede corregir (✎) o quitar (×) antes de guardar.
  var AA=A!=null?[{m:A}]:[],FF=FX!=null?[{v:FX}]:[],NSo=NS.map(function(d){return{f:d}});
  var CAT=Object.keys(BUDGET).map(function(c){return[c,c]}),DIA=DN.map(function(n,i){return[i,n]});
  var K=[
   {a:G,t:function(g){return"Gasto: "+money(g.m)+" en "+g.c+(g.x?" ("+g.x+")":"")+" · "+fd(g.f)},f:[["m","Monto","number"],["c","Categoría",CAT],["x","Detalle","text"],["f","Fecha","date"]]},
   {a:E,t:function(e){return"Evento: "+e.x+" · "+fd(e.f)+(e.t?" "+e.t:"")+(e.imp&&TG?" · 🔔 te aviso por Telegram":"")},f:[["x","Qué","text"],["f","Fecha","date"],["t","Hora","time"]].concat(TG?[["imp","Avisarme por Telegram","check"]]:[])},
   {a:IN,t:function(i){return"Ingreso: "+money(i.v)+" · "+fd(i.f)+(i.p?" · separás "+pctTxt(i.p)+" para ahorro ("+money(i.v*i.p/100)+")":" · sin separar ahorro")},f:[["v","Monto","number"],["p","% para ahorro","number"],["f","Fecha","date"]]},
   {a:AA,t:function(s){return(s.m<0?"Retiro del ahorro: ":"Aporte al ahorro: ")+usd(Math.abs(s.m))},f:[["m","USD (negativo si retirás)","number"]]},
   {a:FF,t:function(x){return"Cotización del dólar: "+money(x.v)},f:[["v","Pesos por US$","number"]]},
   {a:Cn,t:function(c){return"Cancelar: "+(c.t==="X"?"gasto de "+money(c.e.m)+" en "+c.e.c:c.e.x)+" · "+fd(c.e.f)}},
   {a:NSo,t:function(d){return"Sin clases el "+fd(d.f)},f:[["f","Fecha","date"]]},
   {a:RU,t:function(u){return"Rutina: todos los "+DN[u.d].toLowerCase()+" "+u.t+" · "+u.x},f:[["d","Día",DIA],["t","Hora","time"],["x","Qué","text"]]}];
  var head=out.firstChild&&out.firstChild.tagName==="P"?out.firstChild:null;
  function editor(k,o,row){
   var box=el("div","add"),inp={};box.style.margin="6px 0";
   k.f.forEach(function(s){var i;
    if(Array.isArray(s[2])){i=el("select");s[2].forEach(function(p){var op=el("option","",p[1]);op.value=p[0];if(String(o[s[0]])===String(p[0]))op.selected=true;i.appendChild(op)})}
    else if(s[2]==="check"){var lb=el("label","sem");lb.style.margin="0";i=el("input");i.type="checkbox";i.checked=!!o[s[0]];i.style.flex="none";i.style.minHeight="0";lb.appendChild(i);lb.appendChild(document.createTextNode(" "+s[1]));box.appendChild(lb);inp[s[0]]=i;return}
    else{i=el("input");i.type=s[2];i.value=o[s[0]]==null?"":o[s[0]];i.placeholder=s[1];if(s[2]==="number")i.inputMode="decimal"}
    i.setAttribute("aria-label",s[1]);box.appendChild(i);inp[s[0]]=i});
   var b=el("button","","Listo"),c=el("button","x","Cancelar");
   b.onclick=function(){k.f.forEach(function(s){var i=inp[s[0]],v;
     if(s[2]==="check")v=i.checked;
     else if(s[2]==="number"){v=parseFloat(String(i.value).replace(",","."));if(!isFinite(v)||(v===0&&s[0]!=="p")||(v<0&&k.a!==AA)||(s[0]==="p"&&v>100))return}
     else if(s[2]==="date"){v=i.value;if(!ok.test(v))return}
     else if(Array.isArray(s[2])){v=s[0]==="d"?+i.value:i.value}
     else{v=String(i.value).trim();if(!v&&s[2]!=="time"&&k.a!==G)return}
     o[s[0]]=v});draw()};
   c.onclick=draw;box.appendChild(b);box.appendChild(c);row.replaceWith(box);var f=box.querySelector("input,select");if(f)f.focus()}
  function draw(){
   out.innerHTML="";if(head)out.appendChild(head);var n=0;
   K.forEach(function(k){k.a.forEach(function(o,ix){n++;var row=lineEl(k.t(o)),bt=el("span");
    if(k.f){var e=el("button","x","✎");e.setAttribute("aria-label","Corregir");e.title="Corregir";e.onclick=function(){editor(k,o,row)};bt.appendChild(e)}
    var x=el("button","x","×");x.setAttribute("aria-label","Quitar");x.title="Quitar";x.onclick=function(){k.a.splice(k.a.indexOf(o),1);draw()};bt.appendChild(x);
    row.appendChild(bt);out.appendChild(row)})});
   if(!n){out.appendChild(el("p","sem","No queda nada para guardar."));var cl=el("button","x","Cerrar");cl.onclick=function(){out.innerHTML=""};out.appendChild(cl);return}
   var yes=el("button","","Guardar en el panel"),no=el("button","x","Descartar");
   yes.style.marginTop="10px";
   yes.onclick=function(){Cn.forEach(function(c){if(c.t==="F")L.hidden.push(c.e.f+"|"+c.e.x);else if(c.t==="E")drop(L.events,c.e);else drop(L.expenses,c.e)});NSo.forEach(function(d){L.skip.push(d.f)});RU.forEach(function(u){RUT.push(u)});G.forEach(function(g){L.expenses.push(g)});E.forEach(function(e){L.events.push(e)});IN.forEach(function(i){sumarIng(i.f,i.v,i.p)});if(FF.length){L.fx=FF[0].v;L.fxAuto=false}if(AA.length)L.saves.push({f:today,m:AA[0].m});$("nt").value="";out.innerHTML="";save();render()};
   no.onclick=function(){out.innerHTML=""};
   out.appendChild(yes);out.appendChild(no)}
  draw();
 }catch(e){out.textContent="No pude procesar la nota: "+(e&&(e.message||e.code)||"error");reportar("No pude procesar la nota: "+(e&&(e.message||e.code)||"error"),e&&e.stack)}
 finally{busy=false}
};

function cfgObj(){return{ONB:ONB,CAP:CAP,AHO:AHO,LAYOUT:LAYOUT,TG:TG,TGCHAT:TGCHAT,TGAV:TGAV,ACC:ACC,USD:USD,BUDGET:BUDGET,CLASES:CLASES,RUT:RUT,FIN:FIN,SKIP:SKIP,FECHAS:FECHAS,GOAL:GOAL,HIST:HIST,APPTOT:APPTOT}}
function applyCfg(c){if(!c)return;ONB=c.ONB===0?0:1;CAP=c.CAP?1:0;AHO=c.AHO>=0?c.AHO:10;LAYOUT=c.LAYOUT||null;applyLayout();TGCHAT=c.TGCHAT||"";TG=!!TGCHAT;TGAV=c.TGAV||{d:[7,1],h:"09:00",hs:0};// campanas y avisos solo si la cuenta guardó su chat ID
if(c.ACC)ACC=c.ACC;if(c.USD)USD=c.USD;if(c.BUDGET)BUDGET=c.BUDGET;if(c.CLASES)CLASES=c.CLASES;if(c.RUT)RUT=c.RUT;if(c.FIN)FIN=c.FIN;if(c.SKIP)SKIP=c.SKIP;if(c.FECHAS)FECHAS=c.FECHAS;if(c.GOAL)GOAL=c.GOAL;if(c.HIST)HIST=c.HIST;if(c.APPTOT)APPTOT=c.APPTOT;migrate();
 cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)})}
$("bx").onclick=function(){$("bk").value=JSON.stringify({v:1,L:L,cfg:cfgObj()});$("bm").textContent="Copiá todo el texto y guardalo en un lugar seguro."};
$("bi").onclick=function(){try{var o=JSON.parse($("bk").value);if(!o||!o.L)throw 0;var tc=TGCHAT,ta=TGAV;applyCfg(o.cfg);TGCHAT=tc;TG=!!tc;TGAV=ta;HAVECFG=true;L=norm(o.L);save();UNDO.length=0;updUndo();render();$("bm").textContent="Datos importados."}catch(e){$("bm").textContent="El texto no es una copia válida."}};
// ===== Supabase =====
function loginUI(on,email){document.body.classList.toggle("auth",!!on);$("login").style.display=on?"":"none";$("ses").style.display=on?"none":"";$("usrp").style.display=on?"none":"";if(email)$("sem2").textContent="Sesión: "+email}
function push(){if(!HAVECFG)return Promise.resolve();var d=JSON.parse(JSON.stringify({L:L,cfg:cfgObj()}));return SB.from("panel_state").upsert({user_id:UID,data:d,updated_at:new Date().toISOString()}).then(function(r){if(r.error)throw r.error})}
function adopt(q){setTimeout(blue,0);if(q.cfg){applyCfg(q.cfg);HAVECFG=true}L=norm(q.L);PREV=snap();try{localStorage.setItem(KEY,JSON.stringify(L));if(HAVECFG)localStorage.setItem(KEY+"-cfg",JSON.stringify(cfgObj()))}catch(e){}render()}
async function pull(){
 var r=await SB.from("panel_state").select("data").eq("user_id",UID).maybeSingle();
 if(r.error){stat("No pude leer tu nube: "+r.error.message);return}
 var q=r.data&&r.data.data;
 if(q&&q.L){if(!HAVECFG&&q.cfg){applyCfg(q.cfg);HAVECFG=true;render()}
  // Nunca pisar datos con una copia vacía: si un lado está vacío y el otro no, gana el que tiene datos.
  var ev=vacio(q.L),lv=vacio(L);if(lv&&!ev)adopt(q);else if(ev&&!lv)await push();else if((q.L.t||0)>=(L.t||0))adopt(q);else await push();stat("Sincronizado con tu nube · "+VER);
  if(ONB===0)preStart();else capStart()}
 else{HAVECFG=true;ONB=0;await push();stat("Nube inicializada · "+VER);preStart()}
}
async function enter(session){
 UID=session.user.id;var ow=null;try{ow=localStorage.getItem("panel-owner")}catch(e){}if(ow&&ow!==UID)resetLocal();try{localStorage.setItem("panel-owner",UID)}catch(e){}DOC={set:function(){return push()}};loginUI(false,session.user.email);
 loadUser();
 try{await pull()}catch(e){stat("No pude sincronizar: "+(e&&e.message||e))}
 SB.channel("ps-"+UID).on("postgres_changes",{event:"*",schema:"public",table:"panel_state",filter:"user_id=eq."+UID},function(p){var q=p.new&&p.new.data;if(q&&q.L&&(q.L.t||0)>(L.t||0))adopt(q)}).subscribe()}
async function startSB(){
 if(!window.supabase||SUPABASE_URL.indexOf("http")!==0){document.body.classList.remove("auth");stat("Falta configurar Supabase: completá la URL y la clave al principio del script. Mientras tanto se guarda solo en este dispositivo · "+VER);return}
 SB=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 var r=await SB.auth.getSession();
 if(r.data&&r.data.session)await enter(r.data.session);else{loginUI(true);stat("Iniciá sesión para sincronizar · "+VER)}
 SB.auth.onAuthStateChange(function(ev,s){if(ev==="SIGNED_IN"&&s&&!UID)enter(s);if(ev==="PASSWORD_RECOVERY"){$("rec").style.display="";$("login").style.display="none"}if(ev==="SIGNED_OUT"){UID=null;DOC=null;if(PRE)preEnd();else capEnd();try{SB.removeAllChannels()}catch(e){}resetLocal();try{localStorage.removeItem("panel-owner")}catch(e){}loginUI(true)}})}
document.getElementById("un").onclick=function(){if(!UNDO.length)return;var q=JSON.parse(UNDO.pop());applyCfg(q.cfg);L=norm(q.L);save0();PREV=snap();render();updUndo();var o=document.getElementById("nr");if(o)o.textContent="Deshice el último cambio."};
function authMsg(t){$("lm").textContent=t}
$("lg").onclick=async function(){if(!SB)return authMsg("Falta configurar Supabase.");var em=$("le").value.trim(),pw=$("lp").value;if(!em)return authMsg("Escribí tu email o tu usuario.");if(pw.length<6)return authMsg("La contraseña tiene que tener al menos 6 caracteres.");em=await mailOf(em);if(!em)return authMsg("No encontré ese usuario.");var r=await SB.auth.signInWithPassword({email:em,password:pw});authMsg(r.error?"No pude entrar: "+r.error.message:"")};
$("lr").onclick=async function(){if(!SB)return authMsg("Falta configurar Supabase.");var em=$("le").value.trim(),pw=$("lp").value;if(!em||em.indexOf("@")<1)return authMsg("Escribí tu email en el campo Email.");if(pw.length<6)return authMsg("La contraseña tiene que tener al menos 6 caracteres.");var r=await SB.auth.signUp({email:em,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});
 if(r.error)return authMsg(/rate limit/i.test(r.error.message)?"Hay muchos fichajes en este momento y no pude mandarte el mail. Probá de nuevo en un rato.":/already registered/i.test(r.error.message)?"Ese email ya tiene cuenta: tocá Entrar.":"No pude crear la cuenta: "+r.error.message);
 authMsg(r.data&&r.data.session?"¡Fichaje confirmado! Entrando a la cancha…":"¡Fichaje confirmado! Te mandamos un mail para confirmar tu cuenta: abrilo y después tocá Entrar. Revisá también spam.")};
$("lo").onclick=async function(){if(SB)await SB.auth.signOut()};
async function mailOf(v){v=v.trim();if(v.indexOf("@")>0)return v;var r=await SB.rpc("login_email",{u:v.toLowerCase()});return r.data||null}
$("lf").onclick=async function(){if(!SB)return authMsg("Falta configurar Supabase.");var v=$("le").value.trim();if(!v)return authMsg("Escribí arriba tu email o tu usuario y tocá de nuevo.");var em=await mailOf(v);if(em){await SB.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname})}authMsg("Si la cuenta existe, te mandé un mail para crear una contraseña nueva. Revisá también spam.")};
$("rpb").onclick=async function(){var pw=$("rp").value;if(pw.length<6)return($("rpm").textContent="Mínimo 6 caracteres.");var r=await SB.auth.updateUser({password:pw});if(r.error)return($("rpm").textContent="No pude cambiarla: "+r.error.message);$("rp").value="";$("rpm").textContent="";$("rec").style.display="none";try{history.replaceState(null,"",location.pathname)}catch(e){}stat("Contraseña actualizada")};
async function loadUser(){try{var r=await SB.from("profiles").select("username").eq("user_id",UID).maybeSingle();$("uname").value=(r.data&&r.data.username)||""}catch(e){}}
$("us").onclick=async function(){var u=$("uname").value.trim().toLowerCase();if(!/^[a-z0-9_.]{3,20}$/.test(u))return($("um").textContent="3 a 20 caracteres: letras, números, _ o .");var r=await SB.from("profiles").upsert({user_id:UID,username:u});$("um").textContent=r.error?(r.error.code==="23505"?"Ese usuario ya existe.":"No pude guardarlo."):"Guardado. Ya podés entrar con "+u+".";if(!r.error)$("uname").value=u};
document.addEventListener("visibilitychange",function(){if(document.hidden)return;if(iso(new Date())!==today){location.reload();return}if(UID)pull().catch(function(){})});
// Orden personalizado: el usuario arrastra grupos y tarjetas (o usa ↑ ↓); se guarda en su cuenta.
var LAYOUT=null;
function grupos(){return[].slice.call(document.querySelectorAll("main>.grupo"))}
function tarjetas(g){return[].slice.call(g.querySelectorAll(":scope>.cols>section[data-c]"))}
var DEFLAY={g:grupos().map(function(g){return g.dataset.g}),c:{}};grupos().forEach(function(g){DEFLAY.c[g.dataset.g]=tarjetas(g).map(function(s){return s.dataset.c})});
function ordenar(par,nodos,ids,antes){var by={};nodos.forEach(function(n){by[n.dataset.g||n.dataset.c]=n});
 ids.filter(function(i){return by[i]}).concat(nodos.map(function(n){return n.dataset.g||n.dataset.c}).filter(function(i){return ids.indexOf(i)<0})).forEach(function(i){par.insertBefore(by[i],antes||null)})}
function applyLayout(){var Y=LAYOUT||DEFLAY,m=document.querySelector("main"),by={},en={},ya={};
 ordenar(m,grupos(),Y.g||DEFLAY.g,$("est"));
 // Las tarjetas pueden haberse pasado a otro grupo: cada una va al primer grupo que la lista, o al suyo de siempre.
 function ids(g){return(Y.c||{})[g]||DEFLAY.c[g]||[]}
 grupos().forEach(function(g){tarjetas(g).forEach(function(s){by[s.dataset.c]=s})});
 Object.keys(DEFLAY.c).forEach(function(g){DEFLAY.c[g].forEach(function(i){en[i]=g})});
 grupos().forEach(function(g){ids(g.dataset.g).forEach(function(i){if(!ya[i]){ya[i]=1;en[i]=g.dataset.g}})});
 grupos().forEach(function(g){var c=g.querySelector(":scope>.cols");if(!c)return;var mine=Object.keys(by).filter(function(i){return en[i]===g.dataset.g});
  ids(g.dataset.g).filter(function(i){return mine.indexOf(i)>=0}).concat(mine.filter(function(i){return ids(g.dataset.g).indexOf(i)<0})).forEach(function(i){c.appendChild(by[i])})})}
function saveLayout(){LAYOUT={g:grupos().map(function(g){return g.dataset.g}),c:{}};grupos().forEach(function(g){LAYOUT.c[g.dataset.g]=tarjetas(g).map(function(s){return s.dataset.c})});HAVECFG=true;save()}
function mover(n,d){var p=n.parentNode,h=[].filter.call(p.children,function(x){return x.matches(n.matches(".grupo")?"main>.grupo":".cols>section[data-c]")}),i=h.indexOf(n),j=i+d;
 if(j<0||j>=h.length)return;if(d<0)p.insertBefore(n,h[j]);else p.insertBefore(h[j],n);saveLayout();n.scrollIntoView({block:"nearest"})}
function ordBar(n){var b=el("div","ordbar");b.appendChild(el("span","",n.dataset.name));var s=el("span");
 [["↑",-1,"Subir"],["↓",1,"Bajar"]].forEach(function(a){var x=el("button","x",a[0]);x.setAttribute("aria-label",a[2]+" "+n.dataset.name);x.onclick=function(e){e.stopPropagation();mover(n,a[1])};s.appendChild(x)});
 b.appendChild(s);b.title="Arrastrá para mover";b.addEventListener("pointerdown",function(e){dragStart(n,b,e)});n.insertBefore(b,n.firstChild)}
// Arrastrar y soltar: se agarra la barra de un grupo o tarjeta y se suelta donde quieras (las tarjetas pueden pasar a otro grupo).
var DRAG=null;
function dragStart(n,b,e){if(DRAG||e.button>0||e.target.closest("button"))return;e.preventDefault();
 var br=b.getBoundingClientRect(),dx=e.clientX-br.left,dy=e.clientY-br.top,grp=n.matches(".grupo");
 if(grp)document.body.classList.add("arrgrp");document.body.classList.add("arr");
 var r=n.getBoundingClientRect(),ph=el("div","ph");ph.style.height=r.height+"px";n.parentNode.insertBefore(ph,n);
 b=b.getBoundingClientRect();DRAG={n:n,ph:ph,grp:grp,dx:dx+b.left-r.left,dy:dy+b.top-r.top,x:e.clientX,y:e.clientY};
 n.classList.add("arrastrando");n.style.width=r.width+"px";n.style.left=r.left+"px";n.style.top=r.top+"px";
 DRAG.iv=setInterval(function(){var d=DRAG;if(!d)return;var v=d.y<70?-14:d.y>innerHeight-70?14:0;if(v){scrollBy(0,v);dragMove({clientX:d.x,clientY:d.y})}},16);
 dragMove(e)}
function dragMove(e){var d=DRAG;if(!d)return;d.x=e.clientX;d.y=e.clientY;
 d.n.style.left=(e.clientX-d.dx)+"px";d.n.style.top=(e.clientY-d.dy)+"px";
 var t=document.elementFromPoint(e.clientX,e.clientY);if(!t||t===d.ph)return;
 var g=t.closest("main>.grupo"),s=d.grp?g:t.closest(".cols>section[data-c]");
 if(s&&s!==d.n){var q=s.getBoundingClientRect(),a=e.clientY<q.top+q.height/2?s:s.nextSibling;if(a!==d.ph&&a!==d.ph.nextSibling)s.parentNode.insertBefore(d.ph,a)}
 else if(!d.grp&&!s&&g){var c=g.querySelector(":scope>.cols");if(c&&d.ph.parentNode!==c)c.appendChild(d.ph)}}
function dragEnd(){var d=DRAG;if(!d)return;DRAG=null;clearInterval(d.iv);
 d.ph.parentNode.insertBefore(d.n,d.ph);d.ph.remove();d.n.classList.remove("arrastrando");["width","left","top"].forEach(function(k){d.n.style[k]=""});
 document.body.classList.remove("arrgrp","arr");saveLayout();d.n.scrollIntoView({block:"nearest"})}
addEventListener("pointermove",dragMove);addEventListener("pointerup",dragEnd);addEventListener("pointercancel",dragEnd);
function ordUI(on){document.body.classList.toggle("ordenando",on);$("ordtop").style.display=on?"":"none";
 [].forEach.call(document.querySelectorAll(".ordbar"),function(b){b.remove()});
 if(on)grupos().forEach(function(g){ordBar(g);tarjetas(g).forEach(ordBar)})}
$("ord").onclick=function(){ordUI(!document.body.classList.contains("ordenando"));window.scrollTo({top:0,behavior:"smooth"})};
$("ordok").onclick=function(){ordUI(false)};
$("ordr").onclick=function(){LAYOUT=null;applyLayout();HAVECFG=true;save();ordUI(true)};
// Datos locales por usuario: la copia del navegador se borra al cerrar sesión o si entra otra cuenta, para no mezclar datos.
var DEFCFG=JSON.stringify(cfgObj());
function resetLocal(){applyCfg(JSON.parse(DEFCFG));HAVECFG=false;L=norm({});UNDO.length=0;PREV=snap();updUndo();try{localStorage.removeItem(KEY);localStorage.removeItem(KEY+"-cfg")}catch(e){}render();blue()}
try{var cs0=localStorage.getItem(KEY+"-cfg");if(cs0){applyCfg(JSON.parse(cs0));HAVECFG=true;render()}}catch(e){}
startSB().catch(function(e){document.body.classList.remove("auth");stat("Error al iniciar Supabase: "+(e&&e.message||e))});
PREV=snap();updUndo();
document.getElementById("aviso").style.display="none";
// Dólar blue automático (dolarapi.com, gratis y sin clave). Se actualiza al abrir el panel y cada 30 minutos.
async function blue(force){
 if(!L.fxAuto)return;
 try{
  var r=await fetch("https://dolarapi.com/v1/dolares/blue",{cache:"no-store"});if(!r.ok)return;
  var d=await r.json(),v=Number(d.venta);if(!(v>0))return;
  var at=new Date(d.fechaActualizacion||Date.now()),s=pad(at.getDate())+"/"+pad(at.getMonth()+1)+" "+pad(at.getHours())+":"+pad(at.getMinutes());
  if(!(v!==L.fx||s!==L.fxAt||force))return;L.fx=v;L.fxAt=s;if(UID||!SB){save0();PREV=snap()}
  render()
 }catch(e){}
}
blue();setInterval(blue,30*60*1000);
// Tarjetas desplegables: tocar el título abre o cierra la sección (se recuerda en este dispositivo).
(function(){
 var st={};try{st=JSON.parse(localStorage.getItem("panel-cerradas")||"{}")}catch(e){}
 document.querySelectorAll("main section").forEach(function(s){
  var h=s.firstElementChild;if(s.id==="login"||s.id==="rec"||!h||h.tagName!=="H2")return;
  var k=h.id||h.textContent.trim();s.classList.add("plg");h.tabIndex=0;h.setAttribute("role","button");
  function set(c){s.classList.toggle("cerrada",c);h.setAttribute("aria-expanded",String(!c))}
  function tg(){var c=!s.classList.contains("cerrada");set(c);st[k]=c;try{localStorage.setItem("panel-cerradas",JSON.stringify(st))}catch(e){}}
  set(!!st[k]);h.onclick=tg;h.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();tg()}}});
})();
// Enter en el formulario de entrada = tocar "Entrar".
["le","lp"].forEach(function(i){$(i).addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();$("lg").click()}})});
// Ajustes: categorías con presupuesto, objetivo de ahorro y nombres de cuentas (se guardan en la cuenta del usuario).
var AJ={};
function ajList(box,title,items,ph,num,fixed){
 var w=el("div","aj"),rows=el("div");w.appendChild(el("h3","",title));w.appendChild(rows);
 function add(n,v,o){var r=el("div","add ajr"),a=el("input");a.value=n;a.placeholder=ph;a.setAttribute("aria-label",ph);r.appendChild(a);
  if(num){var b=el("input");b.type="number";b.inputMode="decimal";b.value=v==null?"":v;b.placeholder=num;b.setAttribute("aria-label",num);r.appendChild(b)}
  if(o!=null&&fixed(o)){a.readOnly=a.value==="Otros";r.appendChild(el("span","x-sp"))}
  else{var x=el("button","x","×");x.setAttribute("aria-label","Quitar");x.title="Quitar";x.onclick=function(){r.remove()};r.appendChild(x)}
  r._o=o;rows.appendChild(r);return a}
 items.forEach(function(it){add(it[0],it[1],it[2])});
 var ad=el("button","lk","+ Agregar");ad.onclick=function(){add("",null,null).focus()};w.appendChild(ad);box.appendChild(w);
 return function(){return[].map.call(rows.children,function(r){var i=r.querySelectorAll("input");return{n:i[0].value.trim(),v:i[1]?parseFloat(String(i[1].value).replace(",",".")):null,o:r._o}})}}
function ajForm(){
 var f=$("ajf");f.innerHTML="";$("ajm").textContent="";
 AJ.cat=ajList(f,"Categorías y presupuesto mensual",Object.keys(BUDGET).map(function(k){return[k,BUDGET[k],k]}),"Categoría","Presupuesto ($)",function(o){return o==="Otros"});
 var g=el("div","aj");g.appendChild(el("h3","","Objetivo de ahorro"));var gr=el("div","add ajr ajg");
 [["x","Nombre del objetivo","text",GOAL.x],["target","Meta (US$)","number",GOAL.target]].forEach(function(s){var i=el("input");i.type=s[2];i.id="ajg-"+s[0];i.value=s[3];i.placeholder=s[1];i.title=s[1];i.setAttribute("aria-label",s[1]);if(s[2]==="number")i.inputMode="decimal";gr.appendChild(i)});
 g.appendChild(gr);
 var ar=el("div","add ajr"),ai=el("input");ai.id="ajaho";ai.type="number";ai.inputMode="decimal";ai.min="0";ai.max="100";ai.value=AHO;ai.setAttribute("aria-label","Porcentaje de cada ingreso para ahorro");ai.style.flex="0 0 90px";
 ar.appendChild(el("span","","De cada ingreso, separar"));ar.appendChild(ai);ar.appendChild(el("span","","% para ahorro"));g.appendChild(ar);
 // Plazo: sin plazo, en N semanas/meses/años, o hasta una fecha exacta.
 var pr=el("div","add ajr ajp"),pu=el("select"),pn=el("input"),pf=el("input"),ph=el("p","sem");pu.id="ajg-u";pn.id="ajg-n";pf.id="ajg-f";ph.id="ajg-h";
 [["","Sin plazo"],["s","En semanas"],["m","En meses"],["a","En años"],["f","Hasta una fecha"]].forEach(function(o){var op=el("option","",o[1]);op.value=o[0];pu.appendChild(op)});
 pu.setAttribute("aria-label","Plazo del objetivo");pn.type="number";pn.min="1";pn.step="1";pn.inputMode="numeric";pn.placeholder="Cuántos";pn.setAttribute("aria-label","Cantidad");pf.type="date";pf.min=plus(today,1);pf.setAttribute("aria-label","Fecha límite");
 var P=GOAL.pl||(GOAL.months>0?{u:"m",n:GOAL.months}:null);pu.value=P?P.u:"";pn.value=P&&P.n?P.n:"";pf.value=metaFin()||"";
 function plazoUI(){var u=pu.value;pn.style.display=u&&u!=="f"?"":"none";pf.style.display=u==="f"?"":"none";var h=plazoForm();var d=h.hasta?Math.round((new Date(h.hasta+"T00:00")-new Date(today+"T00:00"))/864e5):0;ph.textContent=h.err||(h.hasta?"Fecha límite: "+fLarga(h.hasta)+(d>0?" (en "+plazoTxt(d)+")":" (ya venció)"):"El objetivo no tiene fecha límite.")}
 pu.onchange=pn.oninput=pf.oninput=plazoUI;
 [pu,pn,pf].forEach(function(x){pr.appendChild(x)});g.appendChild(pr);g.appendChild(ph);
 f.appendChild(g);plazoUI();
 AJ.acc=ajList(f,"Cuentas en pesos (la primera es la del día a día)",ACC.map(function(a,i){return[a[0],null,i]}),"Nombre de la cuenta",null,function(o){return o===0});
 var cp=el("div","aj"),cr=el("div","add ajr"),ci=el("input");cp.appendChild(el("h3","","Capital inicial de "+ACC[0][0]));
 ci.id="ajcap";ci.type="number";ci.inputMode="decimal";ci.min="0";ci.placeholder="Sin cargar (en pesos)";ci.setAttribute("aria-label","Capital inicial");ci.value=CAP||accVal(0)>0?accVal(0):"";
 cr.appendChild(ci);cp.appendChild(cr);cp.appendChild(el("p","sem","Es "+capTxt()+". Petaca le suma tus ingresos y le resta tus gastos para saber cuánto te queda."));f.appendChild(cp);
 AJ.usd=ajList(f,"Cuentas en dólares (la primera suma tus aportes al ahorro)",USD.map(function(a,i){return[a[0],null,i]}),"Nombre de la cuenta",null,function(o){return o===0})}
// Lee el plazo del formulario. Si no cambió, conserva la fecha límite guardada (así no se corre día a día).
function plazoForm(){var u=$("ajg-u").value,n=parseInt($("ajg-n").value,10),f=$("ajg-f").value,P=GOAL.pl;
 if(!u)return{pl:null,hasta:null};
 if(u==="f"){if(!f)return{err:"Elegí la fecha límite del objetivo."};if(f<=today&&f!==GOAL.hasta)return{err:"La fecha límite tiene que ser después de hoy."};return{pl:{u:"f"},hasta:f}}
 if(!(n>0))return{err:"Poné en cuántas "+{s:"semanas",m:"meses",a:"años"}[u]+" querés llegar."};
 if(P&&P.u===u&&P.n===n&&GOAL.hasta)return{pl:P,hasta:GOAL.hasta};
 return{pl:{u:u,n:n},hasta:sumaPlazo(today,n,u)}}
function ajSave(){
 var m=$("ajm"),C=AJ.cat(),A=AJ.acc(),U=AJ.usd(),seen={};
 for(var i=0;i<C.length;i++){var n=C[i].n;if(!n)return(m.textContent="Hay una categoría sin nombre.");if(seen[n.toLowerCase()])return(m.textContent="La categoría \""+n+"\" está repetida.");seen[n.toLowerCase()]=1}
 if(A.some(function(a){return!a.n})||U.some(function(a){return!a.n}))return(m.textContent="Hay una cuenta sin nombre.");
 var gx=$("ajg-x").value.trim(),gt=parseFloat($("ajg-target").value),gp=plazoForm();
 var cv=$("ajcap").value.trim(),cap=cv===""?null:parseFloat(cv.replace(",","."));if(cap!=null&&!(cap>=0))return(m.textContent="El capital inicial tiene que ser un número (0 o más).");
 var ah=parseFloat(String($("ajaho").value).replace(",","."));if(!(ah>=0&&ah<=100))return(m.textContent="El % para ahorro tiene que ser de 0 a 100.");
 if(!gx)return(m.textContent="Poné un nombre para el objetivo.");if(!(gt>0))return(m.textContent="La meta del objetivo tiene que ser mayor a 0.");if(gp.err)return(m.textContent=gp.err);
 // Categorías: renombrar o quitar actualiza los gastos ya cargados (los de una categoría quitada pasan a "Otros").
 var NB={},ren={};C.forEach(function(c){NB[c.n]=c.v>=0?c.v:0;if(c.o!=null)ren[c.o]=c.n});
 L.expenses.forEach(function(e){e.c=ren[e.c]||(NB[e.c]!=null?e.c:"Otros")});
 if(NB.Otros==null)NB.Otros=0;BUDGET=NB;
 // Cuentas: los saldos se guardan por posición, así que se reacomodan si se quitan o mueven cuentas.
 function remap(R,old,p){var nb={};Object.keys(L.bal).forEach(function(k){if(k.charAt(0)!==p)nb[k]=L.bal[k]});
  var na=R.map(function(r,j){if(r.o!=null&&L.bal[p+r.o]!=null)nb[p+j]=L.bal[p+r.o];return[r.n,r.o!=null?old[r.o][1]:0]});L.bal=nb;return na}
 ACC=remap(A,ACC,"a");USD=remap(U,USD,"u");if(cap!=null){L.bal.a0=cap;CAP=1}
 GOAL={x:gx,target:gt,saved:GOAL.saved||0,pl:gp.pl,hasta:gp.hasta};AHO=ah;
 HAVECFG=true;cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});
 save();render();ajForm();$("ajm").textContent="Ajustes guardados."}
$("aj").addEventListener("toggle",function(){if($("aj").open)ajForm()});
$("ajs").onclick=ajSave;$("ajc").onclick=ajForm;
function vacio(x){return!x||!((x.events||[]).length||(x.expenses||[]).length||(x.ing||[]).length||(x.saves||[]).length)}
// Avisos por Telegram: cada cuenta guarda su chat ID; los mensajes salen del bot del panel (token como secreto en Supabase).
function tgUI(){$("tgc").value=TGCHAT;$("tgdd").value=(TGAV.d||[]).join(", ");$("tgdh").value=TGAV.h||"09:00";$("tghs").value=TGAV.hs||"";$("tgam").textContent="";$("tgm").textContent=TGCHAT?"Avisos activados para el chat "+TGCHAT+".":"Todavía no cargaste tu chat ID.";
 var b=$("tgbot");b.innerHTML="";if(TG_BOT){b.appendChild(document.createTextNode(" ("));var a=el("a","","@"+TG_BOT);a.href="https://t.me/"+TG_BOT;a.target="_blank";a.rel="noopener";b.appendChild(a);b.appendChild(document.createTextNode(")"))}}
$("tgd").addEventListener("toggle",function(){if($("tgd").open)tgUI()});
$("tgs").onclick=function(){var v=$("tgc").value.trim();if(!/^-?\d{5,15}$/.test(v))return($("tgm").textContent="El chat ID son solo números (ej: 123456789).");TGCHAT=v;TG=true;HAVECFG=true;save();render();tgUI()};
$("tgx").onclick=function(){TGCHAT="";TG=false;HAVECFG=true;save();render();tgUI()};
$("tgt").onclick=async function(){var m=$("tgm");if(!SB||!UID)return(m.textContent="Iniciá sesión primero.");if(!TGCHAT)return(m.textContent="Primero guardá tu chat ID.");
 m.textContent="Enviando…";try{await push();var r=await SB.functions.invoke("avisos",{body:{prueba:true}});
  if(r.error){var t=r.error.message;try{var b=await r.error.context.json();if(b&&b.error)t=b.error}catch(e){}throw new Error(t)}
  m.textContent="Listo, revisá tu Telegram."}catch(e){m.textContent="No pude enviarlo: "+(e&&e.message||e)}};
$("tgo").onclick=function(){var d=$("tgd");d.open=true;tgUI();d.scrollIntoView({behavior:"smooth",block:"start"});$("tgc").focus({preventScroll:true})};
$("tgas").onclick=function(){var m=$("tgam"),raw=$("tgdd").value.trim(),d=[],ok=true;
 if(raw)raw.split(/[,\s;]+/).forEach(function(x){if(!x)return;var n=+x;if(!(n>=0&&n<=60&&n===Math.floor(n)))ok=false;else if(d.indexOf(n)<0)d.push(n)});
 if(!ok)return(m.textContent="Días antes: números enteros de 0 a 60, separados por coma (0 = el mismo día).");
 var h=$("tgdh").value||"09:00",hs=parseFloat(String($("tghs").value).replace(",","."))||0;
 if(hs<0||hs>48)return(m.textContent="Horas antes: de 0 a 48.");
 if(!d.length&&!hs)return(m.textContent="Elegí al menos días antes u horas antes.");
 d.sort(function(a,b){return b-a});TGAV={d:d,h:h,hs:hs};HAVECFG=true;save();tgUI();
 m.textContent="Guardado. Te aviso "+[d.length?(d.map(function(n){return n===0?"el mismo día":n===1?"1 día antes":n+" días antes"}).join(", ")+" a las "+h):"",hs?hs+" h antes de que empiece":""].filter(Boolean).join(" y ")+"."};
// IA de Petaca: clave de Gemini propia (tabla ia_claves). Si está, la función "gemini" la usa en lugar de la compartida.
function iaUI(){var m=$("iam");$("iak").value="";if(!SB||!UID)return(m.textContent="Iniciá sesión primero.");
 m.textContent="Revisando…";SB.from("ia_claves").select("clave").eq("user_id",UID).maybeSingle().then(function(r){if(r.error)return(m.textContent="No pude leer tu clave: "+r.error.message);
  var k=r.data&&r.data.clave;m.textContent=k?"Usás tu propia clave (termina en …"+k.slice(-4)+").":"Usás la IA compartida.";$("iax").style.display=k?"":"none"})}
$("iad").addEventListener("toggle",function(){if($("iad").open)iaUI()});
$("ias").onclick=async function(){var m=$("iam"),k=$("iak").value.trim();if(!SB||!UID)return(m.textContent="Iniciá sesión primero.");
 if(!/^[A-Za-z0-9_-]{20,200}$/.test(k))return(m.textContent="Esa clave no parece válida. Copiala completa desde AI Studio.");
 m.textContent="Guardando…";var r=await SB.from("ia_claves").upsert({user_id:UID,clave:k,updated_at:new Date().toISOString()});if(r.error)return(m.textContent="No pude guardarla: "+r.error.message);
 $("iak").value="";$("iax").style.display="";m.textContent="Probando…";var p=await SB.functions.invoke("gemini",{body:{probar:true}});
 if(p.error){var t=p.error.message;try{var b=await p.error.context.json();if(b&&b.error)t=b.error}catch(e){}return(m.textContent="La guardé, pero no funcionó: "+t)}
 m.textContent="¡Golazo! Tu clave funciona: desde ahora Petaca usa tu propio cupo."};
$("iax").onclick=async function(){var m=$("iam");if(!SB||!UID)return;var r=await SB.from("ia_claves").delete().eq("user_id",UID);
 m.textContent=r.error?"No pude quitarla: "+r.error.message:"Listo, volvés a usar la IA compartida.";if(!r.error)$("iax").style.display="none"};
// Pretemporada: la primera vez que alguien entra, 3 pasos para armar sus categorías, sus saldos y su objetivo.
var PRE=null;
var PRECAT=["Supermercado","Comida y delivery","Transporte","Salidas","Juntadas","Facultad","Salud","Ropa","Suscripciones","Deporte","Regalos","Viajes"],PREON=["Supermercado","Comida y delivery","Transporte","Salidas","Juntadas"];
function preNum(v){var n=parseFloat(String(v).replace(",","."));return n>0?n:0}
function preStart(){if(PRE)return;PRE={paso:0,cat:PRECAT.map(function(n){return{n:n,on:PREON.indexOf(n)>=0,v:""}}),pesos:"",usd:"",ing:"",aho:String(AHO),gx:"",gt:"",gu:"m",gn:""};
 document.body.classList.add("pre-open");$("pre").style.display="";prePaint()}
function preEnd(){$("pre").style.display="none";$("pre").innerHTML="";document.body.classList.remove("pre-open");PRE=null}
function preCampo(P,k,txt,ph,num){var lb=el("label","",txt),i=el("input");if(num){i.type="number";i.inputMode="decimal";i.min="0"}i.placeholder=ph;i.value=P[k];i.oninput=function(){P[k]=i.value};lb.appendChild(i);return lb}
function prePaint(){var P=PRE,w=$("pre");w.innerHTML="";var c=el("div","pc");w.appendChild(c);
 var h=el("div","prh"),im=el("img");im.src="petaca.svg?v=28";im.alt="";h.appendChild(im);var ht=el("div");ht.appendChild(el("small","prk","Pretemporada · paso "+(P.paso+1)+" de 3"));
 var t=el("h2","",["Armá tu plantel de gastos","¿Con cuánto arrancás?","Tu objetivo de ahorro"][P.paso]);t.id="pret";ht.appendChild(t);h.appendChild(ht);c.appendChild(h);
 var ps=el("div","pasos");for(var i=0;i<3;i++)ps.appendChild(el("i",i<=P.paso?"on":""));c.appendChild(ps);
 var msg=el("p","sem prm");
 if(P.paso===0){
  c.appendChild(el("p","sem","¡Te damos la bienvenida al club! Elegí en qué gastás y, si querés, ponele un presupuesto por mes a cada categoría: Petaca te avisa cuando te estés por pasar. \"Otros\" va siempre."));
  P.cat.forEach(function(k){var r=el("div","prc"),lb=el("label"),cb=el("input"),nv=el("input");cb.type="checkbox";cb.checked=k.on;
   nv.type="number";nv.inputMode="decimal";nv.min="0";nv.placeholder="$ / mes";nv.value=k.v;nv.disabled=!k.on;nv.setAttribute("aria-label","Presupuesto por mes de "+k.n);nv.oninput=function(){k.v=nv.value};
   cb.onchange=function(){k.on=cb.checked;nv.disabled=!cb.checked};lb.appendChild(cb);lb.appendChild(document.createTextNode(k.n));r.appendChild(lb);r.appendChild(nv);c.appendChild(r)});
  var ad=el("div","add"),ai=el("input"),ab=el("button","lk","+ Agregar");ai.placeholder="Otra categoría (ej: Mascota)";ai.setAttribute("aria-label","Otra categoría");
  ab.onclick=function(){var n=ai.value.trim();if(!n)return;if(n.toLowerCase()==="otros"||P.cat.some(function(k){return k.n.toLowerCase()===n.toLowerCase()}))return(msg.textContent="Esa categoría ya está.");P.cat.push({n:n,on:true,v:""});prePaint()};
  ad.appendChild(ai);ad.appendChild(ab);c.appendChild(ad)}
 else if(P.paso===1){
  c.appendChild(el("p","sem","Así Petaca sabe cuánto te queda. Si no sabés el número exacto poné uno aproximado: después lo corregís en Cuentas."));
  var f=el("div","prf");f.appendChild(preCampo(P,"pesos","Tu capital inicial: la plata que tenés hoy para el día a día (en pesos)","Ej: 150000",1));f.appendChild(preCampo(P,"usd","Dólares ahorrados (US$)","Ej: 300",1));f.appendChild(preCampo(P,"ing","¿Cobraste algo esta semana? (opcional, en pesos)","Ej: 400000",1));c.appendChild(f)}
 else{
  c.appendChild(el("p","sem","¿Para qué estás ahorrando? Un viaje, la compu nueva, la entrada para la final… Si todavía no tenés uno, salteá este paso."));
  var f2=el("div","prf"),l3=el("label","","Para cuándo"),rw=el("div","add"),gn=el("input"),gu=el("select");
  f2.appendChild(preCampo(P,"aho","¿Qué % de cada ingreso querés separar para ahorrar? (lo podés cambiar en cada uno)","Ej: 10",1));f2.appendChild(preCampo(P,"gx","Nombre del objetivo","Ej: Viaje al Mundial"));f2.appendChild(preCampo(P,"gt","Cuánto necesitás (US$)","Ej: 2000",1));
  gn.type="number";gn.inputMode="numeric";gn.min="1";gn.placeholder="Cuántos";gn.value=P.gn;gn.setAttribute("aria-label","Cantidad");gn.oninput=function(){P.gn=gn.value};
  [["","Sin plazo"],["s","semanas"],["m","meses"],["a","años"]].forEach(function(o){var op=el("option","",o[1]);op.value=o[0];gu.appendChild(op)});gu.value=P.gu;gu.setAttribute("aria-label","Plazo");
  gu.onchange=function(){P.gu=gu.value;gn.style.display=gu.value?"":"none"};gn.style.display=P.gu?"":"none";rw.appendChild(gn);rw.appendChild(gu);l3.appendChild(rw);f2.appendChild(l3);c.appendChild(f2)}
 c.appendChild(msg);
 var b=el("div","prb"),izq=el("span"),der=el("span");
 if(P.paso>0){var bk=el("button","x","‹ Atrás");bk.onclick=function(){P.paso--;prePaint()};izq.appendChild(bk)}else{var sk=el("button","x","Saltear todo");sk.onclick=function(){preFin(true)};izq.appendChild(sk)}
 if(P.paso===2){var s2=el("button","x","Saltear");s2.onclick=function(){P.gx="";P.gt="";preFin(false)};der.appendChild(s2)}
 var nx=el("button","",P.paso<2?"Siguiente ›":"¡A la cancha! ⚽");nx.onclick=function(){var e=preCheck();if(e)return(msg.textContent=e);if(P.paso<2){P.paso++;prePaint()}else preFin(false)};der.appendChild(nx);
 b.appendChild(izq);b.appendChild(der);c.appendChild(b);w.scrollTop=0;
 if(P.paso>0){var fi=c.querySelector(".prf input");if(fi)fi.focus()}}
function preCheck(){var P=PRE;
 if(P.paso===0&&!P.cat.some(function(k){return k.on}))return"Elegí al menos una categoría.";
 if(P.paso===1&&String(P.pesos).trim()==="")return"Poné tu capital inicial (si no tenés nada, poné 0).";
 if(P.paso===2&&String(P.aho).trim()!==""&&!(parseFloat(String(P.aho).replace(",","."))>=0&&parseFloat(String(P.aho).replace(",","."))<=100))return"El % para ahorro tiene que ser de 0 a 100.";
 if(P.paso===2&&(P.gx.trim()||P.gt)){if(!P.gx.trim())return"Ponele un nombre al objetivo.";if(!preNum(P.gt))return"Poné cuánto necesitás, en dólares.";
  if(P.gu&&!(parseInt(P.gn,10)>0))return"Poné en cuántas "+{s:"semanas",m:"meses",a:"años"}[P.gu]+" querés llegar."}
 return""}
// Aplica la pretemporada. "Saltear todo" deja las categorías de ejemplo pero sin presupuesto, para que los consejos no inventen.
function preFin(todo){var P=PRE,NB={};
 if(todo)Object.keys(BUDGET).forEach(function(k){NB[k]=0});else P.cat.forEach(function(k){if(k.on)NB[k.n]=preNum(k.v)});
 delete NB.Otros;NB.Otros=0;L.expenses.forEach(function(e){if(NB[e.c]==null)e.c="Otros"});BUDGET=NB;
 cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});
 if(!todo){ACC=[["Día a día",preNum(P.pesos)]];CAP=1;USD=[["Ahorro en dólares",preNum(P.usd)]];Object.keys(L.bal).forEach(function(k){if(/^[au]\d+$/.test(k))delete L.bal[k]});
  AHO=Math.min(preNum(P.aho),100);var iv=preNum(P.ing);if(iv)sumarIng(today,iv,AHO);
  if(P.gx.trim()&&preNum(P.gt)){var n=parseInt(P.gn,10);GOAL={x:P.gx.trim(),target:preNum(P.gt),saved:0,pl:P.gu?{u:P.gu,n:n}:null,hasta:P.gu?sumaPlazo(today,n,P.gu):null}}}
 ONB=1;HAVECFG=true;preEnd();save();render();
 stat(todo?"Listo. Cuando quieras, armá tus categorías en El vestuario → Ajustes.":"¡Listo, tu equipo está armado! Lo podés cambiar cuando quieras en El vestuario → Ajustes.")}
// Capital inicial: la plata que había en el día a día antes del primer movimiento cargado. Es la base de "te queda" y de los consejos.
// A quien no lo cargó (cuentas viejas o que saltearon la pretemporada) se lo pedimos al entrar. Si ya corrigió el saldo con ajustes, no hace falta.
function hayAjustes(){return L.ing.some(function(e){return e.adj})||L.expenses.some(function(e){return e.x==="Ajuste de saldo"})}
function capFalta(){return!CAP&&!(accVal(0)>0)&&!hayAjustes()}
function primerMov(){var f="";L.expenses.concat(L.ing).forEach(function(e){var d=e.f||e.k;if(d&&(!f||d<f))f=d});return f}
function capTxt(){var f=primerMov();return f&&f<today?"la plata que tenías en "+ACC[0][0]+" el "+fd(f)+", antes del primer movimiento que cargaste":"la plata que tenés hoy en "+ACC[0][0]}
function capStart(){if(PRE||CAPLATER||ONB===0||!UID||!capFalta()||$("pre").style.display!=="none")return;
 var w=$("pre"),c=el("div","pc"),h=el("div","prh"),im=el("img"),ht=el("div"),t=el("h2","","¿Con cuánto arrancaste?"),f=el("div","prf"),lb=el("label","","Capital inicial (en pesos)"),i=el("input"),msg=el("p","sem prm"),b=el("div","prb"),izq=el("span"),der=el("span"),no=el("button","x","Más tarde"),ok=el("button","","Guardar");
 im.src="petaca.svg?v=28";im.alt="";t.id="pret";ht.appendChild(el("small","prk","Falta un dato"));ht.appendChild(t);h.appendChild(im);h.appendChild(ht);c.appendChild(h);
 c.appendChild(el("p","sem","Contale a Petaca "+capTxt()+". Así lo que te queda y los consejos cuentan toda tu plata, no solo los ingresos que cargaste. Si no tenías nada, poné 0."));
 i.type="number";i.inputMode="decimal";i.min="0";i.placeholder="Ej: 100000";lb.appendChild(i);f.appendChild(lb);c.appendChild(f);c.appendChild(msg);
 no.onclick=function(){CAPLATER=true;capEnd()};
 ok.onclick=function(){var v=i.value.trim()===""?NaN:parseFloat(i.value.replace(",","."));if(!(v>=0))return(msg.textContent="Poné un número (0 si no tenías nada).");
  if(!L.bal)L.bal={};L.bal.a0=v;CAP=1;HAVECFG=true;capEnd();save();render()};
 i.onkeydown=function(e){if(e.key==="Enter")ok.click()};
 izq.appendChild(no);der.appendChild(ok);b.appendChild(izq);b.appendChild(der);c.appendChild(b);
 w.innerHTML="";w.appendChild(c);w.style.display="";document.body.classList.add("pre-open");i.focus()}
function capEnd(){if(PRE)return;$("pre").style.display="none";$("pre").innerHTML="";document.body.classList.remove("pre-open")}
// Ahorro por ingreso: al cargar un ingreso se separa un % (el de Ajustes o el que elijas para ese ingreso) y pasa en dólares al ahorro.
// El aporte queda ligado al ingreso (aporte.ing = ingreso.id, en pesos en aporte.ars): si editás o borrás el ingreso, el aporte y el saldo se acomodan solos.
function sepTot(){var t=0;L.saves.forEach(function(e){if(e.ars)t+=e.ars});return t}
function diaVal(){return accVal(0)+ingTot()-sumM(L.expenses)-sepTot()}
function pctOk(p){p=parseFloat(String(p).replace(",","."));return p>0?Math.min(p,100):0}
function pctTxt(p){return String(Math.round(p*10)/10).replace(".",",")+"%"}
function aporteDe(o){return o&&o.id?L.saves.filter(function(s){return s.ing===o.id})[0]||null:null}
function ligar(o,p){p=pctOk(p);var s=aporteDe(o);
 if(!p){if(s)drop(L.saves,s);delete o.p;return true}
 var fx=s?s.fx||(s.m>0&&s.ars?s.ars/s.m:0):L.fx;if(!(fx>0))return false;
 if(!o.id)o.id="i"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 if(!s){s={f:o.f||today,ing:o.id};L.saves.push(s)}
 o.p=p;s.fx=fx;s.ars=Math.round(o.v*p/100);s.m=Math.round(s.ars/fx*100)/100;return true}
function sumarIng(f,v,p){var o={f:f,k:monOf(f),v:v};L.ing.push(o);ligar(o,p);return o}
function desligar(s){if(s&&s.ing)L.ing.forEach(function(o){if(o.id===s.ing)delete o.p})}
// Vista previa del ingreso que se está cargando: cuánto se separa y cuánto queda para gastar, con el % editable.
function wpPaint(){var b=$("wp");if(!b)return;b.innerHTML="";var v=parseFloat($("wi").value);if(!(v>0)){WP=null;return}
 var p=WP==null?AHO:WP,top=el("div","wpr"),i=el("input"),ch=el("div","wpc"),out=el("p","sem"),fij=el("button","lk");
 top.appendChild(el("span","","Separar para ahorro"));i.type="number";i.inputMode="decimal";i.min="0";i.max="100";i.value=p;i.setAttribute("aria-label","Porcentaje para ahorro");top.appendChild(i);top.appendChild(el("span","","%"));
 [0,5,10,15,20,30].forEach(function(n){var c=el("button","",n+"%");c.type="button";c.onclick=function(){WP=n;i.value=n;nums()};ch.appendChild(c)});
 function nums(){var q=pctOk(i.value),a=Math.round(v*q/100);
  out.textContent=q?"De "+money(v)+" separás "+money(a)+(L.fx>0?" (≈ "+usd(a/L.fx)+")":"")+" para ahorro y te quedan "+money(v-a)+" para gastar."+(L.fx>0?"":" Falta la cotización del dólar para pasarlo a US$."):"No separás nada: los "+money(v)+" quedan para gastar.";
  [].forEach.call(ch.children,function(c){c.classList.toggle("on",c.textContent===q+"%")});
  fij.textContent="Usar "+pctTxt(q)+" siempre";fij.style.display=q!==AHO?"":"none"}
 i.oninput=function(){WP=pctOk(i.value);nums()};
 fij.onclick=function(){AHO=pctOk(i.value);HAVECFG=true;save();nums()};
 b.appendChild(top);b.appendChild(ch);b.appendChild(out);b.appendChild(fij);nums()}
