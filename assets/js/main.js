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

  var blogCarousel = document.getElementById("blogCarousel");
  if (blogCarousel){
    var blogPrev = document.getElementById("blogPrev");
    var blogNext = document.getElementById("blogNext");
    var blogTrack = blogCarousel.querySelector(".blog-track");
    function blogStep(){
      var card = blogTrack.querySelector(".blog-card");
      if (!card) return blogCarousel.clientWidth;
      var gap = parseFloat(window.getComputedStyle(blogTrack).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    }
    function updateBlogControls(){
      var maxScroll = Math.max(0, blogCarousel.scrollWidth - blogCarousel.clientWidth);
      blogPrev.disabled = blogCarousel.scrollLeft <= 2;
      blogNext.disabled = blogCarousel.scrollLeft >= maxScroll - 2;
    }
    function moveBlog(direction){
      blogCarousel.scrollBy({left:direction * blogStep(), behavior:reduceMotion ? "auto" : "smooth"});
    }
    blogPrev.addEventListener("click", function(){ moveBlog(-1); });
    blogNext.addEventListener("click", function(){ moveBlog(1); });
    blogCarousel.addEventListener("scroll", updateBlogControls, {passive:true});
    blogCarousel.addEventListener("keydown", function(event){
      if (event.key === "ArrowLeft"){ event.preventDefault(); moveBlog(-1); }
      if (event.key === "ArrowRight"){ event.preventDefault(); moveBlog(1); }
    });
    window.addEventListener("resize", updateBlogControls, {passive:true});
    window.addEventListener("load", updateBlogControls, {once:true});
    updateBlogControls();
  }

  var rentalCarousel = document.getElementById("rentalCarousel");
  if (rentalCarousel){
    var rentalViewport = document.getElementById("rentalCarouselViewport");
    var rentalTrack = rentalCarousel.querySelector(".rental-bands");
    var rentalOriginals = Array.prototype.slice.call(rentalTrack.children);
    var rentalPrev = rentalCarousel.querySelector("[data-rental-prev]");
    var rentalNext = rentalCarousel.querySelector("[data-rental-next]");
    var rentalPause = rentalCarousel.querySelector("[data-rental-pause]");
    var rentalPauseLabel = rentalCarousel.querySelector("[data-rental-pause-label]");
    var rentalDots = Array.prototype.slice.call(rentalCarousel.querySelectorAll("[data-rental-dot]"));
    var rentalStatus = rentalCarousel.querySelector("[data-rental-status]");

    if (rentalOriginals.length > 1){
      var rentalCount = rentalOriginals.length;
      var rentalFirstClone = rentalOriginals[0].cloneNode(true);
      var rentalLastClone = rentalOriginals[rentalCount - 1].cloneNode(true);
      rentalFirstClone.setAttribute("aria-hidden","true");
      rentalLastClone.setAttribute("aria-hidden","true");
      rentalTrack.insertBefore(rentalLastClone,rentalOriginals[0]);
      rentalTrack.appendChild(rentalFirstClone);

      var rentalSlides = Array.prototype.slice.call(rentalTrack.children);
      var rentalPosition = 1;
      var rentalLogical = 0;
      var rentalBusy = false;
      var rentalUserPaused = reduceMotion;
      var rentalTimer = null;
      var rentalStartX = 0;
      var rentalDeltaX = 0;
      var rentalDragging = false;

      function rentalWidth(){ return rentalViewport.clientWidth; }
      function rentalSetTransform(animate){
        var shouldAnimate = animate && !reduceMotion;
        rentalTrack.classList.toggle("is-jumping",!shouldAnimate);
        if (!shouldAnimate && rentalBusy){
          if (rentalPosition === 0) rentalPosition = rentalCount;
          if (rentalPosition === rentalCount + 1) rentalPosition = 1;
          rentalBusy = false;
        }
        rentalTrack.style.transform = "translate3d(" + (-rentalPosition * rentalWidth()) + "px,0,0)";
        window.requestAnimationFrame(rentalUpdateHeight);
      }
      function rentalUpdateHeight(){
        var active = rentalSlides[rentalPosition];
        if (active) rentalViewport.style.height = active.offsetHeight + "px";
      }
      function rentalUpdateUi(announce){
        rentalDots.forEach(function(dot,index){
          dot.setAttribute("aria-current",index === rentalLogical ? "true" : "false");
        });
        rentalOriginals.forEach(function(slide,index){
          slide.setAttribute("aria-hidden",index === rentalLogical ? "false" : "true");
          slide.setAttribute("role","group");
          slide.setAttribute("aria-roledescription","slide");
          slide.setAttribute("aria-label",(index + 1) + " de " + rentalCount);
        });
        if (announce){
          var heading = rentalOriginals[rentalLogical].querySelector("h3");
          rentalStatus.textContent = "Faixa " + (rentalLogical + 1) + " de " + rentalCount + ": " + (heading ? heading.textContent : "");
        }
      }
      function rentalStopTimer(){
        if (rentalTimer){ window.clearInterval(rentalTimer); rentalTimer = null; }
      }
      function rentalStartTimer(){
        rentalStopTimer();
        if (!rentalUserPaused && !document.hidden){
          rentalTimer = window.setInterval(function(){ rentalMove(1,false); },6000);
        }
      }
      function rentalMove(direction,announce){
        if (rentalBusy) return;
        rentalBusy = true;
        rentalPosition += direction;
        rentalLogical = (rentalLogical + direction + rentalCount) % rentalCount;
        rentalUpdateUi(announce);
        rentalSetTransform(true);
        rentalStartTimer();
      }
      function rentalGoTo(index){
        if (rentalBusy || index === rentalLogical) return;
        rentalBusy = true;
        rentalLogical = index;
        rentalPosition = index + 1;
        rentalUpdateUi(true);
        rentalSetTransform(true);
        rentalStartTimer();
      }
      function rentalTogglePause(){
        rentalUserPaused = !rentalUserPaused;
        rentalPause.setAttribute("aria-pressed",rentalUserPaused ? "true" : "false");
        rentalPause.setAttribute("aria-label",rentalUserPaused ? "Retomar rotação automática" : "Pausar rotação automática");
        rentalPauseLabel.textContent = rentalUserPaused ? "Retomar" : "Pausar";
        rentalStatus.textContent = rentalUserPaused ? "Rotação automática pausada." : "Rotação automática retomada.";
        if (rentalUserPaused) rentalStopTimer(); else rentalStartTimer();
      }

      rentalTrack.addEventListener("transitionend",function(event){
        if (event.propertyName !== "transform") return;
        if (rentalPosition === 0){ rentalPosition = rentalCount; rentalSetTransform(false); }
        if (rentalPosition === rentalCount + 1){ rentalPosition = 1; rentalSetTransform(false); }
        rentalBusy = false;
        rentalUpdateHeight();
      });
      rentalPrev.addEventListener("click",function(){ rentalMove(-1,true); });
      rentalNext.addEventListener("click",function(){ rentalMove(1,true); });
      rentalPause.addEventListener("click",rentalTogglePause);
      rentalDots.forEach(function(dot){
        dot.addEventListener("click",function(){ rentalGoTo(parseInt(dot.getAttribute("data-rental-dot"),10)); });
      });
      rentalCarousel.addEventListener("keydown",function(event){
        if (event.key === "ArrowLeft"){ event.preventDefault(); rentalMove(-1,true); }
        if (event.key === "ArrowRight"){ event.preventDefault(); rentalMove(1,true); }
      });
      rentalViewport.addEventListener("pointerdown",function(event){
        if (event.button !== 0 || rentalBusy) return;
        rentalDragging = true; rentalStartX = event.clientX; rentalDeltaX = 0;
        rentalViewport.classList.add("is-dragging");
        rentalTrack.classList.add("is-jumping");
        rentalViewport.setPointerCapture(event.pointerId);
        rentalStopTimer();
      });
      rentalViewport.addEventListener("pointermove",function(event){
        if (!rentalDragging) return;
        rentalDeltaX = event.clientX - rentalStartX;
        rentalTrack.style.transform = "translate3d(" + ((-rentalPosition * rentalWidth()) + rentalDeltaX) + "px,0,0)";
      });
      function rentalEndDrag(event){
        if (!rentalDragging) return;
        rentalDragging = false;
        rentalViewport.classList.remove("is-dragging");
        if (rentalViewport.hasPointerCapture(event.pointerId)) rentalViewport.releasePointerCapture(event.pointerId);
        var threshold = Math.min(90,rentalWidth() * .16);
        if (Math.abs(rentalDeltaX) > threshold) rentalMove(rentalDeltaX < 0 ? 1 : -1,true);
        else { rentalSetTransform(true); rentalStartTimer(); }
      }
      rentalViewport.addEventListener("pointerup",rentalEndDrag);
      rentalViewport.addEventListener("pointercancel",rentalEndDrag);
      rentalCarousel.addEventListener("mouseenter",rentalStopTimer);
      rentalCarousel.addEventListener("mouseleave",rentalStartTimer);
      rentalCarousel.addEventListener("focusin",rentalStopTimer);
      rentalCarousel.addEventListener("focusout",function(event){ if (!rentalCarousel.contains(event.relatedTarget)) rentalStartTimer(); });
      document.addEventListener("visibilitychange",function(){ if (document.hidden) rentalStopTimer(); else rentalStartTimer(); });
      window.addEventListener("resize",function(){ rentalSetTransform(false); },{passive:true});
      rentalTrack.querySelectorAll("img").forEach(function(image){
        if (!image.complete) image.addEventListener("load",rentalUpdateHeight,{once:true});
      });
      if ("ResizeObserver" in window){
        var rentalResizeObserver = new ResizeObserver(rentalUpdateHeight);
        rentalOriginals.forEach(function(slide){ rentalResizeObserver.observe(slide); });
      }

      if (reduceMotion){
        rentalPause.setAttribute("aria-pressed","true");
        rentalPause.setAttribute("aria-label","Retomar rotação automática");
        rentalPauseLabel.textContent = "Retomar";
      }
      rentalUpdateUi(false);
      rentalSetTransform(false);
      rentalStartTimer();
    }
  }

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
