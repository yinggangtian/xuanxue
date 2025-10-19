import React, { useState, useEffect } from 'react';
import styles from './liuren.module.scss';
import { fastApiClient } from '../../client/fastapi';
import { useChatStore } from '../../store';

interface LiurenDivinationProps {
  onResult: (result: string) => void;
  onInterpret: (query: string) => void;
}

interface DivinationResult {
  numbers: number[];      // 用户输入的数字
  sixPalaces: Palace[];  // 六宫信息
}

interface Palace {
  position: number;      // 宫位(1-6)
  name: string;         // 宫名(大安,流连,速喜,赤口,小吉,空亡)
  branch: string;       // 地支
  beast: string;        // 六兽
  relation: string;     // 六亲
  element: string;      // 五行属性
}

// 地支对应表
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 时辰对照表
const HOUR_BRANCHES = [
  { start: 23, end: 1, branch: '子' },
  { start: 1, end: 3, branch: '丑' },
  { start: 3, end: 5, branch: '寅' },
  { start: 5, end: 7, branch: '卯' },
  { start: 7, end: 9, branch: '辰' },
  { start: 9, end: 11, branch: '巳' },
  { start: 11, end: 13, branch: '午' },
  { start: 13, end: 15, branch: '未' },
  { start: 15, end: 17, branch: '申' },
  { start: 17, end: 19, branch: '酉' },
  { start: 19, end: 21, branch: '戌' },
  { start: 21, end: 23, branch: '亥' },
] as const;

// 获取当前时辰
const getCurrentHourBranch = (): string => {
  const now = new Date();
  const hour = now.getHours();
  // 处理跨日的情况
  for (const { start, end, branch } of HOUR_BRANCHES) {
    if (start > end) { // 跨日时段 (23-1点)
      if (hour >= start || hour < end) {
        return branch;
      }
    } else if (hour >= start && hour < end) {
      return branch;
    }
  }
  return '子'; // 默认返回子时
};

// 六宫名称类型
type PalaceName = '大安' | '流连' | '速喜' | '赤口' | '小吉' | '空亡';

// 六兽对应
const BEASTS = {
  '子': '玄武', '亥': '玄武',
  '寅': '青龙', '卯': '青龙',
  '巳': '朱雀', '午': '朱雀',
  '未': '螣蛇', '戌': '螣蛇',
  '辰': '勾陈', '丑': '勾陈',
  '申': '白虎', '酉': '白虎'
} as const;

// 五行生克关系
const FIVE_ELEMENTS = {
  '水': { generates: '木', overcomes: '火' },
  '木': { generates: '火', overcomes: '土' },
  '火': { generates: '土', overcomes: '金' },
  '土': { generates: '金', overcomes: '水' },
  '金': { generates: '水', overcomes: '木' }
} as const;

// 六宫五行属性//需要删掉
const PALACE_ELEMENTS = {
  '大安': '木',
  '流连': '土',
  '速喜': '火',
  '赤口': '金',
  '小吉': '土',
  '空亡': '水'
} as const;

// 六宫对应地支//需要删掉
const PALACE_BRANCHES = {
  '大安': '辰',
  '流连': '午',
  '速喜': '申',
  '赤口': '戌',
  '小吉': '子',
  '空亡': '寅'
} as const;

// 天干对应起始六兽//天干不在小六壬中做应用，需要删减
const HEAVENLY_STEM_BEASTS = {
  '甲': '青龙', '己': '青龙',
  '乙': '朱雀', '庚': '朱雀',
  '丙': '勾陈', '辛': '勾陈',
  '丁': '螣蛇', '壬': '螣蛇',
  '戊': '白虎', '癸': '白虎'
} as const;

// 六兽顺序
const BEAST_ORDER = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as const;

// 天干对应表//需要删减
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// 添加地支五行对应关系
const BRANCH_ELEMENTS = {
  '子': '水', '亥': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '戌': '土',
  '丑': '土', '未': '土'
} as const;

