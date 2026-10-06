// Valores de ejemplo: tus datos reales se cargan con "Importar" en Copia de seguridad.
var BUDGET={"Juntadas":50000,"Transporte":50000,"Supermercado":50000,"Deporte":50000,"Facultad":50000,"Otros":50000,"Salidas":50000,"Viajes":50000,"Regalos":50000,"Salud":50000};
var CLASES={};
var FIN="2000-01-01";
var SKIP=[];
var FECHAS=[];
var USD=[["Ahorro (sin invertir)",0],["Colchón",0]];
var ACC=[["Día a día",0],["Ahorro",0],["Inversiones",0]];
var GOAL={x:"Mi objetivo",target:1000,saved:0,months:0};
var RUT=[],VSTART=null,MON=null,REDIT=null;
var SEED={events:[],expenses:[]};
var KEY="panel-local-v1",L={events:[],expenses:[],saves:[],hidden:[],skip:[],ing:[],bal:{}};
try{var s=localStorage.getItem(KEY);if(s)L=JSON.parse(s);if(!L.saves)L.saves=[];if(!L.hidden)L.hidden=[];if(!L.skip)L.skip=[];if(!L.ing)L.ing=[];if(!L.bal)L.bal={};if(!L.rskip)L.rskip=[]}catch(e){}
var DOC=null;
function stat(t){var e=document.getElementById("est");if(e)e.textContent=t}
function save0(){L.t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(L));if(HAVECFG)localStorage.setItem(KEY+"-cfg",JSON.stringify(cfgObj()))}catch(e){}
 if(DOC){try{DOC.set(JSON.parse(JSON.stringify({L:L}))).then(function(){stat("Guardado en tu cuenta · v8")}).catch(function(e){stat("No pude guardar en tu cuenta ("+(e&&(e.code||e.message)||"error")+"). Quedó guardado en este dispositivo.")})}catch(e){stat("No pude guardar en tu cuenta. Quedó guardado en este dispositivo.")}}}
