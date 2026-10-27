const STORAGE_KEYS = { 
    role: 'vizhar_role', docs: 'vizhar_docs', folders: 'vizhar_folders', 
    theme: 'vizhar_theme', defaultFontSize: 'vizhar_default_fs', language: 'vizhar_lang' 
};

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let state = {
    role: null, folders: [], docs: [], activeFolder: 'all', activeDoc: null,
    selectionRange: null, selectedWord: '', autoSave: true, blurEffect: true, baseFontSize: 16,
    targetDocIdToMove: null, targetFolderIdToEdit: null, currentFileToImport: null,
    lang: 'fa', scratchFontSize: 16
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const i18n = {
    fa: {
        "role-student": "دانشجو / دانش‌آموز", "role-teacher": "استاد / معلم",
        "panel-left": "یادداشت و بوم", "panel-right": "چرک‌نویس",
        "welcome-title": "به <span>ویژار</span> خوش آمدید", "welcome-subtitle": "جهت تنظیم محیط، نقش خود را انتخاب کنید",
        "folders": "دسته‌بندی‌ها", "my-notes": "جزوه‌های من", "create-note": "ایجاد جزوه", "empty-state": "هیچ جزوه‌ای در اینجا یافت نشد.",
        "notes-panel": "یادداشت", "canvas-panel": "بوم", "scratch-panel": "چرک‌نویس", "btn-insert": "درج در متن",
        "btn-import": "رسانه", "btn-export": "دریافت", "font": "فونت", "paper-style": "بافت کاغذ",
        "add-note": "افزودن یادداشت", "copy": "رونوشت", "cut": "برش", "paste": "چسباندن",
        "bold": "درشت‌نویسی", "italic": "مورب", "underline": "زیرخط", "list": "فهرست", "delete": "حذف",
        "edit-title": "ویرایش عنوان", "move-to": "انتقال به دسته‌بندی", "delete-note": "حذف جزوه",
        "pin-folder": "سنجاق به بالا", "unpin-folder": "برداشتن سنجاق", "edit-folder": "تغییر نام",
        "note-for": "یادداشت برای:", "label-color": "دسته‌بندی رنگ:", "pin-note": "سنجاق در پنل یادداشت‌ها",
        "cancel": "انصراف", "save": "ثبت", "create": "ایجاد", "new-folder": "دسته‌بندی جدید",
        "add-media": "افزودن به جزوه", "select-media-type": "نوع رسانه خود را انتخاب کنید",
        "image": "تصویر", "pdf": "پی‌دی‌اف", "audio": "صدا", "video": "ویدیو", "text": "متن",
        "select-action": "اقدام مورد نظر را انتخاب کنید:", "extract-text": "استخراج متن (متنی و PDF)",
        "embed-file": "پیوست به عنوان فایل دانلودی", "open-pdf": "باز کردن در پی‌دی‌اف‌خوان", "back": "بازگشت",
        "settings-title": "پیکربندی", "settings-theme": "پوسته ظاهری", "settings-lang": "زبان برنامه",
        "settings-autosave": "ذخیره خودکار", "settings-blur": "محو کردن هنگام هاور نکات",
        "settings-notes-panel": "پنل یادداشت‌ها", "settings-canvas-panel": "پنل بوم نقاشی", "settings-scratch-panel": "پنل چرک‌نویس",
        "btn-confirm": "تایید تغییرات", "btn-cancel": "انصراف", "btn-reset-role": "انتخاب مجدد نقش", "btn-clear-data": "حذف تمام داده‌ها",
        "placeholder-title": "عنوان جزوه...", "placeholder-editor": "اینجا بنویسید...", "placeholder-scratch": "ایده‌ها و متن‌های موقت...",
        "word-count": "کلمه", "saved": "با موفقیت ذخیره شد", "processing": "در حال پردازش...", "drop-file": "فایل را اینجا رها کنید",
        "confirm-delete-doc": "آیا از حذف این جزوه مطمئن هستید؟", "confirm-delete-folder": "آیا از حذف این دسته‌بندی مطمئن هستید؟", "yes": "بله", "no": "خیر"
    },
    en: {
        "role-student": "Student", "role-teacher": "Teacher",
        "panel-left": "Notes & Canvas", "panel-right": "Scratchpad",
        "welcome-title": "Welcome to <span>Vizhar</span>", "welcome-subtitle": "Select your role to configure the environment",
        "folders": "Categories", "my-notes": "My Notes", "create-note": "Create Note", "empty-state": "No notes found here.",
        "notes-panel": "Notes", "canvas-panel": "Canvas", "scratch-panel": "Scratchpad", "btn-insert": "Insert",
        "btn-import": "Media", "btn-export": "Export", "font": "Font", "paper-style": "Paper Style",
        "add-note": "Add Note", "copy": "Copy", "cut": "Cut", "paste": "Paste",
        "bold": "Bold", "italic": "Italic", "underline": "Underline", "list": "List", "delete": "Delete",
        "edit-title": "Edit Title", "move-to": "Move to Category", "delete-note": "Delete Note",
        "pin-folder": "Pin to Top", "unpin-folder": "Unpin", "edit-folder": "Rename",
        "note-for": "Note for:", "label-color": "Label Color:", "pin-note": "Pin in Notes Panel",
        "cancel": "Cancel", "save": "Save", "create": "Create", "new-folder": "New Category",
        "add-media": "Add to Note", "select-media-type": "Select media type",
        "image": "Image", "pdf": "PDF", "audio": "Audio", "video": "Video", "text": "Text",
        "select-action": "Select an action:", "extract-text": "Extract Text (Text & PDF)",
        "embed-file": "Embed as downloadable file", "open-pdf": "Open in PDF Reader", "back": "Back",
        "settings-title": "Settings", "settings-theme": "Appearance", "settings-lang": "Language",
        "settings-autosave": "Auto Save", "settings-blur": "Blur Background on Note Hover",
        "settings-notes-panel": "Notes Panel", "settings-canvas-panel": "Canvas Panel", "settings-scratch-panel": "Scratchpad Panel",
        "btn-confirm": "Apply Changes", "btn-cancel": "Cancel", "btn-reset-role": "Reset Role", "btn-clear-data": "Clear All Data",
        "placeholder-title": "Note Title...", "placeholder-editor": "Type here...", "placeholder-scratch": "Ideas and drafts...",
        "word-count": "words", "saved": "Saved successfully", "processing": "Processing...", "drop-file": "Drop file here",
        "confirm-delete-doc": "Are you sure you want to delete this note?", "confirm-delete-folder": "Are you sure you want to delete this category?", "yes": "Yes", "no": "No"
    },
    ar: {
        "role-student": "طالب", "role-teacher": "أستاذ",
        "panel-left": "اللوحة والملاحظات", "panel-right": "مسودة",
        "welcome-title": "مرحبًا بك في <span>فيژار</span>", "welcome-subtitle": "حدد دورك لتهيئة البيئة",
        "folders": "الفئات", "my-notes": "ملاحظاتي", "create-note": "إنشاء ملاحظة", "empty-state": "لم يتم العثور على ملاحظات هنا.",
        "notes-panel": "ملاحظات", "canvas-panel": "لوحة", "scratch-panel": "مسودة", "btn-insert": "إدراج",
        "btn-import": "وسائط", "btn-export": "تصدير", "font": "خط", "paper-style": "نمط الورق",
        "add-note": "إضافة ملاحظة", "copy": "نسخ", "cut": "قص", "paste": "لصق",
        "bold": "غامق", "italic": "مائل", "underline": "تحته خط", "list": "قائمة", "delete": "حذف",
        "edit-title": "تعديل العنوان", "move-to": "نقل إلى فئة", "delete-note": "حذف الملاحظة",
        "pin-folder": "تثبيت في الأعلى", "unpin-folder": "إلغاء التثبيت", "edit-folder": "تغيير الاسم",
        "note-for": "ملاحظة لـ:", "label-color": "لون التصنيف:", "pin-note": "تثبيت في لوحة الملاحظات",
        "cancel": "إلغاء", "save": "حفظ", "create": "إنشاء", "new-folder": "فئة جديدة",
        "add-media": "إضافة إلى الملاحظة", "select-media-type": "حدد نوع الوسائط",
        "image": "صورة", "pdf": "بي دي إف", "audio": "صوت", "video": "فيديو", "text": "نص",
        "select-action": "حدد إجراءً:", "extract-text": "استخراج النص",
        "embed-file": "تضمين كملف للتحميل", "open-pdf": "فتح في قارئ PDF", "back": "رجوع",
        "settings-title": "الإعدادات", "settings-theme": "المظهر", "settings-lang": "اللغة",
        "settings-autosave": "حفظ تلقائي", "settings-blur": "تمويه عند التمرير على الملاحظات",
        "settings-notes-panel": "لوحة الملاحظات", "settings-canvas-panel": "لوحة الرسم", "settings-scratch-panel": "لوحة المسودة",
        "btn-confirm": "تطبيق التغييرات", "btn-cancel": "إلغاء", "btn-reset-role": "إعادة اختيار الدور", "btn-clear-data": "حذف جميع البيانات",
        "placeholder-title": "عنوان الملاحظة...", "placeholder-editor": "اكتب هنا...", "placeholder-scratch": "أفكار ومسودات...",
        "word-count": "كلمة", "saved": "تم الحفظ بنجاح", "processing": "جاري المعالجة...", "drop-file": "أفلت الملف هنا",
        "confirm-delete-doc": "هل أنت متأكد من حذف هذه الملاحظة؟", "confirm-delete-folder": "هل أنت متأكد من حذف هذه الفئة؟", "yes": "نعم", "no": "لا"
    }
};

function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem(STORAGE_KEYS.language, lang);
    document.documentElement.dir = (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';
    
    if (!i18n[lang]) lang = 'fa';

    $$('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (i18n[lang] && i18n[lang][key]) {
            if(el.tagName === 'H2' && key === 'welcome-title') el.innerHTML = i18n[lang][key];
            else el.textContent = i18n[lang][key];
        }
    });
    
    if($('documentTitle')) $('documentTitle').placeholder = i18n[lang]["placeholder-title"];
    if($('editor')) $('editor').setAttribute('placeholder', i18n[lang]["placeholder-editor"]);
    if($('textScratchpad')) $('textScratchpad').setAttribute('placeholder', i18n[lang]["placeholder-scratch"]);
    
    const langDisplay = $('currentLangDisplay');
    if (langDisplay) langDisplay.textContent = lang === 'en' ? 'English' : (lang === 'ar' ? 'العربية' : 'فارسی');
    updateWordCount();
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
    
    $$('#themeToggle button').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            $$('#themeToggle button').forEach(btn => btn.classList.remove('active'));
            b.classList.add('active');
            
            const actionBar = $('settingsActionBar');
            if(actionBar) actionBar.classList.add('show');
        });
    });
}

