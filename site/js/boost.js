/* Maligant Group: banner backgrounds never show black.
   - Each banner's still picture stays visible until its video is actually playing, then the video fades in over it
     (Safari paints a black box while a video loads; this hides that).
   - After the page loads, every banner's still is fetched, so switching banners never lands on an empty frame. */
(function () {
  var st = document.createElement("style");
  st.textContent = ".hero-layer video.custom{opacity:0;transition:opacity .6s ease}.hero-layer video.custom.mg-on{opacity:1}";
  document.head.appendChild(st);

  function arm(v) {
    if (v.dataset.mgArmed) return; v.dataset.mgArmed = "1";
    var on = function () { if (v.currentTime > 0 || !v.paused) v.classList.add("mg-on"); };
    v.addEventListener("playing", on);
    v.addEventListener("timeupdate", on);
    if (!v.paused && v.readyState >= 3) v.classList.add("mg-on");
  }
  function armAll() { document.querySelectorAll(".hero-layer video.custom").forEach(arm); }

  function posters() {
    document.querySelectorAll(".hero-layer img.vposter[data-src]").forEach(function (im, i) {
      if (im.getAttribute("src")) return;
      setTimeout(function () { if (!im.getAttribute("src")) im.src = im.dataset.src; }, i * 120);
    });
    document.querySelectorAll(".hero-layer video[data-poster]").forEach(function (v) {
      if (!v.getAttribute("poster")) v.poster = v.dataset.poster;
    });
  }

  armAll();
  var bg = document.getElementById("heroBg");
  if (bg && window.MutationObserver) new MutationObserver(armAll).observe(bg, { childList: true, subtree: true });
  if (document.readyState === "complete") posters(); else addEventListener("load", posters, { once: true });
})();
