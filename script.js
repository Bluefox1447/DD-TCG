const elements = {
    fileIn: document.getElementById('fileIn'),
    cardImg: document.getElementById('cardImg'),
    deckCountDisplay: document.getElementById('deckCount'),
    hpContent: document.getElementById('hpContent'),
    handDisplay: document.getElementById('handDisplay'),
    previewImg: document.getElementById('fullCardPreview'),
    deckNode: document.getElementById('deckNode'),
    delectZone: document.getElementById('delectZone'),
    contextMenu: document.getElementById('contextMenu'),
    modalGrid: document.getElementById('modalGrid'),
    deckModal: document.getElementById('deckModal'),
    costInput: document.getElementById('costVal'),
    overlay: document.getElementById('fullImageOverlay'),
    displayImg: document.getElementById('fullImageDisplay'),
    diceResult: document.getElementById('diceResult')
};

let deck = [];
let delectDeck = [];
let dragSrcEl = null;
let selectedFieldCard = null;
let currentMenuSource = '';

// --- 1. ระบบลูกเต๋าและแต้ม COST ---
function rollD10() {
    const diceEl = elements.diceResult;
    const costIn = elements.costInput;
    if (!diceEl || !costIn) return;

    let count = 0;
    diceEl.classList.add('dice-rolling');

    let itv = setInterval(() => {
        diceEl.innerText = Math.floor(Math.random() * 10);
        if(count++ > 15) {
            clearInterval(itv);
            const rolledValue = Math.floor(Math.random() * 10);
            diceEl.innerText = rolledValue;
            diceEl.classList.remove('dice-rolling');

            let currentCost = parseInt(costIn.value) || 0;
            let newCost = currentCost + rolledValue;
            costIn.value = Math.min(10, newCost);
        }
    }, 50);
}

// ฟังก์ชันเปิด/ปิด หน้าต่างทอยลูกเต๋า
function openDiceModal() {
    const modal = document.getElementById('diceModal');
    modal.style.display = 'flex';
    document.getElementById('bigDiceDisplay').innerText = '?';
}

function closeDiceModal() {
    document.getElementById('diceModal').style.display = 'none';
}

// ฟังก์ชันทอยลูกเต๋า D10 แบบสุ่มเลขในหน้าต่าง Modal
function rollBigDice() {
    const diceDisplay = document.getElementById('bigDiceDisplay');
    let count = 0;
    
    let itv = setInterval(() => {
        diceDisplay.innerText = Math.floor(Math.random() * 10);
        diceDisplay.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
        
        if(count++ > 20) {
            clearInterval(itv);
            const finalValue = Math.floor(Math.random() * 10);
            diceDisplay.innerText = finalValue;
            diceDisplay.style.transform = `rotate(0deg)`;
            
            // เอฟเฟกต์แสงวาบเมื่อได้ผลลัพธ์
            diceDisplay.style.boxShadow = "0 0 40px #fff";
            setTimeout(() => diceDisplay.style.boxShadow = "none", 400);
        }
    }, 50);
}

// ปิด Modal เมื่อคลิกที่พื้นหลัง
window.addEventListener('mousedown', function(e) {
    const diceModal = document.getElementById('diceModal');
    if (e.target === diceModal) {
        closeDiceModal();
    }
});



