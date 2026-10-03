(function(){
"use strict";
var D=document,R=D.documentElement;
var ROOT=(D.querySelector('meta[name="site-root"]')||{}).content||"";

/* header height -> CSS var so anchors and sticky TOC clear the locked header */
var hdr=D.querySelector(".site-header");
function setHdr(){if(hdr)R.style.setProperty("--hdr",Math.round(hdr.getBoundingClientRect().height)+"px");}
setHdr();window.addEventListener("resize",setHdr);window.addEventListener("load",setHdr);

/* compact header + progress bar + back-to-top */
var bar=D.querySelector(".progress i"),top=D.querySelector(".to-top"),ticking=false;
function onScroll(){
  var y=window.pageYOffset||R.scrollTop,c=y>80;
  if(c!==R.classList.contains("compact")){R.classList.toggle("compact",c);setHdr();}
  if(bar){var h=R.scrollHeight-window.innerHeight;bar.style.width=(h>0?Math.min(100,y/h*100):0)+"%";}
  if(top)top.classList.toggle("show",y>700);
  ticking=false;
}
window.addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
onScroll();
if(top)top.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});

/* scroll spy for the on-page contents */
var links=[].slice.call(D.querySelectorAll(".toc a[href^='#']"));
if(links.length&&"IntersectionObserver" in window){
  var map={};links.forEach(function(a){map[a.getAttribute("href").slice(1)]=a;});
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        links.forEach(function(a){a.classList.remove("on");});
        var a=map[e.target.id];if(a){a.classList.add("on");
          var t=a.closest(".toc");if(t&&t.scrollHeight>t.clientHeight&&getComputedStyle(t).position==="sticky"){
            var ar=a.getBoundingClientRect(),tr=t.getBoundingClientRect();
            if(ar.top<tr.top+40||ar.bottom>tr.bottom-40)t.scrollTop+=ar.top-tr.top-120;}}
      }
    });
  },{rootMargin:"-"+(parseInt(getComputedStyle(R).getPropertyValue("--hdr"))||104)+"px 0px -65% 0px"});
  D.querySelectorAll(".sec[id],.bl-sec[id]").forEach(function(s){io.observe(s);});
}
/* collapse the contents list on phones */
var toc=D.querySelector("details.toc");
if(toc&&window.innerWidth<=1000)toc.removeAttribute("open");

/* ---------- search ---------- */
var ov=D.querySelector(".search-ov"),inp=ov&&ov.querySelector("input"),res=ov&&ov.querySelector(".search-res");
var IDX=null,loading=false,sel=-1;
function esc(s){return s.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function load(cb){
  if(IDX)return cb();
  if(loading)return;loading=true;
  res.innerHTML='<div class="search-hint">Loading topics…</div>';
  fetch(ROOT+"assets/search-index.json").then(function(r){return r.json();}).then(function(d){IDX=d;loading=false;cb();})
  .catch(function(){loading=false;res.innerHTML='<div class="search-hint">Search is unavailable right now. Please try again.</div>';});
}
function score(e,terms){
  var t=e[0].toLowerCase(),x=e[3].toLowerCase(),g=e[2].toLowerCase(),s=0;
  for(var i=0;i<terms.length;i++){
    var w=terms[i],hit=0;
    if(t===w)hit=60;else if(t.indexOf(w)===0)hit=40;else if(t.indexOf(" "+w)>-1)hit=30;else if(t.indexOf(w)>-1)hit=22;
    else if(g.indexOf(w)>-1)hit=8;else if(x.indexOf(w)>-1)hit=5;
    if(!hit)return 0;s+=hit;
  }
  return s;
}
function render(){
  var q=inp.value.trim().toLowerCase();
  if(!IDX){return;}
  if(!q){res.innerHTML='<div class="search-hint">Type a topic, e.g. <b>safety stock</b>, <b>GRN</b>, <b>ABC analysis</b>, <b>kanban</b>…</div>';return;}
  var terms=q.split(/\s+/).filter(Boolean),out=[];
  for(var i=0;i<IDX.length;i++){var s=score(IDX[i],terms);if(s)out.push([s,IDX[i]]);}
  out.sort(function(a,b){return b[0]-a[0]||a[1][0].localeCompare(b[1][0]);});
  out=out.slice(0,25);sel=-1;
  if(!out.length){res.innerHTML='<div class="search-hint">No topic found for “'+esc(q)+'”. Try a shorter word.</div>';return;}
  res.innerHTML=out.map(function(o){var e=o[1];return '<a href="'+ROOT+e[1]+'"><b>'+esc(e[0])+'</b><small><span class="tag">'+esc(e[2])+'</span>'+esc(e[3])+'</small></a>';}).join("");
}
function openS(){if(!ov)return;ov.classList.add("open");load(render);setTimeout(function(){inp.focus();inp.select();},30);}
function closeS(){if(ov)ov.classList.remove("open");}
D.querySelectorAll("[data-search]").forEach(function(b){b.addEventListener("click",openS);});
if(ov){
  inp.addEventListener("input",render);
  ov.addEventListener("click",function(e){if(e.target===ov)closeS();});
  inp.addEventListener("keydown",function(e){
    var a=[].slice.call(res.querySelectorAll("a"));if(!a.length)return;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){
      e.preventDefault();sel=e.key==="ArrowDown"?Math.min(a.length-1,sel+1):Math.max(0,sel-1);
      a.forEach(function(x,i){x.classList.toggle("sel",i===sel);});a[sel].scrollIntoView({block:"nearest"});
    }else if(e.key==="Enter"){e.preventDefault();(a[sel>=0?sel:0]).click();}
  });
}
D.addEventListener("keydown",function(e){
  var tag=(e.target.tagName||"").toLowerCase(),typing=tag==="input"||tag==="textarea";
  if(e.key==="Escape")closeS();
  if((e.key==="/"&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k")){e.preventDefault();openS();}
});

/* ---------- menu toggle (phones) ---------- */
var bm=D.querySelector(".btn-menu"),nav=D.querySelector(".hdr-nav");
if(bm&&nav)bm.addEventListener("click",function(){var o=nav.classList.toggle("open");bm.setAttribute("aria-expanded",o);});

/* ---------- topic filter on hubs / site map ---------- */
var f=D.querySelector("[data-filter]");
if(f){
  var items=[].slice.call(D.querySelectorAll("[data-item]")),cnt=D.querySelector("[data-count]"),empty=D.querySelector(".empty");
  f.addEventListener("input",function(){
    var q=f.value.trim().toLowerCase(),n=0;
    items.forEach(function(el){var ok=!q||el.getAttribute("data-item").indexOf(q)>-1;el.style.display=ok?"":"none";if(ok)n++;});
    D.querySelectorAll("[data-block]").forEach(function(b){
      var any=[].some.call(b.querySelectorAll("[data-item]"),function(x){return x.style.display!=="none";});b.style.display=any?"":"none";});
    if(cnt)cnt.textContent=n+" topic"+(n===1?"":"s");
    if(empty)empty.style.display=n?"none":"block";
  });
}
})();
