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
var CALS=[]; // calendarios vinculados por link: {id,u,n,t,err} (ver "Tus calendarios")
var CAP=0,CAPLATER=false,PAT=0; // CAP=1: ya cargó su capital inicial. PAT=1: ya contó cuánto tiene ahorrado e invertido. CAPLATER: tocó "Más tarde" en esta visita
var AHO=10,WP=null; // AHO: % de cada ingreso que se propone separar para ahorro. WP: % elegido para el ingreso que se está cargando
var SEED={events:[],expenses:[]};
var MED=[["t","🏦 Transferencia"],["e","💵 Efectivo"]]; // medio de cada ingreso o gasto (ver efVal)
// Equipo del usuario (se guarda en su cuenta): cambia la camiseta de Petaca y los colores del panel. Sin equipo, Petaca es albiceleste.
// En la pantalla de entrada siempre es albiceleste, porque todavía no se sabe quién entra. Solo colores de camiseta, sin escudos.
// Petaca es un bebé rubio jugador, con 5 poses (img/petaca-POSE-CAMISETA.png): sentado con la pelota (el de siempre),
// enojado pisando la pelota (charla técnica y berrinche), gateando (pretemporada), pateando (entrada y cuando se va) y acostado (pie de página).
var EQUIPO="",EQS={"":{n:"Sin equipo (albiceleste)",tc:"#12A150",d:"la camiseta de la Selección"},
 boca:{n:"Boca",tc:"#0B4DA2",es:{lg:"arg.1",id:"5"},d:"la camiseta azul con la franja amarilla",
  foto:{t:"La Bombonera",a:"Ministerio de Cultura de la Nación",l:"CC BY-SA 2.0",lu:"https://creativecommons.org/licenses/by-sa/2.0/",u:"https://commons.wikimedia.org/wiki/File:Estadio_Alberto_J._Armando_field_view.jpg"}},
 colon:{n:"Colón",tc:"#C8151B",es:{lg:"arg.2",id:"7"},d:"la camiseta mitad roja y mitad negra",
  foto:{t:"Estadio Brigadier López",a:"HighViewDrone",l:"CC BY-SA 4.0",lu:"https://creativecommons.org/licenses/by-sa/4.0/",u:"https://commons.wikimedia.org/wiki/File:Estadio_Brigadier_General_Estanislao_L%C3%B3pez_-_Col%C3%B3n_de_Santa_Fe.jpg"}},
 union:{n:"Unión",tc:"#D8121A",es:{lg:"arg.1",id:"20"},d:"la camiseta a bastones rojos y blancos",
  foto:{t:"Estadio 15 de Abril",a:"TitiNicola",l:"CC BY-SA 4.0",lu:"https://creativecommons.org/licenses/by-sa/4.0/",u:"https://commons.wikimedia.org/wiki/File:Estadio_15_de_Abril_-_Club_Atl%C3%A9tico_Uni%C3%B3n_de_Santa_Fe.jpg"}}};
// es: liga e id del equipo en ESPN, para el próximo partido y la tabla (ver renderEquipo).
var LIGAS={"arg.1":"Liga Profesional","arg.2":"Primera Nacional"};
function eqDe(k){return k&&EQS[k]?k:""}
function pose(p,k){return"img/petaca-"+p+"-"+(k&&EQS[k]?k:"arg")+".png?v=2"}
Object.keys(EQS).forEach(function(k){EQS[k].img=pose("sentado",k)});
var PRECARGA={};
function vestir(){var a=document.body.classList.contains("auth"),e=EQS[a?"":EQUIPO]||EQS[""];
 Object.keys(EQS).forEach(function(k){if(k)document.body.classList.toggle("eq-"+k,!a&&k===EQUIPO)});
 // Cada imagen con data-pose se viste con la camiseta del equipo. En la entrada, Petaca aparece pateando.
 var kit=a?"":EQUIPO;
 document.querySelectorAll("img[data-pose]").forEach(function(i){if(i.dataset.egg)return;var u=pose(a&&i.classList.contains("masc")?"pateando":i.dataset.pose,kit);if(i.getAttribute("src")!==u)i.src=u;
  if(i.classList.contains("masc"))i.alt="Petaca, la mascota: un bebé rubio jugador de fútbol con "+e.d});
 // Las poses del berrinche, listas para que el cambio sea instantáneo
 ["enojado","pateando"].forEach(function(p){var u=pose(p,kit);if(!PRECARGA[u]){PRECARGA[u]=new Image();PRECARGA[u].src=u}});
 var tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.content=a?"#12A150":e.tc;
 var ek=a?"":EQUIPO;if(ek!==EQLAST){EQLAST=ek;renderEquipo()}
 var eb=document.getElementById("eqbtn");if(eb)eb.textContent="⚽ "+(EQUIPO?EQS[EQUIPO].n:"Tu equipo")+" ▾"
 // Crédito de la foto de fondo (la licencia pide autor, fuente y licencia)
 var cr=document.getElementById("credito");if(cr){var f=!a&&e.foto;cr.innerHTML="";cr.style.display=f?"":"none";
  if(f){cr.appendChild(document.createTextNode("Foto de fondo: "));var l1=document.createElement("a");l1.href=f.u;l1.target="_blank";l1.rel="noopener";l1.textContent=f.t;cr.appendChild(l1);
   cr.appendChild(document.createTextNode(", por "+f.a+" ("));var l2=document.createElement("a");l2.href=f.lu;l2.target="_blank";l2.rel="noopener";l2.textContent=f.l;cr.appendChild(l2);cr.appendChild(document.createTextNode("), vía Wikimedia Commons."))}}}
var KEY="panel-local-v1",L={events:[],expenses:[],saves:[],hidden:[],skip:[],ing:[],mv:[],bal:{},fxAuto:true};
try{var s=localStorage.getItem(KEY);if(s)L=JSON.parse(s);if(!L.saves)L.saves=[];if(!L.hidden)L.hidden=[];if(!L.skip)L.skip=[];if(!L.ing)L.ing=[];if(!L.bal)L.bal={};if(!L.rskip)L.rskip=[];if(!L.calno)L.calno=[];if(!L.mv)L.mv=[];if(L.fxAuto==null)L.fxAuto=true}catch(e){}
var DOC=null,VER="v63";
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
// SYNCED: ya se bajó la nube al entrar. Antes de eso no se guarda nada automático (como el dólar), porque subiría
// la copia vieja de este dispositivo y pisaría los cambios hechos en otro.
var UNDO=[],PREV=null,HAVECFG=false,SYNCED=false;
function snap(){return JSON.stringify({L:L,cfg:cfgObj()})}
function updUndo(){var b=document.getElementById("un");if(b){b.disabled=!UNDO.length;b.textContent="↶ Deshacer"+(UNDO.length?" ("+UNDO.length+")":"")}}
function save(){if(PREV!==null){var c=snap();if(c!==PREV){UNDO.push(PREV);if(UNDO.length>30)UNDO.shift()}}save0();PREV=snap();updUndo()}
function norm(q){q=JSON.parse(JSON.stringify(q));return{events:q.events||[],expenses:q.expenses||[],saves:q.saves||[],hidden:q.hidden||[],skip:q.skip||[],ing:q.ing||[],mv:q.mv||[],bal:q.bal||{},rskip:q.rskip||[],calno:q.calno||[],fx:q.fx,fxAuto:q.fxAuto!==false,fxAt:q.fxAt||"",week:q.week,t:q.t}}
window.addEventListener("error",function(e){reportar("Error en la página: "+e.message,(e.error&&e.error.stack)||(e.filename+":"+e.lineno+":"+e.colno));var a=document.getElementById("aviso");if(a){a.style.display="";a.textContent="Error en la página: "+e.message+" (quedó registrado para arreglarlo)"}stat("Error en la página: "+e.message)});
window.addEventListener("unhandledrejection",function(e){var r=e.reason;reportar("Error sin manejar: "+(r&&(r.message||r.code)||r),r&&r.stack)});
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function $(i){return document.getElementById(i)}
// Números con coma para los miles y millones (1,500,000) y punto para los decimales, para que no se confundan.
function num(n,d){return Number(n).toLocaleString("en-US",{maximumFractionDigits:d==null?2:d})}
function usd(n){return "US$ "+num(Math.round(n),0)}
function money(n){return "$"+num(Math.round(n),0)}
var now=new Date(),today=iso(now),ym=today.slice(0,7);
var dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
$("fecha").textContent=now.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
$("ed").value=today;
var cs=$("gc");Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});

function migrate(){ACC.forEach(function(a){if(a[0]==="DIARIO")a[0]="Día a día"});USD.forEach(function(a){if(a[0]==="En caja")a[0]="Colchón"});if(RUT.length){juntarRut();return}Object.keys(CLASES||{}).forEach(function(k){(CLASES[k]||[]).forEach(function(c){RUT.push({id:"r"+k+"-"+c[0].replace(":",""),d:+k,t:c[0],t2:c[1],x:c[2],from:"",to:FIN})})});CLASES={}}
var DN=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function plus(f,n){var d=new Date(f+"T00:00");d.setDate(d.getDate()+n);return iso(d)}
function fd(f){return f.slice(8)+"/"+f.slice(5,7)}
function occs(f){
 var dw=new Date(f+"T00:00").getDay(),a=[];
 RUT.forEach(function(r){if(rds(r).indexOf(dw)<0)return;if(r.from&&f<r.from)return;if(r.to&&f>r.to)return;
  if(SKIP.indexOf(f)>=0||L.skip.indexOf(f)>=0||[r.id].concat(r.al||[]).some(function(id){return L.rskip.indexOf(id+"|"+f)>=0}))return;
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
// Campos de números con coma para los miles mientras escribís (1,500,000). Los campos numéricos del navegador no muestran
// separadores, así que pasan a ser de texto con teclado numérico. Su .value devuelve el número limpio ("1500000.5"),
// así el resto del código lee igual que antes; al asignarle un valor se muestra con comas.
// Como las comas de los miles las pone Petaca sola, una coma que escribís vos cuenta como decimal.
var NUMV=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
function numFmt(s){s=String(s==null?"":s);var neg=/^\s*-/.test(s);s=s.replace(/[^\d.]/g,"");var p=s.indexOf(".");
 var ent=p<0?s:s.slice(0,p),dec=p<0?"":s.slice(p+1).replace(/\./g,"");ent=ent.replace(/^0+(?=\d)/,"");
 return(neg?"-":"")+ent.replace(/\B(?=(\d{3})+(?!\d))/g,",")+(p<0?"":"."+dec)}
function numIn(i){if(i._num)return;i._num=1;var v=NUMV.get.call(i);i.type="text";i.setAttribute("data-num","");if(!i.inputMode)i.inputMode="decimal";i.autocomplete="off";
 Object.defineProperty(i,"value",{configurable:true,get:function(){return NUMV.get.call(i).replace(/,/g,"")},set:function(x){NUMV.set.call(i,x===""||x==null?"":numFmt(x))}});
 i.value=v;
 i.addEventListener("input",function(e){var r=NUMV.get.call(i),c=i.selectionStart==null?r.length:i.selectionStart;
  // Una coma escrita a mano es la coma decimal (teclados en español); pegado "1,500,000" son miles.
  if(e.inputType==="insertText"&&e.data===","&&r.indexOf(".")<0)r=r.slice(0,c-1)+"."+r.slice(c);
  else if(e.inputType==="insertFromPaste"&&!/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(r.trim()))r=r.replace(/,(?=\d{1,2}$)/,".");
  var n=r.slice(0,c).replace(/[^\d.\-]/g,"").length,f=numFmt(r);NUMV.set.call(i,f);
  var k=0,j=0;while(j<f.length&&k<n){if(/[\d.\-]/.test(f[j]))k++;j++}try{i.setSelectionRange(j,j)}catch(_){}})}
document.querySelectorAll("input[type=number]").forEach(numIn);
new MutationObserver(function(ms){ms.forEach(function(m){
 if(m.type==="attributes"){if(m.target.type==="number")numIn(m.target);return}
 m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.matches&&n.matches("input[type=number]"))numIn(n);if(n.querySelectorAll)n.querySelectorAll("input[type=number]").forEach(numIn)})})})
 .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["type"]});

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
// ¿Qué tenés hoy?: arriba del panel, la rutina y lo que tenés agendado para hoy. Si hoy no hay nada, muestra lo próximo de la semana.
function renderHoy(){
 var a=$("hoy");if(!a)return;a.innerHTML="";a.style.display="";var d=new Date(today+"T00:00"),t=el("b","","¿Qué tenés hoy?");
 t.appendChild(el("small","",DN[d.getDay()]+" "+d.getDate()));a.appendChild(t);
 function orden(x,y){return(x.t||"").localeCompare(y.t||"")}
 var list=occs(today).sort(orden);
 list.forEach(function(e){var r=el("div","ev");r.appendChild(el("time","",e.r?e.r.t+(e.r.t2?"–"+e.r.t2:""):e.t||"Todo el día"));r.appendChild(el("span","",e.r?e.r.x:e.x));
  if(e.r)r.appendChild(el("small","tag","rutina"));a.appendChild(r)});
 if(list.length)return;
 a.appendChild(el("div","none","Hoy no tenés nada agendado."));
 for(var i=1;i<=7;i++){var f=plus(today,i),q=occs(f).sort(orden);if(!q.length)continue;var e=q[0];
  a.appendChild(el("p","sem hoyprox","Lo próximo: "+(e.r?e.r.x:e.x)+" · "+(i===1?"mañana":DN[new Date(f+"T00:00").getDay()].toLowerCase()+" "+fd(f))+(e.t?" a las "+e.t:"")));break}}
function renderMes(){
 var g=$("mg");g.innerHTML="";
 var b=MON||new Date(now.getFullYear(),now.getMonth(),1),st=VSTART||today;
 $("mt").textContent=b.toLocaleDateString("es-AR",{month:"long",year:"numeric"});
 ["L","M","M","J","V","S","D"].forEach(function(n){g.appendChild(el("b","",n))});
 var lead=(b.getDay()+6)%7,dm=new Date(b.getFullYear(),b.getMonth()+1,0).getDate();
 for(var i=0;i<lead;i++)g.appendChild(el("span"));
 for(var k=1;k<=dm;k++){(function(k){var f=iso(new Date(b.getFullYear(),b.getMonth(),k)),n=occs(f).length,c=el("button",(f===today?"t":"")+(f>=st&&f<=plus(st,6)?" h":""));
  c.appendChild(document.createTextNode(k));c.appendChild(el("i","",n?"●".repeat(Math.min(n,3)):"\u00a0"));c.onclick=function(){VSTART=f;render()};g.appendChild(c)})(k)}}
// Las rutinas viejas eran de un solo día: las que son iguales (mismo nombre, horario y fechas) se juntan en una con varios días.
// Los ids de las que se juntan quedan en r.al, así siguen valiendo los días que ya se habían cancelado.
function juntarRut(){var out=[],ix={};
 RUT.forEach(function(r){if(!Array.isArray(r.ds)||!r.ds.length)r.ds=[r.d];var k=[r.x,r.t,r.t2||"",r.from||"",r.to||""].join("|"),g=ix[k];
  if(!g){ix[k]=r;out.push(r);return}
  r.ds.forEach(function(d){if(g.ds.indexOf(d)<0)g.ds.push(d)});g.al=(g.al||[]).concat([r.id],r.al||[])});
 out.forEach(function(r){r.ds=ordDias(r.ds);r.d=r.ds[0]});RUT=out}
// Una rutina se repite los días que elijas (r.ds, 0 = domingo). r.d queda con el primero, por compatibilidad con versiones viejas.
function rds(r){return Array.isArray(r.ds)&&r.ds.length?r.ds:[r.d]}
function ordDias(a){return a.slice().sort(function(x,y){return((x+6)%7)-((y+6)%7)})}
function diasTxt(a){a=ordDias(a);var k=a.join(",");
 if(a.length===7)return"todos los días";if(k==="1,2,3,4,5")return"de lunes a viernes";if(k==="6,0")return"los fines de semana";
 var n=a.map(DNP);return"los "+(n.length>1?n.slice(0,-1).join(", ")+" y "+n[n.length-1]:n[0])}
// Próximo día (desde f inclusive) en que cae alguno de los días de la rutina.
function proxDias(f,ds){var b=null;ds.forEach(function(d){var x=proxDia(f,d);if(!b||x<b)b=x});return b||f}
// Botones L M M J V S D para elegir los días, con atajos. val() devuelve los días marcados.
function diasUI(sel){var w=el("div","dias"),on=ordDias(sel||[]),bs=[];w.setAttribute("role","group");w.setAttribute("aria-label","Días que se repite");
 function pinta(){bs.forEach(function(b){var x=on.indexOf(b._d)>=0;b.classList.toggle("on",x);b.setAttribute("aria-pressed",String(x))})}
 [1,2,3,4,5,6,0].forEach(function(d){var b=el("button","dia",DN[d].charAt(0));b.type="button";b._d=d;b.title=DN[d];b.setAttribute("aria-label",DN[d]);
  b.onclick=function(){var i=on.indexOf(d);if(i>=0)on.splice(i,1);else on.push(d);pinta()};bs.push(b);w.appendChild(b)});
 [["Lun a vie",[1,2,3,4,5]],["Todos",[1,2,3,4,5,6,0]]].forEach(function(p){var b=el("button","lk",p[0]);b.type="button";b.onclick=function(){on=p[1].slice();pinta()};w.appendChild(b)});
 w.val=function(){return ordDias(on)};w.set=function(a){on=ordDias(a||[]);pinta()};pinta();return w}
function renderRut(){
 var l=$("rl");l.innerHTML="";
 RUT.slice().sort(function(a,b){return((rds(a)[0]+6)%7)-((rds(b)[0]+6)%7)||a.t.localeCompare(b.t)}).forEach(function(r){
  var dt=diasTxt(rds(r)),row=el("div","row"),s=el("span","",r.x+" · "+dt.charAt(0).toUpperCase()+dt.slice(1)+" "+r.t+(r.t2?"–"+r.t2:""));
  if(r.from||r.to)s.appendChild(el("small","","  "+(r.from?"desde "+fd(r.from):"")+(r.to?" hasta "+fd(r.to):"")));
  var rt=el("span",""),b=el("button","x","✎"),c=el("button","x","×");
  b.onclick=function(){openRut(r)};c.onclick=function(){drop(RUT,r);save();render();toast("Borré la rutina "+r.x+".")};
  rt.appendChild(b);rt.appendChild(c);row.appendChild(s);row.appendChild(rt);l.appendChild(row)});
 if(!RUT.length)l.appendChild(el("div","none","Todavía no cargaste rutinas."))}
var RDIAS=null;
function rdiasUI(){if(!RDIAS){RDIAS=diasUI([]);$("rdw").replaceWith(RDIAS);RDIAS.id="rdw"}return RDIAS}
function openRut(r){REDIT=r;rdiasUI().set(rds(r));$("rt").value=r.t;$("rt2").value=r.t2||"";$("rx").value=r.x;$("rf").value=r.from||"";$("rto").value=r.to||"";$("rb").textContent="Guardar cambios";$("rc").style.display="";mostrar($("rd"));$("rd").open=true;if($("rd").scrollIntoView)$("rd").scrollIntoView()}
function closeRut(){REDIT=null;rdiasUI().set([]);$("rx").value="";$("rt").value="";$("rt2").value="";$("rto").value="";$("rf").value=today;$("rb").textContent="Agregar rutina";$("rc").style.display="none"}
$("rc").onclick=closeRut;
$("rb").onclick=function(){var x=$("rx").value.trim(),t=$("rt").value,ds=rdiasUI().val();if(!x||!t){$("rm").textContent="Falta el nombre o la hora de inicio.";return}
 if(!ds.length){$("rm").textContent="Elegí al menos un día.";return}
 var o={ds:ds,d:ds[0],t:t,t2:$("rt2").value,x:x,from:$("rf").value,to:$("rto").value};
 if(o.from&&o.to&&o.to<o.from){$("rm").textContent="La fecha final es anterior a la inicial.";return}
 if(REDIT){var i=RUT.indexOf(REDIT);o.id=REDIT.id;if(REDIT.al)o.al=REDIT.al;if(i>=0)RUT[i]=o;else RUT.push(o)}else{o.id="r"+Date.now().toString(36);RUT.push(o)}
 $("rm").textContent="Rutina guardada: "+x+", "+diasTxt(ds)+".";closeRut();save();render()};
