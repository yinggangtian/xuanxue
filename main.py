#!/usr/bin/env python3
"""
玄学预测系统 - SiliconFlow版本
使用SiliconFlow免费AI服务生成玄学预测
"""

import asyncio
import time
from typing import List

try:
    import aiohttp
    import pandas as pd
    from config import AI_MODEL, SILICON_FLOW_API_KEY, XUANXUE_NAMES, LIFE_ASPECTS, MAX_RETRY_COUNT
except ImportError:
    print("缺少依赖包，请运行: pip install pandas openpyxl aiohttp")
    exit(1)


class AIClient:
    """SiliconFlow AI客户端 - 固定使用Qwen2.5-32B"""
    
    def __init__(self):
        self.session = None
        self.failure_count = 0
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def call_api(self, prompt: str) -> str:
        """调用SiliconFlow API，带失败重试机制"""
        if not SILICON_FLOW_API_KEY or SILICON_FLOW_API_KEY == "your_api_key_here":
            return "API密钥未配置，请在config.py中设置SILICON_FLOW_API_KEY"
            
        headers = {
            "Authorization": f"Bearer {SILICON_FLOW_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": AI_MODEL['model'],
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 50,
            "temperature": 0.7
        }
        
        try:
            async with self.session.post(
                AI_MODEL['url'], 
                headers=headers, 
                json=data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    # 重置失败计数
                    self.failure_count = 0
                    return result['choices'][0]['message']['content'].strip()
                else:
                    error_text = await response.text()
                    self.failure_count += 1
                    print(f"⚠️  API错误 ({self.failure_count}/{MAX_RETRY_COUNT}): {response.status}")
                    
                    # 检查是否超过最大重试次数
                    if self.failure_count >= MAX_RETRY_COUNT:
                        print(f"❌ API请求失败超过 {MAX_RETRY_COUNT} 次，程序退出")
                        exit(1)
                    
                    return f"API错误({response.status}): {error_text[:100]}"
                    
        except asyncio.TimeoutError:
            self.failure_count += 1
            print(f"⚠️  请求超时 ({self.failure_count}/{MAX_RETRY_COUNT})")
            
            if self.failure_count >= MAX_RETRY_COUNT:
                print(f"❌ 请求失败超过 {MAX_RETRY_COUNT} 次，程序退出")
                exit(1)
            
            return "请求超时"
        except Exception as e:
            self.failure_count += 1
            print(f"⚠️  请求失败 ({self.failure_count}/{MAX_RETRY_COUNT}): {str(e)}")
            
            if self.failure_count >= MAX_RETRY_COUNT:
                print(f"❌ 请求失败超过 {MAX_RETRY_COUNT} 次，程序退出")
                exit(1)
            
            return f"调用失败: {str(e)}"


def create_questions() -> List[str]:
    """创建所有问题列表"""
    questions = []
    
    for name in XUANXUE_NAMES:
        for aspect in LIFE_ASPECTS:
            question = f"请给出关于{name}在{aspect}方面的简短描述，不超过20字。"
            questions.append(question)
    
    return questions


async def generate_all_responses(questions: List[str]) -> List[str]:
    """批量生成所有回答"""
    responses = []
    
    async with AIClient() as client:
        print(f"开始使用 {AI_MODEL['name']} 生成回答...")
        print(f"共需处理 {len(questions)} 个问题")
        
        # 分批处理，避免并发过多
        batch_size = 3
        total_batches = (len(questions) + batch_size - 1) // batch_size
        
        for i in range(0, len(questions), batch_size):
            batch = questions[i:i+batch_size]
            batch_num = i // batch_size + 1
            
            print(f"处理第 {batch_num}/{total_batches} 批...")
            
            # 并发处理当前批次
            tasks = [client.call_api(q) for q in batch]
            batch_responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 处理异常情况
            for resp in batch_responses:
                if isinstance(resp, Exception):
                    responses.append(f"生成失败: {str(resp)}")
                else:
                    responses.append(resp)
            
            # 显示进度
            print(f"已完成 {min(i + batch_size, len(questions))}/{len(questions)} 个问题")
            
            # 避免API限流
            if i + batch_size < len(questions):
                await asyncio.sleep(2)
    
    return responses


def save_to_excel(responses: List[str]) -> str:
    """保存结果到Excel文件"""
    data = []
    
    response_index = 0
    for name in XUANXUE_NAMES:
        row = {'元素名称': name}
        for aspect in LIFE_ASPECTS:
            if response_index < len(responses):
                row[aspect] = responses[response_index]
            else:
                row[aspect] = "无回答"
            response_index += 1
        data.append(row)
    
    df = pd.DataFrame(data)
    timestamp = int(time.time())
    filename = f'xuanxue_siliconflow_{timestamp}.xlsx'
    df.to_excel(filename, index=False, engine='openpyxl')
    
    return filename




async def main():
    """主函数"""
    print("🔮 玄学预测系统 - Qwen2.5-32B专用版")
    print("=" * 40)
    
    # 检查API密钥配置
    if not SILICON_FLOW_API_KEY or SILICON_FLOW_API_KEY == "your_api_key_here":
        print("❌ SiliconFlow API密钥未配置！")
        print("请在 config.py 文件中设置 SILICON_FLOW_API_KEY")
        print(f"获取API密钥: {AI_MODEL['website']}")
        return
    
    print(f"✅ 使用模型: {AI_MODEL['name']}")
    print(f"📝 {AI_MODEL['description']}")
    print(f"⚠️  最大重试次数: {MAX_RETRY_COUNT} 次")
    
    try:
        # 创建问题
        questions = create_questions()
        print(f"\n📝 共生成 {len(questions)} 个问题")
        
        # 确认开始
        input("按 Enter 开始生成回答...")
        
        # 生成回答
        start_time = time.time()
        responses = await generate_all_responses(questions)
        end_time = time.time()
        
        print(f"\n✅ 生成完成！用时 {end_time - start_time:.1f} 秒")
        
        # 保存到Excel
        filename = save_to_excel(responses)
        print(f"📊 结果已保存到: {filename}")
        
        # 显示统计信息
        successful = sum(1 for r in responses if not r.startswith(("生成失败", "API错误", "调用失败", "请求超时")))
        print(f"📈 成功生成: {successful}/{len(responses)} 个回答")
        
    except KeyboardInterrupt:
        print("\n\n❌ 用户取消操作")
    except Exception as e:
        print(f"\n❌ 运行出错: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())