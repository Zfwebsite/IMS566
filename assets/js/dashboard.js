

(function () {
  //  Config utk Daily Quotes ubah2
  const QUOTES = [
    "Stay consistent. Small progress is still progress.",
    "Plan your day, then do the work — one task at a time.",
    "Focus on high-impact tasks first — your future self will thank you.",
    "Break large tasks into smaller steps and celebrate small wins.",
    "Learning is a marathon, not a sprint. Keep showing up."
  ];

  const CLASS_SCHEDULE = [
    { subject: "IMS566", day: "Mon", time: "10:00 AM", venue: "Bilik Kuliah 10" },
    { subject: "IMS564", day: "Tue", time: "12:00 PM", venue: "Makmal Komputer 5" },
    { subject: "CTU554", day: "Wed", time: "04:00 PM", venue: "Dewan Seminar IM" },
    { subject: "ELC501", day: "Thu", time: "08:00 PM", venue: "Bilik Kuliah 9" }
  ];

  // Upcoming events
  const STATIC_EVENTS = [
    { title: "Group Meeting", when: "Friday, 3:00 PM" },
    { title: "UiTM Talk: Career Paths", when: "Next Monday, 11:00 AM" },
    { title: "Quiz Week 7", when: "Week 7" }
  ];

  const SEL = {
    total: "totalTasks",
    completed: "completedTasks",
    pending: "pendingTasks",
    quoteText: "quoteText",
    scheduleList: "scheduleList",
    upcomingList: "upcomingList",
    priorityDonut: "priorityDonut",
    progressRadial: "progressRadial",
    weeklyArea: "weeklyArea"
  };

  // Utility 
  function $(id) { return document.getElementById(id); }
  function safeText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function createEl(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Data helpers
  function getAllTasks() {
    try {
      if (window.TaskApp && typeof window.TaskApp.getTasks === "function") return window.TaskApp.getTasks();
      const candidates = ["tm_tasks_v1","tm_tasks_v2","tmp_tasks_v3","tm_tasks_v1","tm_tasks_v2"];
      for (const k of candidates) {
        const raw = localStorage.getItem(k);
        if (raw) try { return JSON.parse(raw); } catch(e) {}
      }
    } catch(e) {}
    return [];
  }

  function computeStats() {
    const tasks = getAllTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    return { total, completed, pending, tasks };
  }

  function getUpcomingItems() {
    const items = [];
    const tasks = getAllTasks();
    const today = new Date();
    const next7 = new Date(); next7.setDate(today.getDate() + 7);

    tasks.forEach(t => {
      if (!t.completed && t.due) {
        const d = new Date(t.due);
        if (!isNaN(d)) { 
          if (d >= new Date(today.toISOString().slice(0,10)) && d <= next7) {
             items.push({ title: t.title, when: t.due, source: "task" });
          }
        }
      }
    });

    // Add events
    STATIC_EVENTS.forEach(e => items.push(e));

    // Sort: tasks first, then baru event
    return items.sort((a,b) => {
      const d1 = a.source === "task" ? new Date(a.when) : (a.when.includes("Week") ? new Date(2099, 0, 1) : new Date()); // Simple sorting
      const d2 = b.source === "task" ? new Date(b.when) : (b.when.includes("Week") ? new Date(2099, 0, 1) : new Date());
      return d1 - d2;
    });
  }

  // Render

  function renderQuote() {
    if ($(SEL.quoteText)) {
      const currentQuote = $(SEL.quoteText).textContent.trim();
      let newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      // Ensure quotes set utk lain2
      while (newQuote === currentQuote && QUOTES.length > 1) {
        newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      }
      $(SEL.quoteText).textContent = newQuote;
    }
  }

  function renderSchedule() {
    const listEl = $(SEL.scheduleList);
    if (!listEl) return;
    listEl.innerHTML = CLASS_SCHEDULE.map(c => 
      `<li><i class="bi bi-dot"></i> ${c.subject} – ${c.day}, ${c.time} (${c.venue})</li>`
    ).join('');
  }

  function renderUpcoming() {
    const listEl = $(SEL.upcomingList);
    if (!listEl) return;
    const items = getUpcomingItems();
    
    if (items.length === 0) {
      listEl.innerHTML = `<li><i class="bi bi-dot"></i> Tiada aktiviti terdekat.</li>`;
      return;
    }

    listEl.innerHTML = items.slice(0, 5).map(item => { 
      const icon = item.source === "task" ? "bi-check2-circle" : "bi-calendar-event";
      let whenText = item.when;

      if (item.source === "task" && item.when) {
          try {
             whenText = "Due: " + new Date(item.when).toLocaleDateString();
          } catch(e) {}
      }
      
      return `<li><i class="bi ${icon}"></i> ${item.title} – ${whenText}</li>`;
    }).join('');
  }

  function refreshDashboard() {
    const stats = computeStats();
    safeText(SEL.total, stats.total);
    safeText(SEL.completed, stats.completed);
    safeText(SEL.pending, stats.pending);

   
    renderUpcoming();

  
    if (window.TaskApp) {
      if ($(SEL.priorityDonut)) window.TaskApp.renderPriorityDonut(SEL.priorityDonut);
      if ($(SEL.progressRadial)) window.TaskApp.renderProgressRadial(SEL.progressRadial);
      if ($(SEL.weeklyArea)) window.TaskApp.renderWeeklyArea(SEL.weeklyArea);
    }
  }
   
  const METHODS_TO_WRAP = [
    'addTask', 'deleteTask', 'markComplete', 'reopenTask', 
    'updateTaskTitle', 'updateTaskPriority'
  ];

  // Utility to handle HTML escaping 
  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }
  
  function wrapTaskAppMethods() {
    METHODS_TO_WRAP.forEach(methodName => {
      if (window.TaskApp && typeof window.TaskApp[methodName] === 'function') {
        const original = window.TaskApp[methodName];
        
        // Overwrite the original function
        window.TaskApp[methodName] = function () {
          const res = original.apply(this, arguments);
          setTimeout(refreshDashboard, 150);
          return res;
        };
      }
    });
  }

  // Timer utk ubah quotes 
  let quoteIntervalId = null;
  function startQuoteRotation() {
    renderQuote(); 
    if (quoteIntervalId) clearInterval(quoteIntervalId);
    quoteIntervalId = setInterval(renderQuote, 10000); // rotate every 10s
  }

  // Rendering
  function init() {
    // render static blocks
    renderSchedule();
    // render dynamic blocks & charts
    refreshDashboard();
    // from TaskApp wrap methods to auto refresh after modifications
    wrapTaskAppMethods();
    // set quote rotation
    startQuoteRotation();
 
    window.addEventListener("storage", function(e) {
      const keys = [ "tm_tasks_v1","tm_tasks_v2","tmp_tasks_v3","tm_tasks_v1","tm_tasks_v2" ];
      if (keys.includes(e.key)) {
        setTimeout(refreshDashboard, 100);
      }
    });

    setInterval(refreshDashboard, 60000); 
  }

  if (window.TaskApp) {
    init();
  } else {
    window.addEventListener('load', init); 
  }

})();