function showRoleView() {
    if($('role-view')) $('role-view').classList.remove('hidden'); 
    if($('dashboard-view')) $('dashboard-view').classList.add('hidden'); 
    if($('editor-view')) $('editor-view').classList.add('hidden');
    if($('backToDashBtn')) $('backToDashBtn').classList.add('hidden'); 
    $$('.action-nav').forEach(el => el.classList.add('hidden')); 
    if($('userRoleBadge')) $('userRoleBadge').classList.add('hidden');
    const panelToggles = document.querySelector('.panel-toggles');
    if(panelToggles) panelToggles.classList.add('hidden');
}

function showDashboard() {
    if($('role-view')) $('role-view').classList.add('hidden'); 
    if($('dashboard-view')) $('dashboard-view').classList.remove('hidden'); 
    if($('editor-view')) $('editor-view').classList.add('hidden');
    if($('backToDashBtn')) $('backToDashBtn').classList.add('hidden'); 
    $$('.action-nav').forEach(el => el.classList.add('hidden'));
    
    if($('userRoleBadge')) {
        $('userRoleBadge').classList.remove('hidden'); 
        $('userRoleBadge').textContent = state.role === 'teacher' ? i18n[state.lang]["role-teacher"] : i18n[state.lang]["role-student"];
    }
    
    if($('dashboard-view')) $('dashboard-view').style.opacity = '1';
    
    renderFolders(); 
    renderDocs();
    
    const panelToggles = document.querySelector('.panel-toggles');
    if(panelToggles) panelToggles.classList.add('hidden');
}

function showEditor() {
    if($('role-view')) $('role-view').classList.add('hidden'); 
    if($('dashboard-view')) $('dashboard-view').classList.add('hidden'); 
    if($('editor-view')) $('editor-view').classList.remove('hidden');
    if($('backToDashBtn')) $('backToDashBtn').classList.remove('hidden'); 
    $$('.action-nav').forEach(el => el.classList.remove('hidden'));
    if($('editor-view')) $('editor-view').style.opacity = '1';
    
    const panelToggles = document.querySelector('.panel-toggles');
    if(panelToggles) panelToggles.classList.remove('hidden');
}

