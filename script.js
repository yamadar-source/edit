const game = {
    currentStep: 0,
    reasons: [],
    classifications: {
        client: [],
        editor: [],
        both: []
    },
    inHouseHard: [], // Array of strings from reasons that are hard to do in-house
    shoulderValue: "", // Answer to Q4
    closingYes: true, // Answer to Step 5
    logs: [], // Array of { time, text }
    qaLogs: [], // Array of { question, answer }
    level: 1,

    // Configuration
    enemies: [
        { name: "スライム", img: "slime.png", bg: "bg-grassland" }, // Intro & Q1
        { name: "こうもり", img: "bat.png", bg: "bg-cave" }, // Q2
        { name: "ゴースト", img: "ghost.png", bg: "bg-dungeon" }, // Q3
        { name: "ゴーレム", img: "golem.png", bg: "bg-castle" }, // Q4
        { name: "ドラゴン", img: "boss.png", bg: "bg-castle" } // Q5 & Summary
    ],

    init: function () {
        this.updateScene(0);
        this.showStep(0);
        this.updateLevelDisplay();

        // Check for save data
        if (localStorage.getItem('rpg_save')) {
            const btn = document.getElementById('continue-btn');
            if (btn) btn.style.display = 'inline-block';
        }
    },

    // Level System
    levelUp: function () {
        this.level++;
        this.updateLevelDisplay();

        // Trigger Animation
        const effect = document.getElementById('level-up-effect');
        effect.classList.remove('level-up-anim');
        void effect.offsetWidth; // Trigger reflow
        effect.classList.add('level-up-anim');

        this.log(`【システム】 レベルが ${this.level} に あがった！`);
    },

    updateLevelDisplay: function () {
        document.getElementById('level-display').textContent = `Lv. ${this.level}`;
    },

    // Save & Load System
    saveGame: function () {
        const data = this.createSaveData();
        localStorage.setItem('rpg_save', JSON.stringify(data));
        this.log("【システム】 ゲームを セーブしました");
        alert("セーブしました！");
    },

    loadGame: function () {
        const json = localStorage.getItem('rpg_save');
        if (json) {
            this.loadData(JSON.parse(json));
            this.log("【システム】 セーブデータを ロードしました");
        }
    },

    createSaveData: function () {
        return {
            currentStep: this.currentStep,
            reasons: this.reasons,
            classifications: this.classifications,
            inHouseHard: this.inHouseHard,
            shoulderValue: this.shoulderValue,
            closingYes: this.closingYes,
            logs: this.logs,
            qaLogs: this.qaLogs,
            level: this.level
        };
    },

    loadData: function (data) {
        this.currentStep = data.currentStep;
        this.reasons = data.reasons || [];
        this.classifications = data.classifications || { client: [], editor: [], both: [] };
        this.inHouseHard = data.inHouseHard || [];
        this.shoulderValue = data.shoulderValue || "";
        this.closingYes = data.closingYes !== undefined ? data.closingYes : true;
        this.logs = data.logs || [];
        this.qaLogs = data.qaLogs || [];
        this.level = data.level || 1;

        // Restore UI
        this.updateScene(this.currentStep);
        this.showStep(this.currentStep);
        this.onStepEnter(this.currentStep);
        this.updateLevelDisplay();

        // Restore Logs
        document.getElementById('log-content').innerHTML = '';
        this.logs.forEach(entry => this.renderLogEntry(entry));

        // Restore QA Logs
        document.getElementById('qa-content').innerHTML = '';
        this.qaLogs.forEach(entry => this.renderQAEntry(entry));

        // Restore specific step states
        if (this.currentStep === 1) this.renderQ1List();
        if (this.currentStep === 2) this.renderQ2();
        if (this.currentStep === 3) this.renderQ3();
    },

    // Export / Import
    exportSave: function () {
        const data = this.createSaveData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `rpg_save_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log("【システム】 セーブデータを ファイルに かきだしました");
    },

    importSave: function (input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadData(data);
                this.log("【システム】 ファイルから データを よみこみました");
                alert("読み込み完了！");
            } catch (err) {
                alert("ファイルの読み込みに失敗しました");
                console.error(err);
            }
        };
        reader.readAsText(file);
        input.value = ''; // Reset input
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

    // QA Log System
    logQA: function (question, answer) {
        const entry = { question, answer };
        this.qaLogs.push(entry);
        this.renderQAEntry(entry);
    },

    renderQAEntry: function (entry) {
        const container = document.getElementById('qa-content');
        const div = document.createElement('div');
        div.className = 'qa-entry';
        div.innerHTML = `
            <div class="qa-question">${entry.question}</div>
            <div class="qa-answer">${entry.answer}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    // Navigation
    nextStep: function () {
        if (this.currentStep < 6) {
            // Level Up Check: Only level up when moving forward from a battle step (1-5)
            if (this.currentStep >= 1 && this.currentStep <= 5) {
                this.levelUp();
            }

            this.currentStep++;
            this.updateScene(this.currentStep);
            this.showStep(this.currentStep);
            this.onStepEnter(this.currentStep);
            this.log(`【システム】 STEP ${this.currentStep} へ すすんだ`);
        }
    },

    prevStep: function () {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateScene(this.currentStep);
            this.showStep(this.currentStep);
            this.onStepEnter(this.currentStep);
            this.log(`【システム】 STEP ${this.currentStep} へ もどった`);
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

        // Back button state
        document.getElementById('back-btn').disabled = (step === 0 || step === 6); // Disable on title and summary
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

    // Quest 1: Money Reason
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
            this.logQA("お金を払う理由は？", text);

            document.getElementById('q1-next').disabled = false;
        }
    },

    renderQ1List: function () {
        const list = document.getElementById('q1-list');
        list.innerHTML = this.reasons.map(r => `<li>${r}</li>`).join('');
    },

    // Quest 2: Who's Value? (Classification)
    renderQ2: function () {
        // Initialize classifications if empty
        if (this.classifications.client.length === 0 &&
            this.classifications.editor.length === 0 &&
            this.classifications.both.length === 0) {
            this.classifications.both = [...this.reasons];
        }

        this.renderZone('zone-client', this.classifications.client, 'client');
        this.renderZone('zone-both', this.classifications.both, 'both');
        this.renderZone('zone-editor', this.classifications.editor, 'editor');

        document.getElementById('q2-next').disabled = this.classifications.both.length > 0;
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
        let nextType = 'both';
        let nextTypeName = '両方';
        if (fromType === 'both') { nextType = 'client'; nextTypeName = '発注側'; }
        else if (fromType === 'client') { nextType = 'editor'; nextTypeName = '編集側'; }
        else if (fromType === 'editor') { nextType = 'both'; nextTypeName = '両方'; }

        this.classifications[nextType].push(item);
        this.log(`【ぶんるい】 ${item} → ${nextTypeName}`);
        this.renderQ2();
    },

    // Quest 3: In-house? (Selection)
    renderQ3: function () {
        const list = document.getElementById('q3-list');
        list.innerHTML = '';
        this.reasons.forEach((reason, index) => {
            const div = document.createElement('div');
            div.className = 'selection-item';
            if (this.inHouseHard.includes(reason)) div.classList.add('selected');
            div.textContent = reason;
            div.onclick = () => {
                if (this.inHouseHard.includes(reason)) {
                    this.inHouseHard = this.inHouseHard.filter(r => r !== reason);
                } else {
                    this.inHouseHard.push(reason);
                }
                this.renderQ3();
                this.attackEffect();
                this.log(`【せんたく】 ${reason} を ${this.inHouseHard.includes(reason) ? '追加' : '削除'}`);
                document.getElementById('q3-next').disabled = false; // Enable once interacted
            };
            list.appendChild(div);
        });
    },

    // Quest 4: Shoulder what?
    renderQ4: function () {
        document.getElementById('q4-input').value = this.shoulderValue;
        document.getElementById('q4-input').focus();
    },

    handleQ4Input: function (event) {
        if (event.key === 'Enter') this.submitQ4Answer();
    },

    submitQ4Answer: function () {
        const input = document.getElementById('q4-input');
        const text = input.value.trim();
        if (text) {
            this.shoulderValue = text;
            this.attackEffect();
            this.log(`【Q4回答】 肩代わりするもの: ${text}`);
            this.logQA("代行編集は何を肩代わりする？", text);
            this.nextStep();
        }
    },

    // Quest 5: Closing
    finishGame: function (isYes) {
        this.closingYes = isYes;
        this.attackEffect();
        this.log(`【かくにん】 ズレはありますか？ → ${isYes ? 'いいえ(YES)' : 'はい(NO)'}`);
        this.logQA("認識のズレは？", isYes ? "なし (クエストクリア)" : "あり (次の冒険へ)");
        setTimeout(() => this.nextStep(), 1000); // Wait for effect
    },

    // Summary & CSV
    renderSummary: function () {
        const msg = document.getElementById('summary-closing-msg');
        if (this.closingYes) {
            msg.innerHTML = `
                <p>今日出た答え、どれも間違いじゃないです。</p>
                <p>ただ、「私たちは、こういう価値を提供してるよね」という地図が少し揃ったと思っています。</p>
                <p><strong>クエストクリア！ おめでとう！</strong></p>
            `;
            document.body.classList.add('gorgeous-ending');
            this.showMessage("おめでとう！ すべての クエストを クリアした！");
        } else {
            msg.innerHTML = `
                <p>なるほど、まだ冒険は続くようですね。</p>
                <p>「じゃあ次の冒険で続きをやろう」</p>
            `;
            document.body.classList.remove('gorgeous-ending');
            this.showMessage("ぼうけんは まだ つづく...");
        }

        document.getElementById('sum-shoulder').textContent = this.shoulderValue || "（未入力）";
        document.getElementById('sum-client-list').innerHTML = this.classifications.client.map(i => `<li>${i}</li>`).join('');
        document.getElementById('sum-editor-list').innerHTML = this.classifications.editor.map(i => `<li>${i}</li>`).join('');
        document.getElementById('sum-hard-list').innerHTML = this.inHouseHard.map(i => `<li>${i}</li>`).join('');
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
        this.classifications.client.forEach(i => csvContent += `Quest 2,発注側の価値,${i}\n`);
        this.classifications.editor.forEach(i => csvContent += `Quest 2,編集側の価値,${i}\n`);
        this.classifications.both.forEach(i => csvContent += `Quest 2,両方の価値,${i}\n`);

        // Q3
        this.inHouseHard.forEach(i => csvContent += `Quest 3,内製では難しいもの,${i}\n`);

        // Q4
        csvContent += `Quest 4,肩代わりするもの,${this.shoulderValue}\n`;

        // Closing
        csvContent += `Closing,認識のズレ,${this.closingYes ? "なし" : "あり"}\n`;

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
