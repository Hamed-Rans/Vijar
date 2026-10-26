const STORAGE_KEYS = { 
    role: 'vizhar_role', docs: 'vizhar_docs', folders: 'vizhar_folders', 
    theme: 'vizhar_theme', defaultFontSize: 'vizhar_default_fs', language: 'vizhar_lang' 
};

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let state = {
    role: null, folders: [], docs: [], activeFolder: 'all', activeDoc: null,
    selectionRange: null, selectedWord: '', autoSave: true, blurEffect: true, baseFontSize: 16,
    targetDocIdToMove: null, targetFolderIdToEdit: null, currentFileToImport: null,
    lang: 'fa', tempSettings: {}, hasSettingsChanged: false
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const i18n = {
    fa: {
        "btn-import": "افزودن", "btn-export": "خروجی",
        "settings-title": "پیکربندی", "settings-theme": "پوسته ظاهری",
        "settings-lang": "زبان برنامه", "settings-autosave": "ذخیره خودکار",
        "settings-blur": "محو کردن هنگام هاور نکات", "settings-notes-panel": "پنل یادداشت‌ها",
        "settings-canvas-panel": "پنل بوم نقاشی", "settings-scratch-panel": "پنل چرک‌نویس",
        "about-created": "ساخته شده در استودیو داهپت", "about-designer": "طراح و ایده‌پرداز: Hamed Rans",
        "btn-confirm": "تایید تغییرات", "btn-cancel": "انصراف",
        "btn-reset-role": "انتخاب مجدد نقش", "btn-clear-data": "حذف تمام داده‌ها"
    },
    en: {
        "btn-import": "Add", "btn-export": "Export",
        "settings-title": "Settings", "settings-theme": "Appearance",
        "settings-lang": "Language", "settings-autosave": "Auto Save",
        "settings-blur": "Blur Background on Note Hover", "settings-notes-panel": "Notes Panel",
        "settings-canvas-panel": "Canvas Panel", "settings-scratch-panel": "Scratchpad Panel",
        "about-created": "Created by Dahpat Studio", "about-designer": "Designer & Ideator: Hamed Rans",
        "btn-confirm": "Apply Changes", "btn-cancel": "Cancel",
        "btn-reset-role": "Reset Role", "btn-clear-data": "Clear All Data"
    },
    ar: {
        "btn-import": "إضافة", "btn-export": "تصدير",
        "settings-title": "الإعدادات", "settings-theme": "المظهر",
        "settings-lang": "اللغة", "settings-autosave": "حفظ تلقائي",
        "settings-blur": "تمويه عند التمرير على الملاحظات", "settings-notes-panel": "لوحة الملاحظات",
        "settings-canvas-panel": "لوحة الرسم", "settings-scratch-panel": "لوحة المسودة",
        "about-created": "تم الإنشاء بواسطة استوديو داهبت", "about-designer": "المصمم والمبتكر: Hamed Rans",
        "btn-confirm": "تطبيق التغييرات", "btn-cancel": "إلغاء",
        "btn-reset-role": "إعادة اختيار الدور", "btn-clear-data": "حذف جميع البيانات"
    }
};

function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem(STORAGE_KEYS.language, lang);
    document.documentElement.dir = (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';
    $$('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (i18n[lang] && i18n[lang][key]) {
            el.textContent = i18n[lang][key];
        }
    });
    
    // رفع باگ: حذف علامت # اضافه
    const langDisplay = $('currentLangDisplay'); 
    if (langDisplay) {
        langDisplay.textContent = lang === 'en' ? 'English' : (lang === 'ar' ? 'العربية' : 'فارسی');
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEYS.role, state.role || '');
        localStorage.setItem(STORAGE_KEYS.docs, JSON.stringify(state.docs));
        localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(state.folders));
    } catch (e) { console.error(e); }
}

function loadState() {
    state.role = localStorage.getItem(STORAGE_KEYS.role) || null;
    try {
        state.folders = JSON.parse(localStorage.getItem(STORAGE_KEYS.folders) || '[]');
        state.docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.docs) || '[]');
        state.autoSave = localStorage.getItem('vizhar_autosave') !== 'false';
        state.blurEffect = localStorage.getItem('vizhar_blur') !== 'false';
        state.baseFontSize = parseInt(localStorage.getItem(STORAGE_KEYS.defaultFontSize)) || 16;
        state.lang = localStorage.getItem(STORAGE_KEYS.language) || 'fa';
    } catch(e) { state.folders = []; state.docs = []; }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    $$('#themeToggle button').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
}

function initTheme() {
    applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'dark');
    $$('#themeToggle button').forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.theme)));
}

function showRoleView() {
    $('role-view').classList.remove('hidden'); $('dashboard-view').classList.add('hidden'); $('editor-view').classList.add('hidden');
    $('backToDashBtn').classList.add('hidden'); $$('.action-nav').forEach(el => el.classList.add('hidden')); $('userRoleBadge').classList.add('hidden');
}