function renderFolders() {
    const list = $('folderList'); if(!list) return;
    list.innerHTML = '';
    const allLi = document.createElement('li'); allLi.className = 'folder-item';
    allLi.innerHTML = `<div class="folder-header ${state.activeFolder === 'all' ? 'active' : ''}" data-id="all"><div class="folder-title-wrap ${state.activeFolder === 'all' ? 'active' : ''}"><i class="fa-solid fa-inbox"></i> ${state.lang==='fa'?'همه جزوه‌ها':(state.lang==='ar'?'جميع الملاحظات':'All Notes')}</div></div>`;
    allLi.querySelector('.folder-title-wrap').onclick = () => { state.activeFolder = 'all'; renderFolders(); renderDocs(); };
    list.appendChild(allLi);

    state.folders.forEach(f => {
        const li = document.createElement('li'); 
        li.className = 'folder-item' + (f.pinned ? ' pinned' : '');
        
        const folderDocs = state.docs.filter(d => d.folderId === f.id);
        const isOpen = state.activeFolder === f.id;
        
        li.innerHTML = `
            <div class="folder-header ${isOpen ? 'active open' : ''}" data-id="${f.id}">
                <div class="folder-title-wrap ${isOpen ? 'active' : ''}">
                    <i class="fa-solid fa-folder"></i> ${escapeHtml(f.name)}
                    ${f.pinned ? '<i class="fa-solid fa-thumbtack pin-icon"></i>' : ''}
                </div>
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
            e.preventDefault(); 
            state.targetFolderIdToEdit = f.id;
            // تنظیم متن پین
            const targetFolder = state.folders.find(x => x.id === f.id);
            $('pinFolderText').textContent = targetFolder.pinned ? i18n[state.lang]["unpin-folder"] : i18n[state.lang]["pin-folder"];
            openMenuAt(e, $('folderContextMenu'));
        };

        li.querySelectorAll('.folder-doc-item').forEach(item => { item.onclick = () => openDoc(item.dataset.docId); });
        list.appendChild(li);
    });
}

function renderDocs() {
    const grid = $('documentsGrid'); if(!grid) return;
    grid.innerHTML = '';
    let docs = state.docs;
    if (state.activeFolder !== 'all') docs = docs.filter(d => d.folderId === state.activeFolder);

    if (docs.length === 0) { if($('emptyState')) $('emptyState').classList.remove('hidden'); return; }
    if($('emptyState')) $('emptyState').classList.add('hidden');

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
            openMenuAt(e, $('docContextMenu'));
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
    
    history.pushState({ view: 'editor', docId: id }, '', '#editor');

    if($('dashboard-view')) $('dashboard-view').style.opacity = '0';
    setTimeout(() => {
        if($('documentTitle')) {
            $('documentTitle').value = state.activeDoc.title || '';
            $('documentTitle').classList.toggle('locked', !!state.activeDoc.title);
            if (state.activeDoc.title) $('documentTitle').setAttribute('readonly', 'readonly');
            else $('documentTitle').removeAttribute('readonly');
        }
        
        if($('editor')) {
            $('editor').innerHTML = state.activeDoc.content || '';
            $('editor').style.fontSize = state.baseFontSize + 'px';
            $('editor').className = `editor-box paper-${state.activeDoc.paperStyle || 'plain'}`;
        }
        if($('textScratchpad')) $('textScratchpad').innerHTML = state.activeDoc.scratchpad || '';
        if($('fontSizeDisplay')) $('fontSizeDisplay').textContent = state.baseFontSize;
        
        showEditor();
        if($('editor-view')) $('editor-view').style.opacity = '0';
        setTimeout(() => { if($('editor-view')) $('editor-view').style.opacity = '1'; }, 50);
        
        setTimeout(() => { resizeCanvas(); restoreCanvas(); updateWordCount(); }, 150);
        renderPinnedNotes();
    }, 200);
}

function updateWordCount() {
    if(!$('editor') || !$('wordCounter')) return;
    const text = $('editor').innerText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const wordStr = i18n[state.lang]["word-count"];
    $('wordCounter').textContent = words.toLocaleString(state.lang === 'fa' ? 'fa-IR' : 'en-US') + ' ' + wordStr;
}

function changeFontSize(delta) {
    const sel = window.getSelection();
    if (!sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let currentSize = state.baseFontSize;
        // پیدا کردن سایز فونت فعلی
        const parentEl = range.commonAncestorContainer.parentElement;
        if (parentEl && parentEl.style.fontSize) {
            currentSize = parseInt(parentEl.style.fontSize);
        }
        
        const newSize = currentSize + delta;
        if (newSize < 10 || newSize > 60) return; // محدودیت سایز

        const span = document.createElement('span');
        span.style.fontSize = newSize + 'px';
        span.appendChild(range.extractContents());
        range.insertNode(span);
    } else {
        // اگر متنی انتخاب نشده بود، سایز کلی تغییر کند
        state.baseFontSize = Math.max(10, Math.min(state.baseFontSize + delta, 60));
        $('editor').style.fontSize = state.baseFontSize + 'px';
        $('fontSizeDisplay').textContent = state.baseFontSize;
        localStorage.setItem(STORAGE_KEYS.defaultFontSize, state.baseFontSize);
    }
}

function initEditor() {
    const editor = $('editor');
    const titleInput = $('documentTitle');
    if(!editor || !titleInput) return;

    $$('.tool-btn[data-command]').forEach(btn => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => { 
            editor.focus(); 
            if(btn.dataset.command === 'hiliteColor') {
                document.execCommand('hiliteColor', false, 'rgba(234, 179, 8, 0.5)'); 
            } else {
                document.execCommand(btn.dataset.command, false, null); 
            }
            updateToolbarState(); 
        });
    });
    
    $$('.tool-btn[data-block]').forEach(btn => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => { 
            editor.focus(); 
            document.execCommand('formatBlock', false, btn.dataset.block); 
        });
    });

    // دکمه های جهت
    if($('ltrBtn')) {
        $('ltrBtn').addEventListener('mousedown', (e) => e.preventDefault());
        $('ltrBtn').addEventListener('click', () => { 
            editor.focus(); 
            document.execCommand('styleWithCSS', false, true); // اجبار به استفاده از CSS
            document.execCommand('justifyLeft'); 
            document.execCommand('outdent'); // برای درست شدن جهت در ادیتور
        });
    }
    if($('rtlBtn')) {
        $('rtlBtn').addEventListener('mousedown', (e) => e.preventDefault());
        $('rtlBtn').addEventListener('click', () => { 
            editor.focus(); 
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('justifyRight'); 
        });
    }

    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);
    
    editor.addEventListener('input', () => {
        updateWordCount();
        if (state.activeDoc) { 
            state.activeDoc.content = editor.innerHTML; 
            clearTimeout(window.saveT);
            window.saveT = setTimeout(() => { if (state.autoSave) saveState(); }, 1000);
        }
    });

    titleInput.addEventListener('blur', () => {
        if (titleInput.value.trim()) {
            titleInput.setAttribute('readonly', 'readonly');
            if (state.activeDoc) { state.activeDoc.title = titleInput.value.trim(); saveState(); }
        }
    });
    titleInput.addEventListener('contextmenu', (e) => { e.preventDefault(); titleInput.removeAttribute('readonly'); titleInput.focus(); titleInput.select(); });

    if($('textScratchpad')) {
        $('textScratchpad').addEventListener('input', () => {
            if (state.activeDoc) { state.activeDoc.scratchpad = $('textScratchpad').innerHTML; if(state.autoSave) saveState(); }
        });

        $('textScratchpad').addEventListener('contextmenu', (e) => {
            e.preventDefault(); openMenuAt(e, $('scratchpadContextMenu'));
        });

        // کنترل سایز فونت چرک نویس
        $('scratchFontInc').onclick = () => {
            state.scratchFontSize = Math.min(state.scratchFontSize + 2, 40);
            $('textScratchpad').style.fontSize = state.scratchFontSize + 'px';
        };
        $('scratchFontDec').onclick = () => {
            state.scratchFontSize = Math.max(state.scratchFontSize - 2, 10);
            $('textScratchpad').style.fontSize = state.scratchFontSize + 'px';
        };
    }

    if($('paperStyleDropdown')) {
        $('paperStyleDropdown').querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); $('paperStyleDropdown').classList.toggle('active'); };
        $$('#paperStyleDropdown .dropdown-item').forEach(item => {
            item.onclick = () => {
                const style = item.dataset.style;
                if(state.activeDoc) { state.activeDoc.paperStyle = style; saveState(); }
                $('editor').className = `editor-box paper-${style}`;
                $('paperStyleDropdown').classList.remove('active');
            };
        });
    }

    $$('.scratch-cmd').forEach(li => { li.onclick = () => { $('textScratchpad').focus(); document.execCommand(li.dataset.cmd, false, null); $('scratchpadContextMenu').classList.add('hidden'); }; });

    if($('saveDocBtn')) {
        $('saveDocBtn').addEventListener('click', () => {
            if (state.activeDoc) {
                state.activeDoc.title = titleInput.value.trim();
                state.activeDoc.content = editor.innerHTML;
                state.activeDoc.scratchpad = $('textScratchpad') ? $('textScratchpad').innerHTML : '';
                saveState(); 
                showToast(i18n[state.lang]["saved"]);
            }
        });
    }

    if($('expandToolbarBtn')) $('expandToolbarBtn').onclick = () => {
        const tb = $('topToolbar');
        tb.classList.toggle('expanded');
        const icon = $('expandToolbarBtn').querySelector('i');
        icon.className = tb.classList.contains('expanded') ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    };

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
    const blurOverlay = $('blurOverlay');
    if(!editor || !tooltip || !popup || !blurOverlay) return;

    document.addEventListener('mouseup', () => {
        setTimeout(() => {
            const sel = window.getSelection();
            if (!sel.rangeCount || sel.isCollapsed) { 
                tooltip.classList.remove('show'); 
                setTimeout(()=>tooltip.classList.add('hidden'), 300); 
                return; 
            }
            const range = sel.getRangeAt(0);
            if (!editor.contains(range.commonAncestorContainer)) { 
                tooltip.classList.remove('show'); 
                setTimeout(()=>tooltip.classList.add('hidden'), 300); 
                return; 
            }
            
            const rect = range.getBoundingClientRect();
            tooltip.classList.remove('hidden');
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            tooltip.style.top = (rect.top - 45) + 'px'; 
            
            requestAnimationFrame(() => tooltip.classList.add('show'));
            
            state.selectionRange = range.cloneRange();
            state.selectedWord = sel.toString().trim();
        }, 100);
    });

    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('#quickTooltip')) {
            tooltip.classList.remove('show');
            setTimeout(()=>tooltip.classList.add('hidden'), 300);
        }
    });

    if($('quickAddNoteBtn')) {
        $('quickAddNoteBtn').addEventListener('click', () => {
            if (!state.selectedWord) return;
            $('selectedWordDisplay').textContent = state.selectedWord;
            $('noteInput').value = '';
            $('noteModal').classList.add('show');
            tooltip.classList.remove('show');
            setTimeout(()=>tooltip.classList.add('hidden'), 300);
        });
    }

    if($('quickHighlightBtn')) {
        $('quickHighlightBtn').addEventListener('click', () => {
            if (!state.selectionRange) return;
            const color = prompt("رنگ را انتخاب کنید (yellow, blue, green, red, neon):", "yellow");
            if (!color) return;
            const validColors = ['yellow', 'blue', 'green', 'red', 'neon'];
            const finalColor = validColors.includes(color.toLowerCase()) ? color.toLowerCase() : 'yellow';

            const span = document.createElement('span');
            span.className = `hl-highlight hl-${finalColor}`; 
            
            try { 
                state.selectionRange.surroundContents(span); 
                const resetSpan = document.createElement('span');
                resetSpan.innerHTML = '&#8203;';
                resetSpan.style.cssText = 'background:transparent; border:none; color:inherit;';
                span.after(resetSpan);
            }
            catch (e) { 
                const contents = state.selectionRange.extractContents(); 
                span.appendChild(contents); 
                state.selectionRange.insertNode(span); 
            }

            if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
            tooltip.classList.remove('show');
            setTimeout(()=>tooltip.classList.add('hidden'), 300);
            window.getSelection().removeAllRanges();
        });
    }

    editor.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.hl-word');
        if (el && el.dataset.note) {
            $('noteViewContent').textContent = el.dataset.note;
            const rect = el.getBoundingClientRect();
            
            popup.className = 'note-view-popup ' + el.classList[1] + ' hidden';
            popup.style.left = (rect.left + rect.width / 2) + 'px'; 
            popup.style.top = (rect.top - 5) + 'px'; 
            
            if (state.blurEffect) blurOverlay.classList.add('show');

            popup.classList.remove('hidden');
            requestAnimationFrame(() => {
                popup.classList.add('show');
            });
        }
    });
    
    editor.addEventListener('mouseout', (e) => {
        if (e.target.closest('.hl-word')) {
            popup.classList.remove('show');
            blurOverlay.classList.remove('show');
            setTimeout(() => { if(!popup.classList.contains('show')) popup.classList.add('hidden'); }, 200);
        }
    });
}

function initNoteModal() {
    if(!$('saveNoteBtn')) return;
    
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
            const resetSpan = document.createElement('span');
            resetSpan.innerHTML = '&#8203;';
            resetSpan.style.cssText = 'background:transparent; border:none; color:inherit;';
            span.after(resetSpan);
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
    const area = $('pinnedNotesArea'); if(!area) return;
    area.innerHTML = '';
    if (!state.activeDoc) return;
    const temp = document.createElement('div');
    temp.innerHTML = state.activeDoc.content || '';
    
    temp.querySelectorAll('.hl-word[data-pinned="1"]').forEach(el => {
        const card = document.createElement('div'); 
        card.className = `note-card ${el.classList[1]}`;
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-note-btn';
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.onclick = () => {
            const editorEl = $('editor').querySelector(`.hl-word[data-note="${escapeHtml(el.dataset.note)}"]`);
            if(editorEl) {
                $('selectedWordDisplay').textContent = editorEl.dataset.word;
                $('noteInput').value = editorEl.dataset.note;
                $('pinNoteCheck').checked = editorEl.dataset.pinned === '1';
                
                const currentColor = editorEl.classList[1].replace('hl-', '');
                $$('#labelColorOptions .color-dot').forEach(d => {
                    d.classList.toggle('active', d.dataset.color === currentColor);
                });

                $('noteModal').classList.add('show');
                state.selectionRange = document.createRange();
                state.selectionRange.selectNode(editorEl);
            }
        };

        card.innerHTML = `<strong>${el.dataset.word}:</strong><br>${escapeHtml(el.dataset.note)}`;
        card.appendChild(editBtn);
        area.appendChild(card);
    });
}

function openMenuAt(e, menuEl) {
    if(!menuEl) return;
    menuEl.classList.remove('hidden'); 
    menuEl.classList.remove('closing');
    let x = Math.min(e.clientX, window.innerWidth - 200);
    let y = Math.min(e.clientY, window.innerHeight - 250);
    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';
    menuEl.style.setProperty('--origin-x', (e.clientX - x) + 'px');
    menuEl.style.setProperty('--origin-y', (e.clientY - y) + 'px');
}

function initContextMenu() {
    const menu = $('customContextMenu');
    if($('editor') && menu) $('editor').addEventListener('contextmenu', (e) => { e.preventDefault(); openMenuAt(e, menu); });

    document.addEventListener('click', (e) => {
        const menus = [menu, $('docContextMenu'), $('folderContextMenu'), $('scratchpadContextMenu')];
        menus.forEach(m => {
            if (m && !m.contains(e.target) && !e.target.closest('.doc-menu-btn') && !e.target.closest('.folder-header')) {
                m.classList.add('closing');
                setTimeout(()=>m.classList.add('hidden'), 300);
            }
        });
    });
    
    // اضافه کردن stopPropagation به آیتم‌های منو
    if($('menuCopy')) $('menuCopy').onclick = (e) => { e.stopPropagation(); document.execCommand('copy'); menu.classList.add('hidden'); };
    if($('menuCut')) $('menuCut').onclick = (e) => { e.stopPropagation(); document.execCommand('cut'); menu.classList.add('hidden'); };
    if($('menuPaste')) $('menuPaste').onclick = async (e) => { e.stopPropagation(); try { const text = await navigator.clipboard.readText(); document.execCommand('insertText', false, text); } catch(e) { showToast('دسترسی ندارید'); } menu.classList.add('hidden'); };
    if($('menuBold')) $('menuBold').onclick = (e) => { e.stopPropagation(); document.execCommand('bold'); menu.classList.add('hidden'); };
    if($('menuItalic')) $('menuItalic').onclick = (e) => { e.stopPropagation(); document.execCommand('italic'); menu.classList.add('hidden'); };
    if($('menuDelete')) $('menuDelete').onclick = (e) => { e.stopPropagation(); document.execCommand('delete'); menu.classList.add('hidden'); };

    if($('ctxEditTitle')) $('ctxEditTitle').onclick = (e) => {
        e.stopPropagation();
        const doc = state.docs.find(d => d.id === state.targetDocIdToMove);
        if(doc) {
            const newTitle = prompt('عنوان جدید را وارد کنید:', doc.title);
            if(newTitle !== null) { doc.title = newTitle.trim(); saveState(); renderDocs(); renderFolders(); }
        }
        $('docContextMenu').classList.add('hidden');
    };
    
    if($('ctxDeleteDoc')) $('ctxDeleteDoc').onclick = (e) => {
        e.stopPropagation();
        showConfirm(i18n[state.lang]["confirm-delete-doc"], () => {
            state.docs = state.docs.filter(d => d.id !== state.targetDocIdToMove);
            saveState(); renderDocs(); renderFolders();
        });
        $('docContextMenu').classList.add('hidden');
    };
    
    if($('ctxMoveToFolder')) $('ctxMoveToFolder').onclick = (e) => {
        e.stopPropagation();
        const doc = state.docs.find(d => d.id === state.targetDocIdToMove);
        if(!doc) return;
        const options = state.folders.map(f => `${f.id}:${f.name}`).join('\n');
        const folderId = prompt(`شناسه دسته‌بندی را وارد کنید:\n${options}\nیا برای خارج کردن "null" بنویسید:`);
        if(folderId !== null) { doc.folderId = folderId === 'null' ? null : folderId; saveState(); renderDocs(); renderFolders(); }
        $('docContextMenu').classList.add('hidden');
    };

    // پین کردن (تغییر وضعیت)
    if($('ctxPinFolder')) $('ctxPinFolder').onclick = (e) => {
        e.stopPropagation();
        const folder = state.folders.find(f => f.id === state.targetFolderIdToEdit);
        if(folder) {
            folder.pinned = !folder.pinned;
            // مرتب‌سازی (پین شده‌ها بالا)
            state.folders.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
            saveState(); renderFolders();
        }
        $('folderContextMenu').classList.add('hidden');
    };
    
    if($('ctxEditFolder')) $('ctxEditFolder').onclick = (e) => {
        e.stopPropagation();
        const folder = state.folders.find(f => f.id === state.targetFolderIdToEdit);
        if(folder) { const newName = prompt('نام جدید:', folder.name); if(newName) { folder.name = newName; saveState(); renderFolders(); } }
        $('folderContextMenu').classList.add('hidden');
    };
    
    if($('ctxDeleteFolder')) $('ctxDeleteFolder').onclick = (e) => {
        e.stopPropagation();
        showConfirm(i18n[state.lang]["confirm-delete-folder"], () => {
            state.folders = state.folders.filter(f => f.id !== state.targetFolderIdToEdit);
            state.docs.forEach(d => { if(d.folderId === state.targetFolderIdToEdit) d.folderId = null; });
            saveState(); renderFolders(); renderDocs();
        });
        $('folderContextMenu').classList.add('hidden');
    };
}

function initFontDropdowns() {
    const fontDD = $('fontDropdown');
    if(fontDD) {
        fontDD.querySelector('.dropdown-selected').onmousedown = (e) => {
            e.preventDefault();
            const sel = window.getSelection();
            if (sel.rangeCount > 0) state.selectionRange = sel.getRangeAt(0).cloneRange();
        };
        fontDD.querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); fontDD.classList.toggle('active'); };
        
        fontDD.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = () => { 
                $('editor').focus(); 
                if (state.selectionRange) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(state.selectionRange);
                }
                document.execCommand('fontName', false, item.dataset.value); 
                fontDD.querySelector('.dropdown-selected').childNodes[0].nodeValue = item.textContent + ' '; 
                fontDD.classList.remove('active'); 
            };
        });
    }

    const sizeDD = $('sizeDropdown');
    if(sizeDD) {
        sizeDD.querySelector('.dropdown-selected').onmousedown = (e) => {
            e.preventDefault();
            const sel = window.getSelection();
            if (sel.rangeCount > 0) state.selectionRange = sel.getRangeAt(0).cloneRange();
        };
        sizeDD.querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); sizeDD.classList.toggle('active'); };
    }

    // ====== فیکس کردن پالت رنگ متن ======
    const colorBtn = $('textColorBtn'), colorPopup = $('colorPopup');
    if(colorBtn && colorPopup) {
        colorBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sel = window.getSelection();
            if (sel.rangeCount > 0) state.selectionRange = sel.getRangeAt(0).cloneRange();
        });
        colorBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            colorPopup.classList.toggle('show'); 
        });
        colorPopup.querySelectorAll('.color-swatch').forEach(sw => {
            sw.onclick = (e) => { 
                e.stopPropagation(); // جلوگیری از بسته شدن
                $('editor').focus(); 
                if (state.selectionRange) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(state.selectionRange);
                }
                document.execCommand('foreColor', false, sw.dataset.color); 
                colorPopup.classList.remove('show'); 
            };
        });
    }

    // ====== فیکس کردن پالت رنگ بوم ======
    const boardColorBtn = $('boardColorBtn'), boardColorPopup = $('boardColorPopup');
    if(boardColorBtn && boardColorPopup) {
        boardColorBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        boardColorBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            boardColorPopup.classList.toggle('show'); 
        });
        boardColorPopup.querySelectorAll('.color-swatch').forEach(sw => {
            sw.onclick = (e) => { 
                e.stopPropagation();
                canvasState.color = sw.dataset.color; 
                boardColorPopup.classList.remove('show'); 
            };
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#fontDropdown') && !e.target.closest('#sizeDropdown') && !e.target.closest('#paperStyleDropdown')) $$('.custom-dropdown').forEach(d => d.classList.remove('active'));
        if (!e.target.closest('#textColorWrapper') && colorPopup) colorPopup.classList.remove('show');
        if (!e.target.closest('#boardColorWrapper') && boardColorPopup) boardColorPopup.classList.remove('show');
    });

    if($('increaseFontSize')) $('increaseFontSize').onmousedown = (e) => e.preventDefault();
    if($('increaseFontSize')) $('increaseFontSize').onclick = () => { 
        changeFontSize(2);
    };
    
    if($('decreaseFontSize')) $('decreaseFontSize').onmousedown = (e) => e.preventDefault();
    if($('decreaseFontSize')) $('decreaseFontSize').onclick = () => { 
        changeFontSize(-2);
    };

    if($('importBtn')) $('importBtn').onclick = () => { 
        if($('importStep1')) $('importStep1').classList.remove('hidden'); 
        if($('importStep2')) $('importStep2').classList.add('hidden'); 
        if($('importModal')) $('importModal').classList.add('show'); 
    };
    
    if($('backToStep1')) $('backToStep1').onclick = () => {
        if($('importStep1')) $('importStep1').classList.remove('hidden'); 
        if($('importStep2')) $('importStep2').classList.add('hidden'); 
    };

    $$('.media-cat-item').forEach(cat => {
        cat.onclick = () => { 
            if($('fileInput')) {
                $('fileInput').accept = cat.dataset.accept; 
                $('fileInput').click(); 
            }
        };
    });
    
    if($('fileInput')) $('fileInput').onchange = (e) => {
        const file = e.target.files[0]; if (!file) return; 
        state.currentFileToImport = file;
        if($('importStep1')) $('importStep1').classList.add('hidden'); 
        if($('importStep2')) $('importStep2').classList.remove('hidden');
        if (file.type === 'application/pdf') {
            if($('actionOpenPdf')) $('actionOpenPdf').classList.remove('hidden');
        } else {
            if($('actionOpenPdf')) $('actionOpenPdf').classList.add('hidden');
        }
    };

    if($('actionEmbedFile')) $('actionEmbedFile').onclick = () => {
        const file = state.currentFileToImport; if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let html = `<div class="media-attachment"><button class="delete-media-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
            if (file.type.startsWith('image/')) html += `<img src="${event.target.result}" style="max-width:100%; border-radius:12px;">`;
            else if (file.type.startsWith('video/')) html += `<video src="${event.target.result}" controls style="max-width:100%; border-radius:12px;"></video>`;
            else if (file.type.startsWith('audio/')) html += `<audio src="${event.target.result}" controls style="width:100%;"></audio>`;
            else html += `<a href="${event.target.result}" download="${file.name}" style="color:var(--accent-main); text-decoration:underline;">دریافت فایل: ${file.name}</a>`;
            html += `</div>`;
            
            $('editor').focus();
            document.execCommand('insertHTML', false, html);
            if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
            $('importModal').classList.remove('show'); $('fileInput').value = '';
        };
        reader.readAsDataURL(file);
    };

    if($('actionOpenPdf')) $('actionOpenPdf').onclick = () => {
        const file = state.currentFileToImport; if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let html = `<div class="media-attachment"><button class="delete-media-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
                        <embed src="${event.target.result}" type="application/pdf" width="100%" height="500px" style="border-radius:12px;"></div>`;
            $('editor').focus();
            document.execCommand('insertHTML', false, html);
            if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
            $('importModal').classList.remove('show'); $('fileInput').value = '';
        };
        reader.readAsDataURL(file);
    };

    if($('actionExtractText')) $('actionExtractText').onclick = () => {
        const file = state.currentFileToImport; if(!file) return;
        
        if(file.type === 'application/pdf') {
            if($('processLoadingOverlay')) $('processLoadingOverlay').classList.remove('hidden');
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
                        $('editor').focus();
                        document.execCommand('insertHTML', false, paragraphs);
                        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
                        
                        if($('processLoadingOverlay')) $('processLoadingOverlay').classList.add('hidden');
                        $('importModal').classList.remove('show'); $('fileInput').value = '';
                        showToast('متن استخراج شد.');
                    }).catch(err => {
                        if($('processLoadingOverlay')) $('processLoadingOverlay').classList.add('hidden');
                        showToast('خطا در استخراج متن PDF');
                    });
                }).catch(err => {
                    if($('processLoadingOverlay')) $('processLoadingOverlay').classList.add('hidden');
                    showToast('خطا در خواندن فایل PDF');
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const paragraphs = event.target.result.split('\n').filter(p=>p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('');
                $('editor').focus();
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
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
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

    canvas.addEventListener('pointerdown', (e) => {
        canvasState.drawing = true; const pos = getPos(e); canvasState.points = [pos]; canvasState.startPos = pos;
        canvasState.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); setupBrush();
        if (['pencil', 'highlighter', 'eraser'].includes(canvasState.tool)) {
            ctx.beginPath(); ctx.arc(pos.x, pos.y, (canvasState.tool === 'eraser' || canvasState.tool === 'highlighter' ? 10 : canvasState.size/2), 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle; ctx.fill();
        }
    });

    canvas.addEventListener('pointermove', (e) => {
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

    canvas.addEventListener('pointerup', () => {
        canvasState.drawing = false; canvasState.points = [];
        if (state.activeDoc) state.activeDoc.board = canvas.toDataURL();
    });

    canvas.addEventListener('pointerleave', () => { canvasState.drawing = false; });

    $$('.board-tool[data-tool]').forEach(btn => {
        btn.onclick = () => { 
            $$('.board-tool[data-tool]').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            canvasState.tool = btn.dataset.tool; 
            canvas.className = ''; 
            if(canvasState.tool === 'eraser') canvas.classList.add('cursor-eraser');
            else if(canvasState.tool === 'highlighter') canvas.classList.add('cursor-highlighter');
        };
    });
    
    if($('clearBoardBtn')) $('clearBoardBtn').onclick = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); };
    if($('exportBoardToDocBtn')) $('exportBoardToDocBtn').onclick = () => {
        const img = document.createElement('img'); img.src = canvas.toDataURL(); img.style.maxWidth = '100%'; img.style.borderRadius = '12px'; img.style.margin = '10px 0';
        $('editor').appendChild(img);
        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
        showToast('تصویر بوم در متن درج شد');
    };
}

function restoreCanvas() {
    if (!state.activeDoc || !state.activeDoc.board) return;
    const canvas = $('scratchpadCanvas'); if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src = state.activeDoc.board;
}

function initSettings() {
    if($('autoSaveToggle')) $('autoSaveToggle').checked = state.autoSave;
    if($('blurEffectToggle')) $('blurEffectToggle').checked = state.blurEffect;
    
    const langDisplay = $('currentLangDisplay');
    if (langDisplay) langDisplay.textContent = state.lang === 'en' ? 'English' : (state.lang === 'ar' ? 'العربية' : 'فارسی');
    applyLanguage(state.lang);

    const settingsInputs = $$('#settingsModal input, #settingsModal select, #settingsModal .custom-dropdown');
    const actionBar = $('settingsActionBar');
    
    const langDD = $('languageDropdown');
    if(langDD) {
        langDD.querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); langDD.classList.toggle('active'); };
        $$('#languageDropdown .dropdown-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const langDisp = $('currentLangDisplay');
                if (langDisp) langDisp.textContent = item.textContent;
                langDD.dataset.selectedLang = item.dataset.langVal;
                langDD.classList.remove('active');
                if(actionBar) actionBar.classList.add('show');
            };
        });
    }

    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            if(actionBar) actionBar.classList.add('show');
        });
    });

    if($('settingsBtn')) $('settingsBtn').onclick = () => {
        if(actionBar) actionBar.classList.remove('show'); 
        if($('settingsModal')) $('settingsModal').classList.add('show');
    };

    if($('cancelSettingsBtn')) $('cancelSettingsBtn').onclick = () => { 
        if($('autoSaveToggle')) $('autoSaveToggle').checked = state.autoSave;
        if($('blurEffectToggle')) $('blurEffectToggle').checked = state.blurEffect;
        const langDisplay2 = $('currentLangDisplay');
        if (langDisplay2) langDisplay2.textContent = state.lang === 'en' ? 'English' : (state.lang === 'ar' ? 'العربية' : 'فارسی');
        if(langDD) langDD.dataset.selectedLang = state.lang;
        if($('settingsModal')) $('settingsModal').classList.remove('show'); 
    };

    if($('confirmSettingsBtn')) $('confirmSettingsBtn').onclick = () => {
        const activeThemeBtn = document.querySelector('#themeToggle button.active');
        if (activeThemeBtn) {
            applyTheme(activeThemeBtn.dataset.theme);
        }

        if($('autoSaveToggle')) state.autoSave = $('autoSaveToggle').checked;
        if($('blurEffectToggle')) state.blurEffect = $('blurEffectToggle').checked;
        const newLang = (langDD && langDD.dataset.selectedLang) ? langDD.dataset.selectedLang : state.lang;
        
        localStorage.setItem('vizhar_autosave', state.autoSave);
        localStorage.setItem('vizhar_blur', state.blurEffect);
        
        applyLanguage(newLang);

        const isNotesChecked = $('toggleNotesPanel') ? $('toggleNotesPanel').checked : true;
        const isCanvasChecked = $('toggleCanvasPanel') ? $('toggleCanvasPanel').checked : true;
        const isScratchChecked = $('toggleScratchPanel') ? $('toggleScratchPanel').checked : true;
        
        if($('pinnedNotesArea') && $('pinnedNotesArea').parentElement) {
            $('pinnedNotesArea').parentElement.style.display = isNotesChecked ? 'flex' : 'none';
            if($('pinnedNotesArea').parentElement.previousElementSibling) $('pinnedNotesArea').parentElement.previousElementSibling.style.display = isNotesChecked ? 'flex' : 'none';
        }
        
        if($('canvasContainer') && $('canvasContainer').parentElement) {
            $('canvasContainer').parentElement.style.display = isCanvasChecked ? 'flex' : 'none';
            if($('canvasContainer').parentElement.previousElementSibling) $('canvasContainer').parentElement.previousElementSibling.style.display = isCanvasChecked ? 'flex' : 'none';
        }
        
        if($('rightPanel')) $('rightPanel').style.display = isScratchChecked ? 'flex' : 'none';

        if($('settingsModal')) $('settingsModal').classList.remove('show');
        showToast(i18n[newLang]["saved"]);
        setTimeout(resizeCanvas, 300);
    };

    if($('resetRoleBtn')) $('resetRoleBtn').onclick = () => { state.role = null; localStorage.removeItem(STORAGE_KEYS.role); if($('settingsModal')) $('settingsModal').classList.remove('show'); showRoleView(); };
    
    if($('clearDataBtn')) $('clearDataBtn').onclick = () => { 
        showConfirm('آیا مطمئن هستید؟ تمام اطلاعات حذف خواهد شد.', () => {
            localStorage.clear(); location.reload(); 
        });
    };
}