rdiasUI();
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
 renderMes();renderRut();renderHoy();calUI();
 var ex=allExp(),tot=0,by={};
 ex.forEach(function(e){tot+=e.m;by[e.c]=(by[e.c]||0)+e.m});
 var bt=0;for(var k in BUDGET)bt+=BUDGET[k];
 var base=accVal(0)+ingTot()-sepTot(),spd=0;L.expenses.forEach(function(e){spd+=e.m});
 var left=base-spd,pct=base>0?spd/base*100:(spd>0?100:0);
 $("fill").style.width=Math.min(pct,100)+"%";$("fill").className="fill"+(pct>=80?" over":"");
 $("mark").style.display="none";
 // La plata que queda se lee como un tablero: la etiqueta chica arriba y el número grande abajo
 var fr=$("frase");fr.innerHTML="";fr.appendChild(el("small","",left>=0?ACC[0][0]+" · te quedan":"Te pasaste en "+ACC[0][0]));fr.appendChild(el("b",left<0?"neg":"",money(Math.abs(left))));
 $("gastado").textContent="Gastaste "+money(spd)+" de "+money(base);
 var ev=efVal(),tv=left-ev,md=$("medios");md.innerHTML="";
 [["🏦 Transferencia",tv],["💵 Efectivo",ev]].forEach(function(x){var c=el("span","chip",x[0]+" ");c.appendChild(el("b","",(x[1]<0?"−":"")+money(Math.abs(x[1]))));md.appendChild(c)});
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
  var r=el("div","row"),l=el("span"),o=e.li!=null?L.expenses[e.li]:null;l.appendChild(document.createTextNode(e.x||e.c+" "));l.appendChild(el("small","",e.f.slice(8)+"/"+e.f.slice(5,7)+" · "+e.c+(o&&med(o)==="e"?" · 💵":"")));
  var rt=el("span","",money(e.m));
  if(o){var a=el("button","x","✎");a.setAttribute("aria-label","Corregir gasto");a.onclick=function(){editMov(r,{t:"g",e:o,f:o.f,v:o.m})};rt.appendChild(a);
   var b=el("button","x","×");b.setAttribute("aria-label","Borrar gasto");b.onclick=function(){drop(L.expenses,o);save();render();toast("Borré el gasto de "+money(o.m)+" en "+o.c+".")};rt.appendChild(b)}
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
 var cp=el("button","lk",fin?"Cambiar plazo":"Ponerle un plazo");cp.style.padding="0";cp.onclick=function(){mostrar($("aj"));$("aj").open=true;setTimeout(function(){var u=$("ajg-u");if(u){u.scrollIntoView({block:"center",behavior:"smooth"});u.focus()}},80)};b.appendChild(cp);
 if(L.saves.length){var u=el("button","x","Deshacer último aporte o retiro");u.onclick=function(){desligar(L.saves.pop());save();render()};b.appendChild(u)}
}
function sumM(a){var t=0;a.forEach(function(e){t+=e.m});return t}
function pc(x){return Math.round(x*100)+"%"}
// Resumen general (desde el primer movimiento cargado, no solo este mes) y pocos consejos claros: qué pasa y qué hacer.
function renderResumen(){
 var R=$("res"),T=$("tips");if(!R)return;R.innerHTML="";T.innerHTML="";
 function real(e){return e.x!=="Ajuste de saldo"}
 var gs=L.expenses.filter(real),ins=L.ing.filter(function(e){return!e.adj}),Q=[];
 var tG=sumM(gs),tIn=0;ins.forEach(function(e){tIn+=e.v});
 var desde=primerMov(),dias=desde?Math.max(1,Math.round((new Date(today+"T00:00")-new Date(desde+"T00:00"))/864e5)+1):0,meses=dias/30.44;
 var saldo=diaVal(),efv=efVal(),trv=saldo-efv;
 var got=saveTot();USD.forEach(function(a,i){got+=usdVal(i)});var falta=GOAL.target-got;
 var by={};gs.forEach(function(e){by[e.c]=(by[e.c]||0)+e.m});var cats=Object.keys(by).sort(function(a,b){return by[b]-by[a]});
 var r30=sumM(gs.filter(function(e){return e.f>plus(today,-30)&&e.f<=today}))/Math.min(30,Math.max(dias,1));
 function tip(n,t,x){Q.push([n,t,x])}
 function kpi(l,v,sub,c){var k=el("div","kpi"+(c?" "+c:""));k.appendChild(el("small","",l));k.appendChild(el("b","",v));if(sub)k.appendChild(el("span","",sub));R.appendChild(k)}
 function pinta(){var O={mal:0,ojo:1,tip:2,bien:3},N={mal:"Tarjeta roja",ojo:"Amarilla",tip:"Del DT",bien:"¡Golazo!"};
  Q.sort(function(a,b){return O[a[0]]-O[b[0]]}).slice(0,5).forEach(function(q){var r=el("div","tip "+q[0]);r.appendChild(el("i"));var t=el("span");t.appendChild(el("small","tipk",N[q[0]]));t.appendChild(el("b","",q[1]+" "));t.appendChild(document.createTextNode(q[2]));r.appendChild(t);T.appendChild(r)})}
 // Lo que hay que cargar para que los números cierren
 if(capFalta())tip("ojo","Falta tu capital inicial.","Cargá en Configuración → Ajustes cuánta plata tenías al empezar. Sin eso, Petaca solo cuenta lo que fuiste cargando.");
 if(!gs.length&&!tIn){R.style.display="none";tip("tip","Todavía no hay datos.","Cargá tus gastos e ingresos (o contáselos a Petaca) y acá vas a ver cuánta plata tenés, en qué se va y qué conviene hacer.");pinta();return}
 R.style.display="";
 // Números generales
 kpi("Tenés hoy",money(saldo),usaEf()?"🏦 "+money(trv)+" · 💵 "+money(efv):"en "+ACC[0][0],saldo<0?"mal":"");
 kpi("Entró en total",money(tIn),desde?"desde el "+fd(desde):null);
 kpi("Gastaste en total",money(tG),meses>=1.5?"≈ "+money(tG/meses)+" por mes":dias?"≈ "+money(tG/dias)+" por día":null);
 kpi("Tu ahorro",usd(got),GOAL.target>0?pc(Math.min(got/GOAL.target,1))+" de tu objetivo \""+GOAL.x+"\"":null,falta<=0?"bien":"");
 if(cats.length&&tG)kpi("Donde más gastás",cats[0],pc(by[cats[0]]/tG)+" de todo lo que gastaste");
 // Saldos en negativo: casi siempre falta cargar algo o quedó un medio equivocado
 if(saldo<0)tip("mal","Tu saldo da negativo ("+money(saldo)+").","Seguramente falta cargar un ingreso"+(capFalta()?" o tu capital inicial":"")+". Si el número real es otro, corregilo con ✎ en Cuentas.");
 else if(efv<0)tip("mal","Tu efectivo da negativo ("+money(efv)+").","Algún gasto quedó como efectivo y fue por transferencia, o falta cargar que sacaste del cajero. Corregilo con ✎ en Movimientos cargados o en Cuentas.");
 else if(trv<0)tip("mal","Lo que tenés por transferencia da negativo ("+money(trv)+").","Algún gasto quedó como transferencia y fue en efectivo, o falta cargar un depósito. Corregilo con ✎ en Movimientos cargados o en Cuentas.");
 // Cuánto dura la plata al ritmo del último mes
 if(saldo>0&&r30>0){var dura=Math.floor(saldo/r30);
  if(dura<30)tip("ojo","Te alcanza para unos "+cant(dura,"día","días")+".","Gastando como en el último mes ("+money(r30)+" por día), lo que tenés dura hasta el "+fd(plus(today,dura))+". Para que te dure un mes, gastá hasta "+money(saldo/30)+" por día.");
  else tip("bien","Tenés para rato.","Al ritmo del último mes ("+money(r30)+" por día), lo que tenés te alcanza para "+(dura>=60?"más de dos meses":"más de un mes")+".")}
 // Entra menos de lo que sale
 if(dias>=30&&tIn>0&&tG>tIn)tip("ojo","Gastás más de lo que te entra.","Desde el "+fd(desde)+" entraron "+money(tIn)+" y gastaste "+money(tG)+": la diferencia ("+money(tG-tIn)+") salió de la plata que ya tenías.");
 // Presupuestos: son por mes, así que se miran en el mes actual
 var bm={};L.expenses.forEach(function(e){if(real(e)&&e.f.slice(0,7)===ym)bm[e.c]=(bm[e.c]||0)+e.m});
 var pas=Object.keys(BUDGET).filter(function(k){return BUDGET[k]>0&&(bm[k]||0)>BUDGET[k]});
 if(pas.length)tip("mal","Este mes te pasaste del presupuesto en "+pas.join(", ")+".",pas.map(function(k){return k+": "+money(bm[k])+" de "+money(BUDGET[k])}).join(" · ")+". Si el presupuesto quedó corto, cambialo en Ajustes.");
 // Objetivo de ahorro
 var fin=metaFin(),md=metaDias();
 if(falta<=0&&GOAL.target>0)tip("bien","¡Llegaste a tu objetivo \""+GOAL.x+"\"!","Tenés "+usd(got)+". Podés ponerte uno nuevo en Ajustes.");
 else if(fin&&md>0)tip("tip","Para llegar a \""+GOAL.x+"\".","Te faltan "+usd(falta)+": ahorrá "+ritmo(falta,md)+" hasta el "+fLarga(fin)+".");
 else if(fin)tip("ojo","Venció el plazo de \""+GOAL.x+"\".","Te faltan "+usd(falta)+". Ponele una fecha nueva en Ajustes y te digo cuánto ahorrar por mes.");
 else if(GOAL.target>0)tip("tip","Tu objetivo \""+GOAL.x+"\" no tiene fecha.","Te faltan "+usd(falta)+". Ponele una fecha en Ajustes y te digo cuánto ahorrar por mes para llegar.");
 // En qué se va la plata
 if(cats.length>1&&gs.length>=5&&by[cats[0]]>=tG*.4)tip("tip",cats[0]+" se lleva el "+pc(by[cats[0]]/tG)+" de tus gastos.","Si querés gastar menos, es lo primero para mirar.");
 // Datos al día
 var ult=gs.reduce(function(m,e){return e.f>m?e.f:m},"");
 if(gs.length>=5&&ult&&ult<plus(today,-5))tip("tip","Hace "+cant(Math.round((new Date(today+"T00:00")-new Date(ult+"T00:00"))/864e5),"día","días")+" que no cargás gastos.","Si gastaste algo, anotalo así el resumen es real.");
 if(!Q.length)tip("bien","Todo en orden.","No veo nada raro en cómo se mueve tu plata.");
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
 cuentas+=ingTot()-sp-sepTot();var rows=[["Tus cuentas en pesos",money(cuentas)],["Tus dólares","US$ "+num(du)],[app?"Registrado en "+Y+" (app + panel)":"Registrado en el panel","≈ "+money(tot)],["Movido a ahorro e inversión",money(mov)],["Gastos reales (sin ahorro ni inversión)","≈ "+money(tot-mov)]];
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
var PROXALL=false;
function renderExtra(){
 renderHist();renderMov();
 var pr=$("prox");pr.innerHTML="";
 // Las 8 más cercanas; con calendarios traídos pueden ser muchas, así que el resto queda en "Ver todas".
 var PL=FECHAS.filter(function(e){return e.f>=today&&vis(e)}).map(function(e){return{o:e,k:"F"}}).concat(L.events.filter(function(e){return e.f>=today}).map(function(e){return{o:e,k:"E"}})).sort(function(a,b){return(a.o.f+a.o.t).localeCompare(b.o.f+b.o.t)});
 (PROXALL?PL:PL.slice(0,8)).forEach(function(it){var e=it.o;
  var n=Math.round((new Date(e.f+"T00:00")-new Date(today+"T00:00"))/864e5),r=el("div","row");
  r.appendChild(el("span","",(e.t?e.t+" ":"")+e.x));
  var rt=el("span","",fd(e.f)+(n===0?" · hoy":n===1?" · mañana":" · en "+n+" días"));if(n<=7)r.style.fontWeight="700";
  evBtns(rt,it,e.f,r);r.appendChild(rt);pr.appendChild(r)});
 if(PL.length>8){var vt=el("button","lk",PROXALL?"Ver menos":"Ver todas ("+PL.length+")");vt.style.padding="0";vt.onclick=function(){PROXALL=!PROXALL;render()};pr.appendChild(vt)}
 var sp=0;L.expenses.forEach(function(e){sp+=e.m});
 var wk=mon(),ws=0;L.expenses.forEach(function(e){if(e.f>=wk)ws+=e.m});
 var wi=null,wsep=0;L.ing.forEach(function(e){if(e.k===wk&&!e.adj)wi=(wi||0)+e.v});L.saves.forEach(function(e){if(e.ars&&e.f>=wk)wsep+=e.ars});var wl=(wi||0)-wsep-ws;
 $("sem").textContent=wi==null?"Cargá lo que te entró esta semana para ver cuánto te sobra.":"Esta semana entró "+money(wi)+(wsep?", separaste "+money(wsep)+" para ahorro":"")+" y gastaste "+money(ws)+(wl>0?": te sobran "+money(wl)+(L.fx>0?" (≈ "+usd(wl/L.fx)+")":"")+" para los próximos gastos.":": esta semana no sobra.");
 var c=$("ctas");c.innerHTML="";var t=0;
 ACC.forEach(function(a,i){var d=i===0,v=d?diaVal():accVal(i);t+=v;var r=el("div","row");r.appendChild(el("span","",d&&(sp||ingTot())?a[0]+" (con lo que cargaste)":a[0]));var rt=el("span","",money(v)),b=el("button","x","✎");b.setAttribute("aria-label","Corregir saldo");b.onclick=function(){editBal(r,v,function(nv){if(d)ajusteDiario(nv-v);else setBal("a"+i,nv)})};rt.appendChild(b);r.appendChild(rt);c.appendChild(r);
  if(d)[["t",v-efVal()],["e",efVal()]].forEach(function(p){var q=el("div","row sub");q.appendChild(el("span","",MED[p[0]==="e"?1:0][1]));var qt=el("span","",(p[1]<0?"−":"")+money(Math.abs(p[1]))),qb=el("button","x","✎");qb.setAttribute("aria-label","Corregir "+medTxt(p[0]));qb.onclick=function(){editMedio(q,p[0],p[1])};qt.appendChild(qb);q.appendChild(qt);c.appendChild(q)})});
 if(ACC.length>1){var r=el("div","row");r.appendChild(el("b","","Total en pesos"));r.appendChild(el("b","",money(t)));c.appendChild(r)}
 var u=el("div","none","Dólares");u.style.marginTop="12px";c.appendChild(u);var tu=0;
 USD.forEach(function(a,i){var sv=i===0,v=usdVal(i)+(sv?saveTot():0);tu+=v;var q=el("div","row");q.appendChild(el("span","",a[0]));var rt=el("span","","US$ "+num(v)),b=el("button","x","✎");b.setAttribute("aria-label","Corregir saldo");b.onclick=function(){editBal(q,v,function(nv){setBal("u"+i,sv?nv-saveTot():nv)})};rt.appendChild(b);q.appendChild(rt);c.appendChild(q)});
 var q=el("div","row");q.appendChild(el("b","","Total en dólares"));q.appendChild(el("b","","US$ "+num(tu)));c.appendChild(q);
 if(L.fx>0){var f1=el("div","row");f1.appendChild(el("span","",L.fxAuto?"Dólar blue (venta"+(L.fxAt?" · "+L.fxAt:"")+")":"Cotización usada (manual)"));f1.appendChild(el("span","",money(L.fx)+" por US$"));c.appendChild(f1);
  var f2=el("div","row");f2.appendChild(el("b","","Patrimonio (pesos + dólares)"));f2.appendChild(el("b","","≈ "+money(t+tu*L.fx)));c.appendChild(f2)}
}
$("fb").onclick=function(){var v=parseFloat($("fx").value);if(!(v>0))return;L.fx=v;L.fxAuto=false;$("fx").value="";save();render()};
$("fa").onclick=function(){L.fxAuto=true;save0();blue(true)};
$("wb").onclick=function(){var v=parseFloat($("wi").value);if(!(v>0))return;if(!seguro(dudoso("i",v,today)))return;var p=WP==null?AHO:WP,me=$("wme").value,o=sumarIng(today,v,p,me);$("wi").value="";WP=null;recMed();save();render();wpPaint();
 toast("Sumé un ingreso de "+money(v)+" ("+medTxt(me)+").");
 if(pctOk(p)&&!o.p)$("sem").textContent="Sumé el ingreso, pero no pude separar el ahorro: falta la cotización del dólar (cargala en Cuentas)."};
// Recuerda en este dispositivo el último medio elegido para ingresos y gastos.
function recMed(){try{localStorage.setItem("panel-medio",JSON.stringify({i:$("wme").value,g:$("gme").value}))}catch(e){}}
try{var rm0=JSON.parse(localStorage.getItem("panel-medio")||"{}");if(rm0.i)$("wme").value=rm0.i;if(rm0.g)$("gme").value=rm0.g}catch(e){}
$("mvb").onclick=function(){var m=parseFloat(String($("mvm").value).replace(",","."));if(!(m>0))return;var a=$("mva").value;
 L.mv.push({f:today,m:m,a:a});$("mvm").value="";save();render();toast((a==="e"?"Pasé "+money(m)+" de transferencia a efectivo.":"Pasé "+money(m)+" de efectivo a transferencia."))};
$("wi").addEventListener("input",function(){wpPaint()});
$("wi").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();$("wb").click()}});
$("eb").onclick=function(){var t=$("et").value.trim();if(!t||!$("ed").value)return;
 L.events.push({f:$("ed").value,t:$("eh").value,x:t});$("et").value="";save();render()};
$("gb").onclick=function(){var m=parseFloat($("gm").value);if(!(m>0))return;var c=$("gc").value,me=$("gme").value;if(!seguro(dudoso("g",m,today,c)))return;
 L.expenses.push({f:today,m:m,c:c,x:$("gt").value.trim(),me:me});$("gm").value="";$("gt").value="";recMed();save();render();toast("Cargué un gasto de "+money(m)+" en "+c+" ("+medTxt(me)+").")};
closeRut();render();

var busy=false;
function monOf(f){var d=new Date(f+"T00:00");d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)}
function setWeek(v){L.ing.push({f:today,k:mon(),v:v})}
function ingTot(){var t=0;L.ing.forEach(function(e){t+=e.v});return t}
function saveTot(){var t=0;L.saves.forEach(function(e){t+=e.m});return t}
function renderMov(){
 var h=$("mov");h.innerHTML="";var all=[];
 L.expenses.forEach(function(e){all.push({t:"g",e:e,f:e.f,l:"Gasto · "+e.c+(e.x?" · "+e.x:"")+" · "+medTxt(med(e)),v:e.m})});
 L.ing.forEach(function(e){all.push({t:"i",e:e,f:e.f||e.k,l:(e.adj?"Ajuste de saldo":"Ingreso"+(e.p?" · "+pctTxt(e.p)+" al ahorro":""))+" · "+medTxt(med(e)),v:e.v})});
 L.mv.forEach(function(e){all.push({t:"m",e:e,f:e.f,l:mvTxt(e),v:e.m})});
 L.saves.forEach(function(e){all.push({t:"a",e:e,f:e.f,l:e.m<0?"Retiro del ahorro":"Aporte al ahorro"+(e.ing?" · de un ingreso ("+money(e.ars)+")":""),v:e.m})});
 if(!all.length){h.appendChild(el("div","none","Todavía no cargaste movimientos desde el panel."));return}
 all.sort(function(a,b){return b.f.localeCompare(a.f)}).slice(0,30).forEach(function(m){
  var r=el("div","row"),l=el("span");l.appendChild(document.createTextNode(m.l+" "));l.appendChild(el("small","",m.f.slice(8)+"/"+m.f.slice(5,7)));
  var rt=el("span","",m.t==="a"?usd(m.v):money(m.v)),ed=el("button","x","✎"),dl=el("button","x","×");
  ed.setAttribute("aria-label","Editar monto");dl.setAttribute("aria-label","Borrar");
  ed.onclick=function(){editMov(r,m)};
  dl.onclick=function(){if(m.t==="g")drop(L.expenses,m.e);else if(m.t==="m")drop(L.mv,m.e);else if(m.t==="i"){drop(L.ing,m.e);drop(L.saves,aporteDe(m.e));if(L.week&&L.week.k===m.e.k)L.week=null}else{drop(L.saves,m.e);desligar(m.e)}save();render();
   toast("Borré: "+m.l.split(" · ")[0]+" de "+(m.t==="a"?usd(Math.abs(m.v)):money(m.v))+".")};
  rt.appendChild(ed);rt.appendChild(dl);r.appendChild(l);r.appendChild(rt);h.appendChild(r)});
}
function editMov(r,m){
 r.innerHTML="";r.style.flexWrap="wrap";
 var n=document.createElement("input");n.type="number";n.inputMode="decimal";n.value=m.v;n.setAttribute("aria-label","Monto");
 var sel=null,pi=null,fe=null,dt=null,ms=null,dir=null;
 if(m.t==="i"&&!m.e.adj){pi=document.createElement("input");pi.type="number";pi.min="0";pi.max="100";pi.value=m.e.p||0;pi.style.flex="0 0 90px";pi.setAttribute("aria-label","% para ahorro");pi.title="% para ahorro"}
 if(m.t==="g"){sel=document.createElement("select");sel.setAttribute("aria-label","Categoría");Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;if(k===m.e.c)o.selected=true;sel.appendChild(o)});
  if(!BUDGET[m.e.c]){var o0=document.createElement("option");o0.textContent=m.e.c;o0.selected=true;sel.appendChild(o0)}
  dt=document.createElement("input");dt.value=m.e.x||"";dt.placeholder="Detalle";dt.setAttribute("aria-label","Detalle")}
 if(m.t==="g"||m.t==="i"){ms=el("select");ms.setAttribute("aria-label","Medio");MED.forEach(function(p){var o=el("option","",p[1]);o.value=p[0];ms.appendChild(o)});ms.value=med(m.e)}
 if(m.t==="m"){dir=el("select");dir.setAttribute("aria-label","Hacia dónde");[["e","De transferencia a efectivo"],["t","De efectivo a transferencia"]].forEach(function(p){var o=el("option","",p[1]);o.value=p[0];dir.appendChild(o)});dir.value=m.e.a}
 if(m.t!=="a"||!m.e.ing){fe=document.createElement("input");fe.type="date";fe.value=m.f;fe.setAttribute("aria-label","Fecha")}
 var ok=el("button","","Guardar"),no=el("button","x","Cancelar");
 ok.onclick=function(){var v=parseFloat(String(n.value).replace(",","."));if(m.t==="a"?!v||(m.e.ing&&v<0):!(v>0))return;
  if(pi&&!(parseFloat(pi.value)>=0&&parseFloat(pi.value)<=100))return;
  if(fe&&!/^\d{4}-\d{2}-\d{2}$/.test(fe.value))return;
  if(m.t==="g"&&v!==m.e.m&&!seguro(dudoso("g",v,"",sel.value)))return;
  if(m.t==="g"){m.e.m=v;m.e.c=sel.value;m.e.x=dt.value.trim();m.e.me=ms.value;m.e.f=fe.value}
  else if(m.t==="i"){m.e.v=v;m.e.me=ms.value;m.e.f=fe.value;var wk=monOf(fe.value);if(L.week&&L.week.k===m.e.k){L.week.v=v;L.week.k=wk}m.e.k=wk;var ap=aporteDe(m.e);if(ap)ap.f=fe.value;if(pi)ligar(m.e,pi.value);else if(ap)ligar(m.e,m.e.p)}
  else if(m.t==="m"){m.e.m=v;m.e.a=dir.value;m.e.f=fe.value}
  else{var fx=m.e.ars?m.e.fx||m.e.ars/m.e.m:0;m.e.m=v;if(fe)m.e.f=fe.value;if(fx){m.e.ars=Math.round(v*fx);L.ing.forEach(function(o){if(o.id===m.e.ing)o.p=Math.round(m.e.ars/o.v*1000)/10})}}
  save();render();toast("Guardé la corrección.")};
 no.onclick=function(){render()};
 r.appendChild(n);if(sel)r.appendChild(sel);if(dt)r.appendChild(dt);if(dir)r.appendChild(dir);if(ms)r.appendChild(ms);if(fe)r.appendChild(fe);if(pi){r.appendChild(pi);r.appendChild(el("span","","% al ahorro"))}r.appendChild(ok);r.appendChild(no);n.focus();
}
function bal(k,d){return L.bal&&L.bal[k]!=null?L.bal[k]:d}
function accVal(i){return bal("a"+i,ACC[i][1])}
function usdVal(i){return bal("u"+i,USD[i][1])}
function ajusteDiario(x,me){if(!x)return;me=me==="e"?"e":"t";if(x<0)L.expenses.push({f:today,m:-x,c:"Otros",x:"Ajuste de saldo",me:me});else L.ing.push({f:today,k:mon(),v:x,adj:1,me:me});save();render()}
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
function pMontos(c){
 var t=c.replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g," ").replace(/a las? \d{1,2}([:.]\d{2})?\s*(hs|h|am|pm)?/g," ").replace(/\d{1,2}:\d{2}/g," ").replace(/\d{1,2}\s*(am|pm)\b/g," ");
 // "5.000" o "5,000" (grupos de 3 cifras) son miles; "1,5" o "1.5" son decimales.
 var re=/(\d{1,3}(?:[.,]\d{3})+(?!\d)|\d+(?:[.,]\d{1,2})?)\s*(mil\b|k\b|lucas?\b|palos?\b|millon(?:es)?\b)?/g,m,a=[];
 while(m=re.exec(t)){var s=m[1],n=parseFloat(/^\d{1,3}([.,]\d{3})+$/.test(s)?s.replace(/[.,]/g,""):s.replace(",","."));var u=m[2]||"";
  if(/^(mil|k|luca)/.test(u))n*=1000;else if(/^(palo|millon)/.test(u))n*=1e6;
  if(n>0)a.push(n)}
 return a}
