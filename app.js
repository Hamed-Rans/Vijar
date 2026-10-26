/* ============================================================
   ویژار - منطق اصلی (نسخه کامل و نهایی)
   ============================================================ */

const STORAGE_KEYS = { 
    role: 'vizhar_role', docs: 'vizhar_docs', folders: 'vizhar_folders', 
    theme: 'vizhar_theme', defaultFontSize: 'vizhar_default_fs' 
};

let state = {
    role: null, 
    folders: [], 
    docs: [], 
    activeFolder: 'all', 
    activeDoc: null,
    selectionRange: null, 
    selectedWord: '', 
    autoSave: true, 
    baseFontSize: 16,
    targetDocIdToMove: null, 
    currentFileToImport: null
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------------- ذخیره‌سازی ---------------- */
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEYS.role, state.role || '');
        localStorage.setItem(STORAGE_KEYS.docs, JSON.stringify(state.docs));
        localStorage.setItem(STORAGE_KEYS.folders, JSON.stringify(state.folders));
    } catch (e) { 
        console.error('خطا در ذخیره‌سازی (احتمالا حافظه پر است)', e); 
    }
}

function loadState() {
    state.role = localStorage.getItem(STORAGE_KEYS.role) || null;
    try {
        state.folders = JSON.parse(localStorage.getItem(STORAGE_KEYS.folders) || '[]');
        state.docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.docs) || '[]');
        state.autoSave = localStorage.getItem('vizhar_autosave') !== 'false';
        state.baseFontSize = parseInt(localStorage.getItem(STORAGE_KEYS.defaultFontSize)) || 16;
    } catch(e) { 
        state.folders = []; 
        state.docs = []; 
    }
}

/* ---------------- تم ---------------- */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    $$('#themeToggle button').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
}

function initTheme() {
    applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'dark');
    $$('#themeToggle button').forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.theme)));
}

/* ---------------- ناوبری ---------------- */
function showRoleView() {
    $('role-view').classList.remove('hidden'); 
    $('dashboard-view').classList.add('hidden'); 
    $('editor-view').classList.add('hidden');
    $('backToDashBtn').classList.add('hidden'); 
    $$('.action-nav').forEach(el => el.classList.add('hidden')); 
    $('userRoleBadge').classList.add('hidden');
}

function showDashboard() {
    $('role-view').classList.add('hidden'); 
    $('dashboard-view').classList.remove('hidden'); 
    $('editor-view').classList.add('hidden');
    $('backToDashBtn').classList.add('hidden'); 
    $$('.action-nav').forEach(el => el.classList.add('hidden'));
    
    $('userRoleBadge').classList.remove('hidden'); 
    $('userRoleBadge').textContent = state.role === 'teacher' ? 'استاد' : 'دانشجو';
    
    renderFolders(); 
    renderDocs();
    
    // انیمیشن ورود جزوه‌ها
    $('documentsGrid').style.animation = 'none';
    $('documentsGrid').offsetHeight; 
    $('documentsGrid').style.animation = 'fadeInGrid 0.5s forwards';
}

function showEditor() {
    $('role-view').classList.add('hidden'); 
    $('dashboard-view').classList.add('hidden'); 
    $('editor-view').classList.remove('hidden');
    $('backToDashBtn').classList.remove('hidden'); 
    $$('.action-nav').forEach(el => el.classList.remove('hidden'));
}

