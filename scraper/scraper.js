const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

// 날짜 문자열을 YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    const year = d.getFullYear();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    
    return year + '-' + month + '-' + day;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

// OpenAI RSS 스크랩 (최대 10개 제한)
async function scrapeOpenAI() {
  const items = [];
  try {
    const feed = await parser.parseURL('https://openai.com/news/rss.xml');
    // 최근 10개 기사만 가공
    const recentItems = feed.items.slice(0, 10);
    recentItems.forEach(function(item) {
      items.push({
        title: item.title || 'No Title',
        summary: item.contentSnippet || item.content || '',
        url: item.link || '',
        date: formatDate(item.pubDate),
        source: 'OpenAI'
      });
    });
  } catch (error) {
    console.error('OpenAI RSS 스크랩 실패:', error.message);
  }
  return items;
}

// Google AI RSS 스크랩 (최대 10개 제한)
async function scrapeGoogle() {
  const items = [];
  try {
    const feed = await parser.parseURL('https://blog.google/technology/ai/rss/');
    // 최근 10개 기사만 가공
    const recentItems = feed.items.slice(0, 10);
    recentItems.forEach(function(item) {
      items.push({
        title: item.title || 'No Title',
        summary: item.contentSnippet || item.content || '',
        url: item.link || '',
        date: formatDate(item.pubDate),
        source: 'Google AI'
      });
    });
  } catch (error) {
    console.error('Google AI RSS 스크랩 실패:', error.message);
  }
  return items;
}

// Anthropic HTML 스크랩 (최대 10개 제한)
async function scrapeAnthropic() {
  const items = [];
  try {
    const response = await axios.get('https://www.anthropic.com/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    
    $('a').each(function(i, el) {
      // 최대 10개까지만 수집
      if (items.length >= 10) return false; // cheerio의 each 루프 break 역할

      const href = $(el).attr('href');
      if (href && href.startsWith('/news/') && href !== '/news') {
        const text = $(el).text().trim();
        const dateMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i);
        
        if (dateMatch) {
          const dateStr = dateMatch[0];
          let rawTitle = text.replace(dateStr, '').trim();
          
          const categories = ['Announcements', 'Product', 'Research', 'Company', 'News'];
          for (let j = 0; j < categories.length; j++) {
            if (rawTitle.startsWith(categories[j])) {
              rawTitle = rawTitle.substring(categories[j].length).trim();
              break;
            }
          }
          
          const url = 'https://www.anthropic.com' + href;
          const isDuplicate = items.some(function(item) {
            return item.url === url;
          });
          
          if (!isDuplicate && rawTitle) {
            items.push({
              title: rawTitle,
              summary: 'Anthropic Official Update: ' + rawTitle,
              url: url,
              date: formatDate(dateStr),
              source: 'Anthropic'
            });
          }
        }
      }
    });
  } catch (error) {
    console.error('Anthropic 스크랩 실패:', error.message);
  }
  return items.slice(0, 10);
}

// Cursor HTML 스크랩 (최대 10개 제한)
async function scrapeCursor() {
  const items = [];
  try {
    const response = await axios.get('https://www.cursor.com/changelog', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const linkMap = {};
    
    $('a').each(function(i, el) {
      const href = $(el).attr('href');
      if (href && href.startsWith('/changelog/') && href !== '/changelog' && !href.startsWith('/changelog/page/')) {
        const text = $(el).text().trim();
        if (!linkMap[href]) {
          linkMap[href] = [];
        }
        if (text && !linkMap[href].includes(text)) {
          linkMap[href].push(text);
        }
      }
    });
    
    const hrefs = Object.keys(linkMap);
    for (let i = 0; i < hrefs.length; i++) {
      if (items.length >= 10) break;
      
      const href = hrefs[i];
      const texts = linkMap[href];
      let title = 'Cursor Update';
      let dateStr = new Date().toISOString();
      
      texts.forEach(function(txt) {
        const dateMatch = txt.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i);
        if (dateMatch) {
          dateStr = dateMatch[0];
        } else if (txt && txt !== 'Changelog') {
          title = txt;
        }
      });
      
      const url = 'https://www.cursor.com' + href;
      items.push({
        title: title,
        summary: 'Cursor Editor Changelog and feature updates: ' + title,
        url: url,
        date: formatDate(dateStr),
        source: 'Cursor'
      });
    }
  } catch (error) {
    console.error('Cursor 스크랩 실패:', error.message);
  }
  return items.slice(0, 10);
}

// 모든 소스 병합 스크랩
async function scrapeAll() {
  console.log('뉴스 스크래핑 시작...');
  const openaiNews = await scrapeOpenAI();
  const googleNews = await scrapeGoogle();
  const anthropicNews = await scrapeAnthropic();
  const cursorNews = await scrapeCursor();
  
  const allNews = openaiNews.concat(googleNews, anthropicNews, cursorNews);
  console.log(`스크래핑 완료! 총 ${allNews.length}개의 뉴스를 수집했습니다.`);
  return allNews;
}

module.exports = {
  scrapeAll
};
