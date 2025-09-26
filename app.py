# coding=utf-8
from flask import Flask, request, render_template, send_file, jsonify
from flask_cors import CORS
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer, VoiceEnrollmentService
import os
import uuid
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# 配置
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
UPLOAD_FOLDER = 'generated_audio'
CLONED_VOICES_FILE = 'cloned_voices.json'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# API密钥将通过前端传递
# dashscope.api_key 将在每个请求中动态设置

# 可用的音色列表
AVAILABLE_VOICES = {
    "longxiaochun_v2": "龙小淳（温柔女声）",
    "longxiaobai": "龙小白（亲切男声）",
    "longjielidou": "龙杰力豆（活泼男童）",
    "longlaotie": "龙老铁（东北老铁）",
    "longshuo": "龙硕（新闻男声）",
    "longshu": "龙舒（温柔女声）",
    "longmiaomiao": "龙喵喵（软萌女童）",
    "longyuan": "龙媛（知性女声）",
    "longfei_v2": "龙飞（热血磁性男声）",
    "libai_v2": "李白（古代诗仙男声）",
    "longjin_v2": "龙津（优雅温润男声）"
}


@app.route('/')
def index():
    """渲染主页"""
    return render_template('index.html')


@app.route('/api/voices', methods=['GET'])
def get_voices():
    """获取可用音色列表"""
    return jsonify(AVAILABLE_VOICES)


@app.route('/api/synthesize', methods=['POST'])
def synthesize():
    """合成语音接口"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        voice = data.get('voice', 'longxiaochun_v2')
        custom_voice = data.get('custom_voice', '')
        api_key = data.get('api_key', '')

        if not api_key:
            return jsonify({'error': '请提供API密钥'}), 400

        if not text:
            return jsonify({'error': '请输入要合成的文本'}), 400

        if len(text) > 500:
            return jsonify({'error': '文本长度不能超过500字'}), 400

        # 设置API密钥
        dashscope.api_key = api_key

        # 如果提供了自定义音色，优先使用自定义音色
        actual_voice = custom_voice if custom_voice else voice
        voice_display_name = actual_voice if custom_voice else AVAILABLE_VOICES.get(voice, voice)

        # 实例化语音合成器
        model = "cosyvoice-v2"
        synthesizer = SpeechSynthesizer(model=model, voice=actual_voice)

        # 合成语音
        audio = synthesizer.call(text)

        # 获取请求信息
        request_id = synthesizer.get_last_request_id()
        first_package_delay = synthesizer.get_first_package_delay()

        # 生成唯一文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_voice_name = actual_voice.replace('/', '_').replace('\\', '_')[:50]
        filename = f"{safe_voice_name}_{timestamp}_{uuid.uuid4().hex[:8]}.mp3"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # 保存音频文件
        with open(filepath, 'wb') as f:
            f.write(audio)

        return jsonify({
            'success': True,
            'filename': filename,
            'request_id': request_id,
            'first_package_delay': first_package_delay,
            'voice_name': voice_display_name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio(filename):
    """获取音频文件"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': '文件不存在'}), 404

        return send_file(filepath, mimetype='audio/mpeg')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download_audio(filename):
    """下载音频文件"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': '文件不存在'}), 404

        return send_file(
            filepath,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def load_cloned_voices():
    """加载已复刻的音色列表"""
    if os.path.exists(CLONED_VOICES_FILE):
        with open(CLONED_VOICES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_cloned_voices(voices):
    """保存已复刻的音色列表"""
    with open(CLONED_VOICES_FILE, 'w', encoding='utf-8') as f:
        json.dump(voices, f, ensure_ascii=False, indent=2)


@app.route('/api/clone-voice', methods=['POST'])
def clone_voice():
    """复刻语音接口"""
    try:
        data = request.get_json()
        audio_url = data.get('audio_url', '')
        voice_name = data.get('voice_name', '')
        api_key = data.get('api_key', '')

        if not api_key:
            return jsonify({'error': '请提供API密钥'}), 400

        if not audio_url:
            return jsonify({'error': '请提供音频文件URL'}), 400

        if not voice_name:
            return jsonify({'error': '请提供音色名称'}), 400

        # 设置API密钥
        dashscope.api_key = api_key

        # 生成唯一前缀（最多10个字符）
        prefix = f"v{uuid.uuid4().hex[:9]}"
        target_model = "cosyvoice-v2"

        # 创建语音注册服务
        service = VoiceEnrollmentService()

        # 复刻声音
        voice_id = service.create_voice(
            target_model=target_model,
            prefix=prefix,
            url=audio_url
        )

        # 保存复刻的音色信息
        cloned_voices = load_cloned_voices()
        cloned_voices[voice_id] = {
            'name': voice_name,
            'voice_id': voice_id,
            'created_at': datetime.now().isoformat(),
            'prefix': prefix,
            'source_url': audio_url
        }
        save_cloned_voices(cloned_voices)

        return jsonify({
            'success': True,
            'voice_id': voice_id,
            'voice_name': voice_name,
            'request_id': service.get_last_request_id()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloned-voices', methods=['GET'])
def get_cloned_voices():
    """获取已复刻的音色列表"""
    try:
        cloned_voices = load_cloned_voices()
        # 转换为前端友好的格式
        voices_list = []
        for voice_id, info in cloned_voices.items():
            voices_list.append({
                'voice_id': voice_id,
                'name': info['name'],
                'created_at': info.get('created_at', '')
            })
        return jsonify(voices_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete-cloned-voice/<voice_id>', methods=['DELETE'])
def delete_cloned_voice(voice_id):
    """删除已复刻的音色"""
    try:
        cloned_voices = load_cloned_voices()

        if voice_id in cloned_voices:
            del cloned_voices[voice_id]
            save_cloned_voices(cloned_voices)
            return jsonify({'success': True, 'message': '音色已删除'})
        else:
            return jsonify({'error': '音色不存在'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5500)