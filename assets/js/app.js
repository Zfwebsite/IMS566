

(function(window){
  const STORAGE = { users: 'tmp_users_v3', current: 'tmp_current_v3', tasks: 'tmp_tasks_v3' };

  const util = {
    uid: () => 't_' + Math.random().toString(36).slice(2,9),
    nowISO: () => new Date().toISOString(),
    todayISO: () => new Date().toISOString().slice(0,10),
    load: (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch(e){ return f; } },
    save: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
    esc: s => (s||'').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  };

  // Users 
  const seedUsers = [{ username:'student', password:'password123', fullname:'Default Student' }];
  const seedTasks = [
    { id: util.uid(), title:'Submit project proposal', subject:'IMS566', due:'', priority:'High', assignee:'You', notes:'Prepare outline', completed:false, createdAt:util.nowISO() },
    { id: util.uid(), title:'Read chapter 4', subject:'CSC508', due:'', priority:'Medium', assignee:'You', notes:'Important for tutorial', completed:false, createdAt:util.nowISO() },
    { id: util.uid(), title:'Team meeting', subject:'IMS566', due:'', priority:'Low', assignee:'Alice', notes:'Discuss milestones', completed:true, completedAt:util.nowISO(), createdAt:util.nowISO() }
  ];

  if (!localStorage.getItem(STORAGE.users)) util.save(STORAGE.users, seedUsers);
  if (!localStorage.getItem(STORAGE.tasks)) util.save(STORAGE.tasks, seedTasks);

  // Authentication process
  function registerUser({fullname, username, password}){
    if (!username || !password) return { success:false, message:'Username & password required.' };
    const users = util.load(STORAGE.users, []);
    if (users.find(u=>u.username===username)) return { success:false, message:'Username exists.' };
    users.push({ username, password, fullname: fullname || username });
    util.save(STORAGE.users, users);
    return { success:true };
  }

  function authLogin(username, password){
    const users = util.load(STORAGE.users, []);
    const u = users.find(x => x.username === username && x.password === password);
    if (!u) return { success:false, message:'Invalid username or password.' };
    util.save(STORAGE.current, { username: u.username, fullname: u.fullname || u.username, loggedAt: util.nowISO() });
    return { success:true };
  }
  function logout(){ localStorage.removeItem(STORAGE.current); }
  function isLoggedIn(){ return !!localStorage.getItem(STORAGE.current); }
  function getCurrentUserName(){ const u = util.load(STORAGE.current, null); return u ? (u.fullname || u.username) : ''; }

  // Tasks
  function getTasks(){ return util.load(STORAGE.tasks, []); }
  function persistTasks(t){ util.save(STORAGE.tasks, t); }

  function addTask(task){
    const tasks = getTasks();
    const t = {
      id: util.uid(),
      title: task.title || 'Untitled',
      subject: task.subject || 'Other',
      due: task.due || '',
      priority: task.priority || 'Medium',
      assignee: task.assignee || getCurrentUserName() || 'Unassigned',
      notes: task.notes || '',
      completed: false,
      createdAt: util.nowISO()
    };
    tasks.unshift(t);
    persistTasks(tasks);
    return t;
  }

  function deleteTask(id){ persistTasks(getTasks().filter(t=>t.id!==id)); }
  function markComplete(id){
    const tasks = getTasks();
    const t = tasks.find(x=>x.id===id);
    if (t && !t.completed) {
      t.completed = true;
      t.completedAt = util.nowISO();
      persistTasks(tasks);
      
      // Flag celebrate user after finish 1 task
      sessionStorage.setItem('celebrate_completion', 'true');
    }
  }

  function reopenTask(id){
    const tasks = getTasks();
    const t = tasks.find(x=>x.id===id);
    if (t && t.completed) {
      t.completed = false;
      delete t.completedAt;
      persistTasks(tasks);
    }
  }
  
  function updateTaskTitle(id, newTitle){
    const tasks = getTasks();
    const t = tasks.find(x=>x.id===id);
    if (t) {
      t.title=newTitle;
      persistTasks(tasks);
    }
  }

  function updateTaskPriority(id, newPriority){
    const tasks = getTasks();
    const t = tasks.find(x=>x.id===id);
    if (t) {
      t.priority=newPriority;
      persistTasks(tasks);
    }
  }

  // Stats
  function getStats(){
    const tasks = getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t=>t.completed).length;
    const pending = total - completed;

    const byPriority = tasks.reduce((acc, t) => {
      if (!t.completed) acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    const getWeeklyCounts = () => {
        const today = new Date(util.todayISO());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.unshift(d.toISOString().slice(0, 10));
        }

        const counts = days.map(day => 
            tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) === day).length
        );
        return { days, counts };
    };

    return { total, completed, pending, byPriority, getWeeklyCounts };
  }

  // Render helpers
  function createTag(text, colorClass){
    return `<span class="tag-subject ${colorClass}">${util.esc(text)}</span>`;
  }

  function createPriorityBadge(priority){
    let badgeClass = '';
    switch(priority){
      case 'High': badgeClass = 'badge-danger'; break;
      case 'Medium': badgeClass = 'badge-warning'; break;
      case 'Low': badgeClass = 'badge-success'; break;
    }
    return `<span class="badge ${badgeClass} fw-700">${priority}</span>`;
  }

  function renderTasksTable(tableId){
    const tasks = getTasks().filter(t => !t.completed).sort((a,b) => (b.priority === 'High' ? 1 : 0) - (a.priority === 'High' ? 1 : 0) || new Date(a.createdAt) - new Date(b.createdAt));
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = tasks.map(t => `
      <tr data-id="${t.id}">
        <td>
          <div class="fw-700">${util.esc(t.title)}</div>
          <div class="small text-muted">${util.esc(t.notes.slice(0, 50))}${t.notes.length > 50 ? '...' : ''}</div>
        </td>
        <td>${t.due ? new Date(t.due).toLocaleDateString() : '—'}</td>
        <td class="edit-priority">${createPriorityBadge(t.priority)}</td>
        <td>${createTag(t.subject, 'tag-subject')}</td>
        <td>${util.esc(t.assignee)}</td>
        <td class="text-end">
          <button class="btn btn-action text-success mark-complete me-1" title="Mark Complete"><i class="bi bi-check-lg"></i></button>
          <button class="btn btn-action text-primary edit-task me-1" title="Edit Task"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-action text-danger delete-task" title="Delete Task"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  function renderCompletedTable(tableId){
    const completedTasks = getTasks().filter(t => t.completed).sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = completedTasks.map(t => `
      <tr data-id="${t.id}" class="task-completed">
        <td>
          <div class="fw-700 text-muted text-decoration-line-through">${util.esc(t.title)}</div>
        </td>
        <td>${t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '—'}</td>
        <td>${createPriorityBadge(t.priority)}</td>
        <td>${createTag(t.subject, 'tag-subject')}</td>
        <td class="text-end">
          <button class="btn btn-action text-warning reopen-task me-1" title="Re-open"><i class="bi bi-arrow-counterclockwise"></i></button>
          <button class="btn btn-action text-danger delete-task" title="Delete Permanently"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  // Charts 

  function renderPriorityDonut(containerId){
    const el = document.getElementById(containerId); if (!el || typeof ApexCharts === 'undefined') return;
    const stats = getStats();
    const data = [stats.byPriority.High || 0, stats.byPriority.Medium || 0, stats.byPriority.Low || 0];
    const labels = ['High', 'Medium', 'Low'];

    if (el._apex) { try { el._apex.destroy(); } catch(e){} }

    const options = {
      series: data,
      chart: { type: 'donut', height: 300 },
      labels: labels,
      colors: ['#FF69B4', '#CC0099', '#9400D3'], // Purple-Pink theme colors
      dataLabels: { enabled: true, formatter: val => Math.round(val) + '%' },
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'Tasks', formatter: w => w.globals.series.reduce((a, b) => a + b, 0) } } } } }
    };

    el._apex = new ApexCharts(el, options);
    el._apex.render();
  }

  // Radial progress chart
  function renderProgressRadial(containerId){
    const el = document.getElementById(containerId); if (!el || typeof ApexCharts === 'undefined') return;
    const stats = getStats();
    const percent = stats.total === 0 ? 0 : Math.round((stats.completed/stats.total)*100);

    if (el._apex) { try { el._apex.destroy(); } catch(e){} }

    const options = {
      series: [percent],
      chart: { type: 'radialBar', height: 280, animations:{enabled:true} },
      plotOptions: {
        radialBar: {
          startAngle: -135, endAngle: 225, hollow: { margin: 0, size: '70%', background: '#fff', image: undefined, position: 'front', dropShadow: { enabled: true, top: 3, left: 0, blur: 4, opacity: 0.24 } },
          track: { background: '#eee', strokeWidth: '67%', margin: 0 },
          dataLabels: {
            show: true, name: { offsetY: -10, show: true, color: '#888', fontSize: '14px' },
            value: {
              formatter: val => parseInt(val) + '%',
              color: '#111', fontSize: '30px', show: true
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark', type: 'horizontal', shadeIntensity: 0.5,
          gradientToColors: ['#9400D3'],
          inverseColors: false, 
          opacityFrom: 1, 
          opacityTo: 1, 
          stops: [0, 100] 
        } 
      },
      stroke: { lineCap: 'round' },
      labels: ['Progress'],
    };

    el._apex = new ApexCharts(el, options);
    el._apex.render();
  }

  // Weekly area
  function renderWeeklyArea(containerId){
    const el = document.getElementById(containerId); if (!el || typeof ApexCharts === 'undefined') return;
    const wk = getStats().getWeeklyCounts();

    if (el._apex) { try { el._apex.destroy(); } catch(e){} }

    const options = {
      series: [{ name: 'New tasks', data: wk.counts }],
      chart: { type:'area', height: 300, toolbar:{show:false}, animations:{enabled:true} },
      xaxis: { categories: wk.days.map(d => d.slice(5)), labels:{ rotate: -20 } },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#CC0099'], 
      fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.6, opacityFrom: 0.6, opacityTo: 0.12 } },
      markers: { size: 4 },
      yaxis: { min:0, tickAmount: 4 }
    };

    el._apex = new ApexCharts(el, options);
    el._apex.render();
  }

 
  window.TaskApp = {
    // Auth
    registerUser, authLogin, logout, isLoggedIn, getCurrentUserName,
    // CRUD
    getTasks, addTask, deleteTask, markComplete, reopenTask, updateTaskTitle, updateTaskPriority,
    // Stats 
    getStats,
    renderTasksTable, renderCompletedTable,
    renderPriorityDonut, renderProgressRadial, renderWeeklyArea
  };

})(window);