var UNDO=[],PREV=null,HAVECFG=false;
function snap(){return JSON.stringify({L:L,cfg:cfgObj()})}
function updUndo(){var b=document.getElementById("un");if(b){b.disabled=!UNDO.length;b.textContent="↶ Deshacer"+(UNDO.length?" ("+UNDO.length+")":"")}}
function save(){if(PREV!==null){var c=snap();if(c!==PREV){UNDO.push(PREV);if(UNDO.length>30)UNDO.shift()}}save0();PREV=snap();updUndo()}
function norm(q){q=JSON.parse(JSON.stringify(q));return{events:q.events||[],expenses:q.expenses||[],saves:q.saves||[],hidden:q.hidden||[],skip:q.skip||[],ing:q.ing||[],bal:q.bal||{},rskip:q.rskip||[],fx:q.fx,fxAuto:q.fxAuto!==false,fxAt:q.fxAt||"",week:q.week,t:q.t}}
window.addEventListener("error",function(e){var a=document.getElementById("aviso");if(a){a.style.display="";a.textContent="Error en la página: "+e.message}stat("Error en la página: "+e.message)});
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
 if(!it.r&&it.o){var on=it.k==="F"?it.o.imp!==false:it.o.imp===true;var n=el("button","x",on?"🔔":"🔕");n.title=on?"Te aviso por Telegram (tocá para desactivar)":"Sin aviso (tocá para activar)";n.setAttribute("aria-label","Aviso");n.onclick=function(){it.o.imp=!on;save();render()};row.appendChild(n)}else row.appendChild(el("span","x-sp"))
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
function render(){
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
 var base=accVal(0)+ingTot(),spd=0;L.expenses.forEach(function(e){spd+=e.m});
 var left=base-spd,pct=spd/base*100;
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
 renderGoal();renderExtra();
 var gl=$("gastos");gl.innerHTML="";
 ex.sort(function(a,b){return b.f.localeCompare(a.f)}).slice(0,8).forEach(function(e){
  var r=el("div","row"),l=el("span");l.appendChild(document.createTextNode(e.x||e.c+" "));l.appendChild(el("small","",e.f.slice(8)+"/"+e.f.slice(5,7)+" · "+e.c));
  var rt=el("span","",money(e.m));
  if(e.li!=null){var b=el("button","x","×");b.setAttribute("aria-label","Borrar gasto");b.onclick=function(){L.expenses.splice(e.li,1);save();render()};rt.appendChild(b)}
  r.appendChild(l);r.appendChild(rt);gl.appendChild(r)});
}
function renderGoal(){
 var b=$("metas");b.innerHTML="";
 var extra=0;L.saves.forEach(function(e){extra+=e.m});
 var base=0;USD.forEach(function(a,i){base+=usdVal(i)});var got=base+extra,p=Math.min(got/GOAL.target*100,100),left=GOAL.target-got;
 var h=el("div","gh");h.appendChild(el("h3","",GOAL.x));h.appendChild(el("span","",Math.floor(p)+"%"));
 var tr=el("div","track"),fl=el("div","fill");fl.style.width=p+"%";tr.appendChild(fl);
 var dl=new Date(now.getFullYear(),now.getMonth()+GOAL.months,now.getDate());
 var t=left<=0?"Objetivo cumplido.":"Te faltan "+usd(left)+(GOAL.months?". Para llegar al "+dl.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})+" tenés que ahorrar "+usd(left/GOAL.months)+" por mes.":".");
 b.appendChild(h);b.appendChild(el("div","none",usd(got)+" de "+usd(GOAL.target)+" ("+USD.map(function(a){return a[0].toLowerCase()}).join(" + ")+(extra?" + aportes":"")+")"));b.appendChild(tr);b.appendChild(el("p","info",t));
 if(L.saves.length){var u=el("button","x","Deshacer último aporte o retiro");u.onclick=function(){L.saves.pop();save();render()};b.appendChild(u)}
}
$("ar").onclick=function(){var m=parseFloat($("am").value);if(!(m>0))return;L.saves.push({f:today,m:-m});$("am").value="";save();render()};
$("ab").onclick=function(){var m=parseFloat($("am").value);if(!(m>0))return;L.saves.push({f:today,m:m});$("am").value="";save();render()};
var APPTOT=1;
var HIST=[["Sin datos",1]];
function renderHist(){
 var h=$("hist");h.innerHTML="";
 var cuentas=0;ACC.forEach(function(a,i){cuentas+=accVal(i)});
 var du=0;USD.forEach(function(a,i){du+=usdVal(i)});du+=saveTot();
 var by={},sp=0;L.expenses.forEach(function(e){sp+=e.m;by[e.c]=(by[e.c]||0)+e.m});
 var H=HIST.map(function(e){return[e[0],e[1]+(e[2]?0:(by[e[0]]||0)),e[2]]});
 Object.keys(by).forEach(function(k){if(!HIST.some(function(e){return e[0]===k}))H.push([k,by[k]])});
 H.sort(function(a,b){return b[1]-a[1]});
 var tot=APPTOT+sp,mov=0;H.forEach(function(e){if(e[2])mov+=e[1]});
 cuentas+=ingTot()-sp;var rows=[["Tus cuentas en pesos",money(cuentas)],["Tus dólares","US$ "+du.toLocaleString("es-AR")],["Registrado en 2026 (app + panel)","≈ "+money(tot)],["Movido a ahorro e inversión",money(mov)],["Gastos reales (sin ahorro ni inversión)","≈ "+money(tot-mov)]];
 rows.forEach(function(r){var d=el("div","row");d.appendChild(el("span","",r[0]));d.appendChild(el("b","",r[1]));h.appendChild(d)});
 var t=el("h3","","En qué se fue la plata en 2026");t.style.margin="18px 0 10px";t.style.fontSize="16px";h.appendChild(t);
 var mx=H[0][1]||1;
 H.forEach(function(e){
  var c=el("div","cat"),a=el("div");
  a.appendChild(el("span","",e[0]+(e[2]?" (no es gasto)":"")));
  a.appendChild(el("span","",Math.round(e[1]/tot*100)+"% · "+money(e[1])));
  var tr=el("div","track"),f=el("div","fill");f.style.width=(e[1]/mx*100)+"%";if(e[2])f.style.background="var(--mute)";
  tr.appendChild(f);c.appendChild(a);c.appendChild(tr);h.appendChild(c)});
 h.appendChild(el("p","sem","Las barras parten de tus capturas de la app y suman lo que cargás en este panel."));
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
 var wi=null;L.ing.forEach(function(e){if(e.k===wk&&!e.adj)wi=(wi||0)+e.v});
 $("sem").textContent=wi==null?"Cargá lo que te entró esta semana para ver cuánto te sobra.":"Esta semana entró "+money(wi)+" y gastaste "+money(ws)+(wi-ws>0?": te sobran "+money(wi-ws)+(L.fx>0?" (≈ "+usd((wi-ws)/L.fx)+")":"")+" para los próximos gastos.":": esta semana no sobra.");
 var c=$("ctas");c.innerHTML="";var t=0;
 ACC.forEach(function(a,i){var d=i===0,v=d?accVal(0)+ingTot()-sp:accVal(i);t+=v;var r=el("div","row");r.appendChild(el("span","",d&&(sp||ingTot())?a[0]+" (con lo que cargaste)":a[0]));var rt=el("span","",money(v)),b=el("button","x","✎");b.setAttribute("aria-label","Corregir saldo");b.onclick=function(){editBal(r,v,function(nv){if(d)ajusteDiario(nv-v);else setBal("a"+i,nv)})};rt.appendChild(b);r.appendChild(rt);c.appendChild(r)});
 var r=el("div","row");r.appendChild(el("b","","Total"));r.appendChild(el("b","",money(t)));c.appendChild(r);
 var u=el("div","none","Dólares");u.style.marginTop="12px";c.appendChild(u);var tu=0;
 USD.forEach(function(a,i){var sv=i===0,v=usdVal(i)+(sv?saveTot():0);tu+=v;var q=el("div","row");q.appendChild(el("span","",a[0]));var rt=el("span","","US$ "+v.toLocaleString("es-AR")),b=el("button","x","✎");b.setAttribute("aria-label","Corregir saldo");b.onclick=function(){editBal(q,v,function(nv){setBal("u"+i,sv?nv-saveTot():nv)})};rt.appendChild(b);q.appendChild(rt);c.appendChild(q)});
 var q=el("div","row");q.appendChild(el("b","","Total en dólares"));q.appendChild(el("b","","US$ "+tu.toLocaleString("es-AR")));c.appendChild(q);
 if(L.fx>0){var f1=el("div","row");f1.appendChild(el("span","",L.fxAuto?"Dólar blue (venta"+(L.fxAt?" · "+L.fxAt:"")+")":"Cotización usada (manual)"));f1.appendChild(el("span","",money(L.fx)+" por US$"));c.appendChild(f1);
  var f2=el("div","row");f2.appendChild(el("b","","Todo junto en pesos"));f2.appendChild(el("b","","≈ "+money(t+tu*L.fx)));c.appendChild(f2)}
}
$("fb").onclick=function(){var v=parseFloat($("fx").value);if(!(v>0))return;L.fx=v;L.fxAuto=false;$("fx").value="";save();render()};
$("fa").onclick=function(){L.fxAuto=true;save0();blue(true)};
$("wb").onclick=function(){var v=parseFloat($("wi").value);if(!(v>=0))return;setWeek(v);$("wi").value="";save();render()};
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
 L.ing.forEach(function(e){all.push({t:"i",e:e,f:e.f||e.k,l:e.adj?"Ajuste de saldo":"Ingreso",v:e.v})});
 L.saves.forEach(function(e){all.push({t:"a",e:e,f:e.f,l:e.m<0?"Retiro del ahorro":"Aporte al ahorro",v:e.m})});
 if(!all.length){h.appendChild(el("div","none","Todavía no cargaste movimientos desde el panel."));return}
 all.sort(function(a,b){return b.f.localeCompare(a.f)}).slice(0,30).forEach(function(m){
  var r=el("div","row"),l=el("span");l.appendChild(document.createTextNode(m.l+" "));l.appendChild(el("small","",m.f.slice(8)+"/"+m.f.slice(5,7)));
  var rt=el("span","",m.t==="a"?usd(m.v):money(m.v)),ed=el("button","x","✎"),dl=el("button","x","×");
  ed.setAttribute("aria-label","Editar monto");dl.setAttribute("aria-label","Borrar");
  ed.onclick=function(){editMov(r,m)};
  dl.onclick=function(){if(m.t==="g")drop(L.expenses,m.e);else if(m.t==="i"){drop(L.ing,m.e);if(L.week&&L.week.k===m.e.k)L.week=null}else drop(L.saves,m.e);save();render()};
  rt.appendChild(ed);rt.appendChild(dl);r.appendChild(l);r.appendChild(rt);h.appendChild(r)});
}
function editMov(r,m){
 r.innerHTML="";r.style.flexWrap="wrap";
 var n=document.createElement("input");n.type="number";n.value=m.v;n.setAttribute("aria-label","Monto");
 var sel=null;
 if(m.t==="g"){sel=document.createElement("select");Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;if(k===m.e.c)o.selected=true;sel.appendChild(o)})}
 var ok=el("button","","Guardar"),no=el("button","x","Cancelar");
 ok.onclick=function(){var v=parseFloat(n.value);if(m.t==="a"?!v:!(v>0))return;
  if(m.t==="g"){m.e.m=v;m.e.c=sel.value}else if(m.t==="i"){m.e.v=v;if(L.week&&L.week.k===m.e.k)L.week.v=v}else m.e.m=v;
  save();render()};
 no.onclick=function(){render()};
 r.appendChild(n);if(sel)r.appendChild(sel);r.appendChild(ok);r.appendChild(no);
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
function prompt1(txt,C){return "Hoy es "+today+" ("+now.toLocaleDateString("es-AR",{weekday:"long"})+"). Extraé de esta nota en español rioplatense los gastos en pesos, los eventos y, si aparecen, el ingreso de la semana en pesos o un aporte de ahorro en dólares (negativo si retira plata del ahorro). Devolvé SOLO un JSON con esta forma: {\"gastos\":[{\"monto\":number,\"categoria\":\"una de: "+Object.keys(BUDGET).join(", ")+"\",\"detalle\":string,\"fecha\":\"YYYY-MM-DD\"}],\"eventos\":[{\"fecha\":\"YYYY-MM-DD\",\"hora\":\"HH:MM o vacío\",\"titulo\":string}],\"ingresos\":[{\"monto\":number,\"fecha\":\"YYYY-MM-DD\"}],\"ahorro_usd\":number o null,\"cotizacion\":number o null}. Si un gasto no tiene fecha, usá hoy. 'mil' vale 1000. Si la nota cancela o borra algo, devolvé también \"cancelar\":[ids de la lista de abajo] y, si dice que no va a clase algún día, \"sin_clases\":[\"YYYY-MM-DD\"]. Si algo se repite todas las semanas, devolvé también \"rutinas\":[{\"dia\":0 a 6 (0=domingo),\"hora\":\"HH:MM\",\"titulo\":string}]. Lista actual: "+C.list+". Nota: "+txt}
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
  var G=(r.gastos||[]).filter(function(g){return g&&g.monto>0}).map(function(g){return{f:ok.test(g.fecha)?g.fecha:today,m:Number(g.monto),c:BUDGET[g.categoria]?g.categoria:"Otros",x:String(g.detalle||"")}});
  var E=(r.eventos||[]).filter(function(e){return e&&ok.test(e.fecha)&&e.titulo}).map(function(e){return{f:e.fecha,t:/^\d{2}:\d{2}$/.test(e.hora||"")?e.hora:"",x:String(e.titulo),imp:!!e.imp||/importante|avis/i.test(e.titulo)}});
  var IN=(r.ingresos||[]).filter(function(g){return g&&g.monto>0}).map(function(g){return{f:ok.test(g.fecha)?g.fecha:today,v:Number(g.monto)}}),A=Number(r.ahorro_usd)||null;
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
   {a:E,t:function(e){return"Evento: "+e.x+" · "+fd(e.f)+(e.t?" "+e.t:"")+(e.imp?" · 🔔 te aviso por Telegram":"")},f:[["x","Qué","text"],["f","Fecha","date"],["t","Hora","time"],["imp","Avisarme por Telegram","check"]]},
   {a:IN,t:function(i){return"Ingreso: "+money(i.v)+" · "+fd(i.f)},f:[["v","Monto","number"],["f","Fecha","date"]]},
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
     else if(s[2]==="number"){v=parseFloat(String(i.value).replace(",","."));if(!isFinite(v)||v===0||(v<0&&k.a!==AA))return}
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
   yes.onclick=function(){Cn.forEach(function(c){if(c.t==="F")L.hidden.push(c.e.f+"|"+c.e.x);else if(c.t==="E")drop(L.events,c.e);else drop(L.expenses,c.e)});NSo.forEach(function(d){L.skip.push(d.f)});RU.forEach(function(u){RUT.push(u)});G.forEach(function(g){L.expenses.push(g)});E.forEach(function(e){L.events.push(e)});IN.forEach(function(i){L.ing.push({f:i.f,k:monOf(i.f),v:i.v})});if(FF.length){L.fx=FF[0].v;L.fxAuto=false}if(AA.length)L.saves.push({f:today,m:AA[0].m});$("nt").value="";out.innerHTML="";save();render()};
   no.onclick=function(){out.innerHTML=""};
   out.appendChild(yes);out.appendChild(no)}
  draw();
 }catch(e){out.textContent="No pude procesar la nota: "+(e&&(e.message||e.code)||"error")}
 finally{busy=false}
};

