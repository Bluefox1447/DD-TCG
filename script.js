const fileIn = document.getElementById('fileIn');
        const cardImg = document.getElementById('cardImg');
        const deckCountDisplay = document.getElementById('deckCount');
        const hpContent = document.getElementById('hpContent');
        const handDisplay = document.getElementById('handDisplay');
        const previewImg = document.getElementById('fullCardPreview');
        const deckNode = document.getElementById('deckNode');
        const delectZone = document.getElementById('delectZone');
        const contextMenu = document.getElementById('contextMenu');
        const modalGrid = document.getElementById('modalGrid');
        const deckModal = document.getElementById('deckModal');
        
        let deck = [];
        let delectDeck = [];
        let dragSrcEl = null;
        let selectedFieldCard = null;
        let currentMenuSource = '';

        function rollD10() {
            const diceEl = document.getElementById('diceResult');
            let count = 0;
            let itv = setInterval(() => {
                diceEl.innerText = Math.floor(Math.random() * 10);
                if(count++ > 10) {
                    clearInterval(itv);
                    const res = Math.floor(Math.random() * 10);
                    diceEl.innerText = res;
                    const costIn = document.getElementById('costVal');
                    costIn.value = Math.min(10, parseInt(costIn.value) + res);
                }
            }, 50);
        }

        function handleDragStart(e) { dragSrcEl = this; e.dataTransfer.setData('text/plain', this.style.backgroundImage); }

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
                if(this.children.length >= 8) { alert("HP Zone เต็มแล้ว!"); return; }
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
            if(limit && this.children.length >= limit) { alert("โซนนี้เต็มแล้ว!"); return; }

            addCardToZone(this, bgImage);
            if(dragSrcEl) dragSrcEl.remove();
        }

        function addCardToZone(zone, bgImage) {
            const container = document.createElement('div');
            container.className = 'card-container';
            const card = document.createElement('div');
            card.className = zone.id === 'handDisplay' ? 'card-in-hand' : 'card-on-board';
            if(zone.id === 'ptZone') { card.style.width = '50px'; card.style.height = '70px'; }
            card.style.backgroundImage = bgImage;
            card.draggable = true;
            card.onclick = () => previewImg.style.backgroundImage = bgImage;
            
            card.oncontextmenu = (ev) => {
                ev.preventDefault();
                selectedFieldCard = card;
                document.getElementById('deckOptions').style.display = 'none';
                document.getElementById('fieldOptions').style.display = 'block';
                contextMenu.style.display = 'block';
                contextMenu.style.left = ev.pageX + 'px';
                contextMenu.style.top = ev.pageY + 'px';
            };

            const linkArea = document.createElement('div');
            linkArea.className = 'link-area drop-zone';
            linkArea.ondragover = (ev) => ev.preventDefault();
            linkArea.ondrop = function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                if(this.children.length >= 2) { alert("Link ได้สูงสุด 2 ใบ"); return; }
                const linkImg = ev.dataTransfer.getData('text/plain');
                const lc = document.createElement('div');
                lc.className = 'link-card';
                lc.style.backgroundImage = linkImg;
                this.appendChild(lc);
                if(dragSrcEl) dragSrcEl.remove();
            };

            container.appendChild(card);
            container.appendChild(linkArea);
            zone.appendChild(container);
            addDragEvents(card);
        }

        function toggleRotate() { if(selectedFieldCard) selectedFieldCard.classList.toggle('card-horizontal'); contextMenu.style.display = 'none'; }
        function toggleLinkArea() { if(selectedFieldCard) { const area = selectedFieldCard.nextSibling; area.style.display = area.style.display === 'flex' ? 'none' : 'flex'; } contextMenu.style.display = 'none'; }
        function returnToHand() { if(selectedFieldCard) { createHandCardFromUrl(selectedFieldCard.style.backgroundImage.replace(/url\(["']?(.*?)["']?\)/, '$1')); selectedFieldCard.parentElement.remove(); } contextMenu.style.display = 'none'; }
        
        window.onclick = () => { contextMenu.style.display = 'none'; };

        function addDragEvents(el) { el.addEventListener('dragstart', handleDragStart); }
        document.querySelectorAll('.drop-zone').forEach(z => {
            z.ondragover = (e) => e.preventDefault();
            z.ondragenter = function() { this.classList.add('drag-over'); };
            z.ondragleave = function() { this.classList.remove('drag-over'); };
            z.addEventListener('drop', handleDrop);
        });

        function createHandCardFromUrl(url) {
            const card = document.createElement('div');
            card.className = 'card-in-hand';
            card.style.backgroundImage = `url(${url})`;
            card.draggable = true;
            card.onclick = () => previewImg.style.backgroundImage = `url(${url})`;
            addDragEvents(card);
            handDisplay.appendChild(card);
        }

        function addCardToHp(url) {
            const hp = document.createElement('div');
            hp.className = 'hp-card-item';
            hp.dataset.url = url;
            hp.onclick = function() { createHandCardFromUrl(this.dataset.url); this.remove(); };
            hpContent.appendChild(hp);
        }

        function updateDeckDisplay() { 
            deckCountDisplay.innerText = deck.length; 
            if(deck.length > 0) {
                cardImg.style.display = "block";
                document.getElementById('deckLabel').style.display = 'none';
            } else {
                cardImg.style.display = "none";
                document.getElementById('deckLabel').style.display = 'block';
            }
        }
        
        function drawCard() { if(deck.length > 0) { createHandCardFromUrl(deck.shift()); updateDeckDisplay(); } }
        function shuffleDeck() { deck.sort(() => Math.random() - 0.5); alert("สับเด็คเรียบร้อย!"); contextMenu.style.display = 'none'; }

        fileIn.addEventListener('change', function() {
            if(this.files.length === 50) {
                deck = Array.from(this.files).map(f => URL.createObjectURL(f));
                deck.sort(() => Math.random() - 0.5);
                hpContent.innerHTML = '';
                for(let i=0; i<8; i++) addCardToHp(deck.shift());
                handDisplay.innerHTML = '';
                for(let i=0; i<5; i++) drawCard();
                updateDeckDisplay();
            }
        });

        deckNode.oncontextmenu = (e) => { 
            e.preventDefault(); 
            currentMenuSource = 'deck'; 
            document.getElementById('fieldOptions').style.display = 'none';
            document.getElementById('deckOptions').style.display = 'block';
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
        };

        function openViewer() {
            modalGrid.innerHTML = '';
            const list = currentMenuSource === 'deck' ? deck : delectDeck;
            list.forEach((url, i) => {
                const div = document.createElement('div');
                div.className = 'modal-card-item';
                div.innerHTML = `<div class="modal-card-img" style="background-image:url(${url})"></div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <button class="custom-file-upload" style="min-width: 100px; padding: 5px; font-size: 10px;" onclick="pick(${i},'hand')">มือ</button>
                        <button class="custom-file-upload" style="min-width: 100px; padding: 5px; font-size: 10px;" onclick="pick(${i},'attack')">Attack</button>
                        <button class="custom-file-upload" style="min-width: 100px; padding: 5px; font-size: 10px;" onclick="pick(${i},'protect')">Protect</button>
                    </div>`;
                modalGrid.appendChild(div);
            });
            deckModal.style.display = 'block';
        }

        window.pick = (i, target) => {
            const list = currentMenuSource === 'deck' ? deck : delectDeck;
            const url = list.splice(i, 1)[0];
            const bg = `url(${url})`;
            if(target === 'hand') createHandCardFromUrl(url);
            if(target === 'attack') addCardToZone(document.getElementById('attackZone'), bg);
            if(target === 'protect') addCardToZone(document.getElementById('protectZone'), bg);
            updateDeckDisplay();
            deckModal.style.display = 'none';
        };

        window.closeViewer = () => deckModal.style.display = 'none';

        document.getElementById('opIn').onchange = function() {
            const zone = document.getElementById('opZone');
            zone.style.backgroundImage = `url(${URL.createObjectURL(this.files[0])})`;
            zone.innerText = '';
        };

        document.getElementById('ptIn').onchange = function() {
            const ptZone = document.getElementById('ptZone');
            ptZone.innerHTML = '';
            Array.from(this.files).slice(0,4).forEach(f => {
                const url = URL.createObjectURL(f);
                addCardToZone(ptZone, `url(${url})`);
            });
            ptZone.querySelector('span')?.remove();
        };