function pMonto(c){return pMontos(c)[0]||null}
function medDe(c){return/efectivo|\bcash\b|billete|en mano/.test(c)?"efectivo":/transf|mercado ?pago|\bmp\b|tarjeta|debito|banco|billetera|virtual|\bqr\b|\bcvu\b|\bcbu\b|alias/.test(c)?"transferencia":""}
function pMed(v){v=n2(String(v||""));return/efect|cash/.test(v)?"e":/transf|banco|tarj|debit|mercado|virtual|billetera|qr/.test(v)?"t":""}
// Busca en la lista de lo cargado (cands) lo que más se parece al texto: palabras en común, la fecha y el monto.
var TIPO={X:"gasto",I:"ingreso cobre sueldo",M:"cajero saque deposite movimiento",E:"evento",F:"evento",R:"rutina semana semanal"};
// Días de una rutina (0 = domingo) a partir de lo que diga la nota o la IA: un número, una lista, "lunes", "todos los días",
// "de lunes a viernes", "días de semana", "fines de semana", "lunes y miércoles"…
function DNP(d){return DN[d].toLowerCase()+(d===0||d===6?"s":"")}
var DNN=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
function diasDe(v){
 if(Array.isArray(v)){var a=[];v.forEach(function(x){diasDe(x).forEach(function(d){if(a.indexOf(d)<0)a.push(d)})});return a}
 if(typeof v==="number")return v>=0&&v<=6&&v===Math.floor(v)?[v]:v===7?[0]:[];
 var s=n2(String(v==null?"":v)).trim();if(/^\d$/.test(s))return diasDe(+s);
 if(/fin(es)? de semana/.test(s))return[6,0];
 if(/todos los dias|todas las (mananas|tardes|noches)|cada dia|diari|^tod[oa]s?$|^todos los dias$/.test(s))return[1,2,3,4,5,6,0];
 if(/dias? (de semana|habiles)|^semana$|entre semana/.test(s))return[1,2,3,4,5];
 var m=s.match(/(domingo|lunes|martes|miercoles|jueves|viernes|sabado)s? (?:a|al|hasta) (?:el )?(domingo|lunes|martes|miercoles|jueves|viernes|sabado)/);
 if(m){var i=DNN.indexOf(m[1]),j=DNN.indexOf(m[2]),r=[];for(var k=i;;k=(k+1)%7){r.push(k);if(k===j||r.length>7)break}return r}
 var o=[];DNN.forEach(function(n,i){if(new RegExp("\\b"+n+"s?\\b").test(s))o.push(i)});return o}
// Hora "HH:MM" a partir de "15:00", "15", "15hs", "3 pm"…
function hhmm(v){var s=n2(String(v||"")).trim(),m=s.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(hs?|horas?|am|pm)?$/);if(!m)return"";var h=+m[1];if(m[3]==="pm"&&h<12)h+=12;return h<=23&&(+m[2]||0)<=59?pad(h)+":"+(m[2]||"00"):""}
// Próximo día (desde f inclusive) que cae en el día de la semana d (0 = domingo).
function proxDia(f,d){var w=new Date(f+"T00:00").getDay();return plus(f,(d-w+7)%7)}
function elegir(c,mo,f,hd,C){
 var ws=c.replace(/\b(cancel|anul|borr|elimin|sac|quit|suspend|correg|cambi|equivoc)[a-z]*/g," ").split(/[^a-z0-9]+/).filter(function(w){return w.length>=3&&!/^(voy|mas|del|con|que|hay|los|las|una|uno|por|ese|esa|eso|era|fue|dia|hoy|ayer|ver|van|vas|sus|mis|tus|son|sin|asi|muy|ahi|aca|para|sobre|desde|hasta|tengo|esto|esta|este|como|pero|eran|fueron|efectivo|transferencia|realidad|cargue|puse)$/.test(w)}),best=null,bs=0;
 if(C&&C.o)Object.keys(C.o).forEach(function(k){var it=C.o[k],e=it.e,tx=n2(TIPO[it.t]+" "+String(e.x||"")+" "+String(e.c||"")),sc=0,mm=it.t==="I"?e.v:e.m;
  ws.forEach(function(w){if(!/^\d+$/.test(w)&&tx.indexOf(w)>=0)sc+=2});
  if(hd&&(it.t==="R"?rds(e).indexOf(new Date(f+"T00:00").getDay())>=0:(e.f||e.k)===f))sc+=2;
  if(mo&&mm===mo)sc+=3;
  if(sc&&sc>=bs){bs=sc;best=k}});
 return bs>=2?best:null}
