# AI模型配置 - 单一模型版本
# 请在下面配置你的SiliconFlow API密钥
SILICON_FLOW_API_KEY = "sk-icxmcjdtkrvlyuvlirwssoterykdqogovjbvmblrqryregqz"  # 请替换为你的实际API密钥

# 失败重试配置
MAX_RETRY_COUNT = 10  # 最大重试次数，超过此次数程序退出

# SiliconFlow配置 - 固定使用Qwen2.5-32B
AI_MODEL = {
    'name': 'Qwen2.5-32B',
    'url': 'https://api.siliconflow.com/v1/chat/completions',
    'model': 'Qwen/Qwen2.5-32B-Instruct',
    'description': '32B参数，文学性强，玄学表达优美',
    'website': 'https://cloud.siliconflow.cn/'
}

# 玄学元素定义
XUANXUE_NAMES = [
    "休门", "生门", "伤门", "杜门", "景门", "死门", "惊门", "开门",
    "值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天", 
    "天蓬", "天任", "天冲", "天辅", "天英", "天芮", "天柱", "天心", "天禽",
    "一宫", "二宫", "三宫", "四宫", "五宫", "六宫", "七宫", "八宫", "九宫",
    "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"
]

# 生活方面
LIFE_ASPECTS = ["爱情", "事业", "财富", "健康", "家庭", "学业", "人际", "运势"]