// --- 2. ระบบ Drag & Drop ---
function handleDragStart(e) { 
    dragSrcEl = this; 
    e.dataTransfer.setData('text/plain', this.style.backgroundImage); 
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const bgImage = e.dataTransfer.getData('text/plain');
    if(!bgImage) return;

    if(this.id === 'delectZone') {
        const url = bgImage.replace(/url\(["']?(.*?)["']?\)/, '$1');
        delectDeck.push(url);
        this.style.backgroundImage = bgImage;
        document.getElementById('delectLabel').style.display = 'none';
        if(dragSrcEl) dragSrcEl.remove();
        return;
    }

    if(this.id === 'hpContent') {
        if(this.children.length >= 8) return alert("HP Zone เต็มแล้ว!");
        addCardToHp(bgImage.replace(/url\(["']?(.*?)["']?\)/, '$1'));
        if(dragSrcEl) dragSrcEl.remove();
        return;
    }

    if(this.id === 'deckNode') {
        deck.push(bgImage.replace(/url\(["']?(.*?)["']?\)/, '$1'));
        updateDeckDisplay();
        if(dragSrcEl) dragSrcEl.remove();
        return;
    }

    const limit = parseInt(this.getAttribute('data-limit'));
    if(limit && this.children.length >= limit) return alert("โซนนี้เต็มแล้ว!");

    addCardToZone(this, bgImage);
    if(dragSrcEl) dragSrcEl.remove();
}

function addCardToZone(zone, bgImage) {
    const container = document.createElement('div');
    container.className = 'card-container';
    
    const card = document.createElement('div');
    card.className = zone.id === 'handDisplay' ? 'card-in-hand' : 'card-on-board';
    if(zone.id === 'ptZone') { card.style.width = '45px'; card.style.height = '65px'; }
    card.style.backgroundImage = bgImage;
    card.draggable = true;

    card.onclick = function() {
    elements.previewImg.style.backgroundImage = bgImage;
    
    // ล้างโทเค็นเก่าใน Preview ออก
    let oldOverlay = elements.previewImg.querySelector('.card-totem-overlay');
    if (oldOverlay) oldOverlay.remove();

    // ถ้าการ์ดในสนามมีโทเค็น ให้คัดลอกไปแสดงที่ Preview
    const currentOverlay = container.querySelector('.card-totem-overlay');
    if (currentOverlay) {
        const previewOverlay = currentOverlay.cloneNode(true);
        // ปรับขนาดโทเค็นใน Preview ให้ดูเหมาะสม (ขยาย 1.5 เท่า)
        previewOverlay.style.transform = "scale(1.5)";
        previewOverlay.style.transformOrigin = "top left";
        previewOverlay.style.top = "15px";
        previewOverlay.style.left = "15px";
        elements.previewImg.appendChild(previewOverlay);
    }
};

    card.oncontextmenu = (ev) => {
        ev.preventDefault();
        selectedFieldCard = card;
        document.getElementById('deckOptions').style.display = 'none';
        document.getElementById('fieldOptions').style.display = 'block';
        elements.contextMenu.style.display = 'block';
        elements.contextMenu.style.left = ev.pageX + 'px'; 
        elements.contextMenu.style.top = ev.pageY + 'px';
    };

    const linkArea = document.createElement('div');
    linkArea.className = 'link-area drop-zone';
    linkArea.ondrop = function(ev) {
        ev.preventDefault(); ev.stopPropagation();
        const linkImg = ev.dataTransfer.getData('text/plain');
        if (!linkImg || !linkImg.includes('url')) return;

        const lc = document.createElement('div');
        lc.className = 'link-card'; 
        lc.style.backgroundImage = linkImg;
        lc.onclick = (e) => {
            e.stopPropagation();
            createHandCardFromUrl(linkImg.replace(/url\(["']?(.*?)["']?\)/, '$1'));
            lc.remove();
        };
        this.appendChild(lc);
        if(dragSrcEl) dragSrcEl.remove();
    };

    container.appendChild(card);
    container.appendChild(linkArea);
    
    // เรียกใช้งานระบบ Token
    setupTotemDrop(container);

    zone.appendChild(container);
    addDragEvents(card);
}

// --- 3. ระบบ Totem Tokens ---
function handleTotemDrag(e, type) {
    e.dataTransfer.setData('totemType', type);
}

function setupTotemDrop(cardContainer) {
    cardContainer.ondragover = (e) => e.preventDefault();
    cardContainer.ondrop = function(e) {
        const totemType = e.dataTransfer.getData('totemType');
        if (!totemType) return; 

        e.preventDefault();
        e.stopPropagation();

        let overlay = this.querySelector('.card-totem-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'card-totem-overlay';
            this.appendChild(overlay);
        }

        const newToken = document.createElement('div');
        newToken.className = 'attached-totem ' + (totemType === 'blue' ? 'stat-blue' : totemType === 'red' ? 'stat-red' : 'shield-token');
        
        if (totemType === 'shield') {
            newToken.innerText = '🛡️';
        } else {
            newToken.contentEditable = true; 
            newToken.innerText = totemType === 'blue' ? '+1' : '-1';
            // อัปเดต Preview เมื่อพิมพ์
            newToken.oninput = () => {
                const card = this.querySelector('.card-on-board');
                if (card) card.click();
            };
        }

        newToken.oncontextmenu = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            newToken.remove();
            const card = this.querySelector('.card-on-board');
            if (card) card.click();
        };

        overlay.appendChild(newToken);
        
        // บังคับอัปเดต Preview ทันทีหลังวาง
        const card = this.querySelector('.card-on-board');
        if (card) card.click();
    };
}

// --- 4. ฟังก์ชันเสริมอื่นๆ ---
function updateDeckDisplay() { 
    elements.deckCountDisplay.innerText = deck.length; 
    elements.cardImg.style.display = deck.length > 0 ? "block" : "none";
    document.getElementById('deckLabel').style.display = deck.length > 0 ? 'none' : 'block';
}

function updateDelectUI() {
    if (delectDeck.length > 0) {
        elements.delectZone.style.backgroundImage = `url(${delectDeck[delectDeck.length - 1]})`;
        document.getElementById('delectLabel').style.display = 'none';
    } else {
        elements.delectZone.style.backgroundImage = 'none';
        document.getElementById('delectLabel').style.display = 'block';
    }
}

function createHandCardFromUrl(url) {
    const card = document.createElement('div'); card.className = 'card-in-hand';
    card.style.backgroundImage = `url(${url})`; card.draggable = true;
    card.onclick = () => elements.previewImg.style.backgroundImage = `url(${url})`;
    addDragEvents(card); elements.handDisplay.appendChild(card);
}

function addCardToHp(url) {
    const hp = document.createElement('div'); hp.className = 'hp-card-item';
    hp.onclick = function() { createHandCardFromUrl(url); this.remove(); };
    elements.hpContent.appendChild(hp);
}

function openViewer() {
    elements.modalGrid.innerHTML = '';
    const list = currentMenuSource === 'deck' ? deck : delectDeck;
    list.forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'modal-card-item';
        div.innerHTML = `
            <div class="modal-card-img" style="background-image:url(${url})" onclick="elements.previewImg.style.backgroundImage='url(${url})'"></div>
            <div class="modal-btn-group">
                <button onclick="pick(${i},'hand')">มือ</button>
                <button onclick="pick(${i},'attack')">Atk</button>
                <button onclick="pick(${i},'protect')">Pro</button>
                <button onclick="pick(${i},'delect')">Del</button>
            </div>`;
        elements.modalGrid.appendChild(div);
    });
    elements.deckModal.style.display = 'block';
}

window.pick = (i, target) => {
    const list = currentMenuSource === 'deck' ? deck : delectDeck;
    const url = list.splice(i, 1)[0];
    const bg = `url(${url})`;
    if (target === 'hand') createHandCardFromUrl(url);
    else if (target === 'attack') addCardToZone(document.getElementById('attackZone'), bg);
    else if (target === 'protect') addCardToZone(document.getElementById('protectZone'), bg);
    else if (target === 'delect') { delectDeck.push(url); updateDelectUI(); }
    updateDeckDisplay();
    elements.deckModal.style.display = 'none';
};

// --- 5. การตั้งค่าระบบเริ่มต้น ---
elements.fileIn.onchange = function() {
    if(this.files.length === 50) {
        deck = Array.from(this.files).map(f => URL.createObjectURL(f));
        deck.sort(() => Math.random() - 0.5);
        elements.hpContent.innerHTML = '';
        for(let i=0; i<8; i++) addCardToHp(deck.shift());
        elements.handDisplay.innerHTML = '';
        for(let i=0; i<5; i++) drawCard();
        updateDeckDisplay();
    }
};

document.getElementById('opIn').onchange = function() {
    if (this.files && this.files[0]) {
        const url = URL.createObjectURL(this.files[0]);
        const opZone = document.getElementById('opZone');
        const bgImage = `url(${url})`; // สร้างรูปแบบ URL สำหรับ CSS

        // 1. แสดงชื่อไฟล์ (ถ้าต้องการ)
        document.getElementById('opName').innerText = this.files[0].name;

        // 2. ตั้งค่าพื้นหลังให้กับ Operator Zone
        opZone.style.backgroundImage = bgImage;
        opZone.style.backgroundSize = "cover";
        opZone.style.backgroundPosition = "center";
        opZone.innerHTML = ''; // ล้างตัวอักษร "Operator" ออก

        // 3. ตั้งค่าคลิกเพื่อดูรูปใน Card Preview
        opZone.onclick = function() {
            elements.previewImg.style.backgroundImage = bgImage;
            // ล้างโทเค็นเก่าใน Preview (ถ้ามี)
            let oldOverlay = elements.previewImg.querySelector('.card-totem-overlay');
            if (oldOverlay) oldOverlay.remove();
        };

        // 4. บังคับให้แสดงผลในหน้า Preview ทันทีหลังอัปโหลด
        opZone.click();
    }
};

document.getElementById('ptIn').onchange = function() {
    const ptZone = document.getElementById('ptZone'); ptZone.innerHTML = '';
    Array.from(this.files).forEach(f => addCardToZone(ptZone, `url(${URL.createObjectURL(f)})`));
};

function addDragEvents(el) { el.addEventListener('dragstart', handleDragStart); }
document.querySelectorAll('.drop-zone').forEach(z => {
    z.ondragover = (e) => e.preventDefault();
    z.addEventListener('drop', handleDrop);
});

elements.deckNode.oncontextmenu = (e) => { e.preventDefault(); currentMenuSource = 'deck'; showContextMenu(e); };
elements.delectZone.oncontextmenu = (e) => { e.preventDefault(); currentMenuSource = 'delect'; showContextMenu(e); };

function showContextMenu(e) {
    document.getElementById('fieldOptions').style.display = 'none';
    document.getElementById('deckOptions').style.display = 'block';
    elements.contextMenu.style.display = 'block';
    elements.contextMenu.style.left = e.pageX + 'px'; elements.contextMenu.style.top = e.pageY + 'px';
}

function drawCard() { if(deck.length > 0) { createHandCardFromUrl(deck.shift()); updateDeckDisplay(); } }
function shuffleDeck() { deck.sort(() => Math.random() - 0.5); alert("สับเด็คเรียบร้อย!"); }
function toggleRotate() { if(selectedFieldCard) selectedFieldCard.classList.toggle('card-horizontal'); }
function toggleLinkArea() { if(selectedFieldCard) { const area = selectedFieldCard.nextSibling; area.style.display = area.style.display === 'flex' ? 'none' : 'flex'; } }
function returnToHand() { if(selectedFieldCard) { createHandCardFromUrl(selectedFieldCard.style.backgroundImage.replace(/url\(["']?(.*?)["']?\)/, '$1')); selectedFieldCard.parentElement.remove(); } }
function closeViewer() { elements.deckModal.style.display = 'none'; }
window.onclick = () => elements.contextMenu.style.display = 'none';

// --- 6. ระบบ Zoom & View Full Image ---
let currentScale = 1, isDragging = false, startX, startY, translateX = 0, translateY = 0;
function updateImageTransform() { elements.displayImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`; }

function viewFullImage() {
    if (selectedFieldCard) {
        const bgImage = selectedFieldCard.style.backgroundImage;
        const imageUrl = bgImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        elements.displayImg.src = imageUrl;
        currentScale = 1; translateX = 0; translateY = 0;
        updateImageTransform();
        elements.overlay.style.display = 'flex';
    }
    elements.contextMenu.style.display = 'none';
}

elements.overlay.onwheel = function(e) {
    e.preventDefault();
    currentScale = Math.max(0.5, currentScale + (e.deltaY < 0 ? 0.1 : -0.1));
    updateImageTransform();
};

elements.overlay.onmousedown = function(e) {
    if (e.target === elements.displayImg) { isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; }
    else if (e.target === elements.overlay) elements.overlay.style.display = 'none';
};
window.onmousemove = function(e) { if (isDragging) { translateX = e.clientX - startX; translateY = e.clientY - startY; updateImageTransform(); } };
window.onmouseup = () => isDragging = false;

// เพิ่มการตั้งค่าคลิกขวาที่ Preview Image (วางไว้ล่างสุดของไฟล์ script.js)
elements.previewImg.oncontextmenu = function(e) {
    e.preventDefault(); // ป้องกันการเปิดเมนูมาตรฐานของเบราว์เซอร์
    
    const bgImage = this.style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
        // ดึง URL ของภาพออกจาก url("...")
        const imageUrl = bgImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        
        // ส่งภาพไปยัง Overlay
        elements.displayImg.src = imageUrl;

        // รีเซ็ตตำแหน่งซูมและลากให้มาอยู่ตรงกลาง
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();

        // แสดงหน้าจอ Overlay
        elements.overlay.style.display = 'flex';
    }
};