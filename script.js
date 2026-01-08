const game = {
    currentStep: 0,
    reasons: [], // Single words from Q1
    sentences: {}, // Map of reason -> sentence from Q2
    inHouseChoice: "", // Answer to Q3
    shoulderValue: "", // Answer to Q4 (〇〇)
    focusValue: "", // Answer to Q5 (△△)
    closingYes: true,
    logs: [],
    qaLogs: [],
    level: 1,

    // Configuration
    enemies: [
        { name: "スライム", img: "slime.png", bg: "bg-grassland" }, // Step 0 & 1
        { name: "スライム", img: "slime.png", bg: "bg-grassland" }, // Step 2
        { name: "どうくつ", img: "ghost.png", bg: "bg-cave" }, // Step 3 (Using ghost as cave monster)
        { name: "つよそうな まもの", img: "golem.png", bg: "bg-castle" }, // Step 4
        { name: "ドラゴン", img: "boss.png", bg: "bg-castle" } // Step 5 & 6
    ],

    hints: {
        1: `<h3>💡 ヒント (Q1)</h3>
            <p>「なぜお金を払ってまで頼むのか？」を考えてみましょう。</p>
            <ul>
                <li>時間、楽、安心、クオリティ、任せられる など</li>
            </ul>`,
        2: `<h3>💡 ヒント (Q2)</h3>
            <p>単語を「〜だから助かる」という文章にしてみましょう。</p>
            <p>※ クリエイターが撮影した“あと”に、何が たすかっているかをイメージしてみてください。</p>
            <ul>
                <li>例：時間 →「編集に使う時間を減らせる」</li>
                <li>例：安心 →「ミスや品質を気にしなくていい」</li>
            </ul>`,
        3: `<h3>💡 ヒント (Q3)</h3>
            <p>「自分たちでやる」のと「外に頼む」の違いは何でしょう？</p>
            <p>※ クリエイター本人が 編集・判断・修正まで すべて背負った場合を想像してください。</p>
            <p>代行じゃないと難しそうな部分を探してみてください。</p>`,
        4: `<h3>💡 ヒント (Q4)</h3>
            <p>代行編集は、単なる作業以上の何を背負っていますか？</p>
            <ul>
                <li>判断、責任、不安、品質担保、時間管理 など</li>
            </ul>`
    },

    init: function () {
        this.updateScene(0);
        this.showStep(0);
        this.updateLevelDisplay();

        if (localStorage.getItem('rpg_save')) {
            const btn = document.getElementById('continue-btn');
            if (btn) btn.style.display = 'inline-block';
        }
    },

    // Help System
    showHelp: function () {
        const hint = this.hints[this.currentStep];
        if (hint) {
            document.getElementById('help-text').innerHTML = hint;
            document.getElementById('help-modal').style.display = 'flex';
            this.log("【システム】 お助けアイテムを つかった");
        } else {
            alert("このステップには ヒントが ありません。");
        }
    },

    closeHelp: function () {
        document.getElementById('help-modal').style.display = 'none';
    },

    // Level System
    levelUp: function () {
        this.level++;
        this.updateLevelDisplay();
        const effect = document.getElementById('level-up-effect');
        effect.classList.remove('level-up-anim');
        void effect.offsetWidth;
        effect.classList.add('level-up-anim');
        this.log(`【システム】 レベルが ${this.level} に ああがった！`);
    },

    updateLevelDisplay: function () {
        document.getElementById('level-display').textContent = `Lv. ${this.level}`;
    },

    // Save & Load
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
            sentences: this.sentences,
            inHouseChoice: this.inHouseChoice,
            shoulderValue: this.shoulderValue,
            focusValue: this.focusValue,
            closingYes: this.closingYes,
            logs: this.logs,
            qaLogs: this.qaLogs,
            level: this.level
        };
    },

    loadData: function (data) {
        this.currentStep = data.currentStep;
        this.reasons = data.reasons || [];
        this.sentences = data.sentences || {};
        this.inHouseChoice = data.inHouseChoice || "";
        this.shoulderValue = data.shoulderValue || "";
        this.focusValue = data.focusValue || "";
        this.closingYes = data.closingYes !== undefined ? data.closingYes : true;
        this.logs = data.logs || [];
        this.qaLogs = data.qaLogs || [];
        this.level = data.level || 1;

        this.updateScene(this.currentStep);
        this.showStep(this.currentStep);
        this.onStepEnter(this.currentStep);
        this.updateLevelDisplay();

        document.getElementById('log-content').innerHTML = '';
        this.logs.forEach(entry => this.renderLogEntry(entry));
        document.getElementById('qa-content').innerHTML = '';
        this.qaLogs.forEach(entry => this.renderQAEntry(entry));
    },

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
    },

    importSave: function (input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadData(data);
                alert("読み込み完了！");
            } catch (err) {
                alert("ファイルの読み込みに失敗しました");
            }
        };
        reader.readAsText(file);
        input.value = '';
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
            const growthMessages = {
                1: "▶ ことばの たね を てにいれた",
                2: "▶ たねが ぶんしょう に へんかした",
                3: "▶ 代行でないと つらい ところが みえてきた",
                4: "▶ 価値に なまえを つけた"
            };

            if (this.currentStep >= 1 && this.currentStep <= 5) {
                this.levelUp();
            }
            this.currentStep++;
            this.updateScene(this.currentStep);

            // Show growth message AFTER updateScene so it's not overwritten
            if (growthMessages[this.currentStep - 1]) {
                this.showMessage(growthMessages[this.currentStep - 1]);
            }

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
        let message = "";

        if (step === 0 || step === 1) {
            enemyIndex = 0;
            message = "スライムが あらわれた！";
        } else if (step === 2) {
            enemyIndex = 1;
            message = "スライムは ぶきみな言葉を はなしている…";
        } else if (step === 3) {
            enemyIndex = 2;
            message = "まえに すすむ と どうくつが みえる…";
        } else if (step === 4) {
            enemyIndex = 3;
            message = "つよそうな まものが あらわれた！";
        } else if (step >= 5) {
            enemyIndex = 4;
            message = "＼クエストクリア／";
        }

        const enemy = this.enemies[enemyIndex];
        document.getElementById('enemy-img').src = enemy.img;
        document.getElementById('background-layer').className = enemy.bg;
        this.showMessage(message);

        document.getElementById('back-btn').disabled = (step === 0 || step === 6);
        document.getElementById('help-btn').disabled = (step === 0 || step === 5 || step === 6);
    },

    showStep: function (stepIndex) {
        document.querySelectorAll('.step').forEach((el, index) => {
            el.classList.toggle('active', index === stepIndex);
        });
    },

    showMessage: function (text) {
        document.getElementById('message-text').textContent = text;
    },

    onStepEnter: function (step) {
        if (step === 2) this.renderQ2();
        if (step === 4) this.renderQ4();
        if (step === 5) this.renderQ5();
        if (step === 6) this.renderSummary();

        // Highlight logs in Step 5
        if (step === 5) {
            this.highlightLogs();
        }
    },

    highlightLogs: function () {
        const qaEntries = document.querySelectorAll('.qa-entry');
        qaEntries.forEach(entry => {
            const question = entry.querySelector('.qa-question').textContent;
            // Highlight specific questions that lead to the final conclusion
            if (question.includes("お金を払う理由") || question.includes("何を肩代わりする")) {
                entry.classList.add('highlight');
            }
        });
    },

    attackEffect: function () {
        const enemy = document.getElementById('enemy-img');
        const damage = document.getElementById('damage-effect');
        enemy.classList.add('shake');
        damage.classList.remove('damage-anim');
        void damage.offsetWidth;
        damage.classList.add('damage-anim');
        setTimeout(() => enemy.classList.remove('shake'), 500);
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
            this.log(`【こうげき】 ${text}`);
            this.logQA("お金を払う理由は？", text);
            document.getElementById('q1-next').disabled = false;
        }
    },

    renderQ1List: function () {
        const list = document.getElementById('q1-list');
        list.innerHTML = this.reasons.map(r => `<li>${r}</li>`).join('');
    },

    // Quest 2
    renderQ2: function () {
        const area = document.getElementById('q2-sentence-area');
        area.innerHTML = '';
        this.reasons.forEach(reason => {
            const row = document.createElement('div');
            row.className = 'sentence-row';
            row.innerHTML = `
                <span class="sentence-label">${reason} →</span>
                <input type="text" class="q2-sentence-input" data-reason="${reason}" 
                    placeholder="〜だから助かる" value="${this.sentences[reason] || ''}">
            `;
            area.appendChild(row);
        });
    },

    saveQ2Sentences: function () {
        const inputs = document.querySelectorAll('.q2-sentence-input');
        inputs.forEach(input => {
            const reason = input.getAttribute('data-reason');
            const sentence = input.value.trim();
            if (sentence) {
                this.sentences[reason] = sentence;
                this.logQA(`${reason}を文章にすると？`, sentence);
            }
        });
    },

    // Quest 3
    setInHouseChoice: function (choice) {
        this.inHouseChoice = choice;
        document.querySelectorAll('.btn-choice').forEach(btn => {
            btn.classList.toggle('selected', btn.textContent === choice);
        });
        document.getElementById('q3-next').disabled = false;
        this.attackEffect();
        this.log(`【せんたく】 内製との比較: ${choice}`);
        this.logQA("内製でも得られそう？", choice);
    },

    // Quest 4
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
            this.logQA("何を肩代わりする？", text);
            this.nextStep();
        }
    },

    // Quest 5
    renderQ5: function () {
        document.getElementById('display-shoulder').textContent = this.shoulderValue;
        document.getElementById('q5-focus-input').value = this.focusValue;
        document.getElementById('q5-focus-input').focus();
    },

    finishGame: function (isYes) {
        this.focusValue = document.getElementById('q5-focus-input').value.trim();
        this.closingYes = isYes;
        this.attackEffect();
        this.log(`【かくにん】 違和感はありますか？ → ${isYes ? 'いいえ' : 'はい'}`);
        this.logQA("本来やるべきこと", this.focusValue);
        this.logQA("認識のズレは？", isYes ? "なし" : "あり");
        setTimeout(() => this.nextStep(), 1000);
    },

    // Summary
    renderSummary: function () {
        const msg = document.getElementById('summary-closing-msg');
        if (this.closingYes) {
            msg.innerHTML = `<p><strong>クエストクリア！ おめでとう！</strong></p>`;
            document.body.classList.add('gorgeous-ending');
        } else {
            msg.innerHTML = `<p>ぼうけんは まだ つづく...</p>`;
            document.body.classList.remove('gorgeous-ending');
        }

        const resultText = `代行編集の価値は、「${this.shoulderValue}を肩代わりしてくれること」。\n特に大きいのは、「${this.focusValue}を気にせず、本来やるべきことに集中できる」点。`;
        document.getElementById('final-result-text').innerText = resultText;

        this.saveQ2Sentences(); // Ensure sentences are saved for AI summary
    },

    showAISummary: function () {
        const area = document.getElementById('ai-summary-area');
        const text = document.getElementById('ai-summary-text');

        let summary = "【今回の対話のまとめ】\n\n";
        summary += `● 代行編集に期待すること（単語）:\n   ${this.reasons.join(', ')}\n\n`;
        summary += `● 具体的なメリット:\n`;
        for (let r in this.sentences) {
            if (this.sentences[r]) summary += `   ・${r} → ${this.sentences[r]}\n`;
        }
        summary += `\n● 内製との比較:\n   ${this.inHouseChoice}\n\n`;
        summary += `● 価値の正体:\n   「${this.shoulderValue}」の肩代わり\n\n`;
        summary += `● 最終的な定義:\n   「${this.shoulderValue}を肩代わりし、${this.focusValue}を気にせず本来の業務に集中させる存在」`;

        text.textContent = summary;
        area.style.display = 'block';
        document.getElementById('ai-summary-btn').style.display = 'none';
        this.log("【システム】 AI要約を 表示した");
    },

    downloadCSV: function () {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Category,Question,Answer\n";
        this.reasons.forEach(r => csvContent += `Quest 1,お金を払う理由,${r}\n`);
        for (let r in this.sentences) csvContent += `Quest 2,${r}の具体化,${this.sentences[r]}\n`;
        csvContent += `Quest 3,内製との比較,${this.inHouseChoice}\n`;
        csvContent += `Quest 4,肩代わりするもの,${this.shoulderValue}\n`;
        csvContent += `Quest 5,集中すべきこと,${this.focusValue}\n`;
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