/* ---------------- داشبورد و دسته‌بندی‌ها ---------------- */
function renderFolders() {
    const list = $('folderList'); 
    list.innerHTML = '';
    
    // آیتم "همه"
    const allLi = document.createElement('li');
    allLi.className = 'folder-item';
    allLi.innerHTML = `<div class="folder-header ${state.activeFolder === 'all' ? 'active' : ''}" data-id="all"><div class="folder-title-wrap"><i class="fa-solid fa-inbox"></i> همه جزوه‌ها</div></div>`;
    allLi.querySelector('.folder-header').onclick = () => { state.activeFolder = 'all'; renderFolders(); renderDocs(); };
    list.appendChild(allLi);

    // سایر دسته‌بندی‌ها (به صورت درختی)
    state.folders.forEach(f => {
        const li = document.createElement('li');
        li.className = 'folder-item';
        const folderDocs = state.docs.filter(d => d.folderId === f.id);
        const isOpen = state.activeFolder === f.id;
        
        li.innerHTML = `
            <div class="folder-header ${isOpen ? 'active open' : ''}" data-id="${f.id}">
                <div class="folder-title-wrap"><i class="fa-solid fa-folder"></i> ${escapeHtml(f.name)}</div>
                <i class="fa-solid fa-chevron-left folder-arrow"></i>
            </div>
            <ul class="folder-docs">
                ${folderDocs.map(d => `<li class="folder-doc-item" data-doc-id="${d.id}"><i class="fa-regular fa-file-lines"></i> ${escapeHtml(d.title || 'بدون عنوان')}</li>`).join('')}
            </ul>
        `;
        
        const header = li.querySelector('.folder-header');
        header.onclick = (e) => {
            if(e.target.closest('.folder-doc-item')) return;
            if (state.activeFolder === f.id) {
                state.activeFolder = 'all';
                header.classList.remove('open', 'active');
            } else {
                state.activeFolder = f.id;
                $$('.folder-header').forEach(h => h.classList.remove('open', 'active'));
                header.classList.add('open', 'active');
            }
            renderDocs();
        };

        li.querySelectorAll('.folder-doc-item').forEach(item => {
            item.onclick = () => openDoc(item.dataset.docId);
        });
        list.appendChild(li);
    });
}

function renderDocs() {
    const grid = $('documentsGrid'); 
    grid.innerHTML = '';
    let docs = state.docs;
    if (state.activeFolder !== 'all') docs = docs.filter(d => d.folderId === state.activeFolder);

    if (docs.length === 0) { $('emptyState').classList.remove('hidden'); return; }
    $('emptyState').classList.add('hidden');

    docs.forEach(d => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.dataset.id = d.id;
        
        // پیدا کردن عکس
        let mediaHtml = `<i class="fa-regular fa-file-lines"></i>`;
        if (d.content && d.content.includes('<img')) {
            const match = d.content.match(/<img[^>]+src="([^">]+)"/);
            if (match && match[1]) mediaHtml = `<img src="${match[1]}" alt="preview">`;
        }

        // استخراج متن زنده (Live Preview)
        let previewText = 'جزوه خالی است...';
        if (d.content) {
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = d.content;
            tempDiv.querySelectorAll('img, audio, video, iframe').forEach(el => el.remove()); // حذف مدیا برای جلوگیری از خرابی متن
            let rawText = tempDiv.textContent || tempDiv.innerText || "";
            rawText = rawText.replace(/\s+/g, ' ').trim();
            if (rawText.length > 0) {
                previewText = rawText.length > 60 ? rawText.substring(0, 60) + '...' : rawText;
            }
        }

        card.innerHTML = `
            <button class="doc-menu-btn"><i class="fa-solid fa-ellipsis"></i></button>
            <div class="doc-card-img">${mediaHtml}</div>
            <div class="doc-card-body">
                <h3>${escapeHtml(d.title || 'بدون عنوان')}</h3>
                <div class="live-preview">${escapeHtml(previewText)}</div>
            </div>
        `;
        
        card.onclick = (e) => { if(!e.target.closest('.doc-menu-btn')) openDoc(d.id); };

        // منوی سه نقطه و راست کلیک
        const menuBtn = card.querySelector('.doc-menu-btn');
        const showDocMenu = (x, y) => {
            state.targetDocIdToMove = d.id;
            const menu = $('docContextMenu');
            menu.classList.remove('hidden');
            menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
            menu.style.top = Math.min(y, window.innerHeight - 150) + 'px';
        };
        
        menuBtn.onclick = (e) => { 
            e.stopPropagation(); 
            const rect = menuBtn.getBoundingClientRect(); 
            showDocMenu(rect.left, rect.bottom + 5); 
        };
        card.oncontextmenu = (e) => { 
            e.preventDefault(); 
            showDocMenu(e.pageX, e.pageY); 
        };

        grid.appendChild(card);
    });
}

