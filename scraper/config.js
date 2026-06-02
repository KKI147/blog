const path = require('path');

module.exports = {
  // 스크랩된 JSON 데이터를 저장할 경로
  outputPath: path.join(__dirname, '../data/news.json'),
  
  // 뉴스 스크랩 대상 소스 리스트
  sources: [
    {
      id: 'openai',
      name: 'OpenAI',
      type: 'rss',
      url: 'https://openai.com/news/rss.xml'
    },
    {
      id: 'google',
      name: 'Google AI',
      type: 'rss',
      url: 'https://blog.google/technology/ai/rss/'
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      type: 'scrape',
      url: 'https://www.anthropic.com/news',
      selectors: {
        item: 'article',
        title: 'h3',
        link: 'a',
        summary: 'p',
        date: 'time'
      }
    },
    {
      id: 'cursor',
      name: 'Cursor',
      type: 'scrape',
      url: 'https://www.cursor.com/changelog',
      selectors: {
        item: '.changelog-post, article, [class*="changelog-post"]', // 실제 Cursor changelog 페이지 구조를 매핑하기 위한 유연한 셀렉터
        title: 'h2, h3',
        link: 'a',
        summary: 'p, .content',
        date: 'time, span'
      }
    }
  ]
};