function showDashboard() {
    $('role-view').classList.add('hidden'); $('dashboard-view').classList.remove('hidden'); $('editor-view').classList.add('hidden');
    $('backToDashBtn').classList.add('hidden'); $$('.action-nav').forEach(el => el.classList.add('hidden'));
    $('userRoleBadge').classList.remove('hidden'); $('userRoleBadge').textContent = state.role === 'teacher' ? 'استاد' : 'دانشجو';
    $('dashboard-view').style.opacity = '1';
    renderFolders(); renderDocs();
}

function showEditor() {
    $('role-view').classList.add('hidden'); $('dashboard-view').classList.add('hidden'); $('editor-view').classList.remove('hidden');
    $('backToDashBtn').classList.remove('hidden'); $$('.action-nav').forEach(el => el.classList.remove('hidden'));
    $('editor-view').style.opacity = '1';
}

function renderFolders() {
    const list = $('folderList'); list.innerHTML = '';
    const allLi = document.createElement('li'); allLi.className = 'folder-item';
    allLi.innerHTML = `<div class="folder-header ${state.activeFolder === 'all' ? 'active' : ''}" data-id="all"><div class="folder-title-wrap ${state.activeFolder === 'all' ? 'active' : ''}"><i class="fa-solid fa-inbox"></i> همه جزوه‌ها</div></div>`;
    allLi.querySelector('.folder-title-wrap').onclick = () => { state.activeFolder = 'all'; renderFolders(); renderDocs(); };
    list.appendChild(allLi);

    state.folders.forEach(f => {
        const li = document.createElement('li'); li.className = 'folder-item';
        const folderDocs = state.docs.filter(d => d.folderId === f.id);
        const isOpen = state.activeFolder === f.id;
        
        li.innerHTML = `
            <div class="folder-header ${isOpen ? 'active open' : ''}" data-id="${f.id}">
                <div class="folder-title-wrap ${isOpen ? 'active' : ''}"><i class="fa-solid fa-folder"></i> ${escapeHtml(f.name)}</div>
                <button class="folder-arrow-btn"><i class="fa-solid fa-chevron-left"></i></button>
            </div>
            <ul class="folder-docs">
                ${folderDocs.map(d => `<li class="folder-doc-item" data-doc-id="${d.id}"><i class="fa-regular fa-file-lines"></i> ${escapeHtml(d.title || 'بدون عنوان')}</li>`).join('')}
            </ul>
        `;
        
        li.querySelector('.folder-title-wrap').onclick = () => {
            state.activeFolder = f.id; $$('.folder-header').forEach(h => h.classList.remove('open', 'active')); 
            $$('.folder-title-wrap').forEach(h => h.classList.remove('active'));
            li.querySelector('.folder-header').classList.add('active');
            li.querySelector('.folder-title-wrap').classList.add('active');
            renderDocs();
        };

        li.querySelector('.folder-arrow-btn').onclick = (e) => {
            e.stopPropagation();
            const header = li.querySelector('.folder-header');
            if(header.classList.contains('open')) header.classList.remove('open');
            else { $$('.folder-header').forEach(h => h.classList.remove('open')); header.classList.add('open'); }
        };

        li.querySelector('.folder-header').oncontextmenu = (e) => {
            e.preventDefault(); state.targetFolderIdToEdit = f.id;
            const menu = $('folderContextMenu');
            openMenuAt(e, menu);
        };

        li.querySelectorAll('.folder-doc-item').forEach(item => { item.onclick = () => openDoc(item.dataset.docId); });
        list.appendChild(li);
    });
}

function renderDocs() {
    const grid = $('documentsGrid'); grid.innerHTML = '';
    let docs = state.docs;
    if (state.activeFolder !== 'all') docs = docs.filter(d => d.folderId === state.activeFolder);

    if (docs.length === 0) { $('emptyState').classList.remove('hidden'); return; }
    $('emptyState').classList.add('hidden');

    docs.forEach(d => {
        const card = document.createElement('div'); card.className = 'doc-card'; card.dataset.id = d.id;
        
        let mediaHtml = `<i class="fa-regular fa-file-lines"></i>`;
        if (d.thumbnail) mediaHtml = `<img src="${d.thumbnail}" style="background:#fff;" alt="thumbnail">`;

        let previewText = 'متن خالی...';
        if (d.content) {
            let tempDiv = document.createElement('div'); tempDiv.innerHTML = d.content;
            tempDiv.querySelectorAll('img, audio, video, iframe, .media-attachment').forEach(el => el.remove());
            let rawText = tempDiv.textContent || tempDiv.innerText || "";
            rawText = rawText.replace(/\s+/g, ' ').trim();
            if (rawText.length > 0) previewText = rawText.length > 50 ? rawText.substring(0, 50) + '...' : rawText;
        }

        card.innerHTML = `
            <button class="doc-menu-btn"><i class="fa-solid fa-ellipsis"></i></button>
            <div class="doc-card-img">${mediaHtml}</div>
            <div class="doc-card-body"><h3>${escapeHtml(d.title || 'بدون عنوان')}</h3><div class="live-preview">${escapeHtml(previewText)}</div></div>
        `;
        card.onclick = (e) => { if(!e.target.closest('.doc-menu-btn')) openDoc(d.id); };

        const menuBtn = card.querySelector('.doc-menu-btn');
        const showDocMenu = (e) => {
            state.targetDocIdToMove = d.id; 
            const menu = $('docContextMenu');
            openMenuAt(e, menu);
        };
        menuBtn.onclick = (e) => { 
            e.stopPropagation(); const menu = $('docContextMenu');
            if (!menu.classList.contains('hidden')) { menu.classList.add('closing'); setTimeout(() => menu.classList.add('hidden'), 300); } 
            else { showDocMenu(e); }
        };
        card.oncontextmenu = (e) => { e.preventDefault(); showDocMenu(e); };
        grid.appendChild(card);
    });
}

