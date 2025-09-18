document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');
    const voiceGrid = document.getElementById('voiceGrid');
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const resultSection = document.getElementById('resultSection');
    const errorMessage = document.getElementById('errorMessage');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadBtn = document.getElementById('downloadBtn');
    const resultVoice = document.getElementById('resultVoice');
    const requestId = document.getElementById('requestId');
    const delayTime = document.getElementById('delayTime');
    const customVoiceInput = document.getElementById('customVoiceInput');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKey');

    let selectedVoice = 'longxiaochun_v2';
    let availableVoices = {};

    // 从localStorage加载API密钥
    const savedApiKey = localStorage.getItem('dashscope_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        updateApiKeyDisplay();
    }

    // 保存API密钥
    saveApiKeyBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showError('请输入API密钥');
            return;
        }

        localStorage.setItem('dashscope_api_key', apiKey);
        showSuccess('API密钥已保存');
        updateApiKeyDisplay();
    });

    // 更新API密钥显示状态
    function updateApiKeyDisplay() {
        if (apiKeyInput.value) {
            saveApiKeyBtn.textContent = '已保存';
            saveApiKeyBtn.style.background = '#28a745';
        } else {
            saveApiKeyBtn.textContent = '保存密钥';
            saveApiKeyBtn.style.background = '#ffc107';
        }
    }

    // 获取API密钥
    function getApiKey() {
        return apiKeyInput.value.trim() || localStorage.getItem('dashscope_api_key');
    }

    // 加载可用音色
    loadVoices();

    // 更新字符计数
    textInput.addEventListener('input', function() {
        const count = textInput.value.length;
        charCount.textContent = count;

        if (count > 450) {
            charCount.style.color = '#ff6b6b';
        } else if (count > 400) {
            charCount.style.color = '#ffa500';
        } else {
            charCount.style.color = '#666';
        }
    });

    // 加载音色列表
    async function loadVoices() {
        try {
            const response = await fetch('/api/voices');
            availableVoices = await response.json();
            renderVoices();
        } catch (error) {
            console.error('加载音色失败:', error);
            showError('加载音色列表失败，请刷新页面重试');
        }
    }

    // 渲染音色选择器
    function renderVoices() {
        voiceGrid.innerHTML = '';

        for (const [voiceId, voiceName] of Object.entries(availableVoices)) {
            const voiceCard = document.createElement('div');
            voiceCard.className = 'voice-card';
            if (voiceId === selectedVoice) {
                voiceCard.classList.add('selected');
            }

            voiceCard.innerHTML = `
                <input type="radio" name="voice" value="${voiceId}" id="voice_${voiceId}">
                <label for="voice_${voiceId}" class="voice-name">${voiceName}</label>
            `;

            voiceCard.addEventListener('click', function() {
                selectVoice(voiceId);
            });

            voiceGrid.appendChild(voiceCard);
        }
    }

    // 选择音色
    function selectVoice(voiceId) {
        selectedVoice = voiceId;

        // 清空自定义音色输入框
        customVoiceInput.value = '';

        // 更新UI
        document.querySelectorAll('.voice-card').forEach(card => {
            card.classList.remove('selected');
        });

        const selectedCard = document.querySelector(`#voice_${voiceId}`).closest('.voice-card');
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }

    // 监听自定义音色输入
    customVoiceInput.addEventListener('input', function() {
        if (customVoiceInput.value.trim()) {
            // 清除预设音色的选择
            document.querySelectorAll('.voice-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
    })

    // 合成语音
    synthesizeBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();
        const apiKey = getApiKey();

        if (!apiKey) {
            showError('请先配置API密钥');
            return;
        }

        if (!text) {
            showError('请输入要合成的文本');
            return;
        }

        if (text.length > 500) {
            showError('文本长度不能超过500字');
            return;
        }

        // 显示加载状态
        synthesizeBtn.disabled = true;
        synthesizeBtn.querySelector('.btn-text').style.display = 'none';
        synthesizeBtn.querySelector('.loading-spinner').style.display = 'inline-block';

        // 隐藏之前的结果和错误
        resultSection.style.display = 'none';
        errorMessage.style.display = 'none';

        // 获取自定义音色
        const customVoice = customVoiceInput.value.trim();

        try {
            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voice: selectedVoice,
                    custom_voice: customVoice,
                    api_key: apiKey
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // 显示结果
                showResult(data);
            } else {
                showError(data.error || '语音合成失败');
            }
        } catch (error) {
            console.error('请求失败:', error);
            showError('网络错误，请检查网络连接');
        } finally {
            // 恢复按钮状态
            synthesizeBtn.disabled = false;
            synthesizeBtn.querySelector('.btn-text').style.display = 'inline-block';
            synthesizeBtn.querySelector('.loading-spinner').style.display = 'none';
        }
    });

    // 显示合成结果
    function showResult(data) {
        resultVoice.textContent = data.voice_name;
        requestId.textContent = data.request_id || '-';
        delayTime.textContent = data.first_package_delay || '-';

        // 设置音频播放器
        audioPlayer.src = `/api/audio/${data.filename}`;

        // 设置下载链接
        downloadBtn.href = `/api/download/${data.filename}`;
        downloadBtn.download = data.filename;

        // 显示结果区域
        resultSection.style.display = 'block';

        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 显示错误信息
    function showError(message) {
        errorMessage.textContent = '❌ ' + message;
        errorMessage.style.display = 'block';

        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter 快速合成
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            synthesizeBtn.click();
        }
    });

    // ========== 语音复刻功能 ==========
    const cloneAudioUrl = document.getElementById('cloneAudioUrl');
    const cloneVoiceName = document.getElementById('cloneVoiceName');
    const cloneBtn = document.getElementById('cloneBtn');
    const clonedVoicesList = document.getElementById('clonedVoicesList');

    // 加载已复刻的音色
    loadClonedVoices();

    // 复刻按钮点击事件
    cloneBtn.addEventListener('click', async function() {
        const audioUrl = cloneAudioUrl.value.trim();
        const voiceName = cloneVoiceName.value.trim();
        const apiKey = getApiKey();

        if (!apiKey) {
            showError('请先配置API密钥');
            return;
        }

        if (!audioUrl) {
            showError('请输入音频文件URL');
            return;
        }

        if (!voiceName) {
            showError('请输入音色名称');
            return;
        }

        // 显示加载状态
        cloneBtn.disabled = true;
        cloneBtn.querySelector('.btn-text').style.display = 'none';
        cloneBtn.querySelector('.loading-spinner').style.display = 'inline-block';

        try {
            const response = await fetch('/api/clone-voice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    voice_name: voiceName,
                    api_key: apiKey
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess(`音色复刻成功！音色ID: ${data.voice_id}`);

                // 清空输入
                cloneAudioUrl.value = '';
                cloneVoiceName.value = '';

                // 重新加载复刻音色列表
                loadClonedVoices();
            } else {
                showError(data.error || '音色复刻失败');
            }
        } catch (error) {
            console.error('复刻失败:', error);
            showError('网络错误，请检查网络连接');
        } finally {
            // 恢复按钮状态
            cloneBtn.disabled = false;
            cloneBtn.querySelector('.btn-text').style.display = 'inline-block';
            cloneBtn.querySelector('.loading-spinner').style.display = 'none';
        }
    });

    // 加载已复刻的音色列表
    async function loadClonedVoices() {
        try {
            const response = await fetch('/api/cloned-voices');
            const voices = await response.json();

            if (Array.isArray(voices)) {
                renderClonedVoices(voices);
            }
        } catch (error) {
            console.error('加载复刻音色失败:', error);
        }
    }

    // 渲染已复刻的音色
    function renderClonedVoices(voices) {
        if (voices.length === 0) {
            clonedVoicesList.innerHTML = `
                <div class="empty-cloned-voices">
                    暂无复刻的音色
                </div>
            `;
            return;
        }

        clonedVoicesList.innerHTML = voices.map(voice => `
            <div class="cloned-voice-item" data-voice-id="${voice.voice_id}">
                <div class="cloned-voice-info">
                    <div class="cloned-voice-name">${voice.name}</div>
                    <div class="cloned-voice-id">ID: ${voice.voice_id}</div>
                    ${voice.created_at ? `<div class="cloned-voice-date">${new Date(voice.created_at).toLocaleString()}</div>` : ''}
                </div>
                <div class="cloned-voice-actions">
                    <button class="btn-use-cloned" onclick="useClonedVoice('${voice.voice_id}', '${voice.name}')">使用</button>
                    <button class="btn-delete-cloned" onclick="deleteClonedVoice('${voice.voice_id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 使用复刻的音色
    window.useClonedVoice = function(voiceId, voiceName) {
        // 设置到自定义音色输入框
        customVoiceInput.value = voiceId;

        // 清除预设音色选择
        document.querySelectorAll('.voice-card').forEach(card => {
            card.classList.remove('selected');
        });

        showSuccess(`已选择复刻音色: ${voiceName}`);

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 删除复刻的音色
    window.deleteClonedVoice = async function(voiceId) {
        if (!confirm('确定要删除这个复刻的音色吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/delete-cloned-voice/${voiceId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccess('音色已删除');
                loadClonedVoices();
            } else {
                showError(data.error || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            showError('网络错误');
        }
    };

    // 显示成功信息
    function showSuccess(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = '✅ ' + message;
        successMessage.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            border-left: 4px solid #28a745;
        `;

        errorMessage.parentNode.insertBefore(successMessage, errorMessage.nextSibling);

        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }
});