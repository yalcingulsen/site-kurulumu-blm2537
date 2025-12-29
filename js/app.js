const $ = (s) => document.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = navMenu.classList.toggle("show");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
  const sendBtn = $("#sendMsgBtn");
  const msgStatus = $("#msgStatus");
  if (sendBtn && msgStatus) {
    sendBtn.addEventListener("click", () => {
      msgStatus.textContent = "✅ Mesajınız gönderildi. En kısa sürede dönüş yapacağız.";
    });
  }
  const modal = $("#imgModal");
  const modalImg = $("#modalImg");
  const modalCaption = $("#modalCaption");
  const modalClose = $("#modalClose");
  const modalBackdrop = $("#modalBackdrop");

  function openModal(src, caption) {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    if (modalCaption) modalCaption.textContent = caption || "";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal || !modalImg) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    if (modalCaption) modalCaption.textContent = "";
  }

  const galleryGrid = $("#galleryGrid");
  if (galleryGrid) {
    galleryGrid.addEventListener("click", (e) => {
      const img = e.target.closest("img");
      if (!img) return;

      const maybeLink = e.target.closest("a");
      if (maybeLink) e.preventDefault();

      const full = img.getAttribute("data-full") || img.src;
      const caption = img.alt || "Görsel";
      openModal(full, caption);
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

  const scheduleBody = $("#scheduleBody");
  const saveBtn = $("#saveScheduleBtn");
  const clearBtn = $("#clearScheduleBtn");
  const printBtn = $("#printScheduleBtn");
  const saveStatus = $("#saveStatus");

  const manualListEl = $("#manualCourseList");
  const manualCode = $("#manualCode");
  const manualName = $("#manualName");
  const manualAddBtn = $("#manualAddBtn");
  const manualStatus = $("#manualStatus");

  if (scheduleBody) {
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const DAY_LABEL = { Mon:"Pazartesi", Tue:"Salı", Wed:"Çarşamba", Thu:"Perşembe", Fri:"Cuma" };
    const TIMES = [];
    for (let h = 8; h <= 17; h++) TIMES.push(String(h).padStart(2, "0") + ":00");

    const COLORS = [
      "rgba(79,124,255,.85)",
      "rgba(34,197,94,.75)",
      "rgba(236,72,153,.65)",
      "rgba(249,115,22,.70)",
      "rgba(168,85,247,.65)",
      "rgba(14,165,233,.70)"
    ];

    const STORAGE_KEY = "uniplan_schedule_v3";
    let schedule = {}; 
    function cellKey(day, time){ return `${day}|${time}`; }

    function createDraggableCourseCard(course) {
      if (!manualListEl) return;

      const item = document.createElement("div");
      item.className = "course-item";
      item.draggable = true;

      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("application/course", JSON.stringify(course));
      });

      const meta = document.createElement("div");
      meta.className = "course-meta";
      meta.innerHTML = `
        <div class="course-code">${course.code}</div>
        <div class="course-name">${course.name}</div>
      `;

      const actions = document.createElement("div");
      actions.className = "course-actions";

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "Sürükle";

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-dark";
      delBtn.type = "button";
      delBtn.textContent = "Sil";
      delBtn.addEventListener("click", () => item.remove());

      actions.appendChild(badge);
      actions.appendChild(delBtn);

      item.appendChild(meta);
      item.appendChild(actions);

      manualListEl.prepend(item);
    }

    function buildTable() {
      scheduleBody.innerHTML = "";
      TIMES.forEach((time) => {
        const tr = document.createElement("tr");

        const tdTime = document.createElement("td");
        tdTime.className = "time-cell";
        tdTime.textContent = time;
        tr.appendChild(tdTime);

        DAYS.forEach((day) => {
          const td = document.createElement("td");
          td.className = "dropcell";
          td.dataset.day = day;
          td.dataset.time = time;
          td.dataset.key = cellKey(day, time);

          td.addEventListener("dragover", (e) => {
            e.preventDefault();
            td.classList.add("hover");
          });
          td.addEventListener("dragleave", () => td.classList.remove("hover"));

          td.addEventListener("drop", (e) => {
            e.preventDefault();
            td.classList.remove("hover");

            const raw = e.dataTransfer.getData("application/course");
            if (!raw) return;

            let course;
            try { course = JSON.parse(raw); } catch { return; }

            placeCourseInCell(course, day, time);
          });

          tr.appendChild(td);
        });

        scheduleBody.appendChild(tr);
      });
    }

    function placeCourseInCell(course, day, time) {
      const key = cellKey(day, time);

      if (schedule[key]) {
        const ok = confirm(`${DAY_LABEL[day]} ${time} dolu. Üzerine yazılsın mı?`);
        if (!ok) return;
      }

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      schedule[key] = { ...course, color };
      renderSchedule();
    }

    function removeFromCell(key){
      delete schedule[key];
      renderSchedule();
    }

    function renderSchedule() {
      document.querySelectorAll(".dropcell").forEach((td) => {
        td.innerHTML = "";
        const key = td.dataset.key;
        const lesson = schedule[key];
        if (!lesson) return;

        const pill = document.createElement("div");
        pill.className = "lesson-pill";
        pill.style.background = lesson.color;

        const left = document.createElement("div");
        left.innerHTML = `<strong>${lesson.code}</strong><br><small>${lesson.name}</small>`;

        const btn = document.createElement("button");
        btn.className = "remove";
        btn.type = "button";
        btn.textContent = "Sil";
        btn.addEventListener("click", () => removeFromCell(key));

        pill.appendChild(left);
        pill.appendChild(btn);
        td.appendChild(pill);
      });
    }

    function saveToStorage() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
      if (saveStatus) saveStatus.textContent = "✅ Program kaydedildi (localStorage).";
    }

    function loadFromStorage() {
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        schedule = JSON.parse(raw) || {};
        if (saveStatus) saveStatus.textContent = "📌 Kaydedilmiş program yüklendi.";
      }catch(e){
        schedule = {};
      }
    }

    function clearSchedule() {
      const ok = confirm("Tüm program silinsin mi?");
      if (!ok) return;
      schedule = {};
      localStorage.removeItem(STORAGE_KEY);
      renderSchedule();
      if (saveStatus) saveStatus.textContent = "🧹 Program temizlendi.";
    }

    buildTable();
    loadFromStorage();
    renderSchedule();

    if (saveBtn) saveBtn.addEventListener("click", saveToStorage);
    if (clearBtn) clearBtn.addEventListener("click", clearSchedule);
    if (printBtn) printBtn.addEventListener("click", () => window.print());

    if (manualAddBtn) {
      manualAddBtn.addEventListener("click", () => {
        const code = (manualCode?.value || "").trim();
        const name = (manualName?.value || "").trim();

        if (!code || !name) {
          if (manualStatus) manualStatus.textContent = "⚠️ Ders kodu ve ders adı zorunlu.";
          return;
        }

        createDraggableCourseCard({ code, name });
        if (manualStatus) manualStatus.textContent = "✅ Ders kartı oluşturuldu. Şimdi tabloya sürükle.";
        manualCode.value = "";
        manualName.value = "";
      });
    }
  }
      
const searchBtn = $("#searchBtn");
  const searchInput = $("#searchInput");
  const searchResult = $("#searchResult");

  if (searchBtn && searchInput && searchResult) {
    searchBtn.addEventListener("click", () => {
      const q = searchInput.value.trim();
      if (!q) {
        searchResult.textContent = "Bir ders kodu/isim gir (örn. CS101).";
        return;
      }
      searchResult.textContent = `"${q}" araması: Program oluşturucu sayfasında ders listesinde bulup ekleyebilirsin.`;
    });
  }
});