function createDoc() {
    const doc = { 
        id: 'doc_' + Date.now(), 
        title: '', 
        content: '', 
        folderId: state.activeFolder !== 'all' ? state.activeFolder : null, 
        createdAt: Date.now(), 
        updatedAt: Date.now() 
    };
    state.docs.unshift(doc);
    saveState(); 
    openDoc(doc.id);
}

function openDoc(id) {
    state.activeDoc = state.docs.find(d => d.id === id);
    if (!state.activeDoc) return;
    
    // انیمیشن جابجایی
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
        
        showEditor();
        $('editor-view').style.opacity = '0';
        setTimeout(() => $('editor-view').style.opacity = '1', 50);
        $('dashboard-view').style.opacity = '1';
        restoreCanvas();
    }, 200);
}

/* ---------------- ادیتور ---------------- */
function initEditor() {
    const editor = $('editor');
    const titleInput = $('documentTitle');

    // فرمت‌دهی پایه
    $$('.tool-btn[data-command]').forEach(btn => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => {
            editor.focus(); 
            document.execCommand(btn.dataset.command, false, null);
            updateToolbarState();
        });
    });

    // بلاک‌ها (تیترها)
    $$('.tool-btn[data-block]').forEach(btn => {
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => {
            editor.focus(); 
            document.execCommand('formatBlock', false, btn.dataset.block);
        });
    });

    // بروزرسانی حالت دکمه‌های چینش و بولد
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);

    // قفل عنوان
    titleInput.addEventListener('blur', () => {
        if (titleInput.value.trim()) {
            titleInput.setAttribute('readonly', 'readonly');
            if (state.activeDoc) { state.activeDoc.title = titleInput.value.trim(); saveState(); }
        }
    });
    titleInput.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        titleInput.removeAttribute('readonly');
        titleInput.focus(); 
        titleInput.select();
    });

    // ذخیره خودکار
    let saveTimeout;
    editor.addEventListener('input', () => {
        if (state.activeDoc) { 
            state.activeDoc.content = editor.innerHTML; 
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => { if (state.autoSave) saveState(); }, 1000);
        }
    });
    
    $('textScratchpad').addEventListener('input', () => {
        if (state.activeDoc) { 
            state.activeDoc.scratchpad = $('textScratchpad').innerHTML; 
            if(state.autoSave) saveState(); 
        }
    });

    // دکمه ذخیره دستی
    $('saveDocBtn').addEventListener('click', () => {
        if (state.activeDoc) {
            state.activeDoc.title = titleInput.value.trim();
            state.activeDoc.content = editor.innerHTML;
            state.activeDoc.scratchpad = $('textScratchpad').innerHTML;
            saveState(); 
            showToast('ذخیره شد');
        }
    });

    // تغییر سایز فونت
    $('increaseFontSize').onclick = () => {
        state.baseFontSize = Math.min(state.baseFontSize + 2, 40);
        $('fontSizeDisplay').textContent = state.baseFontSize;
        $('editor').style.fontSize = state.baseFontSize + 'px';
        localStorage.setItem(STORAGE_KEYS.defaultFontSize, state.baseFontSize);
    };
    $('decreaseFontSize').onclick = () => {
        state.baseFontSize = Math.max(state.baseFontSize - 2, 10);
        $('fontSizeDisplay').textContent = state.baseFontSize;
        $('editor').style.fontSize = state.baseFontSize + 'px';
        localStorage.setItem(STORAGE_KEYS.defaultFontSize, state.baseFontSize);
    };

    // ابزارهای چرک‌نویس
    $$('.scratch-tool').forEach(btn => {
        btn.onclick = () => {
            const cmd = btn.dataset.cmd;
            $('textScratchpad').focus();
            if(cmd === 'list') document.execCommand('insertUnorderedList');
            else document.execCommand(cmd);
        };
    });

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