function cfgObj(){return{ACC:ACC,USD:USD,BUDGET:BUDGET,CLASES:CLASES,RUT:RUT,FIN:FIN,SKIP:SKIP,FECHAS:FECHAS,GOAL:GOAL,HIST:HIST,APPTOT:APPTOT}}
function applyCfg(c){if(!c)return;if(c.ACC)ACC=c.ACC;if(c.USD)USD=c.USD;if(c.BUDGET)BUDGET=c.BUDGET;if(c.CLASES)CLASES=c.CLASES;if(c.RUT)RUT=c.RUT;if(c.FIN)FIN=c.FIN;if(c.SKIP)SKIP=c.SKIP;if(c.FECHAS)FECHAS=c.FECHAS;if(c.GOAL)GOAL=c.GOAL;if(c.HIST)HIST=c.HIST;if(c.APPTOT)APPTOT=c.APPTOT;migrate();
 cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)})}
$("bx").onclick=function(){$("bk").value=JSON.stringify({v:1,L:L,cfg:cfgObj()});$("bm").textContent="Copiá todo el texto y guardalo en un lugar seguro."};
$("bi").onclick=function(){try{var o=JSON.parse($("bk").value);if(!o||!o.L)throw 0;applyCfg(o.cfg);HAVECFG=true;L=norm(o.L);save();UNDO.length=0;updUndo();render();$("bm").textContent="Datos importados."}catch(e){$("bm").textContent="El texto no es una copia válida."}};
// ===== Supabase =====
var SUPABASE_URL="https://jrsjnmutdnzuxqimroaa.supabase.co";
var SUPABASE_KEY="sb_publishable__BLdyenbNV0eqb-5MdL2Cw_48V2WwDA";
var SB=null,UID=null;
function loginUI(on,email){document.body.classList.toggle("auth",!!on);$("login").style.display=on?"":"none";$("ses").style.display=on?"none":"";$("usrp").style.display=on?"none":"";if(email)$("sem2").textContent="Sesión: "+email}
function push(){if(!HAVECFG)return Promise.resolve();var d=JSON.parse(JSON.stringify({L:L,cfg:cfgObj()}));return SB.from("panel_state").upsert({user_id:UID,data:d,updated_at:new Date().toISOString()}).then(function(r){if(r.error)throw r.error})}
function adopt(q){setTimeout(blue,0);if(q.cfg){applyCfg(q.cfg);HAVECFG=true}L=norm(q.L);PREV=snap();try{localStorage.setItem(KEY,JSON.stringify(L));if(HAVECFG)localStorage.setItem(KEY+"-cfg",JSON.stringify(cfgObj()))}catch(e){}render()}
async function pull(){
 var r=await SB.from("panel_state").select("data").eq("user_id",UID).maybeSingle();
 if(r.error){stat("No pude leer tu nube: "+r.error.message);return}
 var q=r.data&&r.data.data;
 if(q&&q.L){if(!HAVECFG&&q.cfg){applyCfg(q.cfg);HAVECFG=true;render()}if((q.L.t||0)>=(L.t||0))adopt(q);else await push();stat("Sincronizado con tu nube · v10")}
 else{HAVECFG=true;await push();stat("Nube inicializada · v10")}
}
async function enter(session){
 UID=session.user.id;var ow=null;try{ow=localStorage.getItem("panel-owner")}catch(e){}if(ow&&ow!==UID)resetLocal();try{localStorage.setItem("panel-owner",UID)}catch(e){}DOC={set:function(){return push()}};loginUI(false,session.user.email);
 loadUser();
 try{await pull()}catch(e){stat("No pude sincronizar: "+(e&&e.message||e))}
 SB.channel("ps-"+UID).on("postgres_changes",{event:"*",schema:"public",table:"panel_state",filter:"user_id=eq."+UID},function(p){var q=p.new&&p.new.data;if(q&&q.L&&(q.L.t||0)>(L.t||0))adopt(q)}).subscribe()}
