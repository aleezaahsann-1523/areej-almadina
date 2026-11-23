/* ==========================================================
   Areej Almadina Delivery Services - site behaviour
   1. Config      2. Header        3. Mobile menu   4. Active link
   5. Animations  6. Service cards 7. WhatsApp      8. Enquiry form
   ========================================================== */
(() => {
  "use strict";

  /* ---------- 1. Config ----------
     WhatsApp is OFF by default. If 0508832230 is confirmed to be on
     WhatsApp, set whatsappEnabled to true and the WhatsApp contact
     option appears automatically.

     formEndpoint: leave empty to open the visitor's email app when the
     form is sent. To receive enquiries directly, paste a form service
     URL here (for example a Formspree endpoint). */
  const CONFIG = {
    email: "areejalmadina73@gmail.com",
    formEndpoint: "",
    whatsappEnabled: false,
    whatsappNumber: "971508832230", // international format, no + or spaces
    whatsappMessage: "Hello, I would like to ask about your services.",
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------- 2. Header: transparent -> rounded pill on scroll ---------- */
  const header = $("#header");

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- 3. Mobile menu ---------- */
  const menuToggle = $("#menuToggle");
  const nav = $("#nav");

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1000) setMenu(false);
  });

  /* ---------- 4. Highlight the nav link of the section in view ----------
     Sections without a nav link keep the previous highlight. */
  const navLinks = $$(".nav__list a");

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = navLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        if (!match) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link === match));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  $$("[data-section]").forEach((section) => sectionObserver.observe(section));

  /* ---------- 5. Scroll animations ---------- */

  // Wrap every word of a heading so it can slide up inside a mask.
  const splitWords = (element) => {
    let index = 0;

    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;

        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(" "));
            return;
          }
          const word = document.createElement("span");
          const inner = document.createElement("span");
          word.className = "word";
          inner.className = "word__inner";
          inner.textContent = part;
          inner.style.setProperty("--i", Math.min(index++, 14));
          word.append(inner);
          fragment.append(word);
        });
        child.replaceWith(fragment);
      });
    };

    walk(element);
  };

  $$("[data-split]").forEach(splitWords);

  // Children of [data-stagger] fade in one after another.
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, i) => {
      child.classList.add("reveal");
      child.style.setProperty("--delay", `${i * 90}ms`);
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  $$("[data-split], .reveal").forEach((element) => revealObserver.observe(element));

  /* ---------- 6. Service cards ----------
     clicking a card pre-selects that service in the enquiry form */
  const form = $("#enquiryForm");
  const serviceSelect = form.elements.service;

  $$(".service").forEach((card) => {
    card.addEventListener("click", () => {
      const wanted = card.dataset.service;
      const option = [...serviceSelect.options].find((o) => o.textContent === wanted);
      if (option) serviceSelect.value = option.value || option.textContent;
    });
  });

  /* ---------- 7. WhatsApp (only when enabled in CONFIG) ---------- */
  if (CONFIG.whatsappEnabled) {
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
    $$("[data-whatsapp]").forEach((item) => {
      item.hidden = false;
      const link = item.matches("a") ? item : $("a", item);
      if (link) link.href = url;
    });
  }

  /* ---------- 8. Enquiry form ---------- */
  const status = $("#formStatus");

  const showStatus = (message, type) => {
    status.textContent = message;
    status.className = `form__status is-${type}`;
    status.hidden = false;
  };

  const sendByEmail = ({ name, phone, email, service, message }) => {
    const subject = `Enquiry: ${service}`;
    const lines = [`Name: ${name}`, `Phone: ${phone}`];
    if (email) lines.push(`Email: ${email}`);
    lines.push(`Service: ${service}`, "", message);
    const body = lines.join("\n");

    window.location.href =
      `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showStatus("Your email app should open with the details filled in.", "success");
  };

  const sendToEndpoint = async (data) => {
    const response = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Request failed");
    form.reset();
    showStatus("Thank you. We have received your enquiry and will be in touch.", "success");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = Object.fromEntries(new FormData(form));
    if (values.company) return; // spam trap was filled in

    const data = {
      name: (values.name || "").trim(),
      phone: (values.phone || "").trim(),
      email: (values.email || "").trim(),
      service: values.service || "General enquiry",
      message: (values.message || "").trim(),
    };

    if (!data.name || !data.phone || !data.message) {
      showStatus("Please add your name, phone number and a short message.", "error");
      return;
    }

    if (!CONFIG.formEndpoint) {
      sendByEmail(data);
      return;
    }

    try {
      await sendToEndpoint(data);
    } catch {
      showStatus("Something went wrong. Please call 0508832230 or email us directly.", "error");
    }
  });

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
