const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const config = require('./config');
const scraper = require('./scraper');
const translator = require('./translator');

const OUTPUT_FILE = config.outputPath;

// 기존 뉴스 데이터를 읽어옵니다.
function loadExistingNews() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = fs.readFileSync(OUTPUT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('기존 뉴스 데이터 로드 실패 (새로 시작):', error.message);
  }
  return [];
}

// 수집된 뉴스 데이터를 저장합니다.
function saveNews(newsList) {
  try {
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 날짜 역순 (최신순) 정렬
    newsList.sort(function(a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newsList, null, 2), 'utf8');
    console.log(`성공적으로 저장 완료! 경로: ${OUTPUT_FILE} (총 ${newsList.length}개 뉴스)`);
  } catch (error) {
    console.error('뉴스 데이터 저장 실패:', error.message);
  }
}

// 메인 크롤링 및 번역 태스크 실행
async function runScraperTask() {
  console.log(`[${new Date().toLocaleString()}] 스크랩 및 번역 작업 시작...`);
  
  const existingNews = loadExistingNews();
  const rawNewsList = await scraper.scrapeAll();
  const updatedNewsList = [...existingNews];
  
  let newCount = 0;
  
  for (let i = 0; i < rawNewsList.length; i++) {
    const rawNews = rawNewsList[i];
    
    // URL 기준으로 기존 뉴스에 존재하는지 확인
    const exists = existingNews.some(function(item) {
      return item.url === rawNews.url;
    });
    
    if (!exists) {
      console.log(`[신규 발견] ${rawNews.source}: ${rawNews.title}`);
      
      // 번역 수행 (영어 -> 한국어)
      console.log(' - 제목 번역 중...');
      const titleKo = await translator.translateText(rawNews.title, 'ko');
      await translator.sleep(300); // 429 방지 지연
      
      console.log(' - 요약 번역 중...');
      const summaryKo = await translator.translateText(rawNews.summary, 'ko');
      await translator.sleep(300); // 429 방지 지연
      
      // 고유 ID 생성 (source + timestamp)
      const id = rawNews.source.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      
      updatedNewsList.push({
        id: id,
        title: rawNews.title,
        titleKo: titleKo,
        summary: rawNews.summary,
        summaryKo: summaryKo,
        url: rawNews.url,
        date: rawNews.date,
        source: rawNews.source,
        scrapedAt: new Date().toISOString()
      });
      
      newCount++;
    }
  }
  
  if (newCount > 0) {
    console.log(`총 ${newCount}개의 신규 뉴스가 추가 및 번역되었습니다.`);
    saveNews(updatedNewsList);
  } else {
    console.log('추가된 신규 뉴스가 없습니다.');
  }
  
  console.log(`[${new Date().toLocaleString()}] 스크랩 작업 종료.`);
}

// 실행 진입점
function init() {
  const args = process.argv.slice(2);
  const isRunOnce = args.includes('--run');
  
  if (isRunOnce) {
    console.log('수동 1회 실행 모드로 스크래퍼를 동작합니다.');
    runScraperTask().catch(function(err) {
      console.error('크리티컬 스크랩 에러:', err);
    });
  } else {
    console.log('매일 오전 9:00 자동 스크랩 스케줄러를 등록합니다.');
    
    // 매일 아침 9:00:00 에 실행하도록 cron식 작성 (초 분 시 일 월 요일)
    // node-schedule 에서는 '0 0 9 * * *' 구조
    const job = schedule.scheduleJob('0 0 9 * * *', function() {
      runScraperTask().catch(function(err) {
        console.error('스케줄러 작업 실행 중 에러 발생:', err);
      });
    });
    
    console.log('스케줄러 작동 중... 종료하려면 Ctrl+C를 누르세요.');
  }
}

init();