/* ---------------- تولتیپ و نکات ---------------- */
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

    // هاور روی نکات
    editor.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.hl-word');
        if (el && el.dataset.note) {
            $('noteViewContent').textContent = el.dataset.note;
            const rect = el.getBoundingClientRect();
            popup.style.left = (rect.right + 15) + 'px'; 
            popup.style.top = (rect.top - 10) + 'px';
            popup.classList.remove('hidden');
            requestAnimationFrame(() => popup.classList.add('show'));
        }
    });
    
    editor.addEventListener('mouseout', (e) => {
        if (e.target.closest('.hl-word')) {
            popup.classList.remove('show');
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
        span.dataset.note = note;
        if (pinned) span.dataset.pinned = '1';

        try { 
            state.selectionRange.surroundContents(span); 
        } catch (e) {
            const contents = state.selectionRange.extractContents();
            span.appendChild(contents); 
            state.selectionRange.insertNode(span);
        }

        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
        $('noteModal').classList.remove('show');
        window.getSelection().removeAllRanges();
    });
}

/* ---------------- منوهای راست کلیک ---------------- */
function initContextMenu() {
    const menu = $('customContextMenu');
    $('editor').addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        menu.classList.remove('hidden');
        menu.style.left = e.pageX + 'px'; 
        menu.style.top = e.pageY + 'px';
    });
    
    const docMenu = $('docContextMenu');
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) menu.classList.add('hidden');
        if (!docMenu.contains(e.target) && !e.target.closest('.doc-menu-btn')) docMenu.classList.add('hidden');
    });
    
    $('menuCopy').onclick = () => { document.execCommand('copy'); menu.classList.add('hidden'); };
    $('menuCut').onclick = () => { document.execCommand('cut'); menu.classList.add('hidden'); };
    $('menuPaste').onclick = async () => { 
        try { 
            const text = await navigator.clipboard.readText(); 
            document.execCommand('insertText', false, text); 
        } catch(e) { showToast('مرورگر اجازه دسترسی به کلیپ‌بورد را نداد'); } 
        menu.classList.add('hidden'); 
    };
    $('menuBold').onclick = () => { document.execCommand('bold'); menu.classList.add('hidden'); };
    $('menuItalic').onclick = () => { document.execCommand('italic'); menu.classList.add('hidden'); };

    $('ctxEditTitle').onclick = () => {
        const doc = state.docs.find(d => d.id === state.targetDocIdToMove);
        if(doc) {
            const newTitle = prompt('عنوان جدید را وارد کنید:', doc.title);
            if(newTitle !== null) { doc.title = newTitle.trim(); saveState(); renderDocs(); renderFolders(); }
        }
        docMenu.classList.add('hidden');
    };
    $('ctxDeleteDoc').onclick = () => {
        if(confirm('آیا از حذف این جزوه مطمئن هستید؟')) {
            state.docs = state.docs.filter(d => d.id !== state.targetDocIdToMove);
            saveState(); renderDocs(); renderFolders();
        }
        docMenu.classList.add('hidden');
    };
    $('ctxMoveToFolder').onclick = () => {
        const doc = state.docs.find(d => d.id === state.targetDocIdToMove);
        if(!doc) return;
        const options = state.folders.map(f => `${f.id}:${f.name}`).join('\n');
        const folderId = prompt(`شناسه دسته‌بندی را وارد کنید:\n${options}\nیا برای خارج کردن "null" بنویسید:`);
        if(folderId !== null) {
            doc.folderId = folderId === 'null' ? null : folderId;
            saveState(); renderDocs(); renderFolders();
        }
        docMenu.classList.add('hidden');
    };
}