// 定义地支和六兽的固定对应关系
const BRANCH_TO_BEAST = {
  '亥': '玄武', '子': '玄武',  // 亥子水
  '寅': '青龙', '卯': '青龙',  // 寅卯木
  '巳': '朱雀', '午': '朱雀',  // 巳午火
  '未': '螣蛇', '戌': '螣蛇',  // 未戌土
  '辰': '勾陈', '丑': '勾陈',  // 辰丑土
  '申': '白虎', '酉': '白虎'   // 申酉金
} as const;

// 定义宫位对应的地支//需要删掉
const PALACE_TO_BRANCH = {
  '大安': '辰',
  '流连': '午',
  '速喜': '申',
  '赤口': '戌',
  '小吉': '子',
  '空亡': '寅'
} as const;

// 定义五行生克关系
const FIVE_ELEMENTS_RELATIONS = {
  '金': { generates: '水', overcomes: '木', generatedBy: '土', overcomedBy: '火' },
  '木': { generates: '火', overcomes: '土', generatedBy: '水', overcomedBy: '金' },
  '水': { generates: '木', overcomes: '火', generatedBy: '金', overcomedBy: '土' },
  '火': { generates: '土', overcomes: '金', generatedBy: '木', overcomedBy: '水' },
  '土': { generates: '金', overcomes: '水', generatedBy: '火', overcomedBy: '木' }
} as const;

// 修改六亲计算逻辑
const calculateRelation = (currentElement: string, fallingElement: string): string => {
  const relations = FIVE_ELEMENTS_RELATIONS[fallingElement as keyof typeof FIVE_ELEMENTS_RELATIONS];
  if (currentElement === fallingElement) {
    return '兄弟';//需要分成本人和兄弟两类
  }
  // 生我者为父母
  if (relations.generatedBy === currentElement) {
    return '父母';
  }
  // 我生者为子孙
  if (relations.generates === currentElement) {
    return '子孙';
  }
  // 克我者为官鬼
  if (relations.overcomedBy === currentElement) {
    return '官鬼';
  }
  // 我克者为妻财
  if (relations.overcomes === currentElement) {
    return '妻财';
  }
  return '';
};

// 定义天干起六兽//需要删掉
const STEM_TO_STARTING_BEAST = {
  '甲': '青龙', '己': '青龙',
  '乙': '朱雀', '庚': '朱雀',
  '丙': '勾陈', '辛': '勾陈',
  '丁': '螣蛇', '壬': '螣蛇',
  '戊': '白虎', '癸': '白虎'
} as const;

// 修改六兽计算函数
const calculateBeast = (branch: string): string => {
  return BRANCH_TO_BEAST[branch as keyof typeof BRANCH_TO_BEAST] || '';
};