var CORR=/(me equivoque|equivocad|correg|en realidad|\bno (era|eran|fue|fueron)\b|\b(era|eran|fue|fueron) (en|de|por|con)\b|cambia|cambie|pasalo|pasala)/;
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
// Categoría de un gasto sin IA: primero las categorías del usuario (las que creó o renombró en Ajustes) si la nota las nombra;
// después las palabras típicas, llevadas a la categoría del usuario que más se parece. Si no hay ninguna, "Otros".
function pCat(c){var K=Object.keys(BUDGET).filter(function(k){return k!=="Otros"}),i,k;
 for(i=0;i<K.length;i++){k=n2(K[i]);if(new RegExp("\\b"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b").test(c))return K[i]}
 for(i=0;i<K.length;i++){k=n2(K[i]).split(/\s+/)[0];if(k.length>=4&&new RegExp("\\b"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).test(c))return K[i]}
 for(i=0;i<CATS.length;i++)if(CATS[i][1].test(c)){var f=CATS[i][0],nf=n2(f);if(BUDGET[f]!=null)return f;
  for(var j=0;j<K.length;j++){k=n2(K[j]);if(k.indexOf(nf.slice(0,5))>=0||nf.indexOf(k.slice(0,5))>=0||CATS[i][1].test(k))return K[j]}}
 return"Otros"}
function limpio(t){return t.replace(/\b\d[\d.,]*\s*k\b/ig,"").replace(/\b(agreg|anot|agend|sum|gast|pagu|compr|me entr)[a-záéíóúñ]*/ig,"").replace(/\b(tengo|que)\b/ig,"").replace(/a las?\s*\d{1,2}([:.]\d{2})?\s*(hs|h|am|pm)?/ig,"").replace(/\d{1,2}:\d{2}/g,"").replace(/\d{1,2}\s*(am|pm)\b/ig,"").replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g,"").replace(/\b(manana|mañana|hoy|ayer|pasado|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|el|la|los|las|en|de|por|un|una|mil|lucas?)\b/ig,"").replace(/\$?\d[\d.,]*/g,"").replace(/\s+/g," ").trim()}
// Pedidos de cambiar ajustes que se entienden sin IA: presupuesto de una categoría, categoría nueva, quitar o renombrar una,
// y el objetivo de ahorro. Devuelve true si la parte de la nota era un ajuste.
var AJRX=/presupuesto|\btope\b|limite|categoria|objetivo|\bmeta\b|porcentaje|separ\w* (el )?\d+\s*%/;
function catDe(c){var K=Object.keys(BUDGET),b=null,bl=0;K.forEach(function(k){var nk=n2(k);if(c.indexOf(nk)>=0&&nk.length>bl){b=k;bl=nk.length}});
 if(!b)K.forEach(function(k){var w=n2(k).split(/\s+/)[0];if(w.length>=4&&c.indexOf(w.slice(0,5))>=0&&!b)b=k});return b}
function lAjuste(raw,c,mo,o){var A=o.ajustes,m,cat;
 if(m=c.match(/(?:renombra\w*|cambia\w* el nombre(?: de)?)\s+(?:la )?(?:categoria )?(.+?)\s+(?:a|por|como)\s+(.+)$/)){cat=catDe(m[1]);if(cat){A.categorias.push({nombre:cat,nuevo_nombre:raw.slice(raw.length-m[2].length).trim()});return true}}
 if(/categoria/.test(c)&&/\b(saca|quita|borra|elimina)\w*/.test(c)){cat=catDe(c.replace(/categoria/g," "));if(cat&&cat!=="Otros"){A.categorias.push({nombre:cat,quitar:true});return true}}
 if(m=c.match(/(?:agrega|crea|suma|sumame|agregame|crear|agregar|nueva)\w*\s+(?:una |la )?(?:nueva )?categoria(?: nueva)?\s+(?:de |llamada |que se llame )?([a-z ]+?)(?:\s+(?:con|de|por|y)\b.*)?$/)){
  var nn=raw.match(new RegExp(m[1].split(" ")[0].slice(0,3),"i"));var nom=m[1].trim(),i0=nn?raw.toLowerCase().indexOf(nn[0].toLowerCase()):-1;
  if(i0>=0)nom=raw.substr(i0,nom.length);A.categorias.push({nombre:nom.charAt(0).toUpperCase()+nom.slice(1),presupuesto:mo||0});return true}
 if(/presupuesto|\btope\b|limite/.test(c)&&mo){cat=catDe(c.replace(/presupuesto|tope|limite/g," "));if(cat){A.categorias.push({nombre:cat,presupuesto:mo});return true}}
 if(/objetivo|\bmeta\b/.test(c)){var ob=A.objetivo||{nombre:"",meta_usd:null,fecha_limite:""};
  if(mo&&/dolar|usd|u\$s|verdes/.test(c))ob.meta_usd=mo;
  if(m=raw.match(/(?:objetivo|meta)\s+(?:es\s+|nuevo\s+|:\s*)?(?:(?:un|una|el|la|ir a|ir al)\s+)?([^\d$]+?)(?:\s+(?:de|por|para|en|hasta)\s+(?:US\$|u\$s|usd|\$|\d).*)?$/i)){var nx=m[1].replace(/\b(de|por|para)\s*$/i,"").trim();if(nx&&!/^(de|en|a)$/i.test(nx))ob.nombre=nx.charAt(0).toUpperCase()+nx.slice(1)}
  if(/(hasta|para (el|antes)|antes del?)\s+(el\s+)?\d{1,2}\/\d{1,2}/.test(c))ob.fecha_limite=pFecha(c);
  if(ob.meta_usd||ob.nombre||ob.fecha_limite){A.objetivo=ob;return true}}
 return false}
function localParse(txt,C){
 var o={gastos:[],eventos:[],ingresos:[],movimientos:[],ahorro_usd:null,cotizacion:null,cancelar:[],cancelar_fecha:[],sin_clases:[],rutinas:[],corregir:[],ajustes:{categorias:[],porcentaje_ahorro:null,objetivo:null}},last="g";
 // Corrección de algo ya cargado ("el gasto de 80 mil eran 8 mil", "el ingreso de ayer fue en efectivo"): se lee la nota entera.
 var cc=n2(txt);
 if(CORR.test(cc)&&!AJRX.test(cc)&&C){var ms=pMontos(cc),cf=pFecha(cc),chd=/\d{1,2}\/\d{1,2}|manana|ayer|lunes|martes|miercoles|jueves|viernes|sabado|domingo|\bel \d{1,2}\b/.test(cc),id=elegir(cc,ms[0],cf,chd,C);
  if(id){var ch={id:id},md=medDe(cc),it=C.o[id];if(ms.length>=2)ch.monto=ms[ms.length-1];else if(ms.length===1&&(it.t==="I"?it.e.v:it.e.m)!==ms[0])ch.monto=ms[0];
   if(md)ch.medio=md;
   if(it.t==="X")Object.keys(BUDGET).forEach(function(k){var nk=n2(k);if(k!==it.e.c&&cc.indexOf(nk)>=0&&n2(String(it.e.x||"")).indexOf(nk)<0)ch.categoria=k});
   if(Object.keys(ch).length>1){o.corregir.push(ch);return o}}}
 txt.split(/[,;\n]|\.(?!\d)|\s+y\s+/).forEach(function(raw){
  raw=raw.trim();if(!raw)return;var c=n2(raw),mo=pMonto(c),f=pFecha(c);
  // Porcentaje para ahorro: "siempre / de cada ingreso" cambia el ajuste; si no, va para el ingreso de la nota.
  var pm=c.match(/(\d+(?:[.,]\d+)?)\s*(%|por ?ciento)/);
  if(pm&&/separ|ahorr|guard|porcentaje/.test(c)){var pp=parseFloat(pm[1].replace(",","."));if(pp>=0&&pp<=100){
   if(/siempre|cada ingreso|de cada|por defecto|todos los ingresos|desde ahora|a partir de/.test(c)||!o.ingresos.length&&!/(me entr|entraron|cobre|me pagaron)/.test(c))o.ajustes.porcentaje_ahorro=pp;
   else o.ingresos[o.ingresos.length-1].porcentaje_ahorro=pp;
   if(!/(me entr|entraron|entro|cobre|me pagaron|me depositaron|me transfirieron)/.test(c))return;c=c.replace(pm[0]," ");mo=pMonto(c)}}
  if(lAjuste(raw,c,mo,o))return;
  var RX=/\b(todos los dias|todas las (?:mananas|tardes|noches)|cada dia|todos los (?:lunes|martes|miercoles|jueves|viernes|sabados?|domingos?)|los (?:lunes|martes|miercoles|jueves|viernes|sabados|domingos)|(?:de |los )?(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)s? (?:a|al|hasta) (?:el )?(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)|(?:los )?dias (?:de semana|habiles)|entre semana|(?:los )?fines? de semana)\b/;
  var mr=c.match(RX),hh=pHora(c.replace(/(\d{1,2})\s*h(?:s|oras?)?\b/g,"a las $1"));
  if(mr&&hh&&diasDe(mr[1]).length){var tt=limpio(raw.split(/\s+/).filter(function(w){var q=n2(w).replace(/[^a-z0-9:]/g,"");return!/^(todos|todas|cada|dias?|semanas?|fines?|habiles|entre|hasta|al?|de|el|los|las?|mananas|tardes|noches|lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|hs|horas?|\d.*)$/.test(q)}).join(" "))||"Rutina";o.rutinas.push({dias:diasDe(mr[1]),hora:hh,titulo:tt.charAt(0).toUpperCase()+tt.slice(1)});return}
  if(/\b(cancel|anul|borr|elimin|sac[aá]|quit[aá]|suspend|no voy|no tengo|no hay|se suspendio|dejo de|deje de|ya no)/.test(c)){
   var hd=/\d{1,2}\/\d{1,2}|manana|ayer|lunes|martes|miercoles|jueves|viernes|sabado|domingo|\bel \d{1,2}\b/.test(c);
   var best=elegir(c,mo,f,hd,C);
   // Rutina: "ya no voy más", "toda la rutina", "todos los…" la termina; si no, se cancela solo ese día (o el próximo).
   if(best&&C.o[best].t==="R"){var rr=C.o[best].e;
    if(/\b(todos los|toda la|todas las|la rutina|nunca mas|ya no|mas\b|deje|dejo|para siempre|definitiv)/.test(c))o.cancelar.push(best);
    else o.cancelar_fecha.push({id:best,fecha:proxDias(hd?f:today,rds(rr))});
    return}
   if(/clase/.test(c)&&!/parcial|examen|turno/.test(c)){o.sin_clases.push(f);return}
   if(best)o.cancelar.push(best);
   return}
  if(/dolar/.test(c)&&/(esta a|cotiza|vale|esta en)/.test(c)&&mo){o.cotizacion=mo;return}
  if(/ahorr|guard/.test(c)&&/usd|dolar|u\$s/.test(c)&&mo){o.ahorro_usd=(o.ahorro_usd||0)+(/retir|saque|saqu|saco|use |gaste/.test(c)?-mo:mo);return}
  if(mo&&!/ahorr|usd|dolar/.test(c)&&(/cajero|extraj/.test(c)||/\b(saque|retire)\b/.test(c)&&/efectivo|banco|cuenta|plata/.test(c))){o.movimientos.push({monto:mo,a:"efectivo",fecha:f});return}
  if(mo&&/\b(deposite|ingrese)\b/.test(c)&&/efectivo|banco|cuenta|billetera/.test(c)&&!/me (depositaron|ingresaron)/.test(c)){o.movimientos.push({monto:mo,a:"transferencia",fecha:f});return}
  var ing=/(me entr|entraron|entro|cobre|ingrese|me pagaron|me depositaron|me transfirieron|gane)/.test(c),gas=/(gaste|gasto|pague|pago|compre|compra|me cobraron|salio|puse|invite)/.test(c),ev=/(tengo|turno|reunion|parcial|examen|vuelo|cita|clase|dentista|llamar|entrega|recuperatorio)/.test(c);
  if(mo&&ing){last="i"}else if(mo&&gas){last="g"}
  if(mo&&(ing||(!gas&&!ev&&last==="i"))){o.ingresos.push({monto:mo,fecha:f,medio:medDe(c),porcentaje_ahorro:pm?parseFloat(pm[1].replace(",",".")):null});return}
  if(mo&&(gas||!ev)){var det=limpio(raw).replace(/\b(con|en)?\s*(efectivo|transferencia|debito|tarjeta|mercado ?pago)\b/ig,"").replace(/\s+/g," ").trim();o.gastos.push({monto:mo,categoria:pCat(c),detalle:det.slice(0,40),fecha:f,medio:medDe(c)});return}
  if(ev||/manana|\d{1,2}\/\d{1,2}|lunes|martes|miercoles|jueves|viernes|sabado|domingo/.test(c)){var t=limpio(raw);var im=/importante|avis/.test(c);t=t.replace(/\b(importante|avis[a-záéíóúñ]*)\b/ig,"").replace(/\s+/g," ").trim();if(t)o.eventos.push({fecha:f,hora:pHora(c),titulo:t.charAt(0).toUpperCase()+t.slice(1),imp:im})}});
 return o}
function vis(e){return L.hidden.indexOf(e.f+"|"+e.x)<0}
// Lo que Petaca puede cancelar o corregir desde una nota: eventos, los últimos gastos, ingresos y pasajes entre efectivo y transferencia.
function descr(it){var e=it.e;
 if(it.t==="X")return"gasto "+e.f+" "+money(e.m)+" "+e.c+(e.x?" "+e.x:"")+" ("+(med(e)==="e"?"efectivo":"transferencia")+")";
 if(it.t==="I")return(e.adj?"ajuste de saldo ":"ingreso ")+(e.f||e.k)+" "+money(e.v)+" ("+(med(e)==="e"?"efectivo":"transferencia")+(e.p?", "+pctTxt(e.p)+" al ahorro":"")+")";
 if(it.t==="M")return"movimiento "+e.f+" "+money(e.m)+(e.a==="e"?" de transferencia a efectivo":" de efectivo a transferencia");
 if(it.t==="R")return"rutina "+diasTxt(rds(e))+" "+e.t+(e.t2?"–"+e.t2:"")+" "+e.x+(e.from>today?" (desde "+e.from+")":"")+(e.to?" (hasta "+e.to+")":"");
 return"evento "+e.f+(e.t?" "+e.t:"")+" "+e.x}
function cands(){var o={},t=[];
 function add(p,e){var k=p+t.length;o[k]={t:p,e:e};t.push(k+": "+descr(o[k]))}
 FECHAS.forEach(function(e){if(vis(e)&&e.f>=today)add("F",e)});
 L.events.filter(function(e){return e.f>=plus(today,-14)}).sort(function(a,b){return(a.f+a.t).localeCompare(b.f+b.t)}).slice(0,80).forEach(function(e){add("E",e)});
 L.expenses.slice(-15).forEach(function(e){add("X",e)});
 L.ing.slice(-8).forEach(function(e){add("I",e)});
 L.mv.slice(-5).forEach(function(e){add("M",e)});
 RUT.forEach(function(e){if(!e.to||e.to>=today)add("R",e)});
 return{o:o,list:t.join(" | ")}}
// Lo que vino de un calendario y se borra queda anotado (L.calno), así el calendario vinculado no lo vuelve a traer.
function drop(a,x){var i=a.indexOf(x);if(i>=0){a.splice(i,1);if(x&&x.cal&&(a===L.events||a===RUT)&&L.calno.indexOf(x.cal)<0)L.calno.push(x.cal)}}
function lineEl(t){var d=el("div","row");d.appendChild(el("span","",t));return d}
function prompt1(txt,C){return "Hoy es "+today+" ("+now.toLocaleDateString("es-AR",{weekday:"long"})+"). Extraé de esta nota en español rioplatense los gastos en pesos, los eventos y, si aparecen, el ingreso de la semana en pesos o un aporte de ahorro en dólares (negativo si retira plata del ahorro). Devolvé SOLO un JSON con esta forma: {\"gastos\":[{\"monto\":number,\"categoria\":\"una de: "+Object.keys(BUDGET).join(", ")+"\",\"detalle\":string,\"fecha\":\"YYYY-MM-DD\",\"medio\":\"efectivo\", \"transferencia\" o \"\" si no lo dice}],\"eventos\":[{\"fecha\":\"YYYY-MM-DD\",\"hora\":\"HH:MM o vacío\",\"titulo\":string,\"imp\":true si pide que le avisen o dice que es importante}],\"ingresos\":[{\"monto\":number,\"fecha\":\"YYYY-MM-DD\",\"medio\":\"efectivo\", \"transferencia\" o \"\"}],\"movimientos\":[{\"monto\":number,\"a\":\"efectivo\" si sacó plata del cajero o del banco, \"transferencia\" si depositó o cargó efectivo en el banco o la billetera virtual,\"fecha\":\"YYYY-MM-DD\"}],\"ahorro_usd\":number o null,\"cotizacion\":number o null}. En cada ingreso agregá \"porcentaje_ahorro\":number SOLO si la nota dice cuánto separar de ese ingreso, si no null. Para los gastos usá SIEMPRE una de las categorías actuales (la más parecida por el detalle); si ninguna encaja, Otros. Ajustes actuales del usuario: presupuesto por mes de cada categoría: "+Object.keys(BUDGET).map(function(k){return k+" "+(BUDGET[k]>0?"$"+BUDGET[k]:"sin presupuesto")}).join(", ")+"; separa el "+AHO+"% de cada ingreso para ahorro; objetivo de ahorro \""+GOAL.x+"\" de US$"+GOAL.target+(metaFin()?" hasta el "+metaFin():" sin plazo")+". Si la nota pide CAMBIAR un ajuste (el presupuesto de una categoría, crear, renombrar o quitar una categoría, el % que separa de cada ingreso o el objetivo de ahorro), devolvé \"ajustes\":{\"categorias\":[{\"nombre\":categoría actual o nueva,\"presupuesto\":number nuevo por mes o null si no cambia,\"nuevo_nombre\":string o \"\",\"quitar\":true solo si la quiere borrar}],\"porcentaje_ahorro\":number o null,\"objetivo\":{\"nombre\":string o \"\",\"meta_usd\":number o null,\"fecha_limite\":\"YYYY-MM-DD\" o \"\"} o null}; si no pide cambiar nada, no lo devuelvas. Tarjeta de débito, Mercado Pago, billetera virtual, QR o banco cuentan como transferencia; billetes o 'en mano' como efectivo. Sacar plata del cajero no es un gasto: va en movimientos. Si un gasto no tiene fecha, usá hoy. 'mil' vale 1000; '5,000' y '5.000' son cinco mil (la coma o el punto separan los miles), '1,5 palos' es 1500000. Si la nota cancela o borra algo, devolvé también \"cancelar\":[ids de la lista de abajo]. Las rutinas (ids que empiezan con R) se repiten todas las semanas: si cancela SOLO un día de una rutina (ej: 'este jueves no hay gym', 'mañana no voy a inglés', 'se suspende el fútbol del sábado'), NO pongas su id en cancelar: devolvé \"cancelar_fecha\":[{\"id\":id de la rutina,\"fecha\":\"YYYY-MM-DD\" del día que no va, que tiene que caer en el día de la semana de esa rutina; si no dice cuál, el próximo}]. Poné el id de una rutina en cancelar solo si la deja del todo (ej: 'ya no voy más al gym', 'dejé inglés', 'borrá la rutina de fútbol'). Si dice que no va a NINGUNA clase o actividad algún día (ej: 'mañana no tengo clases'), devolvé \"sin_clases\":[\"YYYY-MM-DD\"]. Si algo se repite todas las semanas o todos los días, devolvé también \"rutinas\":[{\"dias\":[números de 0 a 6, 0=domingo, 1=lunes… 6=sábado; 'todos los días' = [0,1,2,3,4,5,6], 'de lunes a viernes' = [1,2,3,4,5]],\"hora\":\"HH:MM\" de inicio,\"hasta\":\"HH:MM\" si dice hasta qué hora o \"\",\"titulo\":string}] (no lo pongas también en eventos). Si la nota dice que algo YA cargado está mal (me equivoqué, era, no eran, en realidad, corregí, cambiá, pasalo a), NO lo cargues de nuevo ni lo canceles: devolvé \"corregir\":[{\"id\":id de la lista de abajo, y SOLO los campos que cambian entre \"monto\":number, \"categoria\", \"detalle\", \"fecha\":\"YYYY-MM-DD\", \"medio\":\"efectivo\" o \"transferencia\" (en un movimiento es hacia dónde fue la plata), \"titulo\", \"hora\":\"HH:MM\", \"porcentaje_ahorro\":number de 0 a 100}]. Lista actual (id: lo que está cargado): "+C.list+". Nota: "+txt}
// Gemini vía la Edge Function "gemini" de Supabase: la clave vive como secreto en Supabase y nunca llega al navegador.
// Si tarda más de 35 segundos se deja de esperar y la nota se entiende sin IA, así la página nunca queda trabada.
async function gemini(p){
 var to,r=await Promise.race([SB.functions.invoke("gemini",{body:typeof p==="string"?{prompt:p}:p}),new Promise(function(_,no){to=setTimeout(function(){no(new Error("Gemini: tardó demasiado en responder"))},35000)})]).finally(function(){clearTimeout(to)});
 if(r.error){var m=r.error.message;try{var b=await r.error.context.json();if(b&&b.error)m=b.error}catch(e){}throw new Error("Gemini: "+m)}
 return r.data}
$("nb").onclick=async function(){
 var txt=$("nt").value.trim(),out=$("nr");if(!txt||busy)return;
 out.textContent="Entendiendo tu nota…";
 // Mientras espera, avisa que sigue trabajando para que no parezca colgado.
 var esp=[[6000,"Petaca sigue pensando… ⏳"],[15000,"La IA está lenta hoy. Un ratito más…"],[25000,"Casi… si no responde, lo entiendo sin IA."]].map(function(s){return setTimeout(function(){if(busy)out.textContent=s[1]},s[0])});
 try{
  busy=true;$("nb").disabled=true;
  var C=cands(),ok=/^\d{4}-\d{2}-\d{2}$/,r=null,why="",nota="";
  var gErr="";if(SB&&UID)try{r=await gemini(prompt1(txt,C))}catch(err){gErr=err&&err.message||"error"}
  if(!r)try{var SM=window.claude?await claude.use("sample"):null;if(SM)r=await SM.json(prompt1(txt,C),{cache:false});else why="modo sin IA"}catch(err){why=err&&err.code==="not_granted"?"no diste permiso a la página para usar Claude":(err&&(err.code||err.message))||"error"}
  if(!r||typeof r!=="object"){r=localParse(txt,C);nota="Lo entendí sin IA. Revisá bien antes de guardar."+(gErr?" ("+gErr+")":"")}
  else if(r._ia&&!r._ia.propia&&r._ia.quedan<=5)nota=(r._ia.quedan?"Te quedan "+cant(r._ia.quedan,"nota","notas"):"Ya no te quedan notas")+" hoy con la IA compartida. Cargá tu propia clave gratis en Configuración → IA de Petaca.";
  // Ajustes pedidos en la nota: categorías (presupuesto, nueva, renombrar, quitar), % de ahorro de cada ingreso y objetivo.
  var aj=r.ajustes&&typeof r.ajustes==="object"?r.ajustes:{},AJC=[],AJP=[],AJO=[];
  function catIgual(nm){nm=n2(String(nm||"")).trim();return Object.keys(BUDGET).filter(function(k){return n2(k)===nm})[0]||null}
  (Array.isArray(aj.categorias)?aj.categorias:[]).forEach(function(c){if(!c||!c.nombre)return;var nm=String(c.nombre).trim(),k=catIgual(nm),pr=Number(c.presupuesto),nn=String(c.nuevo_nombre||"").trim();
   if(c.quitar){if(k&&k!=="Otros")AJC.push({tp:"q",k:k});return}
   if(k){var o={tp:"e",k:k,n:nn&&k!=="Otros"?nn:k,b:pr>=0&&c.presupuesto!=null&&c.presupuesto!==""?pr:BUDGET[k]};if(o.n!==k||o.b!==BUDGET[k])AJC.push(o);return}
   if(AJC.some(function(o){return n2(o.n)===n2(nm)}))return;
   AJC.push({tp:"n",k:"",n:nm.charAt(0).toUpperCase()+nm.slice(1),b:pr>0?pr:0})});
  var pa=parseFloat(aj.porcentaje_ahorro);if(aj.porcentaje_ahorro!=null&&aj.porcentaje_ahorro!==""&&pa>=0&&pa<=100&&pa!==AHO)AJP.push({p:pa});
  var ob=aj.objetivo;if(ob&&typeof ob==="object"){var o2={x:String(ob.nombre||"").trim()||GOAL.x,t:Number(ob.meta_usd)>0?Number(ob.meta_usd):GOAL.target,h:ok.test(ob.fecha_limite)?ob.fecha_limite:(GOAL.hasta||"")};if(o2.x!==GOAL.x||o2.t!==GOAL.target||o2.h!==(GOAL.hasta||""))AJO.push(o2)}
  function catOk(c){var k=catIgual(c);if(k)return k;var nv=AJC.filter(function(o){return o.tp==="n"&&n2(o.n)===n2(String(c||""))})[0];return nv?nv.n:"Otros"}
  var G=(r.gastos||[]).filter(function(g){return g&&g.monto>0}).map(function(g){return{f:ok.test(g.fecha)?g.fecha:today,m:Number(g.monto),c:catOk(g.categoria),x:String(g.detalle||""),me:pMed(g.medio)||$("gme").value}});
  var E=(r.eventos||[]).filter(function(e){return e&&ok.test(e.fecha)&&e.titulo}).map(function(e){return{f:e.fecha,t:/^\d{2}:\d{2}$/.test(e.hora||"")?e.hora:"",x:String(e.titulo),imp:!!e.imp||/importante|avis/i.test(e.titulo)}});
  var IN=(r.ingresos||[]).filter(function(g){return g&&g.monto>0}).map(function(g){return{f:ok.test(g.fecha)?g.fecha:today,v:Number(g.monto),p:g.porcentaje_ahorro!=null&&g.porcentaje_ahorro!==""&&+g.porcentaje_ahorro>=0&&+g.porcentaje_ahorro<=100?+g.porcentaje_ahorro:null,me:pMed(g.medio)||$("wme").value}}),A=Number(r.ahorro_usd)||null;
  var MV=(r.movimientos||[]).filter(function(m){return m&&m.monto>0}).map(function(m){return{f:ok.test(m.fecha)?m.fecha:today,m:Number(m.monto),a:pMed(m.a)==="t"?"t":"e"}});
  // Correcciones de lo ya cargado: se arma una copia con los valores nuevos, se muestra antes/después y se aplica recién al guardar.
  var CR=(r.corregir||[]).filter(function(c){return c&&C.o[c.id]&&C.o[c.id].t!=="R"}).map(function(c){var it=C.o[c.id],e=it.e,o={it:it},fn=ok.test(c.fecha)?c.fecha:null,mn=c.monto>0?Number(c.monto):null;
   if(it.t==="X"){o.m=mn||e.m;o.c=BUDGET[c.categoria]?c.categoria:e.c;o.x=c.detalle!=null?String(c.detalle):(e.x||"");o.f=fn||e.f;o.me=pMed(c.medio)||med(e)}
   else if(it.t==="I"){var pp=parseFloat(c.porcentaje_ahorro);o.v=mn||e.v;o.f=fn||e.f||e.k;o.me=pMed(c.medio)||med(e);o.p=e.adj?0:pp>=0&&pp<=100?pp:(e.p||0)}
   else if(it.t==="M"){o.m=mn||e.m;o.a=pMed(c.medio)||e.a;o.f=fn||e.f}
   else{o.x=c.titulo?String(c.titulo):e.x;o.f=fn||e.f;o.t=/^\d{2}:\d{2}$/.test(c.hora||"")?c.hora:(e.t||"")}
   return o});
  function cambios(o){var it=o.it,e=it.e,q=[];
   if(it.t==="X"){if(o.m!==e.m)q.push(money(o.m));if(o.c!==e.c)q.push("en "+o.c);if(o.x!==(e.x||""))q.push(o.x?"\""+o.x+"\"":"sin detalle");if(o.f!==e.f)q.push("el "+fd(o.f));if(o.me!==med(e))q.push(medTxt(o.me))}
   else if(it.t==="I"){if(o.v!==e.v)q.push(money(o.v));if(o.f!==(e.f||e.k))q.push("el "+fd(o.f));if(o.me!==med(e))q.push(medTxt(o.me));if(!e.adj&&o.p!==(e.p||0))q.push(pctTxt(o.p)+" al ahorro")}
   else if(it.t==="M"){if(o.m!==e.m)q.push(money(o.m));if(o.a!==e.a)q.push(o.a==="e"?"de transferencia a efectivo":"de efectivo a transferencia");if(o.f!==e.f)q.push("el "+fd(o.f))}
   else{if(o.x!==e.x)q.push("\""+o.x+"\"");if(o.f!==e.f)q.push("el "+fd(o.f));if(o.t!==(e.t||""))q.push(o.t||"sin hora")}
   return q}
  CR=CR.filter(function(o){return cambios(o).length});
  var CRX=CR.filter(function(o){return o.it.t==="X"}),CRI=CR.filter(function(o){return o.it.t==="I"}),CRM=CR.filter(function(o){return o.it.t==="M"}),CRE=CR.filter(function(o){return o.it.t==="E"||o.it.t==="F"});
  var FX=r.cotizacion>0?Number(r.cotizacion):null;
  var Cn=(r.cancelar||[]).filter(function(k){return C.o[k]}).map(function(k){return C.o[k]});
  // Un solo día de una rutina: la fecha se lleva al día de la semana de la rutina (si la IA se corre, va al próximo que corresponde).
  var CF=(r.cancelar_fecha||[]).filter(function(c){return c&&C.o[c.id]&&C.o[c.id].t==="R"&&Cn.indexOf(C.o[c.id])<0}).map(function(c){var e=C.o[c.id].e;return{r:e,f:proxDias(ok.test(c.fecha)?c.fecha:today,rds(e))}});
  var NS=(r.sin_clases||[]).filter(function(d){return ok.test(d)});
  // Rutinas: una sola con todos los días que diga (la IA a veces manda una lista de días, "todos" o la hora como "15hs").
  var RU=[];(r.rutinas||[]).forEach(function(u){if(!u||!u.titulo)return;var h=hhmm(u.hora),ds=ordDias(diasDe(u.dias!=null?u.dias:u.dia));if(!h||!ds.length)return;
   RU.push({id:"r"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),ds:ds,d:ds[0],t:h,t2:hhmm(u.hasta),x:String(u.titulo),from:today,to:""})});
  out.innerHTML="";if(nota)out.appendChild(el("p","sem",nota));
  if(!G.length&&!E.length&&!IN.length&&!MV.length&&!CR.length&&A==null&&!Cn.length&&!CF.length&&!NS.length&&!RU.length&&FX==null&&!AJC.length&&!AJP.length&&!AJO.length){out.textContent="No encontré gastos, eventos, ingresos, ajustes ni nada para corregir en esa nota. Probá con más detalle.";return}
  // Vista previa editable: cada ítem se puede corregir (✎) o quitar (×) antes de guardar.
  var AA=A!=null?[{m:A}]:[],FF=FX!=null?[{v:FX}]:[],NSo=NS.map(function(d){return{f:d}});
  var CAT=Object.keys(BUDGET).concat(AJC.filter(function(o){return o.tp==="n"}).map(function(o){return o.n})).map(function(c){return[c,c]}),DIA=DN.map(function(n,i){return[i,n]}),DIR=[["e","De transferencia a efectivo"],["t","De efectivo a transferencia"]];
  function ojo(t,m,f,c){var q=dudoso(t,m,f,c);return q?" · ⚠️ "+q:""}
  var K=[
   {a:CRX,t:function(o){return"Corregir "+descr(o.it)+" → "+(cambios(o).join(", ")||"sin cambios")},f:[["m","Monto","number"],["c","Categoría",CAT],["x","Detalle","text"],["me","Medio",MED],["f","Fecha","date"]],vx:1},
   {a:CRI,t:function(o){return"Corregir "+descr(o.it)+" → "+(cambios(o).join(", ")||"sin cambios")},f:[["v","Monto","number"],["me","Medio",MED],["f","Fecha","date"],["p","% para ahorro","number"]]},
   {a:CRM,t:function(o){return"Corregir "+descr(o.it)+" → "+(cambios(o).join(", ")||"sin cambios")},f:[["m","Monto","number"],["a","Hacia",DIR],["f","Fecha","date"]]},
   {a:CRE,t:function(o){return"Corregir "+descr(o.it)+" → "+(cambios(o).join(", ")||"sin cambios")},f:[["x","Qué","text"],["f","Fecha","date"],["t","Hora","time"]]},
   {a:G,t:function(g){return"Gasto: "+money(g.m)+" en "+g.c+(g.x?" ("+g.x+")":"")+" · "+fd(g.f)+" · "+medTxt(g.me)+ojo("g",g.m,g.f,g.c)},f:[["m","Monto","number"],["c","Categoría",CAT],["x","Detalle","text"],["me","Medio",MED],["f","Fecha","date"]],vx:1},
   {a:MV,t:function(m){return(m.a==="e"?"Sacaste efectivo (de transferencia): ":"Depositaste efectivo (a transferencia): ")+money(m.m)+" · "+fd(m.f)},f:[["m","Monto","number"],["a","Hacia",DIR],["f","Fecha","date"]]},
   {a:E,t:function(e){return"Evento: "+e.x+" · "+fd(e.f)+(e.t?" "+e.t:"")+(e.imp&&TG?" · 🔔 te aviso por Telegram":"")},f:[["x","Qué","text"],["f","Fecha","date"],["t","Hora","time"]].concat(TG?[["imp","Avisarme por Telegram","check"]]:[])},
   {a:IN,t:function(i){return"Ingreso: "+money(i.v)+" · "+fd(i.f)+" · "+medTxt(i.me)+(i.p==null?" · ¿cuánto separás para ahorro? Elegilo abajo":i.p?" · separás "+pctTxt(i.p)+" para ahorro ("+money(i.v*i.p/100)+")":" · sin separar ahorro")+ojo("i",i.v,i.f)},f:[["v","Monto","number"],["me","Medio",MED],["p","% para ahorro","number"],["f","Fecha","date"]],
    x:function(i,row){var w=el("div","wpc pctin");[0,5,10,15,20,30].forEach(function(n){var b=el("button","",n+"%"+(n===AHO?" ★":""));b.type="button";if(n===AHO)b.title="Tu % de siempre (Ajustes)";if(i.p===n)b.classList.add("on");b.onclick=function(){i.p=n;draw()};w.appendChild(b)});row.after(w)}},
   {a:AJC,t:function(o){return o.tp==="q"?"Ajuste: quitar la categoría "+o.k+" (sus gastos pasan a Otros)":o.tp==="n"?"Ajuste: categoría nueva "+o.n+(o.b>0?" con presupuesto de "+money(o.b)+" por mes":" sin presupuesto"):"Ajuste: "+(o.n!==o.k?"renombrar "+o.k+" a "+o.n:o.k)+(o.b!==BUDGET[o.k]?(o.n!==o.k?" y ":" · ")+"presupuesto "+(BUDGET[o.k]>0?money(BUDGET[o.k]):"sin presupuesto")+" → "+(o.b>0?money(o.b):"sin presupuesto"):"")},f:[["n","Nombre","text"],["b","Presupuesto por mes ($, 0 = sin presupuesto)","number"]]},
   {a:AJP,t:function(o){return"Ajuste: separar "+pctTxt(o.p)+" de cada ingreso para ahorro (antes "+pctTxt(AHO)+")"},f:[["p","% para ahorro","number"]]},
   {a:AJO,t:function(o){return"Ajuste del objetivo: "+(o.x!==GOAL.x?"\""+GOAL.x+"\" → \""+o.x+"\"":"\""+o.x+"\"")+(o.t!==GOAL.target?" · meta "+usd(GOAL.target)+" → "+usd(o.t):" · meta "+usd(o.t))+(o.h!==(GOAL.hasta||"")?" · "+(o.h?"hasta el "+fLarga(o.h):"sin plazo"):"")},f:[["x","Objetivo","text"],["t","Meta (US$)","number"],["h","Fecha límite (opcional)","date"]]},
   {a:AA,t:function(s){return(s.m<0?"Retiro del ahorro: ":"Aporte al ahorro: ")+usd(Math.abs(s.m))},f:[["m","USD (negativo si retirás)","number"]]},
   {a:FF,t:function(x){return"Cotización del dólar: "+money(x.v)},f:[["v","Pesos por US$","number"]]},
   {a:Cn,t:function(c){return c.t==="R"?"Terminar la "+descr(c)+" · deja de aparecer desde hoy (lo anterior queda)":"Borrar: "+descr(c)}},
   {a:CF,t:function(c){var f=proxDias(c.f,rds(c.r));return"Cancelar solo el "+DN[new Date(f+"T00:00").getDay()].toLowerCase()+" "+fd(f)+": "+c.r.x+" "+c.r.t+" · las demás semanas sigue"},f:[["f","Qué día","date"]]},
   {a:NSo,t:function(d){return"Sin clases el "+fd(d.f)},f:[["f","Fecha","date"]]},
   {a:RU,t:function(u){return"Rutina: "+u.x+" · "+diasTxt(u.ds)+" "+u.t+(u.t2?"–"+u.t2:"")},f:[["ds","Días","dias"],["t","Hora","time"],["x","Qué","text"]]}];
  var head=out.firstChild&&out.firstChild.tagName==="P"?out.firstChild:null;
  function editor(k,o,row){
   var box=el("div","add"),inp={};box.style.margin="6px 0";
   k.f.forEach(function(s){var i;
    if(Array.isArray(s[2])){i=el("select");s[2].forEach(function(p){var op=el("option","",p[1]);op.value=p[0];if(String(o[s[0]])===String(p[0]))op.selected=true;i.appendChild(op)})}
    else if(s[2]==="dias"){i=diasUI(o[s[0]]);box.appendChild(i);inp[s[0]]=i;return}
    else if(s[2]==="check"){var lb=el("label","sem");lb.style.margin="0";i=el("input");i.type="checkbox";i.checked=!!o[s[0]];i.style.flex="none";i.style.minHeight="0";lb.appendChild(i);lb.appendChild(document.createTextNode(" "+s[1]));box.appendChild(lb);inp[s[0]]=i;return}
    else{i=el("input");i.type=s[2];i.value=o[s[0]]==null?"":o[s[0]];i.placeholder=s[1];if(s[2]==="number")i.inputMode="decimal"}
    i.setAttribute("aria-label",s[1]);box.appendChild(i);inp[s[0]]=i});
   var b=el("button","","Listo"),c=el("button","x","Cancelar");
   b.onclick=function(){k.f.forEach(function(s){var i=inp[s[0]],v;
     if(s[2]==="dias"){v=i.val();if(!v.length)return;o.d=v[0]}
     else if(s[2]==="check")v=i.checked;
     else if(s[2]==="number"){v=parseFloat(String(i.value).replace(",","."));if(!isFinite(v)||(v===0&&s[0]!=="p"&&s[0]!=="b")||(v<0&&k.a!==AA)||(s[0]==="p"&&v>100))return}
     else if(s[2]==="date"){v=i.value;if(!ok.test(v)&&!(s[0]==="h"&&!v))return}
     else if(Array.isArray(s[2])){v=s[0]==="d"?+i.value:i.value}
     else{v=String(i.value).trim();if(!v&&s[2]!=="time"&&!k.vx)return}
     o[s[0]]=v});draw()};
   c.onclick=draw;box.appendChild(b);box.appendChild(c);row.replaceWith(box);var f=box.querySelector("input,select");if(f)f.focus()}
  function draw(){
   out.innerHTML="";if(head)out.appendChild(head);var n=0;
   K.forEach(function(k){k.a.forEach(function(o,ix){n++;var row=lineEl(k.t(o)),bt=el("span");
    if(k.f){var e=el("button","x","✎");e.setAttribute("aria-label","Corregir");e.title="Corregir";e.onclick=function(){editor(k,o,row)};bt.appendChild(e)}
    var x=el("button","x","×");x.setAttribute("aria-label","Quitar");x.title="Quitar";x.onclick=function(){k.a.splice(k.a.indexOf(o),1);draw()};bt.appendChild(x);
    row.appendChild(bt);out.appendChild(row);if(k.x)k.x(o,row)})});
   if(!n){out.appendChild(el("p","sem","No queda nada para guardar."));var cl=el("button","x","Cerrar");cl.onclick=function(){out.innerHTML=""};out.appendChild(cl);return}
   var yes=el("button","","Guardar en el panel"),no=el("button","x","Descartar");
   yes.style.marginTop="10px";
   yes.onclick=function(){
    if(IN.some(function(i){return i.p==null})){var w=out.querySelector(".pctin");if(w){w.classList.add("falta");w.scrollIntoView({block:"center",behavior:"smooth"})}toast("Elegí cuánto separás para ahorro de cada ingreso (puede ser 0%).");return}
    aplicarAjustes(AJC,AJP,AJO);
    CRX.forEach(function(o){var e=o.it.e;e.m=o.m;e.c=o.c;e.x=o.x;e.f=o.f;e.me=o.me});
    CRI.forEach(function(o){var e=o.it.e,wk=monOf(o.f),ap=aporteDe(e);e.v=o.v;e.me=o.me;e.f=o.f;if(L.week&&L.week.k===e.k){L.week.v=o.v;L.week.k=wk}e.k=wk;if(ap)ap.f=o.f;if(!e.adj)ligar(e,o.p)});
    CRM.forEach(function(o){var e=o.it.e;e.m=o.m;e.a=o.a;e.f=o.f});
    CRE.forEach(function(o){var e=o.it.e;e.x=o.x;e.f=o.f;e.t=o.t});
    // Terminar una rutina: si ya venía de antes, queda hasta ayer (así no se pierde lo pasado); si todavía no empezó, se borra.
    Cn.forEach(function(c){if(c.t==="R"){var re=c.e;if(re.from&&re.from>=today)drop(RUT,re);else re.to=plus(today,-1)}else if(c.t==="F")L.hidden.push(c.e.f+"|"+c.e.x);else if(c.t==="E")drop(L.events,c.e);else if(c.t==="I"){drop(L.saves,aporteDe(c.e));drop(L.ing,c.e)}else if(c.t==="M")drop(L.mv,c.e);else drop(L.expenses,c.e)});
    CF.forEach(function(c){var k=c.r.id+"|"+proxDias(c.f,rds(c.r));if(L.rskip.indexOf(k)<0)L.rskip.push(k)});
    NSo.forEach(function(d){L.skip.push(d.f)});RU.forEach(function(u){RUT.push(u)});G.forEach(function(g){L.expenses.push(g)});E.forEach(function(e){L.events.push(e)});IN.forEach(function(i){sumarIng(i.f,i.v,i.p,i.me)});MV.forEach(function(m){L.mv.push(m)});
    if(FF.length){L.fx=FF[0].v;L.fxAuto=false}if(AA.length)L.saves.push({f:today,m:AA[0].m});$("nt").value="";out.innerHTML="";save();render();
    var nc=CRX.length+CRI.length+CRM.length+CRE.length+AJC.length+AJP.length+AJO.length;
    toast(nc?"Listo, "+(nc===1?"corregí lo que me dijiste":"corregí "+nc+" cosas")+(n>nc?" y guardé el resto":"")+".":"Guardé lo de tu nota.")};
   no.onclick=function(){out.innerHTML=""};
   out.appendChild(yes);out.appendChild(no)}
  draw();
 }catch(e){out.textContent="No pude procesar la nota: "+(e&&(e.message||e.code)||"error");reportar("No pude procesar la nota: "+(e&&(e.message||e.code)||"error"),e&&e.stack)}
 finally{busy=false;$("nb").disabled=false;esp.forEach(clearTimeout)}
};

// Aplica los ajustes que vinieron de una nota, igual que si se cambiaran en Configuración → Ajustes.
function aplicarAjustes(AJC,AJP,AJO){if(!AJC.length&&!AJP.length&&!AJO.length)return;
 var NB={},ren={},fuera={};Object.keys(BUDGET).forEach(function(k){NB[k]=BUDGET[k]});
 AJC.forEach(function(o){if(o.tp==="q"){delete NB[o.k];fuera[o.k]=1}else if(o.tp==="n"){var k=Object.keys(NB).filter(function(x){return n2(x)===n2(o.n)})[0];NB[k||o.n]=o.b>0?o.b:0}
  else{var v=o.b>0?o.b:0;if(o.n!==o.k&&o.k!=="Otros"){var nb2={};Object.keys(NB).forEach(function(x){nb2[x===o.k?o.n:x]=x===o.k?v:NB[x]});NB=nb2;ren[o.k]=o.n}else NB[o.k]=v}});
 if(NB.Otros==null)NB.Otros=0;
 L.expenses.forEach(function(e){if(ren[e.c])e.c=ren[e.c];else if(fuera[e.c]||NB[e.c]==null)e.c="Otros"});BUDGET=NB;
 AJP.forEach(function(o){AHO=Math.min(Math.max(+o.p||0,0),100)});
 AJO.forEach(function(o){GOAL={x:o.x,target:o.t,saved:GOAL.saved||0,pl:o.h?{u:"f"}:null,hasta:o.h||null}});
 cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var op=document.createElement("option");op.textContent=k;cs.appendChild(op)});
 HAVECFG=true;if($("aj")&&$("aj").open)ajForm()}