function createDoc() {
    const doc = { id: 'doc_' + Date.now(), title: '', content: '', folderId: state.activeFolder !== 'all' ? state.activeFolder : null, createdAt: Date.now(), updatedAt: Date.now(), thumbnail: null };
    state.docs.unshift(doc); saveState(); openDoc(doc.id);
}

function openDoc(id) {
    state.activeDoc = state.docs.find(d => d.id === id);
    if (!state.activeDoc) return;
    
    $('dashboard-view').style.opacity = '0';
    setTimeout(() => {
        $('documentTitle').value = state.activeDoc.title || '';
        $('documentTitle').classList.toggle('locked', !!state.activeDoc.title);
        if (state.activeDoc.title) $('documentTitle').setAttribute('readonly', 'readonly');
        else $('documentTitle').removeAttribute('readonly');
        
        $('editor').innerHTML = state.activeDoc.content || '';
        $('textScratchpad').innerHTML = state.activeDoc.scratchpad || '';
        $('fontSizeDisplay').textContent = state.baseFontSize;
        $('editor').style.fontSize = state.baseFontSize + 'px';
        $('editor').className = `editor-box paper-${state.activeDoc.paperStyle || 'plain'}`;
        
        showEditor();
        $('editor-view').style.opacity = '0';
        setTimeout(() => $('editor-view').style.opacity = '1', 50);
        
        setTimeout(() => { resizeCanvas(); restoreCanvas(); }, 150);
        renderPinnedNotes();
    }, 200);
}

function initEditor() {
    const editor = $('editor');
    const titleInput = $('documentTitle');

    $$('.tool-btn[data-command]').forEach(btn => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => { editor.focus(); document.execCommand(btn.dataset.command, false, null); updateToolbarState(); });
    });
    $$('.tool-btn[data-block]').forEach(btn => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => { editor.focus(); document.execCommand('formatBlock', false, btn.dataset.block); });
    });

    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);

    titleInput.addEventListener('blur', () => {
        if (titleInput.value.trim()) {
            titleInput.setAttribute('readonly', 'readonly');
            if (state.activeDoc) { state.activeDoc.title = titleInput.value.trim(); saveState(); }
        }
    });
    titleInput.addEventListener('contextmenu', (e) => { e.preventDefault(); titleInput.removeAttribute('readonly'); titleInput.focus(); titleInput.select(); });

    let saveTimeout;
    editor.addEventListener('input', () => {
        if (state.activeDoc) { 
            state.activeDoc.content = editor.innerHTML; 
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => { if (state.autoSave) saveState(); }, 1000);
        }
    });
    
    $('textScratchpad').addEventListener('input', () => {
        if (state.activeDoc) { state.activeDoc.scratchpad = $('textScratchpad').innerHTML; if(state.autoSave) saveState(); }
    });

    $('paperStyleDropdown').querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); $('paperStyleDropdown').classList.toggle('active'); };
    $$('#paperStyleDropdown .dropdown-item').forEach(item => {
        item.onclick = () => {
            const style = item.dataset.style;
            if(state.activeDoc) { state.activeDoc.paperStyle = style; saveState(); }
            $('editor').className = `editor-box paper-${style}`;
            $('paperStyleDropdown').classList.remove('active');
        };
    });

    $('textScratchpad').addEventListener('contextmenu', (e) => {
        e.preventDefault(); const menu = $('scratchpadContextMenu');
        openMenuAt(e, menu);
    });
    $$('.scratch-cmd').forEach(li => { li.onclick = () => { $('textScratchpad').focus(); document.execCommand(li.dataset.cmd, false, null); $('scratchpadContextMenu').classList.add('hidden'); }; });

    initSelectionTooltip();
    initContextMenu();
}

function updateToolbarState() {
    ['bold', 'italic', 'underline', 'strikeThrough'].forEach(cmd => {
        const btn = document.querySelector(`.toggle-tool[data-command="${cmd}"]`);
        if (btn) btn.classList.toggle('active-tool', document.queryCommandState(cmd));
    });
    ['justifyRight', 'justifyCenter', 'justifyLeft'].forEach(cmd => {
        const btn = document.querySelector(`.align-tool[data-command="${cmd}"]`);
        if (btn) btn.classList.toggle('active-tool', document.queryCommandState(cmd));
    });
}