/* ---------------- فونت و رنگ متن ---------------- */
function initFontDropdowns() {
    const fontDD = $('fontDropdown');
    fontDD.querySelector('.dropdown-selected').onclick = (e) => { e.stopPropagation(); fontDD.classList.toggle('active'); };
    fontDD.querySelectorAll('.dropdown-item').forEach(item => {
        item.onclick = () => {
            $('editor').focus(); 
            document.execCommand('fontName', false, item.dataset.value);
            fontDD.querySelector('.dropdown-selected').childNodes[0].nodeValue = item.textContent + ' ';
            fontDD.classList.remove('active');
        };
    });

    const colorBtn = $('textColorBtn'), colorPopup = $('colorPopup');
    colorBtn.onclick = (e) => { e.stopPropagation(); colorPopup.classList.toggle('show'); };
    colorPopup.querySelectorAll('.color-swatch').forEach(sw => {
        sw.onclick = () => { 
            $('editor').focus(); 
            document.execCommand('foreColor', false, sw.dataset.color); 
            colorPopup.classList.remove('show'); 
        };
    });
    $('nativeColorPicker').oninput = (e) => { $('editor').focus(); document.execCommand('foreColor', false, e.target.value); };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) $$('.custom-dropdown').forEach(d => d.classList.remove('active'));
        if (!e.target.closest('.color-menu-wrapper')) $$('.custom-color-popup').forEach(p => p.classList.remove('show'));
    });
}

/* ---------------- آپلود و ایمپورت ---------------- */
function initImport() {
    $('importBtn').onclick = () => {
        $('importActionOptions').classList.add('hidden');
        $('importModal').classList.add('show');
    };
    
    $$('.media-cat-item').forEach(cat => {
        cat.onclick = () => {
            const accept = cat.dataset.accept;
            $('fileInput').accept = accept;
            $('fileInput').click();
        };
    });

    $('fileInput').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        state.currentFileToImport = file;
        $('importActionOptions').classList.remove('hidden');
    };

    $('actionEmbedFile').onclick = () => {
        const file = state.currentFileToImport;
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let html = '';
            if (file.type.startsWith('image/')) html = `<img src="${event.target.result}" style="max-width:100%; border-radius:12px; margin:10px 0;">`;
            else if (file.type.startsWith('video/')) html = `<video src="${event.target.result}" controls style="max-width:100%; border-radius:12px; margin:10px 0;"></video>`;
            else if (file.type.startsWith('audio/')) html = `<audio src="${event.target.result}" controls style="width:100%; margin:10px 0;"></audio>`;
            else if (file.type === 'application/pdf') html = `<embed src="${event.target.result}" type="application/pdf" width="100%" height="500px" style="border-radius:12px; margin:10px 0;">`;
            else html = `<a href="${event.target.result}" download="${file.name}" style="color:var(--accent-main); text-decoration:underline;">دانلود فایل: ${file.name}</a>`;
            
            document.execCommand('insertHTML', false, html);
            if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
            $('importModal').classList.remove('show');
            $('fileInput').value = '';
        };
        reader.readAsDataURL(file);
    };

    $('actionExtractText').onclick = () => {
        const file = state.currentFileToImport;
        if(!file) return;
        if(file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const paragraphs = event.target.result.split('\n').filter(p=>p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('');
                document.execCommand('insertHTML', false, paragraphs);
                if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
                $('importModal').classList.remove('show');
                $('fileInput').value = '';
            };
            reader.readAsText(file);
        } else {
            showToast('استخراج متن فقط برای فایل‌های متنی پشتیبانی می‌شود.');
        }
    };
}

/* ---------------- بوم (Canvas) ---------------- */
let canvasState = { drawing: false, tool: 'pencil', color: '#4F75FF', size: 3, points: [], snapshot: null, startPos: null };