function cfgObj(){return{EQUIPO:EQUIPO,ONB:ONB,CAP:CAP,PAT:PAT,CALS:CALS,AHO:AHO,LAYOUT:LAYOUT,TG:TG,TGCHAT:TGCHAT,TGAV:TGAV,ACC:ACC,USD:USD,BUDGET:BUDGET,CLASES:CLASES,RUT:RUT,FIN:FIN,SKIP:SKIP,FECHAS:FECHAS,GOAL:GOAL,HIST:HIST,APPTOT:APPTOT}}
function applyCfg(c){if(!c)return;EQUIPO=eqDe(c.EQUIPO);vestir();ONB=c.ONB===0?0:1;CAP=c.CAP?1:0;PAT=c.PAT?1:0;CALS=c.CALS||[];AHO=c.AHO>=0?c.AHO:10;LAYOUT=c.LAYOUT||null;applyLayout();TGCHAT=c.TGCHAT||"";TG=!!TGCHAT;TGAV=c.TGAV||{d:[7,1],h:"09:00",hs:0};// campanas y avisos solo si la cuenta guardó su chat ID
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
  var ev=vacio(q.L),lv=vacio(L);if(lv&&!ev)adopt(q);else if(ev&&!lv)await push();else if((q.L.t||0)>=(L.t||0))adopt(q);else await push();SYNCED=true;stat("Sincronizado con tu nube · "+VER);
  if(ONB===0)preStart();else capStart();calSync()}
 else{HAVECFG=true;ONB=0;await push();SYNCED=true;stat("Nube inicializada · "+VER);preStart()}
}
async function enter(session){
 UID=session.user.id;var ow=null;try{ow=localStorage.getItem("panel-owner")}catch(e){}if(ow&&ow!==UID)resetLocal();try{localStorage.setItem("panel-owner",UID)}catch(e){}DOC={set:function(){return push()}};loginUI(false,session.user.email);
 loadUser();
 try{await pull()}catch(e){stat("No pude sincronizar: "+(e&&e.message||e))}
 SB.channel("ps-"+UID).on("postgres_changes",{event:"*",schema:"public",table:"panel_state",filter:"user_id=eq."+UID},function(p){var q=p.new&&p.new.data;if(q&&q.L&&(q.L.t||0)>(L.t||0))adopt(q)}).subscribe()}
// La sesión dura una hora y se renueva sola, pero al volver de segundo plano (celular dormido) puede salir un pedido con la vieja
// y Supabase contesta "JWT expired". En ese caso se renueva la sesión y se repite el pedido una vez, sin mostrar el error.
async function sbFetch(url,o){
 var r=await fetch(url,o);
 if(r.status!==401||String(url).indexOf("/auth/v1/")>=0||!SB)return r;
 var t="";try{t=await r.clone().text()}catch(e){}
 if(!/jwt/i.test(t))return r;
 var s=await SB.auth.refreshSession();var tk=s&&s.data&&s.data.session&&s.data.session.access_token;if(!tk)return r;
 var h=new Headers(o&&o.headers);if(h.has("Authorization"))h.set("Authorization","Bearer "+tk);
 return fetch(url,Object.assign({},o,{headers:h}))}
async function startSB(){
 if(!window.supabase||SUPABASE_URL.indexOf("http")!==0){document.body.classList.remove("auth");stat("Falta configurar Supabase: completá la URL y la clave al principio del script. Mientras tanto se guarda solo en este dispositivo · "+VER);return}
 SB=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{global:{fetch:sbFetch}});
 var r=await SB.auth.getSession();
 if(r.data&&r.data.session)await enter(r.data.session);else{loginUI(true);stat("Iniciá sesión para sincronizar · "+VER)}
 SB.auth.onAuthStateChange(function(ev,s){if(ev==="SIGNED_IN"&&s&&!UID)enter(s);if(ev==="PASSWORD_RECOVERY"){$("rec").style.display="";$("login").style.display="none"}if(ev==="SIGNED_OUT"){UID=null;DOC=null;SYNCED=false;if(PRE)preEnd();else capEnd();try{SB.removeAllChannels()}catch(e){}resetLocal();try{localStorage.removeItem("panel-owner")}catch(e){}loginUI(true)}})}
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
// Usuario: guardado se muestra el nombre con "Modificar" en chico; el campo y "Guardar" aparecen solo al elegirlo o cambiarlo.
var UNAME="";
function userUI(edit){var hay=!!UNAME;edit=edit||!hay;$("uver").style.display=edit?"none":"";$("uedit").style.display=edit?"":"none";$("ucan").style.display=edit&&hay?"":"none";$("ushow").textContent=UNAME;if(edit){$("uname").value=UNAME}}
async function loadUser(){try{var r=await SB.from("profiles").select("username").eq("user_id",UID).maybeSingle();UNAME=(r.data&&r.data.username)||"";$("um").textContent="";userUI(false)}catch(e){}}
$("ued").onclick=function(){$("um").textContent="";userUI(true);$("uname").focus()};
$("ucan").onclick=function(){$("um").textContent="";userUI(false)};
$("uname").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();$("us").click()}else if(e.key==="Escape"&&UNAME)$("ucan").click()});
$("us").onclick=async function(){var u=$("uname").value.trim().toLowerCase();if(!/^[a-z0-9_.]{3,20}$/.test(u))return($("um").textContent="3 a 20 caracteres: letras, números, _ o .");var r=await SB.from("profiles").upsert({user_id:UID,username:u});if(r.error)return($("um").textContent=r.error.code==="23505"?"Ese usuario ya existe.":"No pude guardarlo.");var nuevo=!UNAME;UNAME=u;userUI(false);$("um").textContent=nuevo?"Listo: ya podés entrar con "+u+".":"Guardado.";setTimeout(function(){$("um").textContent=""},5000)};
document.addEventListener("visibilitychange",function(){if(document.hidden)return;if(iso(new Date())!==today){location.reload();return}nuevaVersion(true);if(UID)SB.auth.getSession().then(pull).catch(function(){})});
// Actualización: la app instalada en el celular queda abierta en segundo plano y no vuelve a bajar la página.
// Al volver a la app (y cada 30 minutos) se fija si hay una versión nueva publicada; si no estás escribiendo nada, se actualiza sola.
var NVTOT=0;
async function nuevaVersion(volviendo){
 try{if(Date.now()-NVTOT<60000)return;NVTOT=Date.now();
  var h=await (await fetch(location.pathname+"?nv="+Date.now(),{cache:"no-store"})).text(),m=h.match(/app\.js\?v=(\d+)/),v=m?+m[1]:0;
  if(!(v>+VER.slice(1)))return;
  var ocupado=$("nt").value.trim()||$("nr").querySelector("button")||document.querySelector("main input:focus,main textarea:focus")||PRE||busy;
  if(volviendo&&!ocupado){location.reload();return}
  var t=$("toast");if(!t)return;t.innerHTML="";t.appendChild(el("span","","Hay una versión nueva de Petaca."));
  var b=el("button","","Actualizar");b.onclick=function(){location.reload()};t.appendChild(b);
  var x=el("button","x","×");x.setAttribute("aria-label","Cerrar aviso");x.onclick=function(){t.style.display="none"};t.appendChild(x);t.style.display="";clearTimeout(TOT)}catch(e){}}
setInterval(function(){if(!document.hidden)nuevaVersion(false)},30*60*1000);
// Orden personalizado: el usuario arrastra grupos y tarjetas (o usa ↑ ↓); se guarda en su cuenta.
var LAYOUT=null;
function grupos(){return[].slice.call(document.querySelectorAll("main>.grupo"))}
function tarjetas(g){return[].slice.call(g.querySelectorAll(":scope>.cols>section[data-c]"))}
var DEFLAY={g:grupos().map(function(g){return g.dataset.g}),c:{}};grupos().forEach(function(g){DEFLAY.c[g.dataset.g]=tarjetas(g).map(function(s){return s.dataset.c})});
function ordenar(par,nodos,ids,antes){var by={};nodos.forEach(function(n){by[n.dataset.g||n.dataset.c]=n});
 ids.filter(function(i){return by[i]}).concat(nodos.map(function(n){return n.dataset.g||n.dataset.c}).filter(function(i){return ids.indexOf(i)<0})).forEach(function(i){par.insertBefore(by[i],antes||null)})}
function applyLayout(){var Y=LAYOUT||DEFLAY,m=document.querySelector("main"),by={},en={},ya={};
 // Desde la versión 3 el inicio muestra Tu plata y Fechas importantes: las formaciones guardadas antes toman el orden nuevo de grupos.
 ordenar(m,grupos(),(Y.v>=3&&Y.g)||DEFLAY.g,document.querySelector("main>.descanso")||$("est"));
 // Las tarjetas pueden haberse pasado a otro grupo: cada una va al primer grupo que la lista, o al suyo de siempre.
 // En formaciones guardadas antes de la versión 2, la configuración y el histórico vuelven a su lugar nuevo.
 var MUD=Y.v>=2||Y===DEFLAY?[]:["ajustes","ia","copia","hist"];
 function ids(g){return((Y.c||{})[g]||DEFLAY.c[g]||[]).filter(function(i){return MUD.indexOf(i)<0})}
 grupos().forEach(function(g){tarjetas(g).forEach(function(s){by[s.dataset.c]=s})});
 Object.keys(DEFLAY.c).forEach(function(g){DEFLAY.c[g].forEach(function(i){en[i]=g})});
 grupos().forEach(function(g){ids(g.dataset.g).forEach(function(i){if(!ya[i]){ya[i]=1;en[i]=g.dataset.g}})});
 grupos().forEach(function(g){var c=g.querySelector(":scope>.cols");if(!c)return;var mine=Object.keys(by).filter(function(i){return en[i]===g.dataset.g});
  ids(g.dataset.g).filter(function(i){return mine.indexOf(i)>=0}).concat(mine.filter(function(i){return ids(g.dataset.g).indexOf(i)<0})).forEach(function(i){c.appendChild(by[i])})});
 marcarMenus()}
function saveLayout(){marcarMenus();LAYOUT={v:3,g:grupos().map(function(g){return g.dataset.g}),c:{}};grupos().forEach(function(g){LAYOUT.c[g.dataset.g]=tarjetas(g).map(function(s){return s.dataset.c})});HAVECFG=true;save()}
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
  if(!(v!==L.fx||s!==L.fxAt||force))return;L.fx=v;L.fxAt=s;if((UID&&SYNCED)||!SB){save0();PREV=snap()}
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
 // El capital inicial se carga una sola vez: después Petaca sigue con el día a día y las diferencias se corrigen con ✎ en Cuentas.
 if(!capFalta()){var dv=diaVal(),ev=efVal(),ct=el("p","sem");
  ct.appendChild(document.createTextNode("Ya lo cargaste ("+money(accVal(0))+") y se carga una sola vez. Desde ahí Petaca sigue con tu día a día: hoy tenés "+money(dv)+(usaEf()?" (🏦 "+money(dv-ev)+" · 💵 "+money(ev)+")":"")+". Si no coincide con tu banco o tu billetera, corregilo con ✎ en "));
  var ir=el("button","lk","Cuentas");ir.type="button";ir.style.cssText="padding:0;min-height:0;display:inline;vertical-align:baseline;font:inherit;font-weight:700";ir.onclick=function(){var d=document.querySelector('[data-c="cuentas"] details');if(d){mostrar(d);d.open=true;d.scrollIntoView({behavior:"smooth",block:"start"})}};
  ct.appendChild(ir);cp.appendChild(ct);f.appendChild(cp)}
 else{
 ci.id="ajcap";ci.type="number";ci.inputMode="decimal";ci.min="0";ci.placeholder="Sin cargar (en pesos)";ci.setAttribute("aria-label","Capital inicial");ci.value=CAP||accVal(0)>0?accVal(0):"";
 cr.appendChild(ci);cp.appendChild(cr);cp.appendChild(el("p","sem","Es "+capTxt()+". Petaca le suma tus ingresos y le resta tus gastos para saber cuánto te queda."));
 var er=el("div","add ajr"),ei=el("input");ei.id="ajef";ei.type="number";ei.inputMode="decimal";ei.min="0";ei.placeholder="0";ei.setAttribute("aria-label","De eso, en efectivo");ei.style.flex="0 0 140px";ei.value=+(L.bal&&L.bal.ef)||"";
 er.appendChild(el("span","","De eso, en 💵 efectivo:"));er.appendChild(ei);cp.appendChild(er);cp.appendChild(el("p","sem","El resto cuenta como 🏦 transferencia (banco o billetera virtual)."));f.appendChild(cp)}
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
 var cv=$("ajcap")?$("ajcap").value.trim():"",cap=cv===""?null:parseFloat(cv.replace(",","."));if(cap!=null&&!(cap>=0))return(m.textContent="El capital inicial tiene que ser un número (0 o más).");
 var efi=$("ajef"),efv=efi?efi.value.trim():"",ef=efv===""?0:parseFloat(efv.replace(",","."));if(!(ef>=0))return(m.textContent="Lo que tenías en efectivo tiene que ser un número (0 o más).");
 if(cap!=null&&ef>cap)return(m.textContent="Lo que tenías en efectivo no puede ser más que tu capital inicial.");
 var ah=parseFloat(String($("ajaho").value).replace(",","."));if(!(ah>=0&&ah<=100))return(m.textContent="El % para ahorro tiene que ser de 0 a 100.");
 if(!gx)return(m.textContent="Poné un nombre para el objetivo.");if(!(gt>0))return(m.textContent="La meta del objetivo tiene que ser mayor a 0.");if(gp.err)return(m.textContent=gp.err);
 // Categorías: renombrar o quitar actualiza los gastos ya cargados (los de una categoría quitada pasan a "Otros").
 var NB={},ren={};C.forEach(function(c){NB[c.n]=c.v>=0?c.v:0;if(c.o!=null)ren[c.o]=c.n});
 L.expenses.forEach(function(e){e.c=ren[e.c]||(NB[e.c]!=null?e.c:"Otros")});
 if(NB.Otros==null)NB.Otros=0;BUDGET=NB;
 // Cuentas: los saldos se guardan por posición, así que se reacomodan si se quitan o mueven cuentas.
 function remap(R,old,p){var nb={};Object.keys(L.bal).forEach(function(k){if(k.charAt(0)!==p)nb[k]=L.bal[k]});
  var na=R.map(function(r,j){if(r.o!=null&&L.bal[p+r.o]!=null)nb[p+j]=L.bal[p+r.o];return[r.n,r.o!=null?old[r.o][1]:0]});L.bal=nb;return na}
 ACC=remap(A,ACC,"a");USD=remap(U,USD,"u");if(cap!=null){L.bal.a0=cap;CAP=1}if(efi){if(ef)L.bal.ef=ef;else delete L.bal.ef}
 GOAL={x:gx,target:gt,saved:GOAL.saved||0,pl:gp.pl,hasta:gp.hasta};AHO=ah;
 HAVECFG=true;cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});
 save();render();ajForm();$("ajm").textContent="Ajustes guardados."}
