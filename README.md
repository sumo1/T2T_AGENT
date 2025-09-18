# 🎙️ 阿里云语音合成工具

基于阿里云 CosyVoice V2 模型的网页版语音合成与复刻工具，提供友好的用户界面，支持多种音色选择、自定义音色输入、语音复刻等功能。

## ✨ 功能特性

### 核心功能
- 🎯 **语音合成** - 将文本转换为自然流畅的语音
- 🎭 **语音复刻** - 通过音频URL复刻声音，生成专属音色
- 🔊 **在线试听** - 直接在浏览器中播放生成的语音
- 💾 **音频下载** - 支持将生成的音频保存到本地
- 🔑 **安全管理** - API密钥本地存储，保护隐私安全

### 特色亮点
- 📝 实时字符计数（最多500字）
- 🎨 8种预设音色 + 自定义音色输入
- 📊 显示请求ID和首包延迟等技术指标
- ⌨️ 快捷键支持（Ctrl/Cmd + Enter快速合成）
- 📱 响应式设计，支持移动端访问

## 🚀 快速开始

### 前置要求

1. Python 3.8+
2. 阿里云 DashScope API 密钥（[获取地址](https://dashscope.console.aliyun.com/)）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd alivoice-generator
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **启动服务**
```bash
python app.py
# 或使用启动脚本
bash /Users/sumo/tmpsh/start_alivoice.sh
```

4. **访问应用**

打开浏览器访问: http://localhost:5500

## 📖 使用指南

### 1. 配置API密钥

首次使用需要配置阿里云 DashScope API密钥：

1. 在页面顶部的黄色区域输入您的API密钥
2. 点击"保存密钥"按钮
3. 密钥将安全地保存在浏览器本地存储中

### 2. 语音合成

1. 在文本框输入要合成的内容（最多500字）
2. 选择喜欢的音色：
   - 从预设的8种音色中选择
   - 或在"自定义音色"框中输入音色ID
3. 点击"生成语音"按钮
4. 等待生成完成后可以试听和下载

### 3. 语音复刻

1. 准备一个可公开访问的音频文件URL（WAV/MP3格式）
2. 在"语音复刻"区域：
   - 输入音频文件URL
   - 给复刻的音色起个名字
3. 点击"开始复刻"按钮
4. 复刻成功后，可在列表中查看和使用

**示例音频URL：**
```
https://isv-data.oss-cn-hangzhou.aliyuncs.com/ics/MaaS/ASR/test_audio/asr_example_zh.wav
```

### 4. 使用复刻音色

1. 在"已复刻的音色"列表中点击"使用"按钮
2. 音色ID会自动填入"自定义音色"输入框
3. 输入文本后即可使用该音色生成语音

## 🎨 可用音色

### 预设音色
- **龙小淳** - 温柔女声
- **龙小白** - 亲切男声
- **龙杰力豆** - 活泼男童
- **龙老铁** - 东北老铁
- **龙硕** - 新闻男声
- **龙舒** - 温柔女声
- **龙喵喵** - 软萌女童
- **龙媛** - 知性女声

### 自定义音色
支持输入任何有效的音色ID，如：`zhixiaobai`

## 📁 项目结构

```
alivoice-generator/
├── app.py                 # Flask后端应用
├── requirements.txt       # Python依赖
├── README.md             # 项目文档
├── cloned_voices.json    # 复刻音色数据（自动生成）
├── generated_audio/      # 生成的音频文件
├── templates/
│   └── index.html       # 前端页面
└── static/
    ├── css/
    │   └── style.css    # 样式文件
    └── js/
        └── main.js      # JavaScript逻辑
```

## 🔧 API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 主页 |
| `/api/voices` | GET | 获取预设音色列表 |
| `/api/synthesize` | POST | 合成语音 |
| `/api/clone-voice` | POST | 复刻语音 |
| `/api/cloned-voices` | GET | 获取已复刻音色列表 |
| `/api/delete-cloned-voice/<voice_id>` | DELETE | 删除复刻音色 |
| `/api/audio/<filename>` | GET | 获取音频文件 |
| `/api/download/<filename>` | GET | 下载音频文件 |

### 请求示例

**语音合成：**
```json
POST /api/synthesize
{
    "text": "你好，世界",
    "voice": "longxiaochun_v2",
    "custom_voice": "",
    "api_key": "your-api-key"
}
```

**语音复刻：**
```json
POST /api/clone-voice
{
    "audio_url": "https://example.com/audio.wav",
    "voice_name": "我的音色",
    "api_key": "your-api-key"
}
```

## ⚙️ 配置说明

### 环境变量
- `DASHSCOPE_API_KEY` - 阿里云API密钥（可选，推荐使用页面配置）

### 限制参数
- 最大文本长度：500字符
- 最大上传文件：16MB
- 音色前缀长度：最多10个字符
- 每个账号最多复刻音色：1000个

## 🔒 安全说明

1. **API密钥安全**
   - API密钥仅存储在浏览器本地localStorage中
   - 不会保存在服务器端
   - 每次请求时动态传递

2. **生产环境部署**
   - 请勿使用Flask内置服务器
   - 推荐使用WSGI服务器（如Gunicorn、uWSGI）
   - 配置HTTPS加密传输

## 🐛 常见问题

### Q: 提示"Model.AccessDenied"错误？
A: 请确认API密钥有权限访问cosyvoice-v2模型。

### Q: 语音复刻失败，提示"download audio failed:404"？
A: 音频URL必须是可公开访问的，请检查URL是否有效。

### Q: 提示"prefix should not be longer than 10 characters"？
A: 这是内部错误，已在最新版本修复。

### Q: 端口5500被占用？
A: 可能是macOS的AirPlay接收器占用，可以修改app.py中的端口号。

## 📝 更新日志

### v1.0.0 (2024-09-18)
- ✅ 基础语音合成功能
- ✅ 多种预设音色选择
- ✅ 自定义音色输入
- ✅ 语音复刻功能
- ✅ 已复刻音色管理
- ✅ API密钥安全管理
- ✅ 响应式界面设计

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 👥 联系方式

如有问题或建议，请提交Issue。

---

*本工具基于阿里云 DashScope 服务构建，使用前请确保已开通相关服务。*