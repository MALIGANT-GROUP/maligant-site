/* Maligant Group: cookie notice + Meta Pixel (POPIA-friendly: the Pixel loads only after "Accept").
   Pixel ID below. A WhatsApp, email or phone tap is sent to Meta as a "Contact" lead. */
(function () {
  var PIXEL_ID = "949164971467125";
  var KEY = "mg-consent";

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function loadPixel() {
    if (loaded) return; loaded = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* Leads: any tap on WhatsApp, email or phone links (including inside pop-ups) */
  document.addEventListener("click", function (e) {
    if (!loaded || !window.fbq || !e.target.closest) return;
    var a = e.target.closest('a[href^="https://wa.me/"], a[href^="mailto:"], a[href^="tel:"]');
    if (!a) return;
    var h = a.getAttribute("href") || "";
    var method = h.indexOf("wa.me") > -1 ? "WhatsApp" : h.indexOf("mailto:") === 0 ? "Email" : "Phone";
    window.fbq("track", "Contact", { content_name: method });
  }, true);

  /* Clicks: which work people open, YouTube taps and the booking buttons (only after "Accept") */
  function label(el) {
    return ((el.getAttribute("aria-label") || el.getAttribute("data-pick") || el.textContent || "") + "").replace(/\s+/g, " ").trim().slice(0, 80);
  }
  document.addEventListener("click", function (e) {
    if (!loaded || !window.fbq || !e.target.closest) return;
    var t = e.target;
    var yt = t.closest('a[href*="youtube.com"], a[href*="youtu.be"]');
    if (yt) { window.fbq("trackCustom", "YouTubeClick", { content_name: label(yt) }); return; }
    var cta = t.closest('a[data-pick], a.cta-sm');
    if (cta) { window.fbq("trackCustom", "BookingClick", { content_name: label(cta) }); return; }
    var work = t.closest("[data-bts], [data-gfx], [data-week], [data-brand], [data-info]");
    if (work) {
      var kind = work.hasAttribute("data-bts") ? (work.getAttribute("data-list") || "video")
        : work.hasAttribute("data-brand") ? "client"
        : work.hasAttribute("data-info") ? "show" : "graphic";
      window.fbq("trackCustom", "WorkClick", { content_name: label(work), content_category: kind });
    }
  }, true);

  var css = ".mg-cookie{position:fixed;z-index:195;left:max(16px,env(safe-area-inset-left));right:max(16px,env(safe-area-inset-right));bottom:calc(16px + env(safe-area-inset-bottom));max-width:440px;background:#151715;color:#f4f5f2;border:1px solid #2b2f2b;border-radius:14px;padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,.55);font:500 14px/1.5 Figtree,'Segoe UI',system-ui,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .35s ease,transform .35s ease}" +
    ".mg-cookie.on{opacity:1;transform:none}" +
    ".mg-cookie::before{content:'';position:absolute;left:18px;top:-1px;width:64px;height:3px;border-radius:2px;background:linear-gradient(90deg,#5ccc45,#f0a43c,#e0392a)}" +
    ".mg-cookie p{margin:0 0 12px;color:#a3a89f}.mg-cookie a{color:#f0a43c}" +
    ".mg-cookie .b{display:flex;gap:10px;flex-wrap:wrap}" +
    ".mg-cookie button{font:700 14px Figtree,'Segoe UI',system-ui,sans-serif;border-radius:999px;padding:10px 18px;cursor:pointer;border:1px solid #2b2f2b;background:transparent;color:#f4f5f2}" +
    ".mg-cookie button.y{background:#e0392a;border-color:#e0392a;color:#fff}.mg-cookie button.y:hover{background:#c92f21}" +
    ".mg-cookie button:focus-visible{outline:2px solid #f0a43c;outline-offset:2px}" +
    "@media (max-width:899px){.mg-cookie{bottom:calc(84px + env(safe-area-inset-bottom))}html.mg-gated .mg-cookie{bottom:calc(16px + env(safe-area-inset-bottom))}}" +
    "@media (prefers-reduced-motion:reduce){.mg-cookie{transition:none}}";

  var box = null;
  function showNotice() {
    if (box) return;
    if (!document.getElementById("mg-cookie-css")) {
      var st = document.createElement("style"); st.id = "mg-cookie-css"; st.textContent = css; document.head.appendChild(st);
    }
    box = document.createElement("div");
    box.className = "mg-cookie"; box.setAttribute("role", "region"); box.setAttribute("aria-label", "Cookie notice");
    box.innerHTML = '<p>We use cookies to see which of our ads bring you here and to improve the site. See our <a href="/privacy.html">privacy policy</a>.</p>' +
      '<div class="b"><button type="button" class="y">Accept</button><button type="button" class="n">No thanks</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box && box.classList.add("on"); }); });
    box.querySelector(".y").addEventListener("click", function () { setChoice("yes"); hide(); loadPixel(); });
    box.querySelector(".n").addEventListener("click", function () { setChoice("no"); hide(); });
  }
  function hide() { if (!box) return; var b = box; box = null; b.classList.remove("on"); setTimeout(function () { b.remove(); }, 400); }

  /* "Cookie settings" links reopen the notice */
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (!t) return; e.preventDefault(); showNotice();
  });

  var c = getChoice();
  if (c === "yes") loadPixel();
  else if (c !== "no") {
    /* wait for the logo intro to finish, then show the notice */
    var tries = 0;
    (function wait() {
      var intro = document.querySelector(".intro");
      var busy = intro && intro.isConnected && getComputedStyle(intro).display !== "none" && getComputedStyle(intro).visibility !== "hidden" && +getComputedStyle(intro).opacity > 0.05;
      if (busy && tries++ < 60) return setTimeout(wait, 500);
      setTimeout(showNotice, 1200);
    })();
  }
})();