$("aj").addEventListener("toggle",function(){if($("aj").open)ajForm()});
$("ajs").onclick=ajSave;$("ajc").onclick=ajForm;
function vacio(x){return!x||!((x.events||[]).length||(x.expenses||[]).length||(x.ing||[]).length||(x.saves||[]).length||(x.mv||[]).length)}
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
$("tgo").onclick=function(){var d=$("tgd");mostrar(d);d.open=true;tgUI();d.scrollIntoView({behavior:"smooth",block:"start"});$("tgc").focus({preventScroll:true})};
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
// Claves de AI Studio: las viejas empiezan con "AIza"; desde mayo de 2026 las nuevas empiezan con "AQ." (llevan puntos).
$("ias").onclick=async function(){var m=$("iam"),k=$("iak").value.replace(/\s+/g,"").replace(/^["'`]+|["'`]+$/g,"");if(!SB||!UID)return(m.textContent="Iniciá sesión primero.");
 if(!/^[A-Za-z0-9._-]{20,200}$/.test(k))return(m.textContent="Esa clave no parece válida. Copiala completa desde AI Studio (empieza con AIza o con AQ.).");
 m.textContent="Guardando…";var r=await SB.from("ia_claves").upsert({user_id:UID,clave:k,updated_at:new Date().toISOString()});if(r.error)return(m.textContent="No pude guardarla: "+r.error.message);
 $("iak").value="";$("iax").style.display="";m.textContent="Probando…";var p=await SB.functions.invoke("gemini",{body:{probar:true}});
 if(p.error){var t=p.error.message;try{var b=await p.error.context.json();if(b&&b.error)t=b.error}catch(e){}return(m.textContent="La guardé, pero no funcionó: "+t)}
 m.textContent="¡Golazo! Tu clave funciona: desde ahora Petaca usa tu propio cupo."};
$("iax").onclick=async function(){var m=$("iam");if(!SB||!UID)return;var r=await SB.from("ia_claves").delete().eq("user_id",UID);
 m.textContent=r.error?"No pude quitarla: "+r.error.message:"Listo, volvés a usar la IA compartida.";if(!r.error)$("iax").style.display="none"};
// Tus calendarios: traer los eventos de Google Calendar, el iPhone (iCloud) u Outlook, con un archivo .ics/.zip (una vez)
// o con el link privado del calendario (Petaca lo vuelve a leer al abrir la app y suma lo nuevo).
// Lo que se repite todas las semanas con horario pasa como rutina; lo demás que se repite (cumpleaños, cada 15 días,
// una vez por mes) se agenda hasta un año adelante. Cada cosa traída guarda su id del calendario (cal) y cómo vino (ch):
// así no se duplica y, si la cambiaste en Petaca, no se pisa. Lo que borrás queda en L.calno para no volver a traerlo.
var CALPLAN=null,CALBUSY=false;
var DIA2={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
function icsTxt(v){return String(v).replace(/\\n/gi," ").replace(/\\([,;\\])/g,"$1").replace(/\s+/g," ").trim()}
// Hora de pared en otra zona horaria → hora de acá. Si la zona no es conocida (Outlook usa nombres de Windows), queda como está.
function enZona(y,mo,d,h,mi,tz){try{var g=Date.UTC(y,mo,d,h,mi),q={};
 new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric"}).formatToParts(new Date(g)).forEach(function(x){q[x.type]=+x.value});
 return new Date(g-(Date.UTC(q.year,q.month-1,q.day,q.hour%24,q.minute)-g))}catch(e){return null}}
function icsFecha(v,p){var m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(String(v).trim());if(!m)return null;
 if(!m[4])return{f:m[1]+"-"+m[2]+"-"+m[3],t:"",ad:true};
 var dt=m[7]?new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5])):p&&p.TZID?enZona(+m[1],+m[2]-1,+m[3],+m[4],+m[5],p.TZID):null;
 return dt?{f:iso(dt),t:pad(dt.getHours())+":"+pad(dt.getMinutes()),ad:false}:{f:m[1]+"-"+m[2]+"-"+m[3],t:m[4]+":"+m[5],ad:false}}
function icsRegla(v){var r={};String(v).split(";").forEach(function(x){var i=x.indexOf("=");if(i>0)r[x.slice(0,i).toUpperCase()]=x.slice(i+1)});var u=r.UNTIL?icsFecha(r.UNTIL,{}):null;
 return{fq:String(r.FREQ||"").toUpperCase(),iv:Math.max(1,parseInt(r.INTERVAL,10)||1),n:parseInt(r.COUNT,10)||0,hasta:u?u.f:"",
  bd:r.BYDAY?r.BYDAY.split(",").map(function(x){var m=/^([+-]?\d+)?(MO|TU|WE|TH|FR|SA|SU)$/i.exec(x.trim());return m?{n:m[1]?+m[1]:0,d:DIA2[m[2].toUpperCase()]}:null}).filter(Boolean):[],
  bmd:r.BYMONTHDAY?r.BYMONTHDAY.split(",").map(Number):[],bm:r.BYMONTH?r.BYMONTH.split(",").map(Number):[]}}
// Lee un .ics: nombre del calendario y sus eventos (sin las alarmas ni las zonas horarias, que vienen anidadas).
function icsLeer(txt){txt=String(txt||"");var ls=txt.replace(/\r\n?/g,"\n").replace(/\n[ \t]/g,"").split("\n"),evs=[],cur=null,dep=0,nom="";
 ls.forEach(function(l){var m=/^([A-Za-z0-9-]+)((?:;[^:]*)?):(.*)$/.exec(l);if(!m)return;var k=m[1].toUpperCase(),v=m[3],p={};
  if(k==="BEGIN"){if(cur)dep++;else if(v.trim().toUpperCase()==="VEVENT"){cur={ex:[]};dep=0}return}
  if(k==="END"){if(cur){if(dep)dep--;else{evs.push(cur);cur=null}}return}
  if(!cur){if(k==="X-WR-CALNAME"&&!nom)nom=icsTxt(v);return}
  if(dep)return;
  m[2].split(";").slice(1).forEach(function(x){var i=x.indexOf("=");if(i>0)p[x.slice(0,i).toUpperCase()]=x.slice(i+1).replace(/^"|"$/g,"")});
  if(k==="UID")cur.uid=v.trim();else if(k==="SUMMARY")cur.x=icsTxt(v);else if(k==="STATUS")cur.st=v.trim().toUpperCase();
  else if(k==="DTSTART")cur.s=icsFecha(v,p);else if(k==="DTEND")cur.e=icsFecha(v,p);else if(k==="RRULE")cur.rr=icsRegla(v);
  else if(k==="EXDATE")v.split(",").forEach(function(x){var d=icsFecha(x,p);if(d)cur.ex.push(d.f)});
  else if(k==="RECURRENCE-ID")cur.rid=icsFecha(v,p)});
 return{ok:/BEGIN:VCALENDAR/i.test(txt),n:nom,evs:evs}}
function difDias(a,b){return Math.round((new Date(b+"T00:00")-new Date(a+"T00:00"))/864e5)}
// n-ésimo día de la semana del mes: 1 = el primero, -1 = el último, 0 = todos.
function enMes(d,n){if(!n)return true;var k=d.getDate();if(n>0)return Math.ceil(k/7)===n;return Math.ceil((new Date(d.getFullYear(),d.getMonth()+1,0).getDate()-k+1)/7)===-n}
// Fechas (desde..hasta) en que cae un evento que se repite, como mucho "tope". Respeta INTERVAL, BYDAY, BYMONTHDAY, BYMONTH, COUNT, UNTIL y EXDATE.
function icsFechas(e,desde,hasta,tope){var r=e.rr,s=e.s.f,d0=new Date(s+"T00:00"),fin=r.hasta&&r.hasta<hasta?r.hasta:hasta,out=[],n=0,l0=monOf(s);
 for(var f=s,i=0;f<=fin&&i<40000;f=plus(f,1),i++){var d=new Date(f+"T00:00"),dw=d.getDay(),ok;
  if(r.fq==="DAILY")ok=difDias(s,f)%r.iv===0&&(!r.bd.length||r.bd.some(function(b){return b.d===dw}));
  else if(r.fq==="WEEKLY")ok=(r.bd.length?r.bd.some(function(b){return b.d===dw}):dw===d0.getDay())&&Math.round(difDias(l0,monOf(f))/7)%r.iv===0;
  else if(r.fq==="MONTHLY"||r.fq==="YEARLY"){
   ok=r.fq==="MONTHLY"?((d.getFullYear()-d0.getFullYear())*12+d.getMonth()-d0.getMonth())%r.iv===0
    :(d.getFullYear()-d0.getFullYear())%r.iv===0&&(r.bm.length?r.bm.indexOf(d.getMonth()+1)>=0:d.getMonth()===d0.getMonth());
   if(ok)ok=r.bmd.length?r.bmd.some(function(x){return x>0?d.getDate()===x:d.getDate()===new Date(d.getFullYear(),d.getMonth()+1,0).getDate()+x+1})
    :r.bd.length?r.bd.some(function(b){return b.d===dw&&enMes(d,b.n)}):d.getDate()===d0.getDate()}
  else ok=f===s;
  if(!ok)continue;if(r.n&&++n>r.n)break;
  if(f>=desde&&e.ex.indexOf(f)<0){out.push(f);if(out.length>=tope)break}}
 return out}
function calCh(o){return o.ds?[o.ds.join(","),o.t,o.t2||"",o.x,o.from||"",o.to||""].join("|"):[o.f,o.t||"",o.x].join("|")}
// Qué cambiaría en Petaca con este calendario: nuevos, cambios (de lo que no tocaste) y, si está vinculado, lo que ya no está.
function calPlan(cal,cid){var fin=plus(today,365),its=[],seen={},P={nuevos:[],cambios:[],quitar:[],mios:[],ya:0,cid:cid};
 var base={};cal.evs.forEach(function(e){if(e.uid&&!e.rid&&e.rr)base[e.uid]=e});
 cal.evs.forEach(function(e){if(e.rid&&base[e.uid])base[e.uid].ex.push(e.rid.f)});
 cal.evs.forEach(function(e){if(!e.uid||!e.s||e.st==="CANCELLED")return;var x=e.x||"(sin título)",k=e.uid+(e.rid?"@"+e.rid.f:"");
  if(!e.rr){if(e.s.f<today)return;var u=e.e&&e.s.ad?plus(e.e.f,-1):"";its.push({k:k,o:{f:e.s.f,t:e.s.t,x:x+(u>e.s.f?" (hasta "+fd(u)+")":"")}});return}
  var r=e.rr,sem=!e.s.ad&&r.iv===1&&(r.fq==="WEEKLY"||r.fq==="DAILY")&&!r.bd.some(function(b){return b.n});
  if(sem){var to=r.hasta||(r.n?icsFechas(e,e.s.f,plus(e.s.f,3650),r.n).pop()||"":"");if(to&&to<today)return;
   var ds=r.bd.length?r.bd.map(function(b){return b.d}):r.fq==="DAILY"?[1,2,3,4,5,6,0]:[new Date(e.s.f+"T00:00").getDay()];
   its.push({k:k,R:1,ex:e.ex.filter(function(f){return f>=today}),o:{ds:ordDias(ds),t:e.s.t,t2:e.e&&!e.e.ad&&e.e.f===e.s.f&&e.e.t!==e.s.t?e.e.t:"",x:x,from:e.s.f,to:to}});return}
  icsFechas(e,today,fin,60).forEach(function(f){its.push({k:k+"@"+f,o:{f:f,t:e.s.t,x:x}})})});
 var hay={};L.events.concat(RUT).forEach(function(o){if(o.cal)hay[o.cal]=o});
 its.forEach(function(it){if(seen[it.k])return;seen[it.k]=1;if(L.calno.indexOf(it.k)>=0)return;var o=hay[it.k];
  if(!o)P.nuevos.push(it);else if(calCh(o)===o.ch&&calCh(it.o)!==o.ch)P.cambios.push([o,it]);else{P.ya++;if(cid!=="f")P.mios.push(o)}});
 if(cid!=="f")L.events.concat(RUT).forEach(function(o){if(o.cid===cid&&!seen[o.cal]&&calCh(o)===o.ch&&(o.ds?!o.to||o.to>=today:o.f>=today))P.quitar.push(o)});
 return P}
function calAplicar(P,cid){
 P.nuevos.forEach(function(it){var o=it.o;o.cal=it.k;o.cid=cid;o.ch=calCh(o);
  if(it.R){o.id="r"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);o.d=o.ds[0];RUT.push(o);it.ex.forEach(function(f){L.rskip.push(o.id+"|"+f)})}
  else{o.imp=false;L.events.push(o)}});
 P.cambios.forEach(function(c){var o=c[0];Object.keys(c[1].o).forEach(function(k){o[k]=c[1].o[k]});if(o.ds)o.d=o.ds[0];o.ch=calCh(o);o.cid=cid});
 P.quitar.forEach(function(o){var a=o.ds?RUT:L.events,i=a.indexOf(o);if(i>=0)a.splice(i,1)});
 P.mios.forEach(function(o){o.cid=cid})}
function calCuenta(P){var e=P.nuevos.filter(function(i){return!i.R}).length,r=P.nuevos.length-e;
 return[e?cant(e,"evento","eventos"):"",r?cant(r,"rutina","rutinas"):"",P.cambios.length?cant(P.cambios.length,"cambio","cambios"):"",P.quitar.length?cant(P.quitar.length,"borrado","borrados"):""].filter(Boolean).join(", ")}
function calNombre(cal,u){if(cal.n)return cal.n;var h="";try{h=new URL(u).hostname}catch(e){}
 return/google/.test(h)?"Google Calendar":/icloud|apple/.test(h)?"Calendario del iPhone":/outlook|office|live/.test(h)?"Outlook":h||"tu calendario"}
// Muestra lo que encontró y espera que confirmes antes de tocar tu agenda.
function calVista(P,nom,ok){var w=$("calp"),m=$("calm");w.innerHTML="";m.textContent="";CALPLAN=null;
 if(!P.nuevos.length&&!P.cambios.length){m.textContent="En "+nom+" no encontré nada nuevo desde hoy"+(P.ya?" ("+cant(P.ya,"cosa ya estaba","cosas ya estaban")+" en Petaca).":".");if(ok){calAplicar(P,P.cid);ok()}return}
 CALPLAN=P;var c=el("div","calprev");c.appendChild(el("p","","En "+nom+" encontré "+calCuenta(P)+(P.ya?" ("+cant(P.ya,"cosa ya estaba","cosas ya estaban")+" en Petaca)":"")+":"));
 var L2=P.nuevos.slice().sort(function(a,b){return((a.o.f||a.o.from)+a.o.t).localeCompare((b.o.f||b.o.from)+b.o.t)});
 L2.slice(0,8).forEach(function(it){var o=it.o,r=el("div","row");r.appendChild(el("span","",o.ds?"🔁 "+o.x:o.x));r.appendChild(el("span","",o.ds?diasTxt(o.ds)+" "+o.t:fd(o.f)+(o.t?" "+o.t:"")));c.appendChild(r)});
 if(L2.length>8)c.appendChild(el("p","sem","y "+(L2.length-8)+" más."));
 c.appendChild(el("p","sem","Lo que se repite todas las semanas queda como rutina (🔁); lo demás se agenda hasta un año adelante. Después lo podés editar o borrar como cualquier otra cosa."));
 var b=el("div","add"),si=el("button","","Agregar a mi agenda"),no=el("button","x","Cancelar");
 si.onclick=function(){if(CALPLAN!==P)return;calAplicar(P,P.cid);CALPLAN=null;if(ok)ok();HAVECFG=true;save();render();calUI();w.innerHTML="";
  toast("Listo: agregué "+calCuenta(P)+" de "+nom+".")};
 no.onclick=function(){CALPLAN=null;w.innerHTML="";m.textContent=""};b.appendChild(si);b.appendChild(no);c.appendChild(b);w.appendChild(c);c.scrollIntoView({block:"nearest",behavior:"smooth"})}
async function calBajar(u){var r=await SB.functions.invoke("calendario",{body:{url:u}});
 if(r.error){var t=r.error.message;try{var b=await r.error.context.json();if(b&&b.error)t=b.error}catch(e){}throw new Error(t)}
 var cal=icsLeer(r.data&&r.data.ics);if(!cal.ok)throw new Error("Ese link no es de un calendario.");return cal}
