(function(){
"use strict";
function init(){
 var drops=[].slice.call(document.querySelectorAll(".menu-drop"));
 function closeAll(except){drops.forEach(function(d){if(d!==except){d.classList.remove("is-open");var b=d.querySelector(".menu-trigger");if(b)b.setAttribute("aria-expanded","false");}});}
 drops.forEach(function(d){
  var b=d.querySelector(".menu-trigger");if(!b)return;
  b.setAttribute("aria-expanded","false");
  b.addEventListener("click",function(e){
   e.stopPropagation();
   var open=!d.classList.contains("is-open");
   closeAll(d);
   d.classList.toggle("is-open",open);
   b.setAttribute("aria-expanded",open?"true":"false");
  });
 });
 document.addEventListener("click",function(e){if(!e.target.closest||!e.target.closest(".menu-drop"))closeAll();});
 document.addEventListener("keydown",function(e){if(e.key==="Escape")closeAll();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