function initCanvas() {
    const canvas = $('scratchpadCanvas');
    const ctx = canvas.getContext('2d');
    const cursor = $('brushCursor');
    const container = canvas.parentElement;
    
    function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr; 
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px'; 
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr); 
        ctx.lineCap = 'round'; 
        ctx.lineJoin = 'round';
        restoreCanvas();
    }
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function setupBrush() {
        ctx.lineCap = 'round'; 
        ctx.lineJoin = 'round';
        if (canvasState.tool === 'highlighter') { 
            ctx.strokeStyle = canvasState.color; 
            ctx.globalAlpha = 0.3; 
            ctx.lineWidth = 15; 
            ctx.globalCompositeOperation = 'source-over'; 
        } else if (canvasState.tool === 'eraser') { 
            ctx.strokeStyle = 'rgba(0,0,0,1)'; 
            ctx.globalAlpha = 1; 
            ctx.lineWidth = 20; 
            ctx.globalCompositeOperation = 'destination-out'; 
        } else { 
            ctx.strokeStyle = canvasState.color; 
            ctx.globalAlpha = 1; 
            ctx.lineWidth = canvasState.size; 
            ctx.globalCompositeOperation = 'source-over'; 
        }
    }

    canvas.addEventListener('pointerenter', () => cursor.style.display = 'block');
    canvas.addEventListener('pointerleave', () => { cursor.style.display = 'none'; canvasState.drawing = false; });
    
    canvas.addEventListener('pointermove', (e) => {
        const size = canvasState.tool === 'eraser' || canvasState.tool === 'highlighter' ? (canvasState.tool==='eraser'?20:15) : canvasState.size;
        cursor.style.width = size + 'px'; 
        cursor.style.height = size + 'px';
        cursor.style.left = e.clientX + 'px'; 
        cursor.style.top = e.clientY + 'px';
        
        if (!canvasState.drawing) return;
        const pos = getPos(e);
        
        if (['pencil', 'highlighter', 'eraser'].includes(canvasState.tool)) {
            canvasState.points.push(pos);
            if (canvasState.points.length > 2) {
                const p1 = canvasState.points[canvasState.points.length - 3], p2 = canvasState.points[canvasState.points.length - 2], p3 = canvasState.points[canvasState.points.length - 1];
                const m1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                const m2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
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
        canvasState.drawing = true; 
        const pos = getPos(e); 
        canvasState.points = [pos]; 
        canvasState.startPos = pos;
        canvasState.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); 
        setupBrush();
        if (['pencil', 'highlighter', 'eraser'].includes(canvasState.tool)) {
            ctx.beginPath(); 
            ctx.arc(pos.x, pos.y, (canvasState.tool === 'eraser' || canvasState.tool === 'highlighter' ? (canvasState.tool==='eraser'?10:7) : canvasState.size/2), 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle; 
            ctx.fill();
        }
    });

    canvas.addEventListener('pointerup', () => {
        canvasState.drawing = false; 
        canvasState.points = [];
        if (state.activeDoc) state.activeDoc.board = canvas.toDataURL();
    });

    $$('.board-tool[data-tool]').forEach(btn => {
        btn.onclick = () => {
            if($('pencilSettings')) $('pencilSettings').classList.remove('show');
            $$('.board-tool[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); 
            canvasState.tool = btn.dataset.tool;
        };
    });
    
    if($('brushSize')) $('brushSize').oninput = (e) => { canvasState.size = e.target.value; };
    
    if($('boardColorBtn')) {
        $('boardColorBtn').onclick = (e) => { e.stopPropagation(); $('boardColorPopup').classList.toggle('show'); };
        $$('#boardColorPopup .color-swatch').forEach(sw => {
            sw.onclick = () => { canvasState.color = sw.dataset.color; $('boardColorPopup').classList.remove('show'); };
        });
        $('boardColor').oninput = (e) => canvasState.color = e.target.value;
    }
    
    $('clearBoardBtn').onclick = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); };

    $('exportBoardToDocBtn').onclick = () => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL(); 
        img.style.maxWidth = '100%'; 
        img.style.borderRadius = '12px'; 
        img.style.margin = '10px 0';
        $('editor').appendChild(img);
        if (state.activeDoc) { state.activeDoc.content = $('editor').innerHTML; saveState(); }
        showToast('تصویر بوم به متن اضافه شد');
    };
}

function restoreCanvas() {
    if (!state.activeDoc || !state.activeDoc.board) return;
    const canvas = $('scratchpadCanvas'); 
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { 
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
    };
    img.src = state.activeDoc.board;
}

