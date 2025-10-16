# 玄学预测系统

一个使用SiliconFlow的Qwen2.5-32B模型生成玄学预测内容的Python程序。

## 功能特点

- 🔮 **玄学预测生成**: 基于传统玄学元素生成预测内容
- � **专用模型**: 固定使用Qwen2.5-32B，文学性强，玄学表达优美
- 📊 **Excel导出**: 自动生成结构化的Excel报告
- ⚡ **异步处理**: 高效的批量内容生成
- 🛡️ **失败保护**: 超过10次请求失败自动退出
- 🎯 **简单易用**: 无需选择模型，一键运行

## 快速开始

### 1. 环境要求
- Python 3.8+
- 依赖包：pandas, openpyxl, aiohttp

### 2. 安装依赖
```bash
# 使用uv（推荐）
uv add pandas openpyxl aiohttp

# 或使用pip
pip install pandas openpyxl aiohttp
```

### 3. 配置API密钥
1. 访问 [SiliconFlow](https://cloud.siliconflow.cn/) 注册账号
2. 在控制台获取API密钥
3. 在 `config.py` 文件中设置：
```python
SILICON_FLOW_API_KEY = "sk-xxxxxxxxxxxxxxxxxx"  # 替换为你的真实API密钥
```

### 4. 运行程序
```bash
python main.py
```

## 输出结果

程序会生成一个Excel文件，包含：
- **元素名称**: 40个玄学元素（奇门遁甲相关）
- **8个生活方面**: 爱情、事业、财富、健康、家庭、学业、人际、运势
- **AI生成的预测内容**: 每个元素在各个方面的简短描述

## 项目结构

```
xuanxue/
├── main.py              # 主程序
├── config.py            # 配置文件
├── pyproject.toml       # 项目配置
└── README.md            # 说明文档
```

## 自定义配置

可以在 `config.py` 中修改：
- API密钥设置
- 最大重试次数 (默认10次)
- 玄学元素列表
- 生活方面列表

## 注意事项

1. **API密钥安全**: 请勿将包含真实API密钥的配置文件分享给他人
2. **免费额度**: SiliconFlow提供免费服务，但可能有使用限制
3. **网络环境**: 需要能够访问SiliconFlow API服务
4. **生成时间**: 完整生成大约需要5-10分钟
5. **失败保护**: 连续失败超过10次会自动退出程序

## 许可证

MIT License