async function startSB(){
 if(!window.supabase||SUPABASE_URL.indexOf("http")!==0){document.body.classList.remove("auth");stat("Falta configurar Supabase: completá la URL y la clave al principio del script. Mientras tanto se guarda solo en este dispositivo · v9");return}
 SB=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 var r=await SB.auth.getSession();
 if(r.data&&r.data.session)await enter(r.data.session);else{loginUI(true);stat("Iniciá sesión para sincronizar · v9")}
 SB.auth.onAuthStateChange(function(ev,s){if(ev==="SIGNED_IN"&&s&&!UID)enter(s);if(ev==="PASSWORD_RECOVERY"){$("rec").style.display="";$("login").style.display="none"}if(ev==="SIGNED_OUT"){UID=null;DOC=null;resetLocal();try{localStorage.removeItem("panel-owner")}catch(e){}loginUI(true)}})}
document.getElementById("un").onclick=function(){if(!UNDO.length)return;var q=JSON.parse(UNDO.pop());applyCfg(q.cfg);L=norm(q.L);save0();PREV=snap();render();updUndo();var o=document.getElementById("nr");if(o)o.textContent="Deshice el último cambio."};
function authMsg(t){$("lm").textContent=t}
$("lg").onclick=async function(){if(!SB)return authMsg("Falta configurar Supabase.");var em=$("le").value.trim(),pw=$("lp").value;if(!em)return authMsg("Escribí tu email o tu usuario.");if(pw.length<6)return authMsg("La contraseña tiene que tener al menos 6 caracteres.");em=await mailOf(em);if(!em)return authMsg("No encontré ese usuario.");var r=await SB.auth.signInWithPassword({email:em,password:pw});authMsg(r.error?"No pude entrar: "+r.error.message:"")};
$("lr").onclick=async function(){if(!SB)return authMsg("Falta configurar Supabase.");var em=$("le").value.trim(),pw=$("lp").value;if(!em||em.indexOf("@")<1)return authMsg("Escribí tu email en el campo Email.");if(pw.length<6)return authMsg("La contraseña tiene que tener al menos 6 caracteres.");var r=await SB.auth.signUp({email:em,password:pw});authMsg(r.error?"No pude crear la cuenta: "+r.error.message:"Cuenta creada. Si Supabase te pide confirmar el email, revisá tu correo y después tocá Entrar.")};
$("lo").onclick=async function(){if(SB)await SB.auth.signOut()};
async function mailOf(v){v=v.trim();if(v.indexOf("@")>0)return v;var r=await SB.rpc("login_email",{u:v.toLowerCase()});return r.data||null}
$("lf").onclick=async function(){if(!SB)return authMsg("Falta configurar Supabase.");var v=$("le").value.trim();if(!v)return authMsg("Escribí arriba tu email o tu usuario y tocá de nuevo.");var em=await mailOf(v);if(em){await SB.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname})}authMsg("Si la cuenta existe, te mandé un mail para crear una contraseña nueva. Revisá también spam.")};
$("rpb").onclick=async function(){var pw=$("rp").value;if(pw.length<6)return($("rpm").textContent="Mínimo 6 caracteres.");var r=await SB.auth.updateUser({password:pw});if(r.error)return($("rpm").textContent="No pude cambiarla: "+r.error.message);$("rp").value="";$("rpm").textContent="";$("rec").style.display="none";try{history.replaceState(null,"",location.pathname)}catch(e){}stat("Contraseña actualizada")};
async function loadUser(){try{var r=await SB.from("profiles").select("username").eq("user_id",UID).maybeSingle();$("uname").value=(r.data&&r.data.username)||""}catch(e){}}
$("us").onclick=async function(){var u=$("uname").value.trim().toLowerCase();if(!/^[a-z0-9_.]{3,20}$/.test(u))return($("um").textContent="3 a 20 caracteres: letras, números, _ o .");var r=await SB.from("profiles").upsert({user_id:UID,username:u});$("um").textContent=r.error?(r.error.code==="23505"?"Ese usuario ya existe.":"No pude guardarlo."):"Guardado. Ya podés entrar con "+u+".";if(!r.error)$("uname").value=u};
document.addEventListener("visibilitychange",function(){if(!document.hidden&&UID)pull().catch(function(){})});
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
  if(v!==L.fx||s!==L.fxAt||force){L.fx=v;L.fxAt=s;save0();PREV=snap()}
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
 [["x","Nombre del objetivo","text",GOAL.x],["target","Meta (US$)","number",GOAL.target],["months","En cuántos meses (0 = sin plazo)","number",GOAL.months||0]].forEach(function(s){var i=el("input");i.type=s[2];i.id="ajg-"+s[0];i.value=s[3];i.placeholder=s[1];i.title=s[1];i.setAttribute("aria-label",s[1]);if(s[2]==="number")i.inputMode="decimal";gr.appendChild(i)});
 g.appendChild(gr);f.appendChild(g);
 AJ.acc=ajList(f,"Cuentas en pesos (la primera es la del día a día)",ACC.map(function(a,i){return[a[0],null,i]}),"Nombre de la cuenta",null,function(o){return o===0});
 AJ.usd=ajList(f,"Cuentas en dólares (la primera suma tus aportes al ahorro)",USD.map(function(a,i){return[a[0],null,i]}),"Nombre de la cuenta",null,function(o){return o===0})}