// 计算六宫排盘
const calculatePalaces = (position: number, hourBranch: string): Palace[] => {
  console.group('小六壬排盘计算');  // 使用 group 来组织日志
  console.log('输入参数 =>', { position, hourBranch });
  const palaces: Palace[] = [];
  const PALACE_ORDER: PalaceName[] = ['大安', '流连', '速喜', '赤口', '小吉', '空亡'];
  // 判断时辰阴阳
  const isYinHour = ['丑', '卯', '巳', '未', '酉', '亥'].includes(hourBranch);
  console.log('时辰阴阳 =>', isYinHour ? '阴时' : '阳时');
  // 初始化地支数组并排列
  const branches: string[] = new Array(6);
  branches[position - 1] = hourBranch;
  // 从落宫位置开始，顺时针填充其他位置
  let filledCount = 1;
  let currentPos = position - 1;
  let currentIndex = EARTHLY_BRANCHES.indexOf(hourBranch);
  console.log('开始地支排列 =>', {
    '落宫位置': position,
    '初始地支': hourBranch,
    '地支索引': currentIndex
  });
  while (filledCount < 6) {
    currentPos = (currentPos + 1) % 6;
    if (branches[currentPos]) continue;
    do {
      currentIndex = (currentIndex + 2) % 12;
    } while (
      (isYinHour && !['丑', '卯', '巳', '未', '酉', '亥'].includes(EARTHLY_BRANCHES[currentIndex])) ||
      (!isYinHour && !['子', '寅', '辰', '午', '申', '戌'].includes(EARTHLY_BRANCHES[currentIndex])) ||
      branches.includes(EARTHLY_BRANCHES[currentIndex])
    );
    branches[currentPos] = EARTHLY_BRANCHES[currentIndex];
    filledCount++;
  }
  console.log('地支排列结果 =>', branches);
  // 获取落宫名称和五行
  const fallingPalaceName = PALACE_ORDER[position - 1];
  const fallingElement = PALACE_ELEMENTS[fallingPalaceName as keyof typeof PALACE_ELEMENTS];
  console.log('落宫信息 =>', {
    '宫名': fallingPalaceName,
    '五行': fallingElement
  });
  // 获取当前日干和起始六兽//不用计算万年历的日子，小六壬里面的日子只涉及时辰，不涉及日子和月份、年份
  const currentDate = new Date();
  const stem = getCurrentHeavenlyStem(currentDate);
  const startBeast = HEAVENLY_STEM_BEASTS[stem as keyof typeof HEAVENLY_STEM_BEASTS];
  console.log('六兽起始信息 =>', {
    '日干': stem,
    '起始六兽': startBeast
  });
  // 根据日干建立十二地支对应的六兽表//日干
  const branchToBeasts: Record<string, string> = {};
  const startBeastIndex = BEAST_ORDER.indexOf(startBeast);
  // 从子开始，每个地支对应一个六兽
  EARTHLY_BRANCHES.forEach((branch, index) => {
    const beastIndex = (startBeastIndex + Math.floor(index / 2)) % 6;
    branchToBeasts[branch] = BEAST_ORDER[beastIndex];
  });
  // 计算每个宫位的信息
  for (let i = 0; i < 6; i++) {
    const palacePosition = i + 1;
    const palaceName = PALACE_ORDER[i];
    const branch = branches[i];
    // 获取当前宫位的五行//不用宫为五行
    const currentPalaceElement = PALACE_ELEMENTS[palaceName as keyof typeof PALACE_ELEMENTS];
    // 计算六亲关系
    const relation = calculateRelation(currentPalaceElement, fallingElement);
    // 计算六兽
    const beast = calculateBeast(branch);
    palaces.push({
      position: palacePosition,
      name: palaceName,
      branch,
      beast,
      relation,
      element: currentPalaceElement
    });
  }
  console.log('最终排盘结果 =>', palaces);
  console.groupEnd();  // 结束日志组
  return palaces;
};

// 获取天干的辅助函数//可以删掉，不需要计算天干（小六壬的 算法涉及不到天干，用小六壬算生辰八字，也不太需要天干）
const getCurrentHeavenlyStem = (date: Date): string => {
  // 计算距离1984年2月2日（甲子年正月初一）的天数
  const baseDate = new Date(1984, 1, 2);  // JavaScript中月份从0开始
  const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
  // 计算天干索引（每10天一个循环）
  const stemIndex = daysDiff % 10;
  // 如果是负数，需要转换为正数
  const positiveIndex = stemIndex < 0 ? (stemIndex + 10) : stemIndex;
  return HEAVENLY_STEMS[positiveIndex];
};

// 计算最终落宫位置
const calculateFinalPosition = (nums: number[]): number => {
  // 两数相加
  const sum = nums[0] + nums[1];
  // 减1
  let y = sum - 1;
  // 对于负数，从大安开始逆时针数
  if (y < 0) {
    y = Math.abs(y);  // 取绝对值
    // 逆时针数时，每6步回到起点，看最后剩几步
    let steps = y % 6;
    if (steps === 0) return 1;  // 如果刚好是6的倍数，落在大安
    // 从大安开始逆时针数的对应关系：//y=-1在小吉，因为0不属于正数和负数。0在空亡，所以y<0时可以按照：y%6=x，x+6作为落宫，和正数一样的算法；
    // 数1步 -> 大安(1)
    // 数2步 -> 空亡(6)
    // 数3步 -> 小吉(5)
    // 数4步 -> 赤口(4)
    // 数5步 -> 速喜(3)
    // 数6步 -> 流连(2)
    switch (steps) {
      case 1: return 1;  // 大安
      case 2: return 6;  // 空亡
      case 3: return 5;  // 小吉
      case 4: return 4;  // 赤口
      case 5: return 3;  // 速喜
      default: return 2; // 流连
    }
  }
  // 正数则正常计算
  let position = y % 6;
  if (position === 0) position = 6;
  return position;
};

