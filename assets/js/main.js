(function(){
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("progress");
  var totop = document.getElementById("totop");
  function onScroll(){
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("scrolled", y > 12);
    totop.classList.toggle("show", y > 500);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  }
  document.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
  totop.addEventListener("click", function(){ window.scrollTo({top:0, behavior: reduceMotion ? "auto" : "smooth"}); });

  var hamb = document.getElementById("hambBtn");
  hamb.addEventListener("click", function(){
    var open = document.body.classList.toggle("nav-open");
    hamb.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".mobilepanel a").forEach(function(a){
    a.addEventListener("click", function(){ document.body.classList.remove("nav-open"); hamb.setAttribute("aria-expanded","false"); });
  });

  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){ entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, {threshold:.15, rootMargin:"0px 0px -60px 0px"});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("is-visible"); });
  }

  document.querySelectorAll(".spot").forEach(function(el){
    el.addEventListener("pointermove", function(e){
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  document.querySelectorAll(".faqitem").forEach(function(item){
    var btn = item.querySelector(".faqbtn");
    btn.addEventListener("click", function(){
      var isOpen = item.getAttribute("data-open") === "true";
      document.querySelectorAll(".faqitem").forEach(function(other){
        other.setAttribute("data-open","false");
        other.querySelector(".faqbtn").setAttribute("aria-expanded","false");
      });
      if (!isOpen){ item.setAttribute("data-open","true"); btn.setAttribute("aria-expanded","true"); }
    });
  });

  var form = document.getElementById("contactForm");
  if (form){
    var status = document.getElementById("formStatus");
    form.addEventListener("submit", function(){
      status.classList.add("show");
    });
  }

  if (reduceMotion){
    document.querySelectorAll("svg animate, svg animateMotion").forEach(function(a){ a.setAttribute("dur","0.01s"); a.setAttribute("repeatCount","1"); });
  }
})();