function ajSave(){
 var m=$("ajm"),C=AJ.cat(),A=AJ.acc(),U=AJ.usd(),seen={};
 for(var i=0;i<C.length;i++){var n=C[i].n;if(!n)return(m.textContent="Hay una categoría sin nombre.");if(seen[n.toLowerCase()])return(m.textContent="La categoría \""+n+"\" está repetida.");seen[n.toLowerCase()]=1}
 if(A.some(function(a){return!a.n})||U.some(function(a){return!a.n}))return(m.textContent="Hay una cuenta sin nombre.");
 var gx=$("ajg-x").value.trim(),gt=parseFloat($("ajg-target").value),gm=parseInt($("ajg-months").value,10)||0;
 if(!gx)return(m.textContent="Poné un nombre para el objetivo.");if(!(gt>0))return(m.textContent="La meta del objetivo tiene que ser mayor a 0.");
 // Categorías: renombrar o quitar actualiza los gastos ya cargados (los de una categoría quitada pasan a "Otros").
 var NB={},ren={};C.forEach(function(c){NB[c.n]=c.v>=0?c.v:0;if(c.o!=null)ren[c.o]=c.n});
 L.expenses.forEach(function(e){e.c=ren[e.c]||(NB[e.c]!=null?e.c:"Otros")});
 if(NB.Otros==null)NB.Otros=0;BUDGET=NB;
 // Cuentas: los saldos se guardan por posición, así que se reacomodan si se quitan o mueven cuentas.
 function remap(R,old,p){var nb={};Object.keys(L.bal).forEach(function(k){if(k.charAt(0)!==p)nb[k]=L.bal[k]});
  var na=R.map(function(r,j){if(r.o!=null&&L.bal[p+r.o]!=null)nb[p+j]=L.bal[p+r.o];return[r.n,r.o!=null?old[r.o][1]:0]});L.bal=nb;return na}
 ACC=remap(A,ACC,"a");USD=remap(U,USD,"u");
 GOAL={x:gx,target:gt,saved:GOAL.saved||0,months:Math.max(0,gm)};
 HAVECFG=true;cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});
 save();render();ajForm();$("ajm").textContent="Ajustes guardados."}
$("aj").addEventListener("toggle",function(){if($("aj").open)ajForm()});
$("ajs").onclick=ajSave;$("ajc").onclick=ajForm;