function showToast(msg) {
    const container = $('toastContainer');
    if(!container) return;
    const t = document.createElement('div');
    t.className = 'toast-message';
    t.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--accent-main);"></i> <span>${msg}</span>`;
    container.appendChild(t);
    
    setTimeout(() => {
        t.classList.add('fade-out');
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

function showConfirm(message, onYes) {
    const modal = $('confirmModal');
    if(!modal) return;
    $('confirmMessage').textContent = message;
    modal.classList.add('show');
    
    $('confirmYesBtn').onclick = () => {
        modal.classList.remove('show');
        onYes();
    };
    $('confirmNoBtn').onclick = () => {
        modal.classList.remove('show');
    };
}

function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

function init() {
    // 1. اتصال رویداد کلیک برای کارت‌های انتخاب نقش (مستقل از بقیه کدها)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.role-card');
        if (card) {
            state.role = card.dataset.role;
            saveState();
            showDashboard();
        }
    });

    // 2. لود اولیه با مدیریت خطا (تا صفحه گیر نکند)
    try { loadState(); } catch(e) { console.error('loadState', e); }
    try { initTheme(); } catch(e) { console.error('initTheme', e); }
    try { initEditor(); } catch(e) { console.error('initEditor', e); }
    try { initFontDropdowns(); } catch(e) { console.error('initFontDropdowns', e); }
    try { initNoteModal(); } catch(e) { console.error('initNoteModal', e); }
    try { initCanvas(); } catch(e) { console.error('initCanvas', e); }
    try { initSettings(); } catch(e) { console.error('initSettings', e); }

    // رویداد برای دکمه Back مرورگر
    window.addEventListener('popstate', (e) => {
        if (state.activeDoc) {
            state.activeDoc.content = $('editor').innerHTML; 
            state.activeDoc.title = $('documentTitle').value.trim();
            saveState();
            showDashboard();
        }
    });

    // حذف کامل صفحه لودینگ
    setTimeout(() => {
        const loader = $('loading-screen');
        if(loader) loader.style.display = 'none';
    }, 500);

    if($('backToDashBtn')) $('backToDashBtn').onclick = () => {
        history.pushState({ view: 'dashboard' }, '', '#dashboard'); // مدیریت هیستوری
        if (state.activeDoc) {
            state.activeDoc.content = $('editor').innerHTML; 
            state.activeDoc.title = $('documentTitle').value.trim();
            saveState();
            
            $('editor-view').style.opacity = '0';
            setTimeout(() => { 
                showDashboard(); 
                $('dashboard-view').style.opacity = '1'; 
            }, 200);
            
            html2canvas($('editor'), { scale: 0.5, backgroundColor: getComputedStyle(document.body).getPropertyValue('--surface-solid').trim() }).then(canvas => {
                state.activeDoc.thumbnail = canvas.toDataURL('image/jpeg');
                saveState(); renderDocs();
            }).catch(() => {});
        } else { 
            showDashboard(); 
        }
    };
    
    if($('createNewDocBtn')) $('createNewDocBtn').onclick = createDoc;
    if($('createEmptyDocBtn')) $('createEmptyDocBtn').onclick = createDoc;
    if($('addFolderBtn')) $('addFolderBtn').onclick = () => $('addFolderModal').classList.add('show');
    if($('confirmAddFolderBtn')) $('confirmAddFolderBtn').onclick = () => {
        const name = $('newFolderName').value.trim(); if (!name) return;
        state.folders.push({ id: 'f_' + Date.now(), name, pinned: false }); saveState(); $('newFolderName').value = ''; $('addFolderModal').classList.remove('show'); renderFolders();
    };

    if($('focusModeBtn')) $('focusModeBtn').onclick = () => { 
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => { showToast('مرورگر اجازه نداد.'); });
            document.body.classList.add('focus-mode'); 
            $('focusModeBtn').querySelector('i').className = 'fa-solid fa-compress';
        } else {
            document.exitFullscreen();
            document.body.classList.remove('focus-mode');
            $('focusModeBtn').querySelector('i').className = 'fa-solid fa-expand';
        }
    };

    if($('toggleLeftPanelBtn')) $('toggleLeftPanelBtn').onclick = () => {
        $('leftPanel').classList.toggle('collapsed-left');
        $('toggleLeftPanelBtn').querySelector('i').classList.toggle('fa-rotate-180');
    };
    if($('toggleRightPanelBtn')) $('toggleRightPanelBtn').onclick = () => {
        $('rightPanel').classList.toggle('collapsed-right');
        $('toggleRightPanelBtn').querySelector('i').classList.toggle('fa-rotate-180');
    };

    $$('.btn-close-modal').forEach(btn => btn.onclick = () => btn.closest('.modal').classList.remove('show'));
    $$('.modal').forEach(modal => { modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); }; });

    if (state.role) showDashboard(); else showRoleView();
}

document.addEventListener('DOMContentLoaded', init);