// 在文件开头添加类型定义
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  system_prompt: string;
}

export function LiurenDivination({ onResult, onInterpret }: LiurenDivinationProps) {
  const [question, setQuestion] = useState(''); // 预测事项
  const [showNumbers, setShowNumbers] = useState(false); // 控制是否显示数字输入
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [currentHour, setCurrentHour] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [finalPalace, setFinalPalace] = useState<Palace | null>(null);  // 添加状态保存最终落宫
  // 在组件加载时获取当前时辰
  useEffect(() => {
    const hourBranch = getCurrentHourBranch();
    setCurrentHour(hourBranch);
  }, []);

  // 处理预测事项提交
  const handleQuestionSubmit = () => {
    if (!question.trim()) {
      alert('请输入要预测的事项');
      return;
    }
    setShowNumbers(true);
  };

  // 处理数字输入和排盘
  const handleSubmit = () => {
    if (!num1 || !num2) {
      alert('请输入两个数字');
      return;
    }

    const inputNumbers = [parseInt(num1), parseInt(num2)];
    const position = calculateFinalPosition(inputNumbers);
    const sixPalaces = calculatePalaces(position, currentHour);
    const palace = sixPalaces.find(p => p.position === position);
    setFinalPalace(palace || null);
    // 生成结果文本
    const resultText = `
占卜时间：${new Date().toLocaleString()}
当前时辰：${currentHour}时（${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}）
输入数字：${inputNumbers.join(',')}

最终落宫：
$${palace?.name}【第$${position}宫】
地支：${palace?.branch}
六兽：${palace?.beast}
六亲：${palace?.relation}
五行：${palace?.element}//可以去掉
    `.trim();

    // 构建系统提示词
    const systemPrompt = `你是一位精通小六壬占卜的大师。请基于以下信息进行解读：
1. 用户想要预测的事项：${question}
2. 排盘结果信息如下：
${resultText}

请从以下几个方面进行解读：
1. 整体吉凶
2. 具体解释（从六神、六亲、地支等方面分析）
3. 建议（根据分析给出具体可行的建议）`;

    // 构建用户问题
    const userQuestion = 小六壬占卜问题：${question};

    // 构建完整的请求体
    const chatRequest = {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userQuestion
        }
      ],
      system_prompt: systemPrompt
    };

    // 调用父组件的解读方法
    onInterpret(JSON.stringify(chatRequest));
  };

  return (
    <div className={styles.liurenContainer}>
      {!showNumbers ? (
        // 预测事项输入界面
        <div className={styles.questionSection}>
          <h3>请输入要预测的事项</h3>
          <div className={styles.notice}>
            <p>占卜借先贤计算与天地相连，基于当下时空推理，助人们趋吉避凶、追求美好生活、促进社会和谐。</p >
            <p className={styles.important}>注意事项：</p >
            <ul>
              <li>需心诚，才能建立与宇宙连接</li>
              <li>违法犯罪、投机倒把、股票相关不算</li>
              <li>不算国家大事，目前模型仅支持个人占卜</li>
            </ul>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请放松心情，默念要预测的事项，可以是事业、感情、财运、父母健康或子女情况等..."
            className={styles.questionInput}
            rows={4}
          />
          <button
            onClick={handleQuestionSubmit}
            className={styles.submitButton}
          >
            下一步
          </button>
        </div>
      ) : (
        // 数字输入界面
        <div className={styles.inputSection}>
          <p className={styles.questionDisplay}>预测事项: {question}</p >
          <div>
            <input
              type="number"
              value={num1}
              onChange={(e) => setNum1(e.target.value)}
              placeholder="请输入第一个数字"
            />
            <input
              type="number"
              value={num2}
              onChange={(e) => setNum2(e.target.value)}
              placeholder="请输入第二个数字"
            />
          </div>
          <button onClick={handleSubmit}>开始推理</button>
        </div>
      )}
      {result && (
        <div className={styles.resultSection}>
          <pre className={styles.resultText}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