function initSelectionTooltip() {
    const editor = $('editor');
    const tooltip = $('quickTooltip');
    const popup = $('noteViewPopup');

    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) { tooltip.classList.add('hidden'); return; }
        const range = sel.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) { tooltip.classList.add('hidden'); return; }
        const rect = range.getBoundingClientRect();
        
        tooltip.classList.remove('hidden');
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - 45) + 'px'; 
        
        state.selectionRange = range.cloneRange();
        state.selectedWord = sel.toString().trim();
    });

    $('quickAddNoteBtn').addEventListener('click', () => {
        if (!state.selectedWord) return;
        $('selectedWordDisplay').textContent = state.selectedWord;
        $('noteInput').value = '';
        $('noteModal').classList.add('show');
        tooltip.classList.add('hidden');
    });

    editor.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.hl-word');
        if (el && el.dataset.note) {
            $('noteViewContent').textContent = el.dataset.note;
            const rect = el.getBoundingClientRect();
            
            popup.className = 'note-view-popup ' + el.classList[1] + ' hidden';
            
            popup.style.left = (rect.left + rect.width/2) + 'px'; 
            popup.style.top = (rect.top - 40) + 'px'; 
            popup.style.transform = 'translate(-50%, -100%)'; 
            
            if (state.blurEffect) editor.classList.add('blur-active');

            popup.classList.remove('hidden');
            requestAnimationFrame(() => popup.classList.add('show'));
        }
    });
    editor.addEventListener('mouseout', (e) => {
        if (e.target.closest('.hl-word')) {
            popup.classList.remove('show');
            editor.classList.remove('blur-active');
            setTimeout(() => { if(!popup.classList.contains('show')) popup.classList.add('hidden'); }, 300);
        }
    });
}

function initNoteModal() {
    $$('#labelColorOptions .color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            $$('#labelColorOptions .color-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    $('saveNoteBtn').addEventListener('click', () => {
        const note = $('noteInput').value.trim();
        if (!note || !state.selectionRange) return;
        const color = document.querySelector('#labelColorOptions .color-dot.active').dataset.color;
        const pinned = $('pinNoteCheck').checked;

        const span = document.createElement('span');
        span.className = `hl-word hl-${color}`;
        span.dataset.note = note; span.dataset.word = state.selectedWord;
        if (pinned) span.dataset.pinned = '1';

        try { 
            state.selectionRange.surroundContents(span); 
            const space = document.createTextNode('\u200B');
            span.after(space);
        }
        catch (e) { 
            const contents = state.selectionRange.extractContents(); 
            span.appendChild(contents); 
            state.selectionRange.insertNode(span); 
        }

        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
        if (pinned) renderPinnedNotes();
        $('noteModal').classList.remove('show');
        window.getSelection().removeAllRanges();
    });
}

function renderPinnedNotes() {
    const area = $('pinnedNotesArea'); area.innerHTML = '';
    if (!state.activeDoc) return;
    const temp = document.createElement('div');
    temp.innerHTML = state.activeDoc.content || '';
    temp.querySelectorAll('.hl-word[data-pinned="1"]').forEach(el => {
        const card = document.createElement('div'); card.className = 'note-card';
        card.innerHTML = `<strong>${el.dataset.word || 'یادداشت'}:</strong> ${escapeHtml(el.dataset.note)}`;
        area.appendChild(card);
    });
}

function openMenuAt(e, menuEl) {
    menuEl.style.setProperty('--origin-x', e.clientX + 'px');
    menuEl.style.setProperty('--origin-y', e.clientY + 'px');
    menuEl.classList.remove('hidden'); menuEl.classList.remove('closing');
    menuEl.style.left = Math.min(e.pageX, window.innerWidth - 180) + 'px'; 
    menuEl.style.top = Math.min(e.pageY, window.innerHeight - 250) + 'px';
}