/* ---------------- تنظیمات ---------------- */
function initSettings() {
    $('resetRoleBtn').onclick = () => { 
        state.role = null; 
        localStorage.removeItem(STORAGE_KEYS.role); 
        $('settingsModal').classList.remove('show'); 
        showRoleView(); 
    };
    $('clearDataBtn').onclick = () => { 
        if (confirm('آیا مطمئن هستید؟ تمام اطلاعات حذف خواهد شد.')) { 
            localStorage.clear(); 
            location.reload(); 
        } 
    };
    
    $('autoSaveToggle').checked = state.autoSave;
    $('autoSaveToggle').onchange = (e) => {
        state.autoSave = e.target.checked; 
        localStorage.setItem('vizhar_autosave', state.autoSave);
        showToast(state.autoSave ? 'ذخیره خودکار فعال شد' : 'غیرفعال شد');
    };
}

function showToast(msg) {
    const t = document.createElement('div'); 
    t.textContent = msg;
    t.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:var(--accent-main); color:#fff; padding:10px 20px; border-radius:12px; z-index:99999; font-family:'YekanBakh'; box-shadow:var(--shadow-float);`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2000);
}

function escapeHtml(str) { 
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); 
}

/* ---------------- راه‌اندازی نهایی ---------------- */
function init() {
    loadState(); 
    initTheme(); 
    initEditor(); 
    initFontDropdowns(); 
    initNoteModal(); 
    initCanvas(); 
    initImport(); 
    initSettings();

    // انتخاب نقش
    $$('.role-card').forEach(card => {
        card.addEventListener('click', () => { state.role = card.dataset.role; saveState(); showDashboard(); });
    });

    // ناوبری
    $('backToDashBtn').onclick = () => {
        if (state.activeDoc) { 
            state.activeDoc.content = $('editor').innerHTML; 
            state.activeDoc.title = $('documentTitle').value.trim(); 
            saveState(); 
        }
        showDashboard();
    };
    $('createNewDocBtn').onclick = createDoc;
    $('settingsBtn').onclick = () => $('settingsModal').classList.add('show');
    $('addFolderBtn').onclick = () => $('addFolderModal').classList.add('show');
    $('confirmAddFolderBtn').onclick = () => {
        const name = $('newFolderName').value.trim(); 
        if (!name) return;
        state.folders.push({ id: 'f_' + Date.now(), name });
        saveState(); 
        $('newFolderName').value = ''; 
        $('addFolderModal').classList.remove('show'); 
        renderFolders();
    };

    // حالت تمرکز
    $('focusModeBtn').onclick = () => {
        document.body.classList.toggle('focus-mode');
        const icon = $('focusModeBtn').querySelector('i');
        icon.className = document.body.classList.contains('focus-mode') ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
    };

    // بستن مودال‌ها
    $$('.btn-close-modal').forEach(btn => btn.onclick = () => btn.closest('.modal').classList.remove('show'));
    $$('.modal').forEach(modal => { modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); }; });

    // Drag and Drop
    const editorBox = $('editor'), dragOverlay = $('dragOverlay');
    editorBox.addEventListener('dragover', (e) => { e.preventDefault(); dragOverlay.classList.remove('hidden'); });
    editorBox.addEventListener('dragleave', (e) => { if (!editorBox.contains(e.relatedTarget)) dragOverlay.classList.add('hidden'); });
    editorBox.addEventListener('drop', (e) => {
        e.preventDefault(); 
        dragOverlay.classList.add('hidden');
        const file = e.dataTransfer.files[0]; 
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (file.type.startsWith('image/')) {
                document.execCommand('insertHTML', false, `<img src="${event.target.result}" style="max-width:100%; border-radius:12px; margin:10px 0;">`);
                if (state.activeDoc) { state.activeDoc.content = editorBox.innerHTML; saveState(); }
                showToast('تصویر اضافه شد');
            }
        };
        if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    });

    // بستن لودینگ
    window.addEventListener('load', () => { setTimeout(() => $('loading-screen').classList.add('hidden-loader'), 500); });
    
    // شروع
    if (state.role) showDashboard(); 
    else showRoleView();
}

document.addEventListener('DOMContentLoaded', init);
