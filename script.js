const game = {
    currentStep: 0,
    q4Step: 0, // 0 to 6 for the 7 steps of Quest 4
    reasons: [],
    criticalIndex: -1,
    classifications: {
        task: [],
        impact: [],
        uncategorized: []
    },
    q4Answers: [], // Array of objects { question, answer }
    finalSentence: "",
    logs: [], // Array of { time, text }

    // Configuration
    enemies: [
        { name: "スライム", img: "slime.png", bg: "bg-grassland" }, // Intro & Q1
        { name: "こうもり", img: "bat.png", bg: "bg-cave" }, // Q2
        { name: "ゴースト", img: "ghost.png", bg: "bg-dungeon" }, // Q3
        { name: "ゴーレム", img: "golem.png", bg: "bg-castle" }, // Q4
        { name: "ドラゴン", img: "boss.png", bg: "bg-castle" } // Q5 & Summary
    ],

    q4Questions: [
        {
            title: "STEP 1｜キリクチを ズラス",
            q: "Q4-① ナイセイにしたしゅんかん “ヨワク” なりそうなものは？",
            aim: "シツが さがる・ツヅカなくナル に イシキを ムケル"
        },
        {
            title: "STEP 1｜キリクチを ズラス",
            q: "Q4-② それがヨワクなるとしたら ドコで ムリが ウマレそう？",
            aim: "ヒト・ジカン・ハンダン・カンジョウ の ドコに フカが シュウチュウするか"
        },
        {
            title: "STEP 2｜ヘンカに キヅく",
            q: "Q4-③ ダイコウにしていることで “カンガエなくて ヨクなっているコト” は？",
            aim: "ヘンシュウ＝サギョウ から シコウ・ハンダンへ シテンを アゲル"
        },
        {
            title: "STEP 2｜ヘンカに キヅく",
            q: "Q4-④ ギャクに ホンライやるべきコトに ツカエている ジカンは？",
            aim: "アイタじかん ではなく “マエを ムケているジカン” に フォーカス"
        },
        {
            title: "STEP 3｜カンジョウの ヘンカ",
            q: "Q4-⑤ ダイコウにしていることで セイシンテキに ラクになっている シュンカンは？",
            aim: "スウチカしづらいが ジツは イチバン おおきな カチ"
        },
        {
            title: "STEP 3｜カンジョウの ヘンカ",
            q: "Q4-⑥ もし ゼンブ ナイセイに モドしたら イチバンさいしょに シンドクなりそうなのは？",
            aim: "ウシナウもの から ダイコウのカチを ギャクサン させる"
        },
        {
            title: "STEP 4｜ダイコウ ならでは",
            q: "Q4-⑦ イマのハナシを マトめると “ダイコウだからこそ” とイエル カチは？",
            aim: "チラばった コトバを ジブンたちの コトバに シュウソク させる"
        }
    ],

    init: function () {
        this.updateScene(0);
        this.showStep(0);

        // Check for save data
        if (localStorage.getItem('rpg_save')) {
            const btn = document.getElementById('continue-btn');
            if (btn) btn.style.display = 'inline-block';
        }
    },

    // Save & Load System
    saveGame: function () {
        const data = {
            currentStep: this.currentStep,
            q4Step: this.q4Step,
            reasons: this.reasons,
            criticalIndex: this.criticalIndex,
            classifications: this.classifications,
            q4Answers: this.q4Answers,
            finalSentence: this.finalSentence,
            logs: this.logs
        };
        localStorage.setItem('rpg_save', JSON.stringify(data));
        this.log("【システム】 ゲームを セーブしました");
        alert("セーブしました！");
    },

    loadGame: function () {
        const json = localStorage.getItem('rpg_save');
        if (json) {
            const data = JSON.parse(json);
            this.currentStep = data.currentStep;
            this.q4Step = data.q4Step;
            this.reasons = data.reasons || [];
            this.criticalIndex = data.criticalIndex;
            this.classifications = data.classifications || { task: [], impact: [], uncategorized: [] };
            this.q4Answers = data.q4Answers || [];
            this.finalSentence = data.finalSentence || "";
            this.logs = data.logs || [];

            // Restore UI
            this.updateScene(this.currentStep);
            this.showStep(this.currentStep);
            this.onStepEnter(this.currentStep);

            // Restore Logs
            document.getElementById('log-content').innerHTML = '';
            this.logs.forEach(entry => this.renderLogEntry(entry));

            // Restore specific step states
            if (this.currentStep === 1) this.renderQ1List();
            if (this.currentStep === 2) this.renderQ2();
            if (this.currentStep === 3) this.renderQ3();

            this.log("【システム】 セーブデータを ロードしました");
        }
    },

    // Log System
    log: function (text) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const entry = { time: timeStr, text: text };
        this.logs.push(entry);
        this.renderLogEntry(entry);
    },

    renderLogEntry: function (entry) {
        const container = document.getElementById('log-content');
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `
            <div class="log-time">${entry.time}</div>
            <div class="log-text">${entry.text}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    // Navigation
    nextStep: function () {
        if (this.currentStep < 6) {
            this.currentStep++;
            this.updateScene(this.currentStep);
            this.showStep(this.currentStep);
            this.onStepEnter(this.currentStep);
            this.log(`【システム】 STEP ${this.currentStep} へ すすんだ`);
        }
    },

    updateScene: function (step) {
        let enemyIndex = 0;
        if (step === 2) enemyIndex = 1;
        else if (step === 3) enemyIndex = 2;
        else if (step === 4) enemyIndex = 3;
        else if (step >= 5) enemyIndex = 4;

        const enemy = this.enemies[enemyIndex];
        document.getElementById('enemy-img').src = enemy.img;

        const bgLayer = document.getElementById('background-layer');
        bgLayer.className = enemy.bg;

        this.showMessage(`${enemy.name} が あらわれた！`);
    },

    showStep: function (stepIndex) {
        document.querySelectorAll('.step').forEach((el, index) => {
            if (index === stepIndex) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    },

    showMessage: function (text) {
        document.getElementById('message-text').textContent = text;
    },

    onStepEnter: function (step) {
        if (step === 2) {
            this.renderQ2();
        } else if (step === 3) {
            this.renderQ3();
        } else if (step === 4) {
            this.q4Step = 0;
            this.renderQ4();
        } else if (step === 6) {
            this.renderSummary();
        }
    },

    // Battle Effects
    attackEffect: function () {
        const enemy = document.getElementById('enemy-img');
        const damage = document.getElementById('damage-effect');

        enemy.classList.add('shake');
        damage.classList.remove('damage-anim');
        void damage.offsetWidth; // Trigger reflow
        damage.classList.add('damage-anim');

        setTimeout(() => {
            enemy.classList.remove('shake');
        }, 500);
    },

    // Quest 1
    handleQ1Input: function (event) {
        if (event.key === 'Enter') this.addReason();
    },

    addReason: function () {
        const input = document.getElementById('q1-input');
        const text = input.value.trim();
        if (text) {
            this.reasons.push(text);
            this.renderQ1List();
            input.value = '';
            input.focus();
            this.attackEffect();
            this.showMessage(`ゆうしゃは "${text}" と さけんだ！`);
            this.log(`【こうげき】 ${text}`);

            document.getElementById('q1-next').disabled = false;
        }
    },

    renderQ1List: function () {
        const list = document.getElementById('q1-list');
        list.innerHTML = this.reasons.map(r => `<li>${r}</li>`).join('');
    },

    // Quest 2
    renderQ2: function () {
        const list = document.getElementById('q2-list');
        list.innerHTML = '';
        this.reasons.forEach((reason, index) => {
            const div = document.createElement('div');
            div.className = 'selection-item';
            if (index === this.criticalIndex) div.classList.add('selected');
            div.textContent = reason;
            div.onclick = () => {
                this.criticalIndex = index;
                this.renderQ2();
                this.attackEffect();
                this.log(`【クリティカル】 ${reason} を せんたく`);
                document.getElementById('q2-next').disabled = false;
            };
            list.appendChild(div);
        });
    },

    // Quest 3
    renderQ3: function () {
        if (this.classifications.uncategorized.length === 0 &&
            this.classifications.task.length === 0 &&
            this.classifications.impact.length === 0) {
            this.classifications.uncategorized = [...this.reasons];
        }

        this.renderZone('zone-task', this.classifications.task, 'task');
        this.renderZone('zone-uncategorized', this.classifications.uncategorized, 'uncategorized');
        this.renderZone('zone-impact', this.classifications.impact, 'impact');

        document.getElementById('q3-next').disabled = this.classifications.uncategorized.length > 0;
    },

    renderZone: function (zoneId, items, type) {
        const zone = document.getElementById(zoneId);
        zone.innerHTML = '';
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'draggable-item';
            div.textContent = item;
            div.onclick = () => {
                this.moveItem(type, index);
                this.attackEffect();
            };
            zone.appendChild(div);
        });
    },

    moveItem: function (fromType, index) {
        const item = this.classifications[fromType].splice(index, 1)[0];
        let nextType = 'uncategorized';
        let nextTypeName = 'ミブンルイ';
        if (fromType === 'uncategorized') { nextType = 'task'; nextTypeName = 'サギョウ'; }
        else if (fromType === 'task') { nextType = 'impact'; nextTypeName = 'エイキョウ'; }
        else if (fromType === 'impact') { nextType = 'uncategorized'; nextTypeName = 'ミブンルイ'; }

        this.classifications[nextType].push(item);
        this.log(`【ぶんるい】 ${item} → ${nextTypeName}`);
        this.renderQ3();
    },

    // Quest 4 (7 Steps)
    renderQ4: function () {
        if (this.q4Step >= this.q4Questions.length) {
            this.nextStep(); // Go to Quest 5
            return;
        }

        const q = this.q4Questions[this.q4Step];
        const container = document.getElementById('q4-container');
        container.innerHTML = `
            <h3>${q.title}</h3>
            <p><strong>${q.q}</strong></p>
            <p style="font-size: 0.9rem; color: #aaa;">🔹狙い: ${q.aim}</p>
        `;

        document.getElementById('q4-input').value = '';
        document.getElementById('q4-input').focus();
    },

    handleQ4Input: function (event) {
        if (event.key === 'Enter') this.submitQ4Answer();
    },

    submitQ4Answer: function () {
        const input = document.getElementById('q4-input');
        const text = input.value.trim();
        if (text) {
            const q = this.q4Questions[this.q4Step];
            this.q4Answers.push({
                question: q.q,
                answer: text
            });
            this.attackEffect();
            this.log(`【Q4回答】 Q: ${q.q.substring(0, 10)}... A: ${text}`);
            this.q4Step++;
            this.renderQ4();
        }
    },

    // Quest 5
    finishGame: function () {
        const input = document.getElementById('q5-input');
        this.finalSentence = input.value.trim() || "（未入力）";
        this.attackEffect();
        this.log(`【まとめ】 ${this.finalSentence}`);
        setTimeout(() => this.nextStep(), 1000); // Wait for effect
    },

    // Summary & CSV
    renderSummary: function () {
        document.getElementById('sum-critical').textContent = this.reasons[this.criticalIndex] || "なし";
        document.getElementById('sum-sentence').textContent = this.finalSentence;

        document.getElementById('sum-task-list').innerHTML = this.classifications.task.map(i => `<li>${i}</li>`).join('');
        document.getElementById('sum-impact-list').innerHTML = this.classifications.impact.map(i => `<li>${i}</li>`).join('');

        document.getElementById('sum-q4-list').innerHTML = this.q4Answers.map(a => `
            <li>
                <div style="font-size:0.8rem; color:#888;">${a.question}</div>
                <div>${a.answer}</div>
            </li>
        `).join('');
    },

    downloadCSV: function () {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel

        // Header
        csvContent += "Category,Question,Answer\n";

        // Q1
        this.reasons.forEach(r => {
            csvContent += `Quest 1,お金を払う理由,${r}\n`;
        });

        // Q2
        csvContent += `Quest 2,一番困るもの,${this.reasons[this.criticalIndex] || ""}\n`;

        // Q3
        this.classifications.task.forEach(i => csvContent += `Quest 3,作業としての価値,${i}\n`);
        this.classifications.impact.forEach(i => csvContent += `Quest 3,影響としての価値,${i}\n`);

        // Q4
        this.q4Answers.forEach(a => {
            csvContent += `Quest 4,${a.question},${a.answer}\n`;
        });

        // Q5
        csvContent += `Quest 5,一文で言うなら,${this.finalSentence}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "value_discovery_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

game.init();