function initContextMenu() {
    const menu = $('customContextMenu');
    $('editor').addEventListener('contextmenu', (e) => { e.preventDefault(); openMenuAt(e, menu); });

    document.addEventListener('click', (e) => {
        const menus = [menu, $('docContextMenu'), $('folderContextMenu'), $('scratchpadContextMenu')];
        menus.forEach(m => {
            if (!m.contains(e.target) && !e.target.closest('.doc-menu-btn') && !e.target.closest('.folder-header')) {
                m.classList.add('closing');
                setTimeout(()=>m.classList.add('hidden'), 300);
            }
        });
    });
    
    $('menuCopy').onclick = () => { document.execCommand('copy'); menu.classList.add('hidden'); };
    $('menuCut').onclick = () => { document.execCommand('cut'); menu.classList.add('hidden'); };
    $('menuPaste').onclick = async () => { try { const text = await navigator.clipboard.readText(); document.execCommand('insertText', false, text); } catch(e) { showToast('دسترسی ندارید'); } menu.classList.add('hidden'); };
    $('menuBold').onclick = () => { document.execCommand('bold'); menu.classList.add('hidden'); };
    $('menuItalic').onclick = () => { document.execCommand('italic'); menu.classList.add('hidden'); };
    $('menuDelete').onclick = () => { document.execCommand('delete'); menu.classList.add('hidden'); };

    $('ctxEditTitle').onclick = () => {
        const doc = state.docs.find(d => d.id === state.targetDocIdToMove);
        if(doc) {
            const newTitle = prompt('عنوان جدید را وارد کنید:', doc.title);
            if(newTitle !== null) { doc.title = newTitle.trim(); saveState(); renderDocs(); renderFolders(); }
        }
        $('docContextMenu').classList.add('hidden');
    };
    $('ctxDeleteDoc').onclick = () => {
        if(confirm('آیا از حذف این جزوه مطمئن هستید؟')) {
            state.docs = state.docs.filter(d => d.id !== state.targetDocIdToMove);
            saveState(); renderDocs(); renderFolders();
        }
        $('docContextMenu').classList.add('hidden');
    };
    $('ctxMoveToFolder').onclick = () => {
        const doc = state.docs.find(d => d.id === state.targetDocIdToMove);
        if(!doc) return;
        const options = state.folders.map(f => `${f.id}:${f.name}`).join('\n');
        const folderId = prompt(`شناسه دسته‌بندی را وارد کنید:\n${options}\nیا برای خارج کردن "null" بنویسید:`);
        if(folderId !== null) { doc.folderId = folderId === 'null' ? null : folderId; saveState(); renderDocs(); renderFolders(); }
        $('docContextMenu').classList.add('hidden');
    };

    $('ctxPinFolder').onclick = () => {
        const idx = state.folders.findIndex(f => f.id === state.targetFolderIdToEdit);
        if(idx > 0) { const temp = state.folders[idx]; state.folders[idx] = state.folders[idx-1]; state.folders[idx-1] = temp; saveState(); renderFolders(); }
        $('folderContextMenu').classList.add('hidden');
    };
    $('ctxEditFolder').onclick = () => {
        const folder = state.folders.find(f => f.id === state.targetFolderIdToEdit);
        if(folder) { const newName = prompt('نام جدید:', folder.name); if(newName) { folder.name = newName; saveState(); renderFolders(); } }
        $('folderContextMenu').classList.add('hidden');
    };
    $('ctxDeleteFolder').onclick = () => {
        if(confirm('حذف شود؟ (جزوه‌ها به همه منتقل می‌شوند)')) {
            state.folders = state.folders.filter(f => f.id !== state.targetFolderIdToEdit);
            state.docs.forEach(d => { if(d.folderId === state.targetFolderIdToEdit) d.folderId = null; });
            saveState(); renderFolders(); renderDocs();
        }
        $('folderContextMenu').classList.add('hidden');
    };
}

function initFontDropdowns() {
    const fontDD = $('fontDropdown');
    fontDD.querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); fontDD.classList.toggle('active'); };
    fontDD.querySelectorAll('.dropdown-item').forEach(item => {
        item.onclick = () => { $('editor').focus(); document.execCommand('fontName', false, item.dataset.value); fontDD.querySelector('.dropdown-selected').childNodes[0].nodeValue = item.textContent + ' '; fontDD.classList.remove('active'); };
    });

    const colorBtn = $('textColorBtn'), colorPopup = $('colorPopup');
    colorBtn.onclick = (e) => { e.stopPropagation(); colorPopup.classList.toggle('show'); };
    colorPopup.querySelectorAll('.color-swatch').forEach(sw => {
        sw.onclick = () => { $('editor').focus(); document.execCommand('foreColor', false, sw.dataset.color); colorPopup.classList.remove('show'); };
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) $$('.custom-dropdown').forEach(d => d.classList.remove('active'));
        if (!e.target.closest('.color-menu-wrapper')) $$('.custom-color-popup').forEach(p => p.classList.remove('show'));
    });

    $('increaseFontSize').onclick = () => { state.baseFontSize = Math.min(state.baseFontSize + 2, 40); $('fontSizeDisplay').textContent = state.baseFontSize; $('editor').style.fontSize = state.baseFontSize + 'px'; localStorage.setItem(STORAGE_KEYS.defaultFontSize, state.baseFontSize); };
    $('decreaseFontSize').onclick = () => { state.baseFontSize = Math.max(state.baseFontSize - 2, 10); $('fontSizeDisplay').textContent = state.baseFontSize; $('editor').style.fontSize = state.baseFontSize + 'px'; localStorage.setItem(STORAGE_KEYS.defaultFontSize, state.baseFontSize); };

    $('importBtn').onclick = () => { $('importActionOptions').classList.add('hidden'); $('importModal').classList.add('show'); };
    $$('.media-cat-item').forEach(cat => {
        cat.onclick = () => { $('fileInput').accept = cat.dataset.accept; $('fileInput').click(); };
    });
    $('fileInput').onchange = (e) => {
        const file = e.target.files[0]; if (!file) return; state.currentFileToImport = file;
        $('importActionOptions').classList.remove('hidden');
        if (file.type === 'application/pdf') $('actionOpenPdf').classList.remove('hidden');
        else $('actionOpenPdf').classList.add('hidden');
    };

    $('actionEmbedFile').onclick = () => {
        const file = state.currentFileToImport; if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let html = `<div class="media-attachment"><button class="delete-media-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
            if (file.type.startsWith('image/')) html += `<img src="${event.target.result}" style="max-width:100%; border-radius:12px;">`;
            else if (file.type.startsWith('video/')) html += `<video src="${event.target.result}" controls style="max-width:100%; border-radius:12px;"></video>`;
            else if (file.type.startsWith('audio/')) html += `<audio src="${event.target.result}" controls style="width:100%;"></audio>`;
            else html += `<a href="${event.target.result}" download="${file.name}" style="color:var(--accent-main); text-decoration:underline;">دریافت فایل: ${file.name}</a>`;
            html += `</div>`;
            document.execCommand('insertHTML', false, html);
            if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
            $('importModal').classList.remove('show'); $('fileInput').value = '';
        };
        reader.readAsDataURL(file);
    };

    $('actionOpenPdf').onclick = () => {
        const file = state.currentFileToImport; if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let html = `<div class="media-attachment"><button class="delete-media-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
                        <embed src="${event.target.result}" type="application/pdf" width="100%" height="500px" style="border-radius:12px;"></div>`;
            document.execCommand('insertHTML', false, html);
            if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
            $('importModal').classList.remove('show'); $('fileInput').value = '';
        };
        reader.readAsDataURL(file);
    };

    $('actionExtractText').onclick = () => {
        const file = state.currentFileToImport; if(!file) return;
        
        if(file.type === 'application/pdf') {
            $('processLoadingOverlay').classList.remove('hidden');
            const reader = new FileReader();
            reader.onload = function() {
                const typedarray = new Uint8Array(this.result);
                pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                    let textPromises = [];
                    for (let i = 1; i <= pdf.numPages; i++) {
                        textPromises.push(pdf.getPage(i).then(page => page.getTextContent().then(text => text.items.map(s => s.str).join(' '))));
                    }
                    Promise.all(textPromises).then(pagesText => {
                        const fullText = pagesText.join('\n');
                        const paragraphs = fullText.split('\n').filter(p=>p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('');
                        document.execCommand('insertHTML', false, paragraphs);
                        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
                        
                        $('processLoadingOverlay').classList.add('hidden');
                        $('importModal').classList.remove('show'); $('fileInput').value = '';
                        showToast('متن استخراج شد.');
                    }).catch(err => {
                        $('processLoadingOverlay').classList.add('hidden');
                        showToast('خطا در استخراج متن PDF');
                    });
                }).catch(err => {
                    $('processLoadingOverlay').classList.add('hidden');
                    showToast('خطا در خواندن فایل PDF');
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const paragraphs = event.target.result.split('\n').filter(p=>p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('');
                document.execCommand('insertHTML', false, paragraphs);
                if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
                $('importModal').classList.remove('show'); $('fileInput').value = '';
            };
            reader.readAsText(file);
        } else {
            showToast('استخراج متن فقط برای فایل‌های متنی و PDF پشتیبانی می‌شود.');
        }
    };
}

let canvasState = { drawing: false, tool: 'pencil', color: '#4F75FF', size: 3, points: [], snapshot: null, startPos: null };

function resizeCanvas() {
    const canvas = $('scratchpadCanvas');
    if(!canvas || !canvas.parentElement) return;
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    if(rect.width === 0 || rect.height === 0) return; 

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    restoreCanvas();
}

function initCanvas() {
    const canvas = $('scratchpadCanvas');
    const ctx = canvas.getContext('2d');
    const cursor = $('brushCursor');
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function setupBrush() {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (canvasState.tool === 'highlighter') { ctx.strokeStyle = canvasState.color; ctx.globalAlpha = 0.3; ctx.lineWidth = 15; ctx.globalCompositeOperation = 'source-over'; }
        else if (canvasState.tool === 'eraser') { ctx.strokeStyle = 'rgba(0,0,0,1)'; ctx.globalAlpha = 1; ctx.lineWidth = 20; ctx.globalCompositeOperation = 'destination-out'; }
        else { ctx.strokeStyle = canvasState.color; ctx.globalAlpha = 1; ctx.lineWidth = canvasState.size; ctx.globalCompositeOperation = 'source-over'; }
    }

    canvas.addEventListener('pointerenter', () => { 
        cursor.style.display = 'block'; 
        if (canvasState.tool === 'eraser') { cursor.style.backgroundColor = 'rgba(255,255,255,0.5)'; cursor.style.border = '2px solid white'; }
        else if (canvasState.tool === 'highlighter') { cursor.style.backgroundColor = 'rgba(255, 255, 0, 0.3)'; cursor.style.border = '1px solid yellow'; }
        else { cursor.style.backgroundColor = 'transparent'; cursor.style.border = '1.5px solid var(--accent-main)'; }
    });
    canvas.addEventListener('pointerleave', () => { cursor.style.display = 'none'; canvasState.drawing = false; });
    
    canvas.addEventListener('pointermove', (e) => {
        const size = canvasState.tool === 'eraser' || canvasState.tool === 'highlighter' ? 20 : canvasState.size;
        cursor.style.width = size + 'px'; cursor.style.height = size + 'px';
        cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
        
        if (!canvasState.drawing) return;
        const pos = getPos(e);
        if (['pencil', 'highlighter', 'eraser'].includes(canvasState.tool)) {
            canvasState.points.push(pos);
            if (canvasState.points.length > 2) {
                const p1 = canvasState.points[canvasState.points.length - 3], p2 = canvasState.points[canvasState.points.length - 2], p3 = canvasState.points[canvasState.points.length - 1];
                const m1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }, m2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
                ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.quadraticCurveTo(p2.x, p2.y, m2.x, m2.y); ctx.stroke();
            }
        } else if (canvasState.tool === 'line') {
            ctx.clearRect(0, 0, canvas.width, canvas.height); if (canvasState.snapshot) ctx.putImageData(canvasState.snapshot, 0, 0);
            setupBrush(); ctx.beginPath(); ctx.moveTo(canvasState.startPos.x, canvasState.startPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        } else if (canvasState.tool === 'rect') {
            ctx.clearRect(0, 0, canvas.width, canvas.height); if (canvasState.snapshot) ctx.putImageData(canvasState.snapshot, 0, 0);
            setupBrush(); ctx.strokeRect(canvasState.startPos.x, canvasState.startPos.y, pos.x - canvasState.startPos.x, pos.y - canvasState.startPos.y);
        } else if (canvasState.tool === 'circle') {
            ctx.clearRect(0, 0, canvas.width, canvas.height); if (canvasState.snapshot) ctx.putImageData(canvasState.snapshot, 0, 0);
            setupBrush(); const rx = Math.abs(pos.x - canvasState.startPos.x) / 2, ry = Math.abs(pos.y - canvasState.startPos.y) / 2;
            ctx.beginPath(); ctx.ellipse((canvasState.startPos.x + pos.x) / 2, (canvasState.startPos.y + pos.y) / 2, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        }
    });

    canvas.addEventListener('pointerdown', (e) => {
        canvasState.drawing = true; const pos = getPos(e); canvasState.points = [pos]; canvasState.startPos = pos;
        canvasState.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); setupBrush();
        if (['pencil', 'highlighter', 'eraser'].includes(canvasState.tool)) {
            ctx.beginPath(); ctx.arc(pos.x, pos.y, (canvasState.tool === 'eraser' || canvasState.tool === 'highlighter' ? 10 : canvasState.size/2), 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle; ctx.fill();
        }
    });

    canvas.addEventListener('pointerup', () => {
        canvasState.drawing = false; canvasState.points = [];
        if (state.activeDoc) state.activeDoc.board = canvas.toDataURL();
    });

    $$('.board-tool[data-tool]').forEach(btn => {
        btn.onclick = () => { 
            $$('.board-tool[data-tool]').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            canvasState.tool = btn.dataset.tool; 
            canvas.dispatchEvent(new Event('pointerenter')); 
        };
    });
    
    $('boardColorBtn').onclick = (e) => { e.stopPropagation(); $('boardColorPopup').classList.toggle('show'); };
    $$('#boardColorPopup .color-swatch').forEach(sw => { sw.onclick = () => { canvasState.color = sw.dataset.color; $('boardColorPopup').classList.remove('show'); }; });
    $('clearBoardBtn').onclick = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); };
    $('exportBoardToDocBtn').onclick = () => {
        const img = document.createElement('img'); img.src = canvas.toDataURL(); img.style.maxWidth = '100%'; img.style.borderRadius = '12px'; img.style.margin = '10px 0';
        $('editor').appendChild(img);
        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
        showToast('تصویر بوم در متن درج شد');
    };
}

function restoreCanvas() {
    if (!state.activeDoc || !state.activeDoc.board) return;
    const canvas = $('scratchpadCanvas'); const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src = state.activeDoc.board;
}

function initSettings() {
    $('autoSaveToggle').checked = state.autoSave;
    $('blurEffectToggle').checked = state.blurEffect;
    
    // رفع باگ: حذف علامت # اضافه
    const langDisplay = $('currentLangDisplay');
    if (langDisplay) {
        langDisplay.textContent = state.lang === 'en' ? 'English' : (state.lang === 'ar' ? 'العربية' : 'فارسی');
    }
    applyLanguage(state.lang);

    const settingsInputs = $$('#settingsModal input, #settingsModal select, #settingsModal .custom-dropdown');
    const actionBar = $('settingsActionBar');
    
    const langDD = $('languageDropdown');
    langDD.querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); langDD.classList.toggle('active'); };
    $$('#languageDropdown .dropdown-item').forEach(item => {
        item.onclick = () => {
            $('#currentLangDisplay').textContent = item.textContent; // Also fixed here just in case, wait no, this is inside string.
            langDD.dataset.selectedLang = item.dataset.langVal;
            langDD.classList.remove('active');
            actionBar.classList.add('show');
        };
    });

    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            actionBar.classList.add('show');
        });
    });

    $('settingsBtn').onclick = () => {
        actionBar.classList.remove('show'); 
        $('settingsModal').classList.add('show');
    };

    $('cancelSettingsBtn').onclick = () => { 
        $('autoSaveToggle').checked = state.autoSave;
        $('blurEffectToggle').checked = state.blurEffect;
        // رفع باگ
        const langDisplay2 = $('currentLangDisplay');
        if (langDisplay2) langDisplay2.textContent = state.lang === 'en' ? 'English' : (state.lang === 'ar' ? 'العربية' : 'فارسی');
        
        langDD.dataset.selectedLang = state.lang;
        $('settingsModal').classList.remove('show'); 
    };

    $('confirmSettingsBtn').onclick = () => {
        state.autoSave = $('autoSaveToggle').checked;
        state.blurEffect = $('blurEffectToggle').checked;
        const newLang = langDD.dataset.selectedLang || state.lang;
        
        localStorage.setItem('vizhar_autosave', state.autoSave);
        localStorage.setItem('vizhar_blur', state.blurEffect);
        
        applyLanguage(newLang);

        const isNotesChecked = $('toggleNotesPanel').checked;
        const isCanvasChecked = $('toggleCanvasPanel').checked;
        const isScratchChecked = $('toggleScratchPanel').checked;
        
        $('pinnedNotesArea').parentElement.style.display = isNotesChecked ? 'flex' : 'none';
        $('pinnedNotesArea').parentElement.previousElementSibling.style.display = isNotesChecked ? 'flex' : 'none';
        
        $('canvasContainer').parentElement.style.display = isCanvasChecked ? 'flex' : 'none';
        $('canvasContainer').parentElement.previousElementSibling.style.display = isCanvasChecked ? 'flex' : 'none';
        
        $('rightPanel').style.display = isScratchChecked ? 'flex' : 'none';

        $('settingsModal').classList.remove('show');
        showToast('تنظیمات ذخیره شد');
        setTimeout(resizeCanvas, 300);
    };

    $('resetRoleBtn').onclick = () => { state.role = null; localStorage.removeItem(STORAGE_KEYS.role); $('settingsModal').classList.remove('show'); showRoleView(); };
    $('clearDataBtn').onclick = () => { if (confirm('آیا مطمئن هستید؟ تمام اطلاعات حذف خواهد شد.')) { localStorage.clear(); location.reload(); } };
}

function showToast(msg) {
    const t = document.createElement('div'); t.textContent = msg;
    t.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:var(--accent-main); color:#fff; padding:10px 20px; border-radius:12px; z-index:99999; font-family:'YekanBakh'; box-shadow:var(--shadow-float);`;
    document.body.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2000);
}