// Lee los .ics de un .zip (Google Calendar exporta así) sin librerías: el navegador descomprime con DecompressionStream.
async function zipIcs(buf){var b=new Uint8Array(buf),v=new DataView(buf),out=[],e=-1,td=new TextDecoder();
 for(var i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){e=i;break}
 if(e<0)throw new Error("zip");
 for(var k=0,n=v.getUint16(e+10,true),p=v.getUint32(e+16,true);k<n&&v.getUint32(p,true)===0x02014b50;k++){
  var met=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),ln=v.getUint16(p+28,true),off=v.getUint32(p+42,true),nom=td.decode(b.subarray(p+46,p+46+ln));
  p+=46+ln+v.getUint16(p+30,true)+v.getUint16(p+32,true);if(!/\.ics$/i.test(nom))continue;
  var ini=off+30+v.getUint16(off+26,true)+v.getUint16(off+28,true),dat=b.subarray(ini,ini+cs);
  if(met===0)out.push(td.decode(dat));else if(met===8)out.push(await new Response(new Blob([dat]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text())}
 return out}
function calHora(t){var d=new Date(t);return iso(d)===today?"hoy "+pad(d.getHours())+":"+pad(d.getMinutes()):"el "+fd(iso(d))}
function calUI(){var l=$("call");if(!l)return;l.innerHTML="";var th=$("calh");if(th)th.style.display=CALS.length||!UID||L.events.some(function(e){return e.cal})?"none":"";
 CALS.forEach(function(c){var r=el("div","row"),s=el("span","",c.n||"Calendario");s.appendChild(el("small","",c.err?" · ⚠️ "+c.err:c.t?" · leído "+calHora(c.t):""));
  var rt=el("span"),a=el("button","x","↻"),x=el("button","x des","Desvincular");a.title="Leer ahora";a.setAttribute("aria-label","Leer ahora "+(c.n||"el calendario"));
  a.onclick=function(){calSync(c)};x.onclick=function(){drop(CALS,c);HAVECFG=true;save();calUI();toast("Dejé de leer "+(c.n||"el calendario")+". Lo que ya trajiste queda en tu agenda.")};
  rt.appendChild(a);rt.appendChild(x);r.appendChild(s);r.appendChild(rt);l.appendChild(r)})}
// Calendarios vinculados: al abrir la app (y al volver a ella) se releen si pasaron más de 3 horas; con ↻, en el momento.
async function calSync(uno){if(CALBUSY||!SB||!UID||!SYNCED||PRE||!CALS.length)return;CALBUSY=true;var hubo=[],cambio=false;
 try{for(var i=0;i<CALS.length;i++){var c=CALS[i];if(uno?c!==uno:Date.now()-(c.t||0)<3*3600e3)continue;
   try{var cal=await calBajar(c.u),P=calPlan(cal,c.id);c.n=calNombre(cal,c.u);c.err="";
    if(P.nuevos.length||P.cambios.length||P.quitar.length){calAplicar(P,c.id);cambio=true;hubo.push(c.n+": "+calCuenta(P))}}
   catch(e){c.err=String(e&&e.message||e).slice(0,140)}
   c.t=Date.now()}}
 finally{CALBUSY=false}
 HAVECFG=true;if(cambio){save();render();toast("Actualicé tus calendarios. "+hubo.join(" · ")+".")}else{save0();PREV=snap()}
 calUI();if(uno&&!cambio)toast(uno.err?"No pude leer "+(uno.n||"el calendario")+": "+uno.err:"Ya estaba todo al día con "+(uno.n||"el calendario")+".")}
$("calb").onclick=async function(){var m=$("calm"),u=$("calu").value.trim().replace(/^webcals?:\/\//i,"https://");$("calp").innerHTML="";
 if(!SB||!UID)return(m.textContent="Iniciá sesión primero.");
 if(!/^https:\/\/\S+$/i.test(u))return(m.textContent="Pegá el link completo del calendario: empieza con https:// o webcal://");
 if(CALS.some(function(x){return x.u===u}))return(m.textContent="Ese calendario ya está vinculado. Tocá ↻ para leerlo ahora.");
 m.textContent="Leyendo tu calendario…";$("calb").disabled=true;
 try{var cal=await calBajar(u),id="c"+Date.now().toString(36),nom=calNombre(cal,u),P=calPlan(cal,id);
  calVista(P,nom,function(){if(!CALS.some(function(x){return x.u===u}))CALS.push({id:id,u:u,n:nom,t:Date.now(),err:""});$("calu").value="";HAVECFG=true;save();calUI();
   if(!P.nuevos.length&&!P.cambios.length)toast("Vinculé "+nom+": cuando agregues algo ahí, lo sumo solo.")})}
 catch(e){m.textContent="No pude leer el calendario: "+(e&&e.message||e)}
 finally{$("calb").disabled=false}};
$("calf").onchange=async function(){var inp=this,fs=[].slice.call(inp.files||[]),m=$("calm"),evs=[],nom="";$("calp").innerHTML="";if(!fs.length)return;
 m.textContent="Leyendo el archivo…";
 try{for(var i=0;i<fs.length;i++){var f=fs[i],ts=/\.zip$/i.test(f.name)||f.type==="application/zip"?await zipIcs(await f.arrayBuffer()):[await f.text()];
   ts.forEach(function(t){var c=icsLeer(t);if(!c.ok)return;evs=evs.concat(c.evs);if(!nom)nom=c.n})}
  if(!evs.length&&!nom)return(m.textContent="Ese archivo no tiene un calendario (.ics) adentro.");
  calVista(calPlan({evs:evs},"f"),nom||fs[0].name.replace(/\.(ics|zip)$/i,""),null)}
 catch(e){m.textContent=String(e&&e.message)==="zip"?"No pude abrir el .zip. Descomprimilo y subí el archivo .ics que tiene adentro.":"No pude leer el archivo: "+(e&&e.message||e)}
 finally{inp.value=""}};
// 📋 Pegar: en el celu, mantener apretado el campo para pegar es incómodo. Pega lo copiado y, si es un link, vincula.
(function(){var b=$("calpg");if(!b||!(navigator.clipboard&&navigator.clipboard.readText))return;b.hidden=false;
 b.onclick=async function(){var m=$("calm");try{var t=String(await navigator.clipboard.readText()||"").trim();if(!t)return(m.textContent="No hay nada copiado.");$("calu").value=t;
  if(/^(https|webcals?):\/\//i.test(t))$("calb").click();else m.textContent="Lo que copiaste no parece el link del calendario: tiene que empezar con https:// o webcal://"}
 catch(e){$("calu").focus();m.textContent="No pude leer lo copiado: mantené apretado el campo y elegí Pegar."}}})();
$("calir").onclick=function(){var d=$("cald");mostrar(d);d.open=true;d.scrollIntoView({behavior:"smooth",block:"start"})};
// Pretemporada: la primera vez que alguien entra, 3 pasos para armar sus categorías, sus saldos y su objetivo.
var PRE=null;
var PRECAT=["Supermercado","Comida y delivery","Transporte","Salidas","Juntadas","Facultad","Salud","Ropa","Suscripciones","Deporte","Regalos","Viajes"],PREON=["Supermercado","Comida y delivery","Transporte","Salidas","Juntadas"];
function preNum(v){var n=parseFloat(String(v).replace(",","."));return n>0?n:0}
function preStart(){if(PRE)return;PRE={paso:0,cat:PRECAT.map(function(n){return{n:n,on:PREON.indexOf(n)>=0,v:""}}),pesos:"",ef:"",ah:"",am:"u",iv:"",im:"p",ing:"",aho:String(AHO),gx:"",gt:"",gu:"m",gn:"",eq:EQUIPO};
 document.body.classList.add("pre-open");$("pre").style.display="";prePaint()}
function preEnd(){$("pre").style.display="none";$("pre").innerHTML="";document.body.classList.remove("pre-open");PRE=null}
function preCampo(P,k,txt,ph,num){var lb=el("label","",txt),i=el("input");if(num){i.type="number";i.inputMode="decimal";i.min="0"}i.placeholder=ph;i.value=P[k];i.oninput=function(){P[k]=i.value};lb.appendChild(i);return lb}
function prePaint(){var P=PRE,w=$("pre");w.innerHTML="";var c=el("div","pc");w.appendChild(c);
 var h=el("div","prh"),im=el("img");im.src=pose("gateando",P.eq);im.alt="";h.appendChild(im);var ht=el("div");ht.appendChild(el("small","prk","Pretemporada · paso "+(P.paso+1)+" de 3"));
 var t=el("h2","",["Armá tu plantel de gastos","¿Con cuánto arrancás?","Tu objetivo de ahorro"][P.paso]);t.id="pret";ht.appendChild(t);h.appendChild(ht);c.appendChild(h);
 var ps=el("div","pasos");for(var i=0;i<3;i++)ps.appendChild(el("i",i<=P.paso?"on":""));c.appendChild(ps);
 var msg=el("p","sem prm");
 if(P.paso===0){
  var eqw=el("div","preq");eqw.appendChild(el("p","sem","¿De qué cuadro sos? Petaca se pone tu camiseta."));var eqb=el("div","eqbs");
  Object.keys(EQS).forEach(function(k){var b=el("button","eqb"+(P.eq===k?" on":""));b.type="button";b.setAttribute("aria-pressed",String(P.eq===k));var i=el("img");i.src=EQS[k].img;i.alt="";b.appendChild(i);b.appendChild(el("span","",k?EQS[k].n:"Ninguno"));
   b.onclick=function(){P.eq=k;prePaint()};eqb.appendChild(b)});eqw.appendChild(eqb);c.appendChild(eqw);
  c.appendChild(el("p","sem","¡Te damos la bienvenida al club! Elegí en qué gastás y, si querés, ponele un presupuesto por mes a cada categoría: Petaca te avisa cuando te estés por pasar. \"Otros\" va siempre."));
  P.cat.forEach(function(k){var r=el("div","prc"),lb=el("label"),cb=el("input"),nv=el("input");cb.type="checkbox";cb.checked=k.on;
   nv.type="number";nv.inputMode="decimal";nv.min="0";nv.placeholder="$ / mes";nv.value=k.v;nv.disabled=!k.on;nv.setAttribute("aria-label","Presupuesto por mes de "+k.n);nv.oninput=function(){k.v=nv.value};
   cb.onchange=function(){k.on=cb.checked;nv.disabled=!cb.checked};lb.appendChild(cb);lb.appendChild(document.createTextNode(k.n));r.appendChild(lb);r.appendChild(nv);c.appendChild(r)});
  var ad=el("div","add"),ai=el("input"),ab=el("button","lk","+ Agregar");ai.placeholder="Otra categoría (ej: Mascota)";ai.setAttribute("aria-label","Otra categoría");
  ab.onclick=function(){var n=ai.value.trim();if(!n)return;if(n.toLowerCase()==="otros"||P.cat.some(function(k){return k.n.toLowerCase()===n.toLowerCase()}))return(msg.textContent="Esa categoría ya está.");P.cat.push({n:n,on:true,v:""});prePaint()};
  ad.appendChild(ai);ad.appendChild(ab);c.appendChild(ad)}
 else if(P.paso===1){
  c.appendChild(el("p","sem","Se carga una sola vez: después Petaca sigue con tu día a día. Si no sabés el número exacto poné uno aproximado: después lo corregís con ✎ en Cuentas."));
  var f=el("div","prf");f.appendChild(preCampo(P,"pesos","Tu capital inicial: la plata que tenés hoy para el día a día (en pesos)","Ej: 150,000",1));f.appendChild(preCampo(P,"ef","De eso, ¿cuánto tenés en efectivo? (el resto cuenta como transferencia)","Ej: 20,000",1));
  f.appendChild(montoMon(P,"ah","am","¿Cuánto tenés ahorrado? (opcional)","Ej: 300"));f.appendChild(montoMon(P,"iv","im","¿Y cuánto tenés invertido? Plazo fijo, FCI, acciones, cripto… (opcional)","Ej: 200,000"));
  f.appendChild(preCampo(P,"ing","¿Cobraste algo esta semana? (opcional, en pesos)","Ej: 400,000",1));c.appendChild(f)}
 else{
  c.appendChild(el("p","sem","¿Para qué estás ahorrando? Un viaje, la compu nueva, la entrada para la final… Si todavía no tenés uno, salteá este paso."));
  var f2=el("div","prf"),l3=el("label","","Para cuándo"),rw=el("div","add"),gn=el("input"),gu=el("select");
  f2.appendChild(preCampo(P,"aho","¿Qué % de cada ingreso querés separar para ahorrar? (lo podés cambiar en cada uno)","Ej: 10",1));f2.appendChild(preCampo(P,"gx","Nombre del objetivo","Ej: Viaje al Mundial"));f2.appendChild(preCampo(P,"gt","Cuánto necesitás (US$)","Ej: 2,000",1));
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
 if(P.paso===1&&preNum(P.ef)>preNum(P.pesos))return"Lo que tenés en efectivo no puede ser más que tu capital inicial.";
 if(P.paso===2&&String(P.aho).trim()!==""&&!(parseFloat(String(P.aho).replace(",","."))>=0&&parseFloat(String(P.aho).replace(",","."))<=100))return"El % para ahorro tiene que ser de 0 a 100.";
 if(P.paso===2&&(P.gx.trim()||P.gt)){if(!P.gx.trim())return"Ponele un nombre al objetivo.";if(!preNum(P.gt))return"Poné cuánto necesitás, en dólares.";
  if(P.gu&&!(parseInt(P.gn,10)>0))return"Poné en cuántas "+{s:"semanas",m:"meses",a:"años"}[P.gu]+" querés llegar."}
 return""}
// Aplica la pretemporada. "Saltear todo" deja las categorías de ejemplo pero sin presupuesto, para que los consejos no inventen.
function preFin(todo){var P=PRE,NB={};
 if(todo)Object.keys(BUDGET).forEach(function(k){NB[k]=0});else P.cat.forEach(function(k){if(k.on)NB[k.n]=preNum(k.v)});
 delete NB.Otros;NB.Otros=0;L.expenses.forEach(function(e){if(NB[e.c]==null)e.c="Otros"});BUDGET=NB;
 cs.innerHTML="";Object.keys(BUDGET).forEach(function(k){var o=document.createElement("option");o.textContent=k;cs.appendChild(o)});
 if(!todo){ACC=[["Día a día",preNum(P.pesos)]];CAP=1;USD=[["Ahorro en dólares",0]];Object.keys(L.bal).forEach(function(k){if(/^[au]\d+$/.test(k))delete L.bal[k]});if(preNum(P.ef))L.bal.ef=preNum(P.ef);else delete L.bal.ef;
  patSet(preNum(P.ah),P.am,preNum(P.iv),P.im);
  AHO=Math.min(preNum(P.aho),100);var iv=preNum(P.ing);if(iv)sumarIng(today,iv,AHO);
  if(P.gx.trim()&&preNum(P.gt)){var n=parseInt(P.gn,10);GOAL={x:P.gx.trim(),target:preNum(P.gt),saved:0,pl:P.gu?{u:P.gu,n:n}:null,hasta:P.gu?sumaPlazo(today,n,P.gu):null}}}
 EQUIPO=eqDe(P.eq);ONB=1;HAVECFG=true;preEnd();vestir();save();render();
 stat(todo?"Listo. Cuando quieras, armá tus categorías en Configuración → Ajustes.":"¡Listo, tu equipo está armado! Lo podés cambiar cuando quieras en Configuración → Ajustes.")}
// Capital inicial: la plata que había en el día a día antes del primer movimiento cargado. Es la base de "te queda" y de los consejos.
// A quien no lo cargó (cuentas viejas o que saltearon la pretemporada) se lo pedimos al entrar. Si ya corrigió el saldo con ajustes, no hace falta.
function hayAjustes(){return L.ing.some(function(e){return e.adj})||L.expenses.some(function(e){return e.x==="Ajuste de saldo"})}
function capFalta(){return!CAP&&!(accVal(0)>0)&&!hayAjustes()}
function primerMov(){var f="";L.expenses.concat(L.ing).forEach(function(e){var d=e.f||e.k;if(d&&(!f||d<f))f=d});return f}
function capTxt(){var f=primerMov();return f&&f<today?"la plata que tenías en "+ACC[0][0]+" el "+fd(f)+", antes del primer movimiento que cargaste":"la plata que tenés hoy en "+ACC[0][0]}
// Ahorro e inversiones: se preguntan una sola vez, en la pretemporada o al entrar (junto con el capital, si también falta).
// El ahorro en dólares es la primera cuenta en dólares; el ahorro en pesos y las inversiones van a su propia cuenta, que se crea si hace falta.
function cuentaIdx(Lc,n){for(var i=0;i<Lc.length;i++)if(n2(Lc[i][0])===n2(n))return i;return-1}
function patHoy(){var ip=cuentaIdx(ACC,"Inversiones"),iu=cuentaIdx(USD,"Inversiones"),ah=usdVal(0)+saveTot(),iv=ip>=0?accVal(ip):iu>=0?usdVal(iu):0;
 return{ah:ah>0?String(Math.round(ah*100)/100):"",am:"u",iv:iv>0?String(iv):"",im:ip<0&&iu>=0?"u":"p"}}
function patSet(ah,am,iv,im){if(!L.bal)L.bal={};
 function pon(Lc,p,n,v){var i=cuentaIdx(Lc,n);if(i<0){if(!v)return;Lc.push([n,0]);i=Lc.length-1}L.bal[p+i]=v}
 if(am==="p")pon(ACC,"a","Ahorro en pesos",ah);else L.bal.u0=Math.round((ah-saveTot())*100)/100;
 if(im==="u")pon(USD,"u","Inversiones",iv);else pon(ACC,"a","Inversiones",iv);PAT=1;HAVECFG=true}
// Monto con moneda (US$ o pesos), para la pretemporada y para "Falta un dato".
function montoMon(P,k,km,txt,ph){var lb=el("label","",txt),r=el("div","add mon"),i=el("input"),s=el("select");
 i.type="number";i.inputMode="decimal";i.min="0";i.placeholder=ph;i.value=P[k];i.oninput=function(){P[k]=i.value};
 [["u","US$"],["p","$ pesos"]].forEach(function(o){var op=el("option","",o[1]);op.value=o[0];s.appendChild(op)});s.value=P[km];s.setAttribute("aria-label","Moneda");s.onchange=function(){P[km]=s.value};
 r.appendChild(i);r.appendChild(s);lb.appendChild(r);return lb}
function capStart(){if(PRE||CAPLATER||ONB===0||!UID||$("pre").style.display!=="none")return;var cap=capFalta();if(!cap&&PAT)return;
 var Q=patHoy(),w=$("pre"),c=el("div","pc"),h=el("div","prh"),im=el("img"),ht=el("div"),t=el("h2","",cap?"¿Con cuánto arrancaste?":"¿Cuánto tenés ahorrado e invertido?"),f=el("div","prf"),lb=el("label","","Capital inicial (en pesos)"),i=el("input"),msg=el("p","sem prm"),b=el("div","prb"),izq=el("span"),der=el("span"),no=el("button","x","Más tarde"),ok=el("button","","Guardar");
 im.src=pose("enojado",EQUIPO);im.alt="";t.id="pret";ht.appendChild(el("small","prk","Falta un dato"));ht.appendChild(t);h.appendChild(im);h.appendChild(ht);c.appendChild(h);
 c.appendChild(el("p","sem",cap?"Contale a Petaca "+capTxt()+" y, si tenés, cuánto ahorraste e invertiste. Se carga una sola vez: así lo que te queda y los consejos cuentan toda tu plata, no solo los ingresos que cargaste. Si no tenías nada, poné 0."
  :"Se carga una sola vez: así Petaca ve toda tu plata, no solo la del día a día. Si no tenés, dejalo vacío y tocá Guardar."));
 if(cap){i.type="number";i.inputMode="decimal";i.min="0";i.placeholder="Ej: 100,000";lb.appendChild(i);f.appendChild(lb)}
 f.appendChild(montoMon(Q,"ah","am","¿Cuánto tenés ahorrado?","Ej: 300"));f.appendChild(montoMon(Q,"iv","im","¿Y cuánto tenés invertido? Plazo fijo, FCI, acciones, cripto…","Ej: 200,000"));
 c.appendChild(f);c.appendChild(msg);
 no.onclick=function(){CAPLATER=true;capEnd()};
 ok.onclick=function(){var v=i.value.trim()===""?NaN:parseFloat(i.value.replace(",","."));if(cap&&!(v>=0))return(msg.textContent="Poné tu capital inicial (0 si no tenías nada).");
  function n(x){x=String(x).trim();return x===""?0:parseFloat(x.replace(",","."))}var ah=n(Q.ah),iv=n(Q.iv);
  if(!(ah>=0)||!(iv>=0))return(msg.textContent="Lo ahorrado y lo invertido tienen que ser números (0 o más).");
  if(cap){if(!L.bal)L.bal={};L.bal.a0=v;CAP=1}patSet(ah,Q.am,iv,Q.im);capEnd();save();render()};
 [].forEach.call(f.querySelectorAll("input"),function(x){x.onkeydown=function(e){if(e.key==="Enter")ok.click()}});
 izq.appendChild(no);der.appendChild(ok);b.appendChild(izq);b.appendChild(der);c.appendChild(b);
 w.innerHTML="";w.appendChild(c);w.style.display="";document.body.classList.add("pre-open");f.querySelector("input").focus()}
function capEnd(){if(PRE)return;$("pre").style.display="none";$("pre").innerHTML="";document.body.classList.remove("pre-open")}
// Ahorro por ingreso: al cargar un ingreso se separa un % (el de Ajustes o el que elijas para ese ingreso) y pasa en dólares al ahorro.
// El aporte queda ligado al ingreso (aporte.ing = ingreso.id, en pesos en aporte.ars): si editás o borrás el ingreso, el aporte y el saldo se acomodan solos.
function sepTot(){var t=0;L.saves.forEach(function(e){if(e.ars)t+=e.ars});return t}
function diaVal(){return accVal(0)+ingTot()-sumM(L.expenses)-sepTot()}
function pctOk(p){p=parseFloat(String(p).replace(",","."));return p>0?Math.min(p,100):0}
function pctTxt(p){return num(p,1)+"%"}
function aporteDe(o){return o&&o.id?L.saves.filter(function(s){return s.ing===o.id})[0]||null:null}
function ligar(o,p){p=pctOk(p);var s=aporteDe(o);
 if(!p){if(s)drop(L.saves,s);delete o.p;return true}
 var fx=s?s.fx||(s.m>0&&s.ars?s.ars/s.m:0):L.fx;if(!(fx>0))return false;
 if(!o.id)o.id="i"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 if(!s){s={f:o.f||today,ing:o.id};L.saves.push(s)}
 o.p=p;s.fx=fx;s.ars=Math.round(o.v*p/100);s.m=Math.round(s.ars/fx*100)/100;return true}
function sumarIng(f,v,p,me){var o={f:f,k:monOf(f),v:v,me:me==="e"?"e":"t"};L.ing.push(o);ligar(o,p);return o}
// Medio: cada ingreso y gasto es por transferencia ("t": banco, billetera virtual, débito) o en efectivo ("e"). Lo viejo, sin medio, cuenta como transferencia.
// L.bal.ef es la parte del capital inicial que estaba en efectivo. L.mv son pasajes entre medios (cajero, depósito o corrección) que no cambian el total.
function med(e){return e&&e.me==="e"?"e":"t"}
function medTxt(me){return me==="e"?"💵 efectivo":"🏦 transferencia"}
function efVal(){var v=+(L.bal&&L.bal.ef)||0;
 L.ing.forEach(function(o){if(med(o)==="e"){v+=o.v;var s=aporteDe(o);if(s&&s.ars)v-=s.ars}});
 L.expenses.forEach(function(e){if(med(e)==="e")v-=e.m});
 L.mv.forEach(function(m){v+=m.a==="e"?m.m:-m.m});
 return v}
function trVal(){return diaVal()-efVal()}
function usaEf(){return!!(+(L.bal&&L.bal.ef)||L.mv.length||L.ing.some(function(o){return med(o)==="e"})||L.expenses.some(function(e){return med(e)==="e"}))}
function mvTxt(m){return m.adj?"Corrección: pasé "+(m.a==="e"?"de transferencia a efectivo":"de efectivo a transferencia"):m.a==="e"?"Saqué efectivo (de transferencia)":"Deposité efectivo (a transferencia)"}
// Aviso abajo de todo después de cargar o borrar algo, con "Deshacer" a mano por si fue sin querer.
var TOT=null;
function toast(msg){var t=$("toast");if(!t)return;t.innerHTML="";t.appendChild(el("span","",msg));
 if(UNDO.length){var b=el("button","","Deshacer");b.onclick=function(){$("un").click();t.style.display="none"};t.appendChild(b)}
 var x=el("button","x","×");x.setAttribute("aria-label","Cerrar aviso");x.onclick=function(){t.style.display="none"};t.appendChild(x);
 t.style.display="";clearTimeout(TOT);TOT=setTimeout(function(){t.style.display="none"},8000)}
// Antes de cargar un monto, avisa si parece un error de tipeo (un cero de más) o si ya está cargado igual el mismo día.
function dudoso(tipo,m,f,c){
 if(tipo==="g"){
  if(L.expenses.some(function(e){return e.f===f&&e.m===m&&e.c===c&&e.x!=="Ajuste de saldo"}))return"Ya cargaste un gasto de "+money(m)+" en "+c+" ese día. ¿Lo cargo de nuevo?";
  var hs=L.expenses.filter(function(e){return e.x!=="Ajuste de saldo"&&e.f>=plus(today,-90)}).map(function(e){return e.m}).sort(function(a,b){return a-b});
  if(hs.length>=5){var md=hs[Math.floor(hs.length/2)];if(md>0&&m>=md*15&&m>hs[hs.length-1])return money(m)+" es mucho más que tus gastos de siempre (el típico es "+money(md)+"). ¿Está bien el monto o sobra algún cero?"}}
 else{
  if(L.ing.some(function(e){return!e.adj&&(e.f||e.k)===f&&e.v===m}))return"Ya cargaste un ingreso de "+money(m)+" ese día. ¿Lo cargo de nuevo?";
  var mx=0,n=0;L.ing.forEach(function(e){if(!e.adj){n++;mx=Math.max(mx,e.v)}});
  if(n>=2&&m>=mx*5)return money(m)+" es mucho más que cualquier ingreso que cargaste (el más grande fue "+money(mx)+"). ¿Está bien el monto o sobra algún cero?"}
 return""}
function seguro(q){if(!q)return true;try{return confirm(q)}catch(e){return true}}
// Corregir lo que hay en efectivo o en transferencia: o la diferencia pasó al otro medio (el total no cambia), o faltó cargar un gasto/ingreso (cambia el total).
function editMedio(r,me,cur){
 r.innerHTML="";r.style.flexWrap="wrap";
 var n=document.createElement("input");n.type="number";n.inputMode="decimal";n.value=Math.round(cur);n.setAttribute("aria-label","Lo que tenés de verdad en "+medTxt(me));
 var s=el("select"),otro=me==="e"?"transferencia":"efectivo";s.setAttribute("aria-label","De dónde sale la diferencia");
 [["m","La diferencia está en "+otro+" (el total no cambia)"],["a","Me faltó cargar un gasto o ingreso (cambia el total)"]].forEach(function(o){var op=el("option","",o[1]);op.value=o[0];s.appendChild(op)});
 s.value=usaEf()?"a":"m";
 var ok=el("button","","Guardar"),no=el("button","x","Cancelar");
 ok.onclick=function(){var v=parseFloat(String(n.value).replace(",","."));if(!(v>=0))return;var d=Math.round(v-cur);if(!d)return render();
  if(s.value==="m"){L.mv.push({f:today,m:Math.abs(d),a:d>0?me:(me==="e"?"t":"e"),adj:1});save();render()}else ajusteDiario(d,me);
  toast("Corregí "+medTxt(me)+": ahora "+money(v)+".")};
 no.onclick=function(){render()};
 r.appendChild(n);r.appendChild(s);r.appendChild(ok);r.appendChild(no);n.focus()}
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
// Easter egg: si tocás a Petaca se enoja, hace un berrinche y se va de la página. Al rato vuelve, medio ofendido.
(function(){
 var m=document.querySelector("header .masc");if(!m||!m.animate)return;
 var ENOJO=["¡Eh! ¡Las manos quietas! 😡","¡A Petaca no se lo toca! 💢","¡¿Qué te pasa?! ¡Me voy al vestuario!","¡Tarjeta roja para vos! 🟥","¡Así no se puede jugar! Me voy 😤"];
 var VUELTA=["Bueno… ya se me pasó 😒","Volví, pero no me toques más","Fui a buscar un juguito. ¿Seguimos?","Está bien, te perdono. Esta vez."];
 var on=false,quieto=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 function rnd(a){return a[Math.floor(Math.random()*a.length)]}
 function globo(txt,ms){var r=m.getBoundingClientRect(),g=el("div","globo",txt);g.style.left=Math.min(Math.max(r.left+r.width/2,120),innerWidth-120)+"px";g.style.top=Math.max(r.top-6,60)+"px";document.body.appendChild(g);setTimeout(function(){g.remove()},ms);return g}
 function humo(){var r=m.getBoundingClientRect(),h=el("span","humo","💨");h.style.left=(r.left-10)+"px";h.style.top=(r.top+r.height/2-14)+"px";document.body.appendChild(h);setTimeout(function(){h.remove()},800)}
 function kit(){return document.body.classList.contains("auth")?"":EQUIPO}
 function fin(){m.style.visibility="";m.classList.remove("enojado");document.documentElement.classList.remove("huye");on=false;delete m.dataset.egg;vestir()}
 m.addEventListener("click",function(){
  if(on)return;on=true;m.dataset.egg="1";m.src=pose("enojado",kit());m.classList.add("enojado");globo(rnd(ENOJO),1500);
  setTimeout(function(){
   m.classList.remove("enojado");m.src=pose("pateando",kit());document.documentElement.classList.add("huye");
   var r=m.getBoundingClientRect(),dir=r.left+r.width/2<innerWidth/2?-1:1,lejos=dir>0?innerWidth-r.left+40:-(r.right+40);
   if(!quieto)humo();
   var sale=quieto?m.animate([{opacity:1},{opacity:0}],{duration:400,fill:"forwards"}):
    m.animate([{transform:"translate(0,0) rotate(0)"},{transform:"translate("+(-dir*14)+"px,-4px) rotate("+(-dir*8)+"deg)",offset:.15},
     {transform:"translate("+lejos*.3+"px,-26px) rotate("+(dir*10)+"deg)",offset:.45},{transform:"translate("+lejos*.6+"px,0) rotate("+(-dir*6)+"deg)",offset:.7},
     {transform:"translate("+lejos+"px,-18px) rotate("+(dir*14)+"deg)"}],{duration:1100,easing:"ease-in",fill:"forwards"});
   sale.onfinish=function(){m.style.visibility="hidden";sale.cancel();
    setTimeout(function(){m.style.visibility="";
     var vuelve=quieto?m.animate([{opacity:0},{opacity:1}],{duration:400}):
      m.animate([{transform:"translate("+(-lejos)+"px,0) rotate("+(-dir*10)+"deg)"},{transform:"translate("+(-lejos*.4)+"px,-14px) rotate("+(dir*6)+"deg)",offset:.5},{transform:"translate(0,0) rotate(0)"}],{duration:900,easing:"ease-out"});
     vuelve.onfinish=function(){globo(rnd(VUELTA),2200);fin()}},3500)}},1300)});
})();
// Inicio: el tablero va cambiando de rival y resultado. Petaca se viste según la pantalla y el equipo (ver vestir).
(function(){
 var t=document.querySelector(".tablero"),m=document.querySelector("header .masc");if(!t||!m)return;
 var b=t.querySelectorAll("b"),s=t.querySelectorAll("span"),mi=t.querySelector("small");
 var RIV=["DEUDAS","GASTOS HORMIGA","LA TARJETA","INFLACIÓN","EL ALQUILER","DELIVERY","IMPUESTOS","CUOTAS","EXPENSAS","EL CHINO"];
 var ri=-1;
 function otro(a,i){var j;do j=Math.floor(Math.random()*a.length);while(a.length>1&&j===i);return j}
 function gira(x,txt){x.classList.remove("gira");void x.offsetWidth;x.textContent=txt;x.classList.add("gira")}
 function marcador(){ri=otro(RIV,ri);var a=Math.floor(Math.random()*5),c=Math.floor(Math.random()*3);if(Math.random()<.75&&c>=a)a=c+1;
  var min=Math.floor(Math.random()*90)+1,ex=min>=88&&Math.random()<.6;
  gira(b[0],a);gira(b[1],c);gira(s[1],RIV[ri]);mi.textContent=ex?"90' + "+(Math.floor(Math.random()*7)+1):min+"'"}
 marcador();setInterval(function(){if(document.body.classList.contains("auth")&&!document.hidden)marcador()},7000);
 vestir();new MutationObserver(vestir).observe(document.body,{attributes:true,attributeFilter:["class"]});
})();
// Nota de voz: 🎤 Hablar dicta la nota en el cuadro de texto, para revisarla antes de tocar "Entender nota".
// Si el navegador pasa la voz a texto solo (Chrome, Safari), se usa eso: es gratis y no gasta cupo de IA.
// Si no puede (o falla, como en algunas apps instaladas en iPhone), se graba el audio y Gemini lo transcribe.
(function(){
 var b=$("mic"),nt=$("nt"),out=$("nr");if(!b||!nt)return;
 var SR=window.SpeechRecognition||window.webkitSpeechRecognition,GRAB=!!(window.MediaRecorder&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
 if(!SR&&!GRAB)return;b.style.display="";
 var rec=null,mr=null,chunks=[],tope=null,usarSR=!!SR,base="";
 // Corte solo: cuando dejás de hablar 3 segundos la grabación termina sola. Si no empezás a hablar, espera 8.
 var CALLA=3000,ESPERA=8000,calla=null;
 function callar(ms){clearTimeout(calla);calla=ms?setTimeout(function(){if(rec)rec.stop()},ms):null}
 // Al grabar audio se mide el volumen del micrófono para saber cuándo hay silencio.
 // Si el navegador no deja medirlo, no se corta solo: se termina con ⏹ Listo como siempre.
 function oido(ac,st,corta){if(!ac)return null;var an;try{an=ac.createAnalyser();an.fftSize=1024;ac.createMediaStreamSource(st).connect(an);if(ac.state!=="running")ac.resume().catch(function(){})}catch(e){return null}
  var bu=new Uint8Array(an.fftSize),piso=-1,seg=0,ult=Date.now(),t0=ult,o={hablo:false,ok:false};
  o.iv=setInterval(function(){var now=Date.now();if(ac.state!=="running"){ult=t0=now;return}o.ok=true;an.getByteTimeDomainData(bu);var s=0;for(var i=0;i<bu.length;i++){var v=(bu[i]-128)/128;s+=v*v}
   var n=Math.sqrt(s/bu.length);piso=piso<0||n<piso?n:piso+(n-piso)*.005;
   if(n>Math.max(.015,piso*2.5)){if(++seg>=2)o.hablo=true;ult=now}else seg=0;
   if(o.hablo?now-ult>CALLA:now-t0>ESPERA)corta()},100);
  return o}
 function ui(on,txt){b.classList.toggle("grabando",on);b.textContent=on?"⏹ Listo":"🎤 Hablar";b.setAttribute("aria-pressed",String(on));if(txt!=null)out.textContent=txt}
 function poner(t){t=String(t||"").trim();if(!t)return;nt.value=(base?base+" ":"")+t}
 function dictar(){base=nt.value.trim();var fin="";rec=new SR();rec.lang="es-AR";rec.interimResults=true;rec.continuous=true;
  rec.onresult=function(e){var tmp="";for(var i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)fin+=e.results[i][0].transcript+" ";else tmp+=e.results[i][0].transcript}poner(fin+tmp);callar(CALLA)};
  rec.onerror=function(e){var c=e.error;rec=null;callar(0);
   if(c==="not-allowed"&&!GRAB||c==="audio-capture")return ui(false,"Petaca necesita permiso para usar el micrófono. Habilitalo en el navegador y probá de nuevo.");
   if(c==="no-speech")return ui(false,"No te escuché. Tocá 🎤 Hablar y decí la nota.");
   if(c==="aborted")return ui(false);
   // El dictado del navegador no anda acá: se pasa a grabar el audio.
   if(GRAB){usarSR=false;ui(false);grabar()}else ui(false,"No pude usar el micrófono ("+c+").")};
  rec.onend=function(){callar(0);if(rec){rec=null;ui(false,nt.value.trim()?"Revisá el texto y tocá \"Entender nota\".":"No te escuché. Probá de nuevo.")}};
  try{rec.start();callar(ESPERA);ui(true,"Te escucho… cuando termines de hablar se corta solo (o tocá ⏹ Listo).")}catch(e){rec=null;callar(0);if(GRAB){usarSR=false;grabar()}}}
 async function grabar(){
  if(!SB||!UID)return ui(false,"Para mandar audio a Petaca iniciá sesión.");
  // El medidor de volumen se crea antes de pedir el micrófono, todavía dentro del toque (si no, algunos celulares no lo dejan andar).
  var AC=window.AudioContext||window.webkitAudioContext,ac=null;try{ac=AC?new AC():null}catch(e){}
  function cerrarAC(){if(ac&&ac.state!=="closed")ac.close().catch(function(){})}
  var st;try{st=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){cerrarAC();return ui(false,"Petaca necesita permiso para usar el micrófono. Habilitalo en el navegador y probá de nuevo.")}
  var tipo=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg"].filter(function(t){return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t)})[0];
  base=nt.value.trim();chunks=[];mr=tipo?new MediaRecorder(st,{mimeType:tipo}):new MediaRecorder(st);
  mr.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
  var oy=oido(ac,st,function(){if(mr&&mr.state!=="inactive")mr.stop()});
  mr.onstop=async function(){clearTimeout(tope);if(oy)clearInterval(oy.iv);cerrarAC();st.getTracks().forEach(function(t){t.stop()});var m=mr.mimeType||tipo||"audio/webm";mr=null;ui(false,"Pasando tu audio a texto…");
   // Si el medidor anduvo y nunca escuchó voz, no se manda el audio (no gasta cupo de IA en silencio).
   var bl=new Blob(chunks,{type:m});if(bl.size<1500||oy&&oy.ok&&!oy.hablo)return ui(false,"No te escuché. Probá de nuevo.");
   try{var d=await new Promise(function(ok,no){var fr=new FileReader();fr.onload=function(){ok(String(fr.result).split(",")[1]||"")};fr.onerror=no;fr.readAsDataURL(bl)});
    var r=await gemini({audio:d,mime:m});if(!r||!String(r.texto||"").trim())return ui(false,"No entendí el audio. Probá de nuevo, más cerca del micrófono.");
    poner(r.texto);ui(false,"Revisá el texto y tocá \"Entender nota\".")}
   catch(e){ui(false,"No pude pasar el audio a texto: "+(e&&e.message||e))}};
  if(oy&&ac.state!=="running")try{await Promise.race([ac.resume(),new Promise(function(r){setTimeout(r,300)})])}catch(e){}
  mr.start();ui(true,oy&&ac.state==="running"?"Grabando… cuando termines de hablar se corta solo (o tocá ⏹ Listo).":"Grabando… hablá y tocá ⏹ Listo cuando termines (hasta 2 minutos).");
  tope=setTimeout(function(){if(mr&&mr.state!=="inactive")mr.stop()},120000)}
 b.onclick=function(){
  if(rec){var r=rec;r.stop();return}
  if(mr){if(mr.state!=="inactive")mr.stop();return}
  if(usarSR)dictar();else grabar()};
})();
// Para profundizar: Más de tu plata, Agenda y rutinas y Configuración arrancan cerrados y se abren con su botón.
// Si algo lleva a una tarjeta que está adentro (un link, un aviso), el menú se abre solo.
function menuAbrir(g,on){if(!g||!g.classList.contains("menu"))return;g.classList.toggle("abierto",on);var b=g.querySelector(".menub");if(b)b.setAttribute("aria-expanded",String(on))}
function mostrar(x){if(x&&x.closest)menuAbrir(x.closest(".grupo.menu"),true)}
// El primer menú lleva arriba el título "Para profundizar"
function marcarMenus(){var p=document.querySelector("main>.grupo.menu");grupos().forEach(function(g){g.classList.toggle("primero",g===p)})}
document.querySelectorAll(".grupo.menu .menub").forEach(function(b){b.onclick=function(){var g=b.closest(".grupo");menuAbrir(g,!g.classList.contains("abierto"))}});
document.addEventListener("toggle",function(e){if(e.target.open)mostrar(e.target)},true);
marcarMenus();
// Barra de abajo en el celu: salta a cada parte del panel y marca en cuál estás. "Contale" te deja escribiendo la nota.
(function(){var n=$("tabs");if(!n)return;var bs=[].slice.call(n.querySelectorAll("button[data-g]")),suave=!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
 function ir(g){if(g==="inicio")return scrollTo({top:0,behavior:suave?"smooth":"auto"});var x=document.querySelector('.grupo[data-g="'+g+'"]');menuAbrir(x,true);if(x)x.scrollIntoView({behavior:suave?"smooth":"auto",block:"start"})}
 bs.forEach(function(b){b.onclick=function(){var g=b.dataset.g;
  // El foco va en el mismo toque: si no, el iPhone no abre el teclado
  if(g==="nota"){var t=$("nt");if(t)t.focus({preventScroll:true})}ir(g)}});
 var pend=0;function marca(){pend=0;var h=innerHeight*.35,act="inicio";
  if(scrollY>40)document.querySelectorAll(".grupo").forEach(function(x){if(x.getBoundingClientRect().top<h)act={dinero:"plata",tiempo:"fechas"}[x.dataset.g]||x.dataset.g});
  bs.forEach(function(b){b.setAttribute("aria-current",String(b.dataset.g===act))})}
 addEventListener("scroll",function(){if(!pend)pend=requestAnimationFrame(marca)},{passive:true});marca()})();
// Guía de uso: se abre sola la primera vez. Cerrada no ocupa lugar en el panel: se vuelve a abrir con "📖 Guía", arriba.
// Las recomendaciones 💡 de cada sección se pueden ocultar desde la guía (se recuerda en este dispositivo).
(function(){
 var g=$("guia"),sw=$("hintsw");if(!g)return;
 function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
 function ver(){$("guias").hidden=!g.open}
 if(ls("panel-guia")!=="visto")g.open=true;ver();
 g.addEventListener("toggle",function(){if(!g.open)ls("panel-guia","visto");ver()});
 function hints(on){document.body.classList.toggle("sinhints",!on);sw.checked=on}
 hints(ls("panel-hints")!=="0");
 sw.onchange=function(){hints(sw.checked);ls("panel-hints",sw.checked?"1":"0")};
 $("guib").onclick=function(){g.open=true;ver();$("guias").scrollIntoView({behavior:"smooth",block:"start"})};
})();
// Tu equipo: próximo partido, último resultado y posición en la tabla. Los trae la función "partido" de Supabase
// desde los datos públicos de ESPN (el navegador no los puede pedir directo). No es una API oficial: si un día no responde,
// se muestra lo último que se trajo o un aviso, y el resto de Petaca sigue igual. Se guarda en este dispositivo por una hora.
var EQREQ,EQLAST;
async function eqDatos(k,forzar){var e=EQS[k],key="panel-eqd-"+k,c=null;try{c=JSON.parse(localStorage.getItem(key)||"null")}catch(_){}
 if(c&&!forzar&&Date.now()-c.t<3600e3)return c;
 try{if(!SB||!UID)throw new Error("Iniciá sesión");
  var r=await SB.functions.invoke("partido",{body:{lg:e.es.lg,id:e.es.id}});
  if(r.error||!r.data||r.data.error)throw new Error((r.data&&r.data.error)||"sin datos");
  var d=r.data;d.t=Date.now();try{localStorage.setItem(key,JSON.stringify(d))}catch(_){}return d}
 catch(err){if(c){c.viejo=1;return c}throw err}}
// Detalle del equipo arriba de todo, aparte de la agenda de la persona: una línea con el próximo partido y la posición;
// al tocarla se despliega el fixture (próximos partidos), el último resultado y la tabla. Se recuerda si lo dejaste abierto.
function eqCorto(f){var d=new Date(f),h=new Date(),n=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(h.getFullYear(),h.getMonth(),h.getDate()))/864e5);
 return(n===0?"hoy":n===1?"mañana":DN[d.getDay()].slice(0,3).toLowerCase()+" "+d.getDate()+"/"+(d.getMonth()+1))+" "+pad(d.getHours())+":"+pad(d.getMinutes())}
function eqVs(e,p){return p.loc?e.n+" vs "+p.riv:p.riv+" vs "+e.n}
async function renderEquipo(forzar){var box=$("eqfix"),sum=$("eqsum"),b=$("eqb");if(!box||!b)return;var k=document.body.classList.contains("auth")?"":EQUIPO,e=EQS[k];
 if(!k||!e||!e.es){box.hidden=true;return}
 box.hidden=false;var my=EQREQ=(EQREQ||0)+1;
 if(b.dataset.k!==k){b.dataset.k=k;b.innerHTML="";sum.textContent="⚽ "+e.n+": buscando el próximo partido…"}
 var d;try{d=await eqDatos(k,forzar)}catch(err){if(my===EQREQ){sum.textContent="⚽ "+e.n+": no pude traer los partidos";b.innerHTML="";b.appendChild(el("p","eqpie","Probá más tarde."))}return}
 if(my!==EQREQ)return;
 // La línea de arriba: próximo partido (o el que se está jugando) y la posición
 var p=d.prox,tb=d.tb;sum.innerHTML="";sum.appendChild(el("b","",(p&&p.est==="in"?"🔴 ":"⚽ ")+e.n));
 sum.appendChild(el("span","",p?(p.est==="in"?" · jugando ahora vs "+p.riv+(p.gy!=null?" ("+p.gy+"-"+p.go+")":""):" · "+(p.loc?"vs ":"en cancha de ")+p.riv+", "+eqCorto(p.f)):" · sin partido confirmado"));
 if(tb&&tb.pos)sum.appendChild(el("small",""," · "+tb.pos+"°"));
 // Lo desplegado: fixture, último partido y tabla
 b.innerHTML="";var fx=(d.fix&&d.fix.length?d.fix:p?[p]:[]);
 if(fx.length){b.appendChild(el("small","eqlbl","Fixture · "+(LIGAS[d.lg]||"")));var ul=el("div","eqlist");
  fx.forEach(function(q){var r=el("div","eqm"),dd=new Date(q.f),f=iso(dd),t=pad(dd.getHours())+":"+pad(dd.getMinutes()),x="⚽ "+eqVs(e,q),ya=L.events.some(function(v){return v.f===f&&v.x===x});
   r.appendChild(el("span","eqd",eqCorto(q.f)));r.appendChild(el("span","eqr",(q.loc?"🏠 ":"✈️ ")+eqVs(e,q)));
   var ag=el("button","x",ya?"✓":"📅");ag.title=ya?"Ya está en tu agenda":"Agregar a mi agenda";ag.setAttribute("aria-label",ag.title+": "+eqVs(e,q));ag.disabled=ya||q.est==="in";
   ag.onclick=function(){if(L.events.some(function(v){return v.f===f&&v.x===x}))return;L.events.push({f:f,t:t,x:x,imp:false});save();render();toast("Agregué "+x+" a tu agenda ("+fd(f)+" "+t+").");renderEquipo()};
   r.appendChild(ag);ul.appendChild(r)});b.appendChild(ul)}
 var u=d.ult,lin=el("div","eqres");
 if(u&&u.gy!=null){var gy=+u.gy,go=+u.go,res=gy>go?"G":gy<go?"P":"E",s1=el("span");s1.appendChild(el("i","res "+res,res));
  s1.appendChild(document.createTextNode(" Último: "+(u.loc?e.n+" "+u.gy+"-"+u.go+" "+u.riv:u.riv+" "+u.go+"-"+u.gy+" "+e.n)+" ("+fd(iso(new Date(u.f)))+")"));lin.appendChild(s1)}
 if(tb&&tb.pos)lin.appendChild(el("span","","📊 "+tb.pos+"° de "+tb.n+(tb.zona?" en la "+tb.zona:"")+" · "+cant(tb.pts,"punto","puntos")+" en "+cant(tb.pj,"partido","partidos")+" ("+tb.g+"G "+tb.e+"E "+tb.p+"P)"));
 if(lin.firstChild)b.appendChild(lin);
 var pie=el("p","eqpie"),at=new Date(d.t);pie.appendChild(document.createTextNode((d.viejo?"Sin conexión: datos de las ":"Datos de ESPN · ")+pad(at.getHours())+":"+pad(at.getMinutes())+" "));
 var rf=el("button","x","↻ Actualizar");rf.onclick=function(){sum.querySelector("span")&&(sum.querySelector("span").textContent=" · actualizando…");renderEquipo(true)};pie.appendChild(rf);b.appendChild(pie)}
(function(){var x=$("eqfix");if(!x)return;try{x.open=localStorage.getItem("panel-eqfix")==="1"}catch(_){}
 x.addEventListener("toggle",function(){try{localStorage.setItem("panel-eqfix",x.open?"1":"0")}catch(_){}})})();
document.addEventListener("visibilitychange",function(){if(!document.hidden)renderEquipo()});
// Elegir equipo desde arriba de todo: un botón chico al lado de PETACA que abre las 4 opciones y guarda al tocar.
(function(){
 var b=$("eqbtn"),pop=$("eqpop"),ops=$("eqops");if(!b||!pop)return;
 function pinta(){ops.innerHTML="";Object.keys(EQS).forEach(function(k){var o=el("button","eqb"+(EQUIPO===k?" on":""));o.type="button";o.setAttribute("aria-pressed",String(EQUIPO===k));
  var i=el("img");i.src=EQS[k].img;i.alt="";o.appendChild(i);o.appendChild(el("span","",k?EQS[k].n:"Ninguno"));
  o.onclick=function(){cerrar();if(EQUIPO===k)return;EQUIPO=k;HAVECFG=true;vestir();save();toast(k?"¡Listo! Petaca ahora es de "+EQS[k].n+".":"Listo, Petaca vuelve a ser albiceleste.")};ops.appendChild(o)})}
 function abrir(){pinta();pop.hidden=false;b.setAttribute("aria-expanded","true");var f=ops.querySelector(".on")||ops.firstChild;if(f)f.focus()}
 function cerrar(){pop.hidden=true;b.setAttribute("aria-expanded","false")}
 b.onclick=function(e){e.stopPropagation();if(pop.hidden)abrir();else cerrar()};
 document.addEventListener("click",function(e){if(!pop.hidden&&!pop.contains(e.target))cerrar()});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!pop.hidden){cerrar();b.focus()}});
})();