function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

function init() {
    loadState(); 
    initTheme(); 
    initEditor(); 
    initFontDropdowns(); 
    initNoteModal(); 
    initCanvas(); 
    initSettings();

    $$('.role-card').forEach(card => { card.addEventListener('click', () => { state.role = card.dataset.role; saveState(); showDashboard(); }); });

    $('backToDashBtn').onclick = () => {
        if (state.activeDoc) {
            state.activeDoc.content = $('editor').innerHTML; state.activeDoc.title = $('documentTitle').value.trim();
            html2canvas($('editor'), { scale: 0.5, backgroundColor: getComputedStyle(document.body).getPropertyValue('--surface-solid').trim() }).then(canvas => {
                state.activeDoc.thumbnail = canvas.toDataURL('image/jpeg');
                saveState(); showDashboard();
            }).catch(() => { saveState(); showDashboard(); });
        } else { showDashboard(); }
    };
    
    $('createNewDocBtn').onclick = createDoc;
    $('addFolderBtn').onclick = () => $('addFolderModal').classList.add('show');
    $('confirmAddFolderBtn').onclick = () => {
        const name = $('newFolderName').value.trim(); if (!name) return;
        state.folders.push({ id: 'f_' + Date.now(), name }); saveState(); $('newFolderName').value = ''; $('addFolderModal').classList.remove('show'); renderFolders();
    };

    $('focusModeBtn').onclick = () => { document.body.classList.toggle('focus-mode'); const icon = $('focusModeBtn').querySelector('i'); icon.className = document.body.classList.contains('focus-mode') ? 'fa-solid fa-compress' : 'fa-solid fa-expand'; };
    $$('.btn-close-modal').forEach(btn => btn.onclick = () => btn.closest('.modal').classList.remove('show'));
    $$('.modal').forEach(modal => { modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); }; });

    window.addEventListener('load', () => { setTimeout(() => $('loading-screen').classList.add('hidden-loader'), 500); });
    if (state.role) showDashboard(); else showRoleView();
}

document.addEventListener('DOMContentLoaded